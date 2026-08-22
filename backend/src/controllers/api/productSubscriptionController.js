const crypto = require('crypto');
const { ProductSubscription, Product, Order, Payment, sequelize } = require('../../models');
const { getRazorpayConfig } = require('../../services/razorpayService');

const verifySubscriptionSignature = ({ paymentId, subscriptionId, signature, secret }) => {
    if (!paymentId || !subscriptionId || !signature || !secret) return false;
    const expected = crypto.createHmac('sha256', secret).update(`${paymentId}|${subscriptionId}`).digest('hex');
    try {
        return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'));
    } catch (_) {
        return false;
    }
};

const mapRazorpayStatus = (status) => ({
    authenticated: 'trialing',
    created: 'pending',
    pending: 'pending',
    active: 'active',
    halted: 'paused',
    cancelled: 'cancelled',
    completed: 'completed'
}[status] || 'pending');

const listSubscriptions = async (req, res) => {
    try {
        const subscriptions = await ProductSubscription.findAll({
            where: { user_id: req.user.id },
            include: [{ model: Product }, { model: Order }],
            order: [['created_at', 'DESC']]
        });
        return res.json({ success: true, subscriptions });
    } catch (error) {
        console.error('listProductSubscriptions error:', error);
        return res.status(500).json({ success: false, message: 'Unable to load product subscriptions.' });
    }
};

const verifySubscription = async (req, res) => {
    try {
        const { orderId, razorpay_subscription_id, razorpay_payment_id, razorpay_signature } = req.body;
        if (!orderId || !razorpay_subscription_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ success: false, message: 'Missing subscription verification data.' });
        }

        const subscription = await ProductSubscription.findOne({
            where: { order_id: orderId, user_id: req.user.id },
            include: [{ model: Order }]
        });
        if (!subscription || subscription.razorpay_subscription_id !== razorpay_subscription_id) {
            return res.status(404).json({ success: false, message: 'Subscription authorization was not found.' });
        }
        if (subscription.status === 'active' || subscription.status === 'trialing') {
            return res.json({ success: true, message: 'Subscription already verified.', subscription });
        }

        const { isMock, secret, instance } = await getRazorpayConfig();
        let valid = isMock;
        let remoteSubscription = null;
        let authorizationPayment = null;
        if (!isMock) {
            valid = verifySubscriptionSignature({
                paymentId: razorpay_payment_id,
                subscriptionId: razorpay_subscription_id,
                signature: razorpay_signature,
                secret
            });
            if (valid) {
                [remoteSubscription, authorizationPayment] = await Promise.all([
                    instance.subscriptions.fetch(razorpay_subscription_id),
                    instance.payments.fetch(razorpay_payment_id)
                ]);
                if (authorizationPayment.subscription_id && authorizationPayment.subscription_id !== razorpay_subscription_id) {
                    valid = false;
                }
                if (!authorizationPayment || authorizationPayment.status === 'failed') {
                    valid = false;
                }
            }
        }
        if (!valid) return res.status(400).json({ success: false, message: 'Subscription verification failed.' });

        const transaction = await sequelize.transaction();
        try {
            const current = await ProductSubscription.findByPk(subscription.id, { transaction, lock: transaction.LOCK.UPDATE });
            if (current.status !== 'active' && current.status !== 'trialing') {
                current.status = remoteSubscription ? mapRazorpayStatus(remoteSubscription.status) : 'trialing';
                current.next_charge_at = remoteSubscription?.charge_at ? new Date(remoteSubscription.charge_at * 1000) : current.next_charge_at;
                await current.save({ transaction });
            }
            await Order.update({ razorpay_subscription_id }, { where: { id: orderId, user_id: req.user.id }, transaction });
            const alreadyRecorded = await Payment.findOne({ where: { razorpay_payment_id }, transaction });
            if (!alreadyRecorded) {
                await Payment.create({
                    user_id: req.user.id,
                    order_id: orderId,
                    product_id: current.product_id,
                    payment_type: 'product_subscription_offer',
                    payment_method: 'razorpay_subscription_authorization',
                    payment_status: 'success',
                    // This is Razorpay's mandate authorization (for example, a refundable hold),
                    // not a second product sale or the recurring monthly amount.
                    amount: authorizationPayment ? Number(authorizationPayment.amount || 0) / 100 : 0,
                    razorpay_subscription_id,
                    razorpay_payment_id,
                    razorpay_signature
                }, { transaction });
            }
            await transaction.commit();
            return res.json({ success: true, message: 'Recurring subscription authorization verified.', subscription: current });
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    } catch (error) {
        console.error('verifyProductSubscription error:', error);
        return res.status(500).json({ success: false, message: 'Unable to verify subscription authorization.' });
    }
};

const cancelSubscription = async (req, res) => {
    try {
        const subscription = await ProductSubscription.findOne({ where: { id: req.params.id, user_id: req.user.id } });
        if (!subscription) return res.status(404).json({ success: false, message: 'Subscription not found.' });
        if (['cancelled', 'completed', 'expired'].includes(subscription.status)) {
            return res.json({ success: true, message: 'Subscription is already inactive.', subscription });
        }

        const { reason = null } = req.body;
        const { isMock, instance } = await getRazorpayConfig();
        if (!isMock && subscription.razorpay_subscription_id) {
            await instance.subscriptions.cancel(subscription.razorpay_subscription_id, false);
        }
        subscription.status = 'cancelled';
        subscription.cancelled_at = new Date();
        subscription.cancel_reason = reason;
        await subscription.save();
        return res.json({ success: true, message: 'Product subscription cancelled.', subscription });
    } catch (error) {
        console.error('cancelProductSubscription error:', error);
        return res.status(500).json({ success: false, message: 'Unable to cancel product subscription.' });
    }
};

module.exports = { listSubscriptions, verifySubscription, cancelSubscription, mapRazorpayStatus };
