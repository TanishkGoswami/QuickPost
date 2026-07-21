import React from 'react';
import { ExternalLink, CheckCircle2, AlertCircle, Smartphone, Settings, UserCircle2, Briefcase, ArrowRight } from 'lucide-react';
import PlatformSetupModalLayout from './platforms/PlatformSetupModalLayout';

export default function InstagramBusinessSetupModal({ isOpen, onClose, onProceed }) {
  const handleProceed = () => {
    if (onProceed) {
      onProceed();
    } else {
      onClose();
    }
  };

  const footer = (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
      <div className="text-left w-full sm:w-auto">
        <p className="text-sm font-semibold text-gray-900">Ready to connect?</p>
        <p className="text-xs text-gray-500 mt-0.5">Ensure you have a Business/Creator account.</p>
      </div>
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <button
          onClick={onClose}
          className="flex-1 sm:flex-none px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleProceed}
          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-sm font-bold rounded-xl shadow-md shadow-pink-500/20 transition-all hover:-translate-y-0.5"
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <PlatformSetupModalLayout
      isOpen={isOpen}
      onClose={onClose}
      title="Instagram Setup"
      icon="/icons/ig-instagram-icon.svg"
      iconBgColor="bg-pink-50"
      footer={footer}
    >
      <div className="space-y-8">
        {/* Important Alert */}
        <div className="flex items-start gap-4 p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl">
          <div className="p-2 bg-blue-100 rounded-full shrink-0">
            <AlertCircle className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-blue-900">Professional Account Required</h3>
            <p className="text-sm text-blue-800/80 mt-1 leading-relaxed">
              GAP Social-pilot uses Instagram's official API, which requires a <span className="font-semibold">Business</span> or <span className="font-semibold">Creator</span> account. Personal accounts cannot be connected.
            </p>
          </div>
        </div>

        {/* Benefits Grid */}
        <div>
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Why upgrade?</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              "Direct auto-posting",
              "Advanced analytics",
              "Auto DM features",
              "Comment management"
            ].map((benefit, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                <span className="text-sm font-medium text-gray-700">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Conversion Steps */}
        <div>
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-5">How to convert your account</h3>
          
          <div className="relative space-y-6 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
            
            {/* Step 1 */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-indigo-100 text-indigo-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                <Smartphone className="w-4 h-4" />
              </div>
              <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl bg-white border border-gray-100 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-gray-900 text-sm">Open App</h4>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">Launch Instagram on your phone and go to your profile.</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-blue-100 text-blue-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                <Settings className="w-4 h-4" />
              </div>
              <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl bg-white border border-gray-100 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-gray-900 text-sm">Settings</h4>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">Tap Menu (☰) → Settings and privacy.</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-fuchsia-100 text-fuchsia-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                <UserCircle2 className="w-4 h-4" />
              </div>
              <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl bg-white border border-gray-100 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-gray-900 text-sm">Account Type</h4>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">Tap "Account type and tools" → "Switch to professional account".</p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-pink-100 text-pink-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                <Briefcase className="w-4 h-4" />
              </div>
              <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl bg-white border border-gray-100 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-gray-900 text-sm">Complete</h4>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">Select "Business" or "Creator" and follow the on-screen prompts.</p>
              </div>
            </div>

          </div>
        </div>

        {/* Support Link */}
        <div className="flex items-center justify-center pt-2">
          <a
            href="https://help.instagram.com/502981923235522"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            View Official Instagram Guide
          </a>
        </div>
      </div>
    </PlatformSetupModalLayout>
  );
}
