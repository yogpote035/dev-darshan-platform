import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchCart, previewOrder, createOrder, verifyOrderPayment, setupProductSubscription, verifyProductSubscription } from '../services/productService';

const deliveryFields = [
    { field: 'name', label: 'Full name', type: 'text', minLength: 2, maxLength: 80, autoComplete: 'name' },
    { field: 'mobile', label: 'Mobile number', type: 'tel', minLength: 10, maxLength: 13, inputMode: 'numeric', autoComplete: 'tel' },
    { field: 'address', label: 'Full address', type: 'text', minLength: 10, maxLength: 300, autoComplete: 'street-address' },
    { field: 'city', label: 'City', type: 'text', minLength: 2, maxLength: 80, autoComplete: 'address-level2' },
    { field: 'state', label: 'State', type: 'text', minLength: 2, maxLength: 80, autoComplete: 'address-level1' },
    { field: 'pincode', label: 'Pincode', type: 'text', minLength: 6, maxLength: 6, inputMode: 'numeric', pattern: '\\d{6}', autoComplete: 'postal-code' },
    { field: 'country', label: 'Country', type: 'text', minLength: 2, maxLength: 56, autoComplete: 'country-name' }
];

const validateDeliveryDetails = (shipping) => {
    const name = shipping.name.trim();
    const mobile = shipping.mobile.replace(/[\s-]/g, '');
    const address = shipping.address.trim();
    const city = shipping.city.trim();
    const state = shipping.state.trim();
    const pincode = shipping.pincode.trim();
    const country = shipping.country.trim();
    const errors = {};

    if (name.length < 2 || name.length > 80 || !/[A-Za-z\u00C0-\uFFFF]/.test(name)) errors.name = 'Enter a name from 2 to 80 characters.';
    if (!/^(?:\+91)?[6-9]\d{9}$/.test(mobile)) errors.mobile = 'Enter a valid 10-digit Indian mobile number.';
    if (address.length < 10 || address.length > 300) errors.address = 'Address must be 10 to 300 characters.';
    if (city.length < 2 || city.length > 80 || !/[A-Za-z\u00C0-\uFFFF]/.test(city)) errors.city = 'Enter a city from 2 to 80 characters.';
    if (state.length < 2 || state.length > 80 || !/[A-Za-z\u00C0-\uFFFF]/.test(state)) errors.state = 'Enter a state from 2 to 80 characters.';
    if (!/^\d{6}$/.test(pincode)) errors.pincode = 'Pincode must contain exactly 6 digits.';
    if (country.length < 2 || country.length > 56) errors.country = 'Country must be 2 to 56 characters.';
    return errors;
};

