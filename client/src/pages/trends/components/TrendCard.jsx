/**
 * TrendCard.jsx — News / Article trend card
 * ────────────────────────────────────────────────────────────────
 * Light white background — visual contrast with MemeCard (dark ink).
 * Features: LazyImage, niche badge, score pill, ideas drawer,
 * save / share / use actions, external link.
 *
 * Replace: client/src/pages/trends/components/TrendCard.jsx
 * ────────────────────────────────────────────────────────────────
 */

import React, { memo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame, Sparkles, Share2, Bookmark, BookmarkCheck,
  ExternalLink, ChevronDown, Lightbulb,
} from "lucide-react";

const C = { ink: "#141413", canvas: "#f2f0ed", white: "#ffffff", slate: "#6b6b68", dust: "#c4bfb8", arc: "#f37338", border: "rgba(20,20,19,0.09)" };

// ─── LAZY IMAGE ───────────────────────────────────────────────────
export const LazyImage = memo(function LazyImage({ src, alt = "", style = {} }) {
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState(false);
  const fb = `https://placehold.co/600x380/f2f0ed/c4bfb8?text=${encodeURIComponent((alt || "").substring(0, 16) || "Trend")}`;
  return (
    <div style={{ position: "relative", overflow: "hidden", background: "rgba(20,20,19,0.04)", ...style }}>
      {!ok && <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,rgba(20,20,19,0.04) 25%,rgba(20,20,19,0.09) 50%,rgba(20,20,19,0.04) 75%)", backgroundSize: "400% 100%", animation: "shimmer 1.5s ease-in-out infinite" }} />}
      <img src={err ? fb : src} alt={alt} loading="lazy" decoding="async"
        onLoad={() => setOk(true)} onError={() => { setErr(true); setOk(true); }}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", opacity: ok ? 1 : 0, transform: ok ? "scale(1)" : "scale(1.05)", transition: "opacity 0.45s ease, transform 0.5s ease" }} />
      <style>{`@keyframes shimmer{0%{background-position:100% 50%}100%{background-position:-100% 50%}}`}</style>
    </div>
  );
});

