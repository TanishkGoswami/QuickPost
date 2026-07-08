import React, { useState } from 'react';
import { ExternalLink, HelpCircle, ArrowRight, ShieldCheck, Key } from 'lucide-react';
import apiClient from '../utils/apiClient';
import PlatformSetupModalLayout from './platforms/PlatformSetupModalLayout';

export default function PinterestConnectModal({ isOpen, onClose, onSuccess }) {
  const [isLoading, setIsLoading] = useState(false);
  const [useManual, setUseManual] = useState(false);
  const [manualToken, setManualToken] = useState('');
  const [error, setError] = useState('');

  const handleConnectOAuth = () => {
    setIsLoading(true);
    const token = localStorage.getItem('quickpost_token');
    window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/pinterest?token=${token}`;
  };

  const handleConnectManual = async (e) => {
    e.preventDefault();
    if (!manualToken.trim()) {
      setError('Please enter an access token');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await apiClient.post('/api/auth/pinterest/connect', {
        accessToken: manualToken.trim()
      });

      if (response.data.success) {
        onSuccess && onSuccess();
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to connect Pinterest account. Please check your token.');
    } finally {
      setIsLoading(false);
    }
  };

  const footer = (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
      <div className="text-left w-full sm:w-auto">
        <p className="text-sm font-semibold text-gray-900">Choose Method</p>
        <p className="text-xs text-gray-500 mt-0.5">Select automatic or manual token.</p>
      </div>
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <button
          onClick={onClose}
          disabled={isLoading}
          type="button"
          className="flex-1 sm:flex-none px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        {useManual ? (
          <button
             onClick={handleConnectManual}
             disabled={isLoading}
             type="button"
             className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2 bg-gray-900 hover:bg-black text-white text-sm font-bold rounded-xl shadow-md transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
           >
             {isLoading ? 'Connecting...' : 'Save & Connect'}
           </button>
        ) : (
          <button
            onClick={handleConnectOAuth}
            disabled={isLoading}
            type="button"
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2 bg-[#E60023] hover:bg-[#cc001f] text-white text-sm font-bold rounded-xl shadow-md shadow-[#E60023]/20 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Redirecting...
              </>
            ) : (
              <>
                Connect
                <ExternalLink className="w-4 h-4" />
              </>
            )}
          </button>
        )}
      </div>
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
        <div className="flex p-1 bg-gray-100/80 border border-gray-200/60 rounded-xl mb-6 shadow-inner">
          <button
            onClick={() => setUseManual(false)}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold transition-all ${!useManual ? 'bg-white shadow text-[#E60023]' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
          >
            Automatic
          </button>
          <button
            onClick={() => setUseManual(true)}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold transition-all ${useManual ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
          >
            Manual Token
          </button>
        </div>

        {!useManual ? (
          <div className="text-center py-4 animate-in fade-in slide-in-from-bottom-2">
            <p className="text-sm text-gray-600 leading-relaxed mb-6">
              Use this option if your Pinterest app is already verified. You'll be redirected to Pinterest to securely authorize QuickPost.
            </p>
          </div>
        ) : (
          <form onSubmit={handleConnectManual} className="space-y-5 animate-in fade-in slide-in-from-bottom-2">
            <div>
              <div className="flex items-end justify-between mb-2">
                <label className="text-sm font-bold text-gray-700">Access Token</label>
                <a 
                  href="https://developers.pinterest.com/apps/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-[#E60023] hover:underline flex items-center gap-1"
                >
                  Get Token <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="relative">
                <div className="absolute top-3.5 left-0 pl-3.5 flex items-start pointer-events-none text-gray-400">
                  <Key className="w-5 h-5" />
                </div>
                <textarea
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  placeholder="Paste your Pinterest access token here..."
                  className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#E60023]/20 focus:border-[#E60023] transition-all shadow-sm placeholder:text-gray-400 text-sm font-mono h-28 resize-none"
                  disabled={isLoading}
                />
              </div>
              {error && <p className="text-xs font-medium text-red-500 mt-2">{error}</p>}
            </div>

            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
              <HelpCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs font-medium text-blue-800 leading-relaxed">
                Use the <span className="font-bold">Manual Token</span> if your app is still in "Trial" mode. This allows you to connect instantly without waiting for Pinterest verification.
              </p>
            </div>
          </form>
        )}

        {/* Security Info */}
        <div className="flex items-start gap-3 p-4 bg-gray-100/80 rounded-2xl border border-gray-200/60 mt-4">
          <div className="p-2 bg-white rounded-lg shadow-sm shrink-0">
            <ShieldCheck className="w-5 h-5 text-gray-600" />
          </div>
          <div className="space-y-1 mt-0.5">
            <h4 className="font-semibold text-gray-900 text-xs uppercase tracking-wider">Encrypted Credentials</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              Your credentials are encrypted and stored securely. You can revoke access at any time from your Pinterest settings.
            </p>
          </div>
        </div>
      </div>
    </PlatformSetupModalLayout>
  );
}
