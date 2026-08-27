const crypto = require('crypto');
const { PaymentWebhookEvent, ProductSubscription, Payment, Product, SubscriptionPlan, Subscription, User } = require('../../models');
const { getRazorpayConfig, verifySignature } = require('../../services/razorpayService');
const { mapRazorpayStatus } = require('./productSubscriptionController');
const { addReferralCommission } = require('./paymentController');

const getEntity = (payload, key) => payload?.payload?.[key]?.entity || null;

const grantPremiumForProductRenewal = async (subscription) => {
    const product = await Product.findByPk(subscription.product_id);
    const plan = product?.subscription_plan_id ? await SubscriptionPlan.findByPk(product.subscription_plan_id) : null;
    const user = await User.findByPk(subscription.user_id);
    if (!product || !plan || plan.status !== 1 || !user) return;

    const now = new Date();
    const currentExpiry = user.subscription_expiry ? new Date(user.subscription_expiry) : null;
    const startsAt = currentExpiry && currentExpiry > now ? currentExpiry : now;
    const endDate = new Date(startsAt);
    endDate.setDate(endDate.getDate() + Number(plan.duration_days || 0));

    let appSubscription = await Subscription.findOne({
        where: { user_id: user.id, plan_id: plan.id, status: 'active' },
        order: [['end_date', 'DESC']]
    });
    if (appSubscription) {
        appSubscription.amount = plan.price;
        appSubscription.end_date = endDate;
        await appSubscription.save();
    } else {
        appSubscription = await Subscription.create({
            user_id: user.id,
            plan_id: plan.id,
            amount: plan.price,
            start_date: now,
            end_date: endDate,
            status: 'active'
        });
    }

    user.plan_id = plan.id;
    user.subscription_expiry = endDate;
    await user.save();
};

