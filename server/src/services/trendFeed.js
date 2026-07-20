const DEFAULT_LIMIT = 24;
const MAX_LIMIT = 50;
const CANDIDATE_LIMIT = 500;
const HALF_LIFE_HOURS = 72;

function toLimit(value) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return DEFAULT_LIMIT;
  return Math.min(parsed, MAX_LIMIT);
}

export function encodeTrendCursor(post) {
  if (!post?.rank_score || !post?.id) return null;
  return Buffer.from(JSON.stringify({ rank_score: post.rank_score, id: post.id })).toString("base64url");
}

export function decodeTrendCursor(cursor) {
  if (!cursor) return null;
  try {
    const parsed = JSON.parse(Buffer.from(String(cursor), "base64url").toString("utf8"));
    if (!Number.isFinite(Number(parsed?.rank_score)) || !parsed?.id) return null;
    parsed.rank_score = Number(parsed.rank_score);
    return parsed;
  } catch {
    return null;
  }
}

async function defaultSupabase() {
  const { default: supabase } = await import("./supabase.js");
  return supabase;
}

export function scoreTrendPost(post, now = new Date()) {
  const publishedAt = new Date(post.published_at || post.ingested_at || now);
  const ageHours = Math.max((now - publishedAt) / 36e5, 1);
  const recencyDecay = Math.pow(0.5, ageHours / HALF_LIFE_HOURS);
  const engagementVelocity = Number(post.engagement_score || 0) / ageHours;
  return Number((recencyDecay * engagementVelocity).toFixed(6));
}

function compareRankedPosts(a, b) {
  if (b.rank_score !== a.rank_score) return b.rank_score - a.rank_score;
  return String(b.id).localeCompare(String(a.id));
}

function applyRankCursor(posts, cursor) {
  const decoded = decodeTrendCursor(cursor);
  if (!decoded) return posts;
  return posts.filter((post) =>
    post.rank_score < decoded.rank_score ||
    (post.rank_score === decoded.rank_score && String(post.id) < String(decoded.id))
  );
}

export async function getTrendFeedPage(params = {}, options = {}) {
  const limit = toLimit(params.limit);
  const supabase = options.supabase || await defaultSupabase();
  const now = options.now || new Date();

  const query = supabase
    .from("posts")
    .select("id,source_platform,source_url,embed_html,thumbnail_url,caption,engagement_score,niche_tags,published_at,ingested_at")
    .order("ingested_at", { ascending: false });

  // ponytail: rank a bounded recent pool; move ranking into SQL when feed volume outgrows 500 candidates.
  const { data, error } = await query.limit(CANDIDATE_LIMIT);
  if (error) throw error;

  const ranked = applyRankCursor(
    (data || [])
      .map((post) => ({ ...post, rank_score: scoreTrendPost(post, now) }))
      .sort(compareRankedPosts),
    params.cursor,
  );
  const items = ranked.slice(0, limit);
  return {
    success: true,
    items,
    nextCursor: ranked.length > limit ? encodeTrendCursor(items[items.length - 1]) : null,
  };
}
