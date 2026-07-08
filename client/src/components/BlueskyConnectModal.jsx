import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Eye, EyeOff, Key, User, ShieldCheck } from 'lucide-react';
import apiClient from '../utils/apiClient';
import PlatformSetupModalLayout from './platforms/PlatformSetupModalLayout';

export default function BlueskyConnectModal({ isOpen, onClose, onSuccess }) {
  const [handle, setHandle] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConnect = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const cleanHandle = handle.trim().replace(/^@/, '');
      const response = await apiClient.post(
        '/api/auth/bluesky/connect',
        { handle: cleanHandle, appPassword }
      );

      if (response.data.success) {
        onSuccess && onSuccess();
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to connect to Bluesky');
    } finally {
      setIsLoading(false);
    }
  };

  const footer = (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
      <div className="text-left w-full sm:w-auto">
        <p className="text-sm font-semibold text-gray-900">App Password</p>
        <p className="text-xs text-gray-500 mt-0.5">Required for third-party access.</p>
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
          disabled={isLoading || !handle || !appPassword}
          type="submit"
          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2 bg-[#0085ff] hover:bg-[#0070d6] text-white text-sm font-bold rounded-xl shadow-md shadow-[#0085ff]/20 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Connect
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
      title="Connect Bluesky"
      icon="/icons/bluesky-circle-color-icon.svg"
      iconBgColor="bg-blue-50"
      footer={footer}
    >
      <div className="space-y-6">
        {/* About */}
        <div className="text-center mb-6">
          <p className="text-sm text-gray-600 max-w-sm mx-auto leading-relaxed">
            Connect your Bluesky account to automatically share your posts to the decentralized AT Protocol network.
          </p>
        </div>

        <form onSubmit={handleConnect} className="space-y-5">
          {/* Handle Input */}
          <div>
            <label htmlFor="handle" className="block text-sm font-bold text-gray-700 mb-2">
              Bluesky Handle
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <User className="w-5 h-5" />
              </div>
              <input
                type="text"
                id="handle"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="username.bsky.social"
                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0085ff]/20 focus:border-[#0085ff] transition-all shadow-sm placeholder:text-gray-400 text-sm font-medium"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* App Password Input */}
          <div>
            <div className="flex justify-between items-end mb-2">
              <label htmlFor="appPassword" className="block text-sm font-bold text-gray-700">
                App Password
              </label>
              <a 
                href="https://bsky.app/settings/app-passwords" 
                target="_blank" 
                rel="noreferrer"
                className="text-xs font-semibold text-[#0085ff] hover:underline"
              >
                Get App Password
              </a>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Key className="w-5 h-5" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                id="appPassword"
                value={appPassword}
                onChange={(e) => setAppPassword(e.target.value)}
                placeholder="xxxx-xxxx-xxxx-xxxx"
                className="w-full pl-11 pr-12 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0085ff]/20 focus:border-[#0085ff] transition-all shadow-sm placeholder:text-gray-400 text-sm font-medium font-mono"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error Message */}
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
              We never ask for your main password. Your app password is encrypted and only used for posting on your behalf.
            </p>
          </div>
        </div>
      </div>
    </PlatformSetupModalLayout>
  );
}
