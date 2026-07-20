import cron from "node-cron";
import { pathToFileURL } from "url";
import { listMostPopularYouTubeVideos } from "../services/trendYoutubeClient.js";
import { normalizeYouTubeVideosToPosts } from "../services/trendPostNormalizer.js";

const DEFAULT_REGIONS = ["IN"];
const DEFAULT_CATEGORIES = [null];

function csv(value, fallback) {
  const parsed = String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return parsed.length ? parsed : fallback;
}

export function getYouTubeIngestionTargets(env = process.env) {
  const regions = csv(env.TREND_YOUTUBE_REGIONS, DEFAULT_REGIONS);
  const categories = csv(env.TREND_YOUTUBE_CATEGORY_IDS, DEFAULT_CATEGORIES);

  return regions.flatMap((regionCode) =>
    categories.map((videoCategoryId) => ({
      regionCode,
      videoCategoryId,
      maxResults: env.TREND_YOUTUBE_MAX_RESULTS || 25,
    })),
  );
}

export async function pullYouTubeMostPopularBatch(options = {}) {
  const {
    targets = getYouTubeIngestionTargets(),
    apiKey,
    fetchImpl,
    logger = console,
  } = options;

  const results = [];
  for (const target of targets) {
    const result = await listMostPopularYouTubeVideos({ ...target, apiKey, fetchImpl });
    const posts = normalizeYouTubeVideosToPosts(result.items);
    results.push({ target, ...result, posts });
    logger.log("[TREND-YOUTUBE] pulled mostPopular", {
      regionCode: target.regionCode,
      videoCategoryId: target.videoCategoryId || "all",
      count: result.items.length,
      quota: result.quota,
    });
  }
  return results;
}

export function startYouTubeTrendWorker(options = {}) {
  const cronExpression = options.cronExpression || process.env.TREND_YOUTUBE_CRON || "0 */2 * * *";
  const logger = options.logger || console;

  logger.log(`[TREND-YOUTUBE] worker scheduled (${cronExpression})`);
  const task = cron.schedule(cronExpression, () => {
    pullYouTubeMostPopularBatch({ logger }).catch((error) => {
      logger.error("[TREND-YOUTUBE] pull failed", { error: error?.message || String(error) });
    });
  });

  if (options.runImmediately !== false) {
    void pullYouTubeMostPopularBatch({ logger });
  }

  return task;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  startYouTubeTrendWorker();
}
