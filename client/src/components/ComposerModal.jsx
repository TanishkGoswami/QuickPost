import React, { useState, useRef } from 'react';
import apiClient from '../utils/apiClient';
import { X, Upload, Loader2, Sparkles, Eye, ChevronDown, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ChannelSelector from './ChannelSelector';
import PlatformCustomization from './PlatformCustomization';


/* ── Platform meta ── */
const PLATFORM_META = {
  instagram: {
    label: 'Instagram', icon: 'https://cdn.simpleicons.org/instagram/E4405F',
    headerBg: 'linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)',
    bodyBg: '#fff', textColor: '#fff', imgAspect: 'aspect-square',
    actions: ['❤️', '💬', '✈️', '🔖'],
  },
  facebook: {
    label: 'Facebook', icon: 'https://cdn.simpleicons.org/facebook/1877F2',
    headerBg: '#1877F2', bodyBg: '#f0f2f5', textColor: '#fff', imgAspect: 'aspect-video',
    actions: ['👍 Like', '💬 Comment', '↗️ Share'],
  },
  x: {
    label: 'X', icon: null,
    headerBg: '#000', bodyBg: '#fff', textColor: '#fff', imgAspect: 'aspect-video',
    actions: ['💬', '🔁', '❤️', '📊'],
  },
  linkedin: {
    label: 'LinkedIn', icon: null,
    headerBg: '#0A66C2', bodyBg: '#f3f2ef', textColor: '#fff', imgAspect: 'aspect-[1.91/1]',
    actions: ['👍 Like', '💬 Comment', '↗️ Share'],
  },
  youtube: {
    label: 'YouTube', icon: 'https://cdn.simpleicons.org/youtube/FF0000',
    headerBg: '#FF0000', bodyBg: '#0f0f0f', textColor: '#fff', imgAspect: 'aspect-video',
    actions: ['👍', '👎', '↗️ Share', '⬇️ Save'],
  },
  tiktok: {
    label: 'TikTok', icon: 'https://cdn.simpleicons.org/tiktok/000',
    headerBg: '#000', bodyBg: '#000', textColor: '#fff', imgAspect: 'aspect-[9/16]',
    actions: ['❤️', '💬', '🔖', '↗️'],
  },
  threads: {
    label: 'Threads', icon: 'https://cdn.simpleicons.org/threads/000',
    headerBg: '#000', bodyBg: '#fff', textColor: '#fff', imgAspect: 'aspect-square',
    actions: ['❤️', '💬', '🔁', '↗️'],
  },
  pinterest: {
    label: 'Pinterest', icon: 'https://cdn.simpleicons.org/pinterest/BD081C',
    headerBg: '#BD081C', bodyBg: '#fff', textColor: '#fff', imgAspect: 'aspect-[2/3]',
    actions: ['Save'],
  },
  bluesky: {
    label: 'Bluesky', icon: 'https://cdn.simpleicons.org/bluesky/0085FF',
    headerBg: '#0085FF', bodyBg: '#fff', textColor: '#fff', imgAspect: 'aspect-video',
    actions: ['❤️', '🔁', '💬', '↗️'],
  },
  mastodon: {
    label: 'Mastodon', icon: 'https://cdn.simpleicons.org/mastodon/6364FF',
    headerBg: '#6364FF', bodyBg: '#191b22', textColor: '#fff', imgAspect: 'aspect-video',
    actions: ['↩️ Reply', '🔁 Boost', '⭐ Fav', '↗️'],
  },
};

function XIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932 6.064-6.932zm-1.294 19.497h2.039L6.482 3.239H4.293L17.607 20.65z"/>
    </svg>
  );
}

function LinkedInIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}