const handleRazorpayWebhook = async (req, res) => {
    const rawBody = req.body;
    const signature = req.get('x-razorpay-signature');
    const eventType = req.get('x-razorpay-event') || 'unknown';
    const eventId = req.get('x-razorpay-event-id') || crypto.createHash('sha256').update(rawBody).digest('hex');

    try {
        const { webhookSecret } = await getRazorpayConfig();
        if (!verifySignature({ payload: rawBody, secret: webhookSecret, signature })) {
            return res.status(400).json({ success: false, message: 'Invalid webhook signature.' });
        }

        const [event, created] = await PaymentWebhookEvent.findOrCreate({
            where: { event_id: eventId },
            defaults: { event_type: eventType, payload_hash: crypto.createHash('sha256').update(rawBody).digest('hex') }
        });
        if (!created || event.processed) return res.status(200).json({ success: true, duplicate: true });

        const payload = JSON.parse(rawBody.toString('utf8'));
        const subscriptionEntity = getEntity(payload, 'subscription');
        const paymentEntity = getEntity(payload, 'payment');
        const subscriptionId = subscriptionEntity?.id || paymentEntity?.subscription_id;

        if (subscriptionId) {
            // App-plan Autopay: only a successful recurring charge extends premium
            // and earns referral commission. Authorization never earns commission.
            const appSubscription = await Subscription.findOne({ where: { razorpay_subscription_id: subscriptionId } });
            if (appSubscription) {
                const appUser = await User.findByPk(appSubscription.user_id);
                const appPlan = await SubscriptionPlan.findByPk(appSubscription.plan_id);
                if (eventType === 'subscription.charged' && appUser && appPlan && paymentEntity?.id) {
                    const existing = await Payment.findOne({ where: { razorpay_payment_id: paymentEntity.id } });
                    if (!existing) {
                        const paidAmount = Number(paymentEntity.amount || 0) / 100;
                        if (Math.abs(paidAmount - Number(appPlan.price)) > 0.001) throw new Error('Unexpected Autopay charge amount.');
                        const payment = await Payment.create({ user_id: appUser.id, subscription_id: appSubscription.id, payment_type: 'subscription', payment_method: paymentEntity.method || 'razorpay', payment_status: 'success', amount: paidAmount, razorpay_subscription_id: subscriptionId, razorpay_payment_id: paymentEntity.id });
                        const start = new Date(); const end = new Date(start); end.setDate(end.getDate() + Number(appPlan.duration_days));
                        appSubscription.start_date = start; appSubscription.end_date = end; appSubscription.status = 'active';
                        // An administrator may have granted a different access plan.
                        // A renewal must never overwrite that choice or change what the
                        // customer is charged: Razorpay continues using this mandate's
                        // original plan and amount.
                        appUser.subscription_expiry = end; await appUser.save();
                        await addReferralCommission(appUser, payment, paidAmount);
                    }
                } else if (eventType === 'payment.failed') {
                    appSubscription.status = 'cancelled'; appSubscription.cancelled_at = new Date();
                    if (appUser) { const free = await SubscriptionPlan.findOne({ where: { price: 0, status: 1 }, order: [['id', 'ASC']] }); appUser.plan_id = free?.id || 1; appUser.subscription_expiry = new Date(); await appUser.save(); }
                } else if (subscriptionEntity?.status === 'cancelled') {
                    appSubscription.status = 'cancelled'; appSubscription.cancelled_at = new Date();
                    if (appUser) {
                        const free = await SubscriptionPlan.findOne({ where: { price: 0, status: 1 }, order: [['id', 'ASC']] });
                        appUser.plan_id = free?.id || 1;
                        appUser.subscription_expiry = new Date();
                        await appUser.save();
                    }
                }
                await appSubscription.save();
            }
            const subscription = await ProductSubscription.findOne({ where: { razorpay_subscription_id: subscriptionId } });
            if (subscription) {
                if (eventType === 'subscription.charged') {
                    subscription.status = 'active';
                    subscription.next_charge_at = subscriptionEntity?.charge_at ? new Date(subscriptionEntity.charge_at * 1000) : subscription.next_charge_at;
                    if (paymentEntity?.id && !(await Payment.findOne({ where: { razorpay_payment_id: paymentEntity.id } }))) {
                        await Payment.create({
                            user_id: subscription.user_id,
                            order_id: subscription.order_id,
                            product_id: subscription.product_id,
                            payment_type: 'product_subscription_offer',
                            payment_method: paymentEntity.method || 'razorpay',
                            payment_status: 'success',
                            amount: Number(paymentEntity.amount || 0) / 100,
                            razorpay_subscription_id: subscriptionId,
                            razorpay_payment_id: paymentEntity.id
                        });
                    }
                    // Premium is granted only after the first successful recurring
                    // charge, never just because the ₹1 product purchase succeeded.
                    await grantPremiumForProductRenewal(subscription);
                } else if (eventType === 'payment.failed') {
                    subscription.status = 'failed';
                    if (paymentEntity?.id && !(await Payment.findOne({ where: { razorpay_payment_id: paymentEntity.id } }))) {
                        await Payment.create({
                            user_id: subscription.user_id,
                            order_id: subscription.order_id,
                            product_id: subscription.product_id,
                            payment_type: 'product_subscription_offer',
                            payment_method: paymentEntity.method || 'razorpay',
                            payment_status: 'failed',
                            amount: Number(paymentEntity.amount || 0) / 100,
                            razorpay_subscription_id: subscriptionId,
                            razorpay_payment_id: paymentEntity.id
                        });
                    }
                } else if (subscriptionEntity) {
                    subscription.status = mapRazorpayStatus(subscriptionEntity.status);
                    subscription.next_charge_at = subscriptionEntity.charge_at ? new Date(subscriptionEntity.charge_at * 1000) : subscription.next_charge_at;
                    if (subscription.status === 'cancelled') subscription.cancelled_at = new Date();
                }
                await subscription.save();
            }
        }

        event.processed = true;
        event.processed_at = new Date();
        await event.save();
        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Razorpay webhook error:', error);
        try {
            await PaymentWebhookEvent.update({ error: error.message }, { where: { event_id: eventId } });
        } catch (_) { /* Preserve the original processing error. */ }
        return res.status(500).json({ success: false, message: 'Webhook processing failed.' });
    }
};

module.exports = { handleRazorpayWebhook, grantPremiumForProductRenewal };
