const request = require('supertest');
const path = require('path');
const app = require('../app');
const uploadMiddleware = require('../src/middlewares/uploadMiddleware');
const { User, SubscriptionPlan } = require('../src/models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Mock Sequelize Models
jest.mock('../src/models', () => {
  const mockUser = {
    findOne: jest.fn(),
    create: jest.fn(),
    findByPk: jest.fn()
  };
  const mockPlan = {
    findOne: jest.fn()
  };
  const mockSetting = {
    findOne: jest.fn().mockResolvedValue({
      site_name: 'Dev Darshan Live',
      logo: '/images/logo-placeholder.png',
      support_email: 'support@devdarshanlive.com',
      support_phone: '+919876543210',
      razorpay_key_id: 'rzp_test_placeholder_key',
      razorpay_secret: 'rzp_test_placeholder_secret',
      free_user_ads_enabled: 1,
      maintenance_mode: 0
    })
  };
  return {
    User: mockUser,
    SubscriptionPlan: mockPlan,
    Setting: mockSetting,
    sequelize: {
      authenticate: jest.fn().mockResolvedValue(),
      sync: jest.fn().mockResolvedValue()
    }
  };
});

describe('User Authentication APIs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should validate empty inputs and return 400', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });

    it('should create user and return JWT token on valid input', async () => {
      SubscriptionPlan.findOne.mockResolvedValue({ id: 1, duration_days: 3650 });
      User.findOne.mockResolvedValue(null); // No existing phone number

      const mockCreatedUser = {
        id: 42,
        full_name: 'Test User',
        phone: '9876543210',
        plan_id: 1,
        status: 'active',
        toJSON: function () {
          return { id: this.id, full_name: this.full_name, phone: this.phone, plan_id: this.plan_id };
        }
      };
      User.create.mockResolvedValue(mockCreatedUser);

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          full_name: 'Test User',
          phone: '9876543210',
          password: 'Password@123',
          confirm_password: 'Password@123'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.phone).toBe('9876543210');
    });

    it('should link an existing user when their mobile number is used as the referral', async () => {
      SubscriptionPlan.findOne.mockResolvedValue({ id: 1, duration_days: 3650 });
      const referrer = { id: 7, phone: '+919876543210' };
      User.findOne
        .mockResolvedValueOnce(null) // registration phone uniqueness validator
        .mockResolvedValueOnce(null) // no referral code match
        .mockResolvedValueOnce(referrer); // normalized mobile match
      const mockCreatedUser = {
        id: 43,
        full_name: 'New User',
        phone: '9000000000',
        toJSON: () => ({ id: 43, full_name: 'New User', phone: '9000000000' })
      };
      User.create.mockResolvedValue(mockCreatedUser);

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          full_name: 'New User',
          phone: '9000000000',
          password: 'Password@123',
          confirm_password: 'Password@123',
          referral_code: '98765 43210'
        });

      expect(res.status).toBe(201);
      expect(User.create).toHaveBeenCalledWith(expect.objectContaining({ referred_by: 7 }));
    });

    it('should reject an unknown referral code or mobile number', async () => {
      SubscriptionPlan.findOne.mockResolvedValue({ id: 1, duration_days: 3650 });
      User.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          full_name: 'New User',
          phone: '9000000000',
          password: 'Password@123',
          confirm_password: 'Password@123',
          referral_code: '9876543210'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/referral code or mobile/i);
      expect(User.create).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/auth/login', () => {
    it('should authenticate user and return token', async () => {
      const hashedPassword = await bcrypt.hash('Password@123', 10);
      const mockDbUser = {
        id: 42,
        full_name: 'Test User',
        phone: '9876543210',
        password: hashedPassword,
        status: 'active',
        save: jest.fn().mockResolvedValue(),
        toJSON: function () {
          return { id: this.id, full_name: this.full_name, phone: this.phone };
        }
      };
      User.findOne.mockResolvedValue(mockDbUser);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          phone: '9876543210',
          password: 'Password@123'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
    });

    it('should reject invalid password', async () => {
      const hashedPassword = await bcrypt.hash('Password@123', 10);
      const mockDbUser = {
        id: 42,
        password: hashedPassword,
        status: 'active'
      };
      User.findOne.mockResolvedValue(mockDbUser);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          phone: '9876543210',
          password: 'WrongPassword'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid credentials');
    });
  });

  describe('GET /admin/login', () => {
    it('should render the admin login page', async () => {
      const res = await request(app)
        .get('/admin/login');

      expect(res.status).toBe(200);
      expect(res.text).toContain('Admin Login');
      expect(res.text).toContain('Sign In');
    });
  });

  describe('Upload middleware', () => {
    it('should save settings uploads to the settings folder', () => {
      const target = uploadMiddleware.resolveUploadDestination('/admin/settings');
      expect(target).toContain(path.join('src', 'public', 'uploads', 'settings'));
    });
  });
});
