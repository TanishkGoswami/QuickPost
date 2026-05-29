/**
 * AllTrendsPage.jsx — Trend Intelligence Feed
 * ────────────────────────────────────────────────────────────────
 * COMPLETE SELF-CONTAINED REDESIGN.
 *
 * Architecture:
 *  - Pinterest-style infinite masonry scroll
 *  - News cards (light) + Meme cards (dark ink) interleaved
 *  - Sticky header: search + niche filter pills + sort
 *  - Save (localStorage) / Share (Web Share API) / Use in Composer
 *  - Expandable "Content Ideas" drawer per card
 *  - Mobile-first responsive (1 col → 2 col → 3 col)
 *  - Framer Motion micro-interactions throughout
 *  - IntersectionObserver infinite scroll sentinel
 *  - Full ARIA labelling
 *
 * Replace: client/src/pages/trends/AllTrendsPage.jsx
 * ────────────────────────────────────────────────────────────────
 */

import React, {
  useState, useMemo, useCallback, useEffect, useRef, Suspense, lazy, memo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame, Sparkles, TrendingUp, RefreshCw, Search,
  Bookmark, BookmarkCheck, Share2, ExternalLink, Play,
  Zap, Globe, Music, Activity, Cpu, BarChart2, Trophy,
  Tv2, Filter, ChevronDown, X, ArrowUpCircle, Hash,
  CheckCircle2, Lightbulb, Youtube,
} from "lucide-react";
import { useAllTrends } from "./hooks/useAllTrends";

const ComposerModal = lazy(() => import("../../components/ComposerModal"));

// ─── PALETTE ────────────────────────────────────────────────────
const C = {
  ink:       "#141413",
  ink80:     "rgba(20,20,19,0.8)",
  canvas:    "#f2f0ed",
  white:     "#ffffff",
  slate:     "#6b6b68",
  dust:      "#c4bfb8",
  muted:     "rgba(20,20,19,0.08)",
  border:    "rgba(20,20,19,0.09)",
  arc:       "#f37338",         // brand orange
  arcSoft:   "rgba(243,115,56,0.12)",
  arcBorder: "rgba(243,115,56,0.25)",
  green:     "#059669",
  violet:    "#6366f1",
  yellow:    "#f59e0b",
  sky:       "#0ea5e9",
};

// ─── UTILS ──────────────────────────────────────────────────────
function hashScore(str, lo = 72, hi = 99) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) { h = ((h << 5) + h) ^ str.charCodeAt(i); h = h >>> 0; }
  return lo + (h % (hi - lo + 1));
}

const NICHES = [
  { id: "AI & Tech",     emoji: "🤖", color: C.violet,  kw: ["ai","chatgpt","openai","tech","apple","google","gpt","llm","software","startup","developer"] },
  { id: "Trading",       emoji: "📈", color: C.green,   kw: ["stock","market","nifty","sensex","trading","invest","fund","equity","forex","gold","sebi"] },
  { id: "Crypto",        emoji: "₿",  color: "#f7931a", kw: ["crypto","bitcoin","btc","ethereum","web3","nft","defi","blockchain"] },
  { id: "Sports",        emoji: "🏆", color: C.sky,     kw: ["ipl","cricket","football","sport","match","tournament","league","f1","nba","fifa","tennis"] },
  { id: "Entertainment", emoji: "🎬", color: C.yellow,  kw: ["movie","film","series","netflix","celebrity","bollywood","anime","ott","drama","actor"] },
  { id: "Music",         emoji: "🎵", color: "#ec4899", kw: ["music","song","album","artist","rapper","singer","spotify","concert","dj","remix"] },
  { id: "Business",      emoji: "💼", color: "#8b5cf6", kw: ["startup","business","entrepreneur","company","ceo","funding","revenue","saas","product"] },
  { id: "Politics",      emoji: "🏛️", color: "#64748b", kw: ["politics","election","government","minister","parliament","policy","law","modi","bjp","congress"] },
  { id: "Fitness",       emoji: "💪", color: "#e11d48", kw: ["gym","fitness","workout","diet","health","exercise","nutrition","yoga","protein","abs"] },
];

function detectNiche(text) {
  const t = (text || "").toLowerCase();
  for (const n of NICHES) if (n.kw.some(k => t.includes(k))) return n;
  return { id: "Trending", emoji: "🔥", color: C.arc };
}

function genIdeas(title, nicheId) {
  const t = (title || "this trend").substring(0, 50);
  return [
    `🎯 My honest take on: ${t}`,
    `🧵 What every ${nicheId} creator must know this week`,
    `⚡ 60-second explainer: ${t}`,
    `💬 Poll: Does this change anything for you?`,
  ];
}

function fmtUpvotes(n) {
  if (!n) return "1.4k";
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
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
  if (navigator.share) { try { await navigator.share({ title, url: url || location.href }); return "shared"; } catch {} }
  try { await navigator.clipboard.writeText(url || location.href); return "copied"; } catch {}
  return false;
}

// ─── SAVED HOOK ─────────────────────────────────────────────────
function useSaved() {
  const [ids, setIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem("_gap_saved") || "[]")); } catch { return new Set(); }
  });
  const toggle = useCallback((id) => setIds(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    try { localStorage.setItem("_gap_saved", JSON.stringify([...next])); } catch {}
    return next;
  }), []);
  return { ids, toggle };
}

// ─── LAZY IMAGE ─────────────────────────────────────────────────
const Img = memo(function Img({ src, alt = "", h, style = {}, fit = "cover" }) {
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState(false);
  const fb = `https://placehold.co/600x380/e8e4df/c4bfb8?text=${encodeURIComponent((alt || "").substring(0, 18) || "Trend")}`;
  return (
    <div style={{ position: "relative", overflow: "hidden", background: C.muted, height: h || "auto", ...style }}>
      {!ok && <div style={{ position: "absolute", inset: 0, animation: "shimmer 1.5s ease-in-out infinite", background: "linear-gradient(90deg,rgba(20,20,19,0.04) 25%,rgba(20,20,19,0.1) 50%,rgba(20,20,19,0.04) 75%)", backgroundSize: "400% 100%", height: h === "auto" ? 200 : "100%" }} />}
      <img src={err ? fb : src} alt={alt} loading="lazy" decoding="async"
        onLoad={() => setOk(true)} onError={() => { setErr(true); setOk(true); }}
        style={{ width: "100%", height: "auto", display: "block", opacity: ok ? 1 : 0, transform: ok ? "scale(1)" : "scale(1.06)", transition: "opacity 0.45s ease, transform 0.5s ease" }} />
    </div>
  );
});

