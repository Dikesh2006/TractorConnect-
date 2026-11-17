const request = require('supertest');
const app = require('../app');
const { setupTestDB } = require('./testDb');
const User = require('../models/User');

setupTestDB();

beforeEach(async () => {
  await User.deleteMany({});
});

describe('Auth API (/api/v1/auth)', () => {
  const sampleCustomer = {
    name: 'Ramesh Patel',
    mobile: '9826012345',
    password: 'Password@123',
    email: 'ramesh.patel@example.com',
    village: 'Bilkisganj',
    district: 'Sehore',
    state: 'Madhya Pradesh',
    address: 'Near Gram Panchayat Bhawan'
  };

  describe('POST /api/v1/auth/register', () => {
    it('should register a new customer successfully with 201', async () => {
      const res = await request(app).post('/api/v1/auth/register').send(sampleCustomer);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user.name).toBe(sampleCustomer.name);
      expect(res.body.data.user.mobile).toBe('9826012345');
      expect(res.body.data.user.role).toBe('customer');
      expect(res.body.data.user).not.toHaveProperty('passwordHash');
    });

    it('should reject duplicate mobile registration with 409', async () => {
      await request(app).post('/api/v1/auth/register').send(sampleCustomer);
      const res = await request(app).post('/api/v1/auth/register').send(sampleCustomer);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already registered');
    });

    it('should reject invalid Indian mobile number with 400', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...sampleCustomer, mobile: '5123456789' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject short password (< 6 chars) with 400', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ ...sampleCustomer, password: '123' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/v1/auth/register').send(sampleCustomer);
    });

    it('should login successfully with valid mobile and password', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        mobile: '9826012345',
        password: 'Password@123'
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user.mobile).toBe('9826012345');
    });

    it('should reject login with wrong password using generic 401 message', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        mobile: '9826012345',
        password: 'WrongPassword'
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid mobile number or password');
    });

    it('should reject login with non-existent mobile with 401 generic message', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        mobile: '9999999999',
        password: 'Password@123'
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid mobile number or password');
    });
  });

  describe('Protected Routes: /me, /profile, /change-password', () => {
    let token;
    let userId;

    beforeEach(async () => {
      const registerRes = await request(app).post('/api/v1/auth/register').send(sampleCustomer);
      token = registerRes.body.data.token;
      userId = registerRes.body.data.user._id;
    });

    it('should return current user on GET /api/v1/auth/me with Bearer token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.mobile).toBe('9826012345');
    });

    it('should reject GET /api/v1/auth/me without token with 401', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject GET /api/v1/auth/me with malformed token with 401', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid.token.value');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should update profile on PUT /api/v1/auth/profile', async () => {
      const res = await request(app)
        .put('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          village: 'Shyampur',
          address: 'Main Road Ward 4'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.user.village).toBe('Shyampur');
      expect(res.body.data.user.address).toBe('Main Road Ward 4');
    });

    it('should change password on PUT /api/v1/auth/change-password', async () => {
      const res = await request(app)
        .put('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'Password@123',
          newPassword: 'NewPassword@456'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify login with new password works
      const loginRes = await request(app).post('/api/v1/auth/login').send({
        mobile: '9826012345',
        password: 'NewPassword@456'
      });
      expect(loginRes.status).toBe(200);
    });
  });

  describe('Role Authorization: Admin endpoints', () => {
    let customerToken;
    let adminToken;

    beforeEach(async () => {
      // Create customer
      const custRes = await request(app).post('/api/v1/auth/register').send(sampleCustomer);
      customerToken = custRes.body.data.token;

      // Seed initial admin directly in DB
      const adminUser = new User({
        name: 'Master Admin',
        mobile: '9876543210',
        passwordHash: 'Admin@Pass123',
        role: 'admin',
        isActive: true
      });
      await adminUser.save();

      const adminLoginRes = await request(app).post('/api/v1/auth/login').send({
        mobile: '9876543210',
        password: 'Admin@Pass123'
      });
      adminToken = adminLoginRes.body.data.token;
    });

    it('should block customer from calling /create-admin with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/v1/auth/create-admin')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          name: 'Hacker Admin',
          mobile: '9893012345',
          password: 'Password@123'
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Access denied');
    });

    it('should allow admin to create another admin with 201', async () => {
      const res = await request(app)
        .post('/api/v1/auth/create-admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Supervisor Admin',
          mobile: '9893012345',
          password: 'Password@123'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.admin.role).toBe('admin');
      expect(res.body.data.admin.name).toBe('Supervisor Admin');
    });
  });
});
