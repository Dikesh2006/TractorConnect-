const request = require('supertest');
const app = require('../app');
const { setupTestDB } = require('./testDb');
const User = require('../models/User');
const Service = require('../models/Service');
const Tractor = require('../models/Tractor');
const Booking = require('../models/Booking');
const WorkRecord = require('../models/WorkRecord');
const Payment = require('../models/Payment');

setupTestDB();

describe('Multi-Tractor-Owner Marketplace System', () => {
  let adminToken;
  let adminUser;
  let ownerAId, ownerAToken;
  let ownerBId, ownerBToken;
  let pendingOwnerId, pendingOwnerToken;
  let farmerId, farmerToken;
  let serviceAId, serviceBId;
  let tractorAId;

  beforeAll(async () => {
    // Clear collections
    await User.deleteMany({});
    await Service.deleteMany({});
    await Tractor.deleteMany({});
    await Booking.deleteMany({});
    await WorkRecord.deleteMany({});
    await Payment.deleteMany({});

    // 1. Create Platform Admin
    adminUser = new User({
      name: 'Platform Admin',
      mobile: '9876543210',
      passwordHash: 'Admin@Tractor2025',
      role: 'admin',
      isActive: true
    });
    await adminUser.save();

    const adminLogin = await request(app).post('/api/v1/auth/login').send({
      mobile: '9876543210',
      password: 'Admin@Tractor2025'
    });
    adminToken = adminLogin.body.data.token;
  });

  describe('1. Separate Farmer and Owner Registration & Login', () => {
    it('registers a Farmer (Customer) successfully', async () => {
      const res = await request(app).post('/api/v1/auth/farmer/register').send({
        name: 'Kisan Ramesh Patel',
        mobile: '9826011111',
        password: 'Password@123',
        village: 'Bilkisganj',
        district: 'Sehore',
        state: 'Madhya Pradesh',
        address: 'Farm Sector 4'
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('customer');
      expect(res.body.data.user.village).toBe('Bilkisganj');
      expect(res.body.data).toHaveProperty('token');
      farmerId = res.body.data.user._id;
      farmerToken = res.body.data.token;
    });

    it('registers a Tractor Owner with pending status', async () => {
      const res = await request(app).post('/api/v1/auth/owner/register').send({
        name: 'Patidar Krishi Seva',
        mobile: '9826022222',
        password: 'Password@123',
        businessName: 'Patidar Agro Services',
        serviceRadiusKm: 25,
        village: 'Bilkisganj',
        district: 'Sehore',
        state: 'Madhya Pradesh',
        latitude: 22.955,
        longitude: 76.955,
        serviceDescription: 'Tractor rental, rotavator, ploughing and harvester.'
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('owner');
      expect(res.body.data.user.businessName).toBe('Patidar Agro Services');
      expect(res.body.data.user.approvalStatus).toBe('pending');
      expect(res.body.data.user.isApproved).toBe(false);
      expect(res.body.data.user.serviceRadiusKm).toBe(25);
      pendingOwnerId = res.body.data.user._id;
      pendingOwnerToken = res.body.data.token;
      ownerAId = pendingOwnerId;
      ownerAToken = pendingOwnerToken;
    });

    it('registers a second Tractor Owner', async () => {
      const res = await request(app).post('/api/v1/auth/owner/register').send({
        name: 'Mewada Agro',
        mobile: '9826033333',
        password: 'Password@123',
        businessName: 'Mewada Tractor Solutions',
        serviceRadiusKm: 30,
        village: 'Ichhawar',
        district: 'Sehore',
        state: 'Madhya Pradesh',
        latitude: 22.802,
        longitude: 77.015,
        serviceDescription: 'Modern multi-implement tractor fleet.'
      });

      expect(res.status).toBe(201);
      ownerBId = res.body.data.user._id;
      ownerBToken = res.body.data.token;
    });

    it('allows registered Farmer and Owner to login with mobile and password', async () => {
      const farmerLogin = await request(app).post('/api/v1/auth/login').send({
        mobile: '9826011111',
        password: 'Password@123'
      });
      expect(farmerLogin.status).toBe(200);
      expect(farmerLogin.body.data.user.role).toBe('customer');

      const ownerLogin = await request(app).post('/api/v1/auth/login').send({
        mobile: '9826022222',
        password: 'Password@123'
      });
      expect(ownerLogin.status).toBe(200);
      expect(ownerLogin.body.data.user.role).toBe('owner');
      expect(ownerLogin.body.data.user.approvalStatus).toBe('pending');
    });
  });

  describe('2. Platform Admin Approval Workflow', () => {
    it('allows Admin to view all registered owners', async () => {
      const res = await request(app)
        .get('/api/v1/auth/owners')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.owners.length).toBeGreaterThanOrEqual(2);
    });

    it('allows Admin to approve pending tractor owners', async () => {
      // Approve Owner A
      const approveA = await request(app)
        .patch(`/api/v1/auth/owners/${ownerAId}/approval`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ approvalStatus: 'approved' });

      expect(approveA.status).toBe(200);
      expect(approveA.body.data.owner.approvalStatus).toBe('approved');
      expect(approveA.body.data.owner.isApproved).toBe(true);

      // Approve Owner B
      const approveB = await request(app)
        .patch(`/api/v1/auth/owners/${ownerBId}/approval`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ approvalStatus: 'approved' });

      expect(approveB.status).toBe(200);
      expect(approveB.body.data.owner.approvalStatus).toBe('approved');
      expect(approveB.body.data.owner.isApproved).toBe(true);
    });

    it('blocks unapproved owners from public booking or services discovery', async () => {
      // Register an unapproved Owner C
      const res = await request(app).post('/api/v1/auth/owner/register').send({
        name: 'Sharma Agro',
        mobile: '9826044444',
        password: 'Password@123',
        businessName: 'Sharma Farm Equipments',
        serviceRadiusKm: 20,
        village: 'Ashta',
        district: 'Sehore',
        latitude: 22.955,
        longitude: 76.955
      });
      const unapprovedOwnerId = res.body.data.user._id;

      // Farmer discovers nearby owners - unapproved owner must NOT appear
      const discRes = await request(app)
        .get('/api/v1/discovery/nearby-owners')
        .query({ lat: 22.955, lng: 76.955 });

      expect(discRes.status).toBe(200);
      const ids = discRes.body.data.owners.map((o) => o._id || o.id);
      expect(ids).not.toContain(unapprovedOwnerId);
    });
  });

  describe('3. Owner-Specific Independent Services & Pricing', () => {
    it('allows Owner A to create Ploughing at ₹850/acre', async () => {
      const res = await request(app)
        .post('/api/v1/services')
        .set('Authorization', `Bearer ${ownerAToken}`)
        .send({
          name: 'Deep Ploughing (गहरी जुताई)',
          description: 'Deep ploughing with double disc plough for soil aeration',
          category: 'Land Preparation',
          pricingUnit: 'per_acre',
          currentPrice: 850,
          minimumCharge: 500
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.service.currentPrice).toBe(850);
      expect(res.body.data.service.owner).toBe(ownerAId);
      serviceAId = res.body.data.service._id;
    });

    it('allows Owner B to create SAME service name with different price ₹900/acre without conflict', async () => {
      const res = await request(app)
        .post('/api/v1/services')
        .set('Authorization', `Bearer ${ownerBToken}`)
        .send({
          name: 'Deep Ploughing (गहरी जुताई)',
          description: 'Deep ploughing heavy MB plough',
          category: 'Land Preparation',
          pricingUnit: 'per_acre',
          currentPrice: 900,
          minimumCharge: 600
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.service.currentPrice).toBe(900);
      expect(res.body.data.service.owner).toBe(ownerBId);
      serviceBId = res.body.data.service._id;
    });

    it('prevents Owner B from updating or deleting Owner A service (403 Forbidden)', async () => {
      const updateRes = await request(app)
        .put(`/api/v1/services/${serviceAId}`)
        .set('Authorization', `Bearer ${ownerBToken}`)
        .send({
          currentPrice: 700,
          priceChangeNote: 'Malicious update attempt'
        });

      expect(updateRes.status).toBe(403);
      expect(updateRes.body.success).toBe(false);

      const deleteRes = await request(app)
        .delete(`/api/v1/services/${serviceAId}`)
        .set('Authorization', `Bearer ${ownerBToken}`);

      expect(deleteRes.status).toBe(403);
    });
  });

  describe('4. Farmer Nearby Tractor Owner Discovery & Comparison', () => {
    it('discovers approved nearby tractor owners within their service radius', async () => {
      // Farmer location near Bilkisganj (22.956, 76.956)
      const res = await request(app)
        .get('/api/v1/discovery/nearby-owners')
        .query({
          latitude: 22.956,
          longitude: 76.956,
          sortBy: 'distance'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.owners.length).toBeGreaterThanOrEqual(1);

      const firstOwner = res.body.data.owners[0];
      expect(firstOwner.businessName).toBe('Patidar Agro Services');
      expect(firstOwner.distanceKm).toBeLessThanOrEqual(5);
      expect(firstOwner.services.length).toBeGreaterThanOrEqual(1);
      expect(firstOwner.services[0].name).toBe('Deep Ploughing (गहरी जुताई)');
      expect(firstOwner.services[0].currentPrice).toBe(850);
    });

    it('returns detailed public profile for a selected tractor owner', async () => {
      const res = await request(app).get(`/api/v1/discovery/owners/${ownerAId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.businessName).toBe('Patidar Agro Services');
      expect(res.body.data.services.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('5. Booking Routing to Selected Owner & Immutable Snapshot', () => {
    let bookingId;

    it('routes booking directly to selected tractor owner with immutable snapshot', async () => {
      const res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({
          serviceId: serviceAId,
          ownerId: ownerAId,
          requestedDate: '2026-11-15',
          requestedTimeSlot: 'morning',
          estimatedQuantity: 5,
          fieldLocation: {
            village: 'Bilkisganj',
            district: 'Sehore',
            landmark: 'Near Canal Gate',
            latitude: 22.956,
            longitude: 76.956
          },
          customerNotes: 'Bring disc plough'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.booking.tractorOwner._id).toBe(ownerAId);
      expect(res.body.data.booking.serviceSnapshot.name).toBe('Deep Ploughing (गहरी जुताई)');
      expect(res.body.data.booking.serviceSnapshot.unitPrice).toBe(850);
      expect(res.body.data.booking.serviceSnapshot.pricingUnit).toBe('per_acre');
      expect(res.body.data.booking.estimatedCost).toBe(4250); // 5 acres * 850
      bookingId = res.body.data.booking._id;
    });

    it('allows Owner A to see this booking in their owner bookings dashboard', async () => {
      const res = await request(app)
        .get('/api/v1/bookings')
        .set('Authorization', `Bearer ${ownerAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const bIds = res.body.data.bookings.map((b) => b._id.toString());
      expect(bIds).toContain(bookingId.toString());
    });

    it('prevents Owner B from viewing or accepting Owner A booking (Data Isolation)', async () => {
      // Owner B bookings list does NOT contain Owner A booking
      const listRes = await request(app)
        .get('/api/v1/bookings')
        .set('Authorization', `Bearer ${ownerBToken}`);

      expect(listRes.status).toBe(200);
      const bIds = listRes.body.data.bookings.map((b) => b._id.toString());
      expect(bIds).not.toContain(bookingId.toString());

      // Owner B trying to accept Owner A booking gets 403 Forbidden
      const acceptRes = await request(app)
        .patch(`/api/v1/bookings/${bookingId}/accept`)
        .set('Authorization', `Bearer ${ownerBToken}`);

      expect(acceptRes.status).toBe(403);
    });

    it('allows Owner A to add a tractor and schedule the booking', async () => {
      // Add tractor for Owner A
      const tracRes = await request(app)
        .post('/api/v1/tractors')
        .set('Authorization', `Bearer ${ownerAToken}`)
        .send({
          name: 'Mahindra 575 DI (लाल ट्रैक्टर)',
          registrationNumber: 'MP-04-TC-8899',
          model: '575 DI',
          horsepower: 45,
          currentOperatorName: 'Mukesh Yadav'
        });

      expect(tracRes.status).toBe(201);
      expect(tracRes.body.data.tractor.owner).toBe(ownerAId);
      tractorAId = tracRes.body.data.tractor._id;

      // Accept booking
      const acceptRes = await request(app)
        .patch(`/api/v1/bookings/${bookingId}/accept`)
        .set('Authorization', `Bearer ${ownerAToken}`);
      expect(acceptRes.status).toBe(200);
      expect(acceptRes.body.data.booking.status).toBe('accepted');

      // Schedule booking
      const schedRes = await request(app)
        .patch(`/api/v1/bookings/${bookingId}/schedule`)
        .set('Authorization', `Bearer ${ownerAToken}`)
        .send({
          tractorId: tractorAId,
          scheduledStart: '2026-11-15T08:00:00.000Z',
          scheduledEnd: '2026-11-15T12:00:00.000Z',
          operatorName: 'Mukesh Yadav'
        });

      expect(schedRes.status).toBe(200);
      expect(schedRes.body.data.booking.status).toBe('scheduled');
      expect(schedRes.body.data.booking.assignedTractor._id).toBe(tractorAId);
    });

    it('prevents double-booking / tractor conflict on overlapping date and slot', async () => {
      // Create a second booking for Owner A on same date & slot
      const book2 = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({
          serviceId: serviceAId,
          ownerId: ownerAId,
          requestedDate: '2026-11-15',
          requestedTimeSlot: 'morning',
          estimatedQuantity: 3,
          fieldLocation: { village: 'Bilkisganj', district: 'Sehore' }
        });

      expect(book2.status).toBe(201);
      const book2Id = book2.body.data.booking._id;

      // Accept book2
      await request(app)
        .patch(`/api/v1/bookings/${book2Id}/accept`)
        .set('Authorization', `Bearer ${ownerAToken}`);

      // Try scheduling book2 with the same tractor at the same date & time slot -> 400 Conflict
      const conflictRes = await request(app)
        .patch(`/api/v1/bookings/${book2Id}/schedule`)
        .set('Authorization', `Bearer ${ownerAToken}`)
        .send({
          tractorId: tractorAId,
          scheduledStart: '2026-11-15T09:00:00.000Z',
          scheduledEnd: '2026-11-15T13:00:00.000Z'
        });

      expect(conflictRes.status).toBe(400);
      expect(conflictRes.body.success).toBe(false);
      expect(conflictRes.body.message).toContain('Cannot schedule tractor');
    });

    it('prevents Owner B from assigning Owner A tractor to their booking', async () => {
      // Owner B creates a tractor
      const tracBRes = await request(app)
        .post('/api/v1/tractors')
        .set('Authorization', `Bearer ${ownerBToken}`)
        .send({
          name: 'Sonalika DI 745 (नीला ट्रैक्टर)',
          registrationNumber: 'MP-04-MB-1122',
          model: 'DI 745',
          horsepower: 50
        });
      expect(tracBRes.status).toBe(201);

      // Create a booking for Owner B
      const bookBRes = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({
          serviceId: serviceBId,
          ownerId: ownerBId,
          requestedDate: '2026-11-18',
          requestedTimeSlot: 'evening',
          estimatedQuantity: 4,
          fieldLocation: { village: 'Ichhawar', district: 'Sehore' }
        });
      expect(bookBRes.status).toBe(201);
      const bookingBId = bookBRes.body.data.booking._id;

      await request(app)
        .patch(`/api/v1/bookings/${bookingBId}/accept`)
        .set('Authorization', `Bearer ${ownerBToken}`);

      // Owner B tries to assign tractorAId (owned by Owner A)
      const invalidAssign = await request(app)
        .patch(`/api/v1/bookings/${bookingBId}/schedule`)
        .set('Authorization', `Bearer ${ownerBToken}`)
        .send({
          tractorId: tractorAId,
          scheduledStart: '2026-11-18T14:00:00.000Z',
          scheduledEnd: '2026-11-18T18:00:00.000Z'
        });

      expect(invalidAssign.status).toBe(400);
      expect(invalidAssign.body.message).toContain('Tractor belongs to another owner');
    });
  });
});
