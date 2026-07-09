import React, { useState, useRef, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, X, Bookmark, BookmarkCheck, CheckCircle2,
  ChevronDown, Lightbulb, Zap, Globe, Music, Activity, 
  Cpu, BarChart2, Trophy, Tv2, Flame
} from "lucide-react";

// ─── UTILS ──────────────────────────────────────────────────────
export function hashScore(str, lo = 72, hi = 99) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) { h = ((h << 5) + h) ^ str.charCodeAt(i); h = h >>> 0; }
  return lo + (h % (hi - lo + 1));
}

export const NICHES = [
  { id: "AI & Tech",     emoji: "🤖", kw: ["ai","chatgpt","openai","tech","apple","google","gpt","llm","software","startup","developer"] },
  { id: "Trading",       emoji: "📈", kw: ["stock","market","nifty","sensex","trading","invest","fund","equity","forex","gold","sebi"] },
  { id: "Crypto",        emoji: "₿",  kw: ["crypto","bitcoin","btc","ethereum","web3","nft","defi","blockchain"] },
  { id: "Sports",        emoji: "🏆", kw: ["ipl","cricket","football","sport","match","tournament","league","f1","nba","fifa","tennis"] },
  { id: "Entertainment", emoji: "🎬", kw: ["movie","film","series","netflix","celebrity","bollywood","anime","ott","drama","actor"] },
  { id: "Music",         emoji: "🎵", kw: ["music","song","album","artist","rapper","singer","spotify","concert","dj","remix"] },
  { id: "Business",      emoji: "💼", kw: ["startup","business","entrepreneur","company","ceo","funding","revenue","saas","product"] },
  { id: "Politics",      emoji: "🏛️", kw: ["politics","election","government","minister","parliament","policy","law","modi","bjp","congress"] },
  { id: "Fitness",       emoji: "💪", kw: ["gym","fitness","workout","diet","health","exercise","nutrition","yoga","protein","abs"] },
];

export function detectNiche(text) {
  const t = (text || "").toLowerCase();
  for (const n of NICHES) if (n.kw.some(k => t.includes(k))) return n;
  return { id: "Trending", emoji: "🔥" };
}

export function genIdeas(title, nicheId) {
  const t = (title || "this trend").substring(0, 50);
  return [
    `🎯 My honest take on: ${t}`,
    `🧵 What every ${nicheId} creator must know this week`,
    `⚡ 60-second explainer: ${t}`,
    `💬 Poll: Does this change anything for you?`,
  ];
}

