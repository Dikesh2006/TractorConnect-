const request = require('supertest');
const app = require('../app');
const { setupTestDB } = require('./testDb');
const User = require('../models/User');
const Service = require('../models/Service');
const Tractor = require('../models/Tractor');
const Booking = require('../models/Booking');
const WorkRecord = require('../models/WorkRecord');

setupTestDB();

describe('Booking Lifecycle, Pricing Snapshot & Tractor Scheduling', () => {
  let adminToken;
  let customerToken;
  let customerUser;
  let service;
  let tractor;

  beforeEach(async () => {
    await Booking.deleteMany({});
    await WorkRecord.deleteMany({});
    await Tractor.deleteMany({});
    await Service.deleteMany({});
    await User.deleteMany({});

    // Create Admin
    const admin = new User({
      name: 'Admin Ramesh',
      mobile: '9876543210',
      passwordHash: 'Admin@123',
      role: 'admin',
      isActive: true
    });
    await admin.save();
    const adminLogin = await request(app).post('/api/v1/auth/login').send({
      mobile: '9876543210',
      password: 'Admin@123'
    });
    adminToken = adminLogin.body.data.token;

    // Create Customer
    const custRes = await request(app).post('/api/v1/auth/register').send({
      name: 'Suresh Patel',
      mobile: '9826055555',
      password: 'Password@123',
      village: 'Bilkisganj',
      district: 'Sehore'
    });
    customerToken = custRes.body.data.token;
    customerUser = custRes.body.data.user;

    // Create Service: Rotavator at ₹900/acre
    service = new Service({
      name: 'Rotavator Service',
      description: 'Seedbed preparation',
      category: 'Land Preparation',
      pricingUnit: 'per_acre',
      currentPrice: 900,
      minimumCharge: 500,
      isActive: true
    });
    await service.save();

    // Create Tractor: Mahindra 575 DI
    tractor = new Tractor({
      name: 'Mahindra 575 DI',
      registrationNumber: 'MP-04-AB-1234',
      model: '575 DI XP Plus',
      horsepower: 47,
      status: 'available',
      isActive: true
    });
    await tractor.save();
  });

  it('creates booking with immutable pricing snapshot', async () => {
    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        serviceId: service._id.toString(),
        estimatedQuantity: 5, // 5 acres
        requestedDate: '2026-11-10',
        requestedTimeSlot: 'morning',
        fieldLocation: {
          village: 'Bilkisganj',
          district: 'Sehore',
          state: 'Madhya Pradesh',
          latitude: 23.1234,
          longitude: 77.1234
        }
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    const booking = res.body.data.booking;
    expect(booking.status).toBe('pending');
    expect(booking.estimatedQuantity).toBe(5);
    expect(booking.estimatedCost).toBe(4500); // 5 * 900
    expect(booking.serviceSnapshot.unitPrice).toBe(900);
    expect(booking.serviceSnapshot.pricingUnit).toBe('per_acre');
  });

  it('proves PRICE SNAPSHOT IMMUTABILITY: changing live service price never changes existing booking', async () => {
    // 1. Create booking at ₹900/acre
    const createRes = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        serviceId: service._id.toString(),
        estimatedQuantity: 4,
        requestedDate: '2026-11-12',
        fieldLocation: { village: 'Bilkisganj', district: 'Sehore' }
      });
    const bookingId = createRes.body.data.booking._id;

    // 2. Admin increases live service price to ₹1,200/acre
    await request(app)
      .put(`/api/v1/services/${service._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ currentPrice: 1200 });

    // 3. Inspect the booking again -> snapshot MUST still be ₹900
    const checkRes = await request(app)
      .get(`/api/v1/bookings/my/${bookingId}`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(checkRes.status).toBe(200);
    expect(checkRes.body.data.booking.serviceSnapshot.unitPrice).toBe(900);
    expect(checkRes.body.data.booking.estimatedCost).toBe(3600); // 4 * 900
  });

  it('enforces valid status lifecycle and rejects invalid transitions with 400', async () => {
    const createRes = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        serviceId: service._id.toString(),
        estimatedQuantity: 3,
        requestedDate: '2026-11-15',
        fieldLocation: { village: 'Bilkisganj', district: 'Sehore' }
      });
    const bookingId = createRes.body.data.booking._id;

    // Invalid transition: pending directly to in_progress (must be accepted and scheduled first)
    const invalidRes = await request(app)
      .patch(`/api/v1/bookings/admin/${bookingId}/start`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(invalidRes.status).toBe(400);
    expect(invalidRes.body.message).toContain('Invalid booking status transition');

    // Valid transition: pending -> accepted
    const acceptRes = await request(app)
      .patch(`/api/v1/bookings/admin/${bookingId}/accept`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ adminNotes: 'Confirmed with farmer via call' });

    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body.data.booking.status).toBe('accepted');
  });

  it('detects and blocks overlapping tractor schedule conflicts', async () => {
    // 1. Create and accept Booking A
    const resA = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        serviceId: service._id.toString(),
        estimatedQuantity: 5,
        requestedDate: '2026-11-20',
        fieldLocation: { village: 'Bilkisganj', district: 'Sehore' }
      });
    const bookingAId = resA.body.data.booking._id;
    await request(app).patch(`/api/v1/bookings/admin/${bookingAId}/accept`).set('Authorization', `Bearer ${adminToken}`);

    // Schedule Booking A: 2026-11-20 from 08:00 to 12:00
    await request(app)
      .patch(`/api/v1/bookings/admin/${bookingAId}/schedule`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        tractorId: tractor._id.toString(),
        scheduledStart: '2026-11-20T08:00:00.000Z',
        scheduledEnd: '2026-11-20T12:00:00.000Z',
        operatorName: 'Kamal'
      });

    // 2. Create and accept Booking B
    const resB = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        serviceId: service._id.toString(),
        estimatedQuantity: 3,
        requestedDate: '2026-11-20',
        fieldLocation: { village: 'Bilkisganj', district: 'Sehore' }
      });
    const bookingBId = resB.body.data.booking._id;
    await request(app).patch(`/api/v1/bookings/admin/${bookingBId}/accept`).set('Authorization', `Bearer ${adminToken}`);

    // 3. Attempt to schedule Booking B overlapping: 2026-11-20 from 10:00 to 14:00 on SAME tractor
    const conflictRes = await request(app)
      .patch(`/api/v1/bookings/admin/${bookingBId}/schedule`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        tractorId: tractor._id.toString(),
        scheduledStart: '2026-11-20T10:00:00.000Z',
        scheduledEnd: '2026-11-20T14:00:00.000Z'
      });

    expect(conflictRes.status).toBe(400);
    expect(conflictRes.body.message).toContain('overlapping booking');

    // 4. Scheduling Booking B in non-overlapping slot: 2026-11-20 from 13:00 to 17:00 succeeds
    const nonConflictRes = await request(app)
      .patch(`/api/v1/bookings/admin/${bookingBId}/schedule`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        tractorId: tractor._id.toString(),
        scheduledStart: '2026-11-20T13:00:00.000Z',
        scheduledEnd: '2026-11-20T17:00:00.000Z'
      });

    expect(nonConflictRes.status).toBe(200);
    expect(nonConflictRes.body.data.booking.status).toBe('scheduled');
  });

  it('completes work, generates WorkRecord with calculated finalCharge, and frees tractor', async () => {
    // 1. Create, accept, schedule, and start booking
    const bookRes = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        serviceId: service._id.toString(),
        estimatedQuantity: 4,
        requestedDate: '2026-11-22',
        fieldLocation: { village: 'Bilkisganj', district: 'Sehore' }
      });
    const bId = bookRes.body.data.booking._id;

    await request(app).patch(`/api/v1/bookings/admin/${bId}/accept`).set('Authorization', `Bearer ${adminToken}`);

    await request(app)
      .patch(`/api/v1/bookings/admin/${bId}/schedule`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        tractorId: tractor._id.toString(),
        scheduledStart: '2026-11-22T08:00:00.000Z',
        scheduledEnd: '2026-11-22T12:00:00.000Z'
      });

    await request(app).patch(`/api/v1/bookings/admin/${bId}/start`).set('Authorization', `Bearer ${adminToken}`);

    // Verify tractor is 'in_use'
    let t = await Tractor.findById(tractor._id);
    expect(t.status).toBe('in_use');

    // 2. Complete work: Actual 4.5 acres, discount ₹150, extra charges ₹100
    const completeRes = await request(app)
      .post(`/api/v1/work-records/complete/${bId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        actualQuantity: 4.5,
        workingHours: 3.5,
        dieselUsedLiters: 18,
        discount: 150,
        discountReason: 'Loyal customer discount',
        extraCharges: 100,
        extraChargesReason: 'Rough terrain preparation'
      });

    expect(completeRes.status).toBe(201);
    const wr = completeRes.body.data.workRecord;

    // Unit price was 900. Final charge = 4.5 * 900 = 4050. Total = 4050 - 150 + 100 = 4000
    expect(wr.finalCharge).toBe(4050);
    expect(wr.totalAmount).toBe(4000);
    expect(wr.balanceDue).toBe(4000);
    expect(wr.actualAcres).toBe(4.5);
    expect(wr.paymentStatus).toBe('unpaid');

    // 3. Verify tractor is freed back to 'available'
    t = await Tractor.findById(tractor._id);
    expect(t.status).toBe('available');

    // 4. Verify booking is now 'completed'
    const b = await Booking.findById(bId);
    expect(b.status).toBe('completed');
  });
});

