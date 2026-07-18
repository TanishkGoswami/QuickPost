/**
 * trends.js — Secure API proxy for the All Trends page
 *
 * Routes:
 *   GET /api/trends/news?limit=10            → Mediastack hot news
 *   GET /api/trends/reddit?sr=topic&limit=10 → Reddit proxy
 *   GET /api/trends/images?q=topic&limit=9   → Unsplash (fallback: Pexels)
 *
 * All third-party keys stay server-side — never exposed to the browser.
 */

import express from 'express';
import axios from 'axios';
import dns from 'node:dns/promises';
import net from 'node:net';
import { fetchBlueskyTrends } from '../services/trends/bluesky.adapter.js';
import { fetchGoogleNewsRssTrends } from '../services/trends/googleNews.adapter.js';
import { fetchHackerNewsTrends } from '../services/trends/hackerNews.adapter.js';
import { fetchGithubTrends } from '../services/trends/github.adapter.js';
import { fetchWikipediaTrends } from '../services/trends/wikipedia.adapter.js';
import { fetchDevtoTrends } from '../services/trends/devto.adapter.js';
import { fetchStackExchangeTrends } from '../services/trends/stackExchange.adapter.js';
import { fetchLemmyTrends } from '../services/trends/lemmy.adapter.js';
import { fetchMastodonTrends } from '../services/trends/mastodon.adapter.js';
import { fetchRedditTrends } from '../services/trends/reddit.adapter.js';
import { attachTrendGrowth, captureTrendSnapshots, readStoredTrendItems, recordSourceHealth, upsertTrendItems } from '../services/trends/store.js';
import { applyTrendScores, validateTrendItem, withTrendDefaults } from '../services/trends/shared.js';
import { clusterTrendItems } from '../services/trends/clustering.js';
import { authenticateUser } from '../middleware/authenticateUser.js';
import { withTrendRefreshLock } from '../services/trends/locks.js';

const router = express.Router();
const aiGenerationWindow = new Map();
const rateWindows = new Map();

/* ─── Env keys (set in server/.env) ─── */
const MEDIASTACK_KEY = process.env.MEDIASTACK_KEY || '';
const GNEWS_KEY      = process.env.GNEWS_KEY      || '';
const NEWSAPI_KEY    = process.env.NEWSAPI_KEY    || '';
const GUARDIAN_KEY   = process.env.GUARDIAN_KEY   || '';
const UNSPLASH_KEY   = process.env.UNSPLASH_ACCESS_KEY || '';
const PEXELS_KEY     = process.env.PEXELS_KEY || '';
const SERPAPI_KEY    = process.env.SERPAPI_KEY || '';

// Browser-like User-Agent — Reddit blocks bot UAs since 2023
const REDDIT_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

/* ─── Simple in-memory TTL cache (5 min) ─── */
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000;
const REDDIT_CACHE_TTL = 60 * 1000; // 1 minute for memes

function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > (entry.ttl || CACHE_TTL)) { cache.delete(key); return null; }
  return entry.data;
}
function setCached(key, data, ttl = CACHE_TTL) {
  cache.set(key, { data, ts: Date.now(), ttl });
}

function clientKey(req, scope) {
  return `${scope}:${req.user?.userId || req.ip || req.headers['x-forwarded-for'] || 'unknown'}`;
}

function checkRateLimit(key, limit, windowMs) {
  const now = Date.now();
  const rows = (rateWindows.get(key) || []).filter(ts => now - ts < windowMs);
  if (rows.length >= limit) {
    rateWindows.set(key, rows);
    return false;
  }
  rows.push(now);
  rateWindows.set(key, rows);
  return true;
}

function enforceRateLimit(scope, limit, windowMs) {
  return (req, res, next) => {
    if (isInternalRefresh(req)) return next();
    if (!checkRateLimit(clientKey(req, scope), limit, windowMs)) {
      return res.status(429).json({ success: false, error: 'Too many trend requests. Please try again shortly.' });
    }
    return next();
  };
}

const trendSearchRateLimit = enforceRateLimit('trend-search', Number(process.env.TRENDS_SEARCH_RATE_LIMIT) || 80, 60 * 1000);
const trendRefreshRateLimit = enforceRateLimit('trend-refresh', Number(process.env.TRENDS_REFRESH_RATE_LIMIT) || 6, 60 * 60 * 1000);

function isInternalRefresh(req) {
  const expected = process.env.TRENDS_REFRESH_SECRET;
  return Boolean(expected && req.get('x-trends-refresh-secret') === expected);
}

