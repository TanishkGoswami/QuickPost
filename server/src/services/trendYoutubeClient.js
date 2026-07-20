const YOUTUBE_API_BASE_URL = "https://www.googleapis.com/youtube/v3";
const DAILY_QUOTA_UNITS = 10000;
const VIDEOS_LIST_QUOTA_COST = 1;

const quotaState = {
  dayKey: null,
  used: 0,
};

function getPacificDayKey(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function resetYouTubeQuotaForTest() {
  quotaState.dayKey = null;
  quotaState.used = 0;
}

export function getYouTubeQuotaSnapshot(now = new Date()) {
  const dayKey = getPacificDayKey(now);
  if (quotaState.dayKey !== dayKey) {
    return { dayKey, used: 0, remaining: DAILY_QUOTA_UNITS };
  }
  return {
    dayKey,
    used: quotaState.used,
    remaining: Math.max(DAILY_QUOTA_UNITS - quotaState.used, 0),
  };
}

function reserveQuota(units, now = new Date()) {
  const dayKey = getPacificDayKey(now);
  if (quotaState.dayKey !== dayKey) {
    quotaState.dayKey = dayKey;
    quotaState.used = 0;
  }

  if (quotaState.used + units > DAILY_QUOTA_UNITS) {
    throw new Error("YouTube Data API quota budget exhausted for today.");
  }

  // ponytail: process-local quota counter; move to Redis if multiple workers ingest concurrently.
  quotaState.used += units;
}

function requireApiKey(apiKey) {
  if (!apiKey) {
    throw new Error("Missing YOUTUBE_DATA_API_KEY.");
  }
  return apiKey;
}

function toPositiveInt(value, fallback, max) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
}

function buildMostPopularUrl({ apiKey, regionCode, videoCategoryId, maxResults }) {
  const params = new URLSearchParams({
    key: apiKey,
    part: "snippet,statistics,contentDetails",
    chart: "mostPopular",
    regionCode: regionCode || "IN",
    maxResults: String(toPositiveInt(maxResults, 25, 50)),
    fields: "items(id,snippet(publishedAt,title,description,channelTitle,thumbnails),statistics,contentDetails),nextPageToken",
  });

  if (videoCategoryId) params.set("videoCategoryId", String(videoCategoryId));

  return `${YOUTUBE_API_BASE_URL}/videos?${params.toString()}`;
}

export async function listMostPopularYouTubeVideos(options = {}) {
  const {
    apiKey = process.env.YOUTUBE_DATA_API_KEY,
    fetchImpl = fetch,
    now = new Date(),
    ...query
  } = options;

  requireApiKey(apiKey);
  reserveQuota(VIDEOS_LIST_QUOTA_COST, now);

  const response = await fetchImpl(buildMostPopularUrl({ ...query, apiKey }), {
    headers: { Accept: "application/json" },
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data?.error?.message || `YouTube Data API returned ${response.status}`;
    throw new Error(message);
  }

  return {
    items: Array.isArray(data.items) ? data.items : [],
    nextPageToken: data.nextPageToken || null,
    quota: getYouTubeQuotaSnapshot(now),
  };
}

export const youtubeQuotaCosts = {
  dailyUnits: DAILY_QUOTA_UNITS,
  videosList: VIDEOS_LIST_QUOTA_COST,
};
