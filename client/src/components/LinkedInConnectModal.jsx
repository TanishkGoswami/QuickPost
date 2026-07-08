import React, { useState } from 'react';
import { Briefcase, Link, ArrowRight, ShieldCheck } from 'lucide-react';
import PlatformSetupModalLayout from './platforms/PlatformSetupModalLayout';

export default function LinkedInConnectModal({ isOpen, onClose }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = () => {
    setIsLoading(true);
    const token = localStorage.getItem('quickpost_token');
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    // Redirect to LinkedIn OAuth flow
    window.location.href = `${apiUrl}/api/auth/linkedin?token=${token}`;
  };

  const footer = (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
      <div className="text-left w-full sm:w-auto">
        <p className="text-sm font-semibold text-gray-900">Ready to connect?</p>
        <p className="text-xs text-gray-500 mt-0.5">You will be redirected to LinkedIn.</p>
      </div>
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <button
          onClick={onClose}
          disabled={isLoading}
          className="flex-1 sm:flex-none px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleConnect}
          disabled={isLoading}
          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2 bg-[#0A66C2] hover:bg-[#084e96] text-white text-sm font-bold rounded-xl shadow-md shadow-[#0A66C2]/20 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Redirecting...
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <PlatformSetupModalLayout
      isOpen={isOpen}
      onClose={() => !isLoading && onClose()}
      title="Connect LinkedIn"
      icon="/icons/linkedin-round-color-icon.svg"
      iconBgColor="bg-blue-50"
      footer={footer}
    >
      <div className="space-y-6">
        <div className="text-center">
          <p className="text-sm text-gray-600 leading-relaxed mb-6">
            Click the button below to securely connect your LinkedIn account. You'll be redirected to LinkedIn to authorize QuickPost.
          </p>
          <div className="flex justify-center">
             <div className="relative w-24 h-24 mb-2">
                <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-20"></div>
                <div className="relative w-full h-full bg-blue-50 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                    <Link className="w-10 h-10 text-[#0A66C2]" />
                </div>
            </div>
          </div>
        </div>

        {/* Security Info */}
        <div className="flex items-start gap-3 p-4 bg-gray-100/80 rounded-2xl border border-gray-200/60 mt-4">
          <div className="p-2 bg-white rounded-lg shadow-sm shrink-0">
            <ShieldCheck className="w-5 h-5 text-gray-600" />
          </div>
          <div className="space-y-1 mt-0.5">
            <h4 className="font-semibold text-gray-900 text-xs uppercase tracking-wider">Secure OAuth Connection</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              We do not store your LinkedIn password. You will authenticate directly on LinkedIn's secure servers.
            </p>
          </div>
        </div>
      </div>
    </PlatformSetupModalLayout>
  );
}
