import React, { useRef, useState, memo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Search, X } from "lucide-react";

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
  if (navigator.share) {
    try {
      await navigator.share({ title, url: url || location.href });
      return "shared";
    } catch {}
  }
  try {
    await navigator.clipboard.writeText(url || location.href);
    return "copied";
  } catch {}
  return false;
}

export const Img = memo(function Img({ src, alt = "", className = "" }) {
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState(false);
  const fb = `https://placehold.co/600x400/f4f4f5/a1a1aa?text=${encodeURIComponent((alt || "").substring(0, 18) || "Media")}`;
  const finalSrc = err || !src ? fb : src;

  return (
    <div className={`relative flex min-h-[140px] max-h-[500px] w-full items-center justify-center overflow-hidden bg-[#ebe7e1] ${className}`}>
      <div
        className="absolute inset-0 scale-125 bg-cover bg-center opacity-40 blur-2xl transition-opacity duration-1000"
        style={{ backgroundImage: `url(${finalSrc})` }}
      />
      {!ok && <div className="absolute inset-0 animate-pulse bg-[#ebe7e1]" />}
      <img
        src={finalSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setOk(true)}
        onError={() => {
          setErr(true);
          setOk(true);
        }}
        className={`relative z-10 block h-auto max-h-[500px] w-auto max-w-full object-contain transition-all duration-700 ease-out ${ok ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}
      />
    </div>
  );
});

export const Btn = memo(function Btn({ icon, label, onClick, active, tiny }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={e => {
        e.stopPropagation();
        onClick?.();
      }}
      aria-label={label}
      title={label}
      className={`flex items-center justify-center rounded-lg border font-medium whitespace-nowrap transition-all
        ${tiny ? "gap-1.5 px-2.5 py-1.5 text-[11px]" : "gap-2 px-4 py-2 text-xs"}
        ${active
          ? "border-zinc-900 bg-zinc-900 text-white shadow-sm"
          : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900"}`}
    >
      {icon}
      {label && <span>{label}</span>}
    </motion.button>
  );
});

export const SearchBar = memo(function SearchBar({ value, onChange, onClear }) {
  const ref = useRef(null);
  const [focused, setFocused] = useState(false);
  return (
    <div className="relative min-w-[220px] max-w-[720px] flex-1">
      <Search className={`absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors ${focused ? "text-zinc-900" : "text-zinc-500"}`} />
      <input
        ref={ref}
        type="search"
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Search trends, news, topics..."
        aria-label="Search trends"
        autoComplete="off"
        className={`h-10 w-full rounded-lg border py-2.5 pl-10 pr-10 text-sm font-medium text-zinc-900 outline-none transition-all placeholder:text-zinc-500
          ${focused ? "border-zinc-900 bg-white ring-2 ring-zinc-900/5" : "border-zinc-200 bg-white hover:border-zinc-300"}`}
      />
      <AnimatePresence>
        {value && (
          <motion.button
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            onClick={() => {
              onClear();
              ref.current?.focus();
            }}
            className="absolute right-3 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-zinc-400 transition-colors hover:text-zinc-800"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
});

export const StatsBar = memo(function StatsBar({
  news = 0,
  reddit = 0,
  memes,
  videos = 0,
  bluesky = 0,
  mastodon = 0,
  lemmy = 0,
  hackernews = 0,
  github = 0,
  wikipedia = 0,
  devto = 0,
  stackexchange = 0,
  total,
  loading,
}) {
  const community = reddit ?? memes ?? 0;
  const social = bluesky + mastodon + lemmy;
  const dev = hackernews + github + devto + stackexchange;
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-zinc-600">
      {loading ? (
        <span className="flex items-center gap-2">
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
          Updating feed...
        </span>
      ) : (
        <>
          <span><b className="font-semibold text-zinc-900">{total}</b> stories</span>
          <div className="h-1 w-1 rounded-full bg-[#d3cec6]" />
          <span><b className="font-semibold text-zinc-900">{news}</b> news</span>
          <div className="h-1 w-1 rounded-full bg-[#d3cec6]" />
          <span><b className="font-semibold text-zinc-900">{videos}</b> videos</span>
          <div className="h-1 w-1 rounded-full bg-[#d3cec6]" />
          <span><b className="font-semibold text-zinc-900">{community}</b> reddit</span>
          <div className="h-1 w-1 rounded-full bg-[#d3cec6]" />
          <span><b className="font-semibold text-zinc-900">{social}</b> social</span>
          <div className="h-1 w-1 rounded-full bg-[#d3cec6]" />
          <span><b className="font-semibold text-zinc-900">{dev}</b> dev</span>
          <div className="h-1 w-1 rounded-full bg-[#d3cec6]" />
          <span><b className="font-semibold text-zinc-900">{wikipedia}</b> wiki</span>
        </>
      )}
    </div>
  );
});

export const Empty = ({ search, onClear }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mx-auto mt-10 max-w-md px-5 py-24 text-center">
    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100">
      <Search className="h-6 w-6 text-zinc-400" />
    </div>
    <h3 className="mb-1 text-lg font-semibold text-zinc-900">No results for "{search}"</h3>
    <p className="mb-6 text-sm text-zinc-500">Try adjusting your filters or search terms.</p>
    <button onClick={onClear} className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-zinc-800">
      Clear search
    </button>
  </motion.div>
);

export const Toast = ({ show }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        role="status"
        aria-live="polite"
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="fixed bottom-8 left-1/2 z-[9999] flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-lg border border-white/10 bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white shadow-xl"
      >
        <CheckCircle2 className="h-4 w-4 text-white" />
        Added to Composer
      </motion.div>
    )}
  </AnimatePresence>
);
