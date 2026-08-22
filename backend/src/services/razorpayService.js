const crypto = require('crypto');
const Razorpay = require('razorpay');
const { Setting } = require('../models');

const getRazorpayConfig = async () => {
    const settings = await Setting.findOne();
    const keyId = process.env.RAZORPAY_KEY_ID || settings?.razorpay_key_id || 'rzp_test_placeholder_key';
    const secret = process.env.RAZORPAY_SECRET || settings?.razorpay_secret || 'rzp_test_placeholder_secret';
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || settings?.razorpay_webhook_secret || 'rzp_test_placeholder_webhook_secret';
    const isMock = process.env.NODE_ENV === 'test' || keyId.includes('placeholder');

    return {
        isMock,
        keyId,
        secret,
        webhookSecret,
        instance: isMock ? null : new Razorpay({ key_id: keyId, key_secret: secret })
    };
};

const verifySignature = ({ payload, secret, signature }) => {
    if (!signature || !payload || !secret) return false;
    const generated = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

    try {
        return crypto.timingSafeEqual(
            Buffer.from(generated, 'hex'),
            Buffer.from(signature, 'hex')
        );
    } catch (_) {
        return false;
    }
};

const verifyOrderSignature = ({ orderId, paymentId, signature, secret }) => {
    if (!orderId || !paymentId || !signature || !secret) return false;
    const generated = crypto
        .createHmac('sha256', secret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

    try {
        return crypto.timingSafeEqual(Buffer.from(generated, 'hex'), Buffer.from(signature, 'hex'));
    } catch (_) {
        return false;
    }
};

module.exports = {
    getRazorpayConfig,
    verifySignature,
    verifyOrderSignature
};
