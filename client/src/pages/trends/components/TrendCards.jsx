import React, { memo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Bookmark, BookmarkCheck, Compass, Share2, Sparkles } from "lucide-react";
import { Img, doShare, timeAgo } from "./TrendUI";

function fmtNumber(n) {
  const value = Number(n);
  if (!Number.isFinite(value)) return null;
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}m`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return String(value);
}

function lifecycleLabel(value) {
  return String(value || "").replace(/^\w/, c => c.toUpperCase());
}

function safeHttpUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

export const NormalizedTrendCard = memo(function NormalizedTrendCard({ item, idx, saved, onSave }) {
  const [shareLabel, setShareLabel] = useState(null);
  const id = item._sid || item.id || item.url || item.title || String(idx);
  const externalUrl = safeHttpUrl(item.url);
  const badges = Array.isArray(item.platformBadges) && item.platformBadges.length ? item.platformBadges : [item.source].filter(Boolean);
  const engagement = [
    ["Likes", item.engagement?.likes],
    ["Comments", item.engagement?.comments],
    ["Shares", item.engagement?.shares],
    ["Views", item.engagement?.views],
    ["Score", item.engagement?.score],
  ].map(([label, value]) => [label, fmtNumber(value)]).filter(([, value]) => value && value !== "0");
  const detailId = encodeURIComponent(item.clusterId || item.id || id);
  const lifecycle = lifecycleLabel(item.lifecycle);

  const rememberTrend = () => {
    try {
      sessionStorage.setItem(`trend:${detailId}`, JSON.stringify(item));
      sessionStorage.setItem(`trend:${decodeURIComponent(detailId)}`, JSON.stringify(item));
    } catch {}
  };

  const handleShare = async () => {
    const r = await doShare(item.title, externalUrl);
    setShareLabel(r === "copied" ? "Copied!" : r === "shared" ? "Shared!" : null);
    if (r) setTimeout(() => setShareLabel(null), 2200);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(idx * 0.02, 0.18), ease: [0.23, 1, 0.32, 1] }}
      className="mb-5 flex flex-col overflow-hidden rounded-lg border border-[#d3cec6] bg-white transition-colors duration-200 hover:border-zinc-900"
    >
      {item.image && (
        <div className="relative border-b border-[#d3cec6]">
          <Img src={item.image} alt={item.title} />
        </div>
      )}

      <div className="p-4">
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          {badges.map(badge => (
            <span key={badge} className="rounded-md border border-[#d3cec6] bg-[#f5f1ec] px-2 py-0.5 text-[10px] font-medium text-zinc-700">
              {badge}
            </span>
          ))}
          {item.category && <span className="rounded-md border border-[#d3cec6] bg-white px-2 py-0.5 text-[10px] font-medium text-zinc-700">{item.category}</span>}
          {lifecycle && <span className="rounded-md bg-zinc-900 px-2 py-0.5 text-[10px] font-medium text-white">{lifecycle}</span>}
        </div>

        <h3 className="mb-2 line-clamp-3 text-[15px] font-semibold leading-snug text-zinc-900">
          {item.title || "Untitled trend"}
        </h3>
        {item.summary && <p className="mb-4 line-clamp-3 text-[13px] leading-relaxed text-zinc-600">{item.summary}</p>}

        <div className="mb-4 grid grid-cols-2 border-y border-[#ebe7e1] text-xs">
          {Number.isFinite(item.score) && (
            <div className="border-r border-b border-[#ebe7e1] px-3 py-2">
              <div className="text-zinc-600">Trend Score</div>
              <div className="font-semibold text-zinc-900">{item.score}/100</div>
            </div>
          )}
          {Number.isFinite(item.opportunityScore) && (
            <div className="border-b border-[#ebe7e1] px-3 py-2">
              <div className="text-zinc-600">Opportunity</div>
              <div className="font-semibold text-zinc-900">{item.opportunityScore}/100</div>
            </div>
          )}
          <div className="border-r border-[#ebe7e1] px-3 py-2">
            <div className="text-zinc-600">Platforms</div>
            <div className="font-semibold text-zinc-900">{item.crossPlatformCount || badges.length || 1}</div>
          </div>
          {item.publishedAt && (
            <div className="px-3 py-2">
              <div className="text-zinc-600">Published</div>
              <div className="font-semibold text-zinc-900">{timeAgo(item.publishedAt)}</div>
            </div>
          )}
        </div>

        {engagement.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {engagement.map(([label, value]) => (
              <span key={label} className="rounded-md border border-[#d3cec6] bg-[#f5f1ec] px-2 py-1 text-[11px] text-zinc-600">
                <b className="text-zinc-900">{value}</b> {label}
              </span>
            ))}
          </div>
        )}

        <div className="mb-4 h-px bg-[#ebe7e1]" />
        <div className="flex flex-wrap items-center gap-2">
          <Link to={`/dashboard/trends/${detailId}#generate-content`} state={{ item }} onClick={rememberTrend} className="flex min-h-9 flex-1 items-center justify-center gap-2 rounded-lg border border-zinc-900 bg-zinc-900 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-black sm:flex-none">
            <Sparkles className="w-3.5 h-3.5" /> Create Content
          </Link>
          <Link to={`/dashboard/trends/${detailId}`} state={{ item }} onClick={rememberTrend} className="flex min-h-9 flex-1 items-center justify-center gap-2 rounded-lg border border-[#d3cec6] bg-white px-3 py-2 text-xs font-medium text-zinc-700 transition-colors hover:border-zinc-900 hover:text-zinc-900 sm:flex-none">
            <Compass className="w-3.5 h-3.5" /> Explore Trend
          </Link>
          <div className="ml-auto flex items-center gap-1.5">
            <button onClick={() => onSave(id)} className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${saved ? "border-[#d3cec6] bg-[#ebe7e1] text-zinc-900" : "border-transparent bg-transparent text-zinc-500 hover:border-[#d3cec6] hover:bg-[#f5f1ec] hover:text-zinc-900"}`} aria-label={saved ? "Unsave trend" : "Save trend"}>
              {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            </button>
            <button onClick={handleShare} className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${shareLabel ? "border-[#d3cec6] bg-[#ebe7e1] text-zinc-900" : "border-transparent bg-transparent text-zinc-500 hover:border-[#d3cec6] hover:bg-[#f5f1ec] hover:text-zinc-900"}`} aria-label={shareLabel || "Share trend"}>
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  );
});

export const Skeleton = memo(function Skeleton({ dark, imgH = 160 }) {
  return (
    <div className={`mb-5 overflow-hidden rounded-lg border ${dark ? "border-zinc-800 bg-zinc-950" : "border-[#d3cec6] bg-white"}`}>
      <div className={`animate-pulse ${dark ? "bg-zinc-900" : "bg-[#ebe7e1]"}`} style={{ height: imgH }} />
      <div className="p-5">
        {[88, 68, 50].map((w, i) => (
          <div key={i} className={`mb-3 w-full animate-pulse rounded ${dark ? "bg-zinc-900" : "bg-[#ebe7e1]"}`} style={{ height: i === 0 ? 14 : 10, maxWidth: `${w}%` }} />
        ))}
        <div className={`mt-4 h-9 w-24 animate-pulse rounded-lg ${dark ? "bg-zinc-900" : "bg-[#ebe7e1]"}`} />
      </div>
    </div>
  );
});
