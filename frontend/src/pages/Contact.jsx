import React, { useState } from 'react';
import API from '../services/api';
import { Mail, Phone, MapPin, Send, Loader, ShieldCheck } from 'lucide-react';

const Contact = () => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!name || !phone || !message) {
      setErrorMsg('Please fill in all fields.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await API.post('/contact', { name, phone, message });
      if (response.data.success) {
        setSuccessMsg(response.data.message || 'Thank you! Support enquiry received.');
        setName('');
        setPhone('');
        setMessage('');
      }
    } catch (error) {
      console.error('Submit enquiry error:', error);
      setErrorMsg(error.response?.data?.message || 'Error submitting enquiry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="px-4 pb-24 pt-4 animate-fade-in-up">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-xl font-bold text-gray-100">Contact & Support</h1>
        <p className="text-xs text-gray-400 mt-1 max-w-[280px] mx-auto">Have queries, feedback, or complaints? Get in touch with our team.</p>
      </div>

      {/* Contact Details Card */}
      <div className="glass-card rounded-2xl p-5 border border-zinc-800 mb-6 space-y-3.5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-zinc-800 border border-zinc-700 text-amber-500 rounded-lg flex items-center justify-center shrink-0">
            <Mail size={16} />
          </div>
          <div>
            <span className="text-[10px] text-gray-500 font-bold block uppercase tracking-wider leading-none">Email Address</span>
            <a href="mailto:support@devdarshanlive.com" className="text-xs font-semibold text-gray-300 hover:text-amber-500 transition-colors text-decoration-none">support@devdarshanlive.com</a>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-zinc-800 border border-zinc-700 text-amber-500 rounded-lg flex items-center justify-center shrink-0">
            <Phone size={16} />
          </div>
          <div>
            <span className="text-[10px] text-gray-500 font-bold block uppercase tracking-wider leading-none">Support Hotline</span>
            <a href="tel:+919876543210" className="text-xs font-semibold text-gray-300 hover:text-amber-500 transition-colors text-decoration-none">+91 98765 43210</a>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-zinc-800 border border-zinc-700 text-amber-500 rounded-lg flex items-center justify-center shrink-0">
            <MapPin size={16} />
          </div>
          <div>
            <span className="text-[10px] text-gray-500 font-bold block uppercase tracking-wider leading-none">Office Head</span>
            <span className="text-xs font-semibold text-gray-300">Mumbai, Maharashtra, India</span>
          </div>
        </div>
      </div>

      {/* Enquiry Form */}
      <div className="glass-card rounded-3xl p-6 border border-zinc-800">
        <h3 className="font-bold text-gray-200 text-sm mb-4">Send a Message</h3>

        {successMsg && (
          <div className="flex items-start gap-2.5 bg-green-950/40 border border-green-500/20 text-green-300 p-3.5 rounded-xl mb-4 text-sm">
            <ShieldCheck size={18} className="shrink-0 mt-0.5 text-green-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="flex items-start gap-2.5 bg-red-950/40 border border-red-500/20 text-red-300 p-3.5 rounded-xl mb-4 text-sm">
            <i className="fa-solid fa-circle-exclamation shrink-0 mt-1 text-red-400"></i>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Your Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Gurpreet"
              className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-gray-200 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              required
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Phone Number</label>
            <input
              type="tel"
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 9876543210"
              className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-gray-200 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              required
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Message / Details</label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your queries or details here..."
              rows="4"
              className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-gray-200 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              required
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full btn-gold py-3.5 mt-2 flex items-center justify-center gap-1.5"
          >
            {submitting ? (
              <>
                <Loader size={16} className="animate-spin" />
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <Send size={16} />
                <span>Send Support Request</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Contact;
