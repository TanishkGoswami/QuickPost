import { defaultTrendQuery, httpGet, withTrendDefaults } from './shared.js';

const BSKY_API_URL = 'https://api.bsky.app/xrpc';

export function normalizeBlueskyPost(post, batch = 0) {
  const record = post.record || {};
  const embed = post.embed?.external || post.embed?.images?.[0] || null;
  const rkey = String(post.uri || '').split('/').pop();
  const handle = post.author?.handle || post.author?.did || 'bsky.app';

  return withTrendDefaults({
    id: post.uri || `bluesky:${post.cid || rkey}`,
    type: 'bluesky',
    platform: 'Bluesky',
    title: record.text || post.embed?.external?.title || 'Bluesky post',
    summary: embed?.description || '',
    url: rkey ? `https://bsky.app/profile/${handle}/post/${rkey}` : 'https://bsky.app',
    image: embed?.thumb || embed?.fullsize || null,
    author: post.author?.displayName || handle,
    handle,
    avatar: post.author?.avatar || null,
    publishedAt: record.createdAt || post.indexedAt || null,
    engagement: {
      likes: post.likeCount || 0,
      reposts: post.repostCount || 0,
      replies: post.replyCount || 0,
      quotes: post.quoteCount || 0,
    },
    _batch: batch,
  });
}

export async function fetchBlueskyTrends({ query = '', niche = 'All', sort = 'trending', limit = 10, cursor = '', batch = 0 }) {
  let r;
  try {
    r = await httpGet(`${BSKY_API_URL}/app.bsky.feed.searchPosts`, {
      params: {
        q: query || defaultTrendQuery(niche),
        sort: sort === 'latest' ? 'latest' : 'top',
        limit: Math.min(Math.max(Number(limit) || 25, 1), 100),
        ...(cursor ? { cursor } : {}),
      },
      timeout: 8000,
    });
  } catch (err) {
    if (err.response?.status === 403) {
      console.warn('[Bluesky] searchPosts returned 403; skipping Bluesky for this feed request');
      return { items: [], cursor: '' };
    }
    throw err;
  }

  return {
    items: (r.data?.posts || []).map(post => normalizeBlueskyPost(post, batch)).filter(item => item.title),
    cursor: r.data?.cursor || '',
  };
}
