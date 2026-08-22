jest.mock('../src/models', () => ({
  PaymentWebhookEvent: { findOrCreate: jest.fn(), update: jest.fn() },
  ProductSubscription: { findOne: jest.fn() },
  Payment: { findOne: jest.fn(), create: jest.fn() },
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
  mapRazorpayStatus: jest.fn((status) => status === 'active' ? 'active' : 'pending')
}));

const {
  PaymentWebhookEvent, ProductSubscription, Payment, Product, SubscriptionPlan, Subscription, User
} = require('../src/models');
const { getRazorpayConfig, verifySignature } = require('../src/services/razorpayService');
const { handleRazorpayWebhook } = require('../src/controllers/api/webhookController');

const responseDouble = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const webhookRequest = (eventType, payload) => ({
  body: Buffer.from(JSON.stringify(payload)),
  get: jest.fn((header) => ({
    'x-razorpay-signature': 'valid_webhook_signature',
    'x-razorpay-event': eventType,
    'x-razorpay-event-id': `evt_${eventType.replace('.', '_')}`
  }[header]))
});

const chargedPayload = {
  payload: {
    subscription: { entity: { id: 'sub_product_offer_1', status: 'active', charge_at: 1790000000 } },
    payment: { entity: { id: 'pay_renewal_1', subscription_id: 'sub_product_offer_1', amount: 9900, method: 'upi' } }
  }
};

describe('₹1 product offer real-world lifecycle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getRazorpayConfig.mockResolvedValue({ webhookSecret: 'webhook_secret' });
    verifySignature.mockReturnValue(true);
    PaymentWebhookEvent.findOrCreate.mockResolvedValue([{ processed: false, save: jest.fn().mockResolvedValue() }, true]);
    Payment.findOne.mockResolvedValue(null);
  });

  it('activates Premium only after the first successful post-trial Razorpay charge', async () => {
    const productSubscription = { user_id: 42, product_id: 7, order_id: 101, status: 'pending', next_charge_at: null, save: jest.fn().mockResolvedValue() };
    const user = { id: 42, plan_id: 1, subscription_expiry: null, save: jest.fn().mockResolvedValue() };
    ProductSubscription.findOne.mockResolvedValue(productSubscription);
    Product.findByPk.mockResolvedValue({ id: 7, subscription_plan_id: 3 });
    SubscriptionPlan.findByPk.mockResolvedValue({ id: 3, plan_name: 'Monthly', price: 99, duration_days: 30, status: 1 });
    User.findByPk.mockResolvedValue(user);
    Subscription.findOne.mockResolvedValue(null);
    Subscription.create.mockResolvedValue({ id: 501 });
    const res = responseDouble();

    await handleRazorpayWebhook(webhookRequest('subscription.charged', chargedPayload), res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(productSubscription.status).toBe('active');
    expect(Payment.create).toHaveBeenCalledWith(expect.objectContaining({
      payment_status: 'success',
      amount: 99,
      razorpay_payment_id: 'pay_renewal_1',
      razorpay_subscription_id: 'sub_product_offer_1'
    }));
    expect(user.plan_id).toBe(3);
    expect(user.subscription_expiry).toBeInstanceOf(Date);
    expect(user.save).toHaveBeenCalled();
  });

  it('ignores a duplicate Razorpay webhook so the user is not charged or extended twice', async () => {
    PaymentWebhookEvent.findOrCreate.mockResolvedValue([{ processed: true, save: jest.fn() }, false]);
    const res = responseDouble();

    await handleRazorpayWebhook(webhookRequest('subscription.charged', chargedPayload), res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, duplicate: true });
    expect(Payment.create).not.toHaveBeenCalled();
    expect(User.findByPk).not.toHaveBeenCalled();
  });

  it('records a failed renewal without granting or removing still-valid Premium access', async () => {
    const productSubscription = { user_id: 42, product_id: 7, order_id: 101, status: 'active', save: jest.fn().mockResolvedValue() };
    const existingExpiry = new Date(Date.now() + 15 * 86400000);
    const user = { id: 42, plan_id: 3, subscription_expiry: existingExpiry, save: jest.fn() };
    ProductSubscription.findOne.mockResolvedValue(productSubscription);
    User.findByPk.mockResolvedValue(user);
    const failedPayload = {
      payload: {
        payment: { entity: { id: 'pay_renewal_failed', subscription_id: 'sub_product_offer_1', amount: 9900, method: 'upi' } }
      }
    };
    const res = responseDouble();

    await handleRazorpayWebhook(webhookRequest('payment.failed', failedPayload), res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(productSubscription.status).toBe('failed');
    expect(Payment.create).toHaveBeenCalledWith(expect.objectContaining({ payment_status: 'failed', amount: 99 }));
    expect(user.plan_id).toBe(3);
    expect(user.save).not.toHaveBeenCalled();
  });

  it('rejects an unsigned webhook before any subscription or Premium state changes', async () => {
    verifySignature.mockReturnValue(false);
    const res = responseDouble();

    await handleRazorpayWebhook(webhookRequest('subscription.charged', chargedPayload), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(PaymentWebhookEvent.findOrCreate).not.toHaveBeenCalled();
    expect(ProductSubscription.findOne).not.toHaveBeenCalled();
    expect(User.findByPk).not.toHaveBeenCalled();
  });
});
