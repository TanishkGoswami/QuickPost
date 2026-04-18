import React, { useState } from 'react';
import { X, Globe, AlertCircle } from 'lucide-react';
import axios from 'axios';

function MastodonConnectModal({ isOpen, onClose }) {
  const [instanceUrl, setInstanceUrl] = useState('mastodon.social');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleConnect = async () => {
    if (!instanceUrl) {
      setError('Please enter a Mastodon instance URL');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('quickpost_token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      const response = await axios.post(
        `${apiUrl}/api/auth/mastodon/init`, 
        { instanceUrl },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success && response.data.authUrl) {
        // Redirect to Mastodon OAuth flow
        window.location.href = response.data.authUrl;
      } else {
        setError('Failed to initialize Mastodon connection');
      }
    } catch (err) {
      console.error('Mastodon connection error:', err);
      setError(err.response?.data?.error || 'Failed to connect to the Mastodon instance. Check the URL and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" 
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Globe className="text-indigo-600" size={24} />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Connect Mastodon</h2>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-gray-600 mb-6">
            Mastodon is decentralized. Please enter your instance URL (e.g., mastodon.social) to connect your account.
          </p>

          <div className="space-y-4">
            <div>
              <label htmlFor="instanceUrl" className="block text-sm font-medium text-gray-700 mb-1">
                Instance URL
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="instanceUrl"
                  placeholder="e.g., mastodon.social"
                  value={instanceUrl}
                  onChange={(e) => setInstanceUrl(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  disabled={isLoading}
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-md text-red-600 text-sm">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <button
              onClick={handleConnect}
              disabled={isLoading}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Registering App...
                </>
              ) : (
                'Connect Account'
              )}
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-6 text-center">
            By connecting, you'll be redirected to your instance to authorize QuickPost to post on your behalf.
          </p>
        </div>
      </div>
    </div>
  );
}

export default MastodonConnectModal;
