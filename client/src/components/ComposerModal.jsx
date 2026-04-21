import React, { useState, useRef, useMemo } from "react";
import apiClient from "../utils/apiClient";
import {
  X,
  Upload,
  Loader2,
  Sparkles,
  Eye,
  ChevronDown,
  Image as ImageIcon,
  GripVertical,
  Monitor,
  Smartphone,
  Square,
  RectangleVertical,
} from "lucide-react";
import { Reorder, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useUploadJobs } from "../context/UploadJobContext";
import { useDialog } from "../context/DialogContext";
import ChannelSelector from "./ChannelSelector";
import PlatformCustomization from "./PlatformCustomization";

/* ── Platform meta ── */
const PLATFORM_META = {
  instagram: {
    label: "Instagram",
    icon: "/icons/ig-instagram-icon.svg",
    headerBg: "linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)",
    bodyBg: "#fff",
    textColor: "#fff",
    imgAspect: "aspect-square",
    actions: ["❤️", "💬", "✈️", "🔖"],
  },
  facebook: {
    label: "Facebook",
    icon: "/icons/facebook-round-color-icon.svg",
    headerBg: "#1877F2",
    bodyBg: "#f0f2f5",
    textColor: "#fff",
    imgAspect: "aspect-video",
    actions: ["👍 Like", "💬 Comment", "↗️ Share"],
  },
  x: {
    label: "X",
    icon: "/icons/x-social-media-round-icon.svg",
    headerBg: "#000",
    bodyBg: "#fff",
    textColor: "#fff",
    imgAspect: "aspect-video",
    actions: ["💬", "🔍", "❤️", "📊"],
  },
  linkedin: {
    label: "LinkedIn",
    icon: "/icons/linkedin-icon.svg",
    headerBg: "#0A66C2",
    bodyBg: "#f3f2ef",
    textColor: "#fff",
    imgAspect: "aspect-[1.91/1]",
    actions: ["👍 Like", "💬 Comment", "↗️ Share"],
  },
  youtube: {
    label: "YouTube",
    icon: "/icons/youtube-color-icon.svg",
    headerBg: "#FF0000",
    bodyBg: "#0f0f0f",
    textColor: "#fff",
    imgAspect: "aspect-video",
    actions: ["👍", "👎", "↗️ Share", "⬇️ Save"],
  },
  tiktok: {
    label: "TikTok",
    icon: "/icons/tiktok-circle-icon.svg",
    headerBg: "#000",
    bodyBg: "#000",
    textColor: "#fff",
    imgAspect: "aspect-[9/16]",
    actions: ["❤️", "💬", "🔖", "↗️"],
  },
  threads: {
    label: "Threads",
    icon: "/icons/threads-icon.svg",
    headerBg: "#000",
    bodyBg: "#fff",
    textColor: "#fff",
    imgAspect: "aspect-square",
    actions: ["❤️", "💬", "🔍", "↗️"],
  },
  pinterest: {
    label: "Pinterest",
    icon: "/icons/pinterest-round-color-icon.svg",
    headerBg: "#BD081C",
    bodyBg: "#fff",
    textColor: "#fff",
    imgAspect: "aspect-[2/3]",
    actions: ["Save"],
  },
  bluesky: {
    label: "Bluesky",
    icon: "/icons/bluesky-circle-color-icon.svg",
    headerBg: "#0085FF",
    bodyBg: "#fff",
    textColor: "#fff",
    imgAspect: "aspect-video",
    actions: ["❤️", "🔍", "💬", "↗️"],
  },
  mastodon: {
    label: "Mastodon",
    icon: "/icons/mastodon-round-icon.svg",
    headerBg: "#6364FF",
    bodyBg: "#191b22",
    textColor: "#fff",
    imgAspect: "aspect-video",
    actions: ["↩️ Reply", "🔍 Boost", "⭐ Fav", "↗️"],
  },
};

const QUICK_SUGGESTIONS = [
  "Hell yeh !!",
  "Excited to share this! ",
  "What do you think? ",
  "Check out my latest post! ",
  "Behind the scenes ",
  "Stay tuned for more! ",
  "New update alert! ",
  "Link in bio! ",
  "Happy Monday! ",
  "Weekend vibes!",
];

const SUGGESTED_HASHTAGS = [
  "#productivity",
  "#marketing",
  "#socialmedia",
  "#growth",
  "#creator",
  "#digitalmarketing",
  "#branding",
  "#socialstrategy",
];

const ASPECT_RATIOS = [
  {
    id: "1:1",
    label: "Feed",
    desc: "Square",
    aspect: "aspect-square",
    icon: Square,
    preview: "w-6 h-6 border-2",
  },
  {
    id: "4:5",
    label: "Portrait",
    desc: "4:5 Format",
    aspect: "aspect-[4/5]",
    icon: RectangleVertical,
    preview: "w-5 h-6 border-2",
  },
  {
    id: "9:16",
    label: "Reel / Story",
    desc: "Full Vertical",
    aspect: "aspect-[9/16]",
    icon: Smartphone,
    preview: "w-4 h-7 border-2",
  },
  {
    id: "16:9",
    label: "Landscape",
    desc: "Wide",
    aspect: "aspect-video",
    icon: Monitor,
    preview: "w-8 h-4.5 border-2",
  },
];

