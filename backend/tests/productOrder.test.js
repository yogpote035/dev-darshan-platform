jest.mock('../src/models', () => {
  const transaction = { commit: jest.fn(), rollback: jest.fn(), LOCK: { UPDATE: 'UPDATE' } };
  return {
    sequelize: { transaction: jest.fn().mockResolvedValue(transaction) },
    CartItem: { destroy: jest.fn() },
    Product: { findByPk: jest.fn() },
    Order: { findOne: jest.fn(), findByPk: jest.fn() },
    OrderItem: {},
    Payment: { findOne: jest.fn(), create: jest.fn() },
    ProductSubscription: { create: jest.fn() },
    SubscriptionPlan: { findByPk: jest.fn() },
    User: {}
  };
});

jest.mock('../src/services/razorpayService', () => ({
  getRazorpayConfig: jest.fn(),
  verifyOrderSignature: jest.fn()
}));

const { CartItem, Product, Order, Payment, ProductSubscription, sequelize } = require('../src/models');
const { getRazorpayConfig, verifyOrderSignature } = require('../src/services/razorpayService');
const { verifyOrderPayment } = require('../src/controllers/api/orderController');

const responseDouble = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Direct product purchase verification', () => {
  const baseRequest = {
    user: { id: 42 },
    body: {
      orderId: 101,
      razorpay_order_id: 'order_live_product_1',
      razorpay_payment_id: 'pay_live_product_1',
      razorpay_signature: 'valid_signature'
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    sequelize.transaction.mockResolvedValue({ commit: jest.fn(), rollback: jest.fn(), LOCK: { UPDATE: 'UPDATE' } });
    getRazorpayConfig.mockResolvedValue({
      isMock: false,
      secret: 'test_secret',
      instance: { payments: { fetch: jest.fn().mockResolvedValue({ order_id: 'order_live_product_1', status: 'captured', amount: 30000, currency: 'INR' }) } }
    });
    verifyOrderSignature.mockReturnValue(true);
    Payment.findOne.mockResolvedValue(null);
  });

  it('confirms a captured direct purchase, reduces stock once, and creates no product subscription', async () => {
    const savedOrder = { id: 101, user_id: 42, razorpay_order_id: 'order_live_product_1', payment_status: 'pending', payment_mode: 'one_time', total_amount: 300, save: jest.fn().mockResolvedValue() };
    const confirmedOrder = {
      ...savedOrder,
      OrderItems: [{ product_id: 7, quantity: 2 }],
      total_amount: 300,
      save: jest.fn().mockResolvedValue()
    };
    const product = { id: 7, stock: 5, update: jest.fn().mockResolvedValue() };
    Order.findOne.mockResolvedValue(savedOrder);
    Order.findByPk.mockResolvedValue(confirmedOrder);
    Product.findByPk.mockResolvedValue(product);
    const res = responseDouble();

    await verifyOrderPayment(baseRequest, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(confirmedOrder.payment_status).toBe('paid');
    expect(confirmedOrder.order_status).toBe('confirmed');
    expect(product.update).toHaveBeenCalledWith({ stock: 3 }, expect.any(Object));
    expect(CartItem.destroy).toHaveBeenCalledWith(expect.objectContaining({ where: { user_id: 42 } }));
    expect(Payment.create).toHaveBeenCalledWith(expect.objectContaining({ amount: 300, payment_type: 'product', payment_status: 'success' }), expect.any(Object));
    expect(ProductSubscription.create).not.toHaveBeenCalled();
  });

  it('records exactly one ₹1 offer payment and creates a pending recurring authorization', async () => {
    const offerOrder = { id: 101, user_id: 42, razorpay_order_id: 'order_live_product_1', payment_status: 'pending', payment_mode: 'subscription_offer', total_amount: 1, save: jest.fn().mockResolvedValue() };
    const confirmedOfferOrder = {
      ...offerOrder,
      OrderItems: [{ product_id: 7, quantity: 1, total: 1 }],
      total_amount: 1,
      save: jest.fn().mockResolvedValue()
    };
    const offerProduct = {
      id: 7,
      stock: 5,
      subscription_plan_id: 3,
      subscription_enabled: true,
      subscription_amount: 1,
      subscription_trial_days: 7,
      update: jest.fn().mockResolvedValue()
    };
    Order.findOne.mockResolvedValue(offerOrder);
    Order.findByPk.mockResolvedValue(confirmedOfferOrder);
    Product.findByPk.mockResolvedValue(offerProduct);
    getRazorpayConfig.mockResolvedValue({
      isMock: false,
      secret: 'test_secret',
      instance: { payments: { fetch: jest.fn().mockResolvedValue({ order_id: 'order_live_product_1', status: 'captured', amount: 100, currency: 'INR' }) } }
    });
    const { SubscriptionPlan } = require('../src/models');
    SubscriptionPlan.findByPk.mockResolvedValue({ id: 3, plan_name: 'Monthly', price: 99, duration_days: 30, razorpay_plan_id: 'plan_product_monthly' });
    const res = responseDouble();

    await verifyOrderPayment(baseRequest, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(Payment.create).toHaveBeenCalledWith(expect.objectContaining({
      amount: 1,
      payment_type: 'product_subscription_offer',
      payment_status: 'success'
    }), expect.any(Object));
    expect(ProductSubscription.create).toHaveBeenCalledWith(expect.objectContaining({
      order_id: 101,
      product_id: 7,
      initial_payment_amount: 1,
      recurring_amount: 99,
      trial_days: 7,
      status: 'pending'
    }), expect.any(Object));
    expect(offerProduct.update).toHaveBeenCalledWith({ stock: 4 }, expect.any(Object));
  });

  it('rejects an invalid signature without changing stock or clearing the cart', async () => {
    const pendingOrder = { id: 101, user_id: 42, razorpay_order_id: 'order_live_product_1', payment_status: 'pending', save: jest.fn().mockResolvedValue() };
    Order.findOne.mockResolvedValue(pendingOrder);
    verifyOrderSignature.mockReturnValue(false);
    const res = responseDouble();

    await verifyOrderPayment(baseRequest, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(pendingOrder.payment_status).toBe('failed');
    expect(Product.findByPk).not.toHaveBeenCalled();
    expect(CartItem.destroy).not.toHaveBeenCalled();
  });

  it('rejects an authorized or failed Razorpay payment without fulfilling the product', async () => {
    const pendingOrder = { id: 101, user_id: 42, razorpay_order_id: 'order_live_product_1', payment_status: 'pending', save: jest.fn().mockResolvedValue() };
    Order.findOne.mockResolvedValue(pendingOrder);
    getRazorpayConfig.mockResolvedValue({
      isMock: false,
      secret: 'test_secret',
      instance: { payments: { fetch: jest.fn().mockResolvedValue({ order_id: 'order_live_product_1', status: 'authorized', amount: 30000, currency: 'INR' }) } }
    });
    const res = responseDouble();

    await verifyOrderPayment(baseRequest, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Payment not captured by Razorpay.' }));
    expect(Product.findByPk).not.toHaveBeenCalled();
    expect(CartItem.destroy).not.toHaveBeenCalled();
    expect(Payment.create).not.toHaveBeenCalled();
  });

  it('rejects a payment ID that Razorpay reports against another order', async () => {
    const pendingOrder = { id: 101, user_id: 42, razorpay_order_id: 'order_live_product_1', payment_status: 'pending', save: jest.fn().mockResolvedValue() };
    Order.findOne.mockResolvedValue(pendingOrder);
    getRazorpayConfig.mockResolvedValue({
      isMock: false,
      secret: 'test_secret',
      instance: { payments: { fetch: jest.fn().mockResolvedValue({ order_id: 'order_someone_else', status: 'captured', amount: 30000, currency: 'INR' }) } }
    });
    const res = responseDouble();

    await verifyOrderPayment(baseRequest, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(Product.findByPk).not.toHaveBeenCalled();
    expect(CartItem.destroy).not.toHaveBeenCalled();
  });

  it('rejects a captured payment when its amount does not equal the server-calculated order total', async () => {
    const pendingOrder = { id: 101, user_id: 42, razorpay_order_id: 'order_live_product_1', payment_status: 'pending', total_amount: 300, save: jest.fn().mockResolvedValue() };
    Order.findOne.mockResolvedValue(pendingOrder);
    getRazorpayConfig.mockResolvedValue({
      isMock: false,
      secret: 'test_secret',
      instance: { payments: { fetch: jest.fn().mockResolvedValue({ order_id: 'order_live_product_1', status: 'captured', amount: 1, currency: 'INR' }) } }
    });
    const res = responseDouble();

    await verifyOrderPayment(baseRequest, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(Product.findByPk).not.toHaveBeenCalled();
    expect(CartItem.destroy).not.toHaveBeenCalled();
  });

  it('rejects a second, different payment callback for an already-paid order', async () => {
    const paidOrder = {
      id: 101,
      user_id: 42,
      razorpay_order_id: 'order_live_product_1',
      razorpay_payment_id: 'pay_original',
      payment_status: 'paid'
    };
    Order.findOne.mockResolvedValue(paidOrder);
    const res = responseDouble();

    await verifyOrderPayment({ ...baseRequest, body: { ...baseRequest.body, razorpay_payment_id: 'pay_replayed' } }, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(Product.findByPk).not.toHaveBeenCalled();
    expect(CartItem.destroy).not.toHaveBeenCalled();
  });
});
