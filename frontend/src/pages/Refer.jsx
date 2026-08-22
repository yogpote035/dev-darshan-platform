import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import { useNavigate } from 'react-router-dom';
import { 
  Wallet, Copy, Check, ArrowUpRight, Building, QrCode, AlertTriangle, Loader, Gift 
} from 'lucide-react';

const Refer = () => {
  const { user, isAuthenticated, refreshUser, loading } = useAuth();
  const navigate = useNavigate();

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
  const [commissions, setCommissions] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  // If not authenticated, redirect to login
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login');
    }
  }, [loading, isAuthenticated, navigate]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const loadUserData = async () => {
      setLoadingList(true);
      try {
        const withdrawRes = await API.get('/withdrawals');
        if (withdrawRes.data.success) {
          setWithdrawals(withdrawRes.data.withdrawals);
        }

        const commRes = await API.get('/withdrawals/commissions');
        if (commRes.data.success) {
          setCommissions(commRes.data.commissions);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoadingList(false);
      }
    };

    loadUserData();
    refreshUser();
  }, [isAuthenticated]);

  const handleCopyCode = () => {
    if (!user?.referral_code) return;
    navigator.clipboard.writeText(user.referral_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

    if (amount > parseFloat(user?.wallet_balance || 0)) {
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

  if (loading || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-gray-400">
        <Loader size={36} className="animate-spin text-amber-500" />
        <span className="text-sm font-semibold tracking-wide">Loading Refer & Earn...</span>
      </div>
    );
  }

  return (
    <div className="px-4 pb-24 pt-4 animate-fade-in-up">
      {/* Refer & Earn Header */}
      <div className="glass-card rounded-3xl p-5 border border-zinc-800 mb-6 flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-tr from-amber-500 to-yellow-600 rounded-full flex items-center justify-center text-white shadow-md shadow-amber-500/20">
          <Gift size={24} />
        </div>
        <div>
          <h2 className="text-base font-bold text-gray-100">Refer & Earn</h2>
          <p className="text-xs text-gray-400 mt-0.5">Share code, earn cash, and withdraw to bank or UPI QR</p>
        </div>
      </div>

      {/* Refer & Earn Widget */}
      <div className="glass-card rounded-2xl p-5 border border-zinc-800 mb-6">
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
            <div className="mt-4 text-[10px] text-gray-500 leading-normal">
              Share this code with friends. When they register and buy a subscription, you earn a cash commission!
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
                      className={`py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                        withdrawMethod === 'qr_code'
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
                      className={`py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                        withdrawMethod === 'bank_details'
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
                    <div className="text-[10px] text-gray-500 mt-1">Please upload a clean screenshot of your UPI QR code.</div>
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
          </div>
        )}

        {/* Income History & Withdrawal History Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-5 pt-5 border-t border-zinc-800/80">
          
          {/* Income History (Commissions) */}
          <div>
            <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-3">Income History</h4>
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {commissions && commissions.length > 0 ? (
                commissions.map((comm) => (
                  <div key={comm.id} className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-3 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-emerald-400">+₹{parseFloat(comm.amount).toFixed(2)}</span>
                        <span className="text-[10px] text-gray-500 ml-2">
                          ({parseFloat(comm.commission_percentage).toFixed(1)}%)
                        </span>
                      </div>
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider bg-emerald-500/10 text-emerald-400">
                        Earned
                      </span>
                    </div>

                    <div className="text-[10px] text-gray-400">
                      Referred: <strong className="text-gray-350">{comm.ReferredUser?.full_name || 'New Sign-up'}</strong>
                    </div>

                    <div className="text-[9px] text-gray-650 font-medium">
                      Received on: {new Date(comm.created_at).toLocaleDateString('en-IN', {
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
                <p className="text-xs text-gray-550 text-center py-4">No referral income logged yet.</p>
              )}
            </div>
          </div>

          {/* Withdrawal History */}
          <div>
            <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-3">Withdrawal History</h4>
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
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        req.status === 'approved'
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

        </div>
      </div>
    </div>
  );
};

export default Refer;
