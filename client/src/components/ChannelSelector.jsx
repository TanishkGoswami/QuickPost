import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const PLATFORMS = [
  {
    id: 'facebook', name: 'Facebook', borderColor: 'border-blue-600',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
  },
  {
    id: 'youtube', name: 'YouTube', borderColor: 'border-red-600',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#FF0000">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
  },
  {
    id: 'instagram', name: 'Instagram', borderColor: 'border-pink-600',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="url(#ig-grad-cs)">
        <defs>
          <linearGradient id="ig-grad-cs" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#833AB4" />
            <stop offset="50%" stopColor="#E1306C" />
            <stop offset="100%" stopColor="#FCAF45" />
          </linearGradient>
        </defs>
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ),
  },
  {
    id: 'linkedin', name: 'LinkedIn', borderColor: 'border-blue-700',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#0A66C2">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    ),
  },
  {
    id: 'threads', name: 'Threads', borderColor: 'border-black',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="black">
        <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.781 3.631 2.695 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 0 1 3.02.142c-.126-.742-.375-1.332-.74-1.763-.507-.598-1.256-.918-2.228-.952-1.281-.046-2.345.335-3.265 1.169l-1.207-1.555c1.319-1.025 2.971-1.531 4.915-1.504 1.5.054 2.682.567 3.513 1.525.799.921 1.276 2.13 1.427 3.598.433.086.838.186 1.212.298 1.438.433 2.455 1.098 3.026 1.977.638 1 .76 2.352.35 3.908-.54 2.055-1.906 3.753-3.838 4.781-1.558.828-3.394 1.256-5.462 1.277z"/>
      </svg>
    ),
  },
  {
    id: 'x', name: 'X', borderColor: 'border-black',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="black">
        <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932 6.064-6.932zm-1.294 19.497h2.039L6.482 3.239H4.293L17.607 20.65z"/>
      </svg>
    ),
  },
  {
    id: 'pinterest', name: 'Pinterest', borderColor: 'border-red-600',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#E60023">
        <path d="M12 0a12 12 0 0 0-4.37 23.17c-.06-.56-.12-1.43 0-2.05l.87-3.65s-.22-.44-.22-1.09c0-1 .6-1.78 1.34-1.78.63 0 .94.48.94 1.05 0 .64-.41 1.6-.62 2.49-.18.74.37 1.34 1.1 1.34 1.32 0 2.33-1.39 2.33-3.4 0-1.78-1.28-3.02-3.1-3.02-2.11 0-3.35 1.58-3.35 3.22 0 .64.24 1.32.55 1.69.06.07.07.14.05.21l-.2.84c-.03.13-.11.16-.25.1-1-.46-1.62-1.91-1.62-3.07 0-2.34 1.7-4.49 4.9-4.49 2.57 0 4.57 1.83 4.57 4.28 0 2.55-1.61 4.6-3.85 4.6-.75 0-1.46-.39-1.7-.85l-.46 1.76c-.17.64-.62 1.44-.92 1.93.69.21 1.42.33 2.17.33A12 12 0 1 0 12 0z"/>
      </svg>
    ),
  },
  {
    id: 'bluesky', name: 'Bluesky', borderColor: 'border-blue-500',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#0085FF">
        <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.039.415-.056-.138.022-.276.04-.415.056-3.912.58-7.387 2.005-2.83 7.078 5.013 5.19 6.87-1.113 7.823-4.308.953 3.195 2.05 9.271 7.733 4.308 4.267-4.308 1.172-6.498-2.74-7.078a8.741 8.741 0 0 1-.415-.056c.14.017.279.036.415.056 2.67.297 5.568-.628 6.383-3.364.246-.828.624-5.79.624-6.478 0-.69-.139-1.861-.902-2.206-.659-.298-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8z"/>
      </svg>
    ),
  },
  {
    id: 'mastodon', name: 'Mastodon', borderColor: 'border-purple-600',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#6364FF">
        <path d="M23.268 5.313c-.35-2.578-2.617-4.61-5.228-5.081-1.043-.186-2.053-.22-3.065-.22h-.02c-1.013 0-2.022.034-3.066.22-2.61.47-4.878 2.503-5.228 5.081-.189 1.305-.234 2.633-.187 3.947.073 2.02.233 4.035.714 6.004.352 1.41.965 2.718 1.928 3.787 1.16 1.292 2.703 2.037 4.376 2.223 1.63.182 3.272.11 4.876-.24.284-.062.563-.135.839-.22.53-.162 1.065-.356 1.562-.613.048-.025.097-.052.144-.08a.459.459 0 0 0 .215-.404l-.01-1.025a.467.467 0 0 0-.586-.449c-.867.215-1.75.38-2.64.474-1.48.157-2.97.145-4.447-.025-1.087-.127-2.02-.648-2.585-1.537-.363-.575-.563-1.24-.625-1.916l-.004-.037c1.32.287 2.665.447 4.017.465 1.327.018 2.656-.09 3.97-.315 1.296-.222 2.576-.618 3.71-1.33 1.221-.768 2.084-1.952 2.39-3.353.175-.81.252-1.636.26-2.46.002-.217.008-.435.008-.652 0-.218 0-.435-.003-.652-.006-1.32-.05-2.645-.239-3.95zM19.08 13.63c-.283 1.218-1.297 2.095-2.54 2.307-1.213.208-2.446.235-3.672.217-1.232-.019-2.46-.167-3.674-.455-.32-.075-.64-.161-.955-.256a.46.46 0 0 0-.59.44v.017c.054.725.247 1.43.608 2.063.556.967 1.52 1.553 2.652 1.699 1.424.183 2.857.194 4.282.034.815-.093 1.622-.244 2.42-.445a.467.467 0 0 1 .586.448l.01 1.024a.459.459 0 0 1-.216.404c-.047.028-.096.055-.144.08-.497.257-1.032.451-1.562.613-.276.085-.555.158-.839.22-1.604.35-3.246.422-4.876.24-1.673-.186-3.216-.931-4.376-2.223-.963-1.069-1.576-2.377-1.928-3.787-.48-1.969-.64-3.984-.713-6.004-.047-1.314-.002-2.642.186-3.947.35-2.578 2.617-4.61 5.228-5.081 1.044-.186 2.053-.22 3.066-.22h.02c1.012 0 2.022.034 3.065.22 2.611.47 4.879 2.503 5.228 5.081.189 1.305.234 2.633.24 3.95.002.217.003.434.003.651 0 .218-.002.435-.008.652-.008.824-.085 1.65-.26 2.46z"/>
      </svg>
    ),
  },
  {
    id: 'tiktok', name: 'TikTok', borderColor: 'border-black',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="black">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/>
      </svg>
    ),
  },
  {
    id: 'reddit',
    name: 'Reddit',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#FF4500">
        <path d="M24 11.5c0-1.65-1.35-3-3-3-.41 0-.8.08-1.15.22C18.21 7.27 15.71 6.5 13 6.5c-.01 0-.02 0-.03.01l1.32-4.19c.01-.03 0-.07-.02-.1-.02-.03-.05-.05-.08-.05l-4.44.93c-.15-.47-.59-.81-1.11-.81-.66 0-1.2.54-1.2 1.2s.54 1.2 1.2 1.2c.5 0 .93-.31 1.1-.74l3.87-.81-1.1 3.5c-2.73.04-5.24.81-6.85 2.23-.35-.14-.74-.22-1.15-.22-1.65 0-3 1.35-3 3 0 1.25.77 2.32 1.86 2.76-.04.24-.06.49-.06.74 0 3.31 4.03 6 9 6s9-2.69 9-6c0-.25-.02-.5-.06-.74 1.09-.44 1.86-1.51 1.86-2.76zM7.5 14c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5zm10.5 4.5c-1.84 0-3.48-.96-4.5-2.5-.1-.14-.07-.34.07-.44.15-.1.35-.07.45.07.9 1.37 2.37 2.22 3.98 2.22s3.08-.85 3.98-2.22c.1-.14.3-.17.44-.07.14.1.17.3.07.44-1.02 1.54-2.66 2.5-4.5 2.5zm1.5-3c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
      </svg>
    ),
    borderColor: 'border-orange-600',
    comingSoon: true,
  },
  {
    id: 'snapchat',
    name: 'Snapchat',
    icon: (
      <svg className="w-6 h-6 text-[#FFFC00]" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2c4.418 0 8 3.582 8 8 0 1.341-.331 2.603-.913 3.712.593.456 1.413 1.288 1.413 2.288 0 .5-.1.9-.3 1.2-.2.3-.5.5-.9.7-.4.2-.9.3-1.4.3-.5 0-1-.1-1.4-.3-.4-.2-.7-.4-.9-.7l-.4-.6c-1 1-2.3 1.6-3.8 1.6-1.5 0-2.8-.6-3.8-1.6l-.4.6c-.2.3-.5.5-.9.7l-1.4.3c-.5 0-1-.1-1.4-.3-.4-.2-.7-.4-.9-.7-.2-.3-.3-.7-.3-1.2 0-1 1.18-2.168 1.413-2.288C2.331 12.603 2 11.341 2 10c0-4.418 3.582-8 8-8z"/>
      </svg>
    ),
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
