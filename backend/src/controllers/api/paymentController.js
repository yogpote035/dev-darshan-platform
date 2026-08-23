const crypto = require('crypto');
const Razorpay = require('razorpay');
const { v4: uuidv4 } = require('uuid');
const { User, SubscriptionPlan, Subscription, Payment, Setting, Commission } = require('../../models');

/**
 * Initialize Razorpay instance dynamically from settings or env
 */
const getRazorpayInstance = async () => {
  const settings = await Setting.findOne();
  const keyId = process.env.RAZORPAY_KEY_ID || settings?.razorpay_key_id || 'rzp_test_placeholder_key';
  const secret = process.env.RAZORPAY_SECRET || settings?.razorpay_secret || 'rzp_test_placeholder_secret';

  const isMock = process.env.NODE_ENV === 'test' || keyId.startsWith('rzp_test_placeholder');

  return {
    isMock,
    keyId,
    secret,
    instance: isMock ? null : new Razorpay({ key_id: keyId, key_secret: secret })
  };
};

const TRIAL_DAYS = 30;

const getPaidPlan = async (planId) => {
  const plan = await SubscriptionPlan.findByPk(planId);
  if (!plan || plan.status !== 1 || Number(plan.price) <= 0) return null;
  return plan;
};

const addReferralCommission = async (user, payment, amount) => {
  if (!user.referred_by || Number(amount) <= 0) return;
  const referrer = await User.findByPk(user.referred_by);
  if (!referrer) return;
  const settings = await Setting.findOne();
  const commissionPercent = Number.isFinite(Number.parseFloat(settings?.commission_percentage)) ? Number.parseFloat(settings.commission_percentage) : 10;
  const commissionAmount = Number(((Number(amount) * commissionPercent) / 100).toFixed(2));
  if (!commissionAmount) return;
  referrer.wallet_balance = Number((Number(referrer.wallet_balance || 0) + commissionAmount).toFixed(2));
  await referrer.save();
  await Commission.create({ referrer_id: referrer.id, referred_id: user.id, payment_id: payment.id, amount: commissionAmount, commission_percentage: commissionPercent });
};

const activateTrial = async (user, plan, razorpaySubscriptionId) => {
  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + TRIAL_DAYS);
  const subscription = await Subscription.create({ user_id: user.id, plan_id: plan.id, amount: plan.price, start_date: startDate, end_date: endDate, status: 'active', razorpay_subscription_id: razorpaySubscriptionId, auto_pay_required: true });
  user.plan_id = plan.id;
  user.subscription_expiry = endDate;
  await user.save();
  return subscription;
};

// Paid plans use a Razorpay Subscription, never a one-time order.  The Razorpay
// plan must be configured with the matching amount and 3-month/yearly frequency.
const createSubscription = async (req, res) => {
  try {
    const plan = await getPaidPlan(req.body.plan_id);
    if (!plan) return res.status(404).json({ success: false, message: 'Select an active paid plan.' });
    const { isMock, keyId, instance } = await getRazorpayInstance();
    // Razorpay Plans are immutable. Create the correct recurring plan once and
    // persist its ID, so an admin does not need to manually copy a plan_ ID.
    if (!isMock && !plan.razorpay_plan_id) {
      const isYearly = Number(plan.duration_days) >= 365;
      const razorpayPlan = await instance.plans.create({
        period: isYearly ? 'yearly' : 'monthly',
        interval: isYearly ? 1 : 3,
        item: {
          name: `Dev Darshan Live ${plan.plan_name}`,
          description: `${plan.plan_name} Premium membership`,
          amount: Math.round(Number(plan.price) * 100),
          currency: 'INR'
        }
      });
      plan.razorpay_plan_id = razorpayPlan.id;
      await plan.save();
    }
    const startAt = Math.floor((Date.now() + TRIAL_DAYS * 86400000) / 1000);
    if (isMock) return res.json({ success: true, isMock: true, key: 'mock_key_id', subscription_id: `sub_mock_${uuidv4().replace(/-/g, '').slice(0, 18)}`, plan });
    // Razorpay caps total_count at 100 for these recurring plan intervals.
    // This still provides 25 years of quarterly billing or 100 years of yearly billing.
    const subscription = await instance.subscriptions.create({ plan_id: plan.razorpay_plan_id, total_count: 100, start_at: startAt, customer_notify: 1, notes: { user_id: String(req.user.id), plan_id: String(plan.id), trial_days: String(TRIAL_DAYS) } });
    return res.json({ success: true, isMock: false, key: keyId, subscription_id: subscription.id, plan });
  } catch (error) {
    console.error('createSubscription error:', error);
    return res.status(500).json({ success: false, message: 'Unable to start Autopay setup.' });
  }
};

