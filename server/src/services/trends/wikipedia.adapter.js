import { DAY_MS, httpGet, withTrendDefaults } from './shared.js';

function wikiDate(daysAgo = 1) {
  const d = new Date(Date.now() - daysAgo * DAY_MS);
  return {
    yyyy: d.getUTCFullYear(),
    mm: String(d.getUTCMonth() + 1).padStart(2, '0'),
    dd: String(d.getUTCDate()).padStart(2, '0'),
  };
}

export function normalizeWikipediaArticle(article, lang = 'en', batch = 0, date = new Date(Date.now() - DAY_MS)) {
  const title = String(article.article || '').replace(/_/g, ' ');
  return withTrendDefaults({
    id: `wikipedia:${lang}:${article.article}`,
    type: 'wikipedia',
    platform: lang === 'hi' ? 'Wikipedia Hindi' : 'Wikipedia',
    title,
    summary: `${article.views || 0} page views yesterday`,
    url: `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(article.article || '')}`,
    author: 'Wikipedia',
    publishedAt: date.toISOString(),
    engagement: { views: article.views || 0 },
    _batch: batch,
  });
}

export async function fetchWikipediaTrends({ limit = 10, offset = 0, lang = 'en', batch = 0 }) {
  let r;
  let usedDate;

  for (const daysAgo of [1, 2, 3, 7, 30, 365, 366]) {
    const date = wikiDate(daysAgo);
    try {
      r = await httpGet(`https://wikimedia.org/api/rest_v1/metrics/pageviews/top/${lang}.wikipedia/all-access/${date.yyyy}/${date.mm}/${date.dd}`, {
        timeout: 7000,
        retry: false,
      });
      usedDate = new Date(Date.now() - daysAgo * DAY_MS);
      break;
    } catch (err) {
      if (err.response?.status !== 404) throw err;
    }
  }

  if (!r) return { items: [], offset };

  const articles = r.data?.items?.[0]?.articles || [];

  return {
    items: articles
      .filter(a => a.article && !String(a.article).startsWith('Special:'))
      .slice(offset, offset + limit)
      .map(a => normalizeWikipediaArticle(a, lang, batch, usedDate)),
    offset: offset + limit,
  };
}
