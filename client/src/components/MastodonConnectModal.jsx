import React, { useState } from 'react';
import { AlertCircle, Globe, ShieldCheck, ArrowRight } from 'lucide-react';
import apiClient from '../utils/apiClient';
import PlatformSetupModalLayout from './platforms/PlatformSetupModalLayout';

export default function MastodonConnectModal({ isOpen, onClose }) {
  const [instanceUrl, setInstanceUrl] = useState('mastodon.social');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleConnect = async (e) => {
    e.preventDefault();
    if (!instanceUrl) {
      setError('Please enter a Mastodon instance URL');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.post(
        '/api/auth/mastodon/init', 
        { instanceUrl }
      );

      if (response.data.success && response.data.authUrl) {
        window.location.href = response.data.authUrl;
      } else {
        setError('Failed to initialize Mastodon connection');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to connect to the Mastodon instance. Check the URL and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const footer = (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
      <div className="text-left w-full sm:w-auto">
        <p className="text-sm font-semibold text-gray-900">Ready to connect?</p>
        <p className="text-xs text-gray-500 mt-0.5">You will be redirected to your instance.</p>
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
        <button
          onClick={handleConnect}
          disabled={isLoading || !instanceUrl}
          type="submit"
          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2 bg-[#6364FF] hover:bg-[#5051e6] text-white text-sm font-bold rounded-xl shadow-md shadow-[#6364FF]/20 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Registering...
            </>
          ) : (
            <>
              Connect
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
      title="Connect Mastodon"
      icon="/icons/mastodon-color-icon.svg"
      iconBgColor="bg-indigo-50"
      footer={footer}
    >
      <div className="space-y-6">
        <div className="text-center mb-6">
          <p className="text-sm text-gray-600 max-w-sm mx-auto leading-relaxed">
            Mastodon is decentralized. Please enter your instance URL (e.g., <span className="font-medium text-gray-900">mastodon.social</span>) to connect your account.
          </p>
        </div>

        <form onSubmit={handleConnect} className="space-y-5">
          <div>
            <label htmlFor="instanceUrl" className="block text-sm font-bold text-gray-700 mb-2">
              Instance URL
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Globe className="w-5 h-5" />
              </div>
              <input
                type="text"
                id="instanceUrl"
                placeholder="mastodon.social"
                value={instanceUrl}
                onChange={(e) => setInstanceUrl(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6364FF]/20 focus:border-[#6364FF] transition-all shadow-sm placeholder:text-gray-400 text-sm font-medium"
                disabled={isLoading}
                required
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          )}
        </form>

        {/* Security Info */}
        <div className="flex items-start gap-3 p-4 bg-gray-100/80 rounded-2xl border border-gray-200/60 mt-8">
          <div className="p-2 bg-white rounded-lg shadow-sm shrink-0">
            <ShieldCheck className="w-5 h-5 text-gray-600" />
          </div>
          <div className="space-y-1 mt-0.5">
            <h4 className="font-semibold text-gray-900 text-xs uppercase tracking-wider">Secure Connection</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              By connecting, you'll be redirected to your instance to securely authorize QuickPost to post on your behalf.
            </p>
          </div>
        </div>
      </div>
    </PlatformSetupModalLayout>
  );
}
