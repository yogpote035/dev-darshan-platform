import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Loader, Package } from 'lucide-react';
import { fetchOrderById } from '../services/productService';

const statusClasses = {
    paid: 'bg-emerald-500/10 text-emerald-400',
    confirmed: 'bg-emerald-500/10 text-emerald-400',
    failed: 'bg-red-500/10 text-red-400',
    cancelled: 'bg-red-500/10 text-red-400'
};

const OrderDetails = () => {
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadOrder = async () => {
            try {
                const response = await fetchOrderById(id);
                if (!response.success) throw new Error(response.message || 'Unable to load order.');
                setOrder(response.order);
            } catch (requestError) {
                setError(requestError.response?.data?.message || requestError.message || 'Unable to load order.');
            } finally {
                setLoading(false);
            }
        };

        loadOrder();
    }, [id]);

    if (loading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center gap-3 text-gray-400">
                <Loader size={24} className="animate-spin text-amber-500" />
                <span className="text-sm font-semibold">Loading order...</span>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="px-4 py-8">
                <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-8 text-center text-sm text-red-200">
                    {error || 'Order not found.'}
                    <Link to="/profile" className="mt-4 block font-bold text-amber-400">Back to profile</Link>
                </div>
            </div>
        );
    }

    const paymentLabel = order.payment_mode === 'subscription_offer' ? '₹1 offer' : 'Direct purchase';
    const paymentStatus = order.payment_status || 'pending';
    const orderStatus = order.order_status || 'pending';

    return (
        <div className="px-4 pb-24 pt-4 animate-fade-in-up">
            <div className="mb-5 flex items-center justify-between">
                <Link to="/profile" className="inline-flex items-center gap-2 text-sm text-gray-300">
                    <ArrowLeft size={16} /> Back to profile
                </Link>
                <Link to="/cart" className="text-xs font-bold text-amber-400">View cart</Link>
            </div>

            <div className="mb-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-500">Order details</p>
                <h1 className="mt-1 text-2xl font-black text-white">{order.order_number || `Order #${order.id}`}</h1>
                <p className="mt-1 text-xs text-gray-500">
                    {new Date(order.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Payment</span>
                    <p className={`mt-2 inline-block rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-wider ${statusClasses[paymentStatus] || 'bg-amber-500/10 text-amber-400'}`}>
                        {paymentStatus}
                    </p>
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Order status</span>
                    <p className={`mt-2 inline-block rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-wider ${statusClasses[orderStatus] || 'bg-amber-500/10 text-amber-400'}`}>
                        {orderStatus}
                    </p>
                </div>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-4">
                <div className="mb-4 flex items-center gap-2 text-sm font-bold text-white">
                    <Package size={16} className="text-amber-500" />
                    Items
                </div>
                <div className="space-y-3">
                    {(order.OrderItems || []).map((item) => (
                        <div key={item.id} className="flex items-center justify-between gap-3 border-b border-zinc-800/70 pb-3 text-sm">
                            <div className="min-w-0">
                                <p className="truncate font-semibold text-gray-200">{item.product_name}</p>
                                <p className="mt-1 text-xs text-gray-500">₹{Number(item.product_price || 0).toFixed(2)} x {item.quantity}</p>
                            </div>
                            <span className="shrink-0 font-bold text-amber-400">₹{Number(item.total || 0).toFixed(2)}</span>
                        </div>
                    ))}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-zinc-800 pt-3 text-base font-black text-white">
                    <span>Total</span>
                    <span className="text-amber-400">₹{Number(order.total_amount || 0).toFixed(2)}</span>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                    Payment option: {paymentLabel}
                    {order.payment_mode === 'subscription_offer' && ' · selected plan charge begins after 7 days'}
                </p>
            </div>
        </div>
    );
};

export default OrderDetails;
