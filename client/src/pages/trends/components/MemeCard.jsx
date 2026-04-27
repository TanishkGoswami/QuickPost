/**
 * MemeCard.jsx — Standalone Reddit/Meme card
 * ────────────────────────────────────────────────────────────────
 * Used by TrendGrid and the new AllTrendsPage's SavedPanel.
 * Dark "ink" background — contrasts with white NewsCards.
 *
 * Replace: client/src/pages/trends/components/MemeCard.jsx
 * ────────────────────────────────────────────────────────────────
 */

import React, { memo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  ArrowUpCircle, Share2, Bookmark, BookmarkCheck,
  ExternalLink, Flame, Play, Sparkles,
} from "lucide-react";

// Lazy image with shimmer
const LazyImage = memo(function LazyImage({ src, alt = "", style = {} }) {
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState(false);
  const fb = `https://placehold.co/600x380/1e1d1c/3a3836?text=Trend`;
  return (
    <div style={{ position: "relative", overflow: "hidden", background: "rgba(255,255,255,0.04)", ...style }}>
      {!ok && <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.09) 50%,rgba(255,255,255,0.04) 75%)", backgroundSize: "400% 100%", animation: "shimmer 1.5s ease-in-out infinite" }} />}
      <img src={err ? fb : src} alt={alt} loading="lazy" decoding="async"
        onLoad={() => setOk(true)} onError={() => { setErr(true); setOk(true); }}
        style={{ width: "100%", height: "auto", display: "block", opacity: ok ? 1 : 0, transform: ok ? "scale(1)" : "scale(1.05)", transition: "opacity 0.4s ease, transform 0.5s ease" }} />
      <style>{`@keyframes shimmer{0%{background-position:100% 50%}100%{background-position:-100% 50%}}`}</style>
    </div>
  );
});

function fmtUp(n) { return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : (n ? String(n) : "1.2k"); }

async function doShare(title, url) {
  if (navigator.share) { try { await navigator.share({ title, url: url || location.href }); return true; } catch {} }
  try { await navigator.clipboard.writeText(url || location.href); return "copied"; } catch {}
  return false;
}

