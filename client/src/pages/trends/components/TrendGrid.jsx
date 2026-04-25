import React, { memo, useMemo, useEffect, useRef } from "react";
import Masonry from "react-masonry-css";
import { motion } from "framer-motion";
import TrendCard from "./TrendCard";
import MemeCard from "./MemeCard";

const BREAKPOINTS = {
  default: 3,
  1280: 3,
  1024: 2,
  768: 2,
  640: 1,
};

/**
 * SkeletonCard — shimmer placeholder for loading state.
 */
const SkeletonCard = memo(function SkeletonCard({ height = 340 }) {
  return (
    <div
      className="masonry-card skeleton-card"
      style={{ height, marginBottom: 24 }}
    >
      <div
        className="skeleton-shimmer"
        style={{ height: "100%", borderRadius: 24 }}
      />
    </div>
  );
});

/**
 * EmptyState — shown when no trends match filters.
 */
const EmptyState = () => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    style={{
      gridColumn: "1/-1",
      textAlign: "center",
      padding: "64px 20px",
    }}
  >
    <div style={{ fontSize: 48, marginBottom: 12 }}>🤷</div>
    <h3
      style={{
        fontSize: 18,
        fontWeight: 700,
        color: "var(--ink)",
        margin: "0 0 6px",
      }}
    >
      No trends found
    </h3>
    <p style={{ fontSize: 13, color: "var(--slate)", margin: 0 }}>
      Try changing your filters or clearing the search.
    </p>
  </motion.div>
);

/**
 * TrendGrid — masonry layout for TrendCards with Infinite Scroll.
 */
const TrendGrid = memo(function TrendGrid({
  trends,
  apiData,
  loading,
  loadingMore,
  hasMore,
  onLoadMore,
  onUseIdea,
}) {
  const sentinelRef = useRef(null);

  const skeletons = useMemo(
    () => [
      { id: "sk1", h: 480 },
      { id: "sk2", h: 360 },
      { id: "sk3", h: 520 },
      { id: "sk4", h: 440 },
      { id: "sk5", h: 490 },
      { id: "sk6", h: 420 },
    ],
    [],
  );

  // ── Infinite Scroll Observer ──
  useEffect(() => {
    if (loading || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore) {
          onLoadMore();
        }
      },
      { threshold: 0.1 },
    );

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => observer.disconnect();
  }, [loading, loadingMore, hasMore, onLoadMore]);

  if (loading && trends.length === 0) {
    return (
      <Masonry
        breakpointCols={BREAKPOINTS}
        className="masonry-grid"
        columnClassName="masonry-grid_column"
      >
        {skeletons.map((s) => (
          <SkeletonCard key={s.id} height={s.h} />
        ))}
      </Masonry>
    );
  }

  if (!trends.length && !loading) {
    return <EmptyState />;
  }

  return (
    <>
      <Masonry
        breakpointCols={BREAKPOINTS}
        className="masonry-grid"
        columnClassName="masonry-grid_column"
      >
        {trends.map((item, i) => {
          if (item.discoveryType === 'meme') {
            return (
              <MemeCard
                key={item.id}
                meme={item}
                index={i}
                onUseIdea={onUseIdea}
              />
            );
          }

          return (
            <TrendCard
              key={item.id || i}
              trend={item}
              newsItem={item.newsItem}
              images={[]} 
              index={i}
              onUseIdea={onUseIdea}
            />
          );
        })}
      </Masonry>

      {/* Sentinel for Infinite Scroll */}
      <div
        ref={sentinelRef}
        style={{
          height: 60,
          margin: "40px 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {loadingMore && (
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              border: "3px solid rgba(20,20,19,0.08)",
              borderTopColor: "var(--arc)",
              animation: "spin 0.6s linear infinite",
            }}
          />
        )}
      </div>

      {!hasMore && trends.length > 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "60px 0",
            color: "var(--slate)",
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          ✨ You've reached the end of the trends!
        </div>
      )}
    </>
  );
});

export default TrendGrid;
