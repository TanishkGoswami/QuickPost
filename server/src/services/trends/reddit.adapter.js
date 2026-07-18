import { defaultTrendQuery, httpGet, validateTrendItem, withTrendDefaults } from './shared.js';

const REDDIT_UA = 'QuickPost-Trends/1.0 by QuickPost';

export function pickSubreddits(niche = 'All') {
  const byNiche = {
    'AI & Tech': ['technology', 'singularity', 'Futurology', 'ChatGPT'],
    Business: ['Entrepreneur', 'business', 'startups', 'SaaS'],
    Sports: ['Cricket', 'ipl', 'sports', 'football'],
    Trading: ['StockMarket', 'IndiaInvestments', 'Daytrading', 'TradingView'],
    Crypto: ['CryptoCurrency', 'Bitcoin', 'ethereum', 'defi'],
    Entertainment: ['movies', 'BollyBlindsNGossip', 'television', 'entertainment'],
    Music: ['Music', 'MusicNews', 'indieheads', 'popheads'],
    Politics: ['worldnews', 'news', 'india'],
    Fitness: ['Fitness', 'bodyweightfitness', 'nutrition', 'GymMotivation'],
  };
  return (byNiche[niche] || ['popular']).slice(0, 4);
}

function normalizeRedditApiPosts(posts, batch) {
  return posts
    .filter(p => p && !p.over_18 && !p.stickied)
    .map(p => {
      const image =
        p.preview?.images?.[0]?.source?.url?.replace(/&amp;/g, '&') ||
        (p.thumbnail?.startsWith('http') ? p.thumbnail : '') ||
        (/\.(jpg|jpeg|png|gif|webp)$/i.test(p.url || '') ? p.url : '');
      const videoUrl = p.media?.reddit_video?.fallback_url?.replace(/&amp;/g, '&') || (p.is_video ? p.url_overridden_by_dest : '');
      const permalink = p.permalink ? `https://reddit.com${p.permalink}` : p.full_link || p.url;

      return withTrendDefaults({
        id: `reddit:${p.id || permalink}`,
        type: 'reddit',
        platform: 'Reddit',
        title: p.title || '',
        summary: `r/${p.subreddit || 'popular'}`,
        url: permalink,
        image: image || null,
        videoUrl: videoUrl || null,
        isVideo: Boolean(videoUrl),
        upvotes: p.ups || p.score || 0,
        comments: p.num_comments || 0,
        subreddit: p.subreddit || 'popular',
        author: `r/${p.subreddit || 'popular'}`,
        handle: p.subreddit || 'popular',
        publishedAt: p.created_utc ? new Date(p.created_utc * 1000).toISOString() : null,
        engagement: { upvotes: p.ups || p.score || 0, comments: p.num_comments || 0 },
        _batch: batch,
      });
    })
    .filter(validateTrendItem);
}

async function fetchListing(url, params, batch) {
  const r = await httpGet(url, {
    params: { raw_json: 1, ...params },
    headers: { 'Cache-Control': 'no-cache' },
    userAgent: REDDIT_UA,
    timeout: 8000,
  });
  return {
    items: normalizeRedditApiPosts((r.data?.data?.children || []).map(c => c.data), batch),
    after: r.data?.data?.after || null,
  };
}

async function fetchPullPush({ query, subreddit, limit, batch }) {
  const r = await httpGet('https://api.pullpush.io/reddit/search/submission/', {
    params: {
      size: limit,
      sort: 'desc',
      sort_type: 'score',
      ...(query ? { q: query } : {}),
      ...(subreddit && subreddit !== 'popular' ? { subreddit } : {}),
    },
    timeout: 8000,
  });
  return { items: normalizeRedditApiPosts(r.data?.data || [], batch), after: null };
}

export async function fetchRedditTrends({ query = '', niche = 'All', limit = 10, afters = {}, batch = 0 }) {
  try {
    if (query) {
      return await fetchListing('https://www.reddit.com/search.json', { q: query, sort: 'hot', limit, after: afters.search || '' }, batch);
    }

    if (niche === 'All') {
      return await fetchListing('https://www.reddit.com/r/popular/hot.json', { limit, after: afters.popular || '' }, batch);
    }

    const subs = pickSubreddits(niche);
    const settled = await Promise.allSettled(subs.map(sr =>
      fetchListing(`https://www.reddit.com/r/${sr}/hot.json`, { limit: Math.ceil(limit / subs.length) + 2, after: afters[sr] || '' }, batch)
        .then(result => ({ sr, ...result }))
    ));
    const combined = settled.reduce((acc, result) => {
      if (result.status === 'fulfilled') {
        acc.items.push(...result.value.items);
        if (result.value.after) acc.afters[result.value.sr] = result.value.after;
      }
      return acc;
    }, { items: [], afters: {} });
    if (combined.items.length) return combined;
    return await fetchPullPush({ query: defaultTrendQuery(niche), subreddit: pickSubreddits(niche)[0], limit, batch });
  } catch (err) {
    console.warn('[Reddit] public JSON failed, using fallback:', err.response?.status || err.message);
    const fallback = await fetchPullPush({ query: query || defaultTrendQuery(niche), subreddit: niche === 'All' ? '' : pickSubreddits(niche)[0], limit, batch });
    return { ...fallback, afters: {} };
  }
}

export { normalizeRedditApiPosts };
