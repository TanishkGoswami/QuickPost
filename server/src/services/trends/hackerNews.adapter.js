import { httpGet, withTrendDefaults } from './shared.js';

const HN_BASE = 'https://hacker-news.firebaseio.com/v0';

export function normalizeHackerNewsItem(item, batch = 0) {
  return withTrendDefaults({
    id: `hackernews:${item.id}`,
    type: 'hackernews',
    platform: 'Hacker News',
    title: item.title || '',
    summary: item.text || '',
    url: item.url || `https://news.ycombinator.com/item?id=${item.id}`,
    author: item.by || 'Hacker News',
    publishedAt: item.time ? new Date(item.time * 1000).toISOString() : null,
    engagement: {
      points: item.score || 0,
      comments: item.descendants || 0,
    },
    _batch: batch,
  });
}

export async function fetchHackerNewsTrends({ limit = 10, offset = 0, batch = 0 }) {
  const idsRes = await httpGet(`${HN_BASE}/topstories.json`, { timeout: 7000 });
  const ids = (idsRes.data || []).slice(offset, offset + limit);
  const settled = await Promise.allSettled(ids.map(id => httpGet(`${HN_BASE}/item/${id}.json`, { timeout: 6000 })));

  return {
    items: settled
      .filter(r => r.status === 'fulfilled' && r.value.data?.title)
      .map(r => normalizeHackerNewsItem(r.value.data, batch)),
    offset: offset + limit,
  };
}
