/**
 * TrendGrid.jsx — Masonry grid wrapper
 * ────────────────────────────────────────────────────────────────
 * NOTE: The new AllTrendsPage.jsx is fully self-contained and
 * renders its own masonry grid. This file is kept for backwards
 * compatibility if any other page imports TrendGrid directly.
 *
 * Replace: client/src/pages/trends/components/TrendGrid.jsx
 * ────────────────────────────────────────────────────────────────
 */

import React, { memo, useEffect, useRef } from "react";
import Masonry from "react-masonry-css";
import { motion } from "framer-motion";
import TrendCard from "./TrendCard";
import MemeCard from "./MemeCard";

const BREAKPOINTS = { default: 3, 1280: 3, 1024: 2, 768: 2, 640: 1 };

const SkeletonCard = memo(function SkeletonCard({ h = 400 }) {
  return (
    <div style={{
      background: "#fcfbfa", borderRadius: 20, marginBottom: 20, overflow: "hidden",
      border: "1px solid rgba(20,20,19,0.07)", height: h,
    }}>
      <div style={{
        height: 180, margin: 12, borderRadius: 14,
        background: "linear-gradient(90deg,rgba(20,20,19,0.04) 25%,rgba(20,20,19,0.09) 50%,rgba(20,20,19,0.04) 75%)",
        backgroundSize: "400% 100%", animation: "shimmer 1.5s ease-in-out infinite",
      }} />
      {[88, 62, 50].map((w, i) => (
        <div key={i} style={{
          height: i === 0 ? 16 : 11, width: `${w}%`, margin: "0 16px 10px",
          borderRadius: 6, background: "rgba(20,20,19,0.06)",
          animation: "shimmer 1.5s ease-in-out infinite",
        }} />
      ))}
      <style>{`@keyframes shimmer{0%{background-position:100% 50%}100%{background-position:-100% 50%}}`}</style>
    </div>
  );
});

const EmptyState = () => (
  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
    style={{ textAlign: "center", padding: "60px 20px" }}>
    <div style={{ fontSize: 44, marginBottom: 10 }}>🤷</div>
    <h3 style={{ fontSize: 17, fontWeight: 700, color: "#141413", margin: "0 0 5px" }}>No trends found</h3>
    <p style={{ fontSize: 13, color: "#696969", margin: 0 }}>Try changing your filters or clearing the search.</p>
  </motion.div>
);

const TrendGrid = memo(function TrendGrid({
  trends = [], loading = false, loadingMore = false,
  hasMore = false, error = null, onLoadMore, onUseIdea,
}) {
  const sentinelRef = useRef(null);

  useEffect(() => {
    if (loading || !hasMore) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting && !loadingMore) onLoadMore?.(); },
      { rootMargin: "400px", threshold: 0 }
    );
    if (sentinelRef.current) obs.observe(sentinelRef.current);
    return () => obs.disconnect();
  }, [loading, loadingMore, hasMore, onLoadMore]);

  if (loading && trends.length === 0) {
    return (
      <Masonry breakpointCols={BREAKPOINTS} className="masonry-grid" columnClassName="masonry-grid_column">
        {[480, 360, 520, 440, 490, 420].map((h, i) => <SkeletonCard key={i} h={h} />)}
      </Masonry>
    );
  }

  if (!loading && trends.length === 0) return <EmptyState />;

  return (
    <>
      <Masonry breakpointCols={BREAKPOINTS} className="masonry-grid" columnClassName="masonry-grid_column">
        {trends.map((item, i) =>
          item.discoveryType === "meme"
            ? <MemeCard key={item.id || i} meme={item} index={i} onUseIdea={onUseIdea} />
            : <TrendCard key={item.id || i} trend={item} newsItem={item.newsItem} index={i} onUseIdea={onUseIdea} />
        )}
      </Masonry>

      <div ref={sentinelRef} style={{ height: 60, display: "flex", alignItems: "center", justifyContent: "center", margin: "32px 0" }}>
        {loadingMore && (
          <div style={{ width: 28, height: 28, borderRadius: "50%", border: "3px solid rgba(20,20,19,0.07)", borderTopColor: "#f37338", animation: "spin 0.65s linear infinite" }} />
        )}
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>

      {!hasMore && trends.length > 0 && (
        <div style={{ textAlign: "center", padding: "48px 0", color: "#696969", fontSize: 14, fontWeight: 700 }}>
          ✨ You've seen all the trends!
        </div>
      )}
    </>
  );
});

export default TrendGrid;
