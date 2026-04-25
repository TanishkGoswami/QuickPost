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
const UNSPLASH_KEY   = process.env.UNSPLASH_ACCESS_KEY || 'lTnkFzPeRbzgETGx5INHt0C-AArQernuA1SlTNMOoi0';
const PEXELS_KEY     = process.env.PEXELS_KEY || 'NjsUMYPtdooRLygU6RCQyBLQopdjpVBw7vD9UOqd8hwJslb3aZjFtBir';

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
  const cacheKey   = `news:${categories}:${limit}:${offset}`;

  try {
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    let articles = [];

    // 1. Try GNews (High Quality, 401 check passed)
    articles = await fetchGNews(categories, limit, offset);

    // 2. Try NewsAPI if GNews failed or returned nothing
    if (!articles.length) {
      articles = await fetchNewsAPI(categories, limit, offset);
    }

    // 3. Fallback to Mediastack (Note: user's key might be invalid)
    if (!articles.length) {
      articles = await fetchMediastack(categories, limit, offset);
    }

    // Deduplicate by title
    const seen = new Set();
    const unique = articles.filter(a => {
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

/* ─── GNews Fetcher ─── */
async function fetchGNews(categories, limit, offset) {
  try {
    // GNews uses 'category' (singular) and limited set: general, world, nation, business, technology, entertainment, sports, science, health
    const catArray = categories.split(',');
    const primaryCat = catArray[0] || 'general';
    
    const r = await axios.get('https://gnews.io/api/v4/top-headlines', {
      params: {
        category: primaryCat === 'business' || primaryCat === 'technology' ? primaryCat : 'general',
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
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    const r = await axios.get(`https://www.reddit.com/r/${sr}/top.json`, {
      params: { limit, after, t: 'day' },
      headers: { 'User-Agent': 'QuickPost/1.0 (content trends browser)' },
      timeout: 8000
    });

    const posts = (r.data?.data?.children || [])
      .map(c => c.data)
      .filter(p => !p.over_18)
      .map(p => {
        // 1. Resolve Best Image URL
        let image = p.url;
        
        // If it's a reddit preview link, use the source preview (better for galleries/previews)
        if (p.preview?.images?.[0]?.source?.url) {
          image = p.preview.images[0].source.url;
        }

        // Clean up Reddit's escaped &amp; in URLs
        if (image) {
          image = image.replace(/&amp;/g, '&');
        }

        // 2. Resolve Video URL if present
        let videoUrl = p.media?.reddit_video?.fallback_url || null;
        if (p.is_video && !videoUrl) {
           videoUrl = p.url_overridden_by_dest;
        }
        if (videoUrl) {
           videoUrl = videoUrl.replace(/&amp;/g, '&');
        }

        // 3. Determine content type
        const isVideo = p.is_video || !!p.media?.reddit_video;
        const isImage = !!p.post_hint?.includes('image') || /\.(jpg|jpeg|png|gif|webp)$/i.test(p.url || '');

        return {
          id: p.id,
          title: p.title,
          image: image,
          score: p.score,
          upvotes: p.ups,
          comments: p.num_comments,
          subreddit: p.subreddit,
          link: `https://reddit.com${p.permalink}`,
          isVideo,
          videoUrl,
          isImage
        };
      })
      .filter(p => p.isImage || p.isVideo); // Only return visual content

    const result = { success: true, posts, after: r.data?.data?.after };
    // Use shorter TTL for reddit
    cache.set(cacheKey, { data: result, ts: Date.now() });
    setTimeout(() => cache.delete(cacheKey), REDDIT_CACHE_TTL);
    res.json(result);
  } catch (err) {
    console.error(`[Trends/reddit] Error fetching r/${sr}:`, err.message);
    res.json({ success: true, posts: [], after: null });
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

export default router;