const verifySubscription = async (req, res) => {
  try {
    const { plan_id, razorpay_subscription_id, razorpay_payment_id, razorpay_signature } = req.body;
    const plan = await getPaidPlan(plan_id);
    if (!plan || !razorpay_subscription_id || !razorpay_payment_id) return res.status(400).json({ success: false, message: 'Missing Autopay authorization details.' });
    const existing = await Subscription.findOne({ where: { razorpay_subscription_id } });
    if (existing) return res.json({ success: true, message: 'Autopay is already active.', subscription: existing });
    const { isMock, secret } = await getRazorpayInstance();
    const verified = isMock ? razorpay_subscription_id.startsWith('sub_mock_') : Boolean(razorpay_signature) && crypto.createHmac('sha256', secret).update(`${razorpay_payment_id}|${razorpay_subscription_id}`).digest('hex') === razorpay_signature;
    if (!verified) return res.status(400).json({ success: false, message: 'Autopay authorization could not be verified.' });
    const user = await User.findByPk(req.user.id);
    const subscription = await activateTrial(user, plan, razorpay_subscription_id);
    return res.json({ success: true, message: `Autopay is enabled. Premium is free until ${subscription.end_date.toLocaleDateString('en-IN')}.`, subscription });
  } catch (error) {
    console.error('verifySubscription error:', error);
    return res.status(500).json({ success: false, message: 'Unable to confirm Autopay.' });
  }
};

const cancelSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ where: { id: req.params.id, user_id: req.user.id, status: 'active', auto_pay_required: true } });
    if (!subscription) return res.status(404).json({ success: false, message: 'Active Autopay subscription not found.' });
    const { isMock, instance } = await getRazorpayInstance();
    if (!isMock) await instance.subscriptions.cancel(subscription.razorpay_subscription_id, false);
    subscription.status = 'cancelled'; subscription.cancelled_at = new Date(); await subscription.save();
    const user = await User.findByPk(req.user.id);
    const freePlan = await SubscriptionPlan.findOne({ where: { price: 0, status: 1 }, order: [['id', 'ASC']] });
    user.plan_id = freePlan?.id || 1; user.subscription_expiry = new Date(); await user.save();
    return res.json({ success: true, message: 'Autopay is cancelled and Premium access has ended.' });
  } catch (error) {
    console.error('cancelSubscription error:', error);
    return res.status(500).json({ success: false, message: 'Unable to cancel Autopay.' });
  }
};

const getMyAutoPaySubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ where: { user_id: req.user.id, auto_pay_required: true, status: 'active' }, order: [['created_at', 'DESC']], include: [{ model: SubscriptionPlan }] });
    return res.json({ success: true, subscription });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to load Autopay status.' });
  }
};

