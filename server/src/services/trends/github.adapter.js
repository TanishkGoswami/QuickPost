import { DAY_MS, defaultTrendQuery, httpGet, validateTrendItem, withTrendDefaults } from './shared.js';

function isoDate(daysAgo = 7) {
  return new Date(Date.now() - daysAgo * DAY_MS).toISOString().slice(0, 10);
}

export function normalizeGithubRepo(repo, batch = 0) {
  return withTrendDefaults({
    id: `github:${repo.full_name || repo.id}`,
    type: 'github',
    platform: 'GitHub',
    title: repo.full_name || repo.name || '',
    summary: repo.description || '',
    url: repo.html_url,
    image: repo.owner?.avatar_url || null,
    author: repo.owner?.login || 'GitHub',
    handle: repo.language || '',
    publishedAt: repo.created_at || repo.pushed_at || null,
    engagement: {
      stars: repo.stargazers_count || 0,
      forks: repo.forks_count || 0,
      watchers: repo.watchers_count || 0,
    },
    _batch: batch,
  });
}

export async function fetchGithubTrends({ query = '', niche = 'All', limit = 10, page = 1, batch = 0 }) {
  const q = `${query || defaultTrendQuery(niche)} created:>${isoDate(7)}`.trim();
  const r = await httpGet('https://api.github.com/search/repositories', {
    params: { q, sort: 'stars', order: 'desc', per_page: Math.min(limit, 50), page },
    timeout: 8000,
    headers: process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {},
  });

  return {
    items: (r.data?.items || []).map(repo => normalizeGithubRepo(repo, batch)).filter(validateTrendItem),
    page: page + 1,
  };
}
