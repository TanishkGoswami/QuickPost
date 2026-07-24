import cron from "node-cron";
import { pathToFileURL } from "url";
import { listSubredditHotPosts } from "../services/trendRedditClient.js";
import { normalizeRedditPostsToTrendPosts } from "../services/trendPostNormalizer.js";
import { insertNewTrendPosts } from "../services/trendPostStore.js";

const DEFAULT_SUBREDDITS = ["ChatGPT", "ArtificialInteligence", "ContentMarketing"];

function csv(value, fallback) {
  const parsed = String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return parsed.length ? parsed : fallback;
}

export function getRedditIngestionTargets(env = process.env) {
  return csv(env.TREND_REDDIT_SUBREDDITS, DEFAULT_SUBREDDITS).map((subreddit) => ({
    subreddit,
    limit: env.TREND_REDDIT_LIMIT || 25,
  }));
}

export async function pullRedditHotBatch(options = {}) {
  const {
    targets = getRedditIngestionTargets(),
    fetchImpl,
    accessToken,
    clientId,
    clientSecret,
    insertPosts = insertNewTrendPosts,
    logger = console,
  } = options;

  const results = [];
  for (const target of targets) {
    const result = await listSubredditHotPosts({ ...target, fetchImpl, accessToken, clientId, clientSecret });
    const posts = normalizeRedditPostsToTrendPosts(result.items);
    const write = await insertPosts(posts);
    results.push({ target, ...result, posts, write });
    logger.log("[TREND-REDDIT] pulled subreddit hot", {
      subreddit: result.subreddit,
      count: result.items.length,
      inserted: write.inserted.length,
      skipped: write.skipped,
    });
  }
  return results;
}

export function startRedditTrendWorker(options = {}) {
  const cronExpression = options.cronExpression || process.env.TREND_REDDIT_CRON || "30 */3 * * *";
  const logger = options.logger || console;

  logger.log(`[TREND-REDDIT] worker scheduled (${cronExpression})`);
  const task = cron.schedule(cronExpression, () => {
    pullRedditHotBatch({ logger }).catch((error) => {
      logger.error("[TREND-REDDIT] pull failed", { error: error?.message || String(error) });
    });
  });

  if (options.runImmediately !== false) {
    void pullRedditHotBatch({ logger });
  }

  return task;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  startRedditTrendWorker();
}
