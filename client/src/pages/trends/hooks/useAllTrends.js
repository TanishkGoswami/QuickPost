import {
  useState, useEffect, useCallback, useRef, useDeferredValue,
} from "react";

const BASE = import.meta.env.DEV ? "" : (import.meta.env.VITE_API_URL || "");

async function safeFetch(url, signal) {
  const res = await fetch(url, {
    signal,
    headers: { Accept: "application/json", "ngrok-skip-browser-warning": "true" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  return res.json();
}

function dedup(existing, incoming) {
  const seen = new Set(existing.map(x => x.id || x.url).filter(Boolean));
  return incoming.filter(x => {
    const key = x.id || x.url;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const DEFAULTS = {
  limit: 48,
  enrich: true,
  niche: "All",
  sort: "trending",
  newsCategories: "technology,business,entertainment,sports,finance,science,world,health,politics",
};

const EMPTY_COUNTS = {
  total: 0,
  news: 0,
  reddit: 0,
  youtube: 0,
  bluesky: 0,
  mastodon: 0,
  lemmy: 0,
  hackernews: 0,
  github: 0,
  wikipedia: 0,
  devto: 0,
  stackexchange: 0,
};

export function useAllTrends(rawQuery = "", options = {}) {
  const opts = { ...DEFAULTS, ...options };
  const query = useDeferredValue(rawQuery.trim());

  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState(EMPTY_COUNTS);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const abortRef = useRef(null);
  const loadingRef = useRef(false);
  const cursorRef = useRef("");
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const load = useCallback(async (isInitial) => {
    if (!isInitial && loadingRef.current) return;

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    if (isInitial) {
      cursorRef.current = "";
      if (mounted.current) {
        setLoading(true);
        setError(null);
        setHasMore(true);
      }
    } else {
      loadingRef.current = true;
      if (mounted.current) setLoadingMore(true);
    }

    try {
      const params = new URLSearchParams({
        limit: String(opts.limit),
        sort: opts.sort === "score" ? "trending" : opts.sort,
        niche: opts.niche,
        categories: opts.newsCategories,
        enrich: opts.enrich ? "true" : "false",
        ...(query ? { q: query } : {}),
        ...(!isInitial && cursorRef.current ? { cursor: cursorRef.current } : {}),
      });

      const data = await safeFetch(`${BASE}/api/trends/feed?${params}`, ctrl.signal);
      if (!mounted.current || ctrl.signal.aborted) return;

      const nextItems = Array.isArray(data.items) ? data.items : [];
      cursorRef.current = data.cursor || "";
      setItems(prev => isInitial ? nextItems : [...prev, ...dedup(prev, nextItems)]);
      setCounts({ ...EMPTY_COUNTS, ...(data.counts || { total: nextItems.length }) });
      setHasMore(Boolean(data.cursor) && nextItems.length > 0);
      setError((data.errors || []).map(e => `${e.source}: ${e.message}`).join("; ") || null);
    } catch (err) {
      if (err.name !== "AbortError" && mounted.current) setError(err.message || "Failed to load trends");
    } finally {
      if (mounted.current && !ctrl.signal.aborted) {
        setLoading(false);
        setLoadingMore(false);
        loadingRef.current = false;
      }
    }
  }, [query, opts.limit, opts.sort, opts.niche, opts.newsCategories, opts.enrich]);

  useEffect(() => {
    load(true);
    return () => { abortRef.current?.abort(); };
  }, [load]);

  const loadMore = useCallback(() => {
    if (!loadingRef.current && hasMore) load(false);
  }, [load, hasMore]);

  const refetch = useCallback(() => load(true), [load]);

  return { items, counts, loading, loadingMore, error, hasMore, refetch, loadMore };
}