function requireTrendAdmin(req, res, next) {
  const admins = String(process.env.TRENDS_ADMIN_EMAILS || process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(Boolean);
  if (admins.includes(String(req.user?.email || '').toLowerCase())) return next();
  return res.status(403).json({ success: false, error: 'Trend refresh is admin-only' });
}

async function allSettledLimit(tasks, limit = Number(process.env.TRENDS_PROVIDER_CONCURRENCY) || 4) {
  const results = Array(tasks.length);
  let index = 0;
  const workers = Array.from({ length: Math.min(Math.max(1, limit), tasks.length) }, async () => {
    while (index < tasks.length) {
      const current = index;
      index += 1;
      try {
        results[current] = { status: 'fulfilled', value: await tasks[current]() };
      } catch (reason) {
        results[current] = { status: 'rejected', reason };
      }
    }
  });
  await Promise.all(workers);
  return results;
}

function timedSource(source, task) {
  return async () => {
    const started = Date.now();
    try {
      const value = await task();
      await recordSourceHealth({ source, ok: true, responseTimeMs: Date.now() - started });
      return value;
    } catch (err) {
      await recordSourceHealth({ source, ok: false, responseTimeMs: Date.now() - started, error: err.message });
      throw err;
    }
  };
}

function emptyTrendCounts() {
  return { total: 0, news: 0, reddit: 0, youtube: 0, bluesky: 0, mastodon: 0, lemmy: 0, hackernews: 0, github: 0, wikipedia: 0, devto: 0, stackexchange: 0 };
}

function trendCounts(items = []) {
  const hasSource = (item, source) => item.source === source || item.platformBadges?.includes(source);
  const newsSources = new Set(['news', 'google-news']);
  const isNewsItem = item => newsSources.has(item.source) || item.platformBadges?.some(source => newsSources.has(source));
  return {
    ...emptyTrendCounts(),
    total: items.length,
    news: items.filter(isNewsItem).length,
    reddit: items.filter(i => hasSource(i, 'reddit')).length,
    youtube: items.filter(i => hasSource(i, 'youtube')).length,
    bluesky: items.filter(i => hasSource(i, 'bluesky')).length,
    mastodon: items.filter(i => hasSource(i, 'mastodon')).length,
    lemmy: items.filter(i => hasSource(i, 'lemmy')).length,
    hackernews: items.filter(i => hasSource(i, 'hacker-news')).length,
    github: items.filter(i => hasSource(i, 'github')).length,
    wikipedia: items.filter(i => hasSource(i, 'wikipedia')).length,
    devto: items.filter(i => hasSource(i, 'dev')).length,
    stackexchange: items.filter(i => hasSource(i, 'stack-overflow')).length,
  };
}

const MAX_PROXY_BYTES = 50 * 1024 * 1024;

function isPrivateAddress(address) {
  if (net.isIP(address) === 6) {
    const normalized = address.toLowerCase();
    return normalized === '::1' || normalized.startsWith('fc') || normalized.startsWith('fd') || normalized.startsWith('fe80:');
  }

  const parts = address.split('.').map(Number);
  if (parts.length !== 4 || parts.some(Number.isNaN)) return true;
  const [a, b] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

async function getPublicMediaUrl(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw Object.assign(new Error('Invalid URL'), { statusCode: 400 });
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw Object.assign(new Error('Only HTTP(S) media URLs are allowed'), { statusCode: 400 });
  }

  const addresses = await dns.lookup(parsed.hostname, { all: true });
  if (!addresses.length || addresses.some(({ address }) => isPrivateAddress(address))) {
    throw Object.assign(new Error('Private network URLs are not allowed'), { statusCode: 400 });
  }

  return parsed;
}

const ENRICH_TTL = 24 * 60 * 60 * 1000;

const TREND_NICHES = [
  { id: 'AI & Tech', kw: ['ai', 'chatgpt', 'openai', 'tech', 'apple', 'google', 'gpt', 'llm', 'software', 'startup', 'developer'] },
  { id: 'Trading', kw: ['stock', 'market', 'nifty', 'sensex', 'trading', 'invest', 'fund', 'equity', 'forex', 'gold', 'sebi'] },
  { id: 'Crypto', kw: ['crypto', 'bitcoin', 'btc', 'ethereum', 'web3', 'nft', 'defi', 'blockchain'] },
  { id: 'Sports', kw: ['ipl', 'cricket', 'football', 'sport', 'match', 'tournament', 'league', 'f1', 'nba', 'fifa', 'tennis'] },
  { id: 'Entertainment', kw: ['movie', 'film', 'series', 'netflix', 'celebrity', 'bollywood', 'anime', 'ott', 'drama', 'actor'] },
  { id: 'Music', kw: ['music', 'song', 'album', 'artist', 'rapper', 'singer', 'spotify', 'concert', 'dj', 'remix'] },
  { id: 'Business', kw: ['startup', 'business', 'entrepreneur', 'company', 'ceo', 'funding', 'revenue', 'saas', 'product'] },
  { id: 'Politics', kw: ['politics', 'election', 'government', 'minister', 'parliament', 'policy', 'law', 'modi', 'bjp', 'congress'] },
  { id: 'Fitness', kw: ['gym', 'fitness', 'workout', 'diet', 'health', 'exercise', 'nutrition', 'yoga', 'protein', 'abs'] },
];

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function titleHash(value = '') {
  let h = 5381;
  for (let i = 0; i < value.length; i += 1) h = ((h << 5) + h) ^ value.charCodeAt(i);
  return (h >>> 0).toString(36);
}

function encodeCursor(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function defaultCursor() {
  return {
    storedOffset: 0,
    newsOffset: 0,
    googleNewsOffset: 0,
    redditAfters: {},
    blueskyCursor: '',
    mastodonOffset: 0,
    lemmyPage: 1,
    hackerNewsOffset: 0,
    githubPage: 1,
    wikipediaOffset: 0,
    devtoPage: 1,
    stackExchangePage: 1,
    seenIds: [],
    batch: 0,
  };
}

function decodeCursor(value) {
  if (!value) return defaultCursor();
  try {
    const parsed = JSON.parse(Buffer.from(String(value), 'base64url').toString('utf8'));
    return {
      storedOffset: Number(parsed.storedOffset) || 0,
      newsOffset: Number(parsed.newsOffset) || 0,
      googleNewsOffset: Number(parsed.googleNewsOffset) || 0,
      redditAfters: parsed.redditAfters && typeof parsed.redditAfters === 'object' ? parsed.redditAfters : {},
      blueskyCursor: parsed.blueskyCursor || '',
      mastodonOffset: Number(parsed.mastodonOffset) || 0,
      lemmyPage: Number(parsed.lemmyPage) || 1,
      hackerNewsOffset: Number(parsed.hackerNewsOffset) || 0,
      githubPage: Number(parsed.githubPage) || 1,
      wikipediaOffset: Number(parsed.wikipediaOffset) || 0,
      devtoPage: Number(parsed.devtoPage) || 1,
      stackExchangePage: Number(parsed.stackExchangePage) || 1,
      seenIds: Array.isArray(parsed.seenIds) ? parsed.seenIds.slice(0, 250) : [],
      batch: Number(parsed.batch) || 0,
    };
  } catch {
    return defaultCursor();
  }
}

function detectTrendNiche(text = '') {
  const lower = text.toLowerCase();
  const match = TREND_NICHES.find(n => n.kw.some(k => lower.includes(k)));
  return match?.id || 'Trending';
}

function defaultBlueskyQuery(niche = 'All') {
  const map = {
    'AI & Tech': 'artificial intelligence',
    Business: 'startup',
    Sports: 'cricket',
    Trading: 'stock market',
    Crypto: 'bitcoin',
    Entertainment: 'movie',
    Music: 'music',
    Politics: 'politics',
    Fitness: 'fitness',
  };
  return map[niche] || 'trending';
}

function fallbackEnrichment(item) {
  const niche = item.niche || detectTrendNiche(item.title);
  const cleanNiche = niche.replace(/[^a-z0-9]/gi, '');
  const sourceTag = String(item.platform || item.source || 'trend').replace(/[^a-z0-9]/gi, '').toLowerCase();
  const hashtags = [`#${cleanNiche || 'Trending'}`, '#trending', sourceTag ? `#${sourceTag}` : '#viral'].slice(0, 5);
  const ideas = [
    `My honest take on: ${String(item.title || 'this trend').slice(0, 70)}`,
    `What ${niche} creators should know right now`,
    `Turn this into a 60-second explainer`,
  ];
  return {
    ideas,
    hashtags,
    caption: `${ideas[0]}\n\n${hashtags.join(' ')}`,
  };
}

function normalizeNewsArticle(article, batch) {
  return withTrendDefaults({
    externalId: article.url || titleHash(article.title),
    type: 'article',
    source: article.source || 'News',
    title: article.title,
    description: article.description || '',
    originalUrl: article.url,
    imageUrl: article.image || null,
    authorName: article.source || 'News',
    publishedAt: article.publishedAt || null,
    category: detectTrendNiche(`${article.title} ${article.description || ''}`),
    _batch: batch,
  });
}

function normalizeRedditPost(post, batch) {
  return withTrendDefaults({
    externalId: post.id || post.url || post.link,
    type: 'post',
    source: 'reddit',
    title: post.title,
    description: `r/${post.subreddit || 'reddit'}`,
    originalUrl: post.url || post.link,
    imageUrl: post.image || null,
    authorName: post.subreddit ? `r/${post.subreddit}` : 'Reddit',
    authorUsername: post.subreddit || '',
    publishedAt: post.createdUtc ? new Date(post.createdUtc * 1000).toISOString() : null,
    engagement: { upvotes: post.upvotes || post.score || 0, comments: post.comments || 0 },
    category: detectTrendNiche(`${post.title} ${post.subreddit || ''}`),
    _batch: batch,
  });
}

function normalizeYoutubeVideo(video, batch) {
  return withTrendDefaults({
    externalId: video.id || video.url,
    type: 'post',
    source: 'youtube',
    title: video.title,
    description: video.description || '',
    originalUrl: video.url,
    imageUrl: video.thumbnail || null,
    authorName: video.channel || 'YouTube',
    authorUsername: video.channel || '',
    publishedAt: video.publishedAt || null,
    engagement: { views: parseCompactNumber(video.views) },
    category: detectTrendNiche(`${video.title} ${video.channel || ''}`),
    _batch: batch,
  });
}

function parseCompactNumber(value = '') {
  const match = String(value).toLowerCase().replace(/,/g, '').match(/([\d.]+)\s*([km])?/);
  if (!match) return 0;
  const mult = match[2] === 'm' ? 1000000 : match[2] === 'k' ? 1000 : 1;
  return Math.round(Number(match[1]) * mult) || 0;
}

function mergeEnrichment(item, enrichment) {
  return {
    ...item,
    ideas: Array.isArray(enrichment?.ideas) && enrichment.ideas.length ? enrichment.ideas.slice(0, 3) : item.ideas,
    hashtags: Array.isArray(enrichment?.hashtags) && enrichment.hashtags.length ? enrichment.hashtags.slice(0, 5) : item.hashtags,
    caption: enrichment?.caption || item.caption,
  };
}

async function enrichTrendItems(items) {
  const apiKey = process.env.OPENAI_API_KEY;
  const targets = items.slice(0, 30);
  const cachedById = new Map();
  const missing = [];

  for (const item of targets) {
    const cacheKey = `trend:${item.id}:${titleHash(item.title || '')}`;
    const cached = getCached(cacheKey);
    if (cached) cachedById.set(item.id, cached);
    else missing.push({ item, cacheKey });
  }

  if (apiKey && missing.length) {
    try {
      const payload = missing.map(({ item }) => ({
        id: item.id,
        source: item.source,
        title: item.title,
        description: item.description,
        category: item.category,
      }));
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: process.env.TRENDS_OPENAI_MODEL || 'gpt-4o-mini',
          temperature: 0.5,
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: 'Return JSON only: {"items":[{"id":"...","ideas":["..."],"hashtags":["#..."],"caption":"..."}]}. Create concise, professional social content ideas for creators. No markdown.',
            },
            { role: 'user', content: JSON.stringify({ items: payload }) },
          ],
        },
        {
          timeout: 12000,
          headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        },
      );

      const parsed = JSON.parse(response.data?.choices?.[0]?.message?.content || '{"items":[]}');
      for (const enriched of parsed.items || []) {
        const entry = missing.find(m => m.item.id === enriched.id);
        if (!entry) continue;
        const value = {
          ideas: Array.isArray(enriched.ideas) ? enriched.ideas : [],
          hashtags: Array.isArray(enriched.hashtags) ? enriched.hashtags : [],
          caption: enriched.caption || '',
        };
        cachedById.set(enriched.id, value);
        setCached(entry.cacheKey, value, ENRICH_TTL);
      }
    } catch (err) {
      console.warn('[Trends/feed] AI enrichment failed:', err.response?.data?.error?.message || err.message);
    }
  }

  return items.map(item => mergeEnrichment(item, cachedById.get(item.id) || fallbackEnrichment(item)));
}

