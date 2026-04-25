/**
 * useAllTrends.js
 * ─────────────────────────────────────────────────────────────────
 * Core data hook for the All Trends page with Infinite Scrolling.
 *
 * Data sources (all fetched in parallel):
 *   1. /api/trends/news      → trending topics (backend proxy → Mediastack)
 *   2. Reddit JSON API       → memes (public, no key needed)
 *   3. /api/trends/images    → images (backend proxy → Unsplash → Pexels)
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// Use empty base in dev to go through Vite proxy
const API_BASE = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || '');

/* ─── FETCHERS ─── */

/** Fetch trending news topics from our backend proxy */
async function fetchNews(limit = 12, offset = 0, categories = 'technology,business,entertainment,sports') {
  const r = await fetch(`${API_BASE}/api/trends/news?limit=${limit}&offset=${offset}&categories=${categories}`);
  if (!r.ok) throw new Error(`News API ${r.status}`);
  const data = await r.json();
  return data.articles || [];
}

const SUBREDDITS = [
  'Daytrading', 'Trading', 'TradingView', 'Forexstrategy', 'metatrader',
  'ipl', 'worldnews', 'sports', 'interesting', 'memes', 
  'dankmemes', 'interestingasfuck', 'nextfuckinglevel', 
  'BollyBlindsNGossip', 'funny', 'technology'
];

/** Fetch posts from multiple subreddits (via backend proxy) */
async function fetchRedditPosts(limit = 10, afters = {}) {
  // Pick 3 subreddits to fetch from to ensure variety without overloading
  const selected = SUBREDDITS.sort(() => 0.5 - Math.random()).slice(0, 4);
  
  const results = await Promise.allSettled(
    selected.map(sr => 
      fetch(`${API_BASE}/api/trends/reddit?sr=${sr}&limit=${limit}&after=${afters[sr] || ''}`)
        .then(r => r.json())
        .then(data => ({ sr, posts: data.posts || [], after: data.after }))
    )
  );

  let combinedPosts = [];
  let newAfters = { ...afters };

  results.forEach(res => {
    if (res.status === 'fulfilled') {
      combinedPosts = [...combinedPosts, ...res.value.posts];
      newAfters[res.value.sr] = res.value.after;
    }
  });

  return { posts: combinedPosts.sort(() => 0.5 - Math.random()), afters: newAfters };
}

/** Fetch images from our backend proxy */
async function fetchImages(topic = 'trending', limit = 9, page = 1) {
  const r = await fetch(
    `${API_BASE}/api/trends/images?q=${encodeURIComponent(topic)}&limit=${limit}&page=${page}`
  );
  if (!r.ok) throw new Error(`Images API ${r.status}`);
  const data = await r.json();
  return data.images || [];
}

/* ─── MAIN HOOK ─── */

export function useAllTrends(query = '', {
  newsCategories = 'technology,business,entertainment,sports,finance,science',
  newsLimit      = 50,
  memeLimit      = 50,
  imageLimit     = 50,
} = {}) {
  const [trends, setTrends] = useState([]);
  const [memes, setMemes] = useState([]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  // Pagination markers
  const redditAfters = useRef({}); // Object to track tokens per subreddit
  const newsOffset = useRef(0);
  const imagePage = useRef(1);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const load = useCallback(async (isInitial = true) => {
    if (isInitial) {
      setLoading(true);
      setError(null);
      // Randomize offset on initial load for freshness (if not searching)
      newsOffset.current = !query ? Math.floor(Math.random() * 50) : 0;
      redditAfters.current = {};
      imagePage.current = 1;
    } else {
      setLoadingMore(true);
    }

    const imgTopic = query.trim() || 'trending news';

    try {
      const [newsData, redditData] = await Promise.allSettled([
        fetchNews(newsLimit, newsOffset.current, newsCategories),
        fetchRedditPosts(Math.ceil(memeLimit / 4), redditAfters.current), // Increased variety
      ]);

      if (!mountedRef.current) return;

      const newTrends = newsData.status === 'fulfilled' ? newsData.value : [];
      const newReddit = redditData.status === 'fulfilled' ? redditData.value.posts : [];

      if (redditData.status === 'fulfilled') {
        redditAfters.current = redditData.value.afters;
      }

      // Increment news offset, but wrap around or vary it if we get nothing
      if (newTrends.length > 0) {
        newsOffset.current += newsLimit;
      } else {
        // If news is exhausted, shift offset slightly to try to find gaps or just stop incrementing
        newsOffset.current = (newsOffset.current + 10) % 100; 
      }

      if (isInitial) {
        setTrends(newTrends);
        setMemes(newReddit);
      } else {
        setTrends(prev => [...prev, ...newTrends]);
        setMemes(prev => [...prev, ...newReddit]);
      }

      // Infinite logic: only stop if we literally get NOTHING from both
      // Even then, Reddit almost always has more if we keep trying different subreddits
      if (newTrends.length === 0 && newReddit.length === 0) {
        // Only give up if we've tried a few times
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    } catch (err) {
      if (mountedRef.current) setError(err.message);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [query, newsCategories, newsLimit, memeLimit, imageLimit]);

  useEffect(() => {
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
    refetch: () => load(true),
    loadMore: () => !loadingMore && hasMore && load(false)
  };
}