export function fmtUpvotes(n) {
  if (!n) return "1.4k";
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

export function timeAgo(d) {
  if (!d) return "just now";
  const m = Math.floor((Date.now() - new Date(d)) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export async function doShare(title, url) {
  if (navigator.share) { try { await navigator.share({ title, url: url || location.href }); return "shared"; } catch {} }
  try { await navigator.clipboard.writeText(url || location.href); return "copied"; } catch {}
  return false;
}

// ─── LAZY IMAGE WITH BLUR BACKDROP ──────────────────────────────
export const Img = memo(function Img({ src, alt = "", className = "" }) {
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState(false);
  // Elegant fallback
  const fb = `https://placehold.co/600x400/f4f4f5/a1a1aa?text=${encodeURIComponent((alt || "").substring(0, 18) || "Media")}`;
  const finalSrc = err ? fb : src;

  return (
    <div className={`relative flex items-center justify-center overflow-hidden bg-zinc-100/50 min-h-[140px] max-h-[500px] w-full ${className}`}>
      {/* Blurred background layer to fill gaps and prevent stretching */}
      <div 
        className="absolute inset-0 bg-cover bg-center blur-2xl scale-125 opacity-40 transition-opacity duration-1000" 
        style={{ backgroundImage: `url(${finalSrc})` }} 
      />
      {!ok && <div className="absolute inset-0 animate-pulse bg-zinc-200/50" />}
      
      {/* Main Image - w-auto prevents stretching small images, max-h restricts tall memes */}
      <img src={finalSrc} alt={alt} loading="lazy" decoding="async"
        onLoad={() => setOk(true)} onError={() => { setErr(true); setOk(true); }}
        className={`relative z-10 w-auto h-auto max-w-full max-h-[500px] object-contain block transition-all duration-700 ease-out ${ok ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
      />
    </div>
  );
});

// ─── SCORE PILL ─────────────────────────────────────────────────
export const Score = ({ n }) => {
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-zinc-200/60 bg-white/80 backdrop-blur-md text-[10px] font-bold tracking-wide text-zinc-700 shadow-sm whitespace-nowrap">
      <span className="w-1 h-1 rounded-full bg-zinc-900" />
      {n}% VIRAL
    </span>
  );
};

// ─── NICHE BADGE ────────────────────────────────────────────────
export const NicheBadge = ({ niche }) => (
  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/80 backdrop-blur-md border border-zinc-200/60 text-[10px] font-semibold text-zinc-700 tracking-wide shadow-sm whitespace-nowrap">
    <span>{niche.emoji}</span>{niche.id}
  </span>
);

// ─── ACTION BUTTON ──────────────────────────────────────────────
export const Btn = memo(function Btn({ icon, label, onClick, active, tiny }) {
  return (
    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
      onClick={e => { e.stopPropagation(); onClick?.(); }}
      aria-label={label} title={label}
      className={`flex items-center justify-center rounded-lg font-medium whitespace-nowrap transition-all border
        ${tiny ? 'gap-1.5 px-2.5 py-1.5 text-[11px]' : 'gap-2 px-4 py-2 text-xs'}
        ${active 
          ? 'bg-zinc-900 border-zinc-900 text-white shadow-sm' 
          : 'bg-white border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 hover:border-zinc-300'}`}
    >
      {icon}
      {label && <span>{label}</span>}
    </motion.button>
  );
});

// ─── IDEAS DRAWER ────────────────────────────────────────────────
export const IdeasDrawer = memo(function IdeasDrawer({ ideas, hashtags, onUse }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-2">
      <button onClick={e => { e.stopPropagation(); setOpen(p => !p); }}
        className="flex items-center gap-1.5 w-full py-2 text-xs font-medium text-zinc-500 hover:text-zinc-800 transition-colors"
      >
        <Lightbulb className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
        {ideas.length} content ideas
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-3.5 h-3.5" />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="pt-1 pb-3 flex flex-col gap-1.5">
              {ideas.slice(0, 3).map((idea, i) => (
                <button key={i} onClick={e => { e.stopPropagation(); onUse(idea); }}
                  className="flex items-start gap-2.5 px-3 py-2.5 bg-zinc-50/50 hover:bg-zinc-100 rounded-lg text-left transition-colors group"
                >
                  <span className="w-4 h-4 rounded-full border border-zinc-200 bg-white text-zinc-500 flex items-center justify-center text-[9px] font-bold mt-0.5 group-hover:border-zinc-400 group-hover:text-zinc-900 transition-colors shrink-0">{i + 1}</span>
                  <span className="text-xs text-zinc-700 font-medium leading-relaxed group-hover:text-zinc-900">{idea}</span>
                </button>
              ))}
              {hashtags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {hashtags.slice(0, 5).map(h => (
                    <span key={h} className="text-[10px] text-zinc-400 font-medium">
                      {h.startsWith("#") ? h : `#\${h}`}
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

// ─── SEARCH BAR ─────────────────────────────────────────────────
export const SearchBar = memo(function SearchBar({ value, onChange, onClear }) {
  const ref = useRef(null);
  const [focused, setFocused] = useState(false);
  return (
    <div className="relative flex-1 min-w-[220px] max-w-[680px]">
      <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${focused ? 'text-zinc-800' : 'text-zinc-400'}`} />
      <input ref={ref} type="search" value={value} onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        placeholder="Search trends, news, topics…" aria-label="Search trends" autoComplete="off"
        className={`w-full py-2.5 pl-10 pr-10 bg-zinc-100/50 hover:bg-zinc-100 border rounded-lg text-sm font-medium text-zinc-900 outline-none transition-all
          ${focused ? 'border-zinc-300 bg-white shadow-sm ring-2 ring-zinc-900/5' : 'border-transparent'}`}
      />
      <AnimatePresence>
        {value && (
          <motion.button initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }}
            onClick={() => { onClear(); ref.current?.focus(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full text-zinc-400 hover:text-zinc-800 transition-colors"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
});

// ─── FILTER PILLS ────────────────────────────────────────────────
const PILLS = [
  { id: "All",           icon: <Zap className="w-3.5 h-3.5" /> },
  { id: "AI & Tech",     icon: <Cpu className="w-3.5 h-3.5" /> },
  { id: "Trading",       icon: <BarChart2 className="w-3.5 h-3.5" /> },
  { id: "Crypto",        icon: <Activity className="w-3.5 h-3.5" /> },
  { id: "Sports",        icon: <Trophy className="w-3.5 h-3.5" /> },
  { id: "Entertainment", icon: <Tv2 className="w-3.5 h-3.5" /> },
  { id: "Business",      icon: <Activity className="w-3.5 h-3.5" /> },
  { id: "Music",         icon: <Music className="w-3.5 h-3.5" /> },
  { id: "Politics",      icon: <Globe className="w-3.5 h-3.5" /> },
  { id: "Fitness",       icon: <Flame className="w-3.5 h-3.5" /> },
];

export const FilterPills = memo(function FilterPills({ active, onChange }) {
  const scrollRef = useRef(null);
  const select = (id) => {
    onChange(id);
    const el = scrollRef.current?.querySelector(`[data-pid="${id}"]`);
    el?.scrollIntoView({ inline: "center", behavior: "smooth", block: "nearest" });
  };
  return (
    <div ref={scrollRef} role="tablist" aria-label="Filter by category" className="flex gap-1.5 overflow-x-auto py-1 no-scrollbar">
      {PILLS.map(({ id, icon }) => {
        const on = active === id;
        return (
          <button key={id} data-pid={id} role="tab" aria-selected={on} onClick={() => select(id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex-shrink-0
              ${on ? 'bg-zinc-900 text-white shadow-sm' : 'bg-transparent text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800'}`}
          >
            <span className={on ? 'opacity-100' : 'opacity-70'}>{icon}</span>
            {id}
          </button>
        );
      })}
    </div>
  );
});

// ─── SORT TOGGLE ────────────────────────────────────────────────
const ADVANCED_SORTS = [
  { id: "score", label: "Trending" },
  { id: "latest", label: "Latest" },
  { id: "saved", label: "Saved" },
];
export const SortToggle = memo(function SortToggle({ value, onChange }) {
  return (
    <div className="flex bg-zinc-100/80 p-1 rounded-lg shrink-0 border border-zinc-200/60">
      {ADVANCED_SORTS.map(o => (
        <button key={o.id} onClick={() => onChange(o.id)}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap
            ${value === o.id ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200/50' : 'text-zinc-500 hover:text-zinc-700'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
});

// ─── STATS BAR ──────────────────────────────────────────────────
export const StatsBar = memo(function StatsBar({ news, memes, videos = 0, total, loading }) {
  return (
    <div className="flex items-center gap-3 text-xs text-zinc-500 flex-wrap">
      {loading ? (
        <span className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full border-2 border-zinc-300 border-t-zinc-900 animate-spin" />
          Updating feed…
        </span>
      ) : (
        <>
          <span><b className="text-zinc-900 font-semibold">{total}</b> stories</span>
          <div className="w-1 h-1 rounded-full bg-zinc-300" />
          <span><b className="text-zinc-900 font-semibold">{news}</b> news</span>
          <div className="w-1 h-1 rounded-full bg-zinc-300" />
          <span><b className="text-zinc-900 font-semibold">{videos}</b> videos</span>
          <div className="w-1 h-1 rounded-full bg-zinc-300" />
          <span><b className="text-zinc-900 font-semibold">{memes}</b> community</span>
        </>
      )}
    </div>
  );
});

// ─── EMPTY STATE ────────────────────────────────────────────────
export const Empty = ({ search, onClear }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-24 px-5 max-w-md mx-auto mt-10">
    <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <Search className="w-6 h-6 text-zinc-400" />
    </div>
    <h3 className="text-lg font-semibold text-zinc-900 mb-1">No results for "{search}"</h3>
    <p className="text-sm text-zinc-500 mb-6">Try adjusting your filters or search terms.</p>
    <button onClick={onClear} className="px-5 py-2.5 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors shadow-sm">
      Clear search
    </button>
  </motion.div>
);

// ─── TOAST ──────────────────────────────────────────────────────
export const Toast = ({ show }) => (
  <AnimatePresence>
    {show && (
      <motion.div role="status" aria-live="polite"
        initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-zinc-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium z-[9999] flex items-center gap-2 shadow-xl border border-white/10 whitespace-nowrap"
      >
        <CheckCircle2 className="w-4 h-4 text-white" />
        Added to Composer
      </motion.div>
    )}
  </AnimatePresence>
);