async function fetchNewsFeed(categories, limit, offset, query) {
  let articles = [];
  if (!articles.length) articles = await fetchSerpApiNewsLight(categories, limit, offset, query);
  if (!articles.length) articles = await fetchSerpApiNews(categories, limit, offset, query);
  if (!articles.length) articles = await fetchSerpApiBingNews(categories, limit, offset, query);
  if (!articles.length) articles = await fetchGuardian(categories, limit, offset, query);
  if (!articles.length) articles = await fetchGNews(categories, limit, offset);
  if (!articles.length) articles = await fetchNewsAPI(categories, limit, offset);
  if (!articles.length) articles = await fetchMediastack(categories, limit, offset);

  const seen = new Set();
  return articles.filter(a => {
    const slug = String(a.title || '').toLowerCase().trim();
    if (!slug || seen.has(slug)) return false;
    seen.add(slug);
    return true;
  });
}

/* ════════════════════════════════════════════════════
   GET /api/trends/news
   Returns: [{ title, description, url, source, publishedAt, image }]
   Orchestration: GNews (best) -> NewsAPI -> Mediastack (fallback)
   ════════════════════════════════════════════════════ */
router.get('/trends/news', async (req, res) => {
  const limit      = Math.min(parseInt(req.query.limit) || 12, 50);
  const offset     = parseInt(req.query.offset) || 0;
  const categories = req.query.categories || 'technology,business,entertainment,sports';
  const query      = req.query.q || '';
  const cacheKey   = `news:${categories}:${limit}:${offset}:${query}`;

  try {
    const refresh = req.query.refresh === 'true';
    const cached = refresh ? null : getCached(cacheKey);
    if (cached) return res.json(cached);

    let articles = [];
    if (!articles.length) articles = await fetchSerpApiNewsLight(categories, limit, offset, query);
    if (!articles.length) articles = await fetchSerpApiNews(categories, limit, offset, query);
    if (!articles.length) articles = await fetchSerpApiBingNews(categories, limit, offset, query);

    // 1. Guardian — completely free, no localhost restriction, high quality
    if (!articles.length) articles = await fetchGuardian(categories, limit, offset, query);

    // 2. GNews — good quality, 100/day free tier
    if (!articles.length) articles = await fetchGNews(categories, limit, offset);

    // 3. NewsAPI — works on localhost only (dev fallback)
    if (!articles.length) articles = await fetchNewsAPI(categories, limit, offset);

    // 4. Mediastack — last resort
    if (!articles.length) articles = await fetchMediastack(categories, limit, offset);

    // Deduplicate by title
    const seen = new Set();
    const unique = articles.filter(a => {
      if (!a.title) return false;
      const slug = a.title.toLowerCase().trim();
      if (seen.has(slug)) return false;
      seen.add(slug);
      return true;
    });

    const normalized = unique.map(item => normalizeNewsArticle(item, 0)).filter(validateTrendItem);
    const result = { success: true, articles: normalized };
    setCached(cacheKey, result);
    res.json(result);
  } catch (err) {
    console.error('[Trends/news] Global Error:', err.message);
    res.json({ success: true, articles: [], error: err.message });
  }
});

/* ─── SerpApi Google News Fetcher ─── */
function buildSerpNewsQuery(categories, query = '') {
  if (query) return query;

  const categoryTerms = categories
    .split(',')
    .map(c => c.trim())
    .filter(Boolean)
    .slice(0, 4);

  if (!categoryTerms.length) return 'latest trending news';
  return `${categoryTerms.join(' OR ')} latest trending news`;
}

function parseSerpApiDate(value) {
  if (!value) return null;

  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime())) return direct.toISOString();

  const compact = String(value).toLowerCase().match(/^(\d+)\s*(m|h|d|w)$/);
  if (compact) {
    const unitMap = { m: 'minute', h: 'hour', d: 'day', w: 'week' };
    value = `${compact[1]} ${unitMap[compact[2]]} ago`;
  }

  const match = String(value).toLowerCase().match(/(\d+)\s+(minute|hour|day|week|month|year)s?\s+ago/);
  if (!match) return null;

  const amount = Number(match[1]);
  const units = {
    minute: 60 * 1000,
    hour: 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
    month: 30 * 24 * 60 * 60 * 1000,
    year: 365 * 24 * 60 * 60 * 1000,
  };

  return new Date(Date.now() - amount * units[match[2]]).toISOString();
}

function normalizeSerpNewsResult(a, fallbackSource, category) {
  return {
    title:       a.title,
    description: a.snippet || a.description || '',
    url:         a.link || a.url,
    source:      a.source?.name || a.source || fallbackSource,
    publishedAt: parseSerpApiDate(a.date || a.published_date),
    image:       pickSerpThumbnail(a.thumbnail) || a.image || null,
    category,
  };
}

function pickSerpThumbnail(thumbnail) {
  if (!thumbnail) return null;
  if (typeof thumbnail === 'string') return thumbnail;
  return thumbnail.static || thumbnail.rich || thumbnail.url || null;
}

async function fetchSerpApiNewsLight(categories, limit, offset, query = '') {
  if (!SERPAPI_KEY) return [];
  if (offset > 0) return [];

  try {
    const r = await axios.get('https://serpapi.com/search.json', {
      params: {
        engine: 'google_news_light',
        q: buildSerpNewsQuery(categories, query),
        gl: 'in',
        hl: 'en',
        api_key: SERPAPI_KEY,
      },
      timeout: 8000,
    });

    return (r.data?.news_results || [])
      .slice(0, limit)
      .map(a => normalizeSerpNewsResult(a, 'Google News Light', 'Google News Light'))
      .filter(a => a.title && a.url);
  } catch (e) {
    console.warn('[SerpApi Google News Light] Failed:', e.response?.data?.error || e.message);
    return [];
  }
}

