import React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

function PlatformCustomization({
  selectedChannels,
  platformData,
  onPlatformDataChange,
  expanded,
  onToggleExpanded,
  youtubeThumbnail,
  onYoutubeThumbnailChange,
}) {
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

  const handleThumbnailChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        alert("Thumbnail image must be less than 2MB");
        return;
      }
      onYoutubeThumbnailChange(file);
    }
  };

  return (
    <div className="mb-6">
      <button
        type="button"
        onClick={onToggleExpanded}
        className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-semibold transition-colors mb-3 group"
      >
        <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
          {expanded ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </div>
        Customize for each network
      </button>

      {expanded && (
        <div className="space-y-3">
          {/* Pinterest Customization */}
          {selectedChannels.includes("pinterest") && (
            <div className="platform-card">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#E60023">
                  <path d="M12 0a12 12 0 0 0-4.37 23.17c-.06-.56-.12-1.43 0-2.05l.87-3.65s-.22-.44-.22-1.09c0-1 .6-1.78 1.34-1.78.63 0 .94.48.94 1.05 0 .64-.41 1.6-.62 2.49-.18.74.37 1.34 1.1 1.34 1.32 0 2.33-1.39 2.33-3.4 0-1.78-1.28-3.02-3.1-3.02-2.11 0-3.35 1.58-3.35 3.22 0 .64.24 1.32.55 1.69.06.07.07.14.05.21l-.2.84c-.03.13-.11.16-.25.1-1-.46-1.62-1.91-1.62-3.07 0-2.34 1.7-4.49 4.9-4.49 2.57 0 4.57 1.83 4.57 4.28 0 2.55-1.61 4.6-3.85 4.6-.75 0-1.46-.39-1.7-.85l-.46 1.76c-.17.64-.62 1.44-.92 1.93.69.21 1.42.33 2.17.33A12 12 0 1 0 12 0z" />
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
                    value={platformData.pinterest?.title || ""}
                    onChange={(e) =>
                      handleChange("pinterest", "title", e.target.value)
                    }
                    placeholder="Add a descriptive title for your Pin"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm placeholder:text-gray-400 transition-all"
                    maxLength={100}
                  />
                  <p className="text-[10px] text-gray-400 mt-1.5 font-medium">
                    {platformData.pinterest?.title?.length || 0}/100 characters
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Destination Link
                  </label>
                  <input
                    type="url"
                    value={platformData.pinterest?.link || ""}
                    onChange={(e) =>
                      handleChange("pinterest", "link", e.target.value)
                    }
                    placeholder="https://yourwebsite.com"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm placeholder:text-gray-400 transition-all"
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
                    value={platformData.pinterest?.boardId || ""}
                    onChange={(e) =>
                      handleChange("pinterest", "boardId", e.target.value)
                    }
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
          {selectedChannels.includes("instagram") && (
            <div className="platform-card">
              <div className="flex items-center gap-2 mb-3">
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="url(#instagram-gradient-custom)"
                >
                  <defs>
                    <linearGradient
                      id="instagram-gradient-custom"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#833AB4" />
                      <stop offset="50%" stopColor="#E1306C" />
                      <stop offset="100%" stopColor="#FCAF45" />
                    </linearGradient>
                  </defs>
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
                <h4 className="font-semibold text-gray-900">Instagram</h4>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Comment (for hashtags)
                </label>
                <textarea
                  value={platformData.instagram?.firstComment || ""}
                  onChange={(e) =>
                    handleChange("instagram", "firstComment", e.target.value)
                  }
                  placeholder="Add hashtags as a first comment to keep your caption clean..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm resize-none placeholder:text-gray-400 transition-all"
                  rows={3}
                  maxLength={2200}
                />
                <p className="text-xs text-gray-500 mt-1">
                  This will be posted as the first comment on your Instagram
                  post
                </p>
              </div>
            </div>
          )}

          {/* YouTube Customization */}
          {selectedChannels.includes("youtube") && (
            <div className="platform-card">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#FF0000">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
                <h4 className="font-semibold text-gray-900">YouTube</h4>
              </div>

              <div className="space-y-4">
                <div className="text-[11px] text-indigo-700 bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100/50 font-medium">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                    <span>
                      Posting as YouTube Short • Caption as description
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Thumbnail
                  </label>

                  {youtubeThumbnail ? (
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-gray-200 group">
                      <img
                        src={URL.createObjectURL(youtubeThumbnail)}
                        alt="Thumbnail Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => onYoutubeThumbnailChange(null)}
                          className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors shadow-lg"
                        >
                          Remove
                        </button>
                        <label className="px-3 py-1.5 bg-white text-gray-900 text-xs font-bold rounded-lg hover:bg-gray-50 transition-colors shadow-lg cursor-pointer">
                          Change
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleThumbnailChange}
                          />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full aspect-video rounded-lg border-2 border-dashed border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-all cursor-pointer group">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg
                          className="w-8 h-8 text-gray-400 group-hover:text-gray-500 mb-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="1.5"
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider group-hover:text-gray-600">
                          Select Thumbnail
                        </p>
                        <p className="text-[9px] text-gray-400 mt-1">
                          PNG, JPG, WebP (Max 2MB)
                        </p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleThumbnailChange}
                      />
                    </label>
                  )}
                  <p className="text-[10px] text-gray-400 mt-2 leading-relaxed font-medium">
                    <span className="text-indigo-500">Pro Tip:</span> Custom
                    thumbnails significantly increase CTR on YouTube.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PlatformCustomization;
