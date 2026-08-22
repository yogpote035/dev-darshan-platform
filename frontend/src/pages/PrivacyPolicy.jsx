import React from 'react';
import { ShieldCheck, Mail, Globe } from 'lucide-react';

const PrivacyPolicy = () => {
  return (
    <div className="px-4 pb-24 pt-4 animate-fade-in-up">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-3">
          <ShieldCheck size={24} />
        </div>
        <h1 className="text-xl font-bold text-gray-100">Privacy Policy</h1>
        <p className="text-[10px] text-amber-500 font-semibold mt-1">Effective Date: June 29, 2026</p>
      </div>

      {/* Content Card */}
      <div className="glass-card rounded-3xl p-6 border border-zinc-800 space-y-6 text-xs text-gray-300 leading-relaxed">
        <p>
          Welcome to <strong>DevDarshanLive</strong> ("we", "our", or "us"). Your privacy is extremely important to us. This Privacy Policy explains how we collect, use, and protect your information when you use our platform at <a href="https://devdarshanlive.com" className="text-amber-500 hover:underline">https://devdarshanlive.com</a>.
        </p>

        {/* Section 1 */}
        <div>
          <h3 className="text-sm font-bold text-gray-100 mb-2 flex items-center gap-1.5 border-b border-zinc-800/80 pb-1">
            <span className="text-amber-500">1.</span> Information We Collect
          </h3>
          <p className="mb-2">We may collect the following information from you to provide and improve our services:</p>
          <ul className="list-disc pl-5 space-y-1 text-gray-400">
            <li>Full Name</li>
            <li>Email Address</li>
            <li>Mobile Number</li>
            <li>Billing Information & Payment Receipts</li>
            <li>Subscription Details</li>
            <li>Device Information (Operating System, browser type)</li>
            <li>IP Address</li>
            <li>Website Usage Analytics</li>
          </ul>
        </div>

        {/* Section 2 */}
        <div>
          <h3 className="text-sm font-bold text-gray-100 mb-2 flex items-center gap-1.5 border-b border-zinc-800/80 pb-1">
            <span className="text-amber-500">2.</span> How We Use Your Information
          </h3>
          <p className="mb-2">We use the collected information for purposes including:</p>
          <ul className="list-disc pl-5 space-y-1 text-gray-400">
            <li>Creating and managing your user account</li>
            <li>Processing subscription payments and validating credentials</li>
            <li>Providing high-quality, ad-free premium streaming feeds</li>
            <li>Improving website and stream performance metrics</li>
            <li>Sending critical service notifications and account updates</li>
            <li>Responding to customer support requests and queries</li>
            <li>Preventing fraudulent transactions and unauthorized platform usage</li>
          </ul>
        </div>

        {/* Section 3 */}
        <div>
          <h3 className="text-sm font-bold text-gray-100 mb-2 flex items-center gap-1.5 border-b border-zinc-800/80 pb-1">
            <span className="text-amber-500">3.</span> Payment Information
          </h3>
          <p>
            Payments are securely processed through trusted third-party payment gateways (e.g. Razorpay). <strong>We do not store or collect your debit card, credit card, UPI PIN, or net banking credentials on our servers.</strong> All transaction data is handled under strict PCI-DSS compliance by our payment partners.
          </p>
        </div>

        {/* Section 4 */}
        <div>
          <h3 className="text-sm font-bold text-gray-100 mb-2 flex items-center gap-1.5 border-b border-zinc-800/80 pb-1">
            <span className="text-amber-500">4.</span> Cookies
          </h3>
          <p className="mb-2">We may use cookies and similar tracking technologies to:</p>
          <ul className="list-disc pl-5 space-y-1 text-gray-400">
            <li>Keep you securely logged into your account</li>
            <li>Remember your viewing preferences and settings</li>
            <li>Analyze traffic patterns to optimize load times</li>
          </ul>
          <p className="mt-2">You may choose to disable cookies in your browser settings, though doing so may prevent certain site features from functioning correctly.</p>
        </div>

        {/* Section 5 */}
        <div>
          <h3 className="text-sm font-bold text-gray-100 mb-2 flex items-center gap-1.5 border-b border-zinc-800/80 pb-1">
            <span className="text-amber-500">5.</span> Data Security
          </h3>
          <p>
            We implement industry-standard technical and organizational security measures to secure your personal information against unauthorized access, modification, exposure, or loss. However, please be aware that no method of transmission over the internet is 100% secure.
          </p>
        </div>

        {/* Section 6 */}
        <div>
          <h3 className="text-sm font-bold text-gray-100 mb-2 flex items-center gap-1.5 border-b border-zinc-800/80 pb-1">
            <span className="text-amber-500">6.</span> Third-Party Services
          </h3>
          <p>
            We utilize third-party vendors for payment processing, stream optimization, cloud hosting, and support ticketing. These providers have access to your data only to perform specified tasks on our behalf and are bound by their own privacy terms.
          </p>
        </div>

        {/* Section 7 */}
        <div>
          <h3 className="text-sm font-bold text-gray-100 mb-2 flex items-center gap-1.5 border-b border-zinc-800/80 pb-1">
            <span className="text-amber-500">7.</span> Your Rights
          </h3>
          <p className="mb-2">Depending on your location, you may have the following rights regarding your personal data:</p>
          <ul className="list-disc pl-5 space-y-1 text-gray-400">
            <li>Accessing the data we hold about you</li>
            <li>Requesting corrections to inaccurate data</li>
            <li>Requesting account and data deletion (subject to legal obligations)</li>
            <li>Contacting us with any privacy concerns</li>
          </ul>
        </div>

        {/* Section 8 */}
        <div>
          <h3 className="text-sm font-bold text-gray-100 mb-2 flex items-center gap-1.5 border-b border-zinc-800/80 pb-1">
            <span className="text-amber-500">8.</span> Changes to this Policy
          </h3>
          <p>
            We reserve the right to update this Privacy Policy at any time. Any changes will be posted on this page with an updated effective date. Continued use of our platform constitutes agreement to the updated terms.
          </p>
        </div>

        {/* Section 9 */}
        <div className="pt-4 border-t border-zinc-800 space-y-3">
          <h4 className="font-bold text-gray-100 text-xs">Contact Us</h4>
          <div className="flex items-center gap-2 text-gray-400">
            <Globe size={14} className="text-amber-500 shrink-0" />
            <span>Website: <a href="https://devdarshanlive.com" className="text-amber-500 hover:underline">https://devdarshanlive.com</a></span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <Mail size={14} className="text-amber-500 shrink-0" />
            <span>Email: <a href="mailto:support@devdarshanlive.com" className="text-amber-500 hover:underline">support@devdarshanlive.com</a></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
