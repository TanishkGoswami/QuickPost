import React, { useState } from 'react';
import { X, ExternalLink, HelpCircle } from 'lucide-react';
import apiClient from '../utils/apiClient';

function PinterestConnectModal({ isOpen, onClose, onSuccess }) {
  const [isLoading, setIsLoading] = useState(false);
  const [useManual, setUseManual] = useState(false);
  const [manualToken, setManualToken] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleConnectOAuth = () => {
    setIsLoading(true);
    const token = localStorage.getItem('quickpost_token');
    // Redirect to Pinterest OAuth flow
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
      console.error('Pinterest manual connection failed:', err);
      setError(err.response?.data?.error || 'Failed to connect Pinterest account. Please check your token.');
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
        className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="bg-red-50 p-2 rounded-lg">
              <img src="https://www.pinterest.com/favicon.ico" alt="Pinterest" className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Connect Pinterest</h2>
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
          <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
            <button
              onClick={() => setUseManual(false)}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${!useManual ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Automatic
            </button>
            <button
              onClick={() => setUseManual(true)}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${useManual ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Manual Token
            </button>
          </div>

          {!useManual ? (
            <div className="space-y-6">
              <p className="text-sm text-gray-600 leading-relaxed">
                Use this option if your Pinterest app is already verified. You'll be redirected to Pinterest to authorize QuickPost.
              </p>
              <button
                onClick={handleConnectOAuth}
                disabled={isLoading}
                className="w-full bg-red-600 text-white py-3.5 px-4 rounded-xl hover:bg-red-700 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold shadow-lg shadow-red-100 flex items-center justify-center gap-2"
              >
                {isLoading ? 'Redirecting...' : (
                  <>
                    Connect with Pinterest <ExternalLink size={18} />
                  </>
                )}
              </button>
            </div>
          ) : (
            <form onSubmit={handleConnectManual} className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-gray-700">Access Token</label>
                  <a 
                    href="https://developers.pinterest.com/apps/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-red-600 hover:underline flex items-center gap-1"
                  >
                    Get Token <ExternalLink size={12} />
                  </a>
                </div>
                <textarea
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  placeholder="Paste your Pinterest access token here..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all text-sm h-32 resize-none"
                  disabled={isLoading}
                />
                {error && <p className="text-xs text-red-500 mt-1 font-medium">{error}</p>}
              </div>

              <div className="bg-blue-50 p-4 rounded-xl flex gap-3">
                <HelpCircle className="text-blue-500 flex-shrink-0" size={20} />
                <p className="text-xs text-blue-700 leading-relaxed">
                  Use the <strong>Manual Token</strong> if your app is still in "Trial" mode. This allows you to connect instantly without waiting for Pinterest verification.
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gray-900 text-white py-3.5 px-4 rounded-xl hover:bg-black transition-all disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold shadow-lg shadow-gray-200"
              >
                {isLoading ? 'Connecting...' : 'Save & Connect Account'}
              </button>
            </form>
          )}

          <p className="text-xs text-gray-400 mt-6 text-center">
            Your credentials are encrypted and stored securely.
          </p>
        </div>
      </div>
    </div>
  );
}

export default PinterestConnectModal;
