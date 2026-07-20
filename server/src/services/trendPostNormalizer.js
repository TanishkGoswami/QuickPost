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
