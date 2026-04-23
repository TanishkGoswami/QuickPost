import React, { useState } from 'react';
import { X, AlertCircle, Info, CheckCircle2, ExternalLink, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';

function BlueskyConnectModal({ isOpen, onClose, onSuccess }) {
  const [handle, setHandle] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleConnect = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('quickpost_token');
      // Remove @ symbol if user included it
      const cleanHandle = handle.trim().replace(/^@/, '');
      
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await axios.post(
        `${apiUrl}/api/auth/bluesky/connect`,
        { handle: cleanHandle, appPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        onSuccess && onSuccess();
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to connect to Bluesky');
      console.error('Bluesky connection error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" 
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-xl font-semibold text-gray-900">Connect Bluesky Account</h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Info Alert */}
          {/* <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">App Password Required</p>
              <p className="text-sm text-blue-700 mt-1">
                For security, Bluesky requires an App Password for third-party applications. Your main account password won't work here.
              </p>
            </div>
          </div> */}

          {/* What is Bluesky */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">About Bluesky</h3>
            <p className="text-sm text-gray-700">
              Bluesky is a decentralized social network built on the AT Protocol. It offers features similar to Twitter/X 
              with a focus on user control and open standards.
            </p>
          </div>


          {/* Form */}
          <form onSubmit={handleConnect} className="space-y-4">
            {/* Handle Input */}
            <div>
              <label htmlFor="handle" className="block text-sm font-medium text-gray-700 mb-2">
                Bluesky Handle
              </label>
              <input
                type="text"
                id="handle"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="username.bsky.social"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Your full Bluesky handle without @ (e.g., alice.bsky.social or custom domain)
              </p>
            </div>

            {/* App Password Input */}
            <div>
              <label htmlFor="appPassword" className="block text-sm font-medium text-gray-700 mb-2">
                App Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="appPassword"
                  value={appPassword}
                  onChange={(e) => setAppPassword(e.target.value)}
                  placeholder="xxxx-xxxx-xxxx-xxxx"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Not your main password - use the app password you created in Settings
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !handle || !appPassword}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Connect Account
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Additional Info */}
          <div className="p-4 bg-gray-50 rounded-lg space-y-2">
            <h4 className="font-semibold text-gray-900 text-sm">Security Notes</h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• App passwords can be revoked anytime from your Bluesky settings</li>
              <li>• Each app password works only for the app it was created for</li>
              <li>• Your credentials are stored securely and encrypted</li>
              <li>• You can disconnect your account anytime from QuickPost</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BlueskyConnectModal;
