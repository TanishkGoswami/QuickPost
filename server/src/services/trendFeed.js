const DEFAULT_LIMIT = 24;
const MAX_LIMIT = 50;

function toLimit(value) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return DEFAULT_LIMIT;
  return Math.min(parsed, MAX_LIMIT);
}

export function encodeTrendCursor(post) {
  if (!post?.ingested_at || !post?.id) return null;
  return Buffer.from(JSON.stringify({ ingested_at: post.ingested_at, id: post.id })).toString("base64url");
}

export function decodeTrendCursor(cursor) {
  if (!cursor) return null;
  try {
    const parsed = JSON.parse(Buffer.from(String(cursor), "base64url").toString("utf8"));
    if (!parsed?.ingested_at || !parsed?.id) return null;
    return parsed;
  } catch {
    return null;
  }
}

function applyCursor(query, cursor) {
  const decoded = decodeTrendCursor(cursor);
  if (!decoded) return query;
  return query.or(`ingested_at.lt.${decoded.ingested_at},and(ingested_at.eq.${decoded.ingested_at},id.lt.${decoded.id})`);
}

async function defaultSupabase() {
  const { default: supabase } = await import("./supabase.js");
  return supabase;
}

export async function getTrendFeedPage(params = {}, options = {}) {
  const limit = toLimit(params.limit);
  const supabase = options.supabase || await defaultSupabase();

  let query = supabase
    .from("posts")
    .select("id,source_platform,source_url,embed_html,thumbnail_url,caption,engagement_score,niche_tags,published_at,ingested_at")
    .order("ingested_at", { ascending: false })
    .order("id", { ascending: false });

  query = applyCursor(query, params.cursor);

  const { data, error } = await query.limit(limit + 1);
  if (error) throw error;

  const rows = data || [];
  const items = rows.slice(0, limit);
  return {
    success: true,
    items,
    nextCursor: rows.length > limit ? encodeTrendCursor(items[items.length - 1]) : null,
  };
}
