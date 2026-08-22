import React from 'react';
import { FileText, Mail, ShieldAlert } from 'lucide-react';

const TermsConditions = () => {
  return (
    <div className="px-4 pb-24 pt-4 animate-fade-in-up">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-3">
          <FileText size={24} />
        </div>
        <h1 className="text-xl font-bold text-gray-100">Terms & Conditions</h1>
        <p className="text-[10px] text-amber-500 font-semibold mt-1">Effective Date: June 29, 2026</p>
      </div>

      {/* Content Card */}
      <div className="glass-card rounded-3xl p-6 border border-zinc-800 space-y-6 text-xs text-gray-300 leading-relaxed">
        <p>
          Welcome to <strong>DevDarshanLive</strong>. By accessing or using our platform at <a href="https://devdarshanlive.com" className="text-amber-500 hover:underline">https://devdarshanlive.com</a>, you agree to comply with and be bound by the following Terms & Conditions.
        </p>

        {/* Section 1 */}
        <div>
          <h3 className="text-sm font-bold text-gray-100 mb-2 flex items-center gap-1.5 border-b border-zinc-800/80 pb-1">
            <span className="text-amber-500">1.</span> Our Service
          </h3>
          <p>
            DevDarshanLive provides online access to devotional live streaming content and temple broadcasts. Users may purchase Premium Subscription plans to enjoy an ad-free viewing experience, priority bandwidth speeds during high-demand Aarti times, and other premium features.
          </p>
        </div>

        {/* Section 2 */}
        <div>
          <h3 className="text-sm font-bold text-gray-100 mb-2 flex items-center gap-1.5 border-b border-zinc-800/80 pb-1">
            <span className="text-amber-500">2.</span> Account Responsibility
          </h3>
          <p className="mb-2">If you register an account, you are solely responsible for:</p>
          <ul className="list-disc pl-5 space-y-1 text-gray-400">
            <li>Maintaining account and password confidentiality</li>
            <li>Providing accurate, complete, and current information</li>
            <li>Protecting your credentials from unauthorized access</li>
          </ul>
        </div>

        {/* Section 3 */}
        <div>
          <h3 className="text-sm font-bold text-gray-100 mb-2 flex items-center gap-1.5 border-b border-zinc-800/80 pb-1">
            <span className="text-amber-500">3.</span> Subscriptions
          </h3>
          <ul className="list-disc pl-5 space-y-1 text-gray-400">
            <li>Premium subscriptions are billed in advance according to the selected validity plan.</li>
            <li>Subscription benefits, including ad-removal, begin immediately after payment confirmation.</li>
            <li>Access remains active until the subscription validity period expires or is cancelled.</li>
          </ul>
        </div>

        {/* Section 4 */}
        <div>
          <h3 className="text-sm font-bold text-gray-100 mb-2 flex items-center gap-1.5 border-b border-zinc-800/80 pb-1">
            <span className="text-amber-500">4.</span> Acceptable Use
          </h3>
          <p className="mb-2">Users agree NOT to engage in the following prohibited behaviors:</p>
          <ul className="list-disc pl-5 space-y-1 text-gray-400">
            <li>Sharing account credentials with third parties</li>
            <li>Redistributing, recording, downloading, or re-broadcasting premium content without explicit permission</li>
            <li>Attempting to hack, exploit, or disrupt the platform's servers, databases, or client-side interfaces</li>
            <li>Using automated scripts, spiders, or scrapers to access the service</li>
          </ul>
          <p className="mt-2 text-red-400 flex items-center gap-1">
            <ShieldAlert size={12} />
            <span>Violation of these rules may result in immediate suspension or permanent account termination.</span>
          </p>
        </div>

        {/* Section 5 */}
        <div>
          <h3 className="text-sm font-bold text-gray-100 mb-2 flex items-center gap-1.5 border-b border-zinc-800/80 pb-1">
            <span className="text-amber-500">5.</span> Intellectual Property
          </h3>
          <p>
            All videos, streams, logo assets, designs, templates, trademarks, graphics, and server structures on this platform belong to DevDarshanLive or their respective content partners/temples. Unauthorized reproduction, modification, translation, or distribution is strictly prohibited under intellectual property laws.
          </p>
        </div>

        {/* Section 6 */}
        <div>
          <h3 className="text-sm font-bold text-gray-100 mb-2 flex items-center gap-1.5 border-b border-zinc-800/80 pb-1">
            <span className="text-amber-500">6.</span> Service Availability
          </h3>
          <p>
            While we strive for uninterrupted daily service, temporary downtime may occur due to regular server maintenance, technical errors, local internet disruptions, power shortages, or third-party stream source interruptions. We do not guarantee 100% uninterrupted availability of all temple feeds at all hours.
          </p>
        </div>

        {/* Section 7 */}
        <div>
          <h3 className="text-sm font-bold text-gray-100 mb-2 flex items-center gap-1.5 border-b border-zinc-800/80 pb-1">
            <span className="text-amber-500">7.</span> Limitation of Liability
          </h3>
          <p>
            DevDarshanLive and its operators shall not be liable for any indirect, incidental, special, or consequential damages resulting from the use of, or inability to use, our online devotional streaming services.
          </p>
        </div>

        {/* Section 8 */}
        <div>
          <h3 className="text-sm font-bold text-gray-100 mb-2 flex items-center gap-1.5 border-b border-zinc-800/80 pb-1">
            <span className="text-amber-500">8.</span> Changes
          </h3>
          <p>
            We reserve the right to modify these Terms & Conditions at any time without notice. Continued use of our site indicates acceptance of the revised terms.
          </p>
        </div>

        {/* Contact info */}
        <div className="pt-4 border-t border-zinc-800 space-y-3">
          <h4 className="font-bold text-gray-100 text-xs">Queries?</h4>
          <div className="flex items-center gap-2 text-gray-400">
            <Mail size={14} className="text-amber-500 shrink-0" />
            <span>Email Support: <a href="mailto:support@devdarshanlive.com" className="text-amber-500 hover:underline">support@devdarshanlive.com</a></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsConditions;
