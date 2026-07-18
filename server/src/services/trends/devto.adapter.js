import { defaultTrendQuery, httpGet, validateTrendItem, withTrendDefaults } from './shared.js';

function tagFor(query, niche) {
  const value = (query || defaultTrendQuery(niche)).toLowerCase();
  if (value.includes('ai') || value.includes('artificial')) return 'ai';
  if (value.includes('startup') || value.includes('business')) return 'startup';
  if (value.includes('javascript')) return 'javascript';
  if (value.includes('react')) return 'react';
  if (value.includes('web')) return 'webdev';
  return '';
}

export function normalizeDevtoArticle(article, batch = 0) {
  return withTrendDefaults({
    id: `devto:${article.id}`,
    type: 'devto',
    platform: 'DEV',
    title: article.title || '',
    summary: article.description || '',
    url: article.url,
    image: article.social_image || article.cover_image || null,
    author: article.user?.name || article.user?.username || 'DEV',
    handle: article.tag_list?.[0] || '',
    avatar: article.user?.profile_image_90 || null,
    publishedAt: article.published_at || null,
    engagement: {
      reactions: article.public_reactions_count || 0,
      comments: article.comments_count || 0,
    },
    _batch: batch,
  });
}

export async function fetchDevtoTrends({ query = '', niche = 'All', limit = 10, page = 1, batch = 0 }) {
  const tag = tagFor(query, niche);
  const r = await httpGet('https://dev.to/api/articles', {
    params: { top: 7, per_page: Math.min(limit, 50), page, ...(tag ? { tag } : {}) },
    timeout: 7000,
  });

  return {
    items: (r.data || []).map(article => normalizeDevtoArticle(article, batch)).filter(validateTrendItem),
    page: page + 1,
  };
}
