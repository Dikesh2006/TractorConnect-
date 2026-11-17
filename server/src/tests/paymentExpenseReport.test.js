const request = require('supertest');
const app = require('../app');
const { setupTestDB } = require('./testDb');
const User = require('../models/User');
const Service = require('../models/Service');
const Tractor = require('../models/Tractor');
const Booking = require('../models/Booking');
const WorkRecord = require('../models/WorkRecord');
const Payment = require('../models/Payment');
const Expense = require('../models/Expense');

setupTestDB();

describe('Payments, Expenses, Dashboard & CSV Reports API', () => {
  let adminToken;
  let customerToken;
  let customerUser;
  let workRecord;

  beforeEach(async () => {
    await Payment.deleteMany({});
    await Expense.deleteMany({});
    await WorkRecord.deleteMany({});
    await Booking.deleteMany({});
    await Tractor.deleteMany({});
    await Service.deleteMany({});
    await User.deleteMany({});

    // Admin
    const admin = new User({
      name: 'Owner Admin',
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

    // Customer
    const custRes = await request(app).post('/api/v1/auth/register').send({
      name: 'Dharmendra Yadav',
      mobile: '9826077777',
      password: 'Password@123',
      village: 'Mandi',
      district: 'Sehore'
    });
    customerToken = custRes.body.data.token;
    customerUser = custRes.body.data.user;

    // Service & Tractor
    const service = new Service({
      name: 'Cultivator (कल्टीवेटर)',
      description: 'Secondary tillage',
      category: 'Land Preparation',
      pricingUnit: 'per_acre',
      currentPrice: 700,
      isActive: true
    });
    await service.save();

    const tractor = new Tractor({
      name: 'Swaraj 744 FE',
      registrationNumber: 'MP-04-CD-5678',
      model: '744 FE',
      horsepower: 48,
      status: 'available',
      isActive: true
    });
    await tractor.save();

    // Booking
    const booking = new Booking({
      customer: customerUser._id,
      service: service._id,
      serviceSnapshot: {
        name: service.name,
        pricingUnit: 'per_acre',
        unitPrice: 700,
        minimumCharge: 500
      },
      estimatedQuantity: 5,
      estimatedCost: 3500,
      requestedDate: new Date(),
      fieldLocation: { village: 'Mandi', district: 'Sehore' },
      status: 'completed'
    });
    await booking.save();

    // Completed WorkRecord: 5 acres @ 700 = ₹3,500 total
    workRecord = new WorkRecord({
      booking: booking._id,
      customer: customerUser._id,
      service: service._id,
      serviceSnapshot: booking.serviceSnapshot,
      tractor: tractor._id,
      fieldLocation: booking.fieldLocation,
      actualQuantity: 5,
      actualAcres: 5,
      workDate: new Date(),
      finalCharge: 3500,
      discount: 0,
      extraCharges: 0,
      totalAmount: 3500,
      amountPaid: 0,
      balanceDue: 3500,
      paymentStatus: 'unpaid'
    });
    await workRecord.save();
  });

  describe('Payments Tracking', () => {
    it('records partial manual cash payment and updates balance due', async () => {
      const res = await request(app)
        .post('/api/v1/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          workRecordId: workRecord._id.toString(),
          amount: 2000,
          method: 'cash',
          notes: 'Received in cash at field'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.workRecord.amountPaid).toBe(2000);
      expect(res.body.data.workRecord.balanceDue).toBe(1500);
      expect(res.body.data.workRecord.paymentStatus).toBe('partially_paid');
    });

    it('rejects overpayment exceeding balance due with 400', async () => {
      const res = await request(app)
        .post('/api/v1/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          workRecordId: workRecord._id.toString(),
          amount: 4000 // exceeds ₹3,500 balance due
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('exceeds the remaining balance due');
    });

    it('voiding a payment recalculates work record balances accurately', async () => {
      // 1. Pay ₹2000
      const payRes = await request(app)
        .post('/api/v1/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          workRecordId: workRecord._id.toString(),
          amount: 2000,
          method: 'upi',
          upiTransactionId: 'UPI123456789'
        });
      const paymentId = payRes.body.data.payment._id;

      // 2. Void the payment
      const voidRes = await request(app)
        .patch(`/api/v1/payments/${paymentId}/void`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ voidReason: 'Customer entered wrong UPI transaction ID; cash collected instead' });

      expect(voidRes.status).toBe(200);
      expect(voidRes.body.data.payment.status).toBe('void');
      expect(voidRes.body.data.workRecord.amountPaid).toBe(0);
      expect(voidRes.body.data.workRecord.balanceDue).toBe(3500);
      expect(voidRes.body.data.workRecord.paymentStatus).toBe('unpaid');
    });

    it('allows customer to view their dues summary', async () => {
      const res = await request(app)
        .get('/api/v1/payments/dues/my')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.dues.totalBilled).toBe(3500);
      expect(res.body.data.dues.totalDue).toBe(3500);
    });
  });

  describe('Expenses & Dashboard Analytics', () => {
    it('creates expense and supports soft delete', async () => {
      const createRes = await request(app)
        .post('/api/v1/expenses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          category: 'diesel',
          amount: 1800,
          description: '20 Liters Diesel for Mahindra tractor',
          paymentMethod: 'upi'
        });

      expect(createRes.status).toBe(201);
      const expId = createRes.body.data.expense._id;

      // Soft delete
      const delRes = await request(app)
        .delete(`/api/v1/expenses/${expId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(delRes.status).toBe(200);

      // Verify excluded from list
      const listRes = await request(app)
        .get('/api/v1/expenses')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(listRes.body.data.expenses.some((e) => e._id === expId)).toBe(false);
    });

    it('calculates dashboard metrics including net profit correctly', async () => {
      // Record payment ₹3,500
      await request(app)
        .post('/api/v1/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          workRecordId: workRecord._id.toString(),
          amount: 3500,
          method: 'cash'
        });

      // Record expense ₹1,000
      await request(app)
        .post('/api/v1/expenses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          category: 'diesel',
          amount: 1000,
          description: 'Diesel purchase'
        });

      const dashRes = await request(app)
        .get('/api/v1/reports/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(dashRes.status).toBe(200);
      const { kpis } = dashRes.body.data;
      expect(kpis.totalRevenue).toBe(3500);
      expect(kpis.totalExpenses).toBe(1000);
      expect(kpis.netProfit).toBe(2500); // 3500 - 1000
      expect(kpis.completedAcres).toBe(5);
    });

    it('exports CSV report with UTF-8 BOM and formula injection protection', async () => {
      const csvRes = await request(app)
        .get('/api/v1/reports/export/customers')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(csvRes.status).toBe(200);
      expect(csvRes.headers['content-type']).toContain('text/csv');
      // Starts with UTF-8 BOM '\uFEFF'
      expect(csvRes.text.startsWith('\uFEFF')).toBe(true);
      expect(csvRes.text).toContain('Dharmendra Yadav');
      expect(csvRes.text).toContain('Mandi');
    });
  });
});

