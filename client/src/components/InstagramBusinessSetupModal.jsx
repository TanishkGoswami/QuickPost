import React from 'react';
import { X, ExternalLink, CheckCircle2, AlertCircle } from 'lucide-react';

function InstagramBusinessSetupModal({ isOpen, onClose, onProceed }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-xl font-semibold text-gray-900">Instagram Business Account Setup</h2>
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
          <div className="p-4 bg-gray-100 border border-gray-300 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">Instagram Business Account Required</p>
              <p className="text-sm text-blue-700 mt-1">
                To post to Instagram via QuickPost, you need to convert your personal Instagram account to a Business or Creator account.
              </p>
            </div>
          </div>

          {/* Why Business Account */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Why Do I Need a Business Account?</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span>Access to Instagram Graph API for automated posting</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span>Advanced analytics and insights</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span>Ability to run ads and promotions</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span>Professional tools and features</span>
              </li>
            </ul>
          </div>

          {/* Step-by-step Guide */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">How to Convert Your Account</h3>
            
            <div className="space-y-4">
              {/* Step 1 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-buffer-blue text-white rounded-full flex items-center justify-center font-semibold text-sm">
                  1
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">Open Instagram App</h4>
                  <p className="text-sm text-gray-600">Launch the Instagram app on your mobile device and log into your account.</p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-buffer-blue text-white rounded-full flex items-center justify-center font-semibold text-sm">
                  2
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">Go to Settings</h4>
                  <p className="text-sm text-gray-600">Tap your profile picture → Menu (☰) → Settings and privacy</p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-buffer-blue text-white rounded-full flex items-center justify-center font-semibold text-sm">
                  3
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">Switch Account Type</h4>
                  <p className="text-sm text-gray-600">Tap "Account type and tools" → "Switch to professional account"</p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-buffer-blue text-white rounded-full flex items-center justify-center font-semibold text-sm">
                  4
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">Choose Account Type</h4>
                  <p className="text-sm text-gray-600">Select either "Business" or "Creator" → Follow the prompts</p>
                </div>
              </div>

              {/* Step 5 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-buffer-blue text-white rounded-full flex items-center justify-center font-semibold text-sm">
                  5
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">Create/Link Facebook Page</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    You'll need to create a Facebook Page or link an existing one. This is required for the Instagram Graph API.
                  </p>
                  <a
                    href="https://www.facebook.com/pages/creation"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-buffer-blue hover:text-buffer-blueDark"
                  >
                    Create Facebook Page
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Step 6 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-buffer-blue text-white rounded-full flex items-center justify-center font-semibold text-sm">
                  6
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">Complete Setup</h4>
                  <p className="text-sm text-gray-600">Fill in your business details and complete the setup process.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Resources */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">Need Help?</h4>
            <div className="space-y-2">
              <a
                href="https://help.instagram.com/502981923235522"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-buffer-blue hover:text-buffer-blueDark"
              >
                <ExternalLink className="w-4 h-4" />
                Instagram Official Guide: Switch to Business Account
              </a>
              <a
                href="https://www.facebook.com/business/help/898752960195806"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-buffer-blue hover:text-buffer-blueDark"
              >
                <ExternalLink className="w-4 h-4" />
                Connect Instagram Business Account to Facebook Page
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-600">This process takes about 2-3 minutes</p>
            <p className="text-xs text-gray-500 mt-1">Already have a Business account? Click Continue</p>
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
              className="px-4 py-2 bg-buffer-blue hover:bg-buffer-blueDark text-white font-medium rounded-lg transition-colors"
            >
              Continue to Connect
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InstagramBusinessSetupModal;
