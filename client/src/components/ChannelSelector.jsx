import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const PLATFORMS = [
  {
    id: 'facebook', name: 'Facebook', borderColor: 'border-blue-600',
    icon: <img src="/icons/facebook-round-color-icon.svg" className="w-5 h-5 object-contain" alt="Facebook" />
  },
  {
    id: 'youtube', name: 'YouTube', borderColor: 'border-red-600',
    icon:<img src="/icons/youtube-color-icon.svg" className="w-5 h-5 object-contain" alt="Youtube" />
  },
  {
    id: 'instagram', name: 'Instagram', borderColor: 'border-pink-600',
    icon: <img src="/icons/ig-instagram-icon.svg" className="w-5 h-5 object-contain" alt="Instagram" />
  },
  {
    id: 'linkedin', name: 'LinkedIn', borderColor: 'border-blue-700',
    icon: <img src="/icons/linkedin-icon.svg" className="w-5 h-5 object-contain" alt="LinkedIn" />
  },
  {
    id: 'threads', name: 'Threads', borderColor: 'border-black',
    icon: <img src="/icons/threads-icon.svg" className="w-5 h-5 object-contain" alt="Threads" />
  },
  {
    id: 'x', name: 'X', borderColor: 'border-black',
    icon: <img src="/icons/x-social-media-round-icon.svg" className="w-5 h-5 object-contain" alt="X" />
  },
  {
    id: 'pinterest', name: 'Pinterest', borderColor: 'border-red-600',
    icon: <img src="/icons/pinterest-round-color-icon.svg" className="w-5 h-5 object-contain" alt="Pinterest" />
  },
  {
    id: 'bluesky', name: 'Bluesky', borderColor: 'border-blue-500',
    icon: <img src="/icons/bluesky-circle-color-icon.svg" className="w-5 h-5 object-contain" alt="Bluesky" />
  },
  {
    id: 'mastodon', name: 'Mastodon', borderColor: 'border-purple-600',
    icon: <img src="/icons/mastodon-round-icon.svg" className="w-5 h-5 object-contain" alt="Mastodon" />
  },
  {
    id: 'tiktok', name: 'TikTok', borderColor: 'border-black',
    icon: <img src="/icons/tiktok-circle-icon.svg" className="w-5 h-5 object-contain" alt="TikTok" />
  },
  {
    id: 'reddit',
    name: 'Reddit',
    icon: <img src="/icons/reddit-icon.svg" className="w-5 h-5 object-contain" alt="Reddit" />,
    borderColor: 'border-orange-600',
    comingSoon: true,
  },
  {
    id: 'snapchat',
    name: 'Snapchat',
    icon: <img src="/icons/snapchat-square-color-icon.svg" className="w-5 h-5 object-contain" alt="Snapchat" />,
    borderColor: 'border-yellow-400',
    comingSoon: true,
  },
];

