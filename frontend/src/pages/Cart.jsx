import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, Loader } from 'lucide-react';
import { fetchCart, updateCartItem, removeCartItem, clearCart } from '../services/productService';
import { getImageUrl } from '../utils/imageHelper';

const Cart = () => {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadCart = async () => {
        try {
            const response = await fetchCart();
            if (response.success) setItems(response.items || []);
        } catch (error) {
            if (error.response?.status === 401) {
                navigate('/login');
                return;
            }
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCart();
    }, []);

    const adjustQuantity = async (itemId, delta) => {
        const item = items.find((entry) => entry.id === itemId);
        if (!item) return;
        const nextQty = Number(item.quantity) + delta;
        if (nextQty <= 0) {
            await removeCartItem(itemId);
            setItems((prev) => prev.filter((entry) => entry.id !== itemId));
            return;
        }

        await updateCartItem(itemId, nextQty);
        setItems((prev) => prev.map((entry) => entry.id === itemId ? { ...entry, quantity: nextQty, itemTotal: entry.price * nextQty } : entry));
    };

    const onRemove = async (itemId) => {
        await removeCartItem(itemId);
        setItems((prev) => prev.filter((entry) => entry.id !== itemId));
    };

    const onClear = async () => {
        await clearCart();
        setItems([]);
    };

    const subtotal = items.reduce((sum, item) => sum + item.itemTotal, 0);

    if (loading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center gap-3 text-gray-400">
                <Loader size={24} className="animate-spin text-amber-500" />
                <span className="text-sm font-semibold">Loading cart...</span>
            </div>
        );
    }

    if (!items.length) {
        return (
            <div className="px-4 py-8">
                <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-8 text-center">
                    <ShoppingBag size={32} className="mx-auto mb-3 text-amber-500" />
                    <h1 className="text-xl font-black text-white">Your cart is empty</h1>
                    <p className="mt-2 text-sm text-gray-400">Browse the store and add a few spiritual essentials.</p>
                    <Link to="/products" className="mt-4 inline-block rounded-2xl bg-amber-500 px-4 py-2 text-sm font-bold text-zinc-950">
                        Explore products
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="px-4 pb-24 pt-4 animate-fade-in-up">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-amber-500 font-bold">Cart</p>
                    <h1 className="text-2xl font-black text-white">Your Items</h1>
                </div>
                <button type="button" onClick={onClear} className="text-xs font-bold text-red-400">Clear all</button>
            </div>

            <div className="space-y-3">
                {items.map((item) => (
                    <div key={item.id} className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-3">
                        <div className="flex gap-3">
                            <img src={getImageUrl(item.product.image)} alt={item.product.name} className="h-20 w-20 rounded-2xl object-cover" />
                            <div className="flex-1">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <h2 className="text-sm font-bold text-white">{item.product.name}</h2>
                                        <p className="text-xs text-gray-400">₹{Number(item.price || 0).toFixed(2)} each</p>
                                    </div>
                                    <button type="button" onClick={() => onRemove(item.id)} className="text-red-400">
                                        <Trash2 size={14} />
                                    </button>
                                </div>

                                <div className="mt-3 flex items-center justify-between">
                                    <div className="flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-950 px-2 py-1">
                                        <button type="button" onClick={() => adjustQuantity(item.id, -1)} className="text-gray-200"><Minus size={14} /></button>
                                        <span className="min-w-6 text-center text-sm font-bold text-white">{item.quantity}</span>
                                        <button type="button" onClick={() => adjustQuantity(item.id, 1)} className="text-gray-200"><Plus size={14} /></button>
                                    </div>
                                    <div className="text-sm font-black text-amber-400">₹{Number(item.itemTotal || 0).toFixed(2)}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-5 rounded-3xl border border-zinc-800 bg-zinc-900/80 p-4">
                <div className="mb-2 flex items-center justify-between text-sm text-gray-300">
                    <span>Subtotal</span>
                    <span>₹{Number(subtotal || 0).toFixed(2)}</span>
                </div>
                <div className="mb-4 flex items-center justify-between text-sm text-gray-300">
                    <span>Delivery</span>
                    <span>Free</span>
                </div>
                <div className="flex items-center justify-between border-t border-zinc-800 pt-3 text-base font-black text-white">
                    <span>Total</span>
                    <span>₹{Number(subtotal || 0).toFixed(2)}</span>
                </div>

                <Link to="/checkout" className="mt-4 block rounded-2xl bg-amber-500 px-4 py-3 text-center text-sm font-bold text-zinc-950">
                    Proceed to Checkout
                </Link>
            </div>
        </div>
    );
};

export default Cart;
