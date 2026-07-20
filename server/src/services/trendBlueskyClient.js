const DEFAULT_JETSTREAM_URL = "wss://jetstream2.us-east.bsky.network/subscribe";
const POST_COLLECTION = "app.bsky.feed.post";

function bool(value, fallback = false) {
  if (value === undefined || value === null || value === "") return fallback;
  return ["1", "true", "yes"].includes(String(value).toLowerCase());
}

export function buildBlueskyJetstreamUrl(options = {}) {
  const url = new URL(options.baseUrl || process.env.TREND_BLUESKY_JETSTREAM_URL || DEFAULT_JETSTREAM_URL);
  url.searchParams.append("wantedCollections", POST_COLLECTION);
  if (options.cursor) url.searchParams.set("cursor", String(options.cursor));
  return url.toString();
}

export function parseBlueskyJetstreamPostEvent(raw, options = {}) {
  const event = typeof raw === "string" ? JSON.parse(raw) : raw;
  const commit = event?.commit;
  const record = commit?.record;
  const includeReplies = options.includeReplies ?? bool(process.env.TREND_BLUESKY_INCLUDE_REPLIES, false);

  if (event?.kind !== "commit") return null;
  if (commit?.operation !== "create") return null;
  if (commit?.collection !== POST_COLLECTION) return null;
  if (!event?.did || !commit?.rkey || !record?.text) return null;
  if (!includeReplies && record.reply) return null;

  return {
    did: event.did,
    rkey: commit.rkey,
    text: record.text,
    createdAt: record.createdAt || (event.time_us ? new Date(Number(event.time_us) / 1000).toISOString() : null),
    langs: Array.isArray(record.langs) ? record.langs : [],
  };
}

export function connectBlueskyJetstream(options = {}) {
  const WebSocketImpl = options.WebSocketImpl || WebSocket;
  const socket = new WebSocketImpl(buildBlueskyJetstreamUrl(options));

  socket.addEventListener("message", (message) => {
    try {
      const post = parseBlueskyJetstreamPostEvent(message.data, options);
      if (post) options.onPost?.(post);
    } catch (error) {
      options.onError?.(error);
    }
  });
  socket.addEventListener("error", (event) => options.onError?.(event.error || event));
  socket.addEventListener("close", (event) => options.onClose?.(event));

  return socket;
}

export const blueskyTrendInternals = {
  POST_COLLECTION,
  bool,
};