// ─── SCORE PILL ─────────────────────────────────────────────────
const Score = ({ n }) => {
  const col = n >= 90 ? C.arc : n >= 82 ? C.green : C.violet;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 99, background: `${col}15`, border: `1px solid ${col}30`, fontSize: 9, fontWeight: 900, color: col, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: col, boxShadow: `0 0 6px ${col}` }} />{n}% VIRAL
    </span>
  );
};

// ─── NICHE BADGE ────────────────────────────────────────────────
const NicheBadge = ({ niche }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 99, background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)", fontSize: 9, fontWeight: 900, color: C.ink, letterSpacing: "0.05em", textTransform: "uppercase", boxShadow: "0 2px 8px rgba(0,0,0,0.14)", whiteSpace: "nowrap" }}>
    <span style={{ fontSize: 10 }}>{niche.emoji}</span>{niche.id}
  </span>
);

// ─── ACTION BUTTON ──────────────────────────────────────────────
const Btn = memo(function Btn({ icon, label, onClick, active, color = C.arc, tiny }) {
  const [pop, setPop] = useState(false);
  return (
    <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.9 }}
      onClick={e => { e.stopPropagation(); setPop(true); setTimeout(() => setPop(false), 350); onClick?.(); }}
      aria-label={label} title={label}
      style={{ display: "flex", alignItems: "center", gap: tiny ? 3 : 5, padding: tiny ? "5px 10px" : "7px 13px", background: active ? `${color}14` : C.muted, border: `1px solid ${active ? color + "38" : C.border}`, borderRadius: 99, color: active ? color : C.slate, fontSize: tiny ? 11 : 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", minHeight: 34, minWidth: 34, transition: "all 0.15s" }}>
      <motion.span animate={pop ? { scale: [1, 1.5, 1] } : {}}>{icon}</motion.span>
      {label && <span style={{ display: tiny ? "none" : "inline" }}>{label}</span>}
    </motion.button>
  );
});

