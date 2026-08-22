jest.mock('../src/models', () => ({
  PaymentWebhookEvent: {},
  ProductSubscription: {},
  Payment: {},
  Product: { findByPk: jest.fn() },
  SubscriptionPlan: { findByPk: jest.fn() },
  Subscription: { findOne: jest.fn(), create: jest.fn() },
  User: { findByPk: jest.fn() }
}));

jest.mock('../src/services/razorpayService', () => ({
  getRazorpayConfig: jest.fn(),
  verifySignature: jest.fn()
}));

jest.mock('../src/controllers/api/productSubscriptionController', () => ({
  mapRazorpayStatus: jest.fn()
}));

const { Product, SubscriptionPlan, Subscription, User } = require('../src/models');
const { grantPremiumForProductRenewal } = require('../src/controllers/api/webhookController');

describe('Product offer Premium renewal', () => {
  beforeEach(() => jest.clearAllMocks());

  it.each([
    ['Monthly', 99, 30],
    ['Quarterly', 249, 90],
    ['Yearly', 899, 365]
  ])('grants %s Premium only after a successful renewal', async (planName, price, durationDays) => {
    const user = { id: 42, plan_id: 1, subscription_expiry: null, save: jest.fn().mockResolvedValue() };
    Product.findByPk.mockResolvedValue({ id: 7, subscription_plan_id: 3 });
    SubscriptionPlan.findByPk.mockResolvedValue({ id: 3, plan_name: planName, price, duration_days: durationDays, status: 1 });
    User.findByPk.mockResolvedValue(user);
    Subscription.findOne.mockResolvedValue(null);
    Subscription.create.mockResolvedValue({ id: 501 });

    await grantPremiumForProductRenewal({ user_id: 42, product_id: 7 });

    expect(Subscription.create).toHaveBeenCalledWith(expect.objectContaining({
      user_id: 42,
      plan_id: 3,
      amount: price,
      status: 'active'
    }));
    const created = Subscription.create.mock.calls[0][0];
    expect(Math.round((new Date(created.end_date) - new Date(created.start_date)) / 86400000)).toBe(durationDays);
    expect(user.plan_id).toBe(3);
    expect(user.subscription_expiry).toEqual(created.end_date);
    expect(user.save).toHaveBeenCalled();
  });

  it('extends an existing active Premium plan instead of creating duplicate records', async () => {
    const oldExpiry = new Date(Date.now() + 10 * 86400000);
    const user = { id: 42, plan_id: 3, subscription_expiry: oldExpiry, save: jest.fn().mockResolvedValue() };
    const activeSubscription = { amount: 99, end_date: oldExpiry, save: jest.fn().mockResolvedValue() };
    Product.findByPk.mockResolvedValue({ id: 7, subscription_plan_id: 3 });
    SubscriptionPlan.findByPk.mockResolvedValue({ id: 3, plan_name: 'Monthly', price: 99, duration_days: 30, status: 1 });
    User.findByPk.mockResolvedValue(user);
    Subscription.findOne.mockResolvedValue(activeSubscription);

    await grantPremiumForProductRenewal({ user_id: 42, product_id: 7 });

    expect(Subscription.create).not.toHaveBeenCalled();
    expect(activeSubscription.save).toHaveBeenCalled();
    expect(Math.round((user.subscription_expiry - oldExpiry) / 86400000)).toBe(30);
  });
});
