import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useAds } from '../context/AdContext';
import { Sparkles, Check, Loader, CreditCard, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Subscription = () => {
  const { isAuthenticated, user, refreshUser } = useAuth();
  const { isPremium } = useAds();
  const navigate = useNavigate();

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(null); // stores plan_id being purchased
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load plans
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await API.get('/home/feed');
        if (response.data.success) {
          // Filter out Free plan (or list all, but display Free separately)
          setPlans(response.data.plans);
        }
      } catch (err) {
        console.error('Error fetching plans:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  // Inject Razorpay Checkout Script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const confirmPayment = async (paymentDetails, plan) => {
    try {
      return await API.post('/payments/verify', {
        ...paymentDetails,
        plan_id: plan.id
      });
    } catch (verificationError) {
      // Razorpay may have captured the money even when the first API request timed out.
      return API.post('/payments/recover', {
        razorpay_order_id: paymentDetails.razorpay_order_id,
        razorpay_payment_id: paymentDetails.razorpay_payment_id,
        plan_id: plan.id
      });
    }
  };

  const handleCheckout = async (plan) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (plan.price <= 0) {
      setError('You are already on the Free tier. Choose a premium plan to upgrade.');
      return;
    }

    setError('');
    setSuccess('');
    setCheckingOut(plan.id);

    try {
      // 1. Create order on backend
      const orderRes = await API.post('/payments/create-order', { plan_id: plan.id });
      if (!orderRes.data.success) {
        throw new Error(orderRes.data.message || 'Error creating order.');
      }

      const orderData = orderRes.data;

      // 2. If sandbox mock mode
      if (orderData.isMock) {
        setSuccess('Simulating sandbox checkout payment...');
        setTimeout(async () => {
          try {
            const verifyRes = await API.post('/payments/verify', {
              razorpay_order_id: orderData.order_id,
              razorpay_payment_id: `pay_mock_${Math.random().toString(36).substring(7)}`,
              plan_id: plan.id
            });
            if (verifyRes.data.success) {
              setSuccess('Subscription upgraded successfully! Enjoy ad-free premium broadcasts.');
              await refreshUser();
            } else {
              setError('Simulated verification failed.');
            }
          } catch (err) {
            setError('Error verifying simulated payment.');
          } finally {
            setCheckingOut(null);
          }
        }, 2000);
        return;
      }

      // 3. Real Razorpay Checkout
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setError('Failed to load Razorpay payment client. Please check your network.');
        setCheckingOut(null);
        return;
      }

      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Dev Darshan Live Platform',
        description: `${plan.plan_name} Plan Subscription`,
        order_id: orderData.order_id,
        handler: async (response) => {
          setCheckingOut(plan.id);
          try {
            const verifyRes = await confirmPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }, plan);

            if (verifyRes.data.success) {
              setSuccess('Payment successful! Your premium subscription is active.');
              await refreshUser();
            } else {
              setError('Payment verification failed.');
            }
          } catch (err) {
            setError('Error confirming payment status.');
          } finally {
            setCheckingOut(null);
          }
        },
        prefill: {
          name: user.full_name,
          contact: user.phone
        },
        theme: {
          color: '#d97706' // Amber Gold theme color for checkout window
        },
        modal: {
          ondismiss: () => {
            setCheckingOut(null);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', async (response) => {
        const errorDetails = response.error || {};
        if (errorDetails.reason !== 'order_already_paid') {
          setCheckingOut(null);
          setError(errorDetails.description || 'Payment could not be processed. Please try again.');
          return;
        }

        try {
          const recoveryRes = await API.post('/payments/recover', {
            razorpay_order_id: errorDetails.metadata?.order_id || orderData.order_id,
            razorpay_payment_id: errorDetails.metadata?.payment_id,
            plan_id: plan.id
          });

          if (recoveryRes.data.success) {
            setSuccess('Payment was received and your premium subscription is now active.');
            await refreshUser();
          } else {
            setError(recoveryRes.data.message || 'Payment was received but is still being confirmed.');
          }
        } catch (recoveryError) {
          setError('Payment was received, but confirmation is delayed. Please refresh your account shortly.');
        } finally {
          setCheckingOut(null);
        }
      });
      rzp.open();
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.response?.data?.message || 'Error processing checkout order.');
      setCheckingOut(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-gray-400">
        <Loader size={36} className="animate-spin text-amber-500" />
        <span className="text-sm font-semibold">Loading subscription plans...</span>
      </div>
    );
  }

  // Filter plans (Free vs Premium)
  const premiumPlans = plans.filter((p) => p.price > 0 && p.status === 1);
  const freePlan = plans.find((p) => p.price <= 0);

  return (
    <div className="px-4 pb-24 pt-4 animate-fade-in-up">
      {/* Title */}
      <div className="text-center mb-6">
        <span className="bg-amber-500/10 text-amber-500 text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border border-amber-500/15 inline-flex items-center gap-1 mb-2">
          <Sparkles size={10} className="fill-amber-500" />
          <span>Membership</span>
        </span>
        <h1 className="text-xl font-bold text-gray-100">Upgrade to Premium</h1>
        <p className="text-xs text-gray-400 mt-1 max-w-[280px] mx-auto">Get complete access to ad-free HD daily broadcasts and priorities.</p>
      </div>

      {/* Alerts */}
      {success && (
        <div className="flex items-start gap-2.5 bg-green-950/40 border border-green-500/20 text-green-300 p-3.5 rounded-xl mb-5 text-sm">
          <ShieldCheck size={18} className="shrink-0 mt-0.5 text-green-400" />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="flex items-start gap-2.5 bg-red-950/40 border border-red-500/20 text-red-300 p-3.5 rounded-xl mb-5 text-sm">
          <Loader size={18} className="shrink-0 mt-0.5 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Premium Perks Card */}
      <div className="glass-card rounded-2xl p-5 border border-amber-500/15 mb-6 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent">
        <h3 className="font-bold text-gray-200 text-sm mb-3.5 flex items-center gap-1.5">
          <Sparkles size={14} className="text-amber-500" />
          <span>Premium Gold Benefits</span>
        </h3>
        <ul className="space-y-2.5 text-xs text-gray-300">
          <li className="flex items-center gap-2">
            <Check size={14} className="text-amber-500 stroke-[3]" />
            <span>Ad-free viewing experience (no interstitial popups)</span>
          </li>
          <li className="flex items-center gap-2">
            <Check size={14} className="text-amber-500 stroke-[3]" />
            <span>Priority buffering speeds on high-load Aarti times</span>
          </li>
          <li className="flex items-center gap-2">
            <Check size={14} className="text-amber-500 stroke-[3]" />
            <span>Access to premium festival and Chardham feeds</span>
          </li>
          <li className="flex items-center gap-2">
            <Check size={14} className="text-amber-500 stroke-[3]" />
            <span>Support local temples directly with your membership</span>
          </li>
        </ul>
      </div>

      {/* Plans List */}
      <div className="space-y-4">
        {premiumPlans.map((plan) => {
          const isUserCurrentPlan = user && user.plan_id === plan.id && isPremium;
          const isChecking = checkingOut === plan.id;

          return (
            <div
              key={plan.id}
              className={`glass-card rounded-2xl p-5 border relative overflow-hidden transition-all duration-300 ${isUserCurrentPlan
                ? 'border-amber-500 shadow-md shadow-amber-500/5 bg-amber-500/[0.02]'
                : 'border-zinc-800'
                }`}
            >
              {isUserCurrentPlan && (
                <div className="absolute top-0 right-0 bg-amber-500 text-white text-[9px] font-extrabold px-3 py-1 rounded-bl-xl tracking-wider uppercase">
                  Active Plan
                </div>
              )}

              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-bold text-gray-100 text-base">{plan.plan_name}</h4>
                  <p className="text-[11px] text-gray-400 mt-0.5">{plan.duration_days} Days Validity</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-extrabold text-amber-500">₹{parseFloat(plan.price)}</span>
                </div>
              </div>

              <p className="text-[11px] text-gray-400 mb-4 leading-relaxed">{plan.description}</p>

              <button
                onClick={() => handleCheckout(plan)}
                disabled={isChecking || isUserCurrentPlan || (user && user.plan_id > plan.id && isPremium)}
                className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${isUserCurrentPlan
                  ? 'bg-zinc-800 text-gray-400 border border-zinc-700 cursor-default'
                  : isChecking
                    ? 'bg-zinc-900 border border-zinc-800 text-gray-400'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/10 hover:shadow-lg active:scale-98'
                  }`}
              >
                {isChecking ? (
                  <>
                    <Loader size={12} className="animate-spin text-amber-500" />
                    <span>Processing Payment...</span>
                  </>
                ) : isUserCurrentPlan ? (
                  <span>Currently Subscribed</span>
                ) : (
                  <>
                    <CreditCard size={14} />
                    <span>Subscribe Now</span>
                  </>
                )}
              </button>
            </div>
          );
        })}

        {/* Free Plan Reference */}
        {freePlan && (
          <div className="glass-card rounded-2xl p-4 border border-zinc-900 bg-zinc-950/20 text-center">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Standard Free Plan</h4>
            <p className="text-[10px] text-gray-500 mb-0.5">Free standard access with popup advertisements every 5 minutes.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Subscription;
