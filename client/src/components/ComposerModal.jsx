import React, { useState, useRef } from 'react';
import apiClient from '../utils/apiClient';
import { X, Upload, Loader2, Sparkles, Eye, ChevronDown, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ChannelSelector from './ChannelSelector';
import PlatformCustomization from './PlatformCustomization';

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

    // Validate YouTube media type
    if (selectedChannels.includes('youtube') && mediaFile && mediaFile.type.startsWith('image/')) {
      setError('Posting on YouTube via app is not possible for images. You can only upload video.');
      return false;
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
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Success! Close modal and notify parent
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

          {/* Right Panel - Post Previews */}
          <div className="w-80 bg-gray-50 p-6 overflow-y-auto">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-sm font-semibold text-gray-900">Post Previews</h3>
              <button className="p-0.5 text-gray-400 hover:text-gray-600">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            {/* Preview Placeholder */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center mb-3">
                <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-center text-sm text-gray-500">
                See your post's preview here
              </p>
            </div>
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
