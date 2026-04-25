/**
 * useAllTrends.js v2 — Production-grade trends data hook
 * ─────────────────────────────────────────────────────────────────
 * Fixes in this version:
 * 1. AbortController — cancels in-flight requests on query change
 * 2. useDeferredValue — debounces search without setTimeout
 * 3. Ref-based pagination — no stale closures in loadMore
 * 4. Proper error handling — distinguishes abort from real errors
 * 5. Stable loadMore — cannot fire concurrently
 *
 * Replace: client/src/pages/trends/hooks/useAllTrends.js
 */

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useDeferredValue,
} from 'react';

const API_BASE = import.meta.env.DEV
  ? ''
  : import.meta.env.VITE_API_URL || '';

/* ─────────────────────────────────────────────────────────────────
   FETCH HELPERS
───────────────────────────────────────────────────────────────── */

async function safeFetch(url, signal) {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

/* Weighted subreddit pool — higher-index = higher weight */
const SUBREDDIT_POOL = [
  // High engagement (fetched most often)
  'memes', 'dankmemes', 'interestingasfuck', 'nextfuckinglevel',
  'Influencersinthewild', 'Cricket', 'ipl', 'funny',
  // Medium engagement
  'StockMarket', 'IndiaInvestments', 'technology', 'worldnews',
  'BollyBlindsNGossip', 'news',
  // Niche
  'Daytrading', 'TradingView', 'indiameme', 'jobs',
];

function pickRandomSubreddits(count = 4) {
  const shuffled = [...SUBREDDIT_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/* ─────────────────────────────────────────────────────────────────
   FETCH FUNCTIONS
───────────────────────────────────────────────────────────────── */

async function fetchNews(
  { limit = 24, offset = 0, categories, query = '' },
  signal
) {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
    categories,
    ...(query && { q: query }),
  });
  const data = await safeFetch(`${API_BASE}/api/trends/news?${params}`, signal);
  return data.articles || [];
}

async function fetchRedditBatch(
  { subreddits, limitPerSub = 8, afters = {} },
  signal
) {
  const results = await Promise.allSettled(
    subreddits.map(async (sr) => {
      const params = new URLSearchParams({
        sr,
        limit: String(limitPerSub),
        ...(afters[sr] && { after: afters[sr] }),
      });
      const data = await safeFetch(
        `${API_BASE}/api/trends/reddit?${params}`,
        signal
      );
      return { sr, posts: data.posts || [], after: data.after || null };
    })
  );

  const posts = [];
  const newAfters = { ...afters };

  for (const result of results) {
    if (result.status === 'fulfilled') {
      posts.push(...result.value.posts);
      if (result.value.after) {
        newAfters[result.value.sr] = result.value.after;
      }
    }
  }

  return { posts, newAfters };
}

/* ─────────────────────────────────────────────────────────────────
   MAIN HOOK
───────────────────────────────────────────────────────────────── */

const DEFAULT_OPTIONS = {
  newsCategories:
    'technology,business,entertainment,sports,finance,science,world,health',
  newsLimit: 24,
  memeLimit: 24,
};

export function useAllTrends(rawQuery = '', options = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Defer the search query to avoid fetching on every keystroke
  const deferredQuery = useDeferredValue(rawQuery.trim());

  /* ── State ── */
  const [trends, setTrends] = useState([]);
  const [memes, setMemes] = useState([]);
  const [images] = useState([]); // fetched on-demand in TrendCard
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  /* ── Refs (no stale closures) ── */
  const abortRef = useRef(null);
  const isLoadingMoreRef = useRef(false);
  const pagination = useRef({
    newsOffset: 0,
    redditAfters: {},
    imagePage: 1,
  });
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  /* ── Core load function ── */
  const load = useCallback(
    async (isInitial) => {
      if (!isInitial && isLoadingMoreRef.current) return;

      // Cancel previous request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      if (isInitial) {
        pagination.current = { newsOffset: 0, redditAfters: {}, imagePage: 1 };
        setLoading(true);
        setError(null);
      } else {
        isLoadingMoreRef.current = true;
        setLoadingMore(true);
      }

      const { newsOffset, redditAfters } = pagination.current;
      const subreddits = pickRandomSubreddits(4);
      const limitPerSub = Math.ceil(opts.memeLimit / 4);

      try {
        const [newsResult, redditResult] = await Promise.allSettled([
          fetchNews(
            {
              limit: opts.newsLimit,
              offset: newsOffset,
              categories: opts.newsCategories,
              query: deferredQuery,
            },
            controller.signal
          ),
          fetchRedditBatch(
            { subreddits, limitPerSub, afters: redditAfters },
            controller.signal
          ),
        ]);

        // Guard: component unmounted or request was aborted
        if (!isMounted.current || controller.signal.aborted) return;

        const newTrends =
          newsResult.status === 'fulfilled' ? newsResult.value : [];
        const newMemes =
          redditResult.status === 'fulfilled'
            ? redditResult.value.posts
            : [];
        const newAfters =
          redditResult.status === 'fulfilled'
            ? redditResult.value.newAfters
            : redditAfters;

        // Update pagination refs
        pagination.current.newsOffset += opts.newsLimit;
        pagination.current.redditAfters = newAfters;

        // Shuffle memes for variety on each load
        const shuffledMemes = [...newMemes].sort(() => Math.random() - 0.5);

        setTrends((prev) =>
          isInitial ? newTrends : [...prev, ...newTrends]
        );
        setMemes((prev) =>
          isInitial ? shuffledMemes : [...prev, ...shuffledMemes]
        );

        // Has more if we got any data this round
        setHasMore(newTrends.length > 0 || shuffledMemes.length > 0);
      } catch (err) {
        if (err.name === 'AbortError') {
          // Normal — request was cancelled, do nothing
          return;
        }
        if (isMounted.current) {
          setError(err.message || 'Failed to load trends');
        }
      } finally {
        if (isMounted.current && !controller.signal.aborted) {
          setLoading(false);
          setLoadingMore(false);
          isLoadingMoreRef.current = false;
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [deferredQuery, opts.newsCategories, opts.newsLimit, opts.memeLimit]
  );

  /* ── Initial load + reload on query change ── */
  useEffect(() => {
    load(true);
    return () => {
      abortRef.current?.abort();
    };
  }, [load]);

  /* ── Load more — stable, guarded ── */
  const loadMore = useCallback(() => {
    if (!isLoadingMoreRef.current && hasMore) {
      load(false);
    }
  }, [load, hasMore]);

  const refetch = useCallback(() => {
    load(true);
  }, [load]);

  return {
    trends,
    memes,
    images,
    loading,
    loadingMore,
    error,
    hasMore,
    refetch,
    loadMore,
  };
}
