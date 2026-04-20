import React, { useState, useEffect } from 'react';
import { X, ExternalLink, CheckCircle2, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';

/* ── Platform display config ─────────────────────────────────────────── */
const PLATFORM_CONFIG = {
  instagram: {
    name: 'Instagram', color: '#E4405F', bg: '#fff',
    icon: 'https://cdn.simpleicons.org/instagram/E4405F',
    formats: [
      { label: 'Square Post', ratio: '1:1',    w: 1080, h: 1080, css: 'aspect-square'     },
      { label: 'Portrait',    ratio: '4:5',    w: 1080, h: 1350, css: 'aspect-[4/5]'      },
      { label: 'Reel',        ratio: '9:16',   w: 1080, h: 1920, css: 'aspect-[9/16]'     },
      { label: 'Story',       ratio: '9:16',   w: 1080, h: 1920, css: 'aspect-[9/16]'     },
    ],
    headerBg: 'linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)',
    textColor: '#fff',
  },
  x: {
    name: 'X (Twitter)', color: '#000', bg: '#000',
    icon: null, // custom SVG below
    formats: [
      { label: 'Feed Image', ratio: '16:9', w: 1200, h: 675,  css: 'aspect-video'      },
      { label: 'Square',     ratio: '1:1',  w: 1080, h: 1080, css: 'aspect-square'     },
    ],
    headerBg: '#000',
    textColor: '#fff',
  },
  linkedin: {
    name: 'LinkedIn', color: '#0A66C2', bg: '#f3f2ef',
    icon: 'https://cdn.simpleicons.org/linkedin/0A66C2',
    formats: [
      { label: 'Feed Image',  ratio: '1.91:1', w: 1200, h: 628,  css: 'aspect-[191/100]' },
      { label: 'Square Post', ratio: '1:1',    w: 1080, h: 1080, css: 'aspect-square'     },
      { label: 'Portrait',    ratio: '4:5',    w: 1080, h: 1350, css: 'aspect-[4/5]'      },
    ],
    headerBg: '#0A66C2',
    textColor: '#fff',
  },
  youtube: {
    name: 'YouTube', color: '#FF0000', bg: '#0f0f0f',
    icon: 'https://cdn.simpleicons.org/youtube/FF0000',
    formats: [
      { label: 'Thumbnail',   ratio: '16:9', w: 1280, h: 720,  css: 'aspect-video'  },
      { label: 'Shorts',      ratio: '9:16', w: 1080, h: 1920, css: 'aspect-[9/16]' },
    ],
    headerBg: '#FF0000',
    textColor: '#fff',
  },
  facebook: {
    name: 'Facebook', color: '#1877F2', bg: '#f0f2f5',
    icon: 'https://cdn.simpleicons.org/facebook/1877F2',
    formats: [
      { label: 'Feed Post',   ratio: '1.91:1', w: 1200, h: 628,  css: 'aspect-[191/100]' },
      { label: 'Square',      ratio: '1:1',    w: 1080, h: 1080, css: 'aspect-square'     },
      { label: 'Story',       ratio: '9:16',   w: 1080, h: 1920, css: 'aspect-[9/16]'     },
    ],
    headerBg: '#1877F2',
    textColor: '#fff',
  },
  tiktok: {
    name: 'TikTok', color: '#000', bg: '#000',
    icon: 'https://cdn.simpleicons.org/tiktok/000000',
    formats: [
      { label: 'Video',       ratio: '9:16', w: 1080, h: 1920, css: 'aspect-[9/16]' },
    ],
    headerBg: '#000',
    textColor: '#fff',
  },
  pinterest: {
    name: 'Pinterest', color: '#BD081C', bg: '#fff',
    icon: 'https://cdn.simpleicons.org/pinterest/BD081C',
    formats: [
      { label: 'Standard Pin', ratio: '2:3',   w: 1000, h: 1500, css: 'aspect-[2/3]'   },
      { label: 'Square Pin',   ratio: '1:1',   w: 1000, h: 1000, css: 'aspect-square'   },
      { label: 'Long Pin',     ratio: '1:2.1', w: 600,  h: 1260, css: 'aspect-[10/21]' },
    ],
    headerBg: '#BD081C',
    textColor: '#fff',
  },
  threads: {
    name: 'Threads', color: '#000', bg: '#fff',
    icon: 'https://cdn.simpleicons.org/threads/000000',
    formats: [
      { label: 'Feed Post',   ratio: '1:1',  w: 1080, h: 1080, css: 'aspect-square'  },
      { label: 'Portrait',    ratio: '4:5',  w: 1080, h: 1350, css: 'aspect-[4/5]'   },
    ],
    headerBg: '#000',
    textColor: '#fff',
  },
  bluesky: {
    name: 'Bluesky', color: '#0085FF', bg: '#fff',
    icon: 'https://cdn.simpleicons.org/bluesky/0085FF',
    formats: [
      { label: 'Feed Image',  ratio: '16:9', w: 1200, h: 675,  css: 'aspect-video'   },
      { label: 'Square',      ratio: '1:1',  w: 1080, h: 1080, css: 'aspect-square'  },
    ],
    headerBg: '#0085FF',
    textColor: '#fff',
  },
  mastodon: {
    name: 'Mastodon', color: '#6364FF', bg: '#191b22',
    icon: 'https://cdn.simpleicons.org/mastodon/6364FF',
    formats: [
      { label: 'Feed Image',  ratio: '16:9', w: 1280, h: 720,  css: 'aspect-video'   },
      { label: 'Square',      ratio: '1:1',  w: 1080, h: 1080, css: 'aspect-square'  },
    ],
    headerBg: '#6364FF',
    textColor: '#fff',
  },
};

function XIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932 6.064-6.932zm-1.294 19.497h2.039L6.482 3.239H4.293L17.607 20.65z"/>
    </svg>
  );
}

