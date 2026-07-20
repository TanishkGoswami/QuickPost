function toDbRow(item) {
  return {
    id: item.id,
    external_id: item.externalId,
    source: item.source,
    type: item.type,
    title: item.title,
    description: item.description,
    author_name: item.authorName,
    author_username: item.authorUsername,
    author_avatar: item.authorAvatar,
    original_url: item.originalUrl,
    image_url: item.imageUrl,
    published_at: item.publishedAt,
    fetched_at: item.fetchedAt,
    category: item.category,
    language: item.language,
    country: item.country,
    tags: item.tags,
    engagement: item.engagement,
    trend_score: item.trendScore,
    score_breakdown: item.scoreBreakdown,
    opportunity_score: item.opportunityScore,
    lifecycle: item.lifecycle,
    calculated_at: item.calculatedAt,
    cluster_id: item.clusterId || null,
    cross_platform_count: item.crossPlatformCount || 1,
    platform_badges: Array.isArray(item.platformBadges) ? item.platformBadges : [item.source].filter(Boolean),
    cluster_items: Array.isArray(item.clusterItems) ? item.clusterItems : [],
    match_confidence: Number.isFinite(item.matchConfidence) ? item.matchConfidence : null,
    match_reason: item.matchReason || null,
  };
}

function snapshotRow(item, capturedAt) {
  return {
    trend_item_id: item.id,
    cluster_id: item.clusterId || null,
    source: item.source,
    engagement: item.engagement,
    trend_score: item.trendScore,
    captured_at: capturedAt,
  };
}

export function rowToStoredTrendItem(row = {}) {
  return {
    id: row.id,
    externalId: row.external_id,
    source: row.source,
    type: row.type,
    title: row.title,
    description: row.description || null,
    authorName: row.author_name || null,
    authorUsername: row.author_username || null,
    authorAvatar: row.author_avatar || null,
    originalUrl: row.original_url,
    imageUrl: row.image_url || null,
    publishedAt: row.published_at,
    fetchedAt: row.fetched_at,
    category: row.category,
    language: row.language || null,
    country: row.country || null,
    tags: row.tags || [],
    engagement: row.engagement || { likes: 0, comments: 0, shares: 0, views: 0, score: 0 },
    trendScore: row.trend_score,
    scoreBreakdown: row.score_breakdown || {},
    opportunityScore: row.opportunity_score,
    lifecycle: row.lifecycle,
    calculatedAt: row.calculated_at,
    clusterId: row.cluster_id,
    crossPlatformCount: row.cross_platform_count || 1,
    platformBadges: row.platform_badges || [row.source].filter(Boolean),
    clusterItems: row.cluster_items || [],
    matchConfidence: row.match_confidence,
    matchReason: row.match_reason,
    growth: { oneHour: null, sixHour: null, twentyFourHour: null, sevenDay: null },
  };
}

function sameSnapshot(a, b) {
  return a && b && a.trend_score === b.trend_score && JSON.stringify(a.engagement || {}) === JSON.stringify(b.engagement || {});
}

