import { DAY_MS, defaultTrendQuery, httpGet, validateTrendItem, withTrendDefaults } from './shared.js';

function stackTag(query, niche) {
  const value = (query || defaultTrendQuery(niche)).toLowerCase();
  if (value.includes('javascript')) return 'javascript';
  if (value.includes('react')) return 'reactjs';
  if (value.includes('python') || value.includes('ai')) return 'python';
  if (value.includes('startup') || niche === 'Business') return '';
  return '';
}

export function normalizeStackExchangeQuestion(question, batch = 0) {
  return withTrendDefaults({
    id: `stackexchange:${question.question_id}`,
    type: 'stackexchange',
    platform: 'Stack Overflow',
    title: question.title || '',
    summary: question.tags?.join(', ') || '',
    url: question.link,
    author: question.owner?.display_name || 'Stack Overflow',
    avatar: question.owner?.profile_image || null,
    publishedAt: question.creation_date ? new Date(question.creation_date * 1000).toISOString() : null,
    engagement: {
      score: question.score || 0,
      answers: question.answer_count || 0,
      views: question.view_count || 0,
    },
    _batch: batch,
  });
}

export async function fetchStackExchangeTrends({ query = '', niche = 'All', limit = 10, page = 1, batch = 0 }) {
  const tagged = stackTag(query, niche);
  let r;
  try {
    r = await httpGet('https://api.stackexchange.com/2.3/questions', {
      params: {
        site: 'stackoverflow',
        sort: 'votes',
        order: 'desc',
        fromdate: Math.floor((Date.now() - 7 * DAY_MS) / 1000),
        pagesize: Math.min(limit, 50),
        page,
        ...(tagged ? { tagged } : {}),
      },
      timeout: 7000,
    });
  } catch (err) {
    if (err.response?.status === 400) return { items: [], page };
    throw err;
  }

  return {
    items: (r.data?.items || []).map(question => normalizeStackExchangeQuestion(question, batch)).filter(validateTrendItem),
    page: page + 1,
  };
}
