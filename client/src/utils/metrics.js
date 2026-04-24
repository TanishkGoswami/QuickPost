import { useMemo } from 'react';

/**
 * Deterministic pseudo-random number generator based on a string seed
 */
const seededRandom = (seed) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const x = Math.sin(hash) * 10000;
  return x - Math.floor(x);
};

/**
 * Hook to generate stable, deterministic engagement metrics based on post content
 */
export const usePlatformMetrics = (caption = "") => {
  return useMemo(() => {
    const seed = caption || "default_seed";
    const r1 = seededRandom(seed);
    const r2 = seededRandom(seed + "likes");
    const r3 = seededRandom(seed + "comments");
    const r4 = seededRandom(seed + "shares");

    return {
      likes: Math.floor(r1 * 1500) + 50,
      views: Math.floor(r2 * 25000) + 1200,
      comments: Math.floor(r3 * 80) + 5,
      shares: Math.floor(r4 * 40) + 2,
      timestamp: "2h ago",
    };
  }, [caption]);
};
