import React, { useState, useEffect, useMemo, useRef } from "react";

// ─── INFINITE SCROLL SENTINEL ───────────────────────────────────
export function Sentinel({ hasMore, loading, onMore, count }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!hasMore || loading) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        onMore();
      }
    }, { rootMargin: "800px" });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [hasMore, loading, onMore, count]);

  if (!hasMore && count > 0) return null;
  return (
    <div ref={ref} className="py-16 flex justify-center">
      {loading && (
        <div className="flex items-center gap-3 text-sm font-medium text-zinc-500">
          <div className="w-5 h-5 rounded-full border-[2.5px] border-zinc-200 border-t-zinc-900 animate-spin" />
          Summoning intelligence…
        </div>
      )}
    </div>
  );
}

// ─── MASONRY LAYOUT ─────────────────────────────────────────────
const COLS = [
  { w: 0, c: 1 },
  { w: 680, c: 2 },
  { w: 1024, c: 3 },
  { w: 1440, c: 4 },
];

export function useMasonryColumns(breakpoints) {
  const [count, setCount] = useState(3);

  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth;
      let c = 1;
      for (const bp of breakpoints) {
        if (w >= bp.w) c = bp.c;
      }
      if (c !== count) setCount(c);
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoints, count]);

  return count;
}

export function estimateTrendHeight(entry) {
  if (entry.type === "skeleton" || entry.type === "filler") return (entry.height || 160) + 96;

  const item = entry.item;
  const titleLength = (item.title || "").length;
  const titleLines = Math.min(3, Math.max(1, Math.ceil(titleLength / 42)));
  const titleHeight = titleLines * 21;

  if (item._type === "reddit") {
    const mediaHeight = item.isVideo ? 460 : item.image ? 360 : 0;
    return mediaHeight + titleHeight + 92;
  }

  if (item._type === "youtube") {
    return 250 + titleHeight + 102;
  }

  if (["bluesky", "mastodon", "lemmy"].includes(item._type)) {
    return (item.image ? 245 : 0) + titleHeight + 150;
  }

  const mediaHeight = item.image ? 245 : 0;
  return mediaHeight + titleHeight + 138;
}

export function BalancedMasonry({ items, renderItem, estimateHeight = estimateTrendHeight, fillGaps = false }) {
  const columnCount = useMasonryColumns(COLS);

  const columns = useMemo(() => {
    const next = Array.from({ length: columnCount }, () => ({ height: 0, items: [] }));

    items.forEach((item) => {
      let target = 0;
      for (let i = 1; i < next.length; i++) {
        if (next[i].height < next[target].height) target = i;
      }

      next[target].items.push(item);
      next[target].height += estimateHeight(item) + 24; // Increased gap in estimation
    });

    if (fillGaps && items.length >= columnCount) {
      const tallest = Math.max(...next.map(column => column.height));
      const fillerPattern = [190, 250, 150, 220];

      next.forEach((column, columnIndex) => {
        let fillerIndex = 0;
        while (tallest - column.height > 190 && fillerIndex < 3) {
          const remaining = tallest - column.height - 24;
          const height = Math.max(130, Math.min(fillerPattern[(columnIndex + fillerIndex) % fillerPattern.length], remaining - 76));
          const filler = {
            type: "filler",
            height,
            key: `gap-filler-${columnIndex}-${fillerIndex}-${items.length}`,
          };

          column.items.push(filler);
          column.height += estimateHeight(filler) + 24;
          fillerIndex += 1;
        }
      });
    }

    return next;
  }, [items, columnCount, estimateHeight, fillGaps]);

  return (
    // Increased negative margin for wider gaps
    <div className="flex items-start -ml-6">
      {columns.map((column, columnIndex) => (
        // Increased padding left for wider gaps
        <div className="flex-1 min-w-0 pl-6 bg-clip-padding" key={`col-${columnIndex}`}>
          {column.items.map((item, index) => renderItem(item, index, columnIndex))}
        </div>
      ))}
    </div>
  );
}
