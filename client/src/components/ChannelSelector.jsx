import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Lock } from 'lucide-react';
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
    icon: <img src="/icons/x-social-media-round-icon.svg" className="w-5 h-5 object-contain" alt="X" />,
    comingSoon: true,
  },
  {
    id: 'pinterest', name: 'Pinterest', borderColor: 'border-red-600',
    icon: <img src="/icons/pinterest-round-color-icon.svg" className="w-5 h-5 object-contain" alt="Pinterest" />,
    comingSoon: true,
  },
  {
    id: 'bluesky', name: 'Bluesky', borderColor: 'border-blue-500',
    icon: <img src="/icons/bluesky-circle-color-icon.svg" className="w-5 h-5 object-contain" alt="Bluesky" />
  },
  {
    id: 'mastodon', name: 'Mastodon', borderColor: 'border-purple-600',
    icon: <img src="/icons/mastodon-round-icon.svg" className="w-5 h-5 object-contain" alt="Mastodon" />,
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

function ChannelSelector({ selectedChannels, onChannelToggle, onBulkSelect }) {
  const { connectedAccounts, user } = useAuth();
  const isFree = user?.plan === 'Free' || !user?.plan;
  const allowedFreePlatforms = ['youtube', 'linkedin', 'bluesky'];
  const [connectedOpen, setConnectedOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const connectedRef = useRef(null);
  const moreRef = useRef(null);

  // Split platforms
  const connectedPlatforms = PLATFORMS.filter(p => connectedAccounts?.[p.id]?.connected);
  const unconnectedPlatforms = PLATFORMS.filter(p => !connectedAccounts?.[p.id]?.connected);
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

  const connectedIds = connectedPlatforms.map(p => p.id);
  const selectedConnectedCount = selectedChannels.filter(id => connectedIds.includes(id)).length;
  const isAllSelected = selectedConnectedCount === connectedPlatforms.length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between mb-1 px-1">
        <div className="eyebrow lowercase text-[10px] tracking-[0.12em] opacity-70">
          Publish channels
        </div>
        {connectedPlatforms.length > 0 && (
          <button
            type="button"
            onClick={() => onBulkSelect(isAllSelected ? [] : connectedIds)}
            className={`text-[9px] font-black uppercase tracking-[0.15em] py-1 px-3 rounded-full transition-all duration-300 ${
              isAllSelected
                ? "bg-ink text-white shadow-md scale-105"
                : "bg-white text-ink border border-gray-200 hover:border-ink"
            }`}
          >
            {isAllSelected ? "Deselect All" : "Select All"}
          </button>
        )}
      </div>

      <div className="flex items-center gap-3.5 flex-wrap">
        {connectedPlatforms.map((p) => {
          const isSelected = selectedChannels.includes(p.id);
          const isLocked = isFree && !allowedFreePlatforms.includes(p.id);
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                if (isLocked) {
                  alert("Please upgrade to Pro to post on this platform.");
                  return;
                }
                onChannelToggle(p.id);
              }}
              title={p.name}
              className={`group relative w-[52px] h-[52px] rounded-2xl flex items-center justify-center transition-all duration-500 ${
                isLocked ? "bg-gray-100 opacity-60 cursor-not-allowed" :
                isSelected
                  ? "bg-white shadow-[0_12px_32px_rgba(20,20,19,0.12)] border-[2.5px] border-ink scale-110 z-10"
                  : "bg-white border border-gray-100 opacity-40 grayscale hover:opacity-100 hover:grayscale-0 hover:scale-105 hover:shadow-lg"
              }`}
            >
              <div className={`w-8 h-8 flex items-center justify-center transition-transform duration-500 ${isSelected ? 'scale-110' : 'group-hover:scale-110'} ${isLocked ? 'grayscale opacity-50' : ''}`}>
                {p.icon}
              </div>

              {isSelected && !isLocked && (
                <motion.div
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-ink rounded-full flex items-center justify-center border-2 border-white shadow-xl"
                >
                  <Check size={12} color="white" strokeWidth={4} />
                </motion.div>
              )}
              
              {isLocked && (
                <div className="absolute -bottom-2 -right-2 w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center border-2 border-white shadow-sm z-20">
                  <Lock size={10} className="text-gray-500" />
                </div>
              )}

              <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-ink text-white text-[9px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none uppercase tracking-widest z-30 whitespace-nowrap">
                {p.name} {isLocked ? "(PRO)" : ""}
              </div>
            </button>
          );
        })}

        {connectedPlatforms.length === 0 && (
          <div className="w-full p-6 rounded-2xl border-2 border-dashed border-gray-100 flex flex-col items-center gap-2 bg-gray-50/30">
             <p className="text-sm font-medium text-gray-400">No accounts connected yet</p>
             <button className="text-[10px] font-bold text-arc uppercase tracking-widest hover:underline">Connect accounts in sidebar →</button>
          </div>
        )}
      </div>

      <p className="text-[10px] font-bold text-slate mt-2 px-1 uppercase tracking-wider opacity-50">
        Posting to {selectedChannels.length} channel{selectedChannels.length !== 1 ? 's' : ''}
      </p>
    </div>
  );
}

export default ChannelSelector;