const MemeCard = memo(function MemeCard({ meme, index, onUseIdea, saved = false, onToggleSave }) {
  const { image, videoUrl, isVideo, title, upvotes, subreddit, url } = meme;
  const [shareMsg, setShareMsg] = useState(null);

  const handleShare = useCallback(async () => {
    const r = await doShare(title, url);
    setShareMsg(r === "copied" ? "Copied!" : r ? "Shared!" : null);
    if (r) setTimeout(() => setShareMsg(null), 2200);
  }, [title, url]);

  const handleUse = useCallback(() => {
    onUseIdea?.({
      caption: `${title || "Trending right now 🔥"}\n\n#memes #viral #trending`,
      hashtags: ["#memes", "#viral", "#trending", `#${subreddit || "memes"}`],
      topic: subreddit || "Trending",
      images: isVideo ? [] : (image ? [image] : []),
      memes: isVideo ? [] : (image ? [image] : []),
      videoUrls: isVideo && videoUrl ? [videoUrl] : [],
      source: meme,
    });
  }, [meme, title, subreddit, image, isVideo, videoUrl, onUseIdea]);

  const id = url || title || String(index);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.035, 0.3), ease: [0.23, 1, 0.32, 1] }}
      style={{
        background: "#141413", borderRadius: 20, overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.055)",
        boxShadow: "0 2px 14px rgba(20,20,19,0.18)",
        display: "flex", flexDirection: "column", marginBottom: 20,
        transition: "box-shadow 0.28s, transform 0.28s",
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 20px 52px rgba(20,20,19,0.32)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 14px rgba(20,20,19,0.18)"; }}
    >
      {/* Media */}
      {(image || (isVideo && videoUrl)) && (
        <div style={{ position: "relative" }}>
          {isVideo && videoUrl
            ? <video src={videoUrl} poster={image} autoPlay muted loop playsInline style={{ width: "100%", display: "block", maxHeight: 320, objectFit: "cover" }} />
            : <LazyImage src={image} alt={title || "Trending"} style={{ height: "auto", minHeight: 140, width: "100%" }} />
          }
          <div style={{ position: "absolute", top: 10, left: 10 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", background: "rgba(20,20,19,0.72)", backdropFilter: "blur(8px)", borderRadius: 99, fontSize: 9, fontWeight: 900, color: "#f37338", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {isVideo ? <Play size={8} fill="#f37338" /> : <Flame size={8} />}
              {isVideo ? "VIDEO" : "MEME"}
            </span>
          </div>
          <div style={{ position: "absolute", top: 10, right: 10 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 9px", background: "rgba(20,20,19,0.72)", backdropFilter: "blur(8px)", borderRadius: 99, fontSize: 10, color: "#f37338", fontWeight: 800 }}>
              <ArrowUpCircle size={11} />{fmtUp(upvotes)}
            </span>
          </div>
        </div>
      )}

      {/* Body */}
      <div style={{ padding: "16px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
          <span style={{ padding: "2px 9px", background: "rgba(243,115,56,0.18)", border: "1px solid rgba(243,115,56,0.22)", borderRadius: 99, fontSize: 9, fontWeight: 800, color: "#f37338" }}>
            r/{subreddit || "trending"}
          </span>
          {!image && !isVideo && (
            <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#f37338", fontWeight: 800 }}>
              <ArrowUpCircle size={11} />{fmtUp(upvotes)}
            </span>
          )}
        </div>

        <h3 style={{ fontSize: 14, fontWeight: 640, color: "rgba(242,240,237,0.9)", margin: "0 0 14px", lineHeight: 1.4, letterSpacing: "-0.012em", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {title || "Check this out 🔥"}
        </h3>

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }} onClick={handleUse}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 0", background: "#f37338", border: "none", borderRadius: 10, color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 14px rgba(243,115,56,0.3)" }}>
            <Sparkles size={12} />Use This
          </motion.button>

          <button onClick={e => { e.stopPropagation(); onToggleSave?.(id); }}
            aria-label={saved ? "Remove bookmark" : "Save"}
            style={{ width: 35, height: 35, display: "flex", alignItems: "center", justifyContent: "center", background: saved ? "rgba(243,115,56,0.2)" : "rgba(255,255,255,0.07)", border: `1px solid ${saved ? "rgba(243,115,56,0.3)" : "rgba(255,255,255,0.1)"}`, borderRadius: 10, color: saved ? "#f37338" : "rgba(242,240,237,0.45)", cursor: "pointer", transition: "all 0.14s" }}>
            {saved ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
          </button>

          <button onClick={e => { e.stopPropagation(); handleShare(); }}
            aria-label="Share"
            style={{ width: 35, height: 35, display: "flex", alignItems: "center", justifyContent: "center", background: shareMsg ? "rgba(5,150,105,0.2)" : "rgba(255,255,255,0.07)", border: `1px solid ${shareMsg ? "rgba(5,150,105,0.3)" : "rgba(255,255,255,0.1)"}`, borderRadius: 10, color: shareMsg ? "#059669" : "rgba(242,240,237,0.45)", cursor: "pointer", transition: "all 0.14s" }}>
            <Share2 size={13} />
          </button>

          {url && (
            <a href={url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} aria-label="View on Reddit"
              style={{ width: 35, height: 35, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "rgba(242,240,237,0.42)", transition: "all 0.14s" }}
              onMouseEnter={e => { e.currentTarget.style.color = "rgba(242,240,237,0.88)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "rgba(242,240,237,0.42)"; }}>
              <ExternalLink size={11} />
            </a>
          )}
        </div>
      </div>
    </motion.article>
  );
});

export { LazyImage };
export default MemeCard;
