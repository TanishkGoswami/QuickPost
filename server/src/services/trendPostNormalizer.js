function numberStat(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function bestThumbnail(thumbnails = {}) {
  return (
    thumbnails.maxres?.url ||
    thumbnails.standard?.url ||
    thumbnails.high?.url ||
    thumbnails.medium?.url ||
    thumbnails.default?.url ||
    null
  );
}

function youtubeCaption(snippet = {}) {
  const title = snippet.title || "";
  const channel = snippet.channelTitle ? ` by ${snippet.channelTitle}` : "";
  const description = snippet.description ? `\n\n${snippet.description}` : "";
  return `${title}${channel}${description}`.trim() || null;
}

export function normalizeYouTubeVideoToPost(video, ingestedAt = new Date()) {
  if (!video?.id) {
    throw new Error("Cannot normalize YouTube video without an id.");
  }

  const views = numberStat(video.statistics?.viewCount);
  const likes = numberStat(video.statistics?.likeCount);
  const comments = numberStat(video.statistics?.commentCount);

  return {
    source_platform: "youtube",
    source_url: `https://www.youtube.com/watch?v=${video.id}`,
    embed_html: video.status?.embeddable === false
      ? null
      : `<iframe src="https://www.youtube.com/embed/${video.id}" title="YouTube video" loading="lazy" allowfullscreen></iframe>`,
    thumbnail_url: bestThumbnail(video.snippet?.thumbnails),
    caption: youtubeCaption(video.snippet),
    engagement_score: views + likes * 2 + comments * 3,
    niche_tags: [],
    published_at: video.snippet?.publishedAt || null,
    ingested_at: ingestedAt.toISOString(),
  };
}

export function normalizeYouTubeVideosToPosts(videos = [], ingestedAt = new Date()) {
  return videos.map((video) => normalizeYouTubeVideoToPost(video, ingestedAt));
}

function redditPermalink(post) {
  if (post?.url_overridden_by_dest) return post.url_overridden_by_dest;
  if (post?.permalink) return `https://www.reddit.com${post.permalink}`;
  return `https://www.reddit.com/comments/${post.id}`;
}

function redditThumbnail(post) {
  const preview = post?.preview?.images?.[0]?.source?.url;
  const thumbnail = post?.thumbnail && /^https?:\/\//.test(post.thumbnail) ? post.thumbnail : null;
  return (preview || thumbnail || null)?.replace(/&amp;/g, "&") || null;
}

export function normalizeRedditPostToTrendPost(post, ingestedAt = new Date()) {
  if (!post?.id) {
    throw new Error("Cannot normalize Reddit post without an id.");
  }

  return {
    source_platform: "reddit",
    source_url: redditPermalink(post),
    embed_html: null,
    thumbnail_url: redditThumbnail(post),
    caption: [post.title, post.selftext].filter(Boolean).join("\n\n") || null,
    engagement_score: Number(post.score || 0) + Number(post.num_comments || 0) * 3,
    niche_tags: [],
    published_at: post.created_utc ? new Date(post.created_utc * 1000).toISOString() : null,
    ingested_at: ingestedAt.toISOString(),
  };
}

export function normalizeRedditPostsToTrendPosts(posts = [], ingestedAt = new Date()) {
  return posts.map((post) => normalizeRedditPostToTrendPost(post, ingestedAt));
}

export function normalizeBlueskyPostToTrendPost(post, ingestedAt = new Date()) {
  if (!post?.did || !post?.rkey) {
    throw new Error("Cannot normalize Bluesky post without a did and rkey.");
  }

  return {
    source_platform: "bluesky",
    source_url: `https://bsky.app/profile/${post.did}/post/${post.rkey}`,
    embed_html: null,
    thumbnail_url: null,
    caption: post.text || null,
    engagement_score: 1,
    niche_tags: [],
    published_at: post.createdAt || null,
    ingested_at: ingestedAt.toISOString(),
  };
}

export function normalizeBlueskyPostsToTrendPosts(posts = [], ingestedAt = new Date()) {
  return posts.map((post) => normalizeBlueskyPostToTrendPost(post, ingestedAt));
}
