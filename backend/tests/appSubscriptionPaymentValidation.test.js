const crypto = require('crypto');

const mockRazorpayPayments = { fetch: jest.fn() };
jest.mock('razorpay', () => jest.fn().mockImplementation(() => ({ payments: mockRazorpayPayments })));

jest.mock('../src/models', () => ({
  User: { findByPk: jest.fn() },
  SubscriptionPlan: { findByPk: jest.fn() },
  Subscription: { create: jest.fn() },
  Payment: { findOne: jest.fn(), create: jest.fn() },
  Setting: { findOne: jest.fn() },
  Commission: { create: jest.fn() }
}));

const { User, SubscriptionPlan, Subscription, Payment, Setting } = require('../src/models');
const { verifyPayment } = require('../src/controllers/api/paymentController');
const originalKeyId = process.env.RAZORPAY_KEY_ID;
const originalSecret = process.env.RAZORPAY_SECRET;
const originalNodeEnv = process.env.NODE_ENV;

const responseDouble = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const requestFor = (overrides = {}) => {
  const orderId = 'order_live_monthly_1';
  const paymentId = 'pay_live_monthly_1';
  const secret = 'live_test_secret';
  return {
    user: { id: 42 },
    body: {
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex'),
      plan_id: 3,
      ...overrides
    }
  };
};

describe('Live app subscription payment validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.RAZORPAY_KEY_ID = 'rzp_live_test_key';
    process.env.RAZORPAY_SECRET = 'live_test_secret';
    process.env.NODE_ENV = 'production';
    Setting.findOne.mockResolvedValue({ razorpay_key_id: 'rzp_live_test_key', razorpay_secret: 'live_test_secret' });
    SubscriptionPlan.findByPk.mockResolvedValue({ id: 3, plan_name: 'Monthly', price: 99, duration_days: 30, status: 1 });
    Payment.findOne.mockResolvedValue(null);
    Subscription.create.mockResolvedValue({ id: 501 });
    Payment.create.mockResolvedValue({ id: 601 });
    User.findByPk.mockResolvedValue({ id: 42, plan_id: 1, subscription_expiry: null, referred_by: null, save: jest.fn().mockResolvedValue() });
    mockRazorpayPayments.fetch.mockResolvedValue({ id: 'pay_live_monthly_1', order_id: 'order_live_monthly_1', status: 'captured', amount: 9900, currency: 'INR' });
  });

  afterAll(() => {
    if (originalKeyId === undefined) delete process.env.RAZORPAY_KEY_ID;
    else process.env.RAZORPAY_KEY_ID = originalKeyId;
    if (originalSecret === undefined) delete process.env.RAZORPAY_SECRET;
    else process.env.RAZORPAY_SECRET = originalSecret;
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
  });

  it('activates an app plan only for a valid signature, captured payment, matching order, amount, and currency', async () => {
    const res = responseDouble();
    await verifyPayment(requestFor(), res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(Subscription.create).toHaveBeenCalledWith(expect.objectContaining({ plan_id: 3, amount: 99, status: 'active' }));
    expect(Payment.create).toHaveBeenCalledWith(expect.objectContaining({ payment_status: 'success', amount: 99 }));
  });

  it.each([
    ['authorized but not captured', { status: 'authorized', amount: 9900, currency: 'INR' }],
    ['wrong payment amount', { status: 'captured', amount: 1, currency: 'INR' }],
    ['wrong currency', { status: 'captured', amount: 9900, currency: 'USD' }],
    ['wrong Razorpay order', { status: 'captured', amount: 9900, currency: 'INR', order_id: 'order_other' }]
  ])('rejects a %s response without activating Premium', async (_label, paymentPatch) => {
    mockRazorpayPayments.fetch.mockResolvedValue({ id: 'pay_live_monthly_1', order_id: 'order_live_monthly_1', ...paymentPatch });
    const res = responseDouble();

    await verifyPayment(requestFor(), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(Subscription.create).not.toHaveBeenCalled();
    expect(Payment.create).toHaveBeenCalledWith(expect.objectContaining({ payment_status: 'failed', amount: 99 }));
  });

  it('rejects a forged checkout signature before using the Razorpay payment as success', async () => {
    const res = responseDouble();
    await verifyPayment(requestFor({ razorpay_signature: 'not_a_real_signature' }), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockRazorpayPayments.fetch).not.toHaveBeenCalled();
    expect(Subscription.create).not.toHaveBeenCalled();
  });
});
