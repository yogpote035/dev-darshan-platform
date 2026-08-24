import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Loader, Search, Star } from 'lucide-react';
import { fetchProducts, fetchProductCategories, addToCart } from '../services/productService';
import { getImageUrl } from '../utils/imageHelper';

const Products = () => {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [featuredOnly, setFeaturedOnly] = useState(false);
    const [category, setCategory] = useState('');
    const [categories, setCategories] = useState([]);

    const loadCategoryOptions = async () => {
        try {
            const response = await fetchProductCategories();
            if (response.success) {
                setCategories(response.categories || []);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
            setCategories([]);
        }
    };

    const loadProducts = async () => {
        setLoading(true);
        try {
            const response = await fetchProducts({
                search,
                category,
                featured: featuredOnly ? 'true' : undefined,
                active: 'true',
                limit: 20,
                offset: 0
            });

            if (response.success) {
                setItems(response.products || []);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCategoryOptions();
    }, []);

    useEffect(() => {
        loadProducts();
    }, [search, category, featuredOnly]);

    const addItem = async (productId) => {
        try {
            await addToCart(productId, 1);
            alert('Product added to cart.');
        } catch (error) {
            if (error.response?.status === 401) {
                navigate('/login');
                return;
            }
            alert(error.response?.data?.message || 'Unable to add product to cart.');
        }
    };

    return (
        <div className="px-4 pb-24 pt-4 animate-fade-in-up">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-amber-500 font-bold">Store</p>
                    <h1 className="text-2xl font-black text-white">Devotional Products</h1>
                </div>
                <Link
                    to="/cart"
                    className="inline-flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-400"
                >
                    <ShoppingCart size={15} />
                    View Cart
                </Link>
            </div>

            <div className="mb-4 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-3">
                <div className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2">
                    <Search size={16} className="text-zinc-400" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search products"
                        className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
                    />
                </div>

                <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                    <button
                        type="button"
                        onClick={() => setCategory('')}
                        className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold ${!category ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-800 text-gray-300'}`}
                    >
                        All
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            type="button"
                            onClick={() => setCategory(cat.id)}
                            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold ${category === cat.id ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-800 text-gray-300'}`}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>

                <label className="mt-3 flex items-center gap-2 text-xs text-gray-300">
                    <input type="checkbox" checked={featuredOnly} onChange={(e) => setFeaturedOnly(e.target.checked)} />
                    Featured products only
                </label>
            </div>

            {loading ? (
                <div className="flex min-h-[40vh] items-center justify-center gap-3 text-gray-400">
                    <Loader size={24} className="animate-spin text-amber-500" />
                    <span className="text-sm font-semibold">Loading products...</span>
                </div>
            ) : items.length === 0 ? (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 text-center text-gray-400">
                    No products match your search.
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                    {items.map((product) => (
                        <div key={product.id} className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/80">
                            <div className="relative">
                                <img src={getImageUrl(product.image)} alt={product.name} className="h-52 w-full object-cover" />
                                {product.isOfferAvailable && (
                                    <span className="absolute left-3 top-3 rounded-full bg-amber-500 px-2 py-1 text-[10px] font-bold text-zinc-950">
                                        ₹1 today
                                    </span>
                                )}
                            </div>

                            <div className="space-y-3 p-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <h2 className="text-base font-bold text-white">{product.name}</h2>
                                        <p className="mt-1 text-xs text-gray-400">{product.short_description || 'Premium devotional product'}</p>
                                    </div>
                                    {product.featured && <Star size={14} className="text-amber-500" />}
                                </div>

                                <div className="space-y-1">
                                    <div className="text-lg font-black text-amber-400">₹{Number(product.price || 0).toFixed(2)}</div>
                                    {product.isOfferAvailable && (
                                        <div className="text-xs text-gray-300">
                                            <span className="font-bold text-amber-400">₹1 today</span> • ₹{Number(product.recurringAmount || 0).toFixed(2)} every {product.recurringPeriod === 365 || product.recurringPeriod === 366 ? 'year' : product.recurringPeriod === 90 ? '3 months' : `${product.recurringPeriod || 30} days`} after {product.trialDays || 7} days
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-between text-xs text-gray-400">
                                    <span>{Number(product.stock || 0) > 0 ? `${product.stock} in stock` : 'Out of stock'}</span>
                                    {product.category && <span>{product.category.name}</span>}
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => addItem(product.id)}
                                        disabled={Number(product.stock || 0) <= 0}
                                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-500 px-3 py-2 text-xs font-bold text-zinc-950 disabled:opacity-50"
                                    >
                                        <ShoppingCart size={14} />
                                        Add to Cart
                                    </button>
                                    <Link to={`/products/${product.id}`} className="flex items-center justify-center rounded-xl border border-zinc-700 px-3 py-2 text-xs font-bold text-gray-300">
                                        Details
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Products;
