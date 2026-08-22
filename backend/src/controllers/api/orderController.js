const crypto = require('crypto');
const { Op } = require('sequelize');
const { sequelize, CartItem, Product, Order, OrderItem, Payment, ProductSubscription, SubscriptionPlan, User } = require('../../models');
const { getRazorpayConfig, verifyOrderSignature } = require('../../services/razorpayService');

const toNumber = (value) => Number(value || 0);
const createOrderNumber = () => `DD-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;

const isEligibleOfferProduct = (product) => (
    product
    && !!product.active
    && Number(product.stock || 0) > 0
    && !!product.allow_one_rupee_offer
    && !!product.subscription_enabled
    && !!product.subscription_plan_id
    && Number(product.subscription_amount || 0) > 0
);

const getPlanBillingSchedule = (plan) => {
    const durationDays = Number(plan?.duration_days || 0);
    if (durationDays === 30) return { period: 'monthly', interval: 1 };
    if (durationDays === 90) return { period: 'monthly', interval: 3 };
    if (durationDays === 365 || durationDays === 366) return { period: 'yearly', interval: 1 };
    return null;
};

const validateShipping = (shipping = {}) => {
    const name = String(shipping.name || '').trim();
    const mobile = String(shipping.mobile || '').replace(/[\s-]/g, '');
    const address = String(shipping.address || '').trim();
    const city = String(shipping.city || '').trim();
    const state = String(shipping.state || '').trim();
    const pincode = String(shipping.pincode || '').trim();
    const country = String(shipping.country || 'India').trim();

    if (name.length < 2 || name.length > 80 || !/[A-Za-z\u00C0-\uFFFF]/.test(name)) return 'Full name must be 2 to 80 characters and include a letter.';
    if (!/^(?:\+91)?[6-9]\d{9}$/.test(mobile)) return 'Enter a valid 10-digit Indian mobile number.';
    if (address.length < 10 || address.length > 300) return 'Full address must be 10 to 300 characters.';
    if (city.length < 2 || city.length > 80 || !/[A-Za-z\u00C0-\uFFFF]/.test(city)) return 'City must be 2 to 80 characters and include a letter.';
    if (state.length < 2 || state.length > 80 || !/[A-Za-z\u00C0-\uFFFF]/.test(state)) return 'State must be 2 to 80 characters and include a letter.';
    if (!/^\d{6}$/.test(pincode)) return 'Pincode must be exactly 6 digits.';
    if (country.length < 2 || country.length > 56) return 'Country must be 2 to 56 characters.';
    return null;
};

const getCartSummary = async (userId) => {
    const items = await CartItem.findAll({
        where: { user_id: userId },
        include: [{ model: Product }],
        order: [['created_at', 'DESC']]
    });

    const productList = items.map((entry) => {
        const product = entry.Product;
        const quantity = Number(entry.quantity || 0);
        const unitPrice = toNumber(product.price);
        const offerFirstCharge = !!product.allow_one_rupee_offer && !!product.subscription_enabled ? Number(product.one_rupee_price || 1) : null;
        const recurringAmount = product.subscription_amount ? Number(product.subscription_amount) : null;
        const directTotal = Number((unitPrice * quantity).toFixed(2));
        const offerTotal = offerFirstCharge !== null ? Number((offerFirstCharge * quantity).toFixed(2)) : directTotal;

        return {
            id: product.id,
            name: product.name,
            quantity,
            price: unitPrice,
            directTotal,
            offerFirstCharge,
            recurringAmount,
            total: offerFirstCharge !== null ? offerTotal : directTotal,
            product
        };
    });

    const subtotal = productList.reduce((sum, item) => sum + item.directTotal, 0);
    const offerSubtotal = productList.reduce((sum, item) => sum + (item.offerFirstCharge !== null ? Number((item.offerFirstCharge * item.quantity).toFixed(2)) : item.directTotal), 0);
    return {
        items: productList,
        subtotal: Number(subtotal.toFixed(2)),
        total: Number(subtotal.toFixed(2)),
        offerSubtotal: Number(offerSubtotal.toFixed(2))
    };
};

const listUserOrders = async (req, res) => {
    try {
        const orders = await Order.findAll({
            where: { user_id: req.user.id },
            include: [{ model: OrderItem }],
            order: [['created_at', 'DESC']]
        });

        return res.status(200).json({
            success: true,
            orders
        });
    } catch (error) {
        console.error('listUserOrders error:', error);
        return res.status(500).json({ success: false, message: 'Server error loading orders.' });
    }
};

const getUserOrder = async (req, res) => {
    try {
        const order = await Order.findOne({
            where: { id: req.params.id, user_id: req.user.id },
            include: [{ model: OrderItem }]
        });

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found.' });
        }

        return res.status(200).json({ success: true, order });
    } catch (error) {
        console.error('getUserOrder error:', error);
        return res.status(500).json({ success: false, message: 'Server error loading order.' });
    }
};

const setupProductSubscription = async (req, res) => {
    try {
        const { getRazorpayConfig } = require('../../services/razorpayService');
        const order = await Order.findOne({
            where: { id: req.params.id, user_id: req.user.id, payment_status: 'paid', payment_mode: 'subscription_offer' },
            include: [{ model: OrderItem }]
        });

        if (!order) {
            return res.status(404).json({ success: false, message: 'Paid offer order not found.' });
        }

        const subscriptionRecords = await ProductSubscription.findAll({ where: { order_id: order.id } });
        if (!subscriptionRecords.length) {
            return res.status(400).json({ success: false, message: 'No recurring product subscription was found for this order.' });
        }

        const { isMock, instance } = await getRazorpayConfig();
        if (isMock) {
            return res.status(200).json({ success: true, isMock: true, message: 'Recurring authorization is unavailable in mock mode.' });
        }

        const productSubscription = subscriptionRecords[0];
        const product = await Product.findByPk(productSubscription.product_id);
        const appPlan = product?.subscription_plan_id ? await SubscriptionPlan.findByPk(product.subscription_plan_id) : null;
        const billingSchedule = getPlanBillingSchedule(appPlan);
        if (!product || !product.subscription_enabled || !appPlan || appPlan.status !== 1 || Number(appPlan.price || 0) <= 0 || !billingSchedule) {
            return res.status(400).json({
                success: false,
                message: 'Select an active Monthly (30-day), Quarterly (90-day), or Yearly (365-day) app plan for this product offer.'
            });
        }

        // A product offer has its own reusable Razorpay plan, but its price and
        // billing interval must exactly match the selected Dev Darshan app plan.
        let razorpayPlanId = product.razorpay_plan_id;
        if (!razorpayPlanId) {
            const recurringAmount = Number(appPlan.price);

            const razorpayPlan = await instance.plans.create({
                period: billingSchedule.period,
                interval: billingSchedule.interval,
                item: {
                    name: `${appPlan.plan_name} Premium via ${product.name}`,
                    amount: Math.round(recurringAmount * 100),
                    currency: 'INR',
                    description: `${appPlan.plan_name} Dev Darshan Premium subscription after the product offer`
                }
            });
            razorpayPlanId = razorpayPlan.id;
            product.razorpay_plan_id = razorpayPlanId;
            await product.save();
        }

        if (productSubscription.razorpay_subscription_id) {
            if (productSubscription.razorpay_plan_id === razorpayPlanId) {
                return res.status(200).json({
                    success: true,
                    subscriptionId: productSubscription.razorpay_subscription_id,
                    key: (await getRazorpayConfig()).keyId,
                    message: 'Recurring authorization is already pending or active.'
                });
            }

            // A failed/stale authorization made against an older plan must not
            // keep presenting a different recurring amount to the customer.
            await instance.subscriptions.cancel(productSubscription.razorpay_subscription_id, false);
            productSubscription.razorpay_subscription_id = null;
            productSubscription.razorpay_plan_id = null;
            productSubscription.status = 'pending';
            await productSubscription.save();
        }

        const startAt = Math.floor((Date.now() + (Number(productSubscription.trial_days || 7) * 24 * 60 * 60 * 1000)) / 1000);
        const razorpaySubscription = await instance.subscriptions.create({
            plan_id: razorpayPlanId,
            total_count: 12,
            start_at: startAt,
            customer_notify: true,
            notes: {
                order_id: String(order.id),
                user_id: String(req.user.id),
                product_id: String(productSubscription.product_id)
            }
        });

        productSubscription.razorpay_subscription_id = razorpaySubscription.id;
        productSubscription.razorpay_plan_id = razorpayPlanId;
        productSubscription.recurring_amount = Number(appPlan.price);
        productSubscription.status = 'pending';
        await productSubscription.save();

        return res.status(200).json({
            success: true,
            subscriptionId: razorpaySubscription.id,
            key: (await getRazorpayConfig()).keyId,
            message: 'Authorize recurring payments to enable the charge after 7 days.'
        });
    } catch (error) {
        console.error('setupProductSubscription error:', error);
        return res.status(500).json({ success: false, message: 'Unable to set up recurring payment authorization.' });
    }
};

const previewOrder = async (req, res) => {
    try {
        const userId = req.user.id;
        const summary = await getCartSummary(userId);

        if (!summary.items.length) {
            return res.status(400).json({ success: false, message: 'Your cart is empty.' });
        }

        const offerItem = summary.items.length === 1 ? summary.items[0] : null;
        const hasOffer = !!offerItem
            && offerItem.quantity === 1
            && isEligibleOfferProduct(offerItem.product);

        return res.status(200).json({
            success: true,
            products: summary.items,
            subtotal: summary.subtotal,
            total: summary.total,
            offerSubtotal: summary.offerSubtotal,
            availablePaymentOptions: ['one_time', ...(hasOffer ? ['subscription_offer'] : [])],
            oneRupeeOfferAvailable: hasOffer,
            message: hasOffer
                ? 'Choose direct purchase for the full product amount, or a ₹1 introductory offer followed by the disclosed recurring plan amount.'
                : 'Choose direct purchase for the full product amount.'
        });
    } catch (error) {
        console.error('previewOrder error:', error);
        return res.status(500).json({ success: false, message: 'Server error previewing order.' });
    }
};

const createOrderForPayment = async (req, res) => {
    try {
        const userId = req.user.id;
        const { paymentMode = 'one_time', shipping = {}, recurringConsent = false } = req.body;

        if (!['one_time', 'subscription_offer'].includes(paymentMode)) {
            return res.status(400).json({ success: false, message: 'Invalid payment mode.' });
        }

        const shippingValidationError = validateShipping(shipping);
        if (shippingValidationError) return res.status(400).json({ success: false, message: shippingValidationError });

        const cart = await CartItem.findAll({ where: { user_id: userId }, include: [{ model: Product }] });
        if (!cart.length) {
            return res.status(400).json({ success: false, message: 'Cart is empty.' });
        }

        if (paymentMode === 'subscription_offer') {
            if (cart.length !== 1 || Number(cart[0].quantity || 0) !== 1 || !isEligibleOfferProduct(cart[0].Product)) {
                return res.status(400).json({ success: false, message: 'The ₹1 offer is available for one eligible product at a time.' });
            }
            if (recurringConsent !== true) {
                return res.status(400).json({ success: false, message: 'You must explicitly authorize the disclosed recurring payment to use the ₹1 offer.' });
            }
            const claimedOffer = await ProductSubscription.findOne({
                where: {
                    user_id: userId,
                    product_id: cart[0].product_id,
                    status: { [Op.notIn]: ['failed', 'expired'] }
                },
                order: [['created_at', 'DESC']]
            });
            if (claimedOffer) {
                const resumable = claimedOffer.status === 'pending' && claimedOffer.razorpay_subscription_id;
                return res.status(409).json({
                    success: false,
                    message: resumable
                        ? 'Your ₹1 offer is already paid. Continue the pending recurring-payment authorization.'
                        : 'This introductory offer has already been used for this product.',
                    resumeOrderId: resumable ? claimedOffer.order_id : null
                });
            }
        }

        let subtotal = 0;
        const orderItems = [];

        for (const entry of cart) {
            const product = entry.Product;
            if (!product || !product.active) {
                return res.status(400).json({ success: false, message: `Product ${entry.product_id} is unavailable.` });
            }
            if (Number(product.stock || 0) < Number(entry.quantity || 0)) {
                return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name}.` });
            }

            const quantity = Number(entry.quantity || 0);
            const unitPrice = toNumber(product.price);
            const directTotal = Number((unitPrice * quantity).toFixed(2));
            const offerFirstCharge = isEligibleOfferProduct(product) ? Number(product.one_rupee_price || 1) : null;
            const offerTotal = offerFirstCharge !== null ? Number((offerFirstCharge * quantity).toFixed(2)) : directTotal;
            subtotal += paymentMode === 'subscription_offer' && offerFirstCharge !== null ? offerTotal : directTotal;
            orderItems.push({
                product_id: product.id,
                product_name: product.name,
                product_price: paymentMode === 'subscription_offer' && offerFirstCharge !== null ? offerFirstCharge : unitPrice,
                quantity,
                total: paymentMode === 'subscription_offer' && offerFirstCharge !== null ? offerTotal : directTotal
            });
        }

        const totalAmount = Number(subtotal.toFixed(2));
        const orderNumber = createOrderNumber();

        const order = await Order.create({
            user_id: userId,
            order_number: orderNumber,
            subtotal: totalAmount,
            discount: 0,
            total_amount: totalAmount,
            payment_amount: totalAmount,
            payment_mode: paymentMode,
            order_type: paymentMode === 'subscription_offer' ? 'one_rupee_offer' : 'normal_purchase',
            payment_status: 'pending',
            order_status: 'pending',
            shipping_name: shipping.name || null,
            shipping_mobile: shipping.mobile || null,
            shipping_address: shipping.address || null,
            shipping_city: shipping.city || null,
            shipping_state: shipping.state || null,
            shipping_pincode: shipping.pincode || null,
            shipping_country: shipping.country || 'India'
        });

        for (const item of orderItems) {
            await OrderItem.create({
                order_id: order.id,
                product_id: item.product_id,
                product_name: item.product_name,
                product_price: item.product_price,
                quantity: item.quantity,
                total: item.total
            });
        }

        const { isMock, keyId, instance } = await getRazorpayConfig();
        const amountInPaise = Math.round(totalAmount * 100);

        if (isMock) {
            const mockOrderId = `order_mock_${Date.now()}`;
            order.razorpay_order_id = mockOrderId;
            await order.save();
            return res.status(200).json({
                success: true,
                isMock: true,
                key: 'mock_key_id',
                orderId: mockOrderId,
                amount: amountInPaise,
                currency: 'INR',
                order,
                orderNumber,
                message: 'Mock Razorpay order created.'
            });
        }

        const razorpayOrder = await instance.orders.create({
            amount: amountInPaise,
            currency: 'INR',
            receipt: `order_${order.id}`
        });

        order.razorpay_order_id = razorpayOrder.id;
        await order.save();

        return res.status(200).json({
            success: true,
            isMock: false,
            key: keyId,
            orderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            order,
            orderNumber,
            message: 'Order created. Complete payment to confirm.'
        });
    } catch (error) {
        console.error('createOrderForPayment error:', error);
        return res.status(500).json({ success: false, message: 'Server error creating order.' });
    }
};

