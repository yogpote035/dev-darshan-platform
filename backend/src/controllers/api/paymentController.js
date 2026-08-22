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
  recoverPayment
};