function snapshotRetentionDate(now = new Date()) {
  const days = Math.max(8, Number(process.env.TREND_SNAPSHOT_RETENTION_DAYS) || 8);
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

export function calculateGrowthFromSnapshots(item, snapshots = {}) {
  const current = Number(item.trendScore);
  const growth = { oneHour: null, sixHour: null, twentyFourHour: null, sevenDay: null };
  const map = { oneHour: snapshots.oneHour, sixHour: snapshots.sixHour, twentyFourHour: snapshots.twentyFourHour, sevenDay: snapshots.sevenDay };

  for (const [key, snap] of Object.entries(map)) {
    const previous = Number(snap?.trend_score);
    if (!Number.isFinite(current) || !Number.isFinite(previous) || previous <= 0) continue;
    growth[key] = Math.round(((current - previous) / previous) * 100);
  }

  return growth;
}

export function lifecycleFromGrowth(currentLifecycle, growth = {}) {
  const recent = growth.oneHour ?? growth.sixHour;
  if (recent === null || recent === undefined) return currentLifecycle;
  if (recent > 0) return currentLifecycle === 'hot' ? 'hot' : 'rising';
  if (recent < 0) return 'falling';
  return currentLifecycle === 'hot' ? 'hot' : 'peaked';
}

export async function upsertTrendItems(items = []) {
  if (!items.length) return { ok: true, count: 0 };

  try {
    const { default: supabase } = await import('../supabase.js');
    const { error } = await supabase
      .from('trend_items')
      .upsert(items.map(toDbRow), { onConflict: 'source,external_id' });

    if (error) throw error;
    return { ok: true, count: items.length };
  } catch (err) {
    console.warn('[Trends/store] trend_items upsert skipped:', err.message);
    return { ok: false, count: 0, error: err.message };
  }
}

function safeLike(value = '') {
  return String(value).replace(/[%_,]/g, ' ').trim().slice(0, 120);
}

export async function readStoredTrendItems({ limit = 40, offset = 0, sort = 'trending', niche = 'All', query = '' } = {}) {
  try {
    const { default: supabase } = await import('../supabase.js');
    let request = supabase
      .from('trend_items')
      .select('*', { count: 'exact' })
      .range(offset, offset + limit - 1);

    if (niche && niche !== 'All') request = request.eq('category', niche);
    const search = safeLike(query);
    if (search) request = request.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    request = sort === 'latest'
      ? request.order('published_at', { ascending: false })
      : request.order('trend_score', { ascending: false }).order('published_at', { ascending: false });

    const { data, error, count } = await request;
    if (error) throw error;
    return { ok: true, items: (data || []).map(rowToStoredTrendItem), count: count || 0 };
  } catch (err) {
    console.warn('[Trends/store] stored feed read skipped:', err.message);
    return { ok: false, items: [], count: 0, error: err.message };
  }
}

export async function recordSourceHealth({ source, ok, responseTimeMs, error }) {
  if (!source) return { ok: false };

  try {
    const { default: supabase } = await import('../supabase.js');
    const now = new Date().toISOString();
    const { data: current } = await supabase
      .from('trend_source_health')
      .select('consecutive_failures')
      .eq('source', source)
      .maybeSingle();

    const { error: upsertError } = await supabase.from('trend_source_health').upsert({
      source,
      last_fetch_at: now,
      last_success_at: ok ? now : undefined,
      response_time_ms: Math.round(Number(responseTimeMs) || 0),
      last_error: ok ? null : String(error || 'Provider failed').slice(0, 500),
      consecutive_failures: ok ? 0 : (Number(current?.consecutive_failures) || 0) + 1,
      updated_at: now,
    }, { onConflict: 'source' });
    if (upsertError) throw upsertError;
    return { ok: true };
  } catch (err) {
    console.warn('[Trends/store] source health write skipped:', err.message);
    return { ok: false, error: err.message };
  }
}

export async function captureTrendSnapshots(items = [], capturedAt = new Date().toISOString()) {
  if (!items.length) return { ok: true, count: 0 };

  try {
    const { default: supabase } = await import('../supabase.js');
    const ids = items.map(item => item.id);
    const { data: latestRows, error: latestError } = await supabase
      .from('trend_snapshots')
      .select('trend_item_id,engagement,trend_score,captured_at')
      .in('trend_item_id', ids)
      .order('captured_at', { ascending: false });

    if (latestError) throw latestError;

    const latestById = new Map();
    for (const row of latestRows || []) {
      if (!latestById.has(row.trend_item_id)) latestById.set(row.trend_item_id, row);
    }

    const rows = items
      .map(item => snapshotRow(item, capturedAt))
      .filter(row => !sameSnapshot(row, latestById.get(row.trend_item_id)));

    if (!rows.length) return { ok: true, count: 0 };

    const { error } = await supabase.from('trend_snapshots').insert(rows);
    if (error) throw error;
    await supabase.from('trend_snapshots').delete().lt('captured_at', snapshotRetentionDate(new Date(capturedAt)));
    return { ok: true, count: rows.length };
  } catch (err) {
    console.warn('[Trends/store] trend_snapshots capture skipped:', err.message);
    return { ok: false, count: 0, error: err.message };
  }
}

export async function attachTrendGrowth(items = [], now = new Date()) {
  if (!items.length) return items.map(item => ({ ...item, growth: { oneHour: null, sixHour: null, twentyFourHour: null, sevenDay: null } }));

  try {
    const { default: supabase } = await import('../supabase.js');
    const ids = items.map(item => item.id);
    const windows = {
      oneHour: 60 * 60 * 1000,
      sixHour: 6 * 60 * 60 * 1000,
      twentyFourHour: 24 * 60 * 60 * 1000,
      sevenDay: 7 * 24 * 60 * 60 * 1000,
    };
    const oldest = new Date(now.getTime() - windows.sevenDay).toISOString();
    const { data, error } = await supabase
      .from('trend_snapshots')
      .select('trend_item_id,trend_score,captured_at')
      .in('trend_item_id', ids)
      .lte('captured_at', now.toISOString())
      .gte('captured_at', oldest)
      .order('captured_at', { ascending: false });

    if (error) throw error;

    const rowsById = new Map();
    for (const row of data || []) {
      const rows = rowsById.get(row.trend_item_id) || [];
      rows.push(row);
      rowsById.set(row.trend_item_id, rows);
    }

    return items.map(item => {
      const rows = rowsById.get(item.id) || [];
      const snaps = {};
      for (const [key, ms] of Object.entries(windows)) {
        const target = now.getTime() - ms;
        snaps[key] = rows.find(row => new Date(row.captured_at).getTime() <= target) || null;
      }
      const growth = calculateGrowthFromSnapshots(item, snaps);
      return { ...item, growth, lifecycle: lifecycleFromGrowth(item.lifecycle, growth) };
    });
  } catch (err) {
    console.warn('[Trends/store] growth calculation skipped:', err.message);
    return items.map(item => ({ ...item, growth: { oneHour: null, sixHour: null, twentyFourHour: null, sevenDay: null } }));
  }
}