const SIZE_PRESETS = [
  {
    id: "yt-landscape",
    ratio: "16:9",
    title: "YouTube Video",
    subtitle: "Long-form / Landscape",
    platforms: ["youtube", "facebook", "linkedin", "x", "bluesky", "mastodon"],
  },
  {
    id: "yt-shorts",
    ratio: "9:16",
    title: "YouTube Shorts",
    subtitle: "Vertical Short",
    platforms: ["youtube", "instagram", "facebook", "tiktok", "threads"],
  },
  {
    id: "ig-feed-square",
    ratio: "1:1",
    title: "Instagram Feed",
    subtitle: "Square Post",
    platforms: ["instagram", "facebook", "threads", "x", "linkedin"],
  },
  {
    id: "ig-feed-landscape",
    ratio: "16:9",
    title: "Instagram Feed",
    subtitle: "Landscape Post",
    platforms: ["instagram", "facebook", "linkedin", "x"],
  },
  {
    id: "ig-feed-portrait",
    ratio: "4:5",
    title: "Instagram Feed",
    subtitle: "Portrait Post",
    platforms: ["instagram", "facebook", "linkedin"],
  },
  {
    id: "ig-reel",
    ratio: "9:16",
    title: "Instagram Reel",
    subtitle: "Vertical Video",
    platforms: ["instagram", "facebook", "youtube", "tiktok", "threads"],
  },
  {
    id: "ig-story",
    ratio: "9:16",
    title: "Instagram Story",
    subtitle: "Story Format",
    platforms: ["instagram", "facebook", "youtube", "tiktok"],
  },
];

const PLATFORM_SHORT_LABELS = {
  youtube: "YouTube",
  instagram: "Instagram",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  x: "X",
  threads: "Threads",
  tiktok: "TikTok",
  bluesky: "Bluesky",
  mastodon: "Mastodon",
};

const PLATFORM_PRESET_PREFIX = {
  youtube: "yt-",
  instagram: "ig-",
};

function XIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932 6.064-6.932zm-1.294 19.497h2.039L6.482 3.239H4.293L17.607 20.65z" />
    </svg>
  );
}

function LinkedInIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