async function fetchSerpApiNews(categories, limit, offset, query = '') {
  if (!SERPAPI_KEY) return [];

  // Use SerpApi for the best realtime first page; paginated fallbacks continue infinite scroll.
  if (offset > 0) return [];

  try {
    const r = await axios.get('https://serpapi.com/search.json', {
      params: {
        engine: 'google_news',
        q: buildSerpNewsQuery(categories, query),
        gl: 'in',
        hl: 'en',
        api_key: SERPAPI_KEY,
      },
      timeout: 8000,
    });

    return (r.data?.news_results || [])
      .slice(0, limit)
      .map(a => normalizeSerpNewsResult(a, 'Google News', 'Google News'))
      .filter(a => a.title && a.url);
  } catch (e) {
    console.warn('[SerpApi] Failed:', e.response?.data?.error || e.message);
    return [];
  }
}

async function fetchSerpApiBingNews(categories, limit, offset, query = '') {
  if (!SERPAPI_KEY) return [];

  try {
    const r = await axios.get('https://serpapi.com/search.json', {
      params: {
        engine: 'bing_news',
        q: buildSerpNewsQuery(categories, query),
        mkt: 'en-IN',
        first: offset + 1,
        count: Math.min(limit, 50),
        qft: 'sortbydate="1"',
        safeSearch: 'Moderate',
        api_key: SERPAPI_KEY,
      },
      timeout: 8000,
    });

    return (r.data?.organic_results || [])
      .slice(0, limit)
      .map(a => normalizeSerpNewsResult(a, 'Bing News', 'Bing News'))
      .filter(a => a.title && a.url);
  } catch (e) {
    console.warn('[SerpApi Bing News] Failed:', e.response?.data?.error || e.message);
    return [];
  }
}

/* ─── The Guardian Fetcher (free, unlimited, works in production) ─── */
async function fetchGuardian(categories, limit, offset, query = '') {
  try {
    // Map our category strings to Guardian sections
    const catMap = {
      technology: 'technology', business: 'business', entertainment: 'culture',
      sports: 'sport', finance: 'money', science: 'science', health: 'society',
      politics: 'politics', world: 'world', music: 'music',
    };
    const catArray = categories.split(',');
    const section = catMap[catArray[0]?.toLowerCase()] || 'news';

    const params = {
      'api-key': GUARDIAN_KEY,
      'show-fields': 'thumbnail,trailText,headline,byline',
      'page-size': Math.min(limit, 50),
      'page': Math.floor(offset / limit) + 1,
      'order-by': 'newest',
      'section': section,
    };
    if (query) params.q = query;

    const r = await axios.get('https://content.guardianapis.com/search', { params, timeout: 6000 });
    const results = r.data?.response?.results || [];

    return results.map(a => ({
      title:       a.fields?.headline || a.webTitle,
      description: a.fields?.trailText || '',
      url:         a.webUrl,
      source:      'The Guardian',
      publishedAt: a.webPublicationDate,
      image:       a.fields?.thumbnail || null,
      category:    a.sectionName || section,
    }));
  } catch (e) {
    console.warn('[Guardian] Failed:', e.response?.data || e.message);
    return [];
  }
}

/* ─── GNews Fetcher ─── */
async function fetchGNews(categories, limit, offset) {
  try {
    // GNews uses 'category' (singular) and limited set: general, world, nation, business, technology, entertainment, sports, science, health
    // GNews categories: general, world, nation, business, technology, entertainment, sports, science, health
    const catArray = categories.split(',');
    // Map our categories to GNews supported ones
    const validGNewsCats = ['general', 'world', 'nation', 'business', 'technology', 'entertainment', 'sports', 'science', 'health'];
    const primaryCat = catArray.find(c => validGNewsCats.includes(c.toLowerCase())) || 'general';
    
    const r = await axios.get('https://gnews.io/api/v4/top-headlines', {
      params: {
        category: primaryCat,
        lang: 'en',
        max: limit,
        apikey: GNEWS_KEY
      },
      timeout: 5000
    });

    return (r.data?.articles || []).map(a => ({
      title:       a.title,
      description: a.description || '',
      url:         a.url,
      source:      a.source?.name || 'GNews',
      publishedAt: a.publishedAt,
      image:       a.image || null
    }));
  } catch (e) {
    console.warn('[GNews] Failed:', e.response?.data?.errors || e.message);
    return [];
  }
}

/* ─── NewsAPI Fetcher ─── */
async function fetchNewsAPI(categories, limit, offset) {
  try {
    const page = Math.floor(offset / limit) + 1;
    const r = await axios.get('https://newsapi.org/v2/top-headlines', {
      params: {
        category: categories.split(',')[0] || 'business',
        language: 'en',
        pageSize: limit,
        page,
        apiKey: NEWSAPI_KEY
      },
      headers: { 'User-Agent': 'QuickPost/1.0' },
      timeout: 5000
    });

    return (r.data?.articles || []).map(a => ({
      title:       a.title,
      description: a.description || '',
      url:         a.url,
      source:      a.source?.name || 'NewsAPI',
      publishedAt: a.publishedAt,
      image:       a.urlToImage || null
    }));
  } catch (e) {
    console.warn('[NewsAPI] Failed:', e.message);
    return [];
  }
}

/* ─── Mediastack Fetcher ─── */
async function fetchMediastack(categories, limit, offset) {
  try {
    const r = await axios.get('http://api.mediastack.com/v1/news', {
      params: {
        access_key: MEDIASTACK_KEY,
        categories,
        limit,
        offset,
        languages: 'en',
        sort: 'published_desc',
      },
      timeout: 5000
    });

    return (r.data?.data || []).map(a => ({
      title:       a.title,
      description: a.description || '',
      url:         a.url,
      source:      a.source || 'Mediastack',
      publishedAt: a.published_at,
      image:       a.image || null
    }));
  } catch (e) {
    console.warn('[Mediastack] Failed:', e.message);
    return [];
  }
}

async function fetchRedditHot(sr, limit, after = '') {
  try {
    const r = await axios.get(`https://www.reddit.com/r/${sr}/hot.json`, {
      params: { limit, after, raw_json: 1 },
      headers: {
        'User-Agent': REDDIT_UA,
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
      },
      timeout: 10000,
    });

    return {
      posts: normalizeRedditApiPosts((r.data?.data?.children || []).map(c => c.data)),
      after: r.data?.data?.after || null,
    };
  } catch (err) {
    console.warn(`[Reddit] r/${sr} hot.json failed, using pullpush fallback:`, err.response?.status || err.message);
    const r = await axios.get('https://api.pullpush.io/reddit/search/submission/', {
      params: { subreddit: sr, size: limit, sort: 'desc', sort_type: 'score' },
      timeout: 10000,
    });
    return { posts: normalizeRedditApiPosts(r.data?.data || []), after: null };
  }
}

function normalizeRedditApiPosts(posts) {
  return posts
    .filter(p => !p.over_18 && !p.stickied)
    .map(p => {
      let image = null;
      if (p.preview?.images?.[0]?.source?.url) {
        image = p.preview.images[0].source.url.replace(/&amp;/g, '&');
      } else if (p.thumbnail && p.thumbnail.startsWith('http')) {
        image = p.thumbnail;
      } else if (/\.(jpg|jpeg|png|gif|webp)$/i.test(p.url || '')) {
        image = p.url;
      }

      let videoUrl = p.media?.reddit_video?.fallback_url?.replace(/&amp;/g, '&') || null;
      if (p.is_video && !videoUrl) videoUrl = p.url_overridden_by_dest;

      return {
        id: p.id,
        title: p.title,
        image,
        score: p.score,
        upvotes: p.ups,
        comments: p.num_comments,
        subreddit: p.subreddit,
        createdUtc: p.created_utc,
        url: `https://reddit.com${p.permalink}`,
        link: `https://reddit.com${p.permalink}`,
        isVideo: p.is_video || !!p.media?.reddit_video,
        videoUrl,
        isImage: !!image,
      };
    })
    .filter(p => p.image || p.isVideo);
}