/* ── Phone frame wrapper ─────────────────────────────────────────────── */
function PhoneFrame({ children, config, format }) {
  const isVertical = format.ratio.includes('9:16') || format.ratio === '2:3' || format.ratio === '1:2.1' || format.ratio === '4:5';

  return (
    <div className="flex flex-col items-center">
      {/* Device frame */}
      <div
        className={`relative rounded-3xl overflow-hidden shadow-2xl border-4 border-gray-800 bg-black ${
          isVertical ? 'w-48' : 'w-72'
        }`}
        style={{ background: config.bg }}
      >
        {/* Notch */}
        <div className="flex justify-center pt-2 pb-1 bg-black">
          <div className="w-16 h-3 bg-gray-800 rounded-full" />
        </div>

        {/* Platform header bar */}
        <div className="px-3 py-1.5 flex items-center gap-1.5" style={{ background: config.headerBg }}>
          {config.icon ? (
            <img src={config.icon} alt={config.name} className="w-3.5 h-3.5 object-contain brightness-200" />
          ) : (
            <XIcon className="w-3.5 h-3.5 text-white" />
          )}
          <span className="text-[9px] font-bold tracking-wide" style={{ color: config.textColor }}>{config.name}</span>
        </div>

        {/* Post image preview */}
        <div className={`w-full ${format.css} overflow-hidden bg-gray-900 relative`}>
          {children}
        </div>

        {/* Platform UI chrome */}
        <div className="px-3 py-2" style={{ background: config.bg }}>
          <div className="flex gap-2 mb-1.5">
            {['❤️','💬','🔁','📤'].map((icon, i) => (
              <span key={i} className="text-[10px]">{icon}</span>
            ))}
          </div>
          <div className="h-1.5 bg-gray-200 rounded w-3/4 mb-1" />
          <div className="h-1.5 bg-gray-200 rounded w-1/2" />
        </div>

        {/* Home indicator */}
        <div className="flex justify-center pb-2 pt-1" style={{ background: config.bg }}>
          <div className="w-10 h-1 bg-gray-400 rounded-full" />
        </div>
      </div>

      {/* Dimension label */}
      <div className="mt-3 text-center">
        <div className="text-xs font-bold text-gray-700">{format.label}</div>
        <div className="text-[10px] text-gray-400 font-mono">{format.w} × {format.h}px</div>
        <div className="text-[10px] text-gray-400">Ratio {format.ratio}</div>
      </div>
    </div>
  );
}