// ─── IDEAS DRAWER ────────────────────────────────────────────────
const IdeasDrawer = memo(function IdeasDrawer({ ideas, hashtags, onUse }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button onClick={e => { e.stopPropagation(); setOpen(p => !p); }}
        style={{ display: "flex", alignItems: "center", gap: 6, width: "100%", padding: "8px 0 6px", background: "none", border: "none", cursor: "pointer", color: C.slate, fontSize: 12, fontWeight: 600, fontFamily: "inherit" }}>
        <Lightbulb size={12} style={{ color: C.arc, flexShrink: 0 }} />
        {ideas.length} content ideas
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}><ChevronDown size={11} /></motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} style={{ overflow: "hidden" }}>
            <div style={{ paddingBottom: 10, display: "flex", flexDirection: "column", gap: 5 }}>
              {ideas.slice(0, 3).map((idea, i) => (
                <motion.button key={i} initial={{ x: -6, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.05 }}
                  whileHover={{ x: 3, background: `${C.arc}09`, borderColor: `${C.arc}28` }}
                  onClick={e => { e.stopPropagation(); onUse(idea); }}
                  style={{ display: "flex", alignItems: "flex-start", gap: 9, padding: "9px 11px", background: "rgba(20,20,19,0.027)", border: "1px solid rgba(20,20,19,0.065)", borderRadius: 10, textAlign: "left", cursor: "pointer", fontFamily: "inherit", transition: "all 0.14s" }}>
                  <span style={{ width: 17, height: 17, borderRadius: 5, background: C.arc, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 900, flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ fontSize: 12, color: C.ink, lineHeight: 1.45, fontWeight: 450 }}>{idea}</span>
                </motion.button>
              ))}
              {hashtags?.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 3 }}>
                  {hashtags.slice(0, 5).map(h => (
                    <span key={h} style={{ padding: "2px 7px", background: "rgba(99,102,241,0.1)", color: "#6366f1", borderRadius: 99, fontSize: 9, fontWeight: 700 }}>
                      {h.startsWith("#") ? h : `#${h}`}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// ─── DETECT NICHE ────────────────────────────────────────────────
const NICHES = [
  { id: "AI & Tech", emoji: "🤖", kw: ["ai", "chatgpt", "openai", "tech", "apple", "google", "gpt", "llm", "software"] },
  { id: "Trading",   emoji: "📈", kw: ["stock", "market", "nifty", "sensex", "trading", "invest", "fund", "equity"] },
  { id: "Crypto",    emoji: "₿",  kw: ["crypto", "bitcoin", "btc", "ethereum", "web3", "nft", "defi"] },
  { id: "Sports",    emoji: "🏆", kw: ["ipl", "cricket", "football", "sport", "match", "tournament", "league"] },
  { id: "Entertainment", emoji: "🎬", kw: ["movie", "film", "netflix", "celebrity", "bollywood", "anime"] },
  { id: "Business",  emoji: "💼", kw: ["startup", "business", "entrepreneur", "company", "ceo", "funding"] },
  { id: "Music",     emoji: "🎵", kw: ["music", "song", "album", "artist", "rapper", "singer", "spotify"] },
  { id: "Politics",  emoji: "🏛️", kw: ["politics", "election", "government", "minister", "parliament"] },
  { id: "Fitness",   emoji: "💪", kw: ["gym", "fitness", "workout", "diet", "health", "exercise", "yoga"] },
];

function detectNiche(text) {
  const t = (text || "").toLowerCase();
  for (const n of NICHES) if (n.kw.some(k => t.includes(k))) return n;
  return { id: "Trending", emoji: "🔥" };
}

function hashScore(str, lo = 75, hi = 99) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) { h = ((h << 5) + h) ^ str.charCodeAt(i); h = h >>> 0; }
  return lo + (h % (hi - lo + 1));
}

function genIdeas(title, nicheId) {
  const t = (title || "this trend").substring(0, 50);
  return [
    `🎯 My honest take on: ${t}`,
    `🧵 What every ${nicheId} creator must know this week`,
    `⚡ 60-second explainer: ${t}`,
  ];
}

function timeAgo(d) {
  if (!d) return "just now";
  const m = Math.floor((Date.now() - new Date(d)) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

async function doShare(title, url) {
  if (navigator.share) { try { await navigator.share({ title, url: url || location.href }); return true; } catch {} }
  try { await navigator.clipboard.writeText(url || location.href); return "copied"; } catch {}
  return false;
}

// ─── TREND CARD ───────────────────────────────────────────────────
const TrendCard = memo(function TrendCard({
  trend, newsItem, index, onUseIdea, saved = false, onToggleSave,
}) {
  const { topic, score: propScore, ideas: propIdeas, hashtags: propTags } = trend;
  const [shareMsg, setShareMsg] = useState(null);

  const niche = detectNiche(newsItem?.title || topic);
  const score = propScore || hashScore(`${newsItem?.title || ""}${newsItem?.source || ""}`, 75, 99);
  const ideas = propIdeas?.length ? propIdeas : genIdeas(newsItem?.title, niche.id);
  const tags = propTags?.length ? propTags : [`#${niche.id.replace(/\s/g, "")}`, "#trending"].filter(Boolean);
  const scoreColor = score >= 90 ? C.arc : score >= 82 ? "#059669" : "#6366f1";
  const id = newsItem?.url || topic || String(index);

  const handleShare = useCallback(async () => {
    const r = await doShare(newsItem?.title || topic, newsItem?.url);
    setShareMsg(r === "copied" ? "Copied!" : r ? "Shared!" : null);
    if (r) setTimeout(() => setShareMsg(null), 2200);
  }, [newsItem, topic]);

  const handleUse = useCallback((idea) => {
    const caption = `${idea}\n\n${tags.join(" ")}`;
    const images = newsItem?.image ? [newsItem.image] : [];
    onUseIdea?.({ caption, hashtags: tags, topic: niche.id, images, memes: [], source: newsItem });
  }, [newsItem, tags, niche.id, onUseIdea]);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.035, 0.3), ease: [0.23, 1, 0.32, 1] }}
      style={{
        background: C.white, borderRadius: 20, overflow: "hidden",
        border: `1px solid ${C.border}`,
        boxShadow: "0 1px 8px rgba(20,20,19,0.05), 0 4px 20px rgba(20,20,19,0.04)",
        display: "flex", flexDirection: "column", marginBottom: 20,
        transition: "box-shadow 0.28s, transform 0.28s",
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 14px 44px rgba(20,20,19,0.13), 0 4px 14px rgba(20,20,19,0.06)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 1px 8px rgba(20,20,19,0.05), 0 4px 20px rgba(20,20,19,0.04)"; }}
    >
      {/* Hero image */}
      {newsItem?.image && (
        <div style={{ position: "relative" }}>
          <LazyImage src={newsItem.image} alt={topic} style={{ height: 180, width: "100%" }} />
          <div style={{ position: "absolute", top: 9, left: 9 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 99, background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)", fontSize: 9, fontWeight: 900, color: C.ink, letterSpacing: "0.05em", textTransform: "uppercase", boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}>
              <span style={{ fontSize: 10 }}>{niche.emoji}</span>{niche.id}
            </span>
          </div>
          <div style={{ position: "absolute", top: 9, right: 9 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 99, background: `${scoreColor}16`, border: `1px solid ${scoreColor}32`, fontSize: 9, fontWeight: 900, color: scoreColor, letterSpacing: "0.04em" }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: scoreColor, boxShadow: `0 0 6px ${scoreColor}` }} />
              {score}% VIRAL
            </span>
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{ padding: "14px 16px 15px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
          {!newsItem?.image && (
            <span style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 99, background: "rgba(20,20,19,0.07)", fontSize: 9, fontWeight: 900, color: C.ink, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              <span>{niche.emoji}</span>{niche.id}
            </span>
          )}
          <span style={{ marginLeft: "auto", fontSize: 10, color: C.dust, fontWeight: 600, whiteSpace: "nowrap" }}>
            {newsItem?.source} · {timeAgo(newsItem?.publishedAt)}
          </span>
        </div>

        <h3 style={{ fontSize: 14, fontWeight: 720, color: C.ink, margin: "0 0 3px", lineHeight: 1.35, letterSpacing: "-0.014em", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {newsItem?.title || topic}
        </h3>

        <IdeasDrawer ideas={ideas} hashtags={tags} onUse={handleUse} />

        <div style={{ height: 1, background: "rgba(20,20,19,0.07)", margin: "7px 0" }} />

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
          {[
            { icon: <Sparkles size={12} />, label: "Use Idea", onClick: () => handleUse(ideas[0]), color: C.arc },
            { icon: saved ? <BookmarkCheck size={12} /> : <Bookmark size={12} />, label: saved ? "Saved" : "Save", onClick: () => onToggleSave?.(id), active: saved, color: C.arc },
            { icon: <Share2 size={12} />, label: shareMsg || "Share", onClick: handleShare, active: !!shareMsg },
          ].map((b, i) => (
            <button key={i} onClick={e => { e.stopPropagation(); b.onClick(); }}
              aria-label={b.label}
              style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", background: b.active ? `${b.color || C.arc}13` : "rgba(20,20,19,0.04)", border: `1px solid ${b.active ? (b.color || C.arc) + "36" : "rgba(20,20,19,0.08)"}`, borderRadius: 99, color: b.active ? (b.color || C.arc) : C.slate, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", minHeight: 32, transition: "all 0.13s" }}>
              {b.icon}{b.label}
            </button>
          ))}

          {newsItem?.url && (
            <a href={newsItem.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} aria-label="Read article"
              style={{ marginLeft: "auto", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(20,20,19,0.04)", border: "1px solid rgba(20,20,19,0.08)", borderRadius: 99, color: C.slate, transition: "all 0.13s" }}
              onMouseEnter={e => { e.currentTarget.style.color = C.ink; }}
              onMouseLeave={e => { e.currentTarget.style.color = C.slate; }}>
              <ExternalLink size={11} />
            </a>
          )}
        </div>
      </div>
    </motion.article>
  );
});

export default TrendCard;