async function fetchYoutubeSearch(query, limit) {
  if (!SERPAPI_KEY) return [];

  const r = await axios.get('https://serpapi.com/search.json', {
    params: {
      engine: 'youtube',
      search_query: query || 'trending videos India',
      gl: 'IN',
      hl: 'en',
      api_key: SERPAPI_KEY,
    },
    timeout: 9000,
  });

  return (r.data?.video_results || [])
    .slice(0, limit)
    .map(v => ({
      id: v.video_id || v.link,
      title: v.title,
      url: v.link,
      thumbnail: pickSerpThumbnail(v.thumbnail),
      channel: v.channel?.name || v.channel || 'YouTube',
      channelUrl: v.channel?.link || null,
      views: v.views || v.watching || '',
      publishedAt: parseSerpApiDate(v.published_date || v.date),
      duration: v.length || '',
      description: v.description || '',
      source: 'YouTube',
    }))
    .filter(v => v.title && v.url);
}

function sortTrendItems(items, sort) {
  const sorted = [...items];
  if (sort === 'latest') {
    sorted.sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0));
  } else {
    sorted.sort((a, b) => (b.trendScore || 0) - (a.trendScore || 0));
  }
  return sorted;
}

function filterByNiche(items, niche) {
  if (!niche || niche === 'All') return items;
  return items.filter(item => item.category === niche);
}

function rowToTrendItem(row = {}) {
  return {
    id: row.id,
    externalId: row.external_id,
    source: row.source,
    type: row.type,
    title: row.title,
    description: row.description,
    authorName: row.author_name,
    authorUsername: row.author_username,
    authorAvatar: row.author_avatar,
    originalUrl: row.original_url,
    imageUrl: row.image_url,
    publishedAt: row.published_at,
    fetchedAt: row.fetched_at,
    category: row.category,
    language: row.language,
    country: row.country,
    tags: row.tags || [],
    engagement: row.engagement || {},
    trendScore: row.trend_score,
    scoreBreakdown: row.score_breakdown || {},
    opportunityScore: row.opportunity_score,
    lifecycle: row.lifecycle,
    calculatedAt: row.calculated_at,
    clusterId: row.cluster_id,
    crossPlatformCount: row.cross_platform_count || 1,
    platformBadges: row.platform_badges || [row.source].filter(Boolean),
    clusterItems: row.cluster_items || [],
    matchConfidence: row.match_confidence,
    matchReason: row.match_reason,
  };
}

function trendSourcesForPrompt(item) {
  const rows = Array.isArray(item.clusterItems) && item.clusterItems.length ? item.clusterItems : [{
    id: item.id,
    source: item.source,
    type: item.type,
    title: item.title,
    originalUrl: item.originalUrl,
    engagement: item.engagement,
    trendScore: item.trendScore,
  }];
  return rows.slice(0, 12).map((source, index) => ({
    ref: `S${index + 1}`,
    source: source.source || 'unknown',
    type: source.type || item.type || 'post',
    title: source.title || item.title,
    url: source.originalUrl || item.originalUrl,
    engagement: source.engagement || {},
    trendScore: source.trendScore || item.trendScore || null,
  })).filter(source => source.title || source.url);
}

function cleanOption(value, fallback) {
  const text = String(value || '').trim().slice(0, 80);
  return text || fallback;
}

function extractJson(text = '') {
  const clean = String(text).replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
  return JSON.parse(clean);
}

function validateGeneratedContent(content) {
  const arrays = ['contentAngles', 'hooks', 'titles', 'hashtags', 'claimsRequiringVerification', 'sourceReferences'];
  const strings = ['whyThisTopicMatters', 'recommendedFormat', 'outline', 'scriptOrPost', 'caption', 'thumbnailText', 'cta'];
  if (!content || typeof content !== 'object') return false;
  if (!strings.every(key => typeof content[key] === 'string')) return false;
  if (!arrays.every(key => Array.isArray(content[key]) && content[key].every(value => typeof value === 'string'))) return false;
  return content.contentAngles.length === 5 && content.hooks.length === 10;
}

function allowAiGeneration(userId, limit = Number(process.env.TRENDS_AI_HOURLY_LIMIT) || 20) {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000;
  const rows = (aiGenerationWindow.get(userId) || []).filter(ts => now - ts < windowMs);
  if (rows.length >= limit) {
    aiGenerationWindow.set(userId, rows);
    return false;
  }
  rows.push(now);
  aiGenerationWindow.set(userId, rows);
  return true;
}

/* ════════════════════════════════════════════════════
   GET /api/trends/feed
   Aggregated normalized feed: news + social + developer/public-interest sources
   ════════════════════════════════════════════════════ */
