import React from 'react';
import { Landmark, Mail, Calendar } from 'lucide-react';

const RefundPolicy = () => {
  return (
    <div className="px-4 pb-24 pt-4 animate-fade-in-up">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-3">
          <Landmark size={24} />
        </div>
        <h1 className="text-xl font-bold text-gray-100">Refund & Cancellation</h1>
        <p className="text-[10px] text-amber-500 font-semibold mt-1">Effective Date: June 29, 2026</p>
      </div>

      {/* Content Card */}
      <div className="glass-card rounded-3xl p-6 border border-zinc-800 space-y-6 text-xs text-gray-300 leading-relaxed">
        <p>
          Thank you for subscribing to <strong>DevDarshanLive</strong>. Since our platform delivers digital subscription services and grants instant access to premium ad-free live streaming, the following policy applies.
        </p>

        {/* Section 1 */}
        <div>
          <h3 className="text-sm font-bold text-gray-100 mb-2 flex items-center gap-1.5 border-b border-zinc-800/80 pb-1">
            <span className="text-amber-500">1.</span> Refund Policy
          </h3>
          <p className="mb-2">
            Once a subscription payment has been successfully completed and premium access has been activated, <strong>the payment is generally non-refundable</strong>.
          </p>
          <p className="mb-2">We will only consider refund requests in exceptional circumstances, which include:</p>
          <ul className="list-disc pl-5 space-y-1 text-gray-400">
            <li>Duplicate payment transactions for the same plan within the same billing period</li>
            <li>Technical failures during verification resulting in double charges</li>
            <li>Failure to grant premium privileges despite successful payment verification due to a system issue</li>
          </ul>
          <p className="mt-2 text-gray-450">
            Refund approvals are made solely at the discretion of DevDarshanLive after review and verification of our payment logs. Approved refunds will be processed back to the original payment source within 5-7 business days.
          </p>
        </div>

        {/* Section 2 */}
        <div>
          <h3 className="text-sm font-bold text-gray-100 mb-2 flex items-center gap-1.5 border-b border-zinc-800/80 pb-1">
            <span className="text-amber-500">2.</span> Cancellation Policy
          </h3>
          <p className="mb-2">
            Users can choose to cancel future recurring subscriptions (if applicable) at any time. You can request cancellation through:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-gray-400">
            <li>Your account settings page (Manage membership)</li>
            <li>Contacting our billing support directly via email</li>
          </ul>
          <p className="mt-2">
            Cancellation stops future billing charges but does not issue a refund for the current billing period. You will retain premium, ad-free benefits until your current subscription validity period expires.
          </p>
        </div>

        {/* Section 3 */}
        <div>
          <h3 className="text-sm font-bold text-gray-100 mb-2 flex items-center gap-1.5 border-b border-zinc-800/80 pb-1">
            <span className="text-amber-500">3.</span> Failed Payments
          </h3>
          <p>
            If a payment fails during subscription renewal or purchase, premium features will be suspended. Premium access will be restored immediately once billing succeeds.
          </p>
        </div>

        {/* Contact info */}
        <div className="pt-4 border-t border-zinc-800 space-y-3">
          <h4 className="font-bold text-gray-100 text-xs">Request Support</h4>
          <div className="flex items-center gap-2 text-gray-400">
            <Mail size={14} className="text-amber-500 shrink-0" />
            <span>Email: <a href="mailto:support@devdarshanlive.com" className="text-amber-500 hover:underline">support@devdarshanlive.com</a></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RefundPolicy;
