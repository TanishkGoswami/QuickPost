import React from 'react';
import { ExternalLink, CheckCircle2, AlertCircle, Monitor, PenTool, LayoutTemplate, ArrowRight } from 'lucide-react';
import PlatformSetupModalLayout from './platforms/PlatformSetupModalLayout';

export default function FacebookSetupModal({ isOpen, onClose, onProceed }) {
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
        <p className="text-xs text-gray-500 mt-0.5">Ensure you have a Facebook Page.</p>
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
          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2 bg-[#1877F2] hover:bg-[#166FE5] text-white text-sm font-bold rounded-xl shadow-md shadow-[#1877F2]/20 transition-all hover:-translate-y-0.5"
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
      title="Facebook Setup"
      icon="/icons/facebook-round-color-icon.svg"
      iconBgColor="bg-blue-50"
      footer={footer}
    >
      <div className="space-y-8">
        {/* Important Alert */}
        <div className="flex items-start gap-4 p-5 bg-amber-50 border border-amber-100 rounded-2xl">
          <div className="p-2 bg-amber-100/50 rounded-full shrink-0">
            <AlertCircle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-amber-900">Facebook Page Required</h3>
            <p className="text-sm text-amber-800/90 mt-1 leading-relaxed">
              If you try to connect an account that does <span className="font-semibold underline underline-offset-2">not</span> have a Facebook Page, Facebook may block the login and show a <strong>"Feature Unavailable"</strong> error.
            </p>
          </div>
        </div>

        {/* Benefits Grid */}
        <div>
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Why a Page is needed?</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
              <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
              <span className="text-sm font-medium text-gray-700">Meta API requires it for posting</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
              <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
              <span className="text-sm font-medium text-gray-700">Needed for Instagram Business</span>
            </div>
          </div>
        </div>

        {/* Conversion Steps */}
        <div>
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-5">How to Create a Facebook Page</h3>
          
          <div className="relative space-y-6 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
            
            {/* Step 1 */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-[#1877F2]/10 text-[#1877F2] shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                <Monitor className="w-4 h-4" />
              </div>
              <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl bg-white border border-gray-100 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-gray-900 text-sm">Go to Pages</h4>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed mb-3">Log into Facebook and go to the Pages section.</p>
                <a
                  href="https://www.facebook.com/pages/creation"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-[#1877F2] text-xs font-semibold rounded-lg transition-colors border border-gray-200"
                >
                  Create Page
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-[#1877F2]/10 text-[#1877F2] shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                <PenTool className="w-4 h-4" />
              </div>
              <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl bg-white border border-gray-100 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-gray-900 text-sm">Fill Details</h4>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">Enter a Page name and category. This can be anything (e.g., "My Business").</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-[#1877F2]/10 text-[#1877F2] shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                <LayoutTemplate className="w-4 h-4" />
              </div>
              <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl bg-white border border-gray-100 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-gray-900 text-sm">Create Page</h4>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">Once created, you can return here and click "Continue".</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </PlatformSetupModalLayout>
  );
}
