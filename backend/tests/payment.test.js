const request = require('supertest');
const app = require('../app');
const { User, SubscriptionPlan, Subscription, Payment, Setting } = require('../src/models');
const jwt = require('jsonwebtoken');

// Mock Sequelize Models
jest.mock('../src/models', () => {
  const mockUser = { findByPk: jest.fn() };
  const mockPlan = { findByPk: jest.fn() };
  const mockSub = { create: jest.fn() };
  const mockPay = { create: jest.fn() };
  const mockSetting = { findOne: jest.fn() };
  return {
    User: mockUser,
    SubscriptionPlan: mockPlan,
    Subscription: mockSub,
    Payment: mockPay,
    Setting: mockSetting,
    sequelize: {
      authenticate: jest.fn().mockResolvedValue(),
      sync: jest.fn().mockResolvedValue()
    }
  };
});

describe('Payments & Checkout APIs', () => {
  let authToken;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create valid auth token for tests
    authToken = jwt.sign(
      { id: 42, type: 'user' },
      process.env.JWT_SECRET || 'super_secret_jwt_key_123!@#',
      { expiresIn: '1h' }
    );
  });

  describe('POST /api/payments/create-order', () => {
    it('should create order successfully in mock sandbox mode', async () => {
      // Mock authenticated user profile retrieval
      const mockUserInstance = {
        id: 42,
        full_name: 'Test User',
        phone: '9876543210',
        plan_id: 1,
        status: 'active'
      };
      User.findByPk.mockResolvedValue(mockUserInstance);

      // Mock setting key as placeholder (triggers mock checkout)
      Setting.findOne.mockResolvedValue({
        razorpay_key_id: 'rzp_test_placeholder_key',
        razorpay_secret: 'rzp_test_placeholder_secret'
      });

      // Mock subscription plans info
      SubscriptionPlan.findByPk.mockResolvedValue({
        id: 2,
        plan_name: 'Monthly',
        price: 99.00,
        duration_days: 30,
        status: 1
      });

      const res = await request(app)
        .post('/api/payments/create-order')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ plan_id: 2 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.isMock).toBe(true);
      expect(res.body.order_id).toContain('order_mock_');
      expect(res.body.amount).toBe(9900); // 99.00 INR * 100 paise
    });

    it('rejects an inactive subscription plan before creating a Razorpay order', async () => {
      SubscriptionPlan.findByPk.mockResolvedValue({ id: 2, plan_name: 'Monthly', price: 99, status: 0 });

      const res = await request(app)
        .post('/api/payments/create-order')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ plan_id: 2 });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/inactive/i);
    });
  });

  describe('POST /api/payments/verify', () => {
    it('should verify mock signature and upgrade plan', async () => {
      const mockUserInstance = {
        id: 42,
        full_name: 'Test User',
        phone: '9876543210',
        plan_id: 1,
        status: 'active',
        save: jest.fn().mockResolvedValue()
      };
      User.findByPk.mockResolvedValue(mockUserInstance);

      Setting.findOne.mockResolvedValue({
        razorpay_key_id: 'rzp_test_placeholder_key',
        razorpay_secret: 'rzp_test_placeholder_secret'
      });

      SubscriptionPlan.findByPk.mockResolvedValue({
        id: 2,
        plan_name: 'Monthly',
        price: 99.00,
        duration_days: 30,
        status: 1
      });

      Subscription.create.mockResolvedValue({ id: 101, status: 'active' });
      Payment.create.mockResolvedValue({ id: 201, payment_status: 'success' });

      const res = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          razorpay_order_id: 'order_mock_12345',
          razorpay_payment_id: 'pay_mock_12345',
          plan_id: 2
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockUserInstance.plan_id).toBe(2);
      expect(mockUserInstance.save).toHaveBeenCalled();
      expect(Subscription.create).toHaveBeenCalled();
      expect(Payment.create).toHaveBeenCalled();
    });

    it('records a failed payment and does not activate a plan for an invalid mock order ID', async () => {
      SubscriptionPlan.findByPk.mockResolvedValue({ id: 2, plan_name: 'Monthly', price: 99, duration_days: 30, status: 1 });
      Setting.findOne.mockResolvedValue({ razorpay_key_id: 'rzp_test_placeholder_key', razorpay_secret: 'rzp_test_placeholder_secret' });
      Payment.create.mockResolvedValue({ id: 202, payment_status: 'failed' });

      const res = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          razorpay_order_id: 'order_not_created_by_mock',
          razorpay_payment_id: 'pay_mock_invalid',
          plan_id: 2
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(Subscription.create).not.toHaveBeenCalled();
      expect(Payment.create).toHaveBeenCalledWith(expect.objectContaining({ payment_status: 'failed', amount: 99 }));
    });

    it('rejects missing payment data before changing a subscription', async () => {
      const res = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ plan_id: 2 });

      expect(res.status).toBe(400);
      expect(Subscription.create).not.toHaveBeenCalled();
      expect(Payment.create).not.toHaveBeenCalled();
    });
  });

  describe.each([
    ['Monthly', 99, 30],
    ['Quarterly', 249, 90],
    ['Yearly', 899, 365]
  ])('app subscription: %s', (planName, price, durationDays) => {
    it('creates and verifies the plan using its configured price and duration', async () => {
      const mockUserInstance = {
        id: 42,
        full_name: 'Test User',
        phone: '9876543210',
        plan_id: 1,
        status: 'active',
        save: jest.fn().mockResolvedValue()
      };
      const plan = { id: 9, plan_name: planName, price, duration_days: durationDays, status: 1 };
      User.findByPk.mockResolvedValue(mockUserInstance);
      Setting.findOne.mockResolvedValue({ razorpay_key_id: 'rzp_test_placeholder_key', razorpay_secret: 'rzp_test_placeholder_secret' });
      SubscriptionPlan.findByPk.mockResolvedValue(plan);
      Subscription.create.mockResolvedValue({ id: 101, status: 'active' });
      Payment.create.mockResolvedValue({ id: 201, payment_status: 'success' });

      const createResponse = await request(app)
        .post('/api/payments/create-order')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ plan_id: plan.id });

      expect(createResponse.status).toBe(200);
      expect(createResponse.body.amount).toBe(price * 100);

      const verifyResponse = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          razorpay_order_id: createResponse.body.order_id,
          razorpay_payment_id: `pay_mock_${planName.toLowerCase()}`,
          plan_id: plan.id
        });

      expect(verifyResponse.status).toBe(200);
      expect(Subscription.create).toHaveBeenCalledWith(expect.objectContaining({
        plan_id: plan.id,
        amount: price,
        status: 'active'
      }));
      const subscriptionPayload = Subscription.create.mock.calls[0][0];
      expect(Math.round((new Date(subscriptionPayload.end_date) - new Date(subscriptionPayload.start_date)) / 86400000)).toBe(durationDays);
    });
  });
});