/* ── Platform Preview Panel ── */
function PlatformPreviewPanel({ selectedChannels, caption, mediaFile, mediaType }) {
  const [activeId, setActiveId] = React.useState(null);

  // Keep activeId in sync with selectedChannels
  React.useEffect(() => {
    if (selectedChannels.length > 0) {
      setActiveId(prev => selectedChannels.includes(prev) ? prev : selectedChannels[0]);
    }
  }, [selectedChannels]);

  const meta = PLATFORM_META[activeId] || PLATFORM_META.instagram;
  const mediaUrl = mediaFile ? URL.createObjectURL(mediaFile) : null;
  const truncatedCaption = caption?.length > 120 ? caption.slice(0, 120) + '…' : caption;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Platform tabs */}
      <div className="flex gap-1 px-3 py-2 overflow-x-auto border-b border-gray-200 bg-white flex-shrink-0">
        {selectedChannels.map(id => {
          const m = PLATFORM_META[id];
          if (!m) return null;
          const isActive = activeId === id;
          return (
            <button
              key={id}
              onClick={() => setActiveId(id)}
              title={m.label}
              className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                isActive ? 'bg-gray-100 ring-2 ring-indigo-400 ring-offset-1' : 'hover:bg-gray-50'
              }`}
            >
              {id === 'x'
                ? <XIcon className="w-4 h-4 text-black" />
                : id === 'linkedin'
                  ? <LinkedInIcon className="w-5 h-5 text-[#0A66C2]" />
                  : <img src={m.icon} alt={m.label} className="w-5 h-5 object-contain" />
              }
            </button>
          );
        })}
      </div>

      {/* Scrollable preview area */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeId && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* App header bar */}
            <div className="flex items-center gap-2 px-3 py-2" style={{ background: meta.headerBg }}>
              {activeId === 'x'
                ? <XIcon className="w-4 h-4 text-white" />
                : activeId === 'linkedin'
                  ? <LinkedInIcon className="w-4 h-4 text-white" />
                  : <img src={meta.icon} alt={meta.label} className="w-4 h-4 object-contain brightness-200" />
              }
              <span className="text-[11px] font-bold tracking-wide" style={{ color: meta.textColor }}>
                {meta.label}
              </span>
            </div>

            {/* Post body */}
            <div style={{ background: meta.bodyBg }}>
              {/* User row */}
              <div className="flex items-center gap-2 px-3 pt-3 pb-2">
                <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-bold text-gray-600">U</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold truncate" style={{ color: activeId === 'youtube' || activeId === 'tiktok' || activeId === 'mastodon' ? '#fff' : '#111' }}>
                    Your Account
                  </p>
                  <p className="text-[9px]" style={{ color: activeId === 'youtube' || activeId === 'tiktok' || activeId === 'mastodon' ? '#aaa' : '#888' }}>
                    Just now
                  </p>
                </div>
                {/* Follow button for some platforms */}
                {['youtube', 'tiktok'].includes(activeId) && (
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border border-white text-white">Follow</span>
                )}
              </div>

              {/* Caption (before image for Facebook/LinkedIn/X) */}
              {!['instagram', 'pinterest', 'tiktok'].includes(activeId) && caption && (
                <p className="px-3 pb-2 text-[11px] leading-relaxed" style={{ color: activeId === 'youtube' || activeId === 'mastodon' ? '#eee' : '#222' }}>
                  {truncatedCaption}
                </p>
              )}

              {/* Media */}
              <div className={`w-full ${meta.imgAspect} overflow-hidden relative bg-gray-900`}>
                {mediaUrl ? (
                  mediaType === 'image' ? (
                    <img src={mediaUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <video src={mediaUrl} className="w-full h-full object-cover" muted playsInline />
                  )
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100">
                    <ImageIcon className="w-8 h-8 text-gray-300 mb-1" />
                    <span className="text-[10px] text-gray-400">No media yet</span>
                  </div>
                )}
                {/* TikTok overlay */}
                {activeId === 'tiktok' && caption && (
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                    <p className="text-white text-[10px] leading-tight">{truncatedCaption}</p>
                  </div>
                )}
              </div>

              {/* Caption (after image for Instagram/Pinterest) */}
              {['instagram', 'pinterest'].includes(activeId) && caption && (
                <p className="px-3 pt-2 pb-1 text-[11px] leading-relaxed text-gray-800">
                  {truncatedCaption}
                </p>
              )}

              {/* Action bar */}
              <div className="flex items-center gap-3 px-3 py-2 border-t border-gray-100" style={{ borderColor: activeId === 'youtube' || activeId === 'mastodon' ? '#333' : '#f0f0f0' }}>
                {meta.actions.map((a, i) => (
                  <span key={i} className="text-[11px]" style={{ color: activeId === 'youtube' || activeId === 'tiktok' || activeId === 'mastodon' ? '#ccc' : '#555' }}>
                    {a}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Platform label */}
        {activeId && (
          <p className="text-center text-[10px] text-gray-400 mt-3 font-medium">
            Preview — {PLATFORM_META[activeId]?.label}
          </p>
        )}
      </div>
    </div>
  );
}

function ComposerModal({ isOpen, onClose, onPostCreated }) {

  const { connectedAccounts } = useAuth();
  const [caption, setCaption] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [selectedChannels, setSelectedChannels] = useState([]);
  const [platformData, setPlatformData] = useState({
    pinterest: { title: '', link: '', boardId: '' },
    instagram: { firstComment: '' },
    youtube: {},
  });
  const [customizationExpanded, setCustomizationExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // Auto-select connected channels on mount
  React.useEffect(() => {
    if (isOpen && selectedChannels.length === 0) {
      const connected = [];
      if (connectedAccounts.youtube) connected.push('youtube');
      if (connectedAccounts.instagram) connected.push('instagram');
      if (connectedAccounts.pinterest) connected.push('pinterest');
      if (connectedAccounts.facebook) connected.push('facebook');
      if (connectedAccounts.threads) connected.push('threads');
      setSelectedChannels(connected);
    }
  }, [isOpen, connectedAccounts]);

  const handleChannelToggle = (platformId) => {
    setSelectedChannels((prev) =>
      prev.includes(platformId)
        ? prev.filter((id) => id !== platformId)
        : [...prev, platformId]
    );
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        setMediaFile(file);
        setError(null);
      } else {
        setError('Please upload an image or video file');
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        setMediaFile(file);
        setError(null);
      } else {
        setError('Please upload an image or video file');
      }
    }
  };

  const removeFile = () => {
    setMediaFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateForm = () => {
    if (selectedChannels.length === 0) {
      setError('Please select at least one channel');
      return false;
    }

    if (!caption.trim()) {
      setError('Please enter a caption');
      return false;
    }

    if (!mediaFile) {
      setError('Please upload an image or video');
      return false;
    }

    // Validate Pinterest fields if Pinterest is selected
    if (selectedChannels.includes('pinterest')) {
      if (!platformData.pinterest?.title?.trim()) {
        setError('Pinterest requires a title');
        return false;
      }
      if (!platformData.pinterest?.boardId) {
        setError('Pinterest requires a board selection');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    setError(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('media', mediaFile);
      formData.append('caption', caption);
      formData.append('selectedChannels', JSON.stringify(selectedChannels));
      formData.append('platformData', JSON.stringify(platformData));

      const response = await apiClient.post('/api/broadcast', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onPostCreated(response.data);
      handleClose();
    } catch (error) {
      console.error('Broadcast error:', error);
      setError(error.response?.data?.error || 'Failed to broadcast. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCaption('');
    setMediaFile(null);
    setSelectedChannels([]);
    setPlatformData({
      pinterest: { title: '', link: '', boardId: '' },
      instagram: { firstComment: '' },
      youtube: {},
    });
    setCustomizationExpanded(false);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  const mediaType = mediaFile?.type.startsWith('video/') ? 'video' : 'image';

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-h-[90vh] overflow-hidden"
        style={{ maxWidth: '1100px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-3 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900">Create Post</h2>
            <button className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md border border-gray-300">
              <span>Tags</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              title="AI Assistant"
            >
              <Sparkles className="w-4 h-4" />
              <span>AI Assistant</span>
            </button>
            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              title="Preview"
            >
              <Eye className="w-4 h-4" />
              <span>Preview</span>
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body - Split Layout */}
        <div className="flex h-[calc(90vh-120px)]">
          {/* Left Panel - Composer */}
          <div className="flex-1 overflow-y-auto p-6 border-r border-gray-200">
            {/* Channel Selection with Remove Badges */}
            <div className="mb-6">
              <ChannelSelector
                selectedChannels={selectedChannels}
                onChannelToggle={handleChannelToggle}
              />
            </div>

            {/* Main Caption */}
            <div className="mb-6">
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="What would you like to share?"
                className="composer-textarea min-h-[160px]"
                maxLength={2200}
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-sm text-gray-500">
                  {caption.length}/2200
                </p>
              </div>
            </div>

            {/* Media Upload - Simplified Buffer Style */}
            <div className="mb-6">
              {!mediaFile ? (
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive
                      ? 'border-gray-400 bg-gray-100'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" strokeWidth={1.5} />
                  <p className="text-gray-600 text-sm mb-1">
                    Drag & drop or{' '}
                    <label className="text-buffer-blue hover:text-buffer-blueDark cursor-pointer font-medium">
                      select a file
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </p>
                </div>
              ) : (
                <div className="relative border border-gray-200 rounded-lg overflow-hidden">
                  {mediaType === 'image' ? (
                    <img 
                      src={URL.createObjectURL(mediaFile)} 
                      alt="Preview" 
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                      <div className="text-center">
                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">{mediaFile.name}</p>
                      </div>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={removeFile}
                    className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              )}
            </div>

            {/* Platform Customization */}
            <PlatformCustomization
              selectedChannels={selectedChannels}
              platformData={platformData}
              onPlatformDataChange={setPlatformData}
              expanded={customizationExpanded}
              onToggleExpanded={() => setCustomizationExpanded(!customizationExpanded)}
            />

            {/* Error Display */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}
          </div>

          {/* Right Panel - Live Platform Previews */}
          <div className="w-80 bg-gray-50 border-l border-gray-200 flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 bg-white">
              <h3 className="text-sm font-semibold text-gray-900">Post Preview</h3>
            </div>

            {selectedChannels.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
                  <Eye className="w-6 h-6 text-gray-300" />
                </div>
                <p className="text-sm font-medium text-gray-400">Select a channel to see preview</p>
              </div>
            ) : (
              <PlatformPreviewPanel
                selectedChannels={selectedChannels}
                caption={caption}
                mediaFile={mediaFile}
                mediaType={mediaType}
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-3 bg-white flex items-center justify-between">
          <button
            type="button"
            onClick={handleClose}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !caption.trim() || !mediaFile || selectedChannels.length === 0}
            className="px-5 py-2 bg-buffer-blue hover:bg-buffer-blueDark disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-md transition-colors text-sm flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              'Send'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ComposerModal;
