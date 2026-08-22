import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader, XCircle } from 'lucide-react';
import { cancelProductSubscription, fetchProductSubscriptions } from '../services/productService';

const MySubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const response = await fetchProductSubscriptions();
      if (response.success) setSubscriptions(response.subscriptions || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load subscriptions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSubscriptions(); }, []);

  const cancel = async (subscription) => {
    if (!window.confirm('Cancel this product subscription? Future recurring charges will stop.')) return;
    try {
      await cancelProductSubscription(subscription.id);
      await loadSubscriptions();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to cancel subscription.');
    }
  };

  if (loading) return <div className="flex min-h-[50vh] items-center justify-center gap-3 text-gray-400"><Loader size={24} className="animate-spin text-amber-500" /> Loading subscriptions...</div>;

  return (
    <div className="px-4 pb-24 pt-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-500">Store account</p>
      <h1 className="mt-1 text-2xl font-black text-white">My Subscriptions</h1>
      {error && <div className="mt-4 rounded-2xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}
      {!subscriptions.length ? (
        <div className="mt-5 rounded-3xl border border-zinc-800 bg-zinc-900/80 p-6 text-center text-gray-400">No product subscriptions yet. <Link to="/products" className="font-bold text-amber-400">Visit the store</Link></div>
      ) : (
        <div className="mt-5 space-y-3">
          {subscriptions.map((subscription) => {
            const inactive = ['cancelled', 'completed', 'expired', 'failed'].includes(subscription.status);
            return <article key={subscription.id} className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-4">
              <div className="flex items-start justify-between gap-3">
                <div><h2 className="font-black text-white">{subscription.Product?.name || 'Product subscription'}</h2><p className="mt-1 text-xs text-gray-400">Status: <span className="capitalize text-amber-300">{subscription.status}</span></p></div>
                {!inactive && <button onClick={() => cancel(subscription)} className="inline-flex items-center gap-1 rounded-xl border border-red-500/40 px-3 py-2 text-xs font-bold text-red-300"><XCircle size={14} /> Cancel</button>}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-gray-300"><p>₹{Number(subscription.initial_payment_amount || 0).toFixed(2)} paid today</p><p>₹{Number(subscription.recurring_amount || 0).toFixed(2)} per selected plan cycle</p><p>Trial: {subscription.trial_days || 0} days</p><p>Next billing: {subscription.next_charge_at ? new Date(subscription.next_charge_at).toLocaleDateString('en-IN') : 'Pending authorization'}</p></div>
              <p className="mt-3 break-all text-[10px] text-gray-500">Razorpay subscription: {subscription.razorpay_subscription_id || 'Pending'}</p>
            </article>;
          })}
        </div>
      )}
    </div>
  );
};

export default MySubscriptions;