const Checkout = () => {
    const { user } = useAuth();
    const [cartItems, setCartItems] = useState([]);
    const [summary, setSummary] = useState(null);
    const [selectedMode, setSelectedMode] = useState('one_time');
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');
    const [recurringConsent, setRecurringConsent] = useState(false);
    const [shipping, setShipping] = useState({ name: '', mobile: '', address: '', city: '', state: '', pincode: '', country: 'India' });
    const [shippingErrors, setShippingErrors] = useState({});

    const loadRazorpayScript = () => new Promise((resolve) => {
        if (window.Razorpay) {
            resolve(true);
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });

    const openSubscriptionAuthorization = async (orderDetails) => {
        const setupResponse = await setupProductSubscription(orderDetails.id);
        if (!setupResponse.success || setupResponse.isMock) {
            return setupResponse;
        }

        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
            throw new Error('Failed to load recurring payment authorization.');
        }

        const razorpay = new window.Razorpay({
            key: setupResponse.key,
            subscription_id: setupResponse.subscriptionId,
            name: 'Dev Darshan Live Store',
            description: 'Authorize Dev Darshan Premium subscription',
            prefill: {
                name: user?.full_name || '',
                contact: user?.phone || ''
            },
            theme: { color: '#d97706' },
            handler: async (subscriptionPayment) => {
                try {
                    const verified = await verifyProductSubscription({
                        orderId: orderDetails.id,
                        razorpay_subscription_id: subscriptionPayment.razorpay_subscription_id || setupResponse.subscriptionId,
                        razorpay_payment_id: subscriptionPayment.razorpay_payment_id,
                        razorpay_signature: subscriptionPayment.razorpay_signature
                    });
                    if (!verified.success) throw new Error(verified.message || 'Subscription authorization verification failed.');
                    window.location.href = `/orders/${orderDetails.id}`;
                } catch (verificationError) {
                    setProcessing(false);
                    setError(verificationError.response?.data?.message || verificationError.message || 'Subscription authorization could not be verified.');
                }
            },
            modal: {
                ondismiss: () => setProcessing(false)
            }
        });
        razorpay.on('payment.failed', (paymentError) => {
            setProcessing(false);
            setError(paymentError.error?.description || 'Recurring authorization was not completed.');
        });
        razorpay.open();
        return setupResponse;
    };

    useEffect(() => {
        const load = async () => {
            try {
                const [cartResponse, previewResponse] = await Promise.all([fetchCart(), previewOrder()]);
                if (cartResponse.success) setCartItems(cartResponse.items || []);
                if (previewResponse.success) {
                    setSummary(previewResponse);
                    if (previewResponse.availablePaymentOptions?.includes('one_time')) {
                        setSelectedMode('one_time');
                    } else if (previewResponse.availablePaymentOptions?.includes('subscription_offer')) {
                        setSelectedMode('subscription_offer');
                    }
                }
            } catch (err) {
                setError(err.response?.data?.message || 'Unable to load checkout');
            } finally {
                setLoading(false);
            }
        };

        load();
    }, []);

    const handlePlaceOrder = async () => {
        try {
            setProcessing(true);
            setError('');

            if (selectedMode === 'subscription_offer' && !recurringConsent) {
                throw new Error('Please confirm that you understand the recurring subscription payment.');
            }
            const deliveryErrors = validateDeliveryDetails(shipping);
            if (Object.keys(deliveryErrors).length) {
                setShippingErrors(deliveryErrors);
                throw new Error('Please correct the highlighted delivery details before payment.');
            }

            const response = await createOrder({ paymentMode: selectedMode, recurringConsent, shipping });
            if (!response.success) {
                throw new Error(response.message || 'Unable to create the payment order.');
            }

            const orderDetails = response.order;
            if (response.isMock) {
                const verifyResponse = await verifyOrderPayment({
                    orderId: orderDetails?.id,
                    razorpay_order_id: response.orderId,
                    razorpay_payment_id: `mock_payment_${Date.now()}`,
                    razorpay_signature: 'mock_signature'
                });

                if (!verifyResponse.success) {
                    throw new Error(verifyResponse.message || 'Payment verification failed.');
                }

                alert('Order placed successfully. Automatic renewal requires live Razorpay authorization.');
                window.location.href = '/products';
                return;
            }

            const scriptLoaded = await loadRazorpayScript();
            if (!scriptLoaded) {
                throw new Error('Failed to load Razorpay payment client. Please check your network.');
            }

            const razorpay = new window.Razorpay({
                key: response.key,
                amount: response.amount,
                currency: response.currency,
                name: 'Dev Darshan Live Store',
                description: selectedMode === 'subscription_offer' ? 'Product offer purchase' : 'Product purchase',
                order_id: response.orderId,
                prefill: {
                    name: user?.full_name || '',
                    contact: user?.phone || ''
                },
                theme: { color: '#d97706' },
                handler: async (paymentResponse) => {
                    try {
                        const verifyResponse = await verifyOrderPayment({
                            orderId: orderDetails?.id,
                            razorpay_order_id: paymentResponse.razorpay_order_id,
                            razorpay_payment_id: paymentResponse.razorpay_payment_id,
                            razorpay_signature: paymentResponse.razorpay_signature
                        });

                        if (!verifyResponse.success) {
                            throw new Error(verifyResponse.message || 'Payment verification failed.');
                        }

                        if (selectedMode === 'subscription_offer') {
                            await openSubscriptionAuthorization(orderDetails);
                        } else {
                            alert('Order placed successfully.');
                            window.location.href = '/products';
                        }
                    } catch (verificationError) {
                        setError(verificationError.response?.data?.message || verificationError.message || 'Payment verification failed.');
                    } finally {
                        setProcessing(false);
                    }
                },
                modal: {
                    ondismiss: () => setProcessing(false)
                }
            });

            razorpay.on('payment.failed', (paymentError) => {
                setProcessing(false);
                setError(paymentError.error?.description || 'Payment could not be processed. Please try again.');
            });
            razorpay.open();
        } catch (err) {
            const resumeOrderId = err.response?.data?.resumeOrderId;
            if (err.response?.status === 409 && resumeOrderId) {
                try {
                    await openSubscriptionAuthorization({ id: resumeOrderId });
                    return;
                } catch (resumeError) {
                    setError(resumeError.response?.data?.message || resumeError.message || 'Unable to resume recurring authorization.');
                } finally {
                    setProcessing(false);
                }
                return;
            }
            setError(err.response?.data?.message || err.message || 'Checkout failed.');
            setProcessing(false);
        }
    };

    const orderTotal = selectedMode === 'subscription_offer' && summary?.offerSubtotal ? Number(summary.offerSubtotal) : Number(summary?.total || 0);

    if (loading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center gap-3 text-gray-400">
                <Loader size={24} className="animate-spin text-amber-500" />
                <span className="text-sm font-semibold">Loading checkout...</span>
            </div>
        );
    }

    if (!cartItems.length) {
        return (
            <div className="px-4 py-8">
                <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-8 text-center">
                    <h1 className="text-xl font-black text-white">Your cart is empty</h1>
                    <Link to="/products" className="mt-4 inline-block rounded-2xl bg-amber-500 px-4 py-2 text-sm font-bold text-zinc-950">Explore products</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="px-4 pb-24 pt-4 animate-fade-in-up">
            <div className="mb-4 flex items-center justify-between">
                <Link to="/cart" className="inline-flex items-center gap-2 text-sm text-gray-300">
                    <ArrowLeft size={16} /> Back to cart
                </Link>
            </div>

            <div className="mb-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-amber-500 font-bold">Checkout</p>
                <h1 className="text-2xl font-black text-white">Payment</h1>
            </div>

            {summary?.oneRupeeOfferAvailable && (
                <div className="mb-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-100">
                    Choose direct purchase for full product price, or ₹1 offer for the first charge with the selected plan amount after 7 days.
                </div>
            )}

            {selectedMode === 'subscription_offer' && (
                <div className="mb-5 rounded-3xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-50">
                    <p className="font-black text-amber-300">₹1 introductory product offer</p>
                    <div className="mt-3 space-y-1 text-xs leading-5 text-amber-100">
                        <p><span className="font-bold">Today:</span> ₹{Number(summary?.offerSubtotal || 1).toFixed(2)}</p>
                        <p><span className="font-bold">Introductory period:</span> {summary?.products?.[0]?.product?.subscription_trial_days || 7} days</p>
                        <p><span className="font-bold">Then:</span> ₹{Number(summary?.products?.[0]?.recurringAmount || 0).toFixed(2)} each selected plan cycle, charged until you cancel.</p>
                        <p><span className="font-bold">First recurring charge:</span> after the {summary?.products?.[0]?.product?.subscription_trial_days || 7}-day introductory period.</p>
                        <p className="pt-1 text-amber-200"><span className="font-bold">Razorpay Autopay:</span> Razorpay can show a separate refundable authorization hold when you approve the mandate. That hold is not the ₹1 product charge or the monthly subscription amount; the Razorpay mandate screen shows its exact amount.</p>
                    </div>
                    <label className="mt-4 flex items-start gap-3 text-xs text-amber-50">
                        <input type="checkbox" checked={recurringConsent} onChange={(event) => setRecurringConsent(event.target.checked)} className="mt-0.5 h-4 w-4 accent-amber-500" />
                        <span>I understand and authorize the recurring subscription payment after the introductory period. A successful renewal activates my selected Premium plan. I can cancel from My Subscriptions.</span>
                    </label>
                </div>
            )}

            {summary?.availablePaymentOptions && (
                <div className="mb-5 space-y-3 rounded-3xl border border-zinc-800 bg-zinc-900/80 p-4">
                    {summary.availablePaymentOptions.map((mode) => (
                        <button
                            key={mode}
                            type="button"
                            onClick={() => setSelectedMode(mode)}
                            className={`w-full rounded-2xl border px-3 py-3 text-left ${selectedMode === mode ? 'border-amber-500 bg-amber-500/10' : 'border-zinc-700 bg-zinc-950/60'}`}
                        >
                            <div className="flex items-center justify-between text-sm font-bold text-white">
                                <span>{mode === 'subscription_offer' ? '₹1 Offer + Premium plan after 7 days' : 'Direct purchase'}</span>
                                <span>₹{Number(mode === 'subscription_offer' && summary.offerSubtotal ? summary.offerSubtotal : summary.total || 0).toFixed(2)}</span>
                            </div>
                            <div className="mt-1 text-xs text-gray-400">
                                {mode === 'subscription_offer' ? '₹1 charged now, then the selected Premium plan amount after 7 days. Razorpay may show a separate refundable mandate authorization.' : 'Pay full product amount now'}
                            </div>
                        </button>
                    ))}
                </div>
            )}

            <div className="mb-5 rounded-3xl border border-zinc-800 bg-zinc-900/80 p-4">
                <h2 className="text-sm font-black text-white">Delivery details</h2>
                <div className="mt-3 grid gap-3">
                    {deliveryFields.map(({ field, label, ...inputProps }) => (
                        <div key={field}>
                            <label htmlFor={`shipping-${field}`} className="mb-1 block text-xs font-semibold text-gray-300">{label}</label>
                            <input
                                id={`shipping-${field}`}
                                name={field}
                                required
                                value={shipping[field]}
                                onChange={(event) => {
                                    const value = event.target.value;
                                    setShipping((current) => ({ ...current, [field]: value }));
                                    setShippingErrors((current) => ({ ...current, [field]: undefined }));
                                }}
                                placeholder={label}
                                aria-invalid={Boolean(shippingErrors[field])}
                                className={`w-full rounded-xl border bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-amber-500 ${shippingErrors[field] ? 'border-red-500' : 'border-zinc-700'}`}
                                {...inputProps}
                            />
                            {shippingErrors[field] && <p className="mt-1 text-xs text-red-300">{shippingErrors[field]}</p>}
                        </div>
                    ))}
                </div>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-4">
                <div className="mb-2 flex items-center justify-between text-sm text-gray-300">
                    <span>Products</span>
                    <span>₹{Number(summary?.subtotal || 0).toFixed(2)}</span>
                </div>
                <div className="mb-2 flex items-center justify-between text-sm text-gray-300">
                    <span>Selected option</span>
                    <span>{selectedMode === 'subscription_offer' ? '₹1 offer' : 'Direct purchase'}</span>
                </div>
                <div className="border-t border-zinc-800 pt-3 text-base font-black text-white flex items-center justify-between">
                    <span>Total</span>
                    <span>₹{Number(orderTotal).toFixed(2)}</span>
                </div>
            </div>

            {error && (
                <div className="mt-4 rounded-2xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>
            )}

            <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={processing}
                className="mt-5 w-full rounded-2xl bg-amber-500 px-4 py-3 text-sm font-bold text-zinc-950 disabled:opacity-60"
            >
                {processing ? 'Processing...' : selectedMode === 'subscription_offer' ? 'Get Product for ₹1' : 'Pay Now'}
            </button>
        </div>
    );
};

export default Checkout;
