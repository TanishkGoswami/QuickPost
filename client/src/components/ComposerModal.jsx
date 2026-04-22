import React, { useState, useRef, useMemo, useEffect } from "react";
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
  AtSign,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Reorder, AnimatePresence, motion } from "framer-motion";
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
    id: "1.91:1",
    label: "Landscape",
    desc: "Wide Image",
    aspect: "aspect-[1.91/1]",
    icon: Monitor,
    preview: "w-8 h-4 border-2",
  },
  {
    id: "2:3",
    label: "Pin",
    desc: "Pinterest Vertical",
    aspect: "aspect-[2/3]",
    icon: RectangleVertical,
    preview: "w-5 h-7 border-2",
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

const PLATFORM_LAYOUT_PRESETS = {
  instagram: [
    {
      id: "ig-post-square",
      ratio: "1:1",
      title: "Post Square",
      subtitle: "1080x1080",
    },
    {
      id: "ig-portrait",
      ratio: "4:5",
      title: "Portrait",
      subtitle: "1080x1350",
    },
    { id: "ig-reel", ratio: "9:16", title: "Reel", subtitle: "1080x1920" },
    { id: "ig-story", ratio: "9:16", title: "Story", subtitle: "1080x1920" },
    {
      id: "ig-landscape",
      ratio: "16:9",
      title: "Landscape Post",
      subtitle: "16:9",
    },
  ],
  youtube: [
    { id: "yt-video", ratio: "16:9", title: "Video", subtitle: "1920x1080" },
    { id: "yt-shorts", ratio: "9:16", title: "Shorts", subtitle: "1080x1920" },
    {
      id: "yt-thumbnail",
      ratio: "16:9",
      title: "Thumbnail",
      subtitle: "1280x720",
    },
  ],
  linkedin: [
    { id: "li-image", ratio: "1.91:1", title: "Image", subtitle: "1200x627" },
    { id: "li-square", ratio: "1:1", title: "Square", subtitle: "1080x1080" },
    {
      id: "li-carousel",
      ratio: "1:1",
      title: "Carousel",
      subtitle: "1080x1080 (PDF pages)",
    },
  ],
  x: [
    { id: "x-image", ratio: "16:9", title: "Image", subtitle: "1200x675" },
    { id: "x-square", ratio: "1:1", title: "Square", subtitle: "1080x1080" },
  ],
  facebook: [
    { id: "fb-image", ratio: "1:1", title: "Image", subtitle: "1200x1200" },
    { id: "fb-reel", ratio: "9:16", title: "Reel", subtitle: "1080x1920" },
    { id: "fb-story", ratio: "9:16", title: "Story", subtitle: "1080x1920" },
  ],
  pinterest: [
    { id: "pin-standard", ratio: "2:3", title: "Pin", subtitle: "1000x1500" },
  ],
  tiktok: [
    { id: "tt-video", ratio: "9:16", title: "Video", subtitle: "1080x1920" },
  ],
  threads: [
    { id: "threads-post", ratio: "1:1", title: "Post", subtitle: "1080x1080" },
    {
      id: "threads-vertical",
      ratio: "9:16",
      title: "Vertical",
      subtitle: "1080x1920",
    },
  ],
  bluesky: [
    { id: "bluesky-image", ratio: "16:9", title: "Image", subtitle: "16:9" },
    { id: "bluesky-square", ratio: "1:1", title: "Square", subtitle: "1:1" },
  ],
  mastodon: [
    { id: "mastodon-image", ratio: "16:9", title: "Image", subtitle: "16:9" },
    { id: "mastodon-square", ratio: "1:1", title: "Square", subtitle: "1:1" },
  ],
  whatsapp: [
    { id: "wa-status", ratio: "9:16", title: "Status", subtitle: "1080x1920" },
  ],
  telegram: [
    { id: "tg-status", ratio: "9:16", title: "Status", subtitle: "1080x1920" },
  ],
};

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

const PLATFORM_POST_TYPES = {
  instagram: ["post", "story", "reel"],
  facebook: ["post", "story", "reel"],
  youtube: ["post", "reel"],
  tiktok: ["post", "reel"],
  x: ["post"],
  linkedin: ["post"],
  threads: ["post"],
  pinterest: ["post"],
  bluesky: ["post"],
  mastodon: ["post"],
  reddit: ["post"]
};

function getPresetsForPlatform(platformId) {
  return PLATFORM_LAYOUT_PRESETS[platformId] || [];
}

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
  activePlatform,
  onActivePlatformChange,
  connectedAccounts,
}) {
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const activeId = activePlatform || selectedChannels[0] || null;

  const meta = PLATFORM_META[activeId] || PLATFORM_META.instagram;

  // Use user selected ratio if available, otherwise fallback to platform default
  const currentAspect = selectedRatio
    ? ASPECT_RATIOS.find((r) => r.id === selectedRatio)?.aspect
    : meta.imgAspect;

  // Reset index when files change or platform changes
  useEffect(() => {
    setActiveMediaIndex(0);
  }, [mediaFiles.length, activeId]);

  const resolveMentions = (text, platform) => {
    if (!text) return text;
    const username = connectedAccounts[platform]?.username || "your_account";
    const prefix = ["facebook", "linkedin", "youtube"].includes(platform)
      ? ""
      : "@";
    return text.replaceAll("{{MENTION_SELF}}", `${prefix}${username}`);
  };

  const resolvedCaption = useMemo(
    () => resolveMentions(caption, activeId),
    [caption, activeId, connectedAccounts]
  );

  /* ── Stable Blob URL management ── */
  const [ytThumbUrl, setYtThumbUrl] = useState(null);
  const [mediaUrls, setMediaUrls] = useState([]);

  useEffect(() => {
    if (!youtubeThumbnail) {
      setYtThumbUrl(null);
    } else {
      const url = URL.createObjectURL(youtubeThumbnail);
      setYtThumbUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [youtubeThumbnail]);

  useEffect(() => {
    if (!mediaFiles || mediaFiles.length === 0) {
      setMediaUrls([]);
      return;
    }
    const urls = mediaFiles.map((m) => ({
      id: m.id,
      url: URL.createObjectURL(m.file),
      type: m.file.type.startsWith("video/") ? "video" : "image",
    }));
    setMediaUrls(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u.url));
  }, [mediaFiles]);

  /* ── INTERNAL COMPONENT: PreviewMedia ── */
  const PreviewMediaContent = ({ forceRatio }) => {
    const currentMedia = mediaUrls[activeMediaIndex];

    if (!currentMedia) {
      return (
        <div
          className={`w-full ${forceRatio || currentAspect} flex flex-col items-center justify-center bg-gray-100`}
        >
          <ImageIcon className="w-8 h-8 text-gray-300 mb-1" />
          <span className="text-[10px] text-gray-400">No media yet</span>
        </div>
      );
    }

    return (
      <div
        className={`relative w-full ${forceRatio || currentAspect} bg-gray-900 group overflow-hidden`}
      >
        <AnimatePresence>
          <motion.div
            key={activeMediaIndex}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="w-full h-full"
          >
            {currentMedia.type === "image" ? (
              <img
                src={currentMedia.url}
                alt="Post"
                className="w-full h-full object-cover"
              />
            ) : (
              <video
                src={currentMedia.url}
                className="w-full h-full object-cover"
                muted
                playsInline
                autoPlay
                loop
              />
            )}
          </motion.div>
        </AnimatePresence>

        {mediaFiles.length > 1 && (
          <>
            {/* Arrows */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveMediaIndex((prev) =>
                  prev > 0 ? prev - 1 : mediaFiles.length - 1
                );
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/60 transition-all opacity-0 group-hover:opacity-100 z-10"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveMediaIndex((prev) =>
                  prev < mediaFiles.length - 1 ? prev + 1 : 0
                );
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/60 transition-all opacity-0 group-hover:opacity-100 z-10"
            >
              <ChevronRight size={16} />
            </button>

            {/* Indicator Badge */}
            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md rounded-full px-2 py-0.5 flex items-center gap-1 border border-white/10 shadow-lg z-10">
              <ImageIcon className="w-2.5 h-2.5 text-white" />
              <span className="text-[10px] font-bold text-white leading-none">
                {activeMediaIndex + 1}/{mediaFiles.length}
              </span>
            </div>

            {/* Dots */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 z-10">
              {mediaFiles.map((_, i) => (
                <div
                  key={i}
                  className={`w-1 h-1 rounded-full transition-all ${
                    i === activeMediaIndex ? "bg-white scale-125" : "bg-white/40"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  const truncatedCaption =
    resolvedCaption?.length > 120
      ? resolvedCaption.slice(0, 120) + "…"
      : resolvedCaption;
  const videoTitle =
    resolvedCaption?.length > 60
      ? resolvedCaption.slice(0, 60) + "…"
      : resolvedCaption || "Your Video Title";
  const platformUsername = connectedAccounts[activeId]?.username || "your_account";

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
              onClick={() => onActivePlatformChange?.(id)}
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
                {ytThumbUrl ? (
                  <img
                    src={ytThumbUrl}
                    alt="Thumbnail"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <PreviewMediaContent />
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
                      <span>{platformUsername}</span>
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
                      {platformUsername}
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
              <PreviewMediaContent />
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
                    <span className="font-semibold mr-1">{platformUsername}</span>
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
                    {platformUsername}
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
              <PreviewMediaContent />
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
                    {platformUsername}
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
              <PreviewMediaContent />
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
                      {platformUsername}
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
                  <div className="mb-2">
                    <PreviewMediaContent forceRatio="aspect-auto rounded-xl overflow-hidden shadow-sm border border-gray-100" />
                  </div>
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
                      {platformUsername}
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
                <div className="relative">
                  <PreviewMediaContent />
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
  const [postType, setPostType] = useState("post");
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
  const [userTimezone] = useState(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedSizePreset, setSelectedSizePreset] =
    useState("ig-post-square");
  const [activePreviewPlatform, setActivePreviewPlatform] =
    useState("instagram");
  const [mobileActiveTab, setMobileActiveTab] = useState("edit"); // "edit" | "preview"
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const fileInputRef = useRef(null);

  React.useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;

  const availableSizePresets = useMemo(() => {
    const targetPlatform =
      selectedChannels.length > 0 ? activePreviewPlatform : "instagram";

    return getPresetsForPlatform(targetPlatform).map((preset) => ({
      ...preset,
      matchedPlatforms: [targetPlatform],
      matchCount: 1,
    }));
  }, [selectedChannels, activePreviewPlatform]);

  const availablePostTypes = useMemo(() => {
    if (selectedChannels.length === 0) return ["post", "story", "reel"];
    
    let common = PLATFORM_POST_TYPES[selectedChannels[0]] || ["post"];
    for (let i = 1; i < selectedChannels.length; i++) {
      const types = PLATFORM_POST_TYPES[selectedChannels[i]] || ["post"];
      common = common.filter(t => types.includes(t));
    }
    
    return common.length > 0 ? common : ["post"];
  }, [selectedChannels]);

  React.useEffect(() => {
    if (!availablePostTypes.includes(postType)) {
      setPostType(availablePostTypes[0] || "post");
    }
  }, [availablePostTypes, postType]);

  // Min datetime for scheduling = now + 2 minutes
  const minScheduleDateTime = React.useMemo(() => {
    const d = new Date(Date.now() + 2 * 60 * 1000);
    return d.toISOString().slice(0, 16);
  }, []);

  const selectedRatio = useMemo(() => {
    return (
      availableSizePresets.find((preset) => preset.id === selectedSizePreset)
        ?.ratio ||
      availableSizePresets[0]?.ratio ||
      "1:1"
    );
  }, [availableSizePresets, selectedSizePreset]);

  React.useEffect(() => {
    if (selectedChannels.length === 0) {
      setActivePreviewPlatform("instagram");
      return;
    }

    if (!selectedChannels.includes(activePreviewPlatform)) {
      setActivePreviewPlatform(selectedChannels[0]);
    }
  }, [selectedChannels, activePreviewPlatform]);

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

    // Validate scheduling time
    if (isScheduled) {
      if (!scheduledAt) {
        setError("Please select a date and time for scheduling.");
        return false;
      }
      const schedTime = new Date(scheduledAt).getTime();
      if (schedTime < Date.now() + 2 * 60 * 1000) {
        setError("Scheduled time must be at least 2 minutes in the future.");
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
      formData.append("userTimezone", userTimezone);

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
            postType,
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
    setPostType("post");
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
    setSelectedSizePreset("ig-post-square");
    setActivePreviewPlatform("instagram");
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
        style={{
          background: 'var(--canvas-lifted)',
          borderRadius: isMobile ? '0' : 'var(--r-hero)',
          boxShadow: 'var(--shadow-deep)',
          width: '100%',
          maxWidth: isMobile ? '100%' : '1100px',
          height: isMobile ? '100%' : 'auto',
          maxHeight: isMobile ? '100%' : '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: isMobile ? 'fixed' : 'relative',
          inset: isMobile ? 0 : 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ borderBottom: '1px solid rgba(20,20,19,0.08)', padding: isMobile ? '12px 16px' : '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--canvas-lifted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h2 style={{ fontSize: isMobile ? 15 : 16, fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.02em', margin: 0 }}>
              {isMobile ? "Composer" : "Create Post"}
            </h2>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button
              type="button"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                fontSize: 12,
                fontWeight: 600,
                color: "var(--slate)",
                background: "transparent",
                border: "1px solid rgba(20,20,19,0.10)",
                borderRadius: "var(--r-btn)",
                cursor: "pointer",
                fontFamily: "var(--font)",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(20,20,19,0.05)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
              title="AI Assistant"
            >
              <Sparkles size={13} />
              {!isMobile && <span>AI Assistant</span>}
            </button>
            <button
              type="button"
              onClick={handleClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                border: "1px solid rgba(20,20,19,0.10)",
                background: "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--slate)",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(20,20,19,0.05)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Mobile Tab Switcher */}
        {isMobile && (
          <div style={{ display: 'flex', background: 'var(--canvas-lifted)', borderBottom: '1px solid rgba(20,20,19,0.08)' }}>
            <button 
              onClick={() => setMobileActiveTab("edit")}
              style={{ flex: 1, padding: '12px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: mobileActiveTab === "edit" ? 'var(--ink)' : 'var(--slate)', border: 'none', background: 'transparent', borderBottom: `2.5px solid ${mobileActiveTab === "edit" ? 'var(--ink)' : 'transparent'}`, transition: 'all 0.2s' }}
            >
              1. Compose
            </button>
            <button 
              onClick={() => setMobileActiveTab("preview")}
              style={{ flex: 1, padding: '12px', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: mobileActiveTab === "preview" ? 'var(--ink)' : 'var(--slate)', border: 'none', background: 'transparent', borderBottom: `2.5px solid ${mobileActiveTab === "preview" ? 'var(--ink)' : 'transparent'}`, transition: 'all 0.2s' }}
            >
              2. Preview
            </button>
          </div>
        )}

        {/* Body - Split Layout */}
        <div style={{ display: 'flex', height: isMobile ? 'calc(100vh - 110px)' : 'calc(90vh - 120px)', flex: 1 }}>
          {/* Left Panel - Composer */}
          <div 
            className="flex-1 overflow-y-auto" 
            style={{ 
              padding: isMobile ? '20px 16px' : '24px', 
              borderRight: isMobile ? 'none' : '1px solid rgba(20,20,19,0.08)', 
              background: 'var(--canvas)',
              display: isMobile && mobileActiveTab !== "edit" ? 'none' : 'block'
            }}
          >
            {/* Channel Selection with Remove Badges */}
            <div className="mb-6">
              <ChannelSelector
                selectedChannels={selectedChannels}
                onChannelToggle={handleChannelToggle}
                onBulkSelect={setSelectedChannels}
              />
            </div>

            {/* Post Type Selection */}
            <div className="mb-6">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Publish As</label>
              <div className="flex gap-2">
                {availablePostTypes.includes("post") && (
                  <label className={`flex items-center gap-1.5 cursor-pointer px-3 py-2 rounded-lg transition-colors border ${postType === "post" ? "bg-indigo-50 border-indigo-200" : "bg-white border-gray-200 hover:border-gray-300"}`}>
                    <input type="radio" value="post" checked={postType === "post"} onChange={() => setPostType("post")} className="w-3.5 h-3.5 text-indigo-600 focus:ring-indigo-500 border-gray-300 cursor-pointer"/>
                    <span className="text-[12px] font-semibold text-gray-700">Post</span>
                  </label>
                )}
                {availablePostTypes.includes("story") && (
                  <label className={`flex items-center gap-1.5 cursor-pointer px-3 py-2 rounded-lg transition-colors border ${postType === "story" ? "bg-indigo-50 border-indigo-200" : "bg-white border-gray-200 hover:border-gray-300"}`}>
                    <input type="radio" value="story" checked={postType === "story"} onChange={() => setPostType("story")} className="w-3.5 h-3.5 text-indigo-600 focus:ring-indigo-500 border-gray-300 cursor-pointer"/>
                    <span className="text-[12px] font-semibold text-gray-700">Story</span>
                  </label>
                )}
                {availablePostTypes.includes("reel") && (
                  <label className={`flex items-center gap-1.5 cursor-pointer px-3 py-2 rounded-lg transition-colors border ${postType === "reel" ? "bg-indigo-50 border-indigo-200" : "bg-white border-gray-200 hover:border-gray-300"}`}>
                    <input type="radio" value="reel" checked={postType === "reel"} onChange={() => setPostType("reel")} className="w-3.5 h-3.5 text-indigo-600 focus:ring-indigo-500 border-gray-300 cursor-pointer"/>
                    <span className="text-[12px] font-semibold text-gray-700">Reel / Shorts</span>
                  </label>
                )}
              </div>
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
                    <div className="flex items-center gap-2">
                       <button
                        type="button"
                        onClick={() => setCaption((prev) => prev ? `${prev} {{MENTION_SELF}}` : "{{MENTION_SELF}}")}
                        className="text-[10px] text-indigo-500 hover:text-indigo-600 transition-colors uppercase tracking-wider font-bold flex items-center gap-1"
                        title="Inserts a dynamic handle that resolves to each platform's username"
                      >
                        <AtSign size={10} />
                        Mention Me
                      </button>
                      <button
                        onClick={() => setCaption("")}
                        className="text-[10px] text-gray-400 hover:text-red-500 transition-colors uppercase tracking-wider font-bold"
                      >
                        Clear all
                      </button>
                    </div>
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
                      style={{
                        flexShrink: 0,
                        padding: "5px 12px",
                        background: "var(--canvas-lifted)",
                        border: "1px solid rgba(20,20,19,0.12)",
                        borderRadius: "var(--r-pill)",
                        fontSize: 11,
                        color: "var(--slate)",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        fontFamily: "var(--font)",
                        fontWeight: 500,
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "var(--ink)";
                        e.currentTarget.style.color = "var(--canvas)";
                        e.currentTarget.style.borderColor = "var(--ink)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background =
                          "var(--canvas-lifted)";
                        e.currentTarget.style.color = "var(--slate)";
                        e.currentTarget.style.borderColor =
                          "rgba(20,20,19,0.12)";
                      }}
                      className=""
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
                  <div
                    style={{
                      background: "var(--canvas-lifted)",
                      border: "1px solid rgba(20,20,19,0.08)",
                      borderLeft: "3px solid var(--arc)",
                      borderRadius: "var(--r-btn)",
                      padding: "10px 14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background: "var(--canvas)",
                          boxShadow: "var(--shadow-nav)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "var(--arc)",
                        }}
                      >
                        <Sparkles size={14} />
                      </div>
                      <div>
                        <p
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: "var(--ink)",
                            margin: 0,
                            lineHeight: 1.3,
                          }}
                        >
                          Get Featured!
                        </p>
                        <p
                          style={{
                            fontSize: 10,
                            color: "var(--slate)",
                            margin: 0,
                          }}
                        >
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
                      className="btn-signal"
                      style={{
                        fontSize: 10,
                        padding: "4px 12px",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <span>#getaipilot</span>
                      <Sparkles size={10} />
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
                  <label className="text-link hover:underline cursor-pointer font-medium">
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
                  className={`grid ${isMobile ? 'grid-cols-3' : 'grid-cols-5'} gap-3 mt-4`}
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
                      Layouts follow the currently selected preview icon.
                    </p>
                  </div>
                  {selectedChannels.length > 0 && availableSizePresets[0] && (
                    <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded-full">
                      {PLATFORM_SHORT_LABELS[activePreviewPlatform] ||
                        activePreviewPlatform}
                      : {availableSizePresets[0].ratio}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {availableSizePresets.map((preset) => {
                    const ratio = ASPECT_RATIOS.find(
                      (r) => r.id === preset.ratio,
                    );
                    if (!ratio) return null;

                    const matches = preset.matchedPlatforms || preset.platforms || [];

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
                            <p className="text-[10px] text-gray-500 mb-1">
                              {preset.subtitle}
                            </p>
                            <p className="text-[10px] text-gray-400 mb-1">
                              {preset.ratio}
                            </p>
                            <p
                              className={`text-[10px] font-semibold tabular-nums ${selectedSizePreset === preset.id ? "text-indigo-500/80" : "text-gray-400"}`}
                            >
                              {ASPECT_RATIOS.find((r) => r.id === preset.ratio)
                                ?.desc || "Recommended"}
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
                  onClick={() => {
                    setIsScheduled(!isScheduled);
                    setScheduledAt("");
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isScheduled ? "bg-indigo-600" : "bg-gray-300"}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isScheduled ? "translate-x-6" : "translate-x-1"}`}
                  />
                </button>
              </div>

              {isScheduled && (
                <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    min={minScheduleDateTime}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  />
                  {/* Timezone display */}
                  <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 rounded-lg border border-indigo-100">
                    <svg
                      className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">
                        Timezone:{" "}
                      </span>
                      <span className="text-[10px] text-indigo-600 font-medium">
                        {userTimezone}
                      </span>
                    </div>
                  </div>
                  {scheduledAt && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg border border-green-100">
                      <svg
                        className="w-3.5 h-3.5 text-green-500 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="text-[10px] text-green-700 font-medium">
                        Will publish at{" "}
                        {new Date(scheduledAt).toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}{" "}
                        ({userTimezone})
                      </span>
                    </div>
                  )}
                  <p className="text-[10px] text-indigo-500 font-medium ml-1">
                    ✓ Post is saved server-side and publishes automatically —
                    even if you close the app.
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
          <div
            style={{
              width: 320,
              flexShrink: 0,
              borderLeft: "1px solid rgba(20,20,19,0.08)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              background: "var(--canvas-lifted)",
            }}
          >
            <div
              style={{
                padding: "12px 16px",
                borderBottom: "1px solid rgba(20,20,19,0.08)",
                background: "var(--canvas-lifted)",
              }}
            >
              <h3
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--ink)",
                  letterSpacing: "-0.01em",
                  margin: 0,
                  textTransform: "uppercase",
                }}
              >
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
                activePlatform={activePreviewPlatform}
                onActivePlatformChange={setActivePreviewPlatform}
                connectedAccounts={connectedAccounts}
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            borderTop: "1px solid rgba(20,20,19,0.08)",
            padding: "12px 24px",
            background: "var(--canvas-lifted)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <button
            type="button"
            onClick={handleClose}
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: "var(--slate)",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--font)",
              letterSpacing: "-0.01em",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--ink)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--slate)")}
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
