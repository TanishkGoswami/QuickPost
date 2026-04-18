import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

function PlatformCustomization({ selectedChannels, platformData, onPlatformDataChange, expanded, onToggleExpanded }) {
  if (selectedChannels.length === 0) return null;

  const handleChange = (platform, field, value) => {
    onPlatformDataChange({
      ...platformData,
      [platform]: {
        ...platformData[platform],
        [field]: value,
      },
    });
  };

  return (
    <div className="mb-6">
      <button
        type="button"
        onClick={onToggleExpanded}
        className="flex items-center gap-2 text-sm text-buffer-blue hover:text-buffer-blueDark font-medium transition-colors mb-3"
      >
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        Customize for each network
      </button>

      {expanded && (
        <div className="space-y-3">
          {/* Pinterest Customization */}
          {selectedChannels.includes('pinterest') && (
            <div className="platform-card">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#E60023">
                  <path d="M12 0a12 12 0 0 0-4.37 23.17c-.06-.56-.12-1.43 0-2.05l.87-3.65s-.22-.44-.22-1.09c0-1 .6-1.78 1.34-1.78.63 0 .94.48.94 1.05 0 .64-.41 1.6-.62 2.49-.18.74.37 1.34 1.1 1.34 1.32 0 2.33-1.39 2.33-3.4 0-1.78-1.28-3.02-3.1-3.02-2.11 0-3.35 1.58-3.35 3.22 0 .64.24 1.32.55 1.69.06.07.07.14.05.21l-.2.84c-.03.13-.11.16-.25.1-1-.46-1.62-1.91-1.62-3.07 0-2.34 1.7-4.49 4.9-4.49 2.57 0 4.57 1.83 4.57 4.28 0 2.55-1.61 4.6-3.85 4.6-.75 0-1.46-.39-1.7-.85l-.46 1.76c-.17.64-.62 1.44-.92 1.93.69.21 1.42.33 2.17.33A12 12 0 1 0 12 0z"/>
                </svg>
                <h4 className="font-semibold text-gray-900">Pinterest</h4>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pin Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={platformData.pinterest?.title || ''}
                    onChange={(e) => handleChange('pinterest', 'title', e.target.value)}
                    placeholder="Add a descriptive title for your Pin"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-buffer-blue focus:border-transparent text-sm"
                    maxLength={100}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {platformData.pinterest?.title?.length || 0}/100 characters
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Destination Link
                  </label>
                  <input
                    type="url"
                    value={platformData.pinterest?.link || ''}
                    onChange={(e) => handleChange('pinterest', 'link', e.target.value)}
                    placeholder="https://yourwebsite.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-buffer-blue focus:border-transparent text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Where should this Pin link to?
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Board <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={platformData.pinterest?.boardId || ''}
                    onChange={(e) => handleChange('pinterest', 'boardId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-buffer-blue focus:border-transparent text-sm"
                  >
                    <option value="">Select a board</option>
                    <option value="default">Default Board</option>
                    {/* Additional boards can be fetched from Pinterest API */}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Instagram Customization */}
          {selectedChannels.includes('instagram') && (
            <div className="platform-card">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="url(#instagram-gradient-custom)">
                  <defs>
                    <linearGradient id="instagram-gradient-custom" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#833AB4" />
                      <stop offset="50%" stopColor="#E1306C" />
                      <stop offset="100%" stopColor="#FCAF45" />
                    </linearGradient>
                  </defs>
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                <h4 className="font-semibold text-gray-900">Instagram</h4>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Comment (for hashtags)
                </label>
                <textarea
                  value={platformData.instagram?.firstComment || ''}
                  onChange={(e) => handleChange('instagram', 'firstComment', e.target.value)}
                  placeholder="Add hashtags as a first comment to keep your caption clean..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-buffer-blue focus:border-transparent text-sm resize-none"
                  rows={3}
                  maxLength={2200}
                />
                <p className="text-xs text-gray-500 mt-1">
                  This will be posted as the first comment on your Instagram post
                </p>
              </div>
            </div>
          )}

          {/* YouTube Customization */}
          {selectedChannels.includes('youtube') && (
            <div className="platform-card">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#FF0000">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                <h4 className="font-semibold text-gray-900">YouTube</h4>
              </div>

              <div className="text-sm text-gray-600">
                <p>✓ Will be posted as YouTube Shorts</p>
                <p className="mt-1">✓ Using the main caption as video description</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PlatformCustomization;
