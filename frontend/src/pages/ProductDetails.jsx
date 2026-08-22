import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Loader } from 'lucide-react';
import { fetchProductById, addToCart } from '../services/productService';
import { getImageUrl } from '../utils/imageHelper';

const ProductDetails = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const response = await fetchProductById(id);
                if (response.success) setProduct(response.product);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [id]);

    const handleAddToCart = async () => {
        try {
            await addToCart(product.id, 1);
            alert('Product added to cart.');
        } catch (error) {
            if (error.response?.status === 401) {
                navigate('/login');
                return;
            }
            alert(error.response?.data?.message || 'Unable to add the product.');
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center gap-3 text-gray-400">
                <Loader size={24} className="animate-spin text-amber-500" />
                <span className="text-sm font-semibold">Loading product...</span>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="px-4 py-8">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 text-center text-gray-400">
                    Product not found.
                </div>
            </div>
        );
    }

    return (
        <div className="px-4 pb-24 pt-4 animate-fade-in-up">
            <div className="mb-4 flex items-center justify-between">
                <Link to="/products" className="inline-flex items-center gap-2 text-sm text-gray-300">
                    <ArrowLeft size={16} />
                    Back to Store
                </Link>
            </div>

            <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/80">
                <img src={getImageUrl(product.image)} alt={product.name} className="h-72 w-full object-cover" />
                <div className="space-y-4 p-4">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.2em] text-amber-500 font-bold">{product.category?.name || 'Product'}</p>
                            <h1 className="mt-2 text-2xl font-black text-white">{product.name}</h1>
                        </div>
                        {product.featured && <span className="rounded-full bg-amber-500 px-2 py-1 text-[10px] font-bold text-zinc-950">Featured</span>}
                    </div>

                    <div className="text-3xl font-black text-amber-400">₹{Number(product.price || 0).toFixed(2)}</div>

                    {product.isOfferAvailable && (
                        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
                            Special ₹1 today offer available with a {product.trialDays || 7}-day trial and then ₹{Number(product.monthlyAmount || 0).toFixed(2)}/month.
                        </div>
                    )}

                    <p className="text-sm text-gray-300">{product.short_description || 'A premium devotional item curated for daily spiritual practice.'}</p>

                    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-3 text-sm text-gray-300">
                        <div className="mb-2 font-bold text-white">About this product</div>
                        <div className="whitespace-pre-line">{product.description || 'No description available.'}</div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={handleAddToCart}
                            disabled={Number(product.stock || 0) <= 0}
                            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-amber-500 px-4 py-3 font-bold text-zinc-950 disabled:opacity-50"
                        >
                            <ShoppingCart size={18} />
                            Add to Cart
                        </button>
                        <Link to="/cart" className="rounded-2xl border border-zinc-700 px-4 py-3 text-sm font-bold text-gray-200">
                            View Cart
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetails;
