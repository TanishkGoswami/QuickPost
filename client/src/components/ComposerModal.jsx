import React, { useState, useRef } from 'react';
import apiClient from '../utils/apiClient';
import { X, Upload, Loader2, Sparkles, Eye, ChevronDown, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ChannelSelector from './ChannelSelector';
import PlatformCustomization from './PlatformCustomization';


/* â”€â”€ Platform meta â”€â”€ */
const PLATFORM_META = {
  instagram: {
    label: 'Instagram', icon: '/icons/ig-instagram-icon.svg',
    headerBg: 'linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)',
    bodyBg: '#fff', textColor: '#fff', imgAspect: 'aspect-square',
    actions: ['â¤ï¸', 'ðŸ’¬', 'âœˆï¸', 'ðŸ”–'],
  },
  facebook: {
    label: 'Facebook', icon: '/icons/facebook-round-color-icon.svg',
    headerBg: '#1877F2', bodyBg: '#f0f2f5', textColor: '#fff', imgAspect: 'aspect-video',
    actions: ['ðŸ‘ Like', 'ðŸ’¬ Comment', 'â†—ï¸ Share'],
  },
  x: {
    label: 'X', icon: '/icons/x-social-media-round-icon.svg',
    headerBg: '#000', bodyBg: '#fff', textColor: '#fff', imgAspect: 'aspect-video',
    actions: ['ðŸ’¬', 'ðŸ”', 'â¤ï¸', 'ðŸ“Š'],
  },
  linkedin: {
    label: 'LinkedIn', icon: '/icons/linkedin-icon.svg',
    headerBg: '#0A66C2', bodyBg: '#f3f2ef', textColor: '#fff', imgAspect: 'aspect-[1.91/1]',
    actions: ['ðŸ‘ Like', 'ðŸ’¬ Comment', 'â†—ï¸ Share'],
  },
  youtube: {
    label: 'YouTube', icon: '/icons/youtube-color-icon.svg',
    headerBg: '#FF0000', bodyBg: '#0f0f0f', textColor: '#fff', imgAspect: 'aspect-video',
    actions: ['ðŸ‘', 'ðŸ‘Ž', 'â†—ï¸ Share', 'â¬‡ï¸ Save'],
  },
  tiktok: {
    label: 'TikTok', icon: '/icons/tiktok-circle-icon.svg',
    headerBg: '#000', bodyBg: '#000', textColor: '#fff', imgAspect: 'aspect-[9/16]',
    actions: ['â¤ï¸', 'ðŸ’¬', 'ðŸ”–', 'â†—ï¸'],
  },
  threads: {
    label: 'Threads', icon: '/icons/threads-icon.svg',
    headerBg: '#000', bodyBg: '#fff', textColor: '#fff', imgAspect: 'aspect-square',
    actions: ['â¤ï¸', 'ðŸ’¬', 'ðŸ”', 'â†—ï¸'],
  },
  pinterest: {
    label: 'Pinterest', icon: '/icons/pinterest-round-color-icon.svg',
    headerBg: '#BD081C', bodyBg: '#fff', textColor: '#fff', imgAspect: 'aspect-[2/3]',
    actions: ['Save'],
  },
  bluesky: {
    label: 'Bluesky', icon: '/icons/bluesky-circle-color-icon.svg',
    headerBg: '#0085FF', bodyBg: '#fff', textColor: '#fff', imgAspect: 'aspect-video',
    actions: ['â¤ï¸', 'ðŸ”', 'ðŸ’¬', 'â†—ï¸'],
  },
  mastodon: {
    label: 'Mastodon', icon: '/icons/mastodon-round-icon.svg',
    headerBg: '#6364FF', bodyBg: '#191b22', textColor: '#fff', imgAspect: 'aspect-video',
    actions: ['â†©ï¸ Reply', 'ðŸ” Boost', 'â­ Fav', 'â†—ï¸'],
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

/* â”€â”€ Platform Preview Panel â”€â”€ */
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
  const truncatedCaption = caption?.length > 120 ? caption.slice(0, 120) + 'â€¦' : caption;
  const videoTitle = caption?.length > 60 ? caption.slice(0, 60) + 'â€¦' : caption || 'Your Video Title';

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
              <img src={m.icon} alt={m.label} className="w-5 h-5 object-contain" />
            </button>
          );
        })}
      </div>

      {/* Scrollable preview area */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeId && (
          activeId === 'youtube' ? (
            /* â”€â”€ YouTube video card layout â”€â”€ */
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
              {/* Thumbnail */}
              <div className="relative w-full aspect-video bg-gray-900">
                {mediaUrl ? (
                  mediaType === 'image'
                    ? <img src={mediaUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                    : <video src={mediaUrl} className="w-full h-full object-cover" muted playsInline />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100">
                    <ImageIcon className="w-8 h-8 text-gray-300 mb-1" />
                    <span className="text-[10px] text-gray-400">No media yet</span>
                  </div>
                )}
                {/* Duration badge */}
                <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-[10px] font-semibold px-1 py-0.5 rounded">
                  0:00
                </span>
              </div>

              {/* Video info row */}
              <div className="flex gap-2.5 p-2.5">
                {/* Channel avatar */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[11px] font-bold text-white">Y</span>
                </div>
                {/* Title + meta */}
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-gray-900 leading-snug line-clamp-2 mb-1">
                    {videoTitle}
                  </p>
                  <p className="text-[10px] text-gray-500">Your Channel</p>
                  <p className="text-[10px] text-gray-500">1.2K views Â· Just now</p>
                </div>
                {/* 3-dot menu */}
                <div className="flex flex-col gap-[3px] mt-1 flex-shrink-0">
                  {[0,1,2].map(i => <div key={i} className="w-1 h-1 rounded-full bg-gray-400" />)}
                </div>
              </div>
            </div>
          ) : activeId === 'instagram' ? (
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
              <div className="flex items-center gap-2.5 px-3 py-2.5">
                <div className="p-[2px] rounded-full flex-shrink-0" style={{ background: 'linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)' }}>
                  <div className="w-7 h-7 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                    <span className="text-[10px] font-bold text-white">Y</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-[12px] font-semibold text-gray-900 leading-tight">your_account</span>
                    <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="#3897f0"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm-1.25 17.292l-4.5-4.364 1.857-1.858 2.643 2.506 5.643-5.784 1.857 1.857-7.5 7.643z"/></svg>
                  </div>
                </div>
                <button className="text-[11px] font-bold text-gray-800 border border-gray-300 rounded-md px-3 py-0.5 mr-1">Follow</button>
                <div className="flex flex-col gap-[3px]">
                  {[0,1,2].map(i => <div key={i} className="w-[3px] h-[3px] rounded-full bg-gray-500" />)}
                </div>
              </div>
              <div className="relative w-full aspect-square bg-gray-900">
                {mediaUrl ? (
                  mediaType === 'image'
                    ? <img src={mediaUrl} alt="Post" className="w-full h-full object-cover" />
                    : <video src={mediaUrl} className="w-full h-full object-cover" muted playsInline />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100">
                    <ImageIcon className="w-8 h-8 text-gray-400 mb-1" />
                    <span className="text-[10px] text-gray-400">No media yet</span>
                  </div>
                )}
              </div>
              <div className="px-3 pt-2.5 pb-1">
                <div className="flex items-center">
                  <div className="flex items-center gap-3 flex-1">
                    <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
                    <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                    <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
                  </div>
                  <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg>
                </div>
                <p className="text-[11px] font-semibold text-gray-900 mt-1.5">4,117 likes</p>
                {caption && (<p className="text-[11px] text-gray-900 mt-1 leading-relaxed"><span className="font-semibold mr-1">your_account</span>{truncatedCaption}</p>)}
                <p className="text-[10px] text-gray-500 mt-1 mb-2">View all 31 comments</p>
              </div>
            </div>
          ) : activeId === 'facebook' ? (
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
              {/* FB Header */}
              <div className="flex items-center gap-2.5 px-3 py-2.5">
                <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-[13px] font-bold text-white">Y</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-gray-900 leading-tight">Your Account</p>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-gray-500">Just now</span>
                    <span className="text-gray-400">·</span>
                    <svg className="w-3 h-3 text-gray-400" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93V18c0-.55.45-1 1-1s1 .45 1 1v1.93c-2.06-.23-3.88-1.19-5.22-2.64l1.37-1.37c.39-.39 1.02-.39 1.41 0 .38.38.38 1.02 0 1.41l-.15.14c.87.87 1.9 1.53 3.06 1.9zM7.07 17.66l-1.41-1.41c-1.45-1.34-2.41-3.16-2.64-5.22H4.99c.55 0 1 .45 1 1s-.45 1-1 1H3.07c.23 2.06 1.19 3.88 2.64 5.22zM5 12c0-.55.45-1 1-1h1c.55 0 1 .45 1 1s-.45 1-1 1H6c-.55 0-1-.45-1-1zm7-8c.55 0 1 .45 1 1v1c.55 0 1 .45 1 1s-.45 1-1 1H12c-.55 0-1-.45-1-1V5c0-.55.45-1 1-1z"/></svg>
                  </div>
                </div>
                <div className="flex flex-col gap-[3px]">
                  {[0,1,2].map(i => <div key={i} className="w-[4px] h-[4px] rounded-full bg-gray-400" />)}
                </div>
              </div>
              {/* Caption */}
              {caption && <p className="px-3 pb-2 text-[12px] leading-relaxed text-gray-900">{truncatedCaption}</p>}
              {/* Media 16:9 */}
              <div className="relative w-full aspect-video bg-gray-100">
                {mediaUrl ? (mediaType === 'image' ? <img src={mediaUrl} alt="Post" className="w-full h-full object-cover" /> : <video src={mediaUrl} className="w-full h-full object-cover" muted playsInline />) : (<div className="w-full h-full flex flex-col items-center justify-center bg-gray-100"><ImageIcon className="w-8 h-8 text-gray-300 mb-1" /><span className="text-[10px] text-gray-400">No media yet</span></div>)}
              </div>
              {/* Reaction counts */}
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-100">
                <div className="flex items-center gap-1">
                  <span className="text-[14px]">👍</span><span className="text-[10px] text-gray-500">124</span>
                </div>
                <span className="text-[10px] text-gray-400">12 comments · 4 shares</span>
              </div>
              {/* Action bar */}
              <div className="flex items-center divide-x divide-gray-100">
                {[['👍','Like'],['💬','Comment'],['↗️','Share']].map(([icon,label]) => (
                  <button key={label} className="flex-1 flex items-center justify-center gap-1 py-2 hover:bg-gray-50 transition-colors">
                    <span className="text-[13px]">{icon}</span>
                    <span className="text-[11px] font-medium text-gray-600">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : activeId === 'linkedin' ? (
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
              {/* LI Header */}
              <div className="flex items-start gap-2.5 px-3 py-2.5">
                <div className="w-10 h-10 rounded-full bg-[#0A66C2] flex items-center justify-center flex-shrink-0">
                  <span className="text-[13px] font-bold text-white">Y</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-gray-900 leading-tight">Your Account</p>
                  <p className="text-[10px] text-gray-500">Your Title · 1st</p>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-gray-400">Just now ·</span>
                    <svg className="w-3 h-3 text-gray-400" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm0 14.5a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13zM8 3.5a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5zm.75 3.25v4.5a.75.75 0 0 1-1.5 0v-4.5a.75.75 0 0 1 1.5 0z"/></svg>
                  </div>
                </div>
                <button className="text-[11px] font-semibold text-[#0A66C2] border border-[#0A66C2] rounded-full px-3 py-0.5 flex-shrink-0">+ Follow</button>
              </div>
              {/* Caption */}
              {caption && <p className="px-3 pb-2 text-[12px] leading-relaxed text-gray-900">{truncatedCaption} <span className="text-[#0A66C2] font-medium cursor-pointer">...see more</span></p>}
              {/* Media 1.91:1 */}
              <div className="relative w-full aspect-[1.91/1] bg-gray-100">
                {mediaUrl ? (mediaType === 'image' ? <img src={mediaUrl} alt="Post" className="w-full h-full object-cover" /> : <video src={mediaUrl} className="w-full h-full object-cover" muted playsInline />) : (<div className="w-full h-full flex flex-col items-center justify-center bg-gray-100"><ImageIcon className="w-8 h-8 text-gray-300 mb-1" /><span className="text-[10px] text-gray-400">No media yet</span></div>)}
              </div>
              {/* Reactions */}
              <div className="flex items-center justify-between px-3 py-1.5">
                <div className="flex items-center gap-1">
                  <span className="text-[13px]">👍❤️🎉</span>
                  <span className="text-[10px] text-gray-500">84</span>
                </div>
                <span className="text-[10px] text-gray-400">12 comments</span>
              </div>
              {/* Action bar */}
              <div className="flex items-center border-t border-gray-100 divide-x divide-gray-100">
                {[['👍','Like'],['💬','Comment'],['🔁','Repost'],['↗️','Send']].map(([icon,label]) => (
                  <button key={label} className="flex-1 flex items-center justify-center gap-1 py-2 hover:bg-gray-50 transition-colors">
                    <span className="text-[12px]">{icon}</span>
                    <span className="text-[10px] font-medium text-gray-600">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : activeId === 'threads' ? (
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
              {/* Threads Header */}
              <div className="flex items-start gap-2.5 px-3 py-3">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0">
                    <span className="text-[11px] font-bold text-white">Y</span>
                  </div>
                  {/* Thread line */}
                  <div className="w-px flex-1 bg-gray-200 mt-1 min-h-[20px]"></div>
                </div>
                <div className="flex-1 min-w-0 pb-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] font-semibold text-gray-900">your_account</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400">1m</span>
                      <div className="flex flex-col gap-[3px]">
                        {[0,1,2].map(i => <div key={i} className="w-[3px] h-[3px] rounded-full bg-gray-400" />)}
                      </div>
                    </div>
                  </div>
                  {caption && <p className="text-[12px] text-gray-900 leading-relaxed mb-2">{truncatedCaption}</p>}
                  {mediaUrl && (
                    <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-gray-100 mb-2">
                      {mediaType === 'image' ? <img src={mediaUrl} alt="Post" className="w-full h-full object-cover" /> : <video src={mediaUrl} className="w-full h-full object-cover" muted playsInline />}
                    </div>
                  )}
                  {!mediaUrl && (
                    <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-gray-100 mb-2 flex flex-col items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-gray-300 mb-1" />
                      <span className="text-[10px] text-gray-400">No media yet</span>
                    </div>
                  )}
                  {/* Action icons */}
                  <div className="flex items-center gap-4">
                    <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
                    <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                    <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                    <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
                  </div>
                </div>
              </div>
              {/* Replies + likes */}
              <div className="flex items-center gap-2 px-3 pb-3">
                <div className="flex -space-x-1.5">
                  {['bg-purple-400','bg-blue-400','bg-green-400'].map((c,i)=>(<div key={i} className={`w-4 h-4 rounded-full ${c} border border-white`}/>))}
                </div>
                <span className="text-[10px] text-gray-500">3 replies · 12 likes</span>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2" style={{ background: meta.headerBg }}>
                <img src={meta.icon} alt={meta.label} className="w-4 h-4 object-contain brightness-200" />
                <span className="text-[11px] font-bold tracking-wide" style={{ color: meta.textColor }}>{meta.label}</span>
              </div>
              <div style={{ background: meta.bodyBg }}>
                <div className="flex items-center gap-2 px-3 pt-3 pb-2">
                  <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0"><span className="text-[10px] font-bold text-gray-600">U</span></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold truncate" style={{ color: activeId === 'tiktok' || activeId === 'mastodon' ? '#fff' : '#111' }}>Your Account</p>
                    <p className="text-[9px]" style={{ color: activeId === 'tiktok' || activeId === 'mastodon' ? '#aaa' : '#888' }}>Just now</p>
                  </div>
                  {activeId === 'tiktok' && (<span className="text-[9px] font-bold px-2 py-0.5 rounded-full border border-white text-white">Follow</span>)}
                </div>
                {!['pinterest','tiktok'].includes(activeId) && caption && (<p className="px-3 pb-2 text-[11px] leading-relaxed" style={{ color: activeId === 'mastodon' ? '#eee' : '#222' }}>{truncatedCaption}</p>)}
                <div className={`w-full ${meta.imgAspect} overflow-hidden relative bg-gray-900`}>
                  {mediaUrl ? (mediaType === 'image' ? <img src={mediaUrl} alt="Preview" className="w-full h-full object-cover" /> : <video src={mediaUrl} className="w-full h-full object-cover" muted playsInline />) : (<div className="w-full h-full flex flex-col items-center justify-center bg-gray-100"><ImageIcon className="w-8 h-8 text-gray-300 mb-1" /><span className="text-[10px] text-gray-400">No media yet</span></div>)}
                  {activeId === 'tiktok' && caption && (<div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent"><p className="text-white text-[10px] leading-tight">{truncatedCaption}</p></div>)}
                </div>
                {activeId === 'pinterest' && caption && (<p className="px-3 pt-2 pb-1 text-[11px] leading-relaxed text-gray-800">{truncatedCaption}</p>)}
                <div className="flex items-center gap-3 px-3 py-2 border-t" style={{ borderColor: activeId === 'mastodon' ? '#333' : '#f0f0f0' }}>
                  {meta.actions.map((a, i) => (<span key={i} className="text-[11px]" style={{ color: activeId === 'tiktok' || activeId === 'mastodon' ? '#ccc' : '#555' }}>{a}</span>))}
                </div>
              </div>
            </div>
          )
        )}

        {/* Platform label */}
        {activeId && (
          <p className="text-center text-[10px] text-gray-400 mt-3 font-medium">
            Preview â€” {PLATFORM_META[activeId]?.label}
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
    reddit: { subreddit: '' },
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
      if (connectedAccounts.x) connected.push('x');
      if (connectedAccounts.reddit) connected.push('reddit');
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