router.post('/trends/refresh', authenticateUser, requireTrendAdmin, trendRefreshRateLimit, async (req, res) => {
  if (!process.env.TRENDS_REFRESH_SECRET) {
    return res.status(503).json({ success: false, error: 'TRENDS_REFRESH_SECRET is not configured' });
  }

  const locked = await withTrendRefreshLock(async () => {
    const base = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
    const params = new URLSearchParams({
      q: String(req.body?.q || req.query.q || ''),
      niche: String(req.body?.niche || req.query.niche || 'All'),
      sort: String(req.body?.sort || req.query.sort || 'trending'),
      limit: String(clamp(parseInt(req.body?.limit || req.query.limit) || 60, 1, 100)),
      enrich: String(req.body?.enrich || req.query.enrich || 'false'),
      refresh: 'true',
    });
    const response = await fetch(`${base}/api/trends/feed?${params.toString()}`, {
      headers: {
        Accept: 'application/json',
        'x-trends-refresh-secret': process.env.TRENDS_REFRESH_SECRET,
      },
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);
    return payload;
  });

  if (locked.skipped) return res.status(409).json({ success: false, error: locked.reason });
  if (!locked.ok) return res.status(500).json({ success: false, error: locked.error || 'Trend refresh failed' });
  return res.json({ success: true, refresh: locked.value });
});

router.get('/trends/feed', trendSearchRateLimit, async (req, res) => {
  const query = String(req.query.q || '').trim();
  const niche = String(req.query.niche || 'All');
  const sort = ['latest', 'saved'].includes(req.query.sort) ? req.query.sort : 'trending';
  const limit = clamp(parseInt(req.query.limit) || 40, 1, 100);
  const enrich = req.query.enrich !== 'false';
  const categories = req.query.categories || 'technology,business,entertainment,sports,finance,science,world,health,politics';
  const state = decodeCursor(req.query.cursor);
  const batch = state.batch + 1;
  const sourceLimit = Math.max(4, Math.ceil(limit / 12));
  const errors = [];
  const cacheKey = `feed:${query}:${niche}:${sort}:${limit}:${req.query.cursor || ''}:${enrich}`;

  try {
    const refresh = req.query.refresh === 'true';
    const internalRefresh = isInternalRefresh(req);
    if (refresh && !internalRefresh) {
      return res.status(403).json({ success: false, error: 'Live trend refresh is restricted to background jobs' });
    }

    const cached = refresh ? null : getCached(cacheKey);
    if (cached) return res.json(cached);

    if (!refresh) {
      const stored = await readStoredTrendItems({
        limit,
        offset: state.storedOffset || 0,
        sort,
        niche,
        query,
      });
      if (stored.ok) {
        const items = await attachTrendGrowth(stored.items);
        const nextOffset = (state.storedOffset || 0) + items.length;
        const result = {
          success: true,
          items,
          cursor: nextOffset < stored.count ? encodeCursor({ ...state, storedOffset: nextOffset }) : '',
          counts: trendCounts(items),
          errors: [],
        };
        setCached(cacheKey, result, 60 * 1000);
        return res.json(result);
      }

      const stale = getCached('feed:last-good');
      if (stale) {
        return res.json({
          ...stale,
          stale: true,
          errors: [...(stale.errors || []), { source: 'stored-feed', message: stored.error || 'Stored feed unavailable' }],
        });
      }

      return res.json({
        success: true,
        items: [],
        cursor: '',
        counts: emptyTrendCounts(),
        errors: [{ source: 'stored-feed', message: stored.error || 'Stored feed unavailable' }],
      });
    }

    const [
      newsRes,
      googleNewsRes,
      redditRes,
      youtubeRes,
      blueskyRes,
      mastodonRes,
      lemmyRes,
      hackerNewsRes,
      githubRes,
      wikipediaRes,
      devtoRes,
      stackExchangeRes,
    ] = await allSettledLimit([
      timedSource('news', () => fetchNewsFeed(categories, sourceLimit, state.newsOffset, query)),
      timedSource('google-news', () => fetchGoogleNewsRssTrends({ query, niche, limit: sourceLimit, offset: state.googleNewsOffset, batch })),
      timedSource('reddit', () => fetchRedditTrends({ query, niche, sort, limit: sourceLimit, afters: state.redditAfters, batch })),
      timedSource('youtube', () => state.newsOffset === 0 ? fetchYoutubeSearch(query || defaultBlueskyQuery(niche), sourceLimit) : Promise.resolve([])),
      timedSource('bluesky', () => fetchBlueskyTrends({ query, niche, sort, limit: sourceLimit, cursor: state.blueskyCursor, batch })),
      timedSource('mastodon', () => fetchMastodonTrends({ limit: sourceLimit, offset: state.mastodonOffset, batch })),
      timedSource('lemmy', () => fetchLemmyTrends({ limit: sourceLimit, page: state.lemmyPage, batch })),
      timedSource('hacker-news', () => fetchHackerNewsTrends({ limit: sourceLimit, offset: state.hackerNewsOffset, batch })),
      timedSource('github', () => fetchGithubTrends({ query, niche, limit: sourceLimit, page: state.githubPage, batch })),
      timedSource('wikipedia', () => fetchWikipediaTrends({ limit: sourceLimit, offset: state.wikipediaOffset, lang: 'en', batch })),
      timedSource('dev', () => fetchDevtoTrends({ query, niche, limit: sourceLimit, page: state.devtoPage, batch })),
      timedSource('stack-overflow', () => fetchStackExchangeTrends({ query, niche, limit: sourceLimit, page: state.stackExchangePage, batch })),
    ]);

    const news = newsRes.status === 'fulfilled' ? newsRes.value : [];
    if (newsRes.status === 'rejected') errors.push({ source: 'news', message: newsRes.reason?.message || 'News failed' });

    const googleNews = googleNewsRes.status === 'fulfilled' ? googleNewsRes.value.items : [];
    const googleNewsOffset = googleNewsRes.status === 'fulfilled' ? googleNewsRes.value.offset : state.googleNewsOffset;
    if (googleNewsRes.status === 'rejected') errors.push({ source: 'google-news', message: googleNewsRes.reason?.message || 'Google News failed' });

    const reddit = redditRes.status === 'fulfilled' ? redditRes.value.items : [];
    const redditAfters = redditRes.status === 'fulfilled' ? { ...state.redditAfters, ...(redditRes.value.afters || {}) } : state.redditAfters;
    if (redditRes.status === 'rejected') errors.push({ source: 'reddit', message: redditRes.reason?.message || 'Reddit failed' });

    const youtube = youtubeRes.status === 'fulfilled' ? youtubeRes.value : [];
    if (youtubeRes.status === 'rejected') errors.push({ source: 'youtube', message: youtubeRes.reason?.message || 'YouTube failed' });

    const bluesky = blueskyRes.status === 'fulfilled' ? blueskyRes.value.items : [];
    const blueskyCursor = blueskyRes.status === 'fulfilled' ? blueskyRes.value.cursor : state.blueskyCursor;
    if (blueskyRes.status === 'rejected') errors.push({ source: 'bluesky', message: blueskyRes.reason?.message || 'Bluesky failed' });

    const mastodon = mastodonRes.status === 'fulfilled' ? mastodonRes.value.items : [];
    const mastodonOffset = mastodonRes.status === 'fulfilled' ? mastodonRes.value.offset : state.mastodonOffset;
    if (mastodonRes.status === 'rejected') errors.push({ source: 'mastodon', message: mastodonRes.reason?.message || 'Mastodon failed' });

    const lemmy = lemmyRes.status === 'fulfilled' ? lemmyRes.value.items : [];
    const lemmyPage = lemmyRes.status === 'fulfilled' ? lemmyRes.value.page : state.lemmyPage;
    if (lemmyRes.status === 'rejected') errors.push({ source: 'lemmy', message: lemmyRes.reason?.message || 'Lemmy failed' });

    const hackerNews = hackerNewsRes.status === 'fulfilled' ? hackerNewsRes.value.items : [];
    const hackerNewsOffset = hackerNewsRes.status === 'fulfilled' ? hackerNewsRes.value.offset : state.hackerNewsOffset;
    if (hackerNewsRes.status === 'rejected') errors.push({ source: 'hackernews', message: hackerNewsRes.reason?.message || 'Hacker News failed' });

    const github = githubRes.status === 'fulfilled' ? githubRes.value.items : [];
    const githubPage = githubRes.status === 'fulfilled' ? githubRes.value.page : state.githubPage;
    if (githubRes.status === 'rejected') errors.push({ source: 'github', message: githubRes.reason?.message || 'GitHub failed' });

    const wikipedia = wikipediaRes.status === 'fulfilled' ? wikipediaRes.value.items : [];
    const wikipediaOffset = wikipediaRes.status === 'fulfilled' ? wikipediaRes.value.offset : state.wikipediaOffset;
    if (wikipediaRes.status === 'rejected') errors.push({ source: 'wikipedia', message: wikipediaRes.reason?.message || 'Wikipedia failed' });

    const devto = devtoRes.status === 'fulfilled' ? devtoRes.value.items : [];
    const devtoPage = devtoRes.status === 'fulfilled' ? devtoRes.value.page : state.devtoPage;
    if (devtoRes.status === 'rejected') errors.push({ source: 'devto', message: devtoRes.reason?.message || 'DEV failed' });

    const stackExchange = stackExchangeRes.status === 'fulfilled' ? stackExchangeRes.value.items : [];
    const stackExchangePage = stackExchangeRes.status === 'fulfilled' ? stackExchangeRes.value.page : state.stackExchangePage;
    if (stackExchangeRes.status === 'rejected') errors.push({ source: 'stackexchange', message: stackExchangeRes.reason?.message || 'Stack Exchange failed' });

    const rawItems = [
      ...news.map(item => normalizeNewsArticle(item, batch)),
      ...googleNews,
      ...reddit,
      ...youtube.map(item => normalizeYoutubeVideo(item, batch)),
      ...bluesky,
      ...mastodon,
      ...lemmy,
      ...hackerNews,
      ...github,
      ...wikipedia,
      ...devto,
      ...stackExchange,
    ];

    const seen = new Set(state.seenIds || []);
    const deduped = rawItems.filter(item => {
      if (!item.id || seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    }).filter(validateTrendItem);

    const clustered = clusterTrendItems(deduped);
    const scored = applyTrendScores(clustered);
    const sorted = sortTrendItems(filterByNiche(scored, niche), sort).slice(0, limit);
    const enrichedItems = enrich ? await enrichTrendItems(sorted) : sorted;
    await upsertTrendItems(enrichedItems);
    await captureTrendSnapshots(enrichedItems);
    const items = await attachTrendGrowth(enrichedItems);
    const returnedIds = items.flatMap(item => [
      item.id,
      ...(Array.isArray(item.clusterItems) ? item.clusterItems.map(clusterItem => clusterItem.id) : []),
    ]).filter(Boolean);
    const seenIds = [...(state.seenIds || []), ...returnedIds].slice(-300);
    const cursor = encodeCursor({
      newsOffset: state.newsOffset + sourceLimit,
      googleNewsOffset,
      redditAfters,
      blueskyCursor,
      mastodonOffset,
      lemmyPage,
      hackerNewsOffset,
      githubPage,
      wikipediaOffset,
      devtoPage,
      stackExchangePage,
      seenIds,
      batch,
    });

    const result = {
      success: true,
      items,
      cursor,
      counts: trendCounts(items),
      errors,
    };
    setCached(cacheKey, result, 2 * 60 * 1000);
    setCached('feed:last-good', result, 60 * 60 * 1000);
    res.json(result);
  } catch (err) {
    console.error('[Trends/feed] Error:', err.response?.data || err.message);
    const stale = getCached('feed:last-good');
    if (stale) return res.json({ ...stale, stale: true, errors: [...(stale.errors || []), { source: 'feed', message: err.message }] });
    res.json({ success: true, items: [], cursor: '', counts: emptyTrendCounts(), errors: [{ source: 'feed', message: err.message }] });
  }
});

router.get('/trends/cluster/:id', async (req, res) => {
  const id = decodeURIComponent(String(req.params.id || ''));
  if (!id) return res.status(400).json({ success: false, error: 'Trend id is required' });

  try {
    const { default: supabase } = await import('../services/supabase.js');
    let { data: row, error } = await supabase.from('trend_items').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    if (!row) {
      const result = await supabase.from('trend_items').select('*').eq('cluster_id', id).order('trend_score', { ascending: false }).limit(1).maybeSingle();
      if (result.error) throw result.error;
      row = result.data;
    }
    if (!row) return res.status(404).json({ success: false, error: 'Trend not found' });

    const item = rowToTrendItem(row);
    let snapshotQuery = supabase
      .from('trend_snapshots')
      .select('trend_item_id,cluster_id,source,engagement,trend_score,captured_at')
      .order('captured_at', { ascending: true })
      .limit(200);
    snapshotQuery = item.clusterId ? snapshotQuery.eq('cluster_id', item.clusterId) : snapshotQuery.eq('trend_item_id', item.id);
    const { data: snapshots, error: snapshotError } = await snapshotQuery;
    if (snapshotError) throw snapshotError;

    res.json({ success: true, item, snapshots: snapshots || [] });
  } catch (err) {
    console.warn('[Trends/detail] read skipped:', err.message);
    res.status(503).json({ success: false, error: err.message });
  }
});

router.get('/trends/cluster/:id/content', authenticateUser, async (req, res) => {
  const id = decodeURIComponent(String(req.params.id || ''));
  try {
    const { default: supabase } = await import('../services/supabase.js');
    let query = supabase
      .from('trend_content_drafts')
      .select('id,trend_item_id,cluster_id,target_platform,content_language,content_format,content_goal,tone,target_audience,content,source_references,created_at,updated_at')
      .eq('user_id', req.user.userId)
      .order('created_at', { ascending: false })
      .limit(1);
    query = id.startsWith('cluster:') ? query.eq('cluster_id', id) : query.or(`trend_item_id.eq.${id},cluster_id.eq.${id}`);
    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    res.json({ success: true, draft: data || null });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to load trend draft' });
  }
});

router.patch('/trends/content/:draftId', authenticateUser, async (req, res) => {
  const content = req.body?.content;
  if (!validateGeneratedContent(content)) return res.status(400).json({ success: false, error: 'Invalid draft content JSON' });

  try {
    const { default: supabase } = await import('../services/supabase.js');
    const { data, error } = await supabase
      .from('trend_content_drafts')
      .update({ content, updated_at: new Date().toISOString() })
      .eq('id', req.params.draftId)
      .eq('user_id', req.user.userId)
      .select('id,content,updated_at')
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, error: 'Draft not found' });
    res.json({ success: true, draft: data });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to save trend draft' });
  }
});

