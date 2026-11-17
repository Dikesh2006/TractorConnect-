const request = require('supertest');
const app = require('../app');
const { setupTestDB } = require('./testDb');
const User = require('../models/User');
const Service = require('../models/Service');
const ServicePriceHistory = require('../models/ServicePriceHistory');

setupTestDB();

describe('Services & Dynamic Pricing API (/api/v1/services)', () => {
  let adminToken;
  let customerToken;
  let adminUser;

  beforeEach(async () => {
    await Service.deleteMany({});
    await ServicePriceHistory.deleteMany({});
    await User.deleteMany({});

    // Create Admin
    adminUser = new User({
      name: 'Farm Admin',
      mobile: '9876543210',
      passwordHash: 'Admin@Pass123',
      role: 'admin',
      isActive: true
    });
    await adminUser.save();

    const adminLogin = await request(app).post('/api/v1/auth/login').send({
      mobile: '9876543210',
      password: 'Admin@Pass123'
    });
    adminToken = adminLogin.body.data.token;

    // Create Customer
    const custRes = await request(app).post('/api/v1/auth/register').send({
      name: 'Kisan Ramesh',
      mobile: '9826012345',
      password: 'Password@123',
      village: 'Bilkisganj',
      district: 'Sehore'
    });
    customerToken = custRes.body.data.token;
  });

  it('allows Admin to create a service and auto-records initial price history', async () => {
    const res = await request(app)
      .post('/api/v1/services')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Ploughing (जुताई)',
        description: 'Deep ploughing with double disc plough for soil aeration',
        category: 'Land Preparation',
        pricingUnit: 'per_acre',
        currentPrice: 850,
        minimumCharge: 500,
        priceChangeNote: 'Season opening price'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.service.name).toBe('Ploughing (जुताई)');
    expect(res.body.data.service.slug).toMatch(/^ploughing/);
    expect(res.body.data.service.currentPrice).toBe(850);

    // Verify initial price history was created
    const history = await ServicePriceHistory.find({ service: res.body.data.service._id });
    expect(history.length).toBe(1);
    expect(history[0].price).toBe(850);
    expect(history[0].pricingUnit).toBe('per_acre');
    expect(history[0].note).toBe('Season opening price');
  });

  it('blocks Customer from creating a service with 403 Forbidden', async () => {
    const res = await request(app)
      .post('/api/v1/services')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        name: 'Rotavator',
        description: 'Fine seed bed preparation',
        category: 'Land Preparation',
        pricingUnit: 'per_acre',
        currentPrice: 900
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('records a new ServicePriceHistory entry when Admin updates the price', async () => {
    // Create initial service
    const createRes = await request(app)
      .post('/api/v1/services')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Rotavator Service',
        description: 'Fine seed bed preparation',
        category: 'Land Preparation',
        pricingUnit: 'per_acre',
        currentPrice: 900
      });
    const serviceId = createRes.body.data.service._id;

    // Update price to 950
    const updateRes = await request(app)
      .put(`/api/v1/services/${serviceId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        currentPrice: 950,
        priceChangeNote: 'Diesel rate increased by ₹5/L'
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.service.currentPrice).toBe(950);

    // Check price history has 2 entries
    const historyRes = await request(app)
      .get(`/api/v1/services/${serviceId}/price-history`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(historyRes.status).toBe(200);
    expect(historyRes.body.data.history.length).toBe(2);
    expect(historyRes.body.data.history[0].price).toBe(950); // newest first
    expect(historyRes.body.data.history[0].note).toBe('Diesel rate increased by ₹5/L');
    expect(historyRes.body.data.history[1].price).toBe(900); // initial
  });

  it('does NOT create a new price history entry when only non-price fields are updated', async () => {
    const createRes = await request(app)
      .post('/api/v1/services')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Seed Drilling',
        description: 'Wheat sowing service',
        category: 'Sowing',
        pricingUnit: 'per_acre',
        currentPrice: 800
      });
    const serviceId = createRes.body.data.service._id;

    // Update only description
    await request(app)
      .put(`/api/v1/services/${serviceId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        description: 'Modern seed and fertilizer drilling with depth control'
      });

    const history = await ServicePriceHistory.find({ service: serviceId });
    expect(history.length).toBe(1); // Still only 1 initial entry
  });

  it('hides deactivated service from public GET /api/v1/services', async () => {
    const createRes = await request(app)
      .post('/api/v1/services')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Winter Wheat Harvesting',
        description: 'Special seasonal service',
        category: 'Harvesting',
        pricingUnit: 'per_acre',
        currentPrice: 1500
      });
    const serviceId = createRes.body.data.service._id;

    // Verify it is in public list
    let publicRes = await request(app).get('/api/v1/services');
    expect(publicRes.body.data.services.some((s) => s._id === serviceId)).toBe(true);

    // Deactivate it
    await request(app)
      .patch(`/api/v1/services/${serviceId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false });

    // Verify it disappears from public list
    publicRes = await request(app).get('/api/v1/services');
    expect(publicRes.body.data.services.some((s) => s._id === serviceId)).toBe(false);

    // But remains visible in admin all list
    const adminAllRes = await request(app)
      .get('/api/v1/services/admin/all')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(adminAllRes.body.data.services.some((s) => s._id === serviceId)).toBe(true);
  });
});

