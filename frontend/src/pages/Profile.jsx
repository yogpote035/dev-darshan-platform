import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAds } from '../context/AdContext';
import API from '../services/api';
import { useNavigate, Link } from 'react-router-dom';
import { getImageUrl } from '../utils/imageHelper';
import {
  User, LogOut, Clock, Heart, Crown, ChevronRight, Play, Loader,
  Wallet, Copy, Share2, Check, ArrowUpRight, Building, QrCode, AlertTriangle, Package
} from 'lucide-react';

const Profile = () => {
  const { user, logout, isAuthenticated, refreshUser, loading } = useAuth();
  const { isPremium } = useAds();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('favorites'); // favorites, history, or orders
  const [favorites, setFavorites] = useState([]);
  const [history, setHistory] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  // Referral and withdrawal states
  const [copied, setCopied] = useState(false);
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [withdrawMethod, setWithdrawMethod] = useState('qr_code'); // qr_code or bank_details
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [qrCodeFile, setQrCodeFile] = useState(null);
  const [withdrawError, setWithdrawError] = useState('');
  const [withdrawSuccess, setWithdrawSuccess] = useState('');
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false);
  const [withdrawals, setWithdrawals] = useState([]);

  // If not authenticated, redirect to login
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login');
    }
  }, [loading, isAuthenticated, navigate]);

  // Load favorites, history, & withdrawals when component loads
  useEffect(() => {
    if (!isAuthenticated) return;

    const loadUserData = async () => {
      setLoadingList(true);
      try {
        const favRes = await API.get('/favorites');
        if (favRes.data.success) {
          setFavorites(favRes.data.favorites);
        }

        const histRes = await API.get('/history');
        if (histRes.data.success) {
          setHistory(histRes.data.history);
        }

        const withdrawRes = await API.get('/withdrawals');
        if (withdrawRes.data.success) {
          setWithdrawals(withdrawRes.data.withdrawals);
        }

        const ordersRes = await API.get('/orders');
        if (ordersRes.data.success) {
          setOrders(ordersRes.data.orders || []);
        }
      } catch (error) {
        console.error('Error loading profile lists:', error);
      } finally {
        setLoadingList(false);
      }
    };

    loadUserData();
    refreshUser(); // Sync current plan in case they just subscribed
  }, [isAuthenticated]);

  const [shareCopied, setShareCopied] = useState(false);

  const handleCopyCode = () => {
    if (!user.referral_code) return;
    navigator.clipboard.writeText(user.referral_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (!user.referral_code) return;
    const link = `${window.location.origin}/register?ref=${user.referral_code}`;
    navigator.clipboard.writeText(link);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    setWithdrawError('');
    setWithdrawSuccess('');

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      setWithdrawError('Please enter a valid amount.');
      return;
    }

    if (amount > parseFloat(user.wallet_balance || 0)) {
      setWithdrawError('Insufficient balance.');
      return;
    }

    setWithdrawSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('amount', withdrawAmount);
      formData.append('payment_method', withdrawMethod);

      if (withdrawMethod === 'qr_code') {
        if (!qrCodeFile) {
          setWithdrawError('Please upload your UPI QR Code image.');
          setWithdrawSubmitting(false);
          return;
        }
        formData.append('qr_code_image', qrCodeFile);
      } else {
        if (!bankName || !accountNumber || !ifscCode || !accountHolderName) {
          setWithdrawError('All bank details are required.');
          setWithdrawSubmitting(false);
          return;
        }
        formData.append('bank_name', bankName);
        formData.append('account_number', accountNumber);
        formData.append('ifsc_code', ifscCode);
        formData.append('account_holder_name', accountHolderName);
      }

      const response = await API.post('/withdrawals', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setWithdrawSuccess(response.data.message);
        setWithdrawAmount('');
        setBankName('');
        setAccountNumber('');
        setIfscCode('');
        setAccountHolderName('');
        setQrCodeFile(null);

        // Refresh withdrawals list and user profile balance
        const withdrawRes = await API.get('/withdrawals');
        if (withdrawRes.data.success) {
          setWithdrawals(withdrawRes.data.withdrawals);
        }
        refreshUser();
      } else {
        setWithdrawError(response.data.message || 'Submission failed.');
      }
    } catch (err) {
      console.error('Withdrawal error:', err);
      setWithdrawError(err.response?.data?.message || 'Server error processing withdrawal.');
    } finally {
      setWithdrawSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-gray-400">
        <Loader size={36} className="animate-spin text-amber-500" />
        <span className="text-sm font-semibold tracking-wide">Loading profile...</span>
      </div>
    );
  }

  if (!user) return null;

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="px-4 pb-24 pt-4 animate-fade-in-up">
      {/* Header Profile card */}
      <div className="glass-card rounded-3xl p-5 border border-zinc-800 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-tr from-amber-500 to-yellow-600 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-md shadow-amber-500/20">
            {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-100 flex items-center gap-1.5">
              <span>{user.full_name}</span>
              {isPremium && <Crown size={14} className="text-amber-500 fill-amber-500" title="Premium Account" />}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">{user.phone}</p>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="text-gray-400 hover:text-red-400 p-2 rounded-full hover:bg-zinc-800/50 transition-colors"
          title="Sign Out"
        >
          <LogOut size={20} />
        </button>
      </div>

      {/* Subscription details widget */}
      <div className="glass-card rounded-2xl p-4 border border-zinc-800 mb-6">
        <div className="flex justify-between items-center mb-3">
          <div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Membership tier</span>
            <h3 className="font-bold text-gray-200 text-sm mt-0.5">{isPremium ? 'Premium Gold Tier' : 'Free Standard Tier'}</h3>
          </div>
          <Link to="/subscription" className="text-xs text-amber-500 font-bold flex items-center gap-0.5 text-decoration-none">
            <span>Manage</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        <div className="text-xs text-gray-400 leading-relaxed">
          {isPremium ? (
            <p>
              Your subscription is active. Expiration:{' '}
              <span className="text-amber-500 font-semibold">
                {new Date(user.subscription_expiry).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </p>
          ) : (
            <p>Standard account. Enable ad-free access to live broadcasts and priority bandwidth.</p>
          )}
        </div>
      </div>

      {/* Refer & Earn Widget */}
      <div className="glass-card rounded-2xl p-5 border border-zinc-800 mb-6">
        <h3 className="text-sm font-bold text-gray-200 flex items-center gap-2 mb-4">
          <Wallet size={16} className="text-amber-500" />
          <span>Refer & Earn Dashboard</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
          {/* Wallet Balance Column */}
          <div className="bg-zinc-950/60 rounded-xl p-4 border border-zinc-900 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Referral Wallet Balance</span>
              <h2 className="text-2xl font-black text-amber-500 mt-1">
                ₹{parseFloat(user.wallet_balance || 0).toFixed(2)}
              </h2>
            </div>
            <button
              onClick={() => setShowWithdrawForm(!showWithdrawForm)}
              className="w-full mt-4 btn-gold py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1"
            >
              <span>{showWithdrawForm ? 'Close Dashboard' : 'Withdraw Cash'}</span>
              <ArrowUpRight size={14} />
            </button>
          </div>

          {/* Referral Code Column */}
          <div className="bg-zinc-950/60 rounded-xl p-4 border border-zinc-900 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Your Referral Code</span>
              <div className="flex items-center gap-2 mt-2">
                <code className="bg-zinc-900 text-amber-500 px-3 py-1.5 rounded-lg font-mono text-sm border border-zinc-800 select-all">
                  {user.referral_code || 'LD_GEN_ERR'}
                </code>
                <button
                  onClick={handleCopyCode}
                  className="p-2 bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 hover:bg-zinc-900/80 rounded-lg text-gray-400 hover:text-amber-500 transition-colors"
                  title="Copy Code"
                >
                  {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Withdrawal Section */}
        {showWithdrawForm && (
          <div className="mt-5 pt-5 border-t border-zinc-800/80 animate-fade-in-up">
            <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-4">Request Withdrawal</h4>

            {withdrawSuccess && (
              <div className="bg-emerald-950/30 border border-emerald-500/20 text-emerald-400 text-xs p-3.5 rounded-xl mb-4">
                {withdrawSuccess}
              </div>
            )}

            {withdrawError && (
              <div className="bg-red-950/30 border border-red-500/20 text-red-400 text-xs p-3.5 rounded-xl mb-4">
                {withdrawError}
              </div>
            )}

            {parseFloat(user.wallet_balance || 0) <= 0 ? (
              <div className="text-center py-6 text-gray-500 border border-dashed border-zinc-800 rounded-xl mb-5 text-xs">
                <AlertTriangle size={24} className="mx-auto mb-2 text-zinc-700" />
                <p>You need a wallet balance greater than ₹0.00 to request withdrawals.</p>
              </div>
            ) : (
              <form onSubmit={handleWithdrawSubmit} className="space-y-4 mb-6">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Withdrawal Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max={user.wallet_balance}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="Enter amount to withdraw"
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-850 rounded-xl text-gray-200 text-xs focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    required
                  />
                  <div className="text-[10px] text-gray-500 mt-1">Available balance: ₹{parseFloat(user.wallet_balance || 0).toFixed(2)}</div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Payout Method</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setWithdrawMethod('qr_code')}
                      className={`py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${withdrawMethod === 'qr_code'
                          ? 'bg-amber-500/10 border-amber-500 text-amber-500'
                          : 'bg-zinc-950 border-zinc-800 text-gray-400 hover:text-gray-200'
                        }`}
                    >
                      <QrCode size={14} />
                      <span>UPI QR Code</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setWithdrawMethod('bank_details')}
                      className={`py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${withdrawMethod === 'bank_details'
                          ? 'bg-amber-500/10 border-amber-500 text-amber-500'
                          : 'bg-zinc-950 border-zinc-800 text-gray-400 hover:text-gray-200'
                        }`}
                    >
                      <Building size={14} />
                      <span>Bank Details</span>
                    </button>
                  </div>
                </div>

                {withdrawMethod === 'qr_code' ? (
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Upload UPI QR Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setQrCodeFile(e.target.files[0])}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-850 rounded-xl text-gray-400 text-xs focus:outline-none focus:border-amber-500"
                      required
                    />
                    <div className="text-[10px] text-gray-500 mt-1">Please upload a clean screenshot of your GPay, PhonePe, or Paytm QR code.</div>
                  </div>
                ) : (
                  <div className="space-y-3 bg-zinc-950/40 p-4 border border-zinc-850 rounded-xl">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Account Holder Name</label>
                      <input
                        type="text"
                        value={accountHolderName}
                        onChange={(e) => setAccountHolderName(e.target.value)}
                        placeholder="Enter full name as in bank"
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-gray-200 text-xs focus:outline-none focus:border-amber-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Bank Name</label>
                      <input
                        type="text"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="e.g. State Bank of India"
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-gray-200 text-xs focus:outline-none focus:border-amber-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Account Number</label>
                      <input
                        type="text"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        placeholder="Enter your account number"
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-gray-200 text-xs focus:outline-none focus:border-amber-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">IFSC Code</label>
                      <input
                        type="text"
                        value={ifscCode}
                        onChange={(e) => setIfscCode(e.target.value)}
                        placeholder="e.g. SBIN0001234"
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-gray-200 text-xs focus:outline-none focus:border-amber-500"
                        required
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={withdrawSubmitting}
                  className="w-full btn-gold py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5"
                >
                  {withdrawSubmitting ? (
                    <>
                      <Loader size={14} className="animate-spin" />
                      <span>Submitting Request...</span>
                    </>
                  ) : (
                    <span>Submit Withdrawal Request</span>
                  )}
                </button>
              </form>
            )}

            {/* Past Requests List */}
            <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-3">Withdrawal Logs</h4>
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {withdrawals && withdrawals.length > 0 ? (
                withdrawals.map((req) => (
                  <div key={req.id} className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-gray-300">₹{parseFloat(req.amount).toFixed(2)}</span>
                        <span className="text-[10px] text-gray-500 ml-2">
                          via {req.payment_method === 'qr_code' ? 'UPI QR' : 'Bank'}
                        </span>
                      </div>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${req.status === 'approved'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : req.status === 'rejected'
                            ? 'bg-red-500/10 text-red-400'
                            : 'bg-amber-500/10 text-amber-400'
                        }`}>
                        {req.status}
                      </span>
                    </div>

                    {req.admin_notes && (
                      <div className="bg-zinc-950 p-2 rounded-lg border border-zinc-900 text-[10px] text-gray-400 leading-normal">
                        <strong>Note:</strong> {req.admin_notes}
                      </div>
                    )}

                    <div className="text-[9px] text-gray-650 font-medium">
                      Requested on: {new Date(req.created_at).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-550 text-center py-4">No past withdrawal requests.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* History and Favorites Tabs Toggle */}
      <div className="flex border-b border-zinc-900 mb-5">
        <button
          onClick={() => setActiveTab('favorites')}
          className={`flex-grow py-3 font-bold text-xs flex items-center justify-center gap-1.5 border-b-2 transition-all ${activeTab === 'favorites'
              ? 'border-amber-500 text-amber-500'
              : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
        >
          <Heart size={14} className={activeTab === 'favorites' ? 'fill-amber-500/10' : ''} />
          <span>My Favorites ({favorites.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex-grow py-3 font-bold text-xs flex items-center justify-center gap-1.5 border-b-2 transition-all ${activeTab === 'history'
              ? 'border-amber-500 text-amber-500'
              : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
        >
          <Clock size={14} />
          <span>Watch History ({history.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`flex-grow py-3 font-bold text-xs flex items-center justify-center gap-1.5 border-b-2 transition-all ${activeTab === 'orders'
              ? 'border-amber-500 text-amber-500'
              : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
        >
          <Package size={14} />
          <span>My Orders ({orders.length})</span>
        </button>
      </div>

      {/* Tab Panels */}
      {loadingList ? (
        <div className="flex justify-center py-10">
          <Loader size={24} className="animate-spin text-amber-500" />
        </div>
      ) : activeTab === 'favorites' ? (
        <div>
          {favorites && favorites.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {favorites.map((fav) => {
                const vid = fav.Video;
                if (!vid) return null;
                return (
                  <Link
                    key={fav.id}
                    to={`/video/${vid.id}`}
                    className="flex gap-3 bg-zinc-900/40 hover:bg-zinc-900/80 border border-zinc-800/40 rounded-xl p-2.5 transition-colors group text-decoration-none"
                  >
                    <div className="relative w-24 aspect-video rounded-lg overflow-hidden shrink-0 bg-zinc-950">
                      <img
                        src={getImageUrl(vid.thumbnail)}
                        alt=""
                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1545128485-c400e7702796?w=600&auto=format&fit=crop&q=60'; }}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Play size={12} className="fill-white text-white" />
                      </div>
                    </div>
                    <div className="flex flex-col justify-center min-w-0">
                      <h4 className="font-semibold text-gray-200 text-xs line-clamp-1 group-hover:text-amber-500 transition-colors leading-tight mb-1">{vid.title}</h4>
                      <span className="text-[10px] text-gray-500 font-bold">{vid.Category?.category_name || 'Darshan'}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 border border-dashed border-zinc-800 rounded-2xl">
              <Heart size={32} className="mx-auto mb-2 text-zinc-700" />
              <p className="text-xs">No favorites added yet.</p>
            </div>
          )}
        </div>
      ) : activeTab === 'history' ? (
        <div>
          {history && history.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {history.map((hist) => {
                const vid = hist.Video;
                if (!vid) return null;
                return (
                  <Link
                    key={hist.id}
                    to={`/video/${vid.id}`}
                    className="flex gap-3 bg-zinc-900/40 hover:bg-zinc-900/80 border border-zinc-800/40 rounded-xl p-2.5 transition-colors group text-decoration-none"
                  >
                    <div className="relative w-24 aspect-video rounded-lg overflow-hidden shrink-0 bg-zinc-950">
                      <img
                        src={getImageUrl(vid.thumbnail)}
                        alt=""
                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1545128485-c400e7702796?w=600&auto=format&fit=crop&q=60'; }}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Play size={12} className="fill-white text-white" />
                      </div>
                    </div>
                    <div className="flex flex-col justify-center min-w-0">
                      <h4 className="font-semibold text-gray-200 text-xs line-clamp-1 group-hover:text-amber-500 transition-colors leading-tight mb-1">{vid.title}</h4>
                      <span className="text-[10px] text-gray-500 font-bold flex items-center gap-1.5">
                        <span>{vid.Category?.category_name || 'Darshan'}</span>
                        <span>•</span>
                        <span>
                          {new Date(hist.watched_at).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 border border-dashed border-zinc-800 rounded-2xl">
              <Clock size={32} className="mx-auto mb-2 text-zinc-700" />
              <p className="text-xs">No watch history logged yet.</p>
            </div>
          )}
        </div>
      ) : (
        <div>
          {orders.length > 0 ? (
            <div className="space-y-3">
              {orders.map((order) => (
                <Link
                  key={order.id}
                  to={`/orders/${order.id}`}
                  className="block rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 transition-colors hover:border-amber-500/50 hover:bg-zinc-900"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black text-gray-200">{order.order_number || `Order #${order.id}`}</p>
                      <p className="mt-1 text-[10px] text-gray-500">
                        {new Date(order.created_at).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-wider ${order.payment_status === 'paid'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : order.payment_status === 'failed'
                          ? 'bg-red-500/10 text-red-400'
                          : 'bg-amber-500/10 text-amber-400'
                      }`}>
                      {order.payment_status || 'pending'}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1.5 border-y border-zinc-800/70 py-3">
                    {(order.OrderItems || []).map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-3 text-xs">
                        <span className="min-w-0 truncate text-gray-300">
                          {item.product_name} <span className="text-gray-600">x{item.quantity}</span>
                        </span>
                        <span className="shrink-0 text-gray-400">₹{Number(item.total || 0).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">
                      {order.payment_mode === 'subscription_offer' ? '₹1 offer' : 'Direct purchase'}
                      {' · '}{order.order_status || 'pending'}
                    </span>
                    <span className="font-black text-amber-500">₹{Number(order.total_amount || 0).toFixed(2)}</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-zinc-800 py-12 text-center text-gray-500">
              <Package size={32} className="mx-auto mb-2 text-zinc-700" />
              <p className="text-xs">No orders placed yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Profile;
