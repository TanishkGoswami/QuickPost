import React, { useState } from 'react';
import { X } from 'lucide-react';

function TikTokConnectModal({ isOpen, onClose }) {
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleConnect = () => {
    setIsLoading(true);
    const token = localStorage.getItem('quickpost_token');
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    // Redirect to TikTok OAuth flow
    window.location.href = `${apiUrl}/api/auth/tiktok?token=${token}`;
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
            <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Connect TikTok</h2>
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
            Connecting your TikTok account allows QuickPost to publish videos directly to your feed or drafts.
          </p>

          <button
            onClick={handleConnect}
            disabled={isLoading}
            className="w-full bg-black text-white py-3 px-4 rounded-md hover:bg-gray-900 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Redirecting...
              </>
            ) : (
                'Connect with TikTok'
            )}
          </button>

          <p className="text-xs text-gray-500 mt-4 text-center">
            You'll be redirected to TikTok to authorize QuickPost.
          </p>
        </div>
      </div>
    </div>
  );
}

export default TikTokConnectModal;