/* ── Main Modal ──────────────────────────────────────────────────────── */
export default function PostPreviewModal({ post, onClose }) {
  const [activePlatformIdx, setActivePlatformIdx] = useState(0);
  const [activeFormatIdx, setActiveFormatIdx] = useState(0);

  // ⚠️ useEffect MUST be before any early return (Rules of Hooks)
  useEffect(() => {
    if (!post) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, post]);

  if (!post) return null;

  // ── Derived values (after early return, safe — not hooks) ──
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
      onClick={handleBackdrop}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">

        {/* ── Modal Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900 line-clamp-1">{post.caption || 'Untitled Post'}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{formatDate(post.posted_at)}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">

          {/* ── Left: Platform list ── */}
          <div className="w-48 border-r border-gray-100 overflow-y-auto flex-shrink-0 bg-gray-50/50">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-4 pt-4 pb-2">Platforms</p>
            {postedPlatforms.length === 0 ? (
              <p className="text-xs text-gray-400 px-4">No platforms</p>
            ) : (
              postedPlatforms.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => handlePlatformChange(i)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all ${
                    i === activePlatformIdx ? 'bg-white border-r-2 border-blue-500 shadow-sm' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    {p.icon ? (
                      <img src={p.icon} alt={p.name} className="w-7 h-7 object-contain" />
                    ) : (
                      <XIcon className="w-7 h-7 text-black" />
                    )}
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${p.success ? 'bg-green-500' : 'bg-red-500'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-800 truncate">{p.name}</p>
                    <p className={`text-[10px] font-semibold ${p.success ? 'text-green-600' : 'text-red-500'}`}>
                      {p.success ? 'Posted ✓' : 'Failed ✗'}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* ── Right: Preview + formats ── */}
          <div className="flex-1 overflow-y-auto">
            {postedPlatforms.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">No platform data</div>
            ) : activePlatform ? (
              <div className="p-6">

                {/* Format tabs */}
                {activePlatform.formats.length > 1 && (
                  <div className="flex items-center gap-2 mb-6 flex-wrap">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-1">Format:</span>
                    {activePlatform.formats.map((fmt, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveFormatIdx(i)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                          i === activeFormatIdx
                            ? 'bg-gray-900 text-white border-gray-900'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                        }`}
                      >
                        {fmt.label}
                        <span className="ml-1.5 text-[10px] opacity-60">{fmt.ratio}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Phone preview */}
                <div className="flex justify-center mb-6">
                  {activeFormat && (
                    <PhoneFrame config={activePlatform} format={activeFormat}>
                      {post.media_url ? (
                        <img
                          src={post.media_url}
                          alt="Post"
                          className="w-full h-full object-cover"
                          onError={e => { e.target.src = 'https://via.placeholder.com/600?text=Preview'; }}
                        />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center ${isImage ? 'bg-blue-50' : 'bg-gray-900'}`}>
                          <span className="text-xs font-bold text-gray-400 uppercase">{isImage ? '🖼 Image' : '🎬 Video'}</span>
                        </div>
                      )}
                    </PhoneFrame>
                  )}
                </div>

                {/* Platform status + link */}
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {activePlatform.success ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span className={`text-sm font-bold ${activePlatform.success ? 'text-green-700' : 'text-red-600'}`}>
                        {activePlatform.success ? `Successfully posted to ${activePlatform.name}` : `Failed on ${activePlatform.name}`}
                      </span>
                    </div>
                    {activePlatform.url && (
                      <a
                        href={activePlatform.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-blue-600 font-bold hover:text-blue-800 transition-colors bg-blue-50 px-3 py-1.5 rounded-lg"
                      >
                        View Live Post <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  {!activePlatform.success && activePlatform.error && (
                    <p className="text-xs text-red-500 italic bg-red-50 p-2 rounded-lg">{activePlatform.error}</p>
                  )}

                  {/* Caption */}
                  {post.caption && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Caption</p>
                      <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed line-clamp-4">{post.caption}</p>
                    </div>
                  )}
                </div>

                {/* All formats reference */}
                <div className="mt-4">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">All {activePlatform.name} Formats</p>
                  <div className="grid grid-cols-3 gap-3">
                    {activePlatform.formats.map((fmt, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveFormatIdx(i)}
                        className={`p-3 rounded-xl border text-left transition-all hover:shadow-sm ${
                          i === activeFormatIdx ? 'border-gray-800 bg-gray-50' : 'border-gray-100 bg-white'
                        }`}
                      >
                        <div className="text-xs font-bold text-gray-800 mb-0.5">{fmt.label}</div>
                        <div className="text-[10px] text-gray-500 font-mono">{fmt.w}×{fmt.h}</div>
                        <div className="text-[10px] text-gray-400">Ratio {fmt.ratio}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