/* ── Platform Preview Panel ── */
function PlatformPreviewPanel({
  selectedChannels,
  caption,
  mediaFiles,
  mediaType,
  selectedRatio,
  youtubeThumbnail,
}) {
  const [activeId, setActiveId] = React.useState(null);

  // Keep activeId in sync with selectedChannels
  React.useEffect(() => {
    if (selectedChannels.length > 0) {
      setActiveId((prev) =>
        selectedChannels.includes(prev) ? prev : selectedChannels[0],
      );
    }
  }, [selectedChannels]);

  const meta = PLATFORM_META[activeId] || PLATFORM_META.instagram;

  // Use user selected ratio if available, otherwise fallback to platform default
  const currentAspect = selectedRatio
    ? ASPECT_RATIOS.find((r) => r.id === selectedRatio)?.aspect
    : meta.imgAspect;

  // Memoize URL creation to prevent leaks and flicker
  const mediaUrl = useMemo(() => {
    if (!mediaFiles || mediaFiles.length === 0) return null;
    return URL.createObjectURL(mediaFiles[0].file);
  }, [mediaFiles]);

  const truncatedCaption =
    caption?.length > 120 ? caption.slice(0, 120) + "…" : caption;
  const videoTitle =
    caption?.length > 60
      ? caption.slice(0, 60) + "…"
      : caption || "Your Video Title";

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Platform tabs */}
      <div className="flex gap-1 px-3 py-2 overflow-x-auto border-b border-gray-200 bg-white flex-shrink-0">
        {selectedChannels.map((id) => {
          const m = PLATFORM_META[id];
          if (!m) return null;
          const isActive = activeId === id;
          return (
            <button
              key={id}
              onClick={() => setActiveId(id)}
              title={m.label}
              className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                isActive
                  ? "bg-gray-100 ring-2 ring-indigo-400 ring-offset-1"
                  : "hover:bg-gray-50"
              }`}
            >
              <img
                src={m.icon}
                alt={m.label}
                className="w-5 h-5 object-contain"
              />
            </button>
          );
        })}
      </div>

      {/* Scrollable preview area */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeId &&
          (activeId === "youtube" ? (
            /* ── YouTube video card layout ── */
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
              {/* Thumbnail */}
              <div
                className={`relative w-full ${currentAspect} bg-gray-900 group`}
              >
                {youtubeThumbnail || mediaUrl ? (
                  <img
                    src={
                      youtubeThumbnail
                        ? URL.createObjectURL(youtubeThumbnail)
                        : mediaUrl
                    }
                    alt="Thumbnail"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100">
                    <ImageIcon className="w-8 h-8 text-gray-300 mb-1" />
                    <span className="text-[10px] text-gray-400">
                      No media yet
                    </span>
                  </div>
                )}
                {/* Duration badge */}
                <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded shadow-sm">
                  0:00
                </span>

                {/* YouTube Red Progress Bar Shimmer */}
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-700/50">
                  <div className="h-full w-1/3 bg-[#FF0000] shadow-[0_0_8px_rgba(255,0,0,0.5)]" />
                </div>
              </div>

              {/* Video info row */}
              <div className="p-3">
                <div className="flex gap-3">
                  {/* Channel avatar */}
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center flex-shrink-0">
                    <span className="text-[12px] font-bold text-white">Y</span>
                  </div>
                  {/* Title + meta */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[13px] font-bold text-gray-900 leading-snug line-clamp-2 mb-1">
                      {videoTitle || "Your Video Title"}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-medium">
                      <span>Your Channel</span>
                      <span className="w-0.5 h-0.5 rounded-full bg-gray-400" />
                      <span>1.2K views</span>
                      <span className="w-0.5 h-0.5 rounded-full bg-gray-400" />
                      <span>Just now</span>
                    </div>
                  </div>
                </div>

                {/* Integration: YT Actions Row (Like/Dislike/Share) */}
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-50">
                  <div className="flex items-center bg-gray-100 rounded-full py-1.5 px-3 gap-3">
                    <div className="flex items-center gap-1.5 pr-2 border-r border-gray-300">
                      <span className="text-xs">👍</span>
                      <span className="text-[10px] font-bold text-gray-700">
                        12
                      </span>
                    </div>
                    <span className="text-xs">👎</span>
                  </div>
                  <div className="flex items-center bg-gray-100 rounded-full py-1.5 px-3 gap-2">
                    <span className="text-[10px] font-bold text-gray-700">
                      ↗️ Share
                    </span>
                  </div>
                  <div className="flex items-center bg-gray-100 rounded-full p-1.5">
                    <span className="text-xs">⬇️</span>
                  </div>
                </div>
              </div>
            </div>
          ) : activeId === "instagram" ? (
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
              <div className="flex items-center gap-2.5 px-3 py-2.5">
                <div
                  className="p-[2px] rounded-full flex-shrink-0"
                  style={{
                    background:
                      "linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)",
                  }}
                >
                  <div className="w-7 h-7 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                    <span className="text-[10px] font-bold text-white">Y</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-[12px] font-semibold text-gray-900 leading-tight">
                      your_account
                    </span>
                    <svg
                      className="w-3 h-3 flex-shrink-0"
                      viewBox="0 0 24 24"
                      fill="#3897f0"
                    >
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm-1.25 17.292l-4.5-4.364 1.857-1.858 2.643 2.506 5.643-5.784 1.857 1.857-7.5 7.643z" />
                    </svg>
                  </div>
                </div>
                <button className="text-[11px] font-bold text-gray-800 border border-gray-300 rounded-md px-3 py-0.5 mr-1">
                  Follow
                </button>
                <div className="flex flex-col gap-[3px]">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-[3px] h-[3px] rounded-full bg-gray-500"
                    />
                  ))}
                </div>
              </div>
              <div
                className={`relative w-full ${currentAspect} bg-gray-900 overflow-hidden`}
              >
                {mediaUrl ? (
                  <>
                    {mediaType === "image" ? (
                      <img
                        src={mediaUrl}
                        alt="Post"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <video
                        src={mediaUrl}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                      />
                    )}
                    {mediaFiles.length > 1 && (
                      <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md rounded-full px-2 py-0.5 flex items-center gap-1 border border-white/10 shadow-lg">
                        <ImageIcon className="w-2.5 h-2.5 text-white" />
                        <span className="text-[10px] font-bold text-white leading-none">
                          1/{mediaFiles.length}
                        </span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100">
                    <ImageIcon className="w-8 h-8 text-gray-400 mb-1" />
                    <span className="text-[10px] text-gray-400">
                      No media yet
                    </span>
                  </div>
                )}
              </div>
              <div className="px-3 pt-2.5 pb-1">
                <div className="flex items-center">
                  <div className="flex items-center gap-3 flex-1">
                    <svg
                      className="w-6 h-6 text-gray-800"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.8}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                    <svg
                      className="w-6 h-6 text-gray-800"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.8}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                    <svg
                      className="w-6 h-6 text-gray-800"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.8}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                  </div>
                  <svg
                    className="w-6 h-6 text-gray-800"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                    />
                  </svg>
                </div>
                <p className="text-[11px] font-semibold text-gray-900 mt-1.5">
                  4,117 likes
                </p>
                {caption && (
                  <p className="text-[11px] text-gray-900 mt-1 leading-relaxed">
                    <span className="font-semibold mr-1">your_account</span>
                    {truncatedCaption}
                  </p>
                )}
                <p className="text-[10px] text-gray-500 mt-1 mb-2">
                  View all 31 comments
                </p>
              </div>
            </div>
          ) : activeId === "facebook" ? (
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
              {/* FB Header */}
              <div className="flex items-center gap-2.5 px-3 py-2.5">
                <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-[13px] font-bold text-white">Y</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-gray-900 leading-tight">
                    Your Account
                  </p>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-gray-500">Just now</span>
                    <span className="text-gray-400">·</span>
                    <svg
                      className="w-3 h-3 text-gray-400"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93V18c0-.55.45-1 1-1s1 .45 1 1v1.93c-2.06-.23-3.88-1.19-5.22-2.64l1.37-1.37c.39-.39 1.02-.39 1.41 0 .38.38.38 1.02 0 1.41l-.15.14c.87.87 1.9 1.53 3.06 1.9zM7.07 17.66l-1.41-1.41c-1.45-1.34-2.41-3.16-2.64-5.22H4.99c.55 0 1 .45 1 1s-.45 1-1 1H3.07c.23 2.06 1.19 3.88 2.64 5.22zM5 12c0-.55.45-1 1-1h1c.55 0 1 .45 1 1s-.45 1-1 1H6c-.55 0-1-.45-1-1zm7-8c.55 0 1 .45 1 1v1c.55 0 1 .45 1 1s-.45 1-1 1H12c-.55 0-1-.45-1-1V5c0-.55.45-1 1-1z" />
                    </svg>
                  </div>
                </div>
                <div className="flex flex-col gap-[3px]">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-[4px] h-[4px] rounded-full bg-gray-400"
                    />
                  ))}
                </div>
              </div>
              {/* Caption */}
              {caption && (
                <p className="px-3 pb-2 text-[12px] leading-relaxed text-gray-900">
                  {truncatedCaption}
                </p>
              )}
              {/* Media */}
              <div className={`relative w-full ${currentAspect} bg-gray-100`}>
                {mediaUrl ? (
                  mediaType === "image" ? (
                    <img
                      src={mediaUrl}
                      alt="Post"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <video
                      src={mediaUrl}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                    />
                  )
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100">
                    <ImageIcon className="w-8 h-8 text-gray-300 mb-1" />
                    <span className="text-[10px] text-gray-400">
                      No media yet
                    </span>
                  </div>
                )}
              </div>
              {/* Reaction counts */}
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-100">
                <div className="flex items-center gap-1">
                  <span className="text-[14px]">👍</span>
                  <span className="text-[10px] text-gray-500">124</span>
                </div>
                <span className="text-[10px] text-gray-400">
                  12 comments · 4 shares
                </span>
              </div>
              {/* Action bar */}
              <div className="flex items-center divide-x divide-gray-100">
                {[
                  ["👍", "Like"],
                  ["💬", "Comment"],
                  ["↗️", "Share"],
                ].map(([icon, label]) => (
                  <button
                    key={label}
                    className="flex-1 flex items-center justify-center gap-1 py-2 hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-[13px]">{icon}</span>
                    <span className="text-[11px] font-medium text-gray-600">
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : activeId === "linkedin" ? (
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
              {/* LI Header */}
              <div className="flex items-start gap-2.5 px-3 py-2.5">
                <div className="w-10 h-10 rounded-full bg-[#0A66C2] flex items-center justify-center flex-shrink-0">
                  <span className="text-[13px] font-bold text-white">Y</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-gray-900 leading-tight">
                    Your Account
                  </p>
                  <p className="text-[10px] text-gray-500">Your Title · 1st</p>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-gray-400">
                      Just now ·
                    </span>
                    <svg
                      className="w-3 h-3 text-gray-400"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                    >
                      <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm0 14.5a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13zM8 3.5a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5zm.75 3.25v4.5a.75.75 0 0 1-1.5 0v-4.5a.75.75 0 0 1 1.5 0z" />
                    </svg>
                  </div>
                </div>
                <button className="text-[11px] font-semibold text-[#0A66C2] border border-[#0A66C2] rounded-full px-3 py-0.5 flex-shrink-0">
                  + Follow
                </button>
              </div>
              {/* Caption */}
              {caption && (
                <p className="px-3 pb-2 text-[12px] leading-relaxed text-gray-900">
                  {truncatedCaption}{" "}
                  <span className="text-[#0A66C2] font-medium cursor-pointer">
                    ...see more
                  </span>
                </p>
              )}
              {/* Media */}
              <div className={`relative w-full ${currentAspect} bg-gray-100`}>
                {mediaUrl ? (
                  mediaType === "image" ? (
                    <img
                      src={mediaUrl}
                      alt="Post"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <video
                      src={mediaUrl}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                    />
                  )
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100">
                    <ImageIcon className="w-8 h-8 text-gray-300 mb-1" />
                    <span className="text-[10px] text-gray-400">
                      No media yet
                    </span>
                  </div>
                )}
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
                {[
                  ["👍", "Like"],
                  ["💬", "Comment"],
                  ["🔁", "Repost"],
                  ["↗️", "Send"],
                ].map(([icon, label]) => (
                  <button
                    key={label}
                    className="flex-1 flex items-center justify-center gap-1 py-2 hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-[12px]">{icon}</span>
                    <span className="text-[10px] font-medium text-gray-600">
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : activeId === "threads" ? (
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
                    <span className="text-[12px] font-semibold text-gray-900">
                      your_account
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400">1m</span>
                      <div className="flex flex-col gap-[3px]">
                        {[0, 1, 2].map((i) => (
                          <div
                            key={i}
                            className="w-[3px] h-[3px] rounded-full bg-gray-400"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  {caption && (
                    <p className="text-[12px] text-gray-900 leading-relaxed mb-2">
                      {truncatedCaption}
                    </p>
                  )}
                  {mediaUrl && (
                    <div
                      className={`relative w-full ${currentAspect} rounded-xl overflow-hidden bg-gray-100 mb-2`}
                    >
                      {mediaType === "image" ? (
                        <img
                          src={mediaUrl}
                          alt="Post"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <video
                          src={mediaUrl}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                        />
                      )}
                    </div>
                  )}
                  {!mediaUrl && (
                    <div
                      className={`relative w-full ${currentAspect} rounded-xl overflow-hidden bg-gray-100 mb-2 flex flex-col items-center justify-center`}
                    >
                      <ImageIcon className="w-8 h-8 text-gray-300 mb-1" />
                      <span className="text-[10px] text-gray-400">
                        No media yet
                      </span>
                    </div>
                  )}
                  {/* Action icons */}
                  <div className="flex items-center gap-4">
                    <svg
                      className="w-5 h-5 text-gray-700"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.8}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                    <svg
                      className="w-5 h-5 text-gray-700"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.8}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                    <svg
                      className="w-5 h-5 text-gray-700"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.8}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    <svg
                      className="w-5 h-5 text-gray-700"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.8}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                  </div>
                </div>
              </div>
              {/* Replies + likes */}
              <div className="flex items-center gap-2 px-3 pb-3">
                <div className="flex -space-x-1.5">
                  {["bg-purple-400", "bg-blue-400", "bg-green-400"].map(
                    (c, i) => (
                      <div
                        key={i}
                        className={`w-4 h-4 rounded-full ${c} border border-white`}
                      />
                    ),
                  )}
                </div>
                <span className="text-[10px] text-gray-500">
                  3 replies · 12 likes
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div
                className="flex items-center gap-2 px-3 py-2"
                style={{ background: meta.headerBg }}
              >
                <img
                  src={meta.icon}
                  alt={meta.label}
                  className="w-4 h-4 object-contain brightness-200"
                />
                <span
                  className="text-[11px] font-bold tracking-wide"
                  style={{ color: meta.textColor }}
                >
                  {meta.label}
                </span>
              </div>
              <div style={{ background: meta.bodyBg }}>
                <div className="flex items-center gap-2 px-3 pt-3 pb-2">
                  <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-bold text-gray-600">
                      U
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[11px] font-bold truncate"
                      style={{
                        color:
                          activeId === "tiktok" || activeId === "mastodon"
                            ? "#fff"
                            : "#111",
                      }}
                    >
                      Your Account
                    </p>
                    <p
                      className="text-[9px]"
                      style={{
                        color:
                          activeId === "tiktok" || activeId === "mastodon"
                            ? "#aaa"
                            : "#888",
                      }}
                    >
                      Just now
                    </p>
                  </div>
                  {activeId === "tiktok" && (
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border border-white text-white">
                      Follow
                    </span>
                  )}
                </div>
                {!["pinterest", "tiktok"].includes(activeId) && caption && (
                  <p
                    className="px-3 pb-2 text-[11px] leading-relaxed"
                    style={{ color: activeId === "mastodon" ? "#eee" : "#222" }}
                  >
                    {truncatedCaption}
                  </p>
                )}
                <div
                  className={`w-full ${currentAspect} overflow-hidden relative bg-gray-900`}
                >
                  {mediaUrl ? (
                    mediaType === "image" ? (
                      <img
                        src={mediaUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <video
                        src={mediaUrl}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                      />
                    )
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100">
                      <ImageIcon className="w-8 h-8 text-gray-300 mb-1" />
                      <span className="text-[10px] text-gray-400">
                        No media yet
                      </span>
                    </div>
                  )}
                  {activeId === "tiktok" && caption && (
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                      <p className="text-white text-[10px] leading-tight">
                        {truncatedCaption}
                      </p>
                    </div>
                  )}
                </div>
                {activeId === "pinterest" && caption && (
                  <p className="px-3 pt-2 pb-1 text-[11px] leading-relaxed text-gray-800">
                    {truncatedCaption}
                  </p>
                )}
                <div
                  className="flex items-center gap-3 px-3 py-2 border-t"
                  style={{
                    borderColor: activeId === "mastodon" ? "#333" : "#f0f0f0",
                  }}
                >
                  {meta.actions.map((a, i) => (
                    <span
                      key={i}
                      className="text-[11px]"
                      style={{
                        color:
                          activeId === "tiktok" || activeId === "mastodon"
                            ? "#ccc"
                            : "#555",
                      }}
                    >
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}

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
  const { addJob } = useUploadJobs();
  const { confirm } = useDialog();
  const [caption, setCaption] = useState("");
  const [mediaFiles, setMediaFiles] = useState([]);
  const [selectedChannels, setSelectedChannels] = useState([]);
  const [platformData, setPlatformData] = useState({
    pinterest: { title: "", link: "", boardId: "" },
    instagram: { firstComment: "" },
    youtube: {},
    reddit: { subreddit: "" },
  });
  const [customizationExpanded, setCustomizationExpanded] = useState(false);
  const [youtubeThumbnail, setYoutubeThumbnail] = useState(null);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedSizePreset, setSelectedSizePreset] = useState("ig-feed-square");
  const [sizeTargetPlatform, setSizeTargetPlatform] = useState("instagram");
  const fileInputRef = useRef(null);

  const selectedRatio = useMemo(() => {
    return (
      SIZE_PRESETS.find((preset) => preset.id === selectedSizePreset)?.ratio ||
      "1:1"
    );
  }, [selectedSizePreset]);

  const availableSizePresets = useMemo(() => {
    if (selectedChannels.length === 0) {
      return SIZE_PRESETS.map((preset) => ({
        ...preset,
        matchedPlatforms: preset.platforms,
        matchCount: preset.platforms.length,
      }));
    }

    const curatedPrefix = PLATFORM_PRESET_PREFIX[sizeTargetPlatform];
    if (curatedPrefix) {
      const curatedPresets = SIZE_PRESETS.filter((preset) =>
        preset.id.startsWith(curatedPrefix),
      ).map((preset) => ({
        ...preset,
        matchedPlatforms: [sizeTargetPlatform],
        matchCount: 1,
      }));

      if (curatedPresets.length > 0) {
        return curatedPresets;
      }
    }

    const platformName =
      PLATFORM_SHORT_LABELS[sizeTargetPlatform] || sizeTargetPlatform;

    return ASPECT_RATIOS.map((ratio) => ({
      id: `${sizeTargetPlatform}-${ratio.id}`,
      ratio: ratio.id,
      title: `${platformName} ${ratio.label}`,
      subtitle: "Platform-ready format",
      platforms: [sizeTargetPlatform],
      matchedPlatforms: [sizeTargetPlatform],
      matchCount: 1,
    }));
  }, [selectedChannels, sizeTargetPlatform]);

  React.useEffect(() => {
    if (selectedChannels.length === 0) {
      setSizeTargetPlatform("instagram");
      return;
    }

    if (!selectedChannels.includes(sizeTargetPlatform)) {
      setSizeTargetPlatform(selectedChannels[0]);
    }
  }, [selectedChannels, sizeTargetPlatform]);

  React.useEffect(() => {
    if (
      availableSizePresets.length > 0 &&
      !availableSizePresets.some((preset) => preset.id === selectedSizePreset)
    ) {
      setSelectedSizePreset(availableSizePresets[0].id);
    }
  }, [availableSizePresets, selectedSizePreset]);

  // Auto-select connected channels on mount
  React.useEffect(() => {
    if (isOpen && selectedChannels.length === 0) {
      const connected = [];
      if (connectedAccounts.youtube) connected.push("youtube");
      if (connectedAccounts.instagram) connected.push("instagram");
      if (connectedAccounts.pinterest) connected.push("pinterest");
      if (connectedAccounts.facebook) connected.push("facebook");
      if (connectedAccounts.threads) connected.push("threads");
      if (connectedAccounts.x) connected.push("x");
      if (connectedAccounts.reddit) connected.push("reddit");
      setSelectedChannels(connected);
    }
  }, [isOpen, connectedAccounts]);

  const handleChannelToggle = (platformId) => {
    setSelectedChannels((prev) =>
      prev.includes(platformId)
        ? prev.filter((id) => id !== platformId)
        : [...prev, platformId],
    );
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files).filter(
        (f) => f.type.startsWith("image/") || f.type.startsWith("video/"),
      );

      if (files.length > 0) {
        const newFiles = files.map((file) => ({
          id: Math.random().toString(36).substr(2, 9) + Date.now().toString(36),
          file,
        }));
        setMediaFiles((prev) => [...prev, ...newFiles].slice(0, 10));
        setError(null);
      } else {
        setError("Please upload image or video files");
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files).filter(
        (f) => f.type.startsWith("image/") || f.type.startsWith("video/"),
      );

      if (files.length > 0) {
        const newFiles = files.map((file) => ({
          id: Math.random().toString(36).substr(2, 9) + Date.now().toString(36),
          file,
        }));
        setMediaFiles((prev) => [...prev, ...newFiles].slice(0, 10));
        setError(null);
      } else {
        setError("Please upload image or video files");
      }
    }
  };

  const removeFile = (index) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const validateForm = () => {
    if (selectedChannels.length === 0) {
      setError("Please select at least one channel");
      return false;
    }

    if (!caption.trim()) {
      setError("Please enter a caption");
      return false;
    }

    if (mediaFiles.length === 0) {
      setError("Please upload at least one image or video");
      return false;
    }

    // Validate Pinterest fields if Pinterest is selected
    if (selectedChannels.includes("pinterest")) {
      if (!platformData.pinterest?.title?.trim()) {
        setError("Pinterest requires a title");
        return false;
      }
      if (!platformData.pinterest?.boardId) {
        setError("Pinterest requires a board selection");
        return false;
      }
    }

    // Validate YouTube media type
    if (
      selectedChannels.includes("youtube") &&
      mediaFiles.some((m) => m.file.type.startsWith("image/"))
    ) {
      setError(
        "Posting on YouTube via app is not possible for images. You can only upload video.",
      );
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    setError(null);

    if (!validateForm()) {
      return;
    }

    // YouTube Thumbnail Check
    const isVideo = mediaFiles[0]?.file?.type?.startsWith("video/");
    if (selectedChannels.includes("youtube") && isVideo && !youtubeThumbnail) {
      const proceed = await confirm(
        "Missing YouTube Thumbnail",
        "You haven't selected a custom thumbnail for your YouTube video. YouTube will pick a default frame from the video. Do you want to set one now?",
        {
          confirmText: "Post Anyway",
          cancelText: "Add Thumbnail",
          intent: "warning",
        },
      );
      if (!proceed) {
        setCustomizationExpanded(true);
        return;
      }
    }

    setLoading(true);

    try {
      const formData = new FormData();
      // Important: Append text fields BEFORE files for some multipart parsers
      formData.append("caption", caption);
      formData.append("selectedChannels", JSON.stringify(selectedChannels));
      formData.append(
        "platformData",
        JSON.stringify({
          ...platformData,
          composer: {
            sizePreset: selectedSizePreset,
            aspectRatio: selectedRatio,
          },
        }),
      );
      formData.append("selectedPostSizePreset", selectedSizePreset);
      formData.append("selectedAspectRatio", selectedRatio);
      if (youtubeThumbnail && selectedChannels.includes("youtube")) {
        formData.append("youtubeThumbnail", youtubeThumbnail);
      }
      formData.append("isScheduled", isScheduled ? "true" : "false");

      if (isScheduled && scheduledAt) {
        // Convert local datetime-local string to UTC ISO string
        const scheduledDate = new Date(scheduledAt);
        formData.append("scheduledAt", scheduledDate.toISOString());
      }

      mediaFiles.forEach((m) => {
        formData.append("media", m.file);
      });

      // ── POST and get jobId back immediately (< 1 second) ──────────────
      const response = await apiClient.post("/api/broadcast", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const { jobId } = response.data;

      if (jobId) {
        // Create a local blob URL for immediate preview in the Task Manager
        const localPreviewUrl = youtubeThumbnail
          ? URL.createObjectURL(youtubeThumbnail)
          : mediaFiles[0]
            ? URL.createObjectURL(mediaFiles[0].file)
            : null;

        // Register the job in the Upload Manager Panel
        addJob(
          jobId,
          {
            caption,
            channels: selectedChannels,
            mediaType: isVideo ? "video" : "image",
            fileCount: mediaFiles.length,
            previewUrl: localPreviewUrl,
          },
          onPostCreated,
        ); // onPostCreated is called when the job completes
      } else {
        // Fallback for non-async or scheduled responses
        onPostCreated(response.data);
      }

      // Close modal immediately — UI is unblocked!
      handleClose();
    } catch (error) {
      console.error("Broadcast error:", error);
      setError(
        error.response?.data?.error || "Failed to broadcast. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCaption("");
    setMediaFiles([]);
    setSelectedChannels([]);
    setPlatformData({
      pinterest: { title: "", link: "", boardId: "" },
      instagram: { firstComment: "" },
      youtube: {},
      reddit: { subreddit: "" },
    });
    setYoutubeThumbnail(null);
    setCustomizationExpanded(false);
    setIsScheduled(false);
    setScheduledAt("");
    setSelectedSizePreset("ig-feed-square");
    setSizeTargetPlatform("instagram");
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  const mediaType = mediaFiles[0]?.file?.type?.startsWith("video/")
    ? "video"
    : "image";

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="bg-white rounded-lg shadow-xl w-full max-h-[90vh] overflow-hidden"
        style={{ maxWidth: "1100px" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-3 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900">Create Post</h2>
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
                onBulkSelect={setSelectedChannels}
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
              <div className="mt-3">
                <div className="flex items-center justify-between mb-2 ml-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Quick Ideas
                  </p>
                  {caption && (
                    <button
                      onClick={() => setCaption("")}
                      className="text-[10px] text-gray-400 hover:text-red-500 transition-colors uppercase tracking-wider font-bold"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                <div
                  className="flex gap-2 overflow-x-auto pb-2 no-scrollbar"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                  {QUICK_SUGGESTIONS.map((suggestion, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() =>
                        setCaption((prev) =>
                          prev ? `${prev} ${suggestion}` : suggestion,
                        )
                      }
                      className="flex-shrink-0 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-[11px] text-gray-600 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 transition-all whitespace-nowrap"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hashtag Suggestions & Promotion */}
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-2 ml-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Hashtag Ideas
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  {/* Brand Promotion Card */}
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-3 border border-indigo-100/50 flex items-center justify-between group hover:shadow-sm transition-all duration-300">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-indigo-500">
                        <Sparkles className="w-4 h-4 animate-pulse" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-indigo-900 group-hover:text-indigo-600 transition-colors">
                          Get Featured!
                        </p>
                        <p className="text-[10px] text-indigo-500/80">
                          Use #getaipilot to boost your reach
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setCaption((prev) =>
                          prev ? `${prev} #getaipilot` : "#getaipilot",
                        )
                      }
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold shadow-md shadow-indigo-200 transition-all active:scale-95 flex items-center gap-1.5"
                    >
                      <span>#getaipilot</span>
                      <Sparkles className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Other Hashtags Row */}
                  <div
                    className="flex gap-2 overflow-x-auto pb-2 no-scrollbar"
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                  >
                    {SUGGESTED_HASHTAGS.map((tag, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() =>
                          setCaption((prev) => (prev ? `${prev} ${tag}` : tag))
                        }
                        className="flex-shrink-0 px-3 py-1 bg-white border border-gray-200 rounded-md text-[11px] font-medium text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-all"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-2 px-1">
                <p className="text-[11px] text-gray-500 font-medium">
                  {caption.length} / 2200
                </p>
              </div>
            </div>

            {/* Media Upload - Multi-image gallery style */}
            <div className="mb-6">
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors mb-4 ${
                  dragActive
                    ? "border-gray-400 bg-gray-100"
                    : "border-gray-300 hover:border-gray-400"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <ImageIcon
                  className="w-10 h-10 text-gray-400 mx-auto mb-2"
                  strokeWidth={1.5}
                />
                <p className="text-gray-600 text-sm mb-1">
                  Drag & drop or{" "}
                  <label className="text-buffer-blue hover:text-buffer-blueDark cursor-pointer font-medium">
                    select multiple files
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*,video/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mt-1">
                  Up to 10 images or video
                </p>
              </div>

              {/* Image Preview Grid with Reordering */}
              {mediaFiles.length > 0 && (
                <Reorder.Group
                  axis="x"
                  values={mediaFiles}
                  onReorder={setMediaFiles}
                  className="grid grid-cols-5 gap-3 mt-4"
                >
                  <AnimatePresence>
                    {mediaFiles.map((m, idx) => {
                      const isVideo = m.file.type.startsWith("video/");
                      return (
                        <Reorder.Item
                          key={m.id}
                          value={m}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50 cursor-grab active:cursor-grabbing"
                        >
                          {isVideo ? (
                            <div className="w-full h-full flex items-center justify-center bg-gray-900 pointer-events-none">
                              <Upload className="w-6 h-6 text-white/50" />
                            </div>
                          ) : (
                            <img
                              src={URL.createObjectURL(m.file)}
                              alt={m.file.name}
                              className="w-full h-full object-cover pointer-events-none"
                            />
                          )}

                          {/* Reorder Handle Overlay */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
                          <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <GripVertical className="w-3 h-3 text-white drop-shadow-md" />
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFile(idx);
                            }}
                            className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                          >
                            <X className="w-3 h-3" />
                          </button>

                          {idx === 0 && (
                            <span className="absolute bottom-1 left-1 px-1 rounded bg-blue-600 text-[8px] text-white font-bold uppercase z-10">
                              Cover
                            </span>
                          )}
                        </Reorder.Item>
                      );
                    })}
                  </AnimatePresence>

                  {mediaFiles.length < 10 && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center hover:border-gray-300 hover:bg-gray-50 transition-all text-gray-400 group"
                    >
                      <Upload className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    </button>
                  )}
                </Reorder.Group>
              )}

              {/* Post Format Selection */}
              <div className="mt-8 border-t border-gray-100 pt-6">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] mb-1">
                      Smart Post Size
                    </p>
                    <p className="text-xs text-gray-600">
                      Layouts are shown based on the platform you choose below.
                    </p>
                  </div>
                  {selectedChannels.length > 0 && availableSizePresets[0] && (
                    <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded-full">
                      {PLATFORM_SHORT_LABELS[sizeTargetPlatform] || sizeTargetPlatform}: {availableSizePresets[0].ratio}
                    </span>
                  )}
                </div>

                {selectedChannels.length > 1 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {selectedChannels.map((platformId) => (
                      <button
                        key={`size-target-${platformId}`}
                        type="button"
                        onClick={() => setSizeTargetPlatform(platformId)}
                        className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all ${
                          sizeTargetPlatform === platformId
                            ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                            : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {PLATFORM_SHORT_LABELS[platformId] || platformId}
                      </button>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {availableSizePresets.map((preset) => {
                    const ratio = ASPECT_RATIOS.find((r) => r.id === preset.ratio);
                    if (!ratio) return null;

                    const matches = preset.matchedPlatforms || preset.platforms;

                    return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setSelectedSizePreset(preset.id)}
                      className={`flex flex-col items-center gap-4 p-4 rounded-xl border transition-all duration-300 group ${
                        selectedSizePreset === preset.id
                          ? "bg-indigo-50/40 border-indigo-200 shadow-sm ring-1 ring-indigo-200"
                          : "bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div
                          className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-500 ${
                            selectedSizePreset === preset.id
                              ? "bg-white shadow-md shadow-indigo-100/50 scale-110"
                              : "bg-gray-50 text-gray-400 group-hover:bg-white group-hover:shadow-sm"
                          }`}
                        >
                          <div
                            className={`rounded-[3px] transition-all duration-500 ${ratio.preview} ${
                              selectedSizePreset === preset.id
                                ? "border-indigo-500 bg-indigo-500/10"
                                : "border-gray-300 bg-gray-50"
                            }`}
                          />
                        </div>

                        <div className="text-left flex-1 min-w-0">
                          <p
                            className={`text-[11px] font-bold tracking-tight mb-0.5 ${selectedSizePreset === preset.id ? "text-indigo-900" : "text-gray-700"}`}
                          >
                            {preset.title}
                          </p>
                          <p className="text-[10px] text-gray-500 mb-1">{preset.subtitle}</p>
                          <p
                            className={`text-[10px] font-semibold tabular-nums ${selectedSizePreset === preset.id ? "text-indigo-500/80" : "text-gray-400"}`}
                          >
                            {preset.ratio}
                          </p>
                        </div>
                      </div>

                      <div className="w-full flex flex-wrap gap-1 justify-start">
                        {matches.slice(0, 4).map((platform) => (
                          <span
                            key={`${preset.id}-${platform}`}
                            className="text-[9px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium"
                          >
                            {PLATFORM_SHORT_LABELS[platform] || platform}
                          </span>
                        ))}
                        {matches.length > 4 && (
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
                            +{matches.length - 4} more
                          </span>
                        )}
                      </div>
                    </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Scheduling */}
            <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${isScheduled ? "bg-indigo-100 text-indigo-600" : "bg-gray-200 text-gray-500"}`}
                  >
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900 uppercase tracking-tight">
                      Schedule Post
                    </p>
                    <p className="text-[10px] text-gray-500">
                      Pick a future date and time
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsScheduled(!isScheduled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isScheduled ? "bg-indigo-600" : "bg-gray-300"}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isScheduled ? "translate-x-6" : "translate-x-1"}`}
                  />
                </button>
              </div>

              {isScheduled && (
                <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  />
                  <p className="text-[10px] text-indigo-600 font-medium ml-1">
                    Posts will be automatically published at the selected time.
                  </p>
                </div>
              )}
            </div>

            {/* Platform Customization */}
            <PlatformCustomization
              selectedChannels={selectedChannels}
              platformData={platformData}
              onPlatformDataChange={setPlatformData}
              expanded={customizationExpanded}
              onToggleExpanded={() =>
                setCustomizationExpanded(!customizationExpanded)
              }
              youtubeThumbnail={youtubeThumbnail}
              onYoutubeThumbnailChange={setYoutubeThumbnail}
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
              <h3 className="text-sm font-semibold text-gray-900">
                Post Preview
              </h3>
            </div>

            {selectedChannels.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
                  <Eye className="w-6 h-6 text-gray-300" />
                </div>
                <p className="text-sm font-medium text-gray-400">
                  Select a channel to see preview
                </p>
              </div>
            ) : (
              <PlatformPreviewPanel
                selectedChannels={selectedChannels}
                caption={caption}
                mediaFiles={mediaFiles}
                mediaType={mediaType}
                selectedRatio={selectedRatio}
                youtubeThumbnail={youtubeThumbnail}
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
            disabled={
              loading ||
              !caption.trim() ||
              mediaFiles.length === 0 ||
              selectedChannels.length === 0 ||
              (isScheduled && !scheduledAt)
            }
            className={`btn-fly-send ${loading ? "sending" : ""} ${isScheduled ? "bg-indigo-600 hover:bg-indigo-700" : ""}`}
          >
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center z-20">
                <Loader2 className="w-5 h-5 animate-spin text-white/50" />
              </div>
            )}

            <div className="svg-wrapper-1">
              <div className="svg-wrapper">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  width={24}
                  height={24}
                  fill="white"
                >
                  <path d="M1.946 9.315c-.522-.174-.527-.455.01-.634l19.087-6.362c.529-.176.832.12.684.638l-5.454 19.086c-.15.529-.455.547-.679.045L12 14l6-8-8 6-8.054-2.685z" />
                </svg>
              </div>
            </div>
            <span>{isScheduled ? "Schedule" : "Send"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ComposerModal;
