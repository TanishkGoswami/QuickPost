import { httpGet, validateTrendItem, withTrendDefaults } from './shared.js';

const LEMMY_BASE = 'https://lemmy.world';

export function normalizeLemmyPost(view, batch = 0) {
  const post = view.post || view;
  const counts = view.counts || {};
  const creator = view.creator || {};
  const community = view.community || {};

  return withTrendDefaults({
    id: `lemmy:${post.ap_id || post.id}`,
    type: 'lemmy',
    platform: 'Lemmy',
    title: post.name || '',
    summary: post.body || community.title || '',
    url: post.ap_id || post.url || `${LEMMY_BASE}/post/${post.id}`,
    image: post.thumbnail_url || null,
    author: creator.display_name || creator.name || community.title || 'Lemmy',
    handle: community.name || creator.name || '',
    avatar: creator.avatar || community.icon || null,
    publishedAt: post.published || post.updated || null,
    engagement: {
      score: counts.score || 0,
      comments: counts.comments || 0,
      upvotes: counts.upvotes || 0,
    },
    _batch: batch,
  });
}

export async function fetchLemmyTrends({ limit = 10, page = 1, batch = 0 }) {
  const r = await httpGet(`${LEMMY_BASE}/api/v3/post/list`, {
    params: { sort: 'Hot', limit: Math.min(limit, 50), page },
    timeout: 7000,
  });

  return {
    items: (r.data?.posts || []).map(post => normalizeLemmyPost(post, batch)).filter(validateTrendItem),
    page: page + 1,
  };
}
