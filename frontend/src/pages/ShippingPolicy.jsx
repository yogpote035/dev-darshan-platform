import React from 'react';
import { Package, Mail, Sparkles } from 'lucide-react';

const ShippingPolicy = () => {
  return (
    <div className="px-4 pb-24 pt-4 animate-fade-in-up">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-3">
          <Package size={24} />
        </div>
        <h1 className="text-xl font-bold text-gray-100">Shipping & Delivery</h1>
        <p className="text-[10px] text-amber-500 font-semibold mt-1">Effective Date: June 29, 2026</p>
      </div>

      {/* Content Card */}
      <div className="glass-card rounded-3xl p-6 border border-zinc-800 space-y-6 text-xs text-gray-300 leading-relaxed">
        <p>
          Welcome to <strong>DevDarshanLive</strong>. Please find details regarding the delivery of our services below.
        </p>

        {/* Section 1 */}
        <div>
          <h3 className="text-sm font-bold text-gray-100 mb-2 flex items-center gap-1.5 border-b border-zinc-800/80 pb-1">
            <span className="text-amber-500">1.</span> No Physical Shipping
          </h3>
          <p>
            DevDarshanLive offers **digital subscription services only**. We do not sell or ship physical products, temple offerings (Prasad), or physical materials. Consequently, no courier, logistics, storage, or physical shipping services are involved in our operations.
          </p>
        </div>

        {/* Section 2 */}
        <div>
          <h3 className="text-sm font-bold text-gray-100 mb-2 flex items-center gap-1.5 border-b border-zinc-800/80 pb-1">
            <span className="text-amber-500">2.</span> Digital Delivery Method
          </h3>
          <p className="mb-2">
            Upon successful completion of payment through our payment gateway partners:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-gray-400">
            <li>Your Premium Membership account will generally be **activated automatically within a few minutes**.</li>
            <li>In rare cases of payment gateway verification delays, digital activation may take up to **24 hours**.</li>
          </ul>
          <p className="mt-2">
            Once activated, you can enjoy premium ad-free daily devotional streams instantly by logging into your account.
          </p>
        </div>

        {/* Section 3 */}
        <div>
          <h3 className="text-sm font-bold text-gray-100 mb-2 flex items-center gap-1.5 border-b border-zinc-800/80 pb-1">
            <span className="text-amber-500">3.</span> Delivery Charges
          </h3>
          <p>
            There are **zero shipping or delivery charges** associated with any premium subscription tier on DevDarshanLive, as all items are delivered electronically.
          </p>
        </div>

        {/* Section 4 */}
        <div>
          <h3 className="text-sm font-bold text-gray-100 mb-2 flex items-center gap-1.5 border-b border-zinc-800/80 pb-1">
            <span className="text-amber-500">4.</span> Activation Assistance
          </h3>
          <p>
            If your premium benefits are not active after 30 minutes of a successful transaction, please contact us immediately with your transaction receipt, registered phone number, and full name.
          </p>
        </div>

        {/* Contact info */}
        <div className="pt-4 border-t border-zinc-800 space-y-3">
          <h4 className="font-bold text-gray-100 text-xs">Need help?</h4>
          <div className="flex items-center gap-2 text-gray-400">
            <Mail size={14} className="text-amber-500 shrink-0" />
            <span>Email Support: <a href="mailto:support@devdarshanlive.com" className="text-amber-500 hover:underline">support@devdarshanlive.com</a></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShippingPolicy;
