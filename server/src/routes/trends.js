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

const router = express.Router();

/* ─── Env keys (set in server/.env) ─── */
const MEDIASTACK_KEY = process.env.MEDIASTACK_KEY || 'M5ePAD0fTocmbUmeS7PvgTgNef21lNeFlsz4iMlV';
const GNEWS_KEY      = process.env.GNEWS_KEY      || '9f3ea046c6585addcb309df3e9f2bf6c';
const NEWSAPI_KEY    = process.env.NEWSAPI_KEY    || 'aa9d598f3ce24d77ab5a6447d4af776c';
const GUARDIAN_KEY   = process.env.GUARDIAN_KEY   || '519170c1-21a1-4482-ba55-2a965fdf0258';
const UNSPLASH_KEY   = process.env.UNSPLASH_ACCESS_KEY || 'lTnkFzPeRbzgETGx5INHt0C-AArQernuA1SlTNMOoi0';
const PEXELS_KEY     = process.env.PEXELS_KEY || 'NjsUMYPtdooRLygU6RCQyBLQopdjpVBw7vD9UOqd8hwJslb3aZjFtBir';
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
  if (Date.now() - entry.ts > CACHE_TTL) { cache.delete(key); return null; }
  return entry.data;
}
function setCached(key, data) {
  cache.set(key, { data, ts: Date.now() });
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

    const result = { success: true, articles: unique };
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

    // Use hot.json — more reliable than top.json. Browser UA to avoid Reddit's bot block.
    const r = await axios.get(`https://www.reddit.com/r/${sr}/hot.json`, {
      params: { limit, after, raw_json: 1 },
      headers: {
        'User-Agent': REDDIT_UA,
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
      },
      timeout: 10000
    });

    const posts = (r.data?.data?.children || [])
      .map(c => c.data)
      .filter(p => !p.over_18 && !p.stickied)
      .map(p => {
        // Best image: preview > thumbnail > url
        let image = null;

        if (p.preview?.images?.[0]?.source?.url) {
          image = p.preview.images[0].source.url.replace(/&amp;/g, '&');
        } else if (p.thumbnail && p.thumbnail.startsWith('http')) {
          image = p.thumbnail;
        } else if (/\.(jpg|jpeg|png|gif|webp)$/i.test(p.url || '')) {
          image = p.url;
        }

        // Video URL
        let videoUrl = p.media?.reddit_video?.fallback_url?.replace(/&amp;/g, '&') || null;
        if (p.is_video && !videoUrl) videoUrl = p.url_overridden_by_dest;

        const isVideo = p.is_video || !!p.media?.reddit_video;
        const isImage = !!image;

        return {
          id:        p.id,
          title:     p.title,
          image,
          score:     p.score,
          upvotes:   p.ups,
          comments:  p.num_comments,
          subreddit: p.subreddit,
          url:       `https://reddit.com${p.permalink}`,
          link:      `https://reddit.com${p.permalink}`,
          isVideo,
          videoUrl,
          isImage,
        };
      })
      .filter(p => p.image || p.isVideo); // include any post with image or video

    console.log(`[Reddit] r/${sr} → ${posts.length} visual posts fetched`);

    const result = { success: true, posts, after: r.data?.data?.after };
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

    if (!SERPAPI_KEY) {
      return res.json({ success: true, videos: [], error: 'SERPAPI_KEY is not configured' });
    }

    const r = await axios.get('https://serpapi.com/search.json', {
      params: {
        engine: 'youtube',
        search_query: query,
        gl: 'IN',
        hl: 'en',
        api_key: SERPAPI_KEY,
      },
      timeout: 9000,
    });

    const videos = (r.data?.video_results || [])
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
    const response = await axios({
      method: 'get',
      url: url,
      responseType: 'stream',
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/*,video/*,*/*',
        'Referer': new URL(url).origin,
      }
    });

    // Forward headers
    const contentType = response.headers['content-type'];
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
      res.status(err.response?.status || 500).send(err.message);
    }
  }
});

export default router;