const createOrder = async (req, res) => {
  try {
    const { plan_id } = req.body;
    if (!plan_id) {
      return res.status(400).json({ success: false, message: 'Plan ID is required.' });
    }

    const plan = await SubscriptionPlan.findByPk(plan_id);
    if (!plan || plan.status !== 1) {
      return res.status(404).json({ success: false, message: 'Plan not found or inactive.' });
    }

    const { isMock, keyId, instance } = await getRazorpayInstance();

    // Razorpay amount is in paise (Price * 100)
    const amountInPaise = Math.round(plan.price * 100);
    const receiptId = `receipt_order_${uuidv4().substring(0, 8)}`;

    if (isMock) {
      // Sandbox Mock Mode
      const mockOrderId = `order_mock_${uuidv4().substring(0, 14)}`;
      return res.status(200).json({
        success: true,
        isMock: true,
        key: 'mock_key_id',
        order_id: mockOrderId,
        amount: amountInPaise,
        currency: 'INR',
        plan
      });
    }

    // Real Razorpay Order
    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: receiptId
    };

    const order = await instance.orders.create(options);

    return res.status(200).json({
      success: true,
      isMock: false,
      key: keyId,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      plan
    });
  } catch (error) {
    console.error('createOrder error:', error);
    return res.status(500).json({ success: false, message: 'Server error initiating payment order.' });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan_id } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !plan_id) {
      return res.status(400).json({ success: false, message: 'Missing payment details.' });
    }

    const plan = await SubscriptionPlan.findByPk(plan_id);
    if (!plan || plan.status !== 1) {
      return res.status(404).json({ success: false, message: 'Selected plan not found or inactive.' });
    }

    // A browser retry must not create a second subscription for the same payment.
    if (typeof Payment.findOne === 'function') {
      const existingPayment = await Payment.findOne({
        where: { razorpay_payment_id, payment_status: 'success' }
      });
      if (existingPayment) {
        return res.status(200).json({
          success: true,
          message: 'Payment was already verified and the subscription is active.',
          payment: existingPayment
        });
      }
    }

    const { isMock, secret, instance } = await getRazorpayInstance();
    let verified = false;

    if (isMock) {
      // Simulated Payment Validation
      if (razorpay_order_id.startsWith('order_mock_')) {
        verified = true;
      }
    } else {
      // Real Razorpay Signature Validation
      if (!razorpay_signature) {
        return res.status(400).json({ success: false, message: 'Missing payment signature.' });
      }
      const generatedSignature = crypto
        .createHmac('sha256', secret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      verified = generatedSignature === razorpay_signature;
      if (verified) {
        const razorpayPayment = await instance.payments.fetch(razorpay_payment_id);
        const expectedAmount = Math.round(Number(plan.price) * 100);
        verified = !!razorpayPayment
          && razorpayPayment.order_id === razorpay_order_id
          && razorpayPayment.status === 'captured'
          && Number(razorpayPayment.amount) === expectedAmount
          && razorpayPayment.currency === 'INR';
      }
    }

    if (!verified) {
      // Log failed payment
      await Payment.create({
        user_id: userId,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        amount: plan.price,
        payment_method: 'razorpay',
        payment_status: 'failed'
      });
      return res.status(400).json({ success: false, message: 'Payment verification failed.' });
    }

    // 1. Calculate new subscription expiry dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.duration_days);

    // 2. Create Active Subscription Record
    const subscription = await Subscription.create({
      user_id: userId,
      plan_id: plan.id,
      amount: plan.price,
      start_date: startDate,
      end_date: endDate,
      status: 'active'
    });

    // 3. Create Success Payment Record
    const payment = await Payment.create({
      user_id: userId,
      subscription_id: subscription.id,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount: plan.price,
      payment_method: isMock ? 'mock_checkout' : 'razorpay',
      payment_status: 'success'
    });

    // 4. Upgrade User profile settings
    const user = await User.findByPk(userId);
    user.plan_id = plan.id;
    user.subscription_expiry = endDate;
    await user.save();

    // 5. Process Referral Commission
    if (user.referred_by) {
      const referrer = await User.findByPk(user.referred_by);
      if (referrer) {
        const settings = await Setting.findOne();
        const configuredCommission = Number.parseFloat(settings?.commission_percentage);
        const commissionPercent = Number.isFinite(configuredCommission) ? configuredCommission : 10.00;
        const commissionAmount = parseFloat(((plan.price * commissionPercent) / 100).toFixed(2));

        if (commissionAmount > 0) {
          // Update wallet balance
          referrer.wallet_balance = parseFloat((parseFloat(referrer.wallet_balance || 0) + commissionAmount).toFixed(2));
          await referrer.save();

          // Create commission log
          await Commission.create({
            referrer_id: referrer.id,
            referred_id: user.id,
            payment_id: payment.id,
            amount: commissionAmount,
            commission_percentage: commissionPercent
          });
          console.log(`[Referral] Credited ₹${commissionAmount} commission to User ${referrer.full_name} (ID: ${referrer.id})`);
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Payment verified and subscription activated successfully!',
      subscription,
      payment
    });
  } catch (error) {
    console.error('verifyPayment error:', error);
    return res.status(500).json({ success: false, message: 'Server error during payment verification.' });
  }
};

const recoverPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, plan_id } = req.body;
    if (!razorpay_order_id || !plan_id) {
      return res.status(400).json({ success: false, message: 'Missing payment recovery details.' });
    }

    const { isMock, secret, instance } = await getRazorpayInstance();
    if (isMock) {
      return res.status(400).json({ success: false, message: 'Payment recovery is unavailable in mock mode.' });
    }

    let resolvedPaymentId = razorpay_payment_id;
    let razorpayPayment = resolvedPaymentId
      ? await instance.payments.fetch(resolvedPaymentId)
      : null;

    // Razorpay can report order_already_paid without returning the original payment ID.
    if (!razorpayPayment) {
      const paymentsResponse = await instance.orders.fetchPayments(razorpay_order_id);
      const payments = paymentsResponse.items || [];
      razorpayPayment = payments.find((payment) => payment.status === 'captured');
      resolvedPaymentId = razorpayPayment?.id;
    }

    if (!razorpayPayment || !resolvedPaymentId) {
      return res.status(400).json({
        success: false,
        message: 'No captured payment was found for this order yet.'
      });
    }

    if (razorpayPayment.order_id !== razorpay_order_id) {
      return res.status(400).json({ success: false, message: 'Payment does not belong to this order.' });
    }

    if (razorpayPayment.status !== 'captured') {
      return res.status(400).json({
        success: false,
        message: `Payment is currently ${razorpayPayment.status}. Please wait for Razorpay confirmation.`
      });
    }

    const recoverySignature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${resolvedPaymentId}`)
      .digest('hex');

    return verifyPayment({
      ...req,
      body: {
        razorpay_order_id,
        razorpay_payment_id: resolvedPaymentId,
        razorpay_signature: recoverySignature,
        plan_id
      }
    }, res);
  } catch (error) {
    console.error('recoverPayment error:', error);
    return res.status(500).json({ success: false, message: 'Unable to recover the payment right now.' });
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  recoverPayment,
  createSubscription,
  verifySubscription,
  cancelSubscription,
  getMyAutoPaySubscription,
  addReferralCommission
};
