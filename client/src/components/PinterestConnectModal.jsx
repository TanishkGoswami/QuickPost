import React, { useState } from 'react';
import { X } from 'lucide-react';

function PinterestConnectModal({ isOpen, onClose }) {
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleConnect = () => {
    setIsLoading(true);
    const token = localStorage.getItem('quickpost_token');
    // Redirect to Pinterest OAuth flow
    window.location.href = `http://localhost:5000/api/auth/pinterest?token=${token}`;
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
          <h2 className="text-xl font-semibold text-gray-900">Connect Pinterest</h2>
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
            Click the button below to securely connect your Pinterest account. You'll be redirected to Pinterest to authorize QuickPost.
          </p>

          <button
            onClick={handleConnect}
            disabled={isLoading}
            className="w-full bg-red-600 text-white py-3 px-4 rounded-md hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
          >
            {isLoading ? 'Redirecting...' : 'Connect with Pinterest'}
          </button>

          <p className="text-xs text-gray-500 mt-4 text-center">
            Your Client ID and Secret are configured on the server
          </p>
        </div>
      </div>
    </div>
  );
}

export default PinterestConnectModal;
