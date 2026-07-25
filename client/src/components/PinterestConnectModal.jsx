import React, { useState } from 'react';
import { ExternalLink, ShieldCheck } from 'lucide-react';
import PlatformSetupModalLayout from './platforms/PlatformSetupModalLayout';

export default function PinterestConnectModal({ isOpen, onClose }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConnectOAuth = () => {
    setIsLoading(true);
    const token = localStorage.getItem('quickpost_token');
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    window.location.href = `${apiUrl}/api/auth/pinterest?token=${token}`;
  };

  const footer = (
    <div className="flex justify-end items-center gap-3">
      <button
        onClick={onClose}
        disabled={isLoading}
        type="button"
        className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        onClick={handleConnectOAuth}
        disabled={isLoading}
        type="button"
        className="inline-flex items-center justify-center gap-2 px-6 py-2 bg-[#E60023] hover:bg-[#cc001f] text-white text-sm font-bold rounded-xl shadow-md shadow-[#E60023]/20 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Redirecting...
          </>
        ) : (
          <>
            Connect with Pinterest
            <ExternalLink className="w-4 h-4" />
          </>
        )}
      </button>
    </div>
  );

  return (
    <PlatformSetupModalLayout
      isOpen={isOpen}
      onClose={() => !isLoading && onClose()}
      title="Connect Pinterest"
      icon="/icons/pinterest-round-color-icon.svg"
      iconBgColor="bg-red-50"
      footer={footer}
    >
      <div className="space-y-6">
        <div className="text-center py-4">
          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            You will be redirected to Pinterest to securely authorize QuickPost to view your profile, fetch your boards, and publish pins on your behalf.
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-50 text-[#E60023] rounded-lg text-xs font-semibold">
            Official OAuth 2.0 Authorization
          </div>
        </div>

        {/* Security Info */}
        <div className="flex items-start gap-3 p-4 bg-gray-100/80 rounded-2xl border border-gray-200/60">
          <div className="p-2 bg-white rounded-lg shadow-sm shrink-0">
            <ShieldCheck className="w-5 h-5 text-gray-600" />
          </div>
          <div className="space-y-1 mt-0.5">
            <h4 className="font-semibold text-gray-900 text-xs uppercase tracking-wider">Encrypted Credentials</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              Your OAuth tokens are encrypted and stored securely. You can revoke access at any time from your Pinterest account settings.
            </p>
          </div>
        </div>
      </div>
    </PlatformSetupModalLayout>
  );
}
