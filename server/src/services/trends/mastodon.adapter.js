import { httpGet, stripHtml, validateTrendItem, withTrendDefaults } from './shared.js';

const MASTODON_BASE = 'https://mastodon.social';

export function normalizeMastodonStatus(status, batch = 0) {
  const text = stripHtml(status.content || '');
  const author = status.account?.display_name || status.account?.username || 'Mastodon';

  return withTrendDefaults({
    id: `mastodon:${status.id}`,
    type: 'post',
    platform: 'Mastodon',
    title: text || status.spoiler_text || 'Mastodon post',
    summary: status.spoiler_text || '',
    url: status.url || status.uri,
    image: status.media_attachments?.find(m => m.type === 'image')?.preview_url || status.card?.image || null,
    videoUrl: status.media_attachments?.find(m => m.type === 'video')?.url || null,
    author,
    handle: status.account?.acct || status.account?.username || '',
    avatar: status.account?.avatar || null,
    publishedAt: status.created_at || null,
    engagement: {
      likes: status.favourites_count || 0,
      reposts: status.reblogs_count || 0,
      replies: status.replies_count || 0,
    },
    _batch: batch,
  });
}

export function normalizeMastodonTag(tag, batch = 0) {
  const history = Array.isArray(tag.history) ? tag.history : [];
  const uses = history.reduce((sum, day) => sum + (Number(day.uses) || 0), 0);
  const accounts = history.reduce((sum, day) => sum + (Number(day.accounts) || 0), 0);

  return withTrendDefaults({
    id: `mastodon-tag:${tag.name}`,
    type: 'topic',
    platform: 'Mastodon',
    title: `#${tag.name}`,
    summary: `${uses} recent uses across ${accounts} accounts`,
    url: tag.url,
    author: 'Mastodon trends',
    handle: tag.name,
    publishedAt: history[0]?.day ? new Date(Number(history[0].day) * 1000).toISOString() : null,
    engagement: { uses, accounts },
    _batch: batch,
  });
}

export async function fetchMastodonTrends({ limit = 10, offset = 0, batch = 0 }) {
  const statusRes = await httpGet(`${MASTODON_BASE}/api/v1/trends/statuses`, {
    params: { limit: Math.min(limit, 40), offset },
    timeout: 7000,
  });
  let items = (statusRes.data || []).map(status => normalizeMastodonStatus(status, batch)).filter(validateTrendItem);

  if (items.length < Math.min(5, limit)) {
    const tagRes = await httpGet(`${MASTODON_BASE}/api/v1/trends/tags`, {
      params: { limit: Math.min(20, limit), offset },
      timeout: 7000,
    });
    items = [...items, ...(tagRes.data || []).map(tag => normalizeMastodonTag(tag, batch))];
  }

  return { items: items.slice(0, limit), offset: offset + limit };
}
