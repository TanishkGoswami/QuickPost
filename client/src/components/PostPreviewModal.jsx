import React, { useState, useEffect } from 'react';
import {
  X, ExternalLink, CheckCircle2, XCircle,
  Clock, Heart, MessageCircle, Share2, Bookmark,
  MoreHorizontal, MoreVertical, Send,
  Repeat, MessageSquare, Plus, Music2,
  ThumbsUp, ThumbsDown, Play, User,
  ChevronLeft, Video
} from 'lucide-react';

/* ── Platform display config ─────────────────────────────────────────── */
const PLATFORM_CONFIG = {
  instagram: {
    name: 'Instagram', color: '#E4405F', bg: '#fff',
    icon: '/icons/ig-instagram-icon.svg',
    formats: [
      { id: 'ig_post',  label: 'Square Post', ratio: '1:1',    w: 1080, h: 1080, css: 'aspect-square'     },
      { id: 'ig_port',  label: 'Portrait',    ratio: '4:5',    w: 1080, h: 1350, css: 'aspect-[4/5]'      },
      { id: 'ig_reel',  label: 'Reel',        ratio: '9:16',   w: 1080, h: 1920, css: 'aspect-[9/16]', full: true },
      { id: 'ig_story', label: 'Story',       ratio: '9:16',   w: 1080, h: 1920, css: 'aspect-[9/16]', full: true },
    ],
    headerBg: '#fff',
    textColor: '#000',
  },
  x: {
    name: 'X (Twitter)', color: '#000', bg: '#000',
    icon: '/icons/x-social-media-round-icon.svg',
    formats: [
      { id: 'x_post',   label: 'Feed Image', ratio: '16:9', w: 1200, h: 675,  css: 'aspect-video'      },
      { id: 'x_square', label: 'Square',     ratio: '1:1',  w: 1080, h: 1080, css: 'aspect-square'     },
    ],
    headerBg: '#000',
    textColor: '#fff',
  },
  linkedin: {
    name: 'LinkedIn', color: '#0A66C2', bg: '#f3f2ef',
    icon: '/icons/linkedin-icon.svg',
    formats: [
      { id: 'li_feed',  label: 'Feed Image',  ratio: '1.91:1', w: 1200, h: 628,  css: 'aspect-[191/100]' },
      { id: 'li_sq',    label: 'Square Post', ratio: '1:1',    w: 1080, h: 1080, css: 'aspect-square'     },
      { id: 'li_port',  label: 'Portrait',    ratio: '4:5',    w: 1080, h: 1350, css: 'aspect-[4/5]'      },
    ],
    headerBg: '#fff',
    textColor: '#000',
  },
  youtube: {
    name: 'YouTube', color: '#FF0000', bg: '#0f0f0f',
    icon: '/icons/youtube-color-icon.svg',
    formats: [
      { id: 'yt_thumb', label: 'Thumbnail',   ratio: '16:9', w: 1280, h: 720,  css: 'aspect-video'  },
      { id: 'yt_short', label: 'Shorts',      ratio: '9:16', w: 1080, h: 1920, css: 'aspect-[9/16]', full: true },
    ],
    headerBg: '#0f0f0f',
    textColor: '#fff',
  },
  facebook: {
    name: 'Facebook', color: '#1877F2', bg: '#fff',
    icon: '/icons/facebook-round-color-icon.svg',
    formats: [
      { id: 'fb_feed',  label: 'Feed Post',   ratio: '1.91:1', w: 1200, h: 628,  css: 'aspect-[191/100]' },
      { id: 'fb_sq',    label: 'Square',      ratio: '1:1',    w: 1080, h: 1080, css: 'aspect-square'     },
      { id: 'fb_story', label: 'Story',       ratio: '9:16',   w: 1080, h: 1920, css: 'aspect-[9/16]', full: true },
    ],
    headerBg: '#fff',
    textColor: '#000',
  },
  tiktok: {
    name: 'TikTok', color: '#000', bg: '#000',
    icon: '/icons/tiktok-circle-icon.svg',
    formats: [
      { id: 'tk_video', label: 'Video',       ratio: '9:16', w: 1080, h: 1920, css: 'aspect-[9/16]', full: true },
    ],
    headerBg: '#000',
    textColor: '#fff',
  },
  pinterest: {
    name: 'Pinterest', color: '#BD081C', bg: '#fff',
    icon: '/icons/pinterest-round-color-icon.svg',
    formats: [
      { id: 'pin_std',  label: 'Standard Pin', ratio: '2:3',   w: 1000, h: 1500, css: 'aspect-[2/3]'   },
      { id: 'pin_sq',   label: 'Square Pin',   ratio: '1:1',   w: 1000, h: 1000, css: 'aspect-square'   },
    ],
    headerBg: '#fff',
    textColor: '#000',
  },
  threads: {
    name: 'Threads', color: '#000', bg: '#fff',
    icon: '/icons/threads-icon.svg',
    formats: [
      { id: 'th_feed',  label: 'Feed Post',   ratio: '1:1',  w: 1080, h: 1080, css: 'aspect-square'  },
      { id: 'th_port',  label: 'Portrait',    ratio: '4:5',  w: 1080, h: 1350, css: 'aspect-[4/5]'   },
    ],
    headerBg: '#fff',
    textColor: '#000',
  }
};

