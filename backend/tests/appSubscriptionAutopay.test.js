jest.mock('razorpay', () => jest.fn().mockImplementation(() => ({
  subscriptions: { cancel: jest.fn() },
  plans: { create: jest.fn() }
})));

jest.mock('../src/models', () => ({
  User: { findByPk: jest.fn() },
  SubscriptionPlan: { findByPk: jest.fn(), findOne: jest.fn() },
  Subscription: { findOne: jest.fn(), create: jest.fn() },
  Payment: { findOne: jest.fn(), create: jest.fn() },
  Setting: { findOne: jest.fn() },
  Commission: { create: jest.fn() }
}));

const Razorpay = require('razorpay');
const { User, SubscriptionPlan, Subscription } = require('../src/models');
const { createSubscription, verifySubscription, cancelSubscription } = require('../src/controllers/api/paymentController');

const responseDouble = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('membership Autopay lifecycle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = 'test';
    User.findByPk.mockResolvedValue({ id: 7, referred_by: null, save: jest.fn().mockResolvedValue() });
    SubscriptionPlan.findByPk.mockResolvedValue({ id: 3, price: 199, duration_days: 90, status: 1 });
    Subscription.create.mockResolvedValue({ id: 100, end_date: new Date() });
    Subscription.findOne.mockResolvedValue(null);
  });

  it('activates Premium for the free trial only after valid Autopay authorization', async () => {
    const res = responseDouble();
    await verifySubscription({ user: { id: 7 }, body: { plan_id: 3, razorpay_subscription_id: 'sub_mock_123', razorpay_payment_id: 'pay_mock_123' } }, res);
    expect(res.status).not.toHaveBeenCalledWith(400);
    expect(Subscription.create).toHaveBeenCalledWith(expect.objectContaining({ user_id: 7, plan_id: 3, auto_pay_required: true, status: 'active' }));
  });

  it.each([
    ['quarterly 199', 199, 90, 100],
    ['yearly 499', 499, 365, 29]
  ])('uses a valid Razorpay cycle count for the %s plan', async (_label, price, durationDays, expectedTotalCount) => {
    process.env.NODE_ENV = 'production';
    process.env.RAZORPAY_KEY_ID = 'rzp_live_test_key';
    process.env.RAZORPAY_SECRET = 'live_test_secret';
    SubscriptionPlan.findByPk.mockResolvedValue({ id: 3, plan_name: 'Premium', price, duration_days: durationDays, status: 1, razorpay_plan_id: 'plan_premium' });
    const razorpayInstance = { subscriptions: { create: jest.fn().mockResolvedValue({ id: 'sub_live_123' }) } };
    Razorpay.mockImplementationOnce(() => razorpayInstance);
    const res = responseDouble();

    await createSubscription({ user: { id: 7 }, body: { plan_id: 3 } }, res);

    expect(razorpayInstance.subscriptions.create).toHaveBeenCalledWith(expect.objectContaining({ total_count: expectedTotalCount }));
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ subscription_id: 'sub_live_123' }));
  });

  it('returns a payment error and does not create local Premium access when Razorpay rejects the mandate', async () => {
    process.env.NODE_ENV = 'production';
    process.env.RAZORPAY_KEY_ID = 'rzp_live_test_key';
    process.env.RAZORPAY_SECRET = 'live_test_secret';
    SubscriptionPlan.findByPk.mockResolvedValue({ id: 3, plan_name: 'Yearly', price: 499, duration_days: 365, status: 1, razorpay_plan_id: 'plan_yearly' });
    const razorpayInstance = {
      subscriptions: {
        create: jest.fn().mockRejectedValue({
          error: { code: 'BAD_REQUEST_ERROR', description: 'expire_at cannot be more than 30 years for upi' }
        })
      }
    };
    Razorpay.mockImplementationOnce(() => razorpayInstance);
    const res = responseDouble();

    await createSubscription({ user: { id: 7 }, body: { plan_id: 3 } }, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Unable to start Autopay setup.' });
    expect(Subscription.create).not.toHaveBeenCalled();
  });

  it('rejects an inactive or missing plan before contacting Razorpay', async () => {
    SubscriptionPlan.findByPk.mockResolvedValue(null);
    const res = responseDouble();

    await createSubscription({ user: { id: 7 }, body: { plan_id: 999 } }, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Select an active paid plan.' });
    expect(Razorpay).not.toHaveBeenCalled();
  });

  it('rejects invalid Autopay authorization without activating Premium', async () => {
    const res = responseDouble();
    await verifySubscription({
      user: { id: 7 },
      body: {
        plan_id: 3,
        razorpay_subscription_id: 'sub_invalid',
        razorpay_payment_id: 'pay_mock_123'
      }
    }, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Autopay authorization could not be verified.' });
    expect(Subscription.create).not.toHaveBeenCalled();
  });

  it('cancels Autopay and immediately removes Premium access', async () => {
    const subscription = { id: 100, razorpay_subscription_id: 'sub_mock_123', status: 'active', auto_pay_required: true, save: jest.fn().mockResolvedValue() };
    const user = { id: 7, plan_id: 3, subscription_expiry: new Date(Date.now() + 86400000), save: jest.fn().mockResolvedValue() };
    Subscription.findOne.mockResolvedValue(subscription);
    User.findByPk.mockResolvedValue(user);
    SubscriptionPlan.findOne.mockResolvedValue({ id: 1, price: 0, status: 1 });
    const res = responseDouble();
    await cancelSubscription({ user: { id: 7 }, params: { id: 100 } }, res);
    expect(subscription.status).toBe('cancelled');
    expect(user.plan_id).toBe(1);
    expect(user.subscription_expiry.getTime()).toBeLessThanOrEqual(Date.now());
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });
});
