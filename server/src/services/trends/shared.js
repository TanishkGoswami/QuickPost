import axios from 'axios';

export const DAY_MS = 24 * 60 * 60 * 1000;

export const TREND_NICHES = [
  { id: 'AI & Tech', kw: ['ai', 'chatgpt', 'openai', 'tech', 'apple', 'google', 'gpt', 'llm', 'software', 'startup', 'developer'] },
  { id: 'Trading', kw: ['stock', 'market', 'nifty', 'sensex', 'trading', 'invest', 'fund', 'equity', 'forex', 'gold', 'sebi'] },
  { id: 'Crypto', kw: ['crypto', 'bitcoin', 'btc', 'ethereum', 'web3', 'nft', 'defi', 'blockchain'] },
  { id: 'Sports', kw: ['ipl', 'cricket', 'football', 'sport', 'match', 'tournament', 'league', 'f1', 'nba', 'fifa', 'tennis'] },
  { id: 'Entertainment', kw: ['movie', 'film', 'series', 'netflix', 'celebrity', 'bollywood', 'anime', 'ott', 'drama', 'actor'] },
  { id: 'Music', kw: ['music', 'song', 'album', 'artist', 'rapper', 'singer', 'spotify', 'concert', 'dj', 'remix'] },
  { id: 'Business', kw: ['startup', 'business', 'entrepreneur', 'company', 'ceo', 'funding', 'revenue', 'saas', 'product'] },
  { id: 'Politics', kw: ['politics', 'election', 'government', 'minister', 'parliament', 'policy', 'law', 'modi', 'bjp', 'congress'] },
  { id: 'Fitness', kw: ['gym', 'fitness', 'workout', 'diet', 'health', 'exercise', 'nutrition', 'yoga', 'protein', 'abs'] },
];

export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export function titleHash(value = '') {
  let h = 5381;
  for (let i = 0; i < value.length; i += 1) h = ((h << 5) + h) ^ value.charCodeAt(i);
  return (h >>> 0).toString(36);
}

export function detectTrendNiche(text = '') {
  const lower = String(text).toLowerCase();
  return TREND_NICHES.find(n => n.kw.some(k => lower.includes(k)))?.id || 'Trending';
}

export function defaultTrendQuery(niche = 'All') {
  const map = {
    'AI & Tech': 'artificial intelligence',
    Business: 'startup',
    Sports: 'cricket',
    Trading: 'stock market',
    Crypto: 'bitcoin',
    Entertainment: 'movie',
    Music: 'music',
    Politics: 'politics',
    Fitness: 'fitness',
  };
  return map[niche] || 'trending';
}

export function stripHtml(value = '') {
  return decodeXmlEntities(String(value).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim());
}

function decodeCodePoint(value, base) {
  try {
    const code = parseInt(value, base);
    return Number.isFinite(code) ? String.fromCodePoint(code) : '';
  } catch {
    return '';
  }
}

export function decodeXmlEntities(value = '') {
  return String(value)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => decodeCodePoint(hex, 16))
    .replace(/&#(\d+);/g, (_, code) => decodeCodePoint(code, 10))
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x2F;/g, '/');
}

export function parseCompactNumber(value = '') {
  const match = String(value).toLowerCase().replace(/,/g, '').match(/([\d.]+)\s*([km])?/);
  if (!match) return 0;
  const mult = match[2] === 'm' ? 1000000 : match[2] === 'k' ? 1000 : 1;
  return Math.round(Number(match[1]) * mult) || 0;
}

function sourceKey(value = '') {
  return String(value || 'trend').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'trend';
}

function normalizeEngagement(engagement = {}) {
  return {
    likes: Number(engagement.likes || engagement.upvotes || engagement.reactions || engagement.favourites || 0) || 0,
    comments: Number(engagement.comments || engagement.replies || engagement.answers || 0) || 0,
    shares: Number(engagement.shares || engagement.reposts || engagement.forks || 0) || 0,
    views: Number(engagement.views || engagement.watchers || engagement.uses || 0) || 0,
    score: Number(engagement.score || engagement.points || engagement.stars || 0) || 0,
  };
}

function trendType(source, legacyType) {
  const key = sourceKey(source || legacyType);
  if (['post', 'article', 'question', 'repository', 'topic'].includes(legacyType)) return legacyType;
  if (key === 'github') return 'repository';
  if (key === 'stack-overflow' || key === 'stackexchange') return 'question';
  if (legacyType === 'topic' || key.includes('tag')) return 'topic';
  if (['news', 'google-news', 'wikipedia', 'dev', 'devto'].includes(key)) return 'article';
  return 'post';
}