/* ── UI Components for each Platform ────────────────────────────────── */

const InstagramOverlay = ({ format, caption, children, isFull }) => {
  if (isFull) {
    const isReel = format.id === 'ig_reel';
    return (
      <div className="absolute inset-0 flex flex-col pointer-events-none text-white">
        <div className="absolute inset-0 z-[-1] bg-black">{children}</div>

        {/* Story/Reel Top Bar */}
        <div className="p-3 flex gap-1 mt-2">
          <div className="h-0.5 flex-1 bg-white/40 rounded-full overflow-hidden">
            <div className="h-full bg-white w-1/3" />
          </div>
        </div>
        <div className="px-3 flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gray-300 border border-white/20" />
            <span className="text-[10px] font-bold">Your Story</span>
            <span className="text-[10px] opacity-60">1h</span>
          </div>
          <MoreHorizontal className="w-4 h-4" />
        </div>

        {/* Reels Sidebar */}
        {isReel && (
          <div className="absolute right-2 bottom-20 flex flex-col gap-4 items-center">
            <div className="flex flex-col items-center gap-0.5">
              <Heart className="w-5 h-5" />
              <span className="text-[9px]">Likes</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <MessageCircle className="w-5 h-5" />
              <span className="text-[9px]">12</span>
            </div>
            <Send className="w-5 h-5" />
            <MoreVertical className="w-4 h-4" />
          </div>
        )}

        {/* Story/Reel Bottom Bar */}
        <div className="mt-auto p-3 flex items-center gap-3 bg-gradient-to-t from-black/40 to-transparent">
          <div className="flex-1">
            {isReel && (
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-gray-300 border border-white/20" />
                <span className="text-[9px] font-bold">username</span>
              </div>
            )}
            <div className="h-8 rounded-full border border-white/40 px-3 flex items-center text-[10px] backdrop-blur-sm">
              {isReel ? 'Add comment...' : 'Send message'}
            </div>
          </div>
          <Heart className="w-5 h-5" />
          <Send className="w-5 h-5" />
        </div>
      </div>
    );
  }

  // Feed Post (Fluid)
  return (
    <div className="flex flex-col bg-white pointer-events-none">
      <div className="p-3 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-purple-600 p-[1.5px]">
            <div className="w-full h-full rounded-full bg-white p-[1.5px]">
              <div className="w-full h-full rounded-full bg-gray-200" />
            </div>
          </div>
          <span className="text-[11px] font-bold text-black">username</span>
        </div>
        <MoreHorizontal className="w-4 h-4 text-black" />
      </div>

      <div className={`relative overflow-hidden bg-gray-50 ${format.css} w-full`}>
        {children}
      </div>

      <div className="p-3 flex flex-col border-t border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Heart className="w-5 h-5 text-black" />
            <MessageCircle className="w-5 h-5 text-black" />
            <Send className="w-5 h-5 text-black" />
          </div>
          <Bookmark className="w-5 h-5 text-black" />
        </div>
        <div className="text-[11px] font-bold text-black mb-1">1,234 likes</div>
        <p className="text-[11px] text-black line-clamp-2"><span className="font-bold mr-1">username</span>{caption}</p>
      </div>
    </div>
  );
};