const verifyOrderPayment = async (req, res) => {
    try {
        const userId = req.user.id;
        const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ success: false, message: 'Missing payment verification data.' });
        }

        const order = await Order.findOne({ where: { id: orderId, user_id: userId }, include: [{ model: OrderItem }] });
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found.' });
        }

        if (order.razorpay_order_id && order.razorpay_order_id !== razorpay_order_id) {
            return res.status(400).json({ success: false, message: 'Payment order does not match this product order.' });
        }

        if (order.payment_status === 'paid' && order.razorpay_payment_id === razorpay_payment_id) {
            return res.status(200).json({ success: true, message: 'Order already processed.', order });
        }
        if (order.payment_status === 'paid') {
            return res.status(409).json({ success: false, message: 'This product order has already been paid with a different payment.' });
        }

        const { isMock, secret, instance } = await getRazorpayConfig();
        let valid = false;

        if (isMock) {
            valid = razorpay_order_id.startsWith('order_mock_');
        } else {
            valid = verifyOrderSignature({
                orderId: razorpay_order_id,
                paymentId: razorpay_payment_id,
                signature: razorpay_signature,
                secret
            });
            if (!valid) {
                order.payment_status = 'failed';
                order.order_status = 'cancelled';
                await order.save();
                return res.status(400).json({ success: false, message: 'Payment verification failed: invalid signature.' });
            }

            const razorpayPayment = await instance.payments.fetch(razorpay_payment_id);
            const expectedAmount = Math.round(Number(order.total_amount) * 100);
            if (!razorpayPayment || razorpayPayment.order_id !== razorpay_order_id || razorpayPayment.status !== 'captured' || Number(razorpayPayment.amount) !== expectedAmount || razorpayPayment.currency !== 'INR') {
                return res.status(400).json({ success: false, message: 'Payment not captured by Razorpay.' });
            }
        }

        const transaction = await sequelize.transaction();
        try {
            const updatedOrder = await Order.findByPk(order.id, { transaction, include: [{ model: OrderItem }] });
            if (updatedOrder.payment_status === 'paid' && updatedOrder.razorpay_payment_id === razorpay_payment_id) {
                await transaction.commit();
                return res.status(200).json({ success: true, message: 'Order already processed.', order: updatedOrder });
            }
            if (updatedOrder.payment_status === 'paid') {
                await transaction.rollback();
                return res.status(409).json({ success: false, message: 'This product order has already been paid with a different payment.' });
            }

            updatedOrder.razorpay_order_id = razorpay_order_id;
            updatedOrder.razorpay_payment_id = razorpay_payment_id;
            updatedOrder.razorpay_signature = razorpay_signature;
            updatedOrder.payment_status = 'paid';
            updatedOrder.order_status = 'confirmed';
            await updatedOrder.save({ transaction });

            for (const item of updatedOrder.OrderItems || []) {
                const product = await Product.findByPk(item.product_id, { transaction });
                if (product) {
                    await product.update({ stock: Math.max(0, Number(product.stock || 0) - Number(item.quantity || 0)) }, { transaction });
                }
            }

            await CartItem.destroy({ where: { user_id: userId }, transaction });

            await Payment.create({
                user_id: userId,
                amount: updatedOrder.total_amount,
                payment_type: updatedOrder.payment_mode === 'subscription_offer' ? 'product_subscription_offer' : 'product',
                payment_method: 'razorpay',
                payment_status: 'success',
                razorpay_order_id: razorpay_order_id,
                razorpay_payment_id: razorpay_payment_id,
                razorpay_signature: razorpay_signature,
                order_id: updatedOrder.id
            }, { transaction });

            if (updatedOrder.payment_mode === 'subscription_offer') {
                for (const item of updatedOrder.OrderItems || []) {
                    const product = await Product.findByPk(item.product_id, { transaction });
                    if (product && product.subscription_plan_id && product.subscription_enabled) {
                        const subscriptionPlan = await SubscriptionPlan.findByPk(product.subscription_plan_id, { transaction });
                        const recurringAmount = Number(subscriptionPlan?.price || 0);
                        await ProductSubscription.create({
                            user_id: userId,
                            order_id: updatedOrder.id,
                            product_id: product.id,
                            initial_payment_amount: item.total,
                            recurring_amount: recurringAmount,
                            trial_days: product.subscription_trial_days || 7,
                            trial_start_at: new Date(),
                            trial_end_at: new Date(Date.now() + (Number(product.subscription_trial_days || 7) * 24 * 60 * 60 * 1000)),
                            first_charge_at: new Date(Date.now() + (Number(product.subscription_trial_days || 7) * 24 * 60 * 60 * 1000)),
                            next_charge_at: new Date(Date.now() + (Number(product.subscription_trial_days || 7) * 24 * 60 * 60 * 1000)),
                            status: 'pending',
                            subscription_start_at: new Date(),
                            razorpay_plan_id: subscriptionPlan?.razorpay_plan_id || null,
                            currency: 'INR'
                        }, { transaction });
                    }
                }
            }

            await transaction.commit();
            return res.status(200).json({ success: true, message: 'Payment verified and order confirmed.', order: updatedOrder });
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    } catch (error) {
        console.error('verifyOrderPayment error:', error);
        return res.status(500).json({ success: false, message: 'Server error verifying payment.' });
    }
};

module.exports = {
    listUserOrders,
    getUserOrder,
    setupProductSubscription,
    previewOrder,
    createOrderForPayment,
    verifyOrderPayment,
    getPlanBillingSchedule
};
