import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, KeyRound, Loader, Phone } from 'lucide-react';
import API from '../services/api';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState('request');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const requestCode = async (event) => {
    event.preventDefault();
    setError(''); setMessage(''); setSubmitting(true);
    try {
      const response = await API.post('/auth/forgot-password', { phone });
      setMessage(response.data.message);
      setStep('verify');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to send a reset code.');
    } finally { setSubmitting(false); }
  };

  const resetPassword = async (event) => {
    event.preventDefault();
    setError(''); setMessage('');
    if (password.length < 8) return setError('Password must be at least 8 characters long.');
    if (password !== confirmPassword) return setError('Passwords do not match.');
    setSubmitting(true);
    try {
      const response = await API.post('/auth/reset-password', { phone, code, password, confirm_password: confirmPassword });
      setMessage(response.data.message);
      setTimeout(() => navigate('/login'), 1200);
    } catch (resetError) {
      setError(resetError.response?.data?.message || 'Unable to reset password.');
    } finally { setSubmitting(false); }
  };

  return <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 py-8"><div className="w-full max-w-md rounded-3xl border border-white/5 bg-zinc-900/80 p-6 shadow-2xl md:p-8"><div className="mb-6 text-center"><KeyRound className="mx-auto mb-3 text-amber-500" size={38} /><h1 className="text-2xl font-bold text-white">Reset password</h1><p className="mt-1.5 text-xs text-gray-400">Verify your registered mobile number with an SMS code.</p></div>{error && <div className="mb-5 flex gap-2 rounded-xl border border-red-500/20 bg-red-950/40 p-3 text-sm text-red-300"><AlertCircle size={18} />{error}</div>}{message && <div className="mb-5 rounded-xl border border-emerald-500/20 bg-emerald-950/30 p-3 text-sm text-emerald-300">{message}</div>}{step === 'request' ? <form onSubmit={requestCode} className="space-y-4"><label className="block text-[11px] font-bold uppercase tracking-wide text-gray-400" htmlFor="reset-phone">Registered mobile number</label><div className="relative"><Phone className="absolute left-3.5 top-3 text-gray-500" size={16} /><input id="reset-phone" type="tel" inputMode="numeric" maxLength="15" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Enter mobile number" required className="w-full rounded-xl border border-zinc-800 bg-zinc-950 py-3 pl-10 pr-4 text-sm text-gray-200 focus:border-amber-500 focus:outline-none" /></div><button disabled={submitting} className="btn-gold mt-2 flex w-full items-center justify-center gap-2 py-3.5">{submitting && <Loader size={16} className="animate-spin" />}Send SMS code</button></form> : <form onSubmit={resetPassword} className="space-y-4"><input value={phone} type="hidden" /><input type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength="6" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))} placeholder="6-digit SMS code" required className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-gray-200 focus:border-amber-500 focus:outline-none" /><input type="password" minLength="8" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="New password (minimum 8 characters)" required className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-gray-200 focus:border-amber-500 focus:outline-none" /><input type="password" minLength="8" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Confirm new password" required className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-gray-200 focus:border-amber-500 focus:outline-none" /><button disabled={submitting} className="btn-gold flex w-full items-center justify-center gap-2 py-3.5">{submitting && <Loader size={16} className="animate-spin" />}Change password</button><button type="button" onClick={() => setStep('request')} className="w-full text-xs font-semibold text-amber-500">Send a new code</button></form>}<p className="mt-6 text-center text-xs text-gray-400"><Link to="/login" className="font-bold text-amber-500">Back to sign in</Link></p></div></div>;
};

export default ForgotPassword;