const YouTubeOverlay = ({ format, caption, children, isFull }) => {
  if (isFull) {
    return (
      <div className="absolute inset-0 flex flex-col pointer-events-none text-white p-3 justify-end bg-gradient-to-t from-black/60 to-transparent">
        <div className="absolute inset-0 z-[-1] bg-black">{children}</div>
        <div className="flex justify-between items-end gap-2">
          <div className="flex-1 pr-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-gray-400" />
              <span className="text-[10px] font-bold">@channelname</span>
              <button className="bg-white text-black px-2.5 py-1 rounded-full text-[9px] font-bold">Subscribe</button>
            </div>
            <p className="text-[11px] font-medium line-clamp-2 mb-2">{caption}</p>
          </div>
          <div className="flex flex-col gap-4 items-center mb-1">
            <div className="flex flex-col items-center gap-0.5">
              <div className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center">
                <ThumbsUp className="w-4 h-4" />
              </div>
              <span className="text-[9px]">Like</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <div className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center">
                <ThumbsDown className="w-4 h-4" />
              </div>
              <span className="text-[9px]">Dislike</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <div className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center">
                <MessageSquare className="w-4 h-4" />
              </div>
              <span className="text-[9px]">123</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <div className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center">
                <Share2 className="w-4 h-4" />
              </div>
              <span className="text-[9px]">Share</span>
            </div>
            <div className="w-8 h-8 rounded bg-gray-500 border border-white/20 mt-1" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-[#0f0f0f] pointer-events-none">
       <div className={`relative overflow-hidden ${format.css} w-full`}>
         {children}
       </div>
       <div className="p-3 text-white">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-[13px] font-bold leading-tight line-clamp-2 mb-1">{caption || 'Video Title'}</p>
              <p className="text-[11px] text-gray-400">Channel Name • 12K views • 2 hours ago</p>
            </div>
            <MoreVertical className="w-4 h-4 text-gray-400" />
          </div>
       </div>
    </div>
  );
};

const LinkedInOverlay = ({ format, caption, children, isFull }) => {
  return (
    <div className="flex flex-col bg-white pointer-events-none">
      <div className="p-3 flex items-center gap-2 border-b border-gray-100">
        <div className="w-10 h-10 rounded-sm bg-gray-200" />
        <div className="flex-1">
          <p className="text-[11px] font-bold text-black">Your Name</p>
          <p className="text-[9px] text-gray-500">Professional Headline</p>
          <p className="text-[9px] text-gray-400">1h • 🌐</p>
        </div>
        <MoreHorizontal className="w-4 h-4 text-gray-400" />
      </div>
      <div className="p-3">
        <p className="text-[11px] text-black line-clamp-3 leading-relaxed mb-2">{caption}</p>
      </div>
      <div className={`relative overflow-hidden bg-gray-50 ${format.css} w-full`}>
        {children}
      </div>
      <div className="p-3 border-t border-gray-100 flex items-center justify-between bg-white">
        <div className="flex flex-col items-center gap-1">
          <ThumbsUp className="w-4 h-4 text-gray-600" />
          <span className="text-[9px] text-gray-500">Like</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <MessageCircle className="w-4 h-4 text-gray-600" />
          <span className="text-[9px] text-gray-500">Comment</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Repeat className="w-4 h-4 text-gray-600" />
          <span className="text-[9px] text-gray-500">Repost</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Send className="w-4 h-4 text-gray-600" />
          <span className="text-[9px] text-gray-500">Send</span>
        </div>
      </div>
    </div>
  );
};

const XOverlay = ({ format, caption, children, isFull }) => {
  return (
    <div className="flex flex-col bg-black text-white p-3 pointer-events-none">
      <div className="flex gap-3 mb-2">
        <div className="w-10 h-10 rounded-full bg-gray-700" />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-bold">Your Name</span>
              <span className="text-[11px] text-gray-500">@handle • 1h</span>
            </div>
            <MoreHorizontal className="w-4 h-4 text-gray-500" />
          </div>
          <p className="text-[12px] leading-normal mb-2">{caption}</p>
        </div>
      </div>
      <div className={`relative overflow-hidden rounded-xl border border-gray-800 ${format.css} w-full mb-2`}>
        {children}
      </div>
      <div className="py-2 border-t border-gray-800 flex items-center justify-around">
        <MessageSquare className="w-4 h-4 text-gray-500" />
        <Repeat className="w-4 h-4 text-gray-500" />
        <Heart className="w-4 h-4 text-gray-500" />
        <Share2 className="w-4 h-4 text-gray-500" />
      </div>
    </div>
  );
};

const TikTokOverlay = ({ format, caption, children, isFull }) => {
  return (
    <div className="absolute inset-0 flex flex-col pointer-events-none text-white p-3 justify-end bg-gradient-to-t from-black/40 to-transparent">
      <div className="absolute inset-0 z-[-1] bg-black">{children}</div>
      <div className="flex justify-between items-end gap-2">
        <div className="flex-1 pr-2">
          <p className="text-[11px] font-bold mb-1">@username</p>
          <p className="text-[10px] line-clamp-2 mb-3">{caption}</p>
          <div className="flex items-center gap-2">
            <Music2 className="w-3 h-3" />
            <span className="text-[9px]">Original sound - username</span>
          </div>
        </div>
        <div className="flex flex-col gap-3 items-center mb-1">
          <div className="relative mb-2">
            <div className="w-9 h-9 rounded-full bg-gray-500 border-2 border-white" />
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-[#FE2C55] rounded-full p-0.5">
              <Plus className="w-2.5 h-2.5" />
            </div>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <Heart className="w-6 h-6 fill-white/10" />
            <span className="text-[9px] font-bold">123K</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <MessageCircle className="w-6 h-6 fill-white/10" />
            <span className="text-[9px] font-bold">1234</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <Bookmark className="w-6 h-6 fill-white/10" />
            <span className="text-[9px] font-bold">567</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <Share2 className="w-6 h-6 fill-white/10" />
            <span className="text-[9px] font-bold">89</span>
          </div>
          <div className="w-8 h-8 rounded-full border-4 border-gray-800 bg-gray-600 mt-1 animate-spin-slow" />
        </div>
      </div>
    </div>
  );
};

const FacebookOverlay = ({ format, caption, children, isFull }) => {
  if (isFull) {
    return (
      <div className="absolute inset-0 flex flex-col pointer-events-none text-white">
        <div className="absolute inset-0 z-[-1] bg-black">{children}</div>
        <div className="p-3 flex gap-1 mt-2">
          <div className="h-0.5 flex-1 bg-white/40 rounded-full overflow-hidden">
            <div className="h-full bg-white w-1/3" />
          </div>
        </div>
        <div className="px-3 flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gray-300 border border-white/20" />
            <span className="text-[10px] font-bold">Your Story</span>
          </div>
          <div className="flex gap-4">
             <MoreHorizontal className="w-4 h-4" />
             <X className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-auto p-4 flex items-center gap-3 bg-gradient-to-t from-black/40 to-transparent">
          <div className="flex-1 h-9 rounded-full bg-white/20 backdrop-blur-md px-4 flex items-center text-[11px] border border-white/20">
            Reply...
          </div>
          <Heart className="w-5 h-5" />
          <ThumbsUp className="w-5 h-5" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-white pointer-events-none">
      <div className="p-3 flex items-center gap-2">
        <div className="w-10 h-10 rounded-full bg-gray-200" />
        <div className="flex-1">
          <p className="text-[12px] font-bold text-black leading-tight">Your Page Name</p>
          <p className="text-[10px] text-gray-500 font-medium">1h • 🌎</p>
        </div>
        <MoreHorizontal className="w-4 h-4 text-gray-500" />
      </div>
      <div className="px-3 pb-3">
        <p className="text-[12px] text-gray-900 line-clamp-3 leading-relaxed">{caption}</p>
      </div>
      <div className={`relative overflow-hidden bg-gray-100 ${format.css} w-full`}>
        {children}
      </div>
      <div className="border-t border-gray-100 flex items-center justify-between px-6 py-2 bg-white">
        <div className="flex items-center gap-2 text-gray-600">
          <ThumbsUp className="w-4 h-4" />
          <span className="text-[11px] font-bold">Like</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <MessageCircle className="w-4 h-4" />
          <span className="text-[11px] font-bold">Comment</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Share2 className="w-4 h-4" />
          <span className="text-[11px] font-bold">Share</span>
        </div>
      </div>
    </div>
  );
};

const ThreadsOverlay = ({ format, caption, children, isFull }) => {
  return (
    <div className="flex flex-col bg-white p-4 pointer-events-none">
      <div className="flex gap-3">
        <div className="flex flex-col items-center gap-2">
           <div className="w-9 h-9 rounded-full bg-gray-200 flex-shrink-0" />
           <div className="w-0.5 flex-1 bg-gray-100 rounded-full" />
           <div className="w-4 h-4 rounded-full bg-gray-100" />
        </div>
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[13px] font-bold text-black">yourhandle</span>
            <div className="flex items-center gap-2 text-gray-400">
              <span className="text-[12px]">1h</span>
              <MoreHorizontal className="w-4 h-4" />
            </div>
          </div>
          <p className="text-[13px] text-gray-900 leading-normal mb-3">{caption}</p>

          <div className={`relative overflow-hidden rounded-xl border border-gray-100 ${format.css} w-full mb-4`}>
            {children}
          </div>

          <div className="flex items-center gap-4 text-gray-900">
            <Heart className="w-5 h-5" />
            <MessageCircle className="w-5 h-5" />
            <Repeat className="w-5 h-5" />
            <Send className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  );
};

const PinterestOverlay = ({ format, caption, children, isFull }) => {
  return (
    <div className="flex flex-col bg-white pointer-events-none">
       <div className="p-3 flex items-center justify-between">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
             <ChevronLeft className="w-5 h-5 text-gray-900" />
          </div>
          <div className="bg-[#E60023] text-white px-4 py-2 rounded-full text-xs font-bold">Save</div>
       </div>
       <div className={`relative overflow-hidden ${format.css} w-full`}>
         {children}
       </div>
       <div className="p-4 bg-white rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          <h3 className="text-sm font-bold text-gray-900 mb-2 line-clamp-1">{caption || 'Pin Title'}</h3>
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-200" />
                <span className="text-[11px] font-bold">Username</span>
             </div>
             <button className="bg-gray-100 text-black px-3 py-1.5 rounded-full text-[11px] font-bold">Follow</button>
          </div>
       </div>
    </div>
  );
};

/* ── Preview Container (Refactored) ────────────────────────────────── */
function PreviewContainer({ children, config, format, caption }) {
  const isVertical = format.ratio.includes('9:16') || format.ratio === '2:3' || format.ratio === '1:2.1' || format.ratio === '4:5';
  const isFull = format.full === true;

  const getOverlay = () => {
    const name = config.name.toLowerCase();
    const props = { format, caption, children, isFull };
    if (name === 'instagram') return <InstagramOverlay {...props} />;
    if (name === 'youtube') return <YouTubeOverlay {...props} />;
    if (name === 'linkedin') return <LinkedInOverlay {...props} />;
    if (name === 'x (twitter)') return <XOverlay {...props} />;
    if (name === 'tiktok') return <TikTokOverlay {...props} />;
    if (name === 'facebook') return <FacebookOverlay {...props} />;
    if (name === 'threads') return <ThreadsOverlay {...props} />;
    if (name === 'pinterest') return <PinterestOverlay {...props} />;
    return children;
  };

  return (
    <div className="flex flex-col items-center">
      {/* Container */}
      <div
        className={`relative rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-gray-100 bg-white transition-all duration-500 ${
          isVertical ? 'w-[280px]' : 'w-[360px]'
        } ${isFull ? format.css : 'h-auto'}`}
      >
        {/* If it's a full screen post (Story/Reel), we use absolute positioning */}
        {isFull ? (
          <div className="absolute inset-0 z-10">
            {getOverlay()}
          </div>
        ) : (
          /* For feed posts, we let the overlay handle the layout naturally */
          <div className="relative z-10">
            {getOverlay()}
          </div>
        )}
      </div>

      {/* Dimension label */}
      <div className="mt-6 text-center bg-gray-50 px-5 py-2.5 rounded-2xl border border-gray-100">
        <div className="text-[13px] font-bold text-gray-800">{format.label}</div>
        <div className="flex items-center justify-center gap-3 mt-1">
          <span className="text-[11px] text-gray-500 font-mono bg-white px-2 py-0.5 rounded-md border border-gray-100 shadow-sm">{format.w} × {format.h}px</span>
          <span className="text-[11px] text-gray-400 font-bold uppercase tracking-tight">Ratio {format.ratio}</span>
        </div>
      </div>
    </div>
  );
}
/* ── Main Modal ──────────────────────────────────────────────────────── */
export default function PostPreviewModal({ post, onClose }) {
  const [activePlatformIdx, setActivePlatformIdx] = useState(0);
  const [activeFormatIdx, setActiveFormatIdx] = useState(0);

  useEffect(() => {
    if (!post) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, post]);

  if (!post) return null;

  const postedPlatforms = Object.entries(PLATFORM_CONFIG)
    .map(([id, cfg]) => ({
      id,
      ...cfg,
      success: post[`${id}_success`],
      error:   post[`${id}_error`],
      url:     post[`${id}_url`] || post[`${id}_shorts_url`],
    }))
    .filter(p => p.success || (p.error && p.error !== 'Not selected'));

  const activePlatform = postedPlatforms[activePlatformIdx];
  const activeFormat   = activePlatform?.formats?.[activeFormatIdx] || activePlatform?.formats?.[0];

  const handlePlatformChange = (idx) => { setActivePlatformIdx(idx); setActiveFormatIdx(0); };
  const handleBackdrop = (e) => { if (e.target === e.currentTarget) onClose(); };

  const isImage = post.media_type === 'image' || /\.(jpg|jpeg|png|gif|webp)$/i.test(post.video_filename || '');
  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)' }}
      onClick={handleBackdrop}
    >
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-300">

        {/* ── Modal Header ── */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Play className="w-5 h-5 text-blue-600 fill-blue-600" />
             </div>
             <div>
              <h2 className="text-lg font-bold text-gray-900 leading-tight">{post.caption?.split('\n')[0] || 'Post Preview'}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-gray-400 font-medium">{formatDate(post.posted_at)}</span>
                <span className="w-1 h-1 rounded-full bg-gray-300" />
                <span className="text-[10px] font-bold text-blue-500 uppercase tracking-tight">{post.media_type}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 hover:bg-gray-100 rounded-full transition-all group">
            <X className="w-5 h-5 text-gray-400 group-hover:text-gray-900 group-hover:rotate-90 transition-all duration-300" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">

          {/* ── Left: Platform list ── */}
          <div className="w-64 border-r border-gray-100 overflow-y-auto flex-shrink-0 bg-gray-50/30">
            <div className="p-5">
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.1em] mb-4">Platforms</p>
              <div className="space-y-2">
                {postedPlatforms.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No platforms data available</p>
                ) : (
                  postedPlatforms.map((p, i) => (
                    <button
                      key={p.id}
                      onClick={() => handlePlatformChange(i)}
                      className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all duration-200 ${
                        i === activePlatformIdx
                        ? 'bg-white shadow-lg shadow-gray-200/50 border border-gray-100 scale-[1.02]'
                        : 'hover:bg-gray-100/50'
                      }`}
                    >
                      <div className="relative flex-shrink-0">
                        <img src={p.icon} alt={p.name} className="w-8 h-8 object-contain" />
                        <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-[2.5px] border-white shadow-sm ${p.success ? 'bg-green-500' : 'bg-red-500'}`} />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className={`text-[13px] font-bold ${i === activePlatformIdx ? 'text-gray-900' : 'text-gray-600'}`}>{p.name}</p>
                        <p className={`text-[10px] font-bold uppercase tracking-wider ${p.success ? 'text-green-600' : 'text-red-500'}`}>
                          {p.success ? 'Success' : 'Failed'}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* ── Right: Preview + formats ── */}
          <div className="flex-1 overflow-y-auto bg-white">
            {!activePlatform ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-300 p-10 text-center">
                <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                  <Play className="w-8 h-8 opacity-20" />
                </div>
                <p className="text-sm font-medium">Select a platform to preview your post</p>
              </div>
            ) : (
              <div className="p-8">
                {/* Format selection */}
                {activePlatform.formats.length > 1 && (
                  <div className="mb-10">
                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.1em] mb-4">Preview Format</p>
                    <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
                      {activePlatform.formats.map((fmt, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveFormatIdx(i)}
                          className={`flex-shrink-0 px-5 py-3 rounded-2xl text-[13px] font-bold border-2 transition-all duration-200 ${
                            i === activeFormatIdx
                              ? 'bg-gray-900 text-white border-gray-900 shadow-xl shadow-gray-200 scale-105'
                              : 'bg-white text-gray-600 border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex flex-col items-start gap-0.5">
                            <span>{fmt.label}</span>
                            <span className={`text-[10px] opacity-50 ${i === activeFormatIdx ? 'text-white' : ''}`}>{fmt.ratio}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Phone preview area */}
                <div className="flex flex-col lg:flex-row gap-10 items-start justify-center">

                  <div className="flex-shrink-0">
                    <PreviewContainer
                      config={activePlatform}
                      format={activeFormat}
                      caption={post.caption}
                    >
                      {(() => {
                        const isImage = post.media_type === 'image' || /\.(jpg|jpeg|png|gif|webp)$/i.test(post.video_filename || '');
                        const displayUrl = post.thumbnail_url || post.media_url;

                        if (displayUrl) {
                          // If it's a video and we have a media_url but it's the video itself, 
                          // the img tag might fail unless it's the thumbnail_url.
                          // Cloudinary thumbnail_url is always an image.
                          return (
                            <img
                              src={displayUrl}
                              alt="Post Preview"
                              className="w-full h-full object-cover"
                              onError={e => { 
                                if (!isImage && post.media_url && e.target.src !== post.media_url) {
                                  e.target.src = post.media_url;
                                } else {
                                  e.target.src = 'https://placehold.co/600x600?text=Preview+Unavailable';
                                }
                              }}
                            />
                          );
                        }

                        return (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 text-gray-600">
                            {post.media_type === 'video' ? (
                              <Video className="w-10 h-10 mb-2 opacity-20" />
                            ) : (
                              <Play className="w-10 h-10 mb-2 opacity-20" />
                            )}
                            <span className="text-[10px] font-bold uppercase tracking-widest">
                              {post.media_type === 'video' ? 'Video Preview' : 'Media Preview'}
                            </span>
                          </div>
                        );
                      })()}
                    </PreviewContainer>
                  </div>

                  {/* Status and Actions Card */}
                  <div className="flex-1 w-full max-w-md space-y-6">
                    <div className={`p-6 rounded-[1.5rem] border-2 transition-all ${
                      activePlatform.success
                      ? 'bg-green-50/30 border-green-100'
                      : 'bg-red-50/30 border-red-100'
                    }`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            activePlatform.success ? 'bg-green-100' : 'bg-red-100'
                          }`}>
                            {activePlatform.success ? (
                              <CheckCircle2 className="w-5 h-5 text-green-600" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-600" />
                            )}
                          </div>
                          <div>
                            <h3 className={`text-sm font-bold ${activePlatform.success ? 'text-green-900' : 'text-red-900'}`}>
                              {activePlatform.success ? 'Post Published' : 'Publication Failed'}
                            </h3>
                            <p className={`text-[11px] font-medium ${activePlatform.success ? 'text-green-600' : 'text-red-600'}`}>
                              {activePlatform.name}
                            </p>
                          </div>
                        </div>
                        {activePlatform.url && (
                          <a
                            href={activePlatform.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white border border-gray-200 px-4 py-2 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm"
                          >
                            Live Post <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>

                      {!activePlatform.success && activePlatform.error && (
                        <div className="mt-4 p-4 rounded-xl bg-white/80 border border-red-100">
                          <p className="text-[11px] font-black text-red-400 uppercase tracking-widest mb-1">Error Detail</p>
                          <p className="text-xs text-red-600 font-medium">{activePlatform.error}</p>
                        </div>
                      )}
                    </div>

                    {post.caption && (
                      <div className="bg-gray-50 rounded-[1.5rem] p-6 border border-gray-100">
                        <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.1em] mb-3">Post Content</p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed max-h-[200px] overflow-y-auto">
                          {post.caption}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                       <div className="bg-white rounded-2xl p-4 border border-gray-100 flex flex-col gap-1">
                          <span className="text-[10px] font-black text-gray-400 uppercase">Aspect Ratio</span>
                          <span className="text-sm font-bold text-gray-800">{activeFormat?.ratio}</span>
                       </div>
                       <div className="bg-white rounded-2xl p-4 border border-gray-100 flex flex-col gap-1">
                          <span className="text-[10px] font-black text-gray-400 uppercase">Resolution</span>
                          <span className="text-sm font-bold text-gray-800">{activeFormat?.w}×{activeFormat?.h}px</span>
                       </div>
                    </div>
                  </div>

                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