router.post('/trends/cluster/:id/content', authenticateUser, async (req, res) => {
  const id = decodeURIComponent(String(req.params.id || ''));
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(503).json({ success: false, error: 'AI content generation is not configured' });

  const options = {
    targetPlatform: cleanOption(req.body?.targetPlatform, 'Instagram'),
    contentLanguage: cleanOption(req.body?.contentLanguage, 'English'),
    contentFormat: cleanOption(req.body?.contentFormat, 'Short post'),
    contentGoal: cleanOption(req.body?.contentGoal, 'Educate'),
    tone: cleanOption(req.body?.tone, 'Clear and practical'),
    targetAudience: cleanOption(req.body?.targetAudience, 'Creators'),
  };

  try {
    const { default: supabase } = await import('../services/supabase.js');
    let { data: row, error } = await supabase.from('trend_items').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    if (!row) {
      const result = await supabase.from('trend_items').select('*').eq('cluster_id', id).order('trend_score', { ascending: false }).limit(1).maybeSingle();
      if (result.error) throw result.error;
      row = result.data;
    }
    if (!row) return res.status(404).json({ success: false, error: 'Stored trend not found' });

    const item = rowToTrendItem(row);
    const sources = trendSourcesForPrompt(item);
    if (!sources.length) return res.status(422).json({ success: false, error: 'No stored source items available for this trend' });

    const prompt = {
      trend: {
        title: item.title,
        description: item.description,
        category: item.category,
        tags: item.tags,
        scoreBreakdown: item.scoreBreakdown,
        lifecycle: item.lifecycle,
      },
      options,
      sources,
      outputShape: {
        whyThisTopicMatters: 'string',
        contentAngles: ['exactly 5 strings'],
        hooks: ['exactly 10 strings'],
        recommendedFormat: 'string',
        outline: 'string',
        scriptOrPost: 'string',
        caption: 'string',
        titles: ['strings'],
        thumbnailText: 'string',
        cta: 'string',
        hashtags: ['strings'],
        claimsRequiringVerification: ['strings'],
        sourceReferences: ['source refs like S1, S2 with short reason'],
      },
    };

    if (!allowAiGeneration(req.user.userId)) return res.status(429).json({ success: false, error: 'AI generation limit reached. Try again later.' });

    const ai = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: process.env.TRENDS_OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.35,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You create social content plans grounded only in provided source items. Do not invent facts, numbers, quotes, names, or claims. If a claim is not directly supported, put it in claimsRequiringVerification. Return only valid JSON matching the requested shape.',
        },
        { role: 'user', content: JSON.stringify(prompt) },
      ],
    }, {
      timeout: 20000,
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    });

    const content = extractJson(ai.data?.choices?.[0]?.message?.content || '{}');
    if (!validateGeneratedContent(content)) {
      return res.status(502).json({ success: false, error: 'AI returned invalid content JSON' });
    }

    const sourceReferences = sources.map(source => ({ ref: source.ref, source: source.source, title: source.title, url: source.url }));
    const { data: draft, error: draftError } = await supabase.from('trend_content_drafts').insert({
      user_id: req.user.userId,
      trend_item_id: item.id,
      cluster_id: item.clusterId,
      target_platform: options.targetPlatform,
      content_language: options.contentLanguage,
      content_format: options.contentFormat,
      content_goal: options.contentGoal,
      tone: options.tone,
      target_audience: options.targetAudience,
      content: { ...content, sourceReferences: content.sourceReferences },
      source_references: sourceReferences,
    }).select('id,created_at').single();
    if (draftError) throw draftError;

    res.json({ success: true, draft: { ...draft, content, sourceReferences, options } });
  } catch (err) {
    console.error('[Trends/content] generation failed:', err.response?.data || err.message);
    res.status(500).json({ success: false, error: 'Failed to generate trend content' });
  }
});