const SOURCE_ENGAGEMENT_CAPS = {
  reddit: 12000,
  youtube: 1500000,
  bluesky: 2500,
  mastodon: 1800,
  lemmy: 900,
  'hacker-news': 2500,
  github: 15000,
  wikipedia: 2500000,
  dev: 1200,
  'stack-overflow': 250000,
  'google-news': 1,
  news: 1,
};

function engagementTotal(engagement = {}) {
  return (
    (Number(engagement.likes) || 0) +
    (Number(engagement.comments) || 0) * 2 +
    (Number(engagement.shares) || 0) * 2 +
    (Number(engagement.views) || 0) * 0.2 +
    (Number(engagement.score) || 0)
  );
}

function clusterKey(item) {
  const stop = new Set(['the', 'and', 'for', 'with', 'from', 'this', 'that', 'after', 'about', 'into', 'your', 'what', 'why', 'how']);
  const words = stripHtml(item.title || '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stop.has(word))
    .slice(0, 6);
  return words.length ? words.join(' ') : `${item.category || 'trend'}:${titleHash(item.title || item.id || '')}`;
}

export function calculateTrendScore(item, context = {}) {
  const now = context.now ? new Date(context.now) : new Date();
  const ageMs = item.publishedAt ? Math.max(0, now - new Date(item.publishedAt)) : DAY_MS;
  const ageHours = ageMs / 36e5;
  const source = sourceKey(item.source);
  const cap = SOURCE_ENGAGEMENT_CAPS[source] || 5000;
  const engagementRaw = engagementTotal(item.engagement);
  const engagement = clamp(Math.log10(engagementRaw + 1) / Math.log10(cap + 1), 0, 1) * 100;
  const freshness = clamp(100 - (ageHours / 72) * 100, 0, 100);
  const presenceCount = context.presenceCount || 1;
  const crossPlatformPresence = clamp(((presenceCount - 1) / 3) * 100, 0, 100);
  const trendScore = Math.round((engagement * 0.45) + (freshness * 0.35) + (crossPlatformPresence * 0.20));
  const previousTrendScore = Number.isFinite(context.previousTrendScore) ? context.previousTrendScore : null;
  let lifecycle;

  if (previousTrendScore !== null) {
    if (trendScore > previousTrendScore + 4 && freshness >= 45) lifecycle = 'rising';
    else if (trendScore >= 70) lifecycle = 'hot';
    else if (trendScore < previousTrendScore - 4) lifecycle = 'falling';
    else lifecycle = 'peaked';
  } else if (freshness >= 55 && trendScore >= 35) {
    lifecycle = 'rising';
  } else {
    lifecycle = 'hot';
  }

  return {
    trendScore,
    scoreBreakdown: {
      engagement: Math.round(engagement),
      freshness: Math.round(freshness),
      crossPlatformPresence: Math.round(crossPlatformPresence),
      weights: { engagement: 45, freshness: 35, crossPlatformPresence: 20 },
    },
    lifecycle,
    calculatedAt: now.toISOString(),
  };
}

export function applyTrendScores(items, options = {}) {
  const clusters = new Map();
  for (const item of items) {
    const key = clusterKey(item);
    const sources = clusters.get(key) || new Set();
    sources.add(item.source);
    clusters.set(key, sources);
  }

  return items.map(item => ({
    ...item,
    ...calculateTrendScore(item, {
      now: options.now,
      presenceCount: item.crossPlatformCount || clusters.get(clusterKey(item))?.size || 1,
      previousTrendScore: options.previousScores?.[item.id],
    }),
  }));
}

function opportunityScore(item) {
  const ageHours = item.publishedAt ? Math.max(0, (Date.now() - new Date(item.publishedAt).getTime()) / 36e5) : 24;
  const engagement = item.engagement || {};
  const total = engagement.likes + engagement.comments + engagement.shares + engagement.views + engagement.score;
  const freshness = clamp(40 - ageHours * 1.4, 0, 40);
  const discussion = Math.log10((engagement.comments || 0) + 1) * 18;
  const traction = Math.log10(total + 1) * 10;
  return Math.round(clamp(freshness + discussion + traction, 1, 99));
}

export function fallbackEnrichment(item) {
  const niche = item.category || item.niche || detectTrendNiche(item.title);
  const cleanNiche = niche.replace(/[^a-z0-9]/gi, '');
  const sourceTag = String(item.source || 'trend').replace(/[^a-z0-9]/gi, '').toLowerCase();
  const hashtags = [`#${cleanNiche || 'Trending'}`, '#trending', sourceTag ? `#${sourceTag}` : '#viral'].slice(0, 5);
  const ideas = [
    `My honest take on: ${String(item.title || 'this trend').slice(0, 70)}`,
    `What ${niche} creators should know right now`,
    `Turn this into a 60-second explainer`,
  ];
  return { ideas, hashtags, caption: `${ideas[0]}\n\n${hashtags.join(' ')}` };
}

export function withTrendDefaults(item) {
  const now = new Date().toISOString();
  const rawSource = item.source || item.platform || item.type || 'trend';
  const source = sourceKey(rawSource);
  const externalId = String(item.externalId || item.id || item.url || item.title || titleHash(JSON.stringify(item))).replace(new RegExp(`^${source}:`), '');
  const publishedAt = item.publishedAt || item.createdAt || now;
  const engagement = normalizeEngagement(item.engagement || item);
  const next = {
    id: `${source}:${externalId}`,
    externalId,
    source,
    type: trendType(source, item.type),
    title: stripHtml(item.title || ''),
    description: stripHtml(item.description || item.summary || ''),
    authorName: stripHtml(item.authorName || item.author || '') || null,
    authorUsername: stripHtml(item.authorUsername || item.handle || '') || null,
    authorAvatar: item.authorAvatar || item.avatar || null,
    originalUrl: item.originalUrl || item.url || '',
    imageUrl: item.imageUrl || item.image || item.thumbnail || null,
    publishedAt: new Date(publishedAt).toString() === 'Invalid Date' ? now : new Date(publishedAt).toISOString(),
    fetchedAt: item.fetchedAt || now,
    category: item.category || item.niche || detectTrendNiche(`${item.title || ''} ${item.summary || item.description || ''}`),
    language: item.language || null,
    country: item.country || null,
    tags: Array.isArray(item.tags) ? item.tags.filter(Boolean).map(String).slice(0, 12) : [],
    engagement,
    _batch: item._batch || 0,
  };
  Object.assign(next, calculateTrendScore(next, { now }));
  if (Number.isFinite(item.trendScore)) next.trendScore = item.trendScore;
  next.opportunityScore = Number.isFinite(item.opportunityScore) ? item.opportunityScore : opportunityScore(next);
  next.lifecycle = item.lifecycle || next.lifecycle;
  return { ...next, ...fallbackEnrichment(next) };
}

export function validateTrendItem(item) {
  const requiredStrings = ['id', 'externalId', 'source', 'type', 'title', 'originalUrl', 'publishedAt', 'fetchedAt', 'category', 'lifecycle', 'calculatedAt'];
  if (!item || typeof item !== 'object') return false;
  if (!requiredStrings.every(key => typeof item[key] === 'string' && item[key].length > 0)) return false;
  if (!['post', 'article', 'question', 'repository', 'topic'].includes(item.type)) return false;
  if (!['rising', 'hot', 'peaked', 'falling'].includes(item.lifecycle)) return false;
  if (!Array.isArray(item.tags)) return false;
  if (!item.scoreBreakdown || typeof item.scoreBreakdown !== 'object') return false;
  const e = item.engagement;
  return Boolean(e && ['likes', 'comments', 'shares', 'views', 'score'].every(key => Number.isFinite(e[key])));
}

export async function httpGet(url, options = {}) {
  const request = () => axios.get(url, {
    timeout: options.timeout || 8000,
    params: options.params,
    headers: {
      Accept: options.text ? 'application/rss+xml,text/xml,text/plain,*/*' : 'application/json',
      'User-Agent': options.userAgent || 'QuickPost-Trends/1.0 (+https://quickpost.app)',
      ...(options.headers || {}),
    },
    responseType: options.text ? 'text' : 'json',
  });

  try {
    return await request();
  } catch (err) {
    const retryable = err.response?.status === 429 || err.response?.status >= 500;
    if (!retryable || options.retry === false) throw err;
    await new Promise(resolve => setTimeout(resolve, 350));
    return request();
  }
}

export function parseRssItems(xml = '') {
  return [...String(xml).matchAll(/<item\b[\s\S]*?<\/item>/gi)].map(match => {
    const item = match[0];
    const get = tag => decodeXmlEntities(item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'))?.[1] || '');
    const media = item.match(/<media:content[^>]+url="([^"]+)"/i)?.[1] || item.match(/<enclosure[^>]+url="([^"]+)"/i)?.[1] || '';
    const published = new Date(stripHtml(get('pubDate')));
    return {
      title: stripHtml(get('title')),
      description: stripHtml(get('description')),
      url: stripHtml(get('link')),
      publishedAt: Number.isNaN(published.getTime()) ? null : published.toISOString(),
      image: decodeXmlEntities(media),
    };
  }).filter(item => item.title && item.url);
}