// ─── IDEAS DRAWER ────────────────────────────────────────────────
const IdeasDrawer = memo(function IdeasDrawer({ ideas, hashtags, onUse }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button onClick={e => { e.stopPropagation(); setOpen(p => !p); }}
        style={{ display: "flex", alignItems: "center", gap: 6, width: "100%", padding: "9px 0 7px", background: "none", border: "none", cursor: "pointer", color: C.slate, fontSize: 12, fontWeight: 600, fontFamily: "inherit" }}>
        <Lightbulb size={12} style={{ color: C.arc, flexShrink: 0 }} />
        {ideas.length} content ideas
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={11} />
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }} style={{ overflow: "hidden" }}>
            <div style={{ paddingBottom: 10, display: "flex", flexDirection: "column", gap: 5 }}>
              {ideas.slice(0, 3).map((idea, i) => (
                <motion.button key={i} initial={{ x: -8, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.055 }}
                  whileHover={{ x: 3, background: `${C.arc}09`, borderColor: `${C.arc}28` }}
                  onClick={e => { e.stopPropagation(); onUse(idea); }}
                  style={{ display: "flex", alignItems: "flex-start", gap: 9, padding: "9px 11px", background: "rgba(20,20,19,0.028)", border: "1px solid rgba(20,20,19,0.065)", borderRadius: 10, textAlign: "left", cursor: "pointer", fontFamily: "inherit", transition: "all 0.14s" }}>
                  <span style={{ width: 17, height: 17, borderRadius: 5, background: C.arc, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 900, flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ fontSize: 12, color: C.ink, lineHeight: 1.45, fontWeight: 450 }}>{idea}</span>
                </motion.button>
              ))}
              {hashtags?.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                  {hashtags.slice(0, 5).map(h => (
                    <span key={h} style={{ padding: "2px 7px", background: `${C.violet}10`, color: C.violet, borderRadius: 99, fontSize: 9, fontWeight: 700 }}>
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

// ─── NEWS CARD ──────────────────────────────────────────────────
const NewsCard = memo(function NewsCard({ item, idx, onUse, saved, onSave }) {
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
      style={{ background: C.white, borderRadius: 16, overflow: "hidden", border: "1px solid rgba(20,20,19,0.075)", boxShadow: "0 1px 2px rgba(20,20,19,0.04), 0 10px 28px rgba(20,20,19,0.055)", marginBottom: 18, display: "flex", flexDirection: "column", transition: "box-shadow 0.22s, transform 0.22s, border-color 0.22s" }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 18px 42px rgba(20,20,19,0.12), 0 4px 12px rgba(20,20,19,0.06)"; e.currentTarget.style.borderColor = "rgba(20,20,19,0.14)"; e.currentTarget.style.transform = "translateY(-3px)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 2px rgba(20,20,19,0.04), 0 10px 28px rgba(20,20,19,0.055)"; e.currentTarget.style.borderColor = "rgba(20,20,19,0.075)"; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      {/* Hero image */}
      {item.image && (
        <div style={{ position: "relative" }}>
          <Img src={item.image} alt={item.title} h="auto" />
          <div style={{ position: "absolute", top: 9, left: 9 }}><NicheBadge niche={niche} /></div>
          <div style={{ position: "absolute", top: 9, right: 9 }}><Score n={score} /></div>
        </div>
      )}

      <div style={{ padding: "16px 17px 17px" }}>
        {/* Meta row */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
          {!item.image && <NicheBadge niche={niche} />}
          <span style={{ marginLeft: "auto", fontSize: 10, color: C.slate, opacity: 0.72, fontWeight: 650, whiteSpace: "nowrap" }}>
            {item.source} · {timeAgo(item.publishedAt)}
          </span>
          {!item.image && <Score n={score} />}
        </div>

        {/* Title */}
        <h3 style={{ fontSize: 15, fontWeight: 760, color: C.ink, margin: "0 0 4px", lineHeight: 1.36, letterSpacing: 0, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {item.title}
        </h3>

        {/* Ideas */}
        <IdeasDrawer ideas={ideas} hashtags={tags} onUse={handleUse} />

        {/* Divider */}
        <div style={{ height: 1, background: C.muted, margin: "7px 0" }} />

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <Btn icon={<Sparkles size={12} />} label="Use Idea" onClick={() => handleUse(ideas[0])} color={C.arc} tiny />
          <Btn icon={saved ? <BookmarkCheck size={12} /> : <Bookmark size={12} />} label={saved ? "Saved" : "Save"} onClick={() => onSave(id)} active={saved} color={C.arc} tiny />
          <Btn icon={<Share2 size={12} />} label={shareLabel || "Share"} onClick={handleShare} tiny />
          {item.url && (
            <a href={item.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} aria-label="Read full article"
              style={{ marginLeft: "auto", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", background: C.muted, border: `1px solid ${C.border}`, borderRadius: 99, color: C.slate, transition: "all 0.14s" }}
              onMouseEnter={e => { e.currentTarget.style.color = C.ink; e.currentTarget.style.background = "rgba(20,20,19,0.1)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = C.slate; e.currentTarget.style.background = C.muted; }}>
              <ExternalLink size={11} />
            </a>
          )}
        </div>
      </div>
    </motion.article>
  );
});

// ─── MEME CARD ──────────────────────────────────────────────────
const MemeCard = memo(function MemeCard({ item, idx, onUse, saved, onSave }) {
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
      style={{ background: C.white, borderRadius: 16, overflow: "hidden", border: "1px solid rgba(20,20,19,0.075)", boxShadow: "0 1px 2px rgba(20,20,19,0.04), 0 10px 28px rgba(20,20,19,0.055)", marginBottom: 18, display: "flex", flexDirection: "column", transition: "box-shadow 0.22s, transform 0.22s, border-color 0.22s" }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 18px 42px rgba(20,20,19,0.12), 0 4px 12px rgba(20,20,19,0.06)"; e.currentTarget.style.borderColor = "rgba(20,20,19,0.14)"; e.currentTarget.style.transform = "translateY(-3px)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 2px rgba(20,20,19,0.04), 0 10px 28px rgba(20,20,19,0.055)"; e.currentTarget.style.borderColor = "rgba(20,20,19,0.075)"; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      {/* Media */}
      {(image || (isVideo && videoUrl)) && (
        <div style={{ position: "relative" }}>
          {isVideo && videoUrl
            ? <video src={videoUrl} poster={image} autoPlay muted loop playsInline style={{ width: "100%", display: "block", height: "auto", background: C.muted }} />
            : <Img src={image} alt={title || "Trending"} h="auto" style={{ minHeight: 140 }} />
          }
          {/* Badges */}
          <div style={{ position: "absolute", top: 9, left: 9, display: "flex", gap: 5 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 9px", background: "rgba(255,255,255,0.88)", backdropFilter: "blur(8px)", borderRadius: 99, fontSize: 9, fontWeight: 900, color: C.arc, textTransform: "uppercase", letterSpacing: "0.06em", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
              {isVideo ? <Play size={8} fill={C.arc} /> : <Flame size={8} />}
              {isVideo ? "VIDEO" : "MEME"}
            </span>
          </div>
          <div style={{ position: "absolute", top: 9, right: 9 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", background: "rgba(255,255,255,0.88)", backdropFilter: "blur(8px)", borderRadius: 99, fontSize: 10, color: C.arc, fontWeight: 800, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
              <ArrowUpCircle size={10} />{fmtUpvotes(upvotes)}
            </span>
          </div>
        </div>
      )}

      <div style={{ padding: "16px 17px 17px" }}>
        {/* Subreddit + upvotes (if no image) */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 9 }}>
          <span style={{ padding: "3px 9px", background: "rgba(243,115,56,0.12)", border: "1px solid rgba(243,115,56,0.22)", borderRadius: 99, fontSize: 10, fontWeight: 800, color: C.arc, letterSpacing: 0 }}>
            r/{subreddit || "trending"}
          </span>
          {!image && !isVideo && (
            <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: C.arc, fontWeight: 800 }}>
              <ArrowUpCircle size={11} />{fmtUpvotes(upvotes)}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 style={{ fontSize: 15, fontWeight: 700, color: C.ink, margin: "0 0 14px", lineHeight: 1.4, letterSpacing: 0, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {title || "Check this out 🔥"}
        </h3>

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }} onClick={handleUse}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 0", background: C.arc, border: "none", borderRadius: 10, color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 14px rgba(243,115,56,0.32)" }}>
            <Sparkles size={12} />Use This
          </motion.button>

          {[
            { icon: saved ? <BookmarkCheck size={13} /> : <Bookmark size={13} />, action: () => onSave(id), active: saved },
            { icon: <Share2 size={13} />, action: handleShare, active: !!shareLabel },
          ].map((b, i) => (
            <button key={i} onClick={e => { e.stopPropagation(); b.action(); }}
              style={{ width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", background: b.active ? "rgba(243,115,56,0.12)" : C.muted, border: `1px solid ${b.active ? "rgba(243,115,56,0.25)" : C.border}`, borderRadius: 10, color: b.active ? C.arc : C.slate, cursor: "pointer", transition: "all 0.14s" }}>
              {b.icon}
            </button>
          ))}

          {url && (
            <a href={url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} aria-label="View on Reddit"
              style={{ width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", background: C.muted, border: `1px solid ${C.border}`, borderRadius: 10, color: C.slate, transition: "all 0.14s" }}
              onMouseEnter={e => { e.currentTarget.style.color = C.ink; e.currentTarget.style.background = "rgba(20,20,19,0.1)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = C.slate; e.currentTarget.style.background = C.muted; }}>
              <ExternalLink size={11} />
            </a>
          )}
        </div>
      </div>
    </motion.article>
  );
});

// ─── SKELETON CARDS ─────────────────────────────────────────────
const VideoCard = memo(function VideoCard({ item, idx, onUse, saved, onSave }) {
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
      style={{ background: C.white, borderRadius: 16, overflow: "hidden", border: "1px solid rgba(20,20,19,0.075)", boxShadow: "0 1px 2px rgba(20,20,19,0.04), 0 10px 28px rgba(20,20,19,0.055)", marginBottom: 18, display: "flex", flexDirection: "column", transition: "box-shadow 0.22s, transform 0.22s, border-color 0.22s" }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 18px 42px rgba(20,20,19,0.12), 0 4px 12px rgba(20,20,19,0.06)"; e.currentTarget.style.borderColor = "rgba(20,20,19,0.14)"; e.currentTarget.style.transform = "translateY(-3px)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 2px rgba(20,20,19,0.04), 0 10px 28px rgba(20,20,19,0.055)"; e.currentTarget.style.borderColor = "rgba(20,20,19,0.075)"; e.currentTarget.style.transform = "translateY(0)"; }}
    >
      <div style={{ position: "relative", aspectRatio: "16 / 9", background: C.muted, overflow: "hidden" }}>
        {item.thumbnail
          ? <img src={item.thumbnail} alt={item.title} loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          : <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, rgba(20,20,19,0.08), rgba(243,115,56,0.18))" }} />
        }
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.18), transparent 42%, rgba(0,0,0,0.34))" }} />
        <div style={{ position: "absolute", top: 9, left: 9 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 9px", background: "rgba(255,255,255,0.92)", borderRadius: 99, fontSize: 9, fontWeight: 900, color: "#dc2626", textTransform: "uppercase", letterSpacing: "0.05em", boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}>
            <Youtube size={11} fill="#dc2626" /> YouTube
          </span>
        </div>
        <div style={{ position: "absolute", top: 9, right: 9 }}><Score n={score} /></div>
        <div style={{ position: "absolute", left: 12, bottom: 10, width: 38, height: 38, borderRadius: "50%", background: "rgba(20,20,19,0.82)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", boxShadow: "0 6px 18px rgba(0,0,0,0.24)" }}>
          <Play size={15} fill="#fff" />
        </div>
        {item.duration && (
          <span style={{ position: "absolute", right: 10, bottom: 10, padding: "3px 7px", background: "rgba(20,20,19,0.84)", color: "#fff", borderRadius: 7, fontSize: 10, fontWeight: 800 }}>
            {item.duration}
          </span>
        )}
      </div>

      <div style={{ padding: "15px 17px 17px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
          <span style={{ color: C.slate, fontSize: 11, fontWeight: 720, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.channel || "YouTube"}</span>
          <span style={{ marginLeft: "auto", color: C.slate, opacity: 0.76, fontSize: 10, fontWeight: 650 }}>{item.views || timeAgo(item.publishedAt)}</span>
        </div>
        <h3 style={{ fontSize: 15, fontWeight: 760, color: C.ink, margin: "0 0 13px", lineHeight: 1.36, letterSpacing: 0, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {item.title}
        </h3>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }} onClick={handleUse}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 0", background: C.ink, border: "none", borderRadius: 10, color: C.canvas, fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
            <Sparkles size={12} />Use This
          </motion.button>
          <Btn icon={saved ? <BookmarkCheck size={12} /> : <Bookmark size={12} />} label={saved ? "Saved" : "Save"} onClick={() => onSave(id)} active={saved} color={C.arc} tiny />
          <Btn icon={<Share2 size={12} />} label={shareLabel || "Share"} onClick={handleShare} tiny />
          {item.url && (
            <a href={item.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} aria-label="Watch on YouTube"
              style={{ width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", background: C.muted, border: `1px solid ${C.border}`, borderRadius: 10, color: C.slate }}>
              <ExternalLink size={11} />
            </a>
          )}
        </div>
      </div>
    </motion.article>
  );
});

const Skeleton = memo(function Skeleton({ dark, imgH = 160 }) {
  const bg = C.white;
  const line = "rgba(20,20,19,0.06)";
  const shimmer = "linear-gradient(90deg,rgba(20,20,19,0.04) 25%,rgba(20,20,19,0.09) 50%,rgba(20,20,19,0.04) 75%)";
  return (
    <div className="masonry-card" style={{ background: bg, borderRadius: 16, overflow: "hidden", marginBottom: 18, border: `1px solid ${C.border}`, boxShadow: "0 1px 2px rgba(20,20,19,0.04), 0 10px 28px rgba(20,20,19,0.045)" }}>
      <div style={{ height: imgH, background: shimmer, backgroundSize: "400% 100%", animation: "shimmer 1.5s ease-in-out infinite" }} />
      <div style={{ padding: "14px 16px" }}>
        {[88, 68, 50].map((w, i) => (
          <div key={i} style={{ height: i === 0 ? 14 : 10, width: `${w}%`, marginBottom: 9, borderRadius: 5, background: line, animation: "shimmer 1.5s ease-in-out infinite" }} />
        ))}
      </div>
    </div>
  );
});

// ─── SEARCH BAR ─────────────────────────────────────────────────
const SearchBar = memo(function SearchBar({ value, onChange, onClear }) {
  const ref = useRef(null);
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: "relative", flex: "1 1 360px", minWidth: 220, maxWidth: 680 }}>
      <Search 
        size={16} 
        style={{ 
          position: "absolute", 
          left: 16, 
          top: "50%", 
          transform: "translateY(-50%)", 
          color: focused ? C.arc : C.dust, 
          transition: "color 0.2s", 
          pointerEvents: "none", 
          zIndex: 1 
        }} 
      />
      <input 
        ref={ref} 
        type="search" 
        value={value} 
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)} 
        onBlur={() => setFocused(false)}
        placeholder="Search trends, news, topics…" 
        aria-label="Search trends" 
        autoComplete="off"
        style={{ 
          width: "100%", 
          padding: "14px 44px 14px 46px", 
          background: C.white, 
          border: `1px solid ${focused ? "rgba(243,115,56,0.55)" : "rgba(20,20,19,0.09)"}`, 
          borderRadius: 14, 
          fontSize: 14, 
          fontWeight: 560, 
          color: C.ink, 
          fontFamily: "inherit", 
          outline: "none", 
          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)", 
          boxShadow: focused ? `0 10px 28px ${C.arc}14, 0 0 0 4px ${C.arc}08` : "0 6px 16px rgba(20,20,19,0.035)" 
        }} 
      />
      <AnimatePresence>
        {value && (
          <motion.button 
            initial={{ opacity: 0, scale: 0.7 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.7 }}
            onClick={() => { onClear(); ref.current?.focus(); }}
            style={{ 
              position: "absolute", 
              right: 12, 
              top: "50%", 
              transform: "translateY(-50%)", 
              width: 22, 
              height: 22, 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              background: "rgba(20,20,19,0.08)", 
              border: "none", 
              borderRadius: "50%", 
              cursor: "pointer", 
              color: C.slate 
            }}
            aria-label="Clear search"
          >
            <X size={11} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
});

// ─── FILTER PILLS ────────────────────────────────────────────────
const PILLS = [
  { id: "All",           icon: <Zap size={14} /> },
  { id: "AI & Tech",     icon: <Cpu size={14} /> },
  { id: "Trading",       icon: <BarChart2 size={14} /> },
  { id: "Crypto",        icon: <Activity size={14} /> },
  { id: "Sports",        icon: <Trophy size={14} /> },
  { id: "Entertainment", icon: <Tv2 size={14} /> },
  { id: "Business",      icon: <TrendingUp size={14} /> },
  { id: "Music",         icon: <Music size={14} /> },
  { id: "Politics",      icon: <Globe size={14} /> },
  { id: "Fitness",       icon: <Flame size={14} /> },
];

const FilterPills = memo(function FilterPills({ active, onChange }) {
  const scrollRef = useRef(null);
  const select = (id) => {
    onChange(id);
    const el = scrollRef.current?.querySelector(`[data-pid="${id}"]`);
    el?.scrollIntoView({ inline: "center", behavior: "smooth", block: "nearest" });
  };
  return (
    <div 
      ref={scrollRef} 
      role="tablist" 
      aria-label="Filter by category" 
      className="tpills"
      style={{ 
        display: "flex", 
        gap: 7, 
        overflowX: "auto", 
        padding: "6px 0 10px", 
        scrollbarWidth: "none", 
        WebkitOverflowScrolling: "touch" 
      }}
    >
      {PILLS.map(({ id, icon }) => {
        const on = active === id;
        return (
          <motion.button 
            key={id} 
            data-pid={id} 
            role="tab" 
            aria-selected={on}
            whileHover={{ y: -2, scale: 1.02 }} 
            whileTap={{ scale: 0.95 }} 
            onClick={() => select(id)}
            style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: 8, 
              padding: "9px 15px", 
              background: on ? C.ink : "rgba(255,255,255,0.78)", 
              border: on ? `1px solid ${C.ink}` : `1px solid rgba(20,20,19,0.085)`, 
              borderRadius: 12, 
              color: on ? C.canvas : C.slate, 
              fontSize: 13, 
              fontWeight: on ? 760 : 640, 
              cursor: "pointer", 
              whiteSpace: "nowrap", 
              fontFamily: "inherit", 
              flexShrink: 0, 
              transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)", 
              boxShadow: on ? "0 8px 20px rgba(20,20,19,0.15)" : "0 4px 12px rgba(20,20,19,0.035)" 
            }}
          >
            <span style={{ 
              color: on ? C.arc : C.dust,
              opacity: on ? 1 : 0.7,
              display: "flex",
              alignItems: "center",
              transition: "transform 0.3s ease",
              transform: on ? "scale(1.05)" : "none"
            }}>
              {icon}
            </span>
            {id}
          </motion.button>
        );
      })}
    </div>
  );
});

// ─── SORT TOGGLE ────────────────────────────────────────────────
const SORTS = [{ id: "score", label: "🔥 Trending" }, { id: "latest", label: "🕐 Latest" }, { id: "saved", label: "🔖 Saved" }];
const ADVANCED_SORTS = [
  { id: "score", label: "Trending", icon: <Flame size={13} /> },
  { id: "latest", label: "Latest", icon: <Activity size={13} /> },
  { id: "saved", label: "Saved", icon: <Bookmark size={13} /> },
];
const SortToggle = memo(function SortToggle({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 4, background: "rgba(20,20,19,0.055)", padding: 4, borderRadius: 12, flexShrink: 0, border: "1px solid rgba(20,20,19,0.06)" }}>
      {ADVANCED_SORTS.map(o => (
        <button key={o.id} onClick={() => onChange(o.id)}
          style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 12px", minHeight: 34, background: value === o.id ? C.white : "transparent", border: "none", borderRadius: 9, fontSize: 12, fontWeight: value === o.id ? 760 : 620, color: value === o.id ? C.ink : C.slate, cursor: "pointer", fontFamily: "inherit", transition: "all 0.14s", boxShadow: value === o.id ? "0 3px 10px rgba(20,20,19,0.10)" : "none", whiteSpace: "nowrap" }}>
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
});

// ─── STATS BAR ──────────────────────────────────────────────────
const StatsBar = memo(function StatsBar({ news, memes, videos = 0, total, loading }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 13px", background: "rgba(255,255,255,0.82)", border: `1px solid ${C.border}`, borderRadius: 12, fontSize: 12, color: C.slate, fontWeight: 650, flexWrap: "wrap", boxShadow: "0 6px 16px rgba(20,20,19,0.035)" }}>
      {loading
        ? <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", border: `2px solid ${C.arc}30`, borderTopColor: C.arc, animation: "spin 0.7s linear infinite" }} />
            Fetching live data…
          </span>
        : <>
            <span><b style={{ color: C.ink, fontWeight: 820 }}>{total}</b> discoveries</span>
            <div style={{ width: 1, height: 13, background: C.muted }} />
            <span><b style={{ color: C.ink, fontWeight: 820 }}>{news}</b> news</span>
            <div style={{ width: 1, height: 13, background: C.muted }} />
            <span><b style={{ color: C.ink, fontWeight: 820 }}>{videos}</b> videos</span>
            <div style={{ width: 1, height: 13, background: C.muted }} />
            <span><b style={{ color: C.ink, fontWeight: 820 }}>{memes}</b> community</span>
            <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.green, boxShadow: `0 0 7px ${C.green}90`, animation: "pulse 2s ease-in-out infinite" }} />
              <span style={{ fontSize: 9, fontWeight: 900, color: C.green, textTransform: "uppercase", letterSpacing: "0.05em" }}>Live</span>
            </span>
          </>
      }
    </div>
  );
});

// ─── SAVED PANEL ────────────────────────────────────────────────
const SavedPanel = memo(function SavedPanel({ open, onClose, savedIds, allItems, onUse, onSave }) {
  const items = allItems.filter(x => savedIds.has(x._sid));
  return (
    <AnimatePresence>
      {open && <>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
          style={{ position: "fixed", inset: 0, background: "rgba(20,20,19,0.42)", backdropFilter: "blur(5px)", zIndex: 300 }} />
        <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 290, damping: 28 }}
          style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: "min(400px, 94vw)", background: C.white, zIndex: 301, display: "flex", flexDirection: "column", boxShadow: "-16px 0 56px rgba(20,20,19,0.14)" }}>
          <div style={{ padding: "18px 22px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: C.ink, margin: 0, letterSpacing: "-0.02em" }}>Saved Trends</h2>
              <p style={{ fontSize: 11, color: C.slate, margin: "2px 0 0" }}>{items.length} item{items.length !== 1 ? "s" : ""}</p>
            </div>
            <button onClick={onClose} style={{ width: 33, height: 33, display: "flex", alignItems: "center", justifyContent: "center", background: C.muted, border: "none", borderRadius: 9, cursor: "pointer", color: C.slate }}>
              <X size={15} />
            </button>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: 14 }}>
            {items.length === 0
              ? <div style={{ textAlign: "center", padding: "60px 20px" }}>
                  <Bookmark size={30} style={{ color: C.dust, marginBottom: 10 }} />
                  <p style={{ color: C.slate, fontSize: 13 }}>Nothing saved yet.<br />Tap <b>Save</b> on any card!</p>
                </div>
              : items.map((x, i) => x._type === "meme"
                  ? <MemeCard key={x._sid} item={x} idx={i} onUse={onUse} saved={savedIds.has(x._sid)} onSave={onSave} />
                  : x._type === "video"
                    ? <VideoCard key={x._sid} item={x} idx={i} onUse={onUse} saved={savedIds.has(x._sid)} onSave={onSave} />
                    : <NewsCard key={x._sid} item={x} idx={i} onUse={onUse} saved={savedIds.has(x._sid)} onSave={onSave} />
                )
            }
          </div>
        </motion.div>
      </>}
    </AnimatePresence>
  );
});

// ─── EMPTY STATE ────────────────────────────────────────────────
const Empty = ({ search, onClear }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: "center", padding: "72px 20px", background: C.white, borderRadius: 20, border: `1px dashed ${C.border}` }}>
    <div style={{ fontSize: 44, marginBottom: 10 }}>🔍</div>
    <h3 style={{ fontSize: 17, fontWeight: 700, color: C.ink, margin: "0 0 5px" }}>No results for "{search}"</h3>
    <p style={{ fontSize: 13, color: C.slate, margin: "0 0 18px" }}>Try a different search or clear filters</p>
    <button onClick={onClear} style={{ padding: "8px 18px", background: C.ink, color: C.canvas, border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Clear search</button>
  </motion.div>
);

// ─── TOAST ──────────────────────────────────────────────────────
const Toast = ({ show }) => (
  <AnimatePresence>
    {show && (
      <motion.div role="status" aria-live="polite"
        initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.9 }}
        style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", background: C.ink, color: C.canvas, padding: "11px 22px", borderRadius: 99, fontSize: 13, fontWeight: 700, zIndex: 9999, display: "flex", alignItems: "center", gap: 8, boxShadow: "0 14px 44px rgba(20,20,19,0.35)", whiteSpace: "nowrap", border: "1px solid rgba(255,255,255,0.07)" }}>
        <CheckCircle2 size={14} style={{ color: C.arc }} />
        Idea loaded into Composer!
      </motion.div>
    )}
  </AnimatePresence>
);

// ─── INFINITE SCROLL SENTINEL ───────────────────────────────────
function Sentinel({ hasMore, loading, onMore, count }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!hasMore || loading) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) onMore(); }, { rootMargin: "350px", threshold: 0 });
    const el = ref.current;
    if (el) obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loading, onMore, count]);
  if (!hasMore) return null;
  return (
    <div ref={ref} style={{ height: 44, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {loading && <div style={{ width: 22, height: 22, borderRadius: "50%", border: `2.5px solid rgba(20,20,19,0.07)`, borderTopColor: C.arc, animation: "spin 0.7s linear infinite" }} />}
    </div>
  );
}

// ─── MASONRY CONFIG ─────────────────────────────────────────────
const COLS = { default: 4, 1550: 4, 1380: 3, 1100: 2, 740: 2, 600: 1 };
const SKH = [170, 130, 200, 150, 185, 140, 220, 155];
const LOAD_MORE_SKH = [165, 125, 185, 145, 205, 135, 175, 150];

function getColumnCount(breakpoints) {
  if (typeof window === "undefined") return breakpoints.default || 4;
  const width = window.innerWidth;
  const matched = Object.entries(breakpoints)
    .filter(([key]) => key !== "default")
    .map(([key, value]) => [Number(key), value])
    .sort((a, b) => a[0] - b[0])
    .find(([maxWidth]) => width <= maxWidth);

  return matched?.[1] || breakpoints.default || 4;
}

function useMasonryColumns(breakpoints) {
  const [count, setCount] = useState(() => getColumnCount(breakpoints));

  useEffect(() => {
    const onResize = () => setCount(getColumnCount(breakpoints));
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoints]);

  return count;
}

function estimateTrendHeight(entry) {
  if (entry.type === "skeleton" || entry.type === "filler") return (entry.height || 160) + 96;

  const item = entry.item;
  const titleLength = (item.title || "").length;
  const titleLines = Math.min(3, Math.max(1, Math.ceil(titleLength / 42)));
  const titleHeight = titleLines * 21;

  if (item._type === "meme") {
    const mediaHeight = item.isVideo ? 460 : item.image ? 360 : 0;
    return mediaHeight + titleHeight + 92;
  }

  if (item._type === "video") {
    return 250 + titleHeight + 102;
  }

  const mediaHeight = item.image ? 245 : 0;
  return mediaHeight + titleHeight + 138;
}

function BalancedMasonry({ items, renderItem, estimateHeight = estimateTrendHeight, fillGaps = false }) {
  const columnCount = useMasonryColumns(COLS);

  const columns = useMemo(() => {
    const next = Array.from({ length: columnCount }, () => ({ height: 0, items: [] }));

    items.forEach((item) => {
      let target = 0;
      for (let i = 1; i < next.length; i++) {
        if (next[i].height < next[target].height) target = i;
      }

      next[target].items.push(item);
      next[target].height += estimateHeight(item) + 18;
    });

    if (fillGaps && items.length >= columnCount) {
      const tallest = Math.max(...next.map(column => column.height));
      const fillerPattern = [190, 250, 150, 220];

      next.forEach((column, columnIndex) => {
        let fillerIndex = 0;
        while (tallest - column.height > 190 && fillerIndex < 3) {
          const remaining = tallest - column.height - 18;
          const height = Math.max(130, Math.min(fillerPattern[(columnIndex + fillerIndex) % fillerPattern.length], remaining - 76));
          const filler = {
            type: "filler",
            height,
            key: `gap-filler-${columnIndex}-${fillerIndex}-${items.length}`,
          };

          column.items.push(filler);
          column.height += estimateHeight(filler) + 18;
          fillerIndex += 1;
        }
      });
    }

    return next;
  }, [items, columnCount, estimateHeight, fillGaps]);

  return (
    <div className="tmasonry">
      {columns.map((column, columnIndex) => (
        <div className="tmasonry_col" key={`col-${columnIndex}`}>
          {column.items.map((item, index) => renderItem(item, index, columnIndex))}
        </div>
      ))}
    </div>
  );
}

// ─── MAIN PAGE ──────────────────────────────────────────────────
export default function AllTrendsPage() {
  // State
  const [niche, setNiche] = useState("All");
  const [sort, setSort] = useState("score");
  const [search, setSearch] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);
  const [injected, setInjected] = useState(null);
  const [toast, setToast] = useState(false);
  const [savedPanel, setSavedPanel] = useState(false);
  const toastRef = useRef(null);

  // Hide on scroll logic
  const [headerVisible, setHeaderVisible] = useState(true);
  const [lastY, setLastY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      // Hide if scrolling down and past threshold (100px)
      if (y > lastY && y > 100) setHeaderVisible(false);
      // Show if scrolling up
      else setHeaderVisible(true);
      setLastY(y);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastY]);

  const { ids: savedIds, toggle: toggleSave } = useSaved();

  const {
    trends: news, memes, videos, loading, loadingMore,
    error, hasMore, refetch, loadMore,
  } = useAllTrends(search, {
    newsLimit: 24, memeLimit: 24, videoLimit: 10,
    newsCategories: "technology,business,entertainment,sports,finance,science,world,health,politics",
  });

  // Attach stable IDs for saved-set lookups
  const { newsItems, memeItems, videoItems } = useMemo(() => {
    return {
      newsItems: news.map((n, i) => ({ ...n, _type: "news", _sid: n.url || `n-${i}` })),
      memeItems: memes.map((m, i) => ({ ...m, _type: "meme", _sid: m.url || m.link || `m-${i}` })),
      videoItems: videos.map((v, i) => ({ ...v, _type: "video", _sid: v.url || v.id || `v-${i}` })),
    };
  }, [news, memes, videos]);

  // Merge + filter + sort
  const feed = useMemo(() => {
    let fn = niche === "All" ? newsItems : newsItems.filter(n => detectNiche(n.title).id === niche);
    let fm = niche === "All" ? memeItems : memeItems.filter(m => detectNiche(`${m.title} ${m.subreddit}`).id === niche);
    let fv = niche === "All" ? videoItems : videoItems.filter(v => detectNiche(`${v.title} ${v.channel}`).id === niche);

    if (sort === "saved") {
      fn = fn.filter(n => savedIds.has(n._sid));
      fm = fm.filter(m => savedIds.has(m._sid));
      fv = fv.filter(v => savedIds.has(v._sid));
    }

    // Interleave 1:1 within each fetch batch. Re-interleaving the entire
    // accumulated arrays would insert newly loaded memes/news between old
    // cards when one source returns fewer items, which makes masonry reshuffle.
    const combined = [];
    const batches = [...new Set([...fn, ...fm, ...fv].map(item => item._batch ?? 0))].sort((a, b) => a - b);

    for (const batch of batches) {
      const bn = fn.filter(item => (item._batch ?? 0) === batch);
      const bm = fm.filter(item => (item._batch ?? 0) === batch);
      const bv = fv.filter(item => (item._batch ?? 0) === batch);
      const len = Math.max(bn.length, bm.length, bv.length);

      for (let i = 0; i < len; i++) {
        if (i < bn.length) combined.push(bn[i]);
        if (i < bv.length) combined.push(bv[i]);
        if (i < bm.length) combined.push(bm[i]);
      }
    }

    // Note: We deliberately avoid sorting the full 'combined' array here
    // because changing the order of previously rendered items forces
    // react-masonry-css to move elements between column divs.

    return combined;
  }, [newsItems, memeItems, videoItems, niche, sort, savedIds]);

  const allFlat = useMemo(() => [...newsItems, ...memeItems, ...videoItems], [newsItems, memeItems, videoItems]);
  const masonryFeed = useMemo(() => {
    const cards = feed.map((item) => ({ type: "item", item }));
    if (!loadingMore) return cards;
    return [
      ...cards,
      ...LOAD_MORE_SKH.map((height, index) => ({
        type: "skeleton",
        height,
        key: `trend-load-${feed.length}-${index}`,
      })),
    ];
  }, [feed, loadingMore]);

  const handleUse = useCallback((data) => {
    setInjected(data);
    setComposerOpen(true);
    clearTimeout(toastRef.current);
    setToast(true);
    toastRef.current = setTimeout(() => setToast(false), 3000);
  }, []);

  const handleSave = useCallback((id) => toggleSave(id), [toggleSave]);

  useEffect(() => () => clearTimeout(toastRef.current), []);

  // Scroll to top on niche change
  const prevNiche = useRef(niche);
  useEffect(() => {
    if (prevNiche.current !== niche) { window.scrollTo({ top: 0, behavior: "smooth" }); prevNiche.current = niche; }
  }, [niche]);

  return (
    <div style={{ minHeight: "100vh", background: C.canvas, fontFamily: "var(--font-body, system-ui, sans-serif)" }}>
      {/* Global CSS */}
      <style>{`
        @keyframes shimmer { 0%{background-position:100% 50%}100%{background-position:-100% 50%} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes pulse { 0%,100%{opacity:1;box-shadow:0 0 8px rgba(5,150,105,0.5)}50%{opacity:0.7;box-shadow:0 0 14px rgba(5,150,105,0.85)} }
        .tpills::-webkit-scrollbar,.tmasonry::-webkit-scrollbar{display:none}
        .tmasonry{display:flex;align-items:flex-start;width:auto;margin-left:-16px}
        .tmasonry_col{flex:1;min-width:0;padding-left:16px;background-clip:padding-box}
        .tmasonry_col > article,.tmasonry_col > .masonry-card{break-inside:avoid}
        @media(max-width:640px){
          .tmasonry{margin-left:-12px}
          .tmasonry_col{padding-left:12px}
          .t-topbar{flex-direction:column !important}
          .t-statbar{width:100%}
          .t-header-row{align-items:stretch !important}
          .t-brand{width:100%}
          .t-actions{width:100%;margin-left:0 !important}
          .t-actions button{flex:1}
        }
      `}</style>

      {/* ── STICKY HEADER ── */}
      <div style={{ 
        position: "sticky", 
        top: 0, 
        zIndex: 100, 
        background: "rgba(242,240,237,0.94)", 
        backdropFilter: "blur(20px) saturate(1.8)", 
        WebkitBackdropFilter: "blur(20px) saturate(1.8)", 
        borderBottom: `1px solid ${C.border}`, 
        padding: "12px 22px 10px",
        transform: headerVisible ? "translateY(0)" : "translateY(-100%)",
        transition: "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        willChange: "transform"
      }}>
        {/* Row 1 */}
        <div className="t-header-row" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10, flexWrap: "wrap" }}>
          {/* Brand */}
          <div className="t-brand" style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
            <div style={{ 
              width: 42, 
              height: 42, 
              background: C.white,
              border: `1.5px solid rgba(243, 115, 56, 0.15)`,
              borderRadius: 13, 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              boxShadow: "0 4px 12px rgba(243, 115, 56, 0.08)",
            }}>
              <Flame size={22} style={{ color: C.arc, filter: "none" }} aria-hidden />
            </div>
            <div>
              <h1 style={{ fontSize: 21, fontWeight: 820, color: C.ink, margin: 0, letterSpacing: 0, lineHeight: 1 }}>Trend Intelligence</h1>
              <p style={{ fontSize: 12, color: C.slate, margin: "3px 0 0", fontWeight: 620, letterSpacing: 0 }}>Live discovery desk</p>
            </div>
          </div>

          {/* Search */}
          <SearchBar value={search} onChange={setSearch} onClear={() => setSearch("")} />

          {/* Right buttons */}
          <div className="t-actions" style={{ display: "flex", gap: 8, flexShrink: 0, marginLeft: "auto" }}>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }} onClick={() => setSavedPanel(true)}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 14px", minHeight: 40, background: savedIds.size > 0 ? C.ink : C.white, border: `1px solid ${savedIds.size > 0 ? C.ink : C.border}`, borderRadius: 12, color: savedIds.size > 0 ? C.canvas : C.slate, fontSize: 12, fontWeight: 760, cursor: "pointer", fontFamily: "inherit", transition: "all 0.18s", boxShadow: "0 6px 16px rgba(20,20,19,0.04)" }}
              aria-label={`Saved (${savedIds.size})`}>
              <BookmarkCheck size={13} />
              {savedIds.size > 0 ? savedIds.size : "Saved"}
            </motion.button>

            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }} onClick={refetch} disabled={loading}
              style={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, color: C.slate, cursor: "pointer", transition: "all 0.18s", boxShadow: "0 6px 16px rgba(20,20,19,0.04)" }}
              aria-label="Refresh trends">
              <RefreshCw size={14} style={{ animation: loading ? "spin 0.85s linear infinite" : "none" }} />
            </motion.button>
          </div>
        </div>

        {/* Row 2: Filter pills */}
        <div className="tpills"><FilterPills active={niche} onChange={setNiche} /></div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ padding: "20px 22px 80px", maxWidth: 1780, margin: "0 auto" }}>
        {/* Toolbar */}
        <div className="t-topbar" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
          <div className="t-statbar"><StatsBar news={newsItems.length} memes={memeItems.length} videos={videoItems.length} total={feed.length} loading={loading} /></div>
          <SortToggle value={sort} onChange={setSort} />
        </div>

        {/* Error */}
        {error && !loading && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} style={{ padding: "16px 20px", background: "rgba(220,38,38,0.04)", border: "1px solid rgba(220,38,38,0.12)", borderRadius: 14, marginBottom: 18, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18 }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#dc2626", margin: "0 0 1px" }}>Couldn't load some data</p>
              <p style={{ fontSize: 11, color: C.slate, margin: 0 }}>{error}</p>
            </div>
            <button onClick={refetch} style={{ padding: "6px 13px", background: C.ink, color: C.canvas, border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Retry</button>
          </motion.div>
        )}

        {/* Loading skeletons */}
        {loading && feed.length === 0 && (
          <BalancedMasonry
            items={SKH.map((height, index) => ({ type: "skeleton", height, key: `initial-${index}` }))}
            renderItem={(entry, index, columnIndex) => (
              <Skeleton key={entry.key} dark={(index + columnIndex) % 3 === 1} imgH={entry.height} />
            )}
          />
        )}

        {/* Empty state */}
        {!loading && feed.length === 0 && search && <Empty search={search} onClear={() => setSearch("")} />}

        {/* Main feed */}
        {feed.length > 0 && (
          <BalancedMasonry
            items={masonryFeed}
            fillGaps
            renderItem={(entry, index, columnIndex) =>
              entry.type === "skeleton" || entry.type === "filler"
                ? <Skeleton key={entry.key} imgH={entry.height} dark={(index + columnIndex) % 2 === 1} />
                : entry.item._type === "meme"
                  ? <MemeCard key={entry.item._sid} item={entry.item} idx={index} onUse={handleUse} saved={savedIds.has(entry.item._sid)} onSave={handleSave} />
                  : entry.item._type === "video"
                    ? <VideoCard key={entry.item._sid} item={entry.item} idx={index} onUse={handleUse} saved={savedIds.has(entry.item._sid)} onSave={handleSave} />
                    : <NewsCard key={entry.item._sid} item={entry.item} idx={index} onUse={handleUse} saved={savedIds.has(entry.item._sid)} onSave={handleSave} />
            }
          />
        )}

        {/* Infinite scroll */}
        <Sentinel hasMore={hasMore} loading={loading || loadingMore} onMore={loadMore} count={feed.length} />

        {/* End of feed */}
        {!hasMore && feed.length > 0 && (
          <div style={{ textAlign: "center", padding: "48px 0 60px", display: "flex", flexDirection: "column", alignItems: "center", gap: 9 }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: C.ink, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CheckCircle2 size={18} style={{ color: C.arc }} />
            </div>
            <p style={{ fontSize: 13, color: C.slate, fontWeight: 700, margin: 0 }}>You've seen everything</p>
            <button onClick={refetch} style={{ padding: "8px 18px", background: "transparent", border: `1.5px solid ${C.border}`, borderRadius: 11, fontSize: 12, fontWeight: 700, color: C.slate, cursor: "pointer", fontFamily: "inherit" }}>Refresh for new trends</button>
          </div>
        )}
      </div>

      {/* Saved panel */}
      <SavedPanel open={savedPanel} onClose={() => setSavedPanel(false)} savedIds={savedIds} allItems={allFlat} onUse={handleUse} onSave={handleSave} />

      {/* Composer */}
      {composerOpen && (
        <Suspense fallback={null}>
          <ComposerModal isOpen={composerOpen} onClose={() => { setComposerOpen(false); setInjected(null); }}
            initialCaption={injected?.caption || ""} initialHashtags={injected?.hashtags || []}
            initialMediaUrls={[
              ...(injected?.images || []),
              ...(injected?.memes || []),
              ...(injected?.videoUrls || [])
            ].slice(0, 5)} />
        </Suspense>
      )}

      {/* Toast */}
      <Toast show={toast} />
    </div>
  );
}
