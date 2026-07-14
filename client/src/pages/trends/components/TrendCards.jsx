import React, { useState, memo } from "react";
import { motion } from "framer-motion";
import { 
  Sparkles, Bookmark, BookmarkCheck, Share2, 
  ExternalLink, Play, Youtube 
} from "lucide-react";
import { 
  detectNiche, hashScore, genIdeas, timeAgo, doShare, fmtUpvotes,
  Img, NicheBadge, Score, IdeasDrawer, Btn
} from "./TrendUI";

// ─── NEWS CARD ──────────────────────────────────────────────────
export const NewsCard = memo(function NewsCard({ item, idx, onUse, saved, onSave }) {
  const [shareLabel, setShareLabel] = useState(null);
  const niche = detectNiche(item.title);
  const score = hashScore(`${item.title}${item.source}`, 76, 99);
  const ideas = genIdeas(item.title, niche.id);
  const tags = [`#${niche.id.replace(/\s/g, "")}`, "#trending", `#${(item.source || "").toLowerCase().replace(/[^a-z0-9]/g, "")}`].filter(Boolean);
  const id = item.url || item.title;

  const handleShare = async () => {
    const r = await doShare(item.title, item.url);
    setShareLabel(r === "copied" ? "Copied!" : r === "shared" ? "Shared!" : null);
    if (r) setTimeout(() => setShareLabel(null), 2200);
  };

  const handleUse = (idea) => onUse({ caption: `${idea}\n\n${tags.join(" ")}`, hashtags: tags, topic: niche.id, images: item.image ? [item.image] : [], memes: [], source: item });

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(idx * 0.03, 0.28), ease: [0.23, 1, 0.32, 1] }}
      className="bg-white rounded-[1.25rem] overflow-hidden mb-6 border border-zinc-200/70 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_32px_-12px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col group"
    >
      {/* Hero image */}
      {item.image && (
        <div className="relative border-b border-zinc-100">
          <Img src={item.image} alt={item.title} />
          <div className="absolute top-3 left-3"><NicheBadge niche={niche} /></div>
          <div className="absolute top-3 right-3"><Score n={score} /></div>
        </div>
      )}

      <div className="p-5">
        {/* Meta row */}
        <div className="flex items-center gap-2 mb-3">
          {!item.image && <NicheBadge niche={niche} />}
          <span className="ml-auto text-[11px] text-zinc-500 font-medium whitespace-nowrap tracking-wide">
            {item.source} <span className="opacity-50 mx-0.5">•</span> {timeAgo(item.publishedAt)}
          </span>
          {!item.image && <Score n={score} />}
        </div>

        {/* Title */}
        <h3 className="text-base font-semibold text-zinc-900 mb-2 leading-[1.35] tracking-tight line-clamp-3">
          {item.title}
        </h3>

        {/* Ideas */}
        <IdeasDrawer ideas={ideas} hashtags={tags} onUse={handleUse} />

        {/* Divider */}
        <div className="h-px bg-zinc-100 my-4" />

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Btn icon={<Sparkles className="w-3.5 h-3.5" />} label="Use Idea" onClick={() => handleUse(ideas[0])} active />
          
          <div className="flex items-center gap-1.5 ml-auto">
            <button onClick={() => onSave(id)}
              className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors border
                ${saved ? 'bg-zinc-100 border-zinc-200 text-zinc-900' : 'bg-transparent border-transparent text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 hover:border-zinc-200'}`}>
              {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            </button>
            <button onClick={handleShare}
              className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors border
                ${shareLabel ? 'bg-zinc-100 border-zinc-200 text-zinc-900' : 'bg-transparent border-transparent text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 hover:border-zinc-200'}`}>
              <Share2 className="w-4 h-4" />
            </button>
            {item.url && (
              <a href={item.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} aria-label="Read full article"
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-transparent border border-transparent text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50 hover:border-zinc-200 transition-colors">
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  );
});

