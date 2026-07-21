const REDDIT_TOKEN_URL = "https://www.reddit.com/api/v1/access_token";
const REDDIT_API_BASE_URL = "https://oauth.reddit.com";

function requireCredentials(clientId, clientSecret) {
  if (!clientId || !clientSecret) {
    throw new Error("Missing REDDIT_CLIENT_ID or REDDIT_CLIENT_SECRET.");
  }
}

function userAgent(value) {
  return value || process.env.REDDIT_USER_AGENT || "QuickPost-Trends/1.0.0";
}

function normalizeSubreddit(value) {
  return String(value || "")
    .trim()
    .replace(/^\/?r\//i, "")
    .replace(/[^a-zA-Z0-9_]/g, "");
}

function redditApiError(response, data, fallback) {
  const message = data?.message || data?.error || fallback;
  const error = new Error(
    response.status === 429
      ? `Reddit API rate limit reached. Retry after ${response.headers?.get?.("retry-after") || "unknown"} seconds.`
      : message,
  );
  error.status = response.status;
  error.retryAfterSeconds = response.status === 429 ? response.headers?.get?.("retry-after") || null : null;
  return error;
}

async function getRedditAppAccessToken(options = {}) {
  const clientId = options.clientId || process.env.REDDIT_CLIENT_ID;
  const clientSecret = options.clientSecret || process.env.REDDIT_CLIENT_SECRET;
  const fetchImpl = options.fetchImpl || fetch;

  requireCredentials(clientId, clientSecret);
  const response = await fetchImpl(REDDIT_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": userAgent(options.userAgent),
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw redditApiError(response, data, `Reddit OAuth returned ${response.status}`);
  }
  if (!data.access_token) throw new Error("Reddit OAuth response did not include an access token.");

  return data.access_token;
}

export async function listSubredditHotPosts(options = {}) {
  const subreddit = normalizeSubreddit(options.subreddit);
  if (!subreddit) throw new Error("Missing subreddit.");

  const fetchImpl = options.fetchImpl || fetch;
  const accessToken = options.accessToken || await getRedditAppAccessToken(options);
  const limit = Math.min(Math.max(Number.parseInt(options.limit, 10) || 25, 1), 100);
  const url = new URL(`${REDDIT_API_BASE_URL}/r/${subreddit}/hot`);
  url.searchParams.set("limit", String(limit));
  if (options.after) url.searchParams.set("after", options.after);

  const response = await fetchImpl(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": userAgent(options.userAgent),
    },
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw redditApiError(response, data, `Reddit API returned ${response.status}`);
  }

  return {
    subreddit,
    items: Array.isArray(data?.data?.children) ? data.data.children.map((child) => child.data).filter(Boolean) : [],
    after: data?.data?.after || null,
  };
}

export const redditTrendInternals = {
  normalizeSubreddit,
};