/* ════════════════════════════════════════════════════
   GET /api/trends/reddit?sr=memes&limit=10&after=token
   Returns: { success: true, posts: [], after: '' }
   ════════════════════════════════════════════════════ */
router.get('/trends/reddit', async (req, res) => {
  const sr    = req.query.sr || 'memes';
  const limit = Math.min(parseInt(req.query.limit) || 10, 50);
  const after = req.query.after || '';
  const cacheKey = `reddit:${sr}:${limit}:${after}`;

  try {
    const refresh = req.query.refresh === 'true';
    const cached = refresh ? null : getCached(cacheKey);
    if (cached) return res.json(cached);

    let { posts, after: nextAfter } = await fetchRedditHot(sr, limit, after);
    posts = posts.map(post => validateTrendItem(post) ? post : normalizeRedditPost(post, 0)).filter(validateTrendItem);
    if (!posts.length && sr === 'popular') {
      const fallback = await fetchRedditTrends({ niche: 'All', limit });
      posts = fallback.items || [];
      nextAfter = fallback.afters?.popular || nextAfter;
    }

    console.log(`[Reddit] r/${sr} → ${posts.length} visual posts fetched`);

    const result = { success: true, posts, after: nextAfter };
    cache.set(cacheKey, { data: result, ts: Date.now() });
    setTimeout(() => cache.delete(cacheKey), REDDIT_CACHE_TTL);
    res.json(result);
  } catch (err) {
    console.error(`[Trends/reddit] Error fetching r/${sr}:`, err.response?.status, err.message);
    res.json({ success: true, posts: [], after: null, error: err.message });
  }
});

/* ════════════════════════════════════════════════════
   GET /api/trends/images?q=topic&limit=9
   Returns: [{ id, url, alt, photographer, source }]
   Strategy: Unsplash first → Pexels fallback
   ════════════════════════════════════════════════════ */
router.get('/trends/images', async (req, res) => {
  // Paused as requested: news articles already contain images
  return res.json({ success: true, images: [], source: 'paused' });
  
  /* Original logic:
  const q       = (req.query.q || 'abstract texture').slice(0, 60).replace(/tiktok|logo/gi, '') + ' -logo -tiktok';
  ...
  */
});

/* ─── Unsplash helper ─── */
router.get('/trends/youtube', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 10, 25);
  const query = req.query.q || req.query.query || 'trending videos India';
  const cacheKey = `youtube:${query}:${limit}`;

  try {
    const refresh = req.query.refresh === 'true';
    const cached = refresh ? null : getCached(cacheKey);
    if (cached) return res.json(cached);

    if (!SERPAPI_KEY) return res.json({ success: true, videos: [], error: 'SERPAPI_KEY is not configured' });

    const videos = (await fetchYoutubeSearch(query, limit)).map(video => normalizeYoutubeVideo(video, 0)).filter(validateTrendItem);

    const result = { success: true, videos };
    setCached(cacheKey, result);
    res.json(result);
  } catch (err) {
    console.error('[Trends/youtube] Error:', err.response?.data?.error || err.message);
    res.json({ success: true, videos: [], error: err.response?.data?.error || err.message });
  }
});

router.get('/trends/instagram/profile', async (req, res) => {
  const profileId = String(req.query.profile_id || req.query.username || '').replace(/^@/, '').trim();
  const cacheKey = `instagram-profile:${profileId}`;

  if (!profileId) return res.status(400).json({ success: false, error: 'profile_id is required' });

  try {
    const refresh = req.query.refresh === 'true';
    const cached = refresh ? null : getCached(cacheKey);
    if (cached) return res.json(cached);

    if (!SERPAPI_KEY) {
      return res.json({ success: true, profile: null, error: 'SERPAPI_KEY is not configured' });
    }

    const r = await axios.get('https://serpapi.com/search.json', {
      params: {
        engine: 'instagram_profile',
        profile_id: profileId,
        api_key: SERPAPI_KEY,
      },
      timeout: 9000,
    });

    const profile = r.data?.profile_results || null;
    const result = { success: true, profile };
    setCached(cacheKey, result);
    res.json(result);
  } catch (err) {
    console.error('[Trends/instagram/profile] Error:', err.response?.data?.error || err.message);
    res.json({ success: true, profile: null, error: err.response?.data?.error || err.message });
  }
});

async function fetchUnsplash(q, limit) {
  try {
    const r = await axios.get('https://api.unsplash.com/search/photos', {
      params: { query: q, per_page: limit, orientation: 'squarish', content_filter: 'high' },
      headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` },
      timeout: 7000,
    });
    return (r.data?.results || []).map(p => ({
      id:           p.id,
      url:          p.urls?.regular || p.urls?.small,
      alt:          p.alt_description || q,
      photographer: p.user?.name || '',
      link:         p.links?.html || '',
      source:       'unsplash',
    })).filter(p => p.url);
  } catch (e) {
    console.warn('[Unsplash] failed:', e.message);
    return [];
  }
}

/* ─── Pexels helper ─── */
async function fetchPexels(q, limit) {
  try {
    const r = await axios.get('https://api.pexels.com/v1/search', {
      params: { query: q, per_page: limit },
      headers: { Authorization: PEXELS_KEY },
      timeout: 7000,
    });
    return (r.data?.photos || []).map(p => ({
      id:           String(p.id),
      url:          p.src?.medium || p.src?.small,
      alt:          p.alt || q,
      photographer: p.photographer || '',
      link:         p.url || '',
      source:       'pexels',
    })).filter(p => p.url);
  } catch (e) {
    console.warn('[Pexels] failed:', e.message);
    return [];
  }
}

/* ════════════════════════════════════════════════════
   GET /api/trends/proxy/media?url=...
   Securely pipes external media (images/videos) to bypass CORS.
   ════════════════════════════════════════════════════ */
router.get('/trends/proxy/media', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).send('URL is required');

  try {
    const mediaUrl = await getPublicMediaUrl(String(url));
    const response = await axios({
      method: 'get',
      url: mediaUrl.href,
      responseType: 'stream',
      timeout: 15000,
      maxRedirects: 3,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/*,video/*,*/*',
        'Referer': mediaUrl.origin,
      }
    });

    // Forward headers
    const contentType = response.headers['content-type'];
    const contentLength = Number(response.headers['content-length'] || 0);
    if (!contentType || !/^(image|video)\//i.test(contentType)) {
      response.data.destroy();
      return res.status(415).send('Only image and video media are allowed');
    }
    if (contentLength > MAX_PROXY_BYTES) {
      response.data.destroy();
      return res.status(413).send('Media is too large');
    }
    if (contentType) res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=3600');

    // Safe piping with error handling
    response.data.on('error', (err) => {
      console.error('[MediaProxy] Stream Error:', err.message);
      if (!res.headersSent) res.status(500).send('Stream error');
    });

    response.data.pipe(res);
  } catch (err) {
    console.error('[MediaProxy] Failed to fetch:', url, err.message);
    if (!res.headersSent) {
      res.status(err.statusCode || err.response?.status || 500).send(err.message);
    }
  }
});

export default router;
