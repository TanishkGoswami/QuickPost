import IORedis from "ioredis";
import crypto from "crypto";

const DEFAULT_LIMIT = 24;
const MAX_LIMIT = 50;
const CANDIDATE_LIMIT = 500;
const HALF_LIFE_HOURS = 72;
const CACHE_TTL_SECONDS = Number(process.env.TREND_FEED_CACHE_TTL_SECONDS || 60);

let redisClient;

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

function getRedisUrl() {
  return process.env.REDIS_URL || process.env.BULLMQ_REDIS_URL || null;
}

export function getTrendFeedCache() {
  const url = getRedisUrl();
  if (!url) return null;
  if (!redisClient) {
    redisClient = new IORedis(url, {
      maxRetriesPerRequest: 1,
      enableReadyCheck: false,
      lazyConnect: true,
    });
    redisClient.on("error", () => {});
  }
  return redisClient;
}

function cacheKey(params) {
  const seenHash = crypto
    .createHash("sha1")
    .update([(params.seenIds || []).join(","), (params.interests || []).join(",")].join("|"))
    .digest("hex")
    .slice(0, 12);
  return `trend:feed:${params.limit || DEFAULT_LIMIT}:${params.cursor || "first"}:${seenHash}`;
}

async function readCache(cache, key) {
  if (!cache) return null;
  try {
    const cached = await cache.get(key);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
}

async function writeCache(cache, key, value) {
  if (!cache) return;
  try {
    await cache.set(key, JSON.stringify(value), "EX", CACHE_TTL_SECONDS);
  } catch {}
}

export function scoreTrendPost(post, now = new Date()) {
  const publishedAt = new Date(post.published_at || post.ingested_at || now);
  const ageHours = Math.max((now - publishedAt) / 36e5, 1);
  const recencyDecay = Math.pow(0.5, ageHours / HALF_LIFE_HOURS);
  const engagementVelocity = Number(post.engagement_score || 0) / ageHours;
  return Number((recencyDecay * engagementVelocity).toFixed(6));
}

export function parseTrendInterests(value) {
  return String(value || "")
    .split(",")
    .map((interest) => interest.trim().toLowerCase())
    .filter((interest) => /^[a-z0-9][a-z0-9 _-]{0,38}$/i.test(interest))
    .slice(0, 12);
}

function getInterestMatches(post, interests) {
  if (!interests.length) return 0;
  const haystack = [
    post.caption,
    post.source_platform,
    post.source_url,
    ...(Array.isArray(post.niche_tags) ? post.niche_tags : []),
  ].join(" ").toLowerCase();

  return interests.filter((interest) => haystack.includes(interest)).length;
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

export function parseSeenPostIds(value) {
  return String(value || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, 200);
}

export async function getTrendFeedPage(params = {}, options = {}) {
  const limit = toLimit(params.limit);
  const supabase = options.supabase || await defaultSupabase();
  const now = options.now || new Date();
  const seenIds = parseSeenPostIds(params.seen);
  const interests = parseTrendInterests(params.interests || params.topics);
  const seen = new Set(seenIds);
  const cache = options.cache === undefined ? getTrendFeedCache() : options.cache;
  const key = cacheKey({ limit, cursor: params.cursor, seenIds, interests });
  const cached = await readCache(cache, key);
  if (cached) return { ...cached, cached: true };

  const query = supabase
    .from("posts")
    .select("id,source_platform,source_url,embed_html,thumbnail_url,caption,engagement_score,niche_tags,published_at,ingested_at")
    .order("ingested_at", { ascending: false });

  // ponytail: rank a bounded recent pool; move ranking into SQL when feed volume outgrows 500 candidates.
  const { data, error } = await query.limit(CANDIDATE_LIMIT);
  if (error) throw error;

  const rankPosts = (posts) => applyRankCursor(
    posts
      .map((post) => {
        const matches = getInterestMatches(post, interests);
        const score = scoreTrendPost(post, now);
        return {
          ...post,
          interest_match_count: matches,
          rank_score: Number((score * (matches ? 1 + matches * 2 : 1)).toFixed(6)),
        };
      })
      .sort(compareRankedPosts),
    params.cursor,
  );
  const unseenRows = (data || []).filter((post) => !seen.has(post.id));
  const ranked = rankPosts(unseenRows.length ? unseenRows : (data || []));
  const items = ranked.slice(0, limit);
  const page = {
    success: true,
    items,
    nextCursor: ranked.length > limit ? encodeTrendCursor(items[items.length - 1]) : null,
    cached: false,
  };
  await writeCache(cache, key, page);
  return page;
}