// ─── MEME CARD ──────────────────────────────────────────────────
export const MemeCard = memo(function MemeCard({ item, idx, onUse, saved, onSave }) {
  const [shareLabel, setShareLabel] = useState(null);
  const { title, image, videoUrl, isVideo, upvotes, subreddit, url } = item;
  const id = url || title || String(idx);

  const handleShare = async () => {
    const r = await doShare(title, url);
    setShareLabel(r === "copied" ? "Copied!" : r === "shared" ? "Shared!" : null);
    if (r) setTimeout(() => setShareLabel(null), 2200);
  };

  const handleUse = () => onUse({
    caption: `${title || "Trending right now 🔥"}\n\n#memes #viral #trending`,
    hashtags: ["#memes", "#viral", `#${subreddit || "trending"}`],
    topic: subreddit || "Trending",
    images: isVideo ? [] : (image ? [image] : []),
    memes: isVideo ? [] : (image ? [image] : []),
    videoUrls: isVideo && videoUrl ? [videoUrl] : [],
    source: item,
  });

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(idx * 0.03, 0.28), ease: [0.23, 1, 0.32, 1] }}
      className="bg-zinc-950 rounded-[1.25rem] overflow-hidden mb-6 border border-zinc-800 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.5)] hover:shadow-[0_12px_32px_-12px_rgba(0,0,0,0.8)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col group"
    >
      {/* Media */}
      {(image || (isVideo && videoUrl)) && (
        <div className="relative border-b border-zinc-900 bg-black">
          {isVideo && videoUrl
            ? <video src={videoUrl} poster={image} autoPlay muted loop playsInline className="w-full block h-auto max-h-[500px] object-contain" />
            : <Img src={image} alt={title || "Trending"} className="!bg-black" />
          }
          {/* Badges */}
          <div className="absolute top-3 left-3">
            <span className="flex items-center gap-1.5 px-2 py-0.5 bg-zinc-900/80 backdrop-blur-md rounded-md text-[10px] font-bold text-zinc-300 tracking-wide border border-white/10 shadow-sm">
              r/{subreddit || "trending"}
            </span>
          </div>
          <div className="absolute top-3 right-3">
            <span className="flex items-center gap-1 px-2 py-0.5 bg-zinc-900/80 backdrop-blur-md rounded-md text-[10px] text-zinc-300 font-bold border border-white/10 shadow-sm">
              ▲ {fmtUpvotes(upvotes)}
            </span>
          </div>
        </div>
      )}

      <div className="p-5">
        {!image && !isVideo && (
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded-md text-[10px] font-bold text-zinc-400">
              r/{subreddit || "trending"}
            </span>
            <span className="ml-auto text-[10px] text-zinc-500 font-bold">
              ▲ {fmtUpvotes(upvotes)}
            </span>
          </div>
        )}

        {/* Title */}
        <h3 className="text-base font-medium text-zinc-100 mb-5 leading-[1.35] tracking-tight line-clamp-3">
          {title || "Check this out 🔥"}
        </h3>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleUse}
            className="flex-1 flex items-center justify-center gap-2 py-2 bg-white rounded-lg text-zinc-900 text-xs font-semibold shadow-sm transition-all hover:bg-zinc-100">
            <Sparkles className="w-3.5 h-3.5" />Use This
          </motion.button>

          {[
            { icon: saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />, action: () => onSave(id), active: saved },
            { icon: <Share2 className="w-4 h-4" />, action: handleShare, active: !!shareLabel },
          ].map((b, i) => (
            <button key={i} onClick={e => { e.stopPropagation(); b.action(); }}
              className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors border
                ${b.active ? 'bg-zinc-800 border-zinc-700 text-zinc-100' : 'bg-transparent border-transparent text-zinc-500 hover:bg-zinc-800 hover:border-zinc-700 hover:text-zinc-300'}`}>
              {b.icon}
            </button>
          ))}

          {url && (
            <a href={url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} aria-label="View on Reddit"
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-transparent border border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 hover:border-zinc-700 transition-colors">
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </motion.article>
  );
});

// ─── VIDEO CARD ─────────────────────────────────────────────
export const VideoCard = memo(function VideoCard({ item, idx, onUse, saved, onSave }) {
  const [shareLabel, setShareLabel] = useState(null);
  const id = item.url || item.id || item.title || String(idx);
  const niche = detectNiche(`${item.title} ${item.channel}`);
  const score = hashScore(`${item.title}${item.channel}`, 78, 98);
  const tags = ["#youtube", "#video", "#trending", `#${niche.id.replace(/\s/g, "")}`];

  const handleShare = async () => {
    const r = await doShare(item.title, item.url);
    setShareLabel(r === "copied" ? "Copied!" : r === "shared" ? "Shared!" : null);
    if (r) setTimeout(() => setShareLabel(null), 2200);
  };

  const handleUse = () => onUse({
    caption: `${item.title}\n\n${tags.join(" ")}`,
    hashtags: tags,
    topic: niche.id,
    images: item.thumbnail ? [item.thumbnail] : [],
    memes: [],
    videoUrls: item.url ? [item.url] : [],
    source: item,
  });

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(idx * 0.03, 0.28), ease: [0.23, 1, 0.32, 1] }}
      className="bg-white rounded-[1.25rem] overflow-hidden mb-6 border border-zinc-200/70 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_32px_-12px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col group"
    >
      <div className="relative aspect-video bg-zinc-100 overflow-hidden border-b border-zinc-100">
        {item.thumbnail
          ? <img src={item.thumbnail} alt={item.title} loading="lazy" decoding="async" className="w-full h-full object-cover block" />
          : <div className="w-full h-full bg-zinc-100" />
        }
        <div className="absolute top-3 left-3">
          <span className="flex items-center gap-1.5 px-2 py-0.5 bg-white/90 backdrop-blur-md rounded-md text-[10px] font-bold text-zinc-900 uppercase tracking-wide border border-zinc-200/60 shadow-sm">
            <Youtube className="w-3 h-3 text-red-600" /> YouTube
          </span>
        </div>
        <div className="absolute top-3 right-3"><Score n={score} /></div>
        
        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10">
          <div className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
            <Play className="w-5 h-5 text-zinc-900 ml-0.5" />
          </div>
        </div>

        {item.duration && (
          <span className="absolute right-3 bottom-3 px-1.5 py-0.5 bg-black/70 backdrop-blur-md text-white rounded text-[10px] font-semibold">
            {item.duration}
          </span>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-zinc-500 text-[11px] font-medium whitespace-nowrap overflow-hidden text-ellipsis">{item.channel || "YouTube"}</span>
          <span className="ml-auto text-zinc-400 text-[11px] font-medium">
            {item.views ? `${item.views} • ` : ""}{timeAgo(item.publishedAt)}
          </span>
        </div>
        
        <h3 className="text-base font-semibold text-zinc-900 mb-5 leading-[1.35] tracking-tight line-clamp-2">
          {item.title}
        </h3>
        
        <div className="flex items-center gap-2">
          <Btn icon={<Sparkles className="w-3.5 h-3.5" />} label="Use Idea" onClick={handleUse} active />
          
          <div className="flex items-center gap-1.5 ml-auto">
            <button onClick={() => onSave(id)}
              className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors border
                ${saved ? 'bg-zinc-100 border-zinc-200 text-zinc-900' : 'bg-transparent border-transparent text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 hover:border-zinc-200'}`}>
              {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            </button>
            <button onClick={handleShare}
              className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors border
                ${shareLabel ? 'bg-zinc-100 border-zinc-200 text-zinc-900' : 'bg-transparent border-transparent text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 hover:border-zinc-200'}`}>
              <Share2 className="w-4 h-4" />
            </button>
            {item.url && (
              <a href={item.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} aria-label="Watch on YouTube"
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-transparent border border-transparent text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50 hover:border-zinc-200 transition-colors">
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  );
});

export const Skeleton = memo(function Skeleton({ dark, imgH = 160 }) {
  return (
    <div className={`rounded-[1.25rem] overflow-hidden mb-6 border shadow-sm ${dark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-100'}`}>
      <div className={`animate-pulse ${dark ? 'bg-zinc-900' : 'bg-zinc-100'}`} style={{ height: imgH }} />
      <div className="p-5">
        {[88, 68, 50].map((w, i) => (
          <div key={i} className={`animate-pulse rounded w-full mb-3 ${dark ? 'bg-zinc-900' : 'bg-zinc-100'}`} style={{ height: i === 0 ? 14 : 10, maxWidth: `${w}%` }} />
        ))}
        <div className={`animate-pulse rounded-lg h-9 w-24 mt-4 ${dark ? 'bg-zinc-900' : 'bg-zinc-100'}`} />
      </div>
    </div>
  );
});
