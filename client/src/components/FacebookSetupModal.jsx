import React from 'react';
import { X, ExternalLink, CheckCircle2, AlertCircle } from 'lucide-react';

function FacebookSetupModal({ isOpen, onClose, onProceed }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-xl font-semibold text-gray-900">Facebook Page Required</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Alert */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-900">Important: You must have a Facebook Page</p>
              <p className="text-sm text-amber-800 mt-1">
                If you try to connect an account that does <strong>not</strong> have a Facebook Page, Facebook may block the login and show a <strong>"Feature Unavailable"</strong> error.
              </p>
            </div>
          </div>

          {/* Why a Page is needed */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Why Do I Need a Facebook Page?</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span>Meta API does not allow automated posting to personal profiles</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span>You need a Page to connect an Instagram Business account</span>
              </li>
            </ul>
          </div>

          {/* Step-by-step Guide */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">How to Create a Facebook Page</h3>
            
            <div className="space-y-4">
              {/* Step 1 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-link text-white rounded-full flex items-center justify-center font-semibold text-sm">
                  1
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">Go to Facebook Pages</h4>
                  <p className="text-sm text-gray-600 mb-2">Log into Facebook and go to the Pages section.</p>
                  <a
                    href="https://www.facebook.com/pages/creation"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-link hover:underline"
                  >
                    Create Facebook Page
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-link text-white rounded-full flex items-center justify-center font-semibold text-sm">
                  2
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">Fill in the details</h4>
                  <p className="text-sm text-gray-600">Enter a Page name and category. This can be anything (e.g., "My Business" or "Creator Profile").</p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-link text-white rounded-full flex items-center justify-center font-semibold text-sm">
                  3
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">Click Create Page</h4>
                  <p className="text-sm text-gray-600">Once created, you can return here and click "Continue to Connect".</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-between items-center">
          <div>
            <p className="text-xs text-gray-500">Already have a Facebook Page? Click Continue</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-200 font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (onProceed) {
                  onProceed();
                } else {
                  onClose();
                }
              }}
              className="px-4 py-2 bg-link hover:opacity-90 text-white font-medium rounded-lg transition-colors shadow-sm"
            >
              Continue to Connect
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FacebookSetupModal;
