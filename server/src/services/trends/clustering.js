import { titleHash } from './shared.js';

const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'from', 'this', 'that', 'after', 'about', 'into', 'your', 'what', 'why', 'how',
  'latest', 'breaking', 'update', 'updates', 'news', 'live', 'today', 'watch', 'video', 'report', 'says', 'said',
  'will', 'over', 'under', 'more', 'less', 'than', 'amid', 'while', 'when', 'where', 'here', 'there',
]);

function canonicalUrl(rawUrl = '') {
  try {
    const url = new URL(rawUrl);
    url.hash = '';
    for (const key of [...url.searchParams.keys()]) {
      if (/^(utm_|fbclid|gclid|oc$|output$)/i.test(key)) url.searchParams.delete(key);
    }
    return `${url.hostname.replace(/^www\./, '')}${url.pathname.replace(/\/$/, '')}${url.search}`.toLowerCase();
  } catch {
    return '';
  }
}

function normalizedTitle(title = '') {
  return String(title)
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function titleTokens(title = '') {
  return normalizedTitle(title)
    .split(' ')
    .filter(token => token.length > 3 && !STOPWORDS.has(token));
}

function importantTokens(item) {
  const tokens = titleTokens(item.title);
  const tags = Array.isArray(item.tags) ? item.tags.map(tag => String(tag).replace(/^#/, '').toLowerCase()) : [];
  return [...new Set([...tokens, ...tags].filter(token => token.length > 3 && !STOPWORDS.has(token)))];
}

function jaccard(a, b) {
  const left = new Set(a);
  const right = new Set(b);
  if (!left.size || !right.size) return 0;
  let overlap = 0;
  for (const token of left) if (right.has(token)) overlap += 1;
  return overlap / (left.size + right.size - overlap);
}

export function matchTrendItems(a, b) {
  const urlA = canonicalUrl(a.originalUrl);
  const urlB = canonicalUrl(b.originalUrl);
  if (urlA && urlA === urlB) return { matched: true, confidence: 1, reason: 'canonical_url' };

  const titleA = normalizedTitle(a.title);
  const titleB = normalizedTitle(b.title);
  if (titleA && titleA === titleB) return { matched: true, confidence: 0.95, reason: 'normalized_title' };

  const tokensA = titleTokens(a.title);
  const tokensB = titleTokens(b.title);
  const similarity = jaccard(tokensA, tokensB);
  if (similarity >= 0.72 && Math.min(tokensA.length, tokensB.length) >= 4) {
    return { matched: true, confidence: Number(similarity.toFixed(2)), reason: 'title_similarity' };
  }

  const importantA = importantTokens(a);
  const importantB = importantTokens(b);
  const shared = importantA.filter(token => importantB.includes(token));
  if (shared.length >= 3 && jaccard(importantA, importantB) >= 0.45) {
    return { matched: true, confidence: 0.78, reason: 'important_keywords' };
  }

  return { matched: false, confidence: Number(similarity.toFixed(2)), reason: 'no_match' };
}

function qualityScore(item) {
  return (
    (Number(item.trendScore) || 0) +
    (item.imageUrl ? 8 : 0) +
    (item.description ? 4 : 0) +
    (item.type === 'article' ? 3 : 0) +
    (item.originalUrl ? 2 : 0)
  );
}

function clusterIdFor(items) {
  const url = items.map(item => canonicalUrl(item.originalUrl)).find(Boolean);
  if (url) return `cluster:url:${titleHash(url)}`;
  return `cluster:title:${titleHash(normalizedTitle(items[0]?.title || 'trend'))}`;
}

function summarizeCluster(items, matches) {
  const primary = [...items].sort((a, b) => qualityScore(b) - qualityScore(a))[0];
  const clusterId = clusterIdFor(items);
  const platformBadges = [...new Set(items.map(item => item.source).filter(Boolean))];
  const mergeMatches = matches.filter(match => match.reason !== 'single_item');
  const bestMatch = mergeMatches.sort((a, b) => b.confidence - a.confidence)[0] || { confidence: 1, reason: 'single_item' };
  const clusterItems = items.map(item => ({
    id: item.id,
    externalId: item.externalId,
    source: item.source,
    type: item.type,
    title: item.title,
    originalUrl: item.originalUrl,
    engagement: item.engagement,
    trendScore: item.trendScore,
    matchConfidence: item.id === primary.id ? 1 : bestMatch.confidence,
    matchReason: item.id === primary.id ? 'primary' : bestMatch.reason,
  }));

  return {
    ...primary,
    clusterId,
    isPrimary: true,
    clusterItems,
    platformBadges,
    crossPlatformCount: platformBadges.length,
    matchConfidence: bestMatch.confidence,
    matchReason: bestMatch.reason,
  };
}

export function clusterTrendItems(items = []) {
  const clusters = [];

  for (const item of items) {
    let target = null;
    let bestMatch = { matched: false, confidence: 0, reason: 'no_match' };

    for (const cluster of clusters) {
      for (const existing of cluster.items) {
        const match = matchTrendItems(item, existing);
        if (match.matched && match.confidence > bestMatch.confidence) {
          target = cluster;
          bestMatch = match;
        }
      }
    }

    if (target) {
      target.items.push(item);
      target.matches.push(bestMatch);
    } else {
      clusters.push({ items: [item], matches: [{ confidence: 1, reason: 'single_item' }] });
    }
  }

  return clusters.map(cluster => summarizeCluster(cluster.items, cluster.matches));
}

export { canonicalUrl, normalizedTitle, titleTokens };