function ChannelSelector({ selectedChannels, onChannelToggle }) {
  const { connectedAccounts } = useAuth();
  const [connectedOpen, setConnectedOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const connectedRef = useRef(null);
  const moreRef = useRef(null);

  // Split platforms
  const connectedPlatforms = PLATFORMS.filter(p => connectedAccounts?.[p.id]);
  const unconnectedPlatforms = PLATFORMS.filter(p => !connectedAccounts?.[p.id]);
  const visibleUnconnected = unconnectedPlatforms.slice(0, 3);
  const hiddenUnconnected = unconnectedPlatforms.slice(3);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e) {
      if (connectedRef.current && !connectedRef.current.contains(e.target)) setConnectedOpen(false);
      if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="mb-2">
      <div className="flex items-center gap-2 flex-wrap">

        {/* ── Connected Platforms Dropdown ── */}
        {connectedPlatforms.length > 0 && (
          <div className="relative" ref={connectedRef}>
            <button
              type="button"
              onClick={() => { setConnectedOpen(o => !o); setMoreOpen(false); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-300 bg-white hover:bg-gray-50 text-sm font-medium text-gray-700 transition-all shadow-sm"
            >
              {/* Show stacked icons (max 3) — hidden when dropdown is open */}
              <div className={`flex -space-x-1.5 ${connectedOpen ? 'hidden' : 'flex'}`}>
                {connectedPlatforms.slice(0, 3).map(p => (
                  <div key={p.id} className="w-5 h-5 rounded-full bg-white border border-gray-200 flex items-center justify-center overflow-hidden shadow-sm">
                    {p.icon}
                  </div>
                ))}
                {connectedPlatforms.length > 3 && (
                  <div className="w-5 h-5 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-[9px] font-bold text-gray-500">
                    +{connectedPlatforms.length - 3}
                  </div>
                )}
              </div>
              <span>Connected</span>
              {selectedChannels.filter(id => connectedPlatforms.some(p => p.id === id)).length > 0 && (
                <span className="bg-indigo-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {selectedChannels.filter(id => connectedPlatforms.some(p => p.id === id)).length}
                </span>
              )}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${connectedOpen ? 'rotate-180' : ''}`} />
            </button>

            {connectedOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-52 bg-white rounded-xl border border-gray-200 shadow-lg z-50 overflow-hidden">
                <div className="px-3 py-2 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Connected Accounts</p>
                </div>
                {connectedPlatforms.map(p => {
                  const isSelected = selectedChannels.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => onChannelToggle(p.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors ${isSelected ? 'bg-indigo-50' : ''}`}
                    >
                      <div className="w-7 h-7 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center flex-shrink-0">
                        {p.icon}
                      </div>
                      <span className={`text-sm flex-1 text-left font-medium ${isSelected ? 'text-indigo-700' : 'text-gray-700'}`}>
                        {p.name}
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-indigo-500" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Divider if both exist ── */}
        {connectedPlatforms.length > 0 && unconnectedPlatforms.length > 0 && (
          <div className="h-6 w-px bg-gray-200" />
        )}

        {/* ── Unconnected: first 3 as icon buttons ── */}
        {visibleUnconnected.map(p => (
          <button
            key={p.id}
            type="button"
            title={`Connect ${p.name}`}
            className="w-8 h-8 rounded-full bg-white border border-gray-200 hover:border-gray-400 flex items-center justify-center opacity-40 hover:opacity-70 transition-all shadow-sm relative group"
          >
            {p.icon}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              {p.name}
            </div>
          </button>
        ))}

        {/* ── More dropdown for remaining unconnected ── */}
        {hiddenUnconnected.length > 0 && (
          <div className="relative" ref={moreRef}>
            <button
              type="button"
              onClick={() => { setMoreOpen(o => !o); setConnectedOpen(false); }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-xs font-medium text-gray-500 transition-all shadow-sm"
            >
              <Plus className="w-3 h-3" />
              {hiddenUnconnected.length} more
            </button>

            {moreOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-48 bg-white rounded-xl border border-gray-200 shadow-lg z-50 overflow-hidden">
                <div className="px-3 py-2 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">More Platforms</p>
                </div>
                {hiddenUnconnected.map(p => (
                  <div key={p.id} className="flex items-center gap-3 px-3 py-2.5 opacity-50">
                    <div className="w-7 h-7 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center flex-shrink-0">
                      {p.icon}
                    </div>
                    <span className="text-sm text-gray-500 font-medium flex-1">{p.name}</span>
                    <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">Connect</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Empty state ── */}
        {connectedPlatforms.length === 0 && (
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
            No accounts connected yet
          </p>
        )}
      </div>

      {/* Selected count */}
      {selectedChannels.length > 0 && (
        <p className="text-xs text-gray-400 mt-2">
          Posting to {selectedChannels.length} channel{selectedChannels.length > 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}

export default ChannelSelector;
