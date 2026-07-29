import crypto from "crypto";

function hashPost(post) {
  return crypto
    .createHash("sha256")
    .update([
      post.source_platform,
      post.source_url,
      post.caption || "",
      post.thumbnail_url || "",
      post.published_at || "",
    ].join("|"))
    .digest("hex");
}

export function withContentHash(post) {
  return {
    ...post,
    content_hash: post.content_hash || hashPost(post),
  };
}

export function dedupePostsForInsert(posts = [], existingRows = []) {
  const existingUrls = new Set(existingRows.map((row) => row.source_url).filter(Boolean));
  const existingHashes = new Set(existingRows.map((row) => row.content_hash).filter(Boolean));
  const seenUrls = new Set();
  const seenHashes = new Set();

  return posts.map(withContentHash).filter((post) => {
    if (existingUrls.has(post.source_url) || existingHashes.has(post.content_hash)) return false;
    if (seenUrls.has(post.source_url) || seenHashes.has(post.content_hash)) return false;
    seenUrls.add(post.source_url);
    seenHashes.add(post.content_hash);
    return true;
  });
}

async function defaultSupabase() {
  const { default: supabase } = await import("./supabase.js");
  return supabase;
}

async function loadExistingPosts(supabase, posts) {
  const hashed = posts.map(withContentHash);
  const urls = [...new Set(hashed.map((post) => post.source_url).filter(Boolean))];
  const hashes = [...new Set(hashed.map((post) => post.content_hash).filter(Boolean))];

  const [byUrl, byHash] = await Promise.all([
    urls.length
      ? supabase.from("posts").select("source_url, content_hash").in("source_url", urls)
      : { data: [], error: null },
    hashes.length
      ? supabase.from("posts").select("source_url, content_hash").in("content_hash", hashes)
      : { data: [], error: null },
  ]);

  if (byUrl.error) throw byUrl.error;
  if (byHash.error) throw byHash.error;

  return [...(byUrl.data || []), ...(byHash.data || [])];
}

export async function insertNewTrendPosts(posts = [], options = {}) {
  if (posts.length === 0) return { inserted: [], skipped: 0 };

  const supabase = options.supabase || await defaultSupabase();
  const existing = await loadExistingPosts(supabase, posts);
  const insertable = dedupePostsForInsert(posts, existing);

  if (insertable.length === 0) {
    return { inserted: [], skipped: posts.length };
  }

  const { data, error } = await supabase
    .from("posts")
    .insert(insertable)
    .select("id, source_url, content_hash");

  if (error) throw error;

  return {
    inserted: data || [],
    skipped: posts.length - insertable.length,
  };
}
