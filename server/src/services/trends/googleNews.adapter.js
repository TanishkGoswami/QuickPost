import { defaultTrendQuery, httpGet, parseRssItems, withTrendDefaults } from './shared.js';

function rssQuery(query, niche) {
  return (query || defaultTrendQuery(niche)).trim();
}

export function normalizeGoogleNewsItem(item, batch = 0) {
  return withTrendDefaults({
    id: `google-news:${item.url}`,
    type: 'news',
    platform: 'Google News',
    source: 'Google News',
    title: item.title,
    summary: item.description || '',
    url: item.url,
    image: item.image || null,
    author: 'Google News',
    publishedAt: item.publishedAt,
    engagement: {},
    _batch: batch,
  });
}

export async function fetchGoogleNewsRssTrends({ query = '', niche = 'All', limit = 10, offset = 0, lang = 'en', batch = 0 }) {
  if (offset > 0) return { items: [], offset };

  const language = lang === 'hi' ? 'hi' : 'en';
  const country = 'IN';
  const r = await httpGet('https://news.google.com/rss/search', {
    text: true,
    params: {
      q: rssQuery(query, niche),
      hl: `${language}-IN`,
      gl: country,
      ceid: `${country}:${language}`,
    },
    timeout: 7000,
  });

  return {
    items: parseRssItems(r.data).slice(0, limit).map(item => normalizeGoogleNewsItem(item, batch)),
    offset: offset + limit,
  };
}
