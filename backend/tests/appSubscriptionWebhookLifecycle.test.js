jest.mock('../src/models', () => ({
  PaymentWebhookEvent: { findOrCreate: jest.fn(), update: jest.fn() },
  ProductSubscription: { findOne: jest.fn() },
  Payment: { findOne: jest.fn(), create: jest.fn() },
  Product: { findByPk: jest.fn() },
  SubscriptionPlan: { findByPk: jest.fn(), findOne: jest.fn() },
  Subscription: { findOne: jest.fn(), create: jest.fn() },
  User: { findByPk: jest.fn() },
  Setting: { findOne: jest.fn() },
  Commission: { create: jest.fn() }
}));
jest.mock('../src/services/razorpayService', () => ({ getRazorpayConfig: jest.fn(), verifySignature: jest.fn() }));
jest.mock('../src/controllers/api/productSubscriptionController', () => ({ mapRazorpayStatus: jest.fn((status) => status) }));

const { PaymentWebhookEvent, ProductSubscription, Payment, SubscriptionPlan, Subscription, User, Setting, Commission } = require('../src/models');
const { getRazorpayConfig, verifySignature } = require('../src/services/razorpayService');
const { handleRazorpayWebhook } = require('../src/controllers/api/webhookController');

const responseDouble = () => {
  const res = {}; res.status = jest.fn().mockReturnValue(res); res.json = jest.fn().mockReturnValue(res); return res;
};
const webhookRequest = (event, payload, id = `evt_${event}`) => ({
  body: Buffer.from(JSON.stringify(payload)),
  get: jest.fn((header) => ({ 'x-razorpay-signature': 'signature', 'x-razorpay-event': event, 'x-razorpay-event-id': id }[header]))
});

describe('app Autopay Razorpay webhook lifecycle', () => {
  const appSubscription = () => ({ id: 81, user_id: 7, plan_id: 3, razorpay_subscription_id: 'sub_app_1', status: 'active', save: jest.fn().mockResolvedValue() });
  const user = () => ({ id: 7, plan_id: 3, subscription_expiry: new Date(Date.now() + 86400000), referred_by: 9, save: jest.fn().mockResolvedValue() });
  const plan = { id: 3, price: 199, duration_days: 90, status: 1 };

  beforeEach(() => {
    jest.clearAllMocks();
    getRazorpayConfig.mockResolvedValue({ webhookSecret: 'secret' }); verifySignature.mockReturnValue(true);
    PaymentWebhookEvent.findOrCreate.mockResolvedValue([{ processed: false, save: jest.fn().mockResolvedValue() }, true]);
    ProductSubscription.findOne.mockResolvedValue(null); Payment.findOne.mockResolvedValue(null); Setting.findOne.mockResolvedValue({ commission_percentage: 10 }); Commission.create.mockResolvedValue({});
  });

  it('records a captured renewal, extends Premium, and credits referral commission once', async () => {
    const localSubscription = appSubscription(); const payingUser = user(); const referrer = { id: 9, wallet_balance: 0, save: jest.fn().mockResolvedValue() };
    Subscription.findOne.mockResolvedValue(localSubscription); User.findByPk.mockResolvedValueOnce(payingUser).mockResolvedValueOnce(referrer); SubscriptionPlan.findByPk.mockResolvedValue(plan); Payment.create.mockResolvedValue({ id: 900 });
    const res = responseDouble();
    await handleRazorpayWebhook(webhookRequest('subscription.charged', { payload: { subscription: { entity: { id: 'sub_app_1', status: 'active' } }, payment: { entity: { id: 'pay_renewal_1', subscription_id: 'sub_app_1', amount: 19900, method: 'upi' } } } }), res);
    expect(Payment.create).toHaveBeenCalledWith(expect.objectContaining({ payment_status: 'success', amount: 199 }));
    expect(localSubscription.end_date).toBeInstanceOf(Date);
    expect(payingUser.subscription_expiry).toBeInstanceOf(Date);
    expect(referrer.wallet_balance).toBe(19.9);
    expect(Commission.create).toHaveBeenCalledWith(expect.objectContaining({ amount: 19.9, payment_id: 900 }));
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('does not extend Premium or credit commission for a duplicate Razorpay event', async () => {
    PaymentWebhookEvent.findOrCreate.mockResolvedValue([{ processed: true, save: jest.fn() }, false]);
    const res = responseDouble();
    await handleRazorpayWebhook(webhookRequest('subscription.charged', { payload: { subscription: { entity: { id: 'sub_app_1' } } } }), res);
    expect(Payment.create).not.toHaveBeenCalled(); expect(Commission.create).not.toHaveBeenCalled(); expect(User.findByPk).not.toHaveBeenCalled();
  });

  it('stops Premium when Razorpay confirms the user cancelled the Autopay mandate', async () => {
    const localSubscription = appSubscription(); const payingUser = user();
    Subscription.findOne.mockResolvedValue(localSubscription); User.findByPk.mockResolvedValue(payingUser); SubscriptionPlan.findByPk.mockResolvedValue(plan); SubscriptionPlan.findOne.mockResolvedValue({ id: 1, price: 0, status: 1 });
    const res = responseDouble();
    await handleRazorpayWebhook(webhookRequest('subscription.cancelled', { payload: { subscription: { entity: { id: 'sub_app_1', status: 'cancelled' } } } }), res);
    expect(localSubscription.status).toBe('cancelled');
    expect(payingUser.plan_id).toBe(1);
    expect(payingUser.subscription_expiry.getTime()).toBeLessThanOrEqual(Date.now());
    expect(payingUser.save).toHaveBeenCalled();
  });

  it('stops Premium when a recurring debit fails', async () => {
    const localSubscription = appSubscription(); const payingUser = user();
    Subscription.findOne.mockResolvedValue(localSubscription); User.findByPk.mockResolvedValue(payingUser); SubscriptionPlan.findByPk.mockResolvedValue(plan); SubscriptionPlan.findOne.mockResolvedValue({ id: 1, price: 0, status: 1 });
    const res = responseDouble();
    await handleRazorpayWebhook(webhookRequest('payment.failed', { payload: { payment: { entity: { id: 'pay_failed', subscription_id: 'sub_app_1', amount: 19900 } } } }), res);
    expect(localSubscription.status).toBe('cancelled'); expect(payingUser.plan_id).toBe(1); expect(payingUser.save).toHaveBeenCalled();
  });
});
