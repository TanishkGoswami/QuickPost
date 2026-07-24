import { describe, expect, it } from "vitest";
import {
  getYouTubeIngestionTargets,
  pullYouTubeMostPopularBatch,
} from "../server/src/workers/trendYoutubeWorker.js";

describe("trend YouTube worker", () => {
  it("builds region/category target combinations from env", () => {
    expect(
      getYouTubeIngestionTargets({
        TREND_YOUTUBE_REGIONS: "IN,US",
        TREND_YOUTUBE_CATEGORY_IDS: "24,10",
        TREND_YOUTUBE_MAX_RESULTS: "12",
      }),
    ).toEqual([
      { regionCode: "IN", videoCategoryId: "24", maxResults: "12" },
      { regionCode: "IN", videoCategoryId: "10", maxResults: "12" },
      { regionCode: "US", videoCategoryId: "24", maxResults: "12" },
      { regionCode: "US", videoCategoryId: "10", maxResults: "12" },
    ]);
  });

  it("pulls each target through the official YouTube client path", async () => {
    const urls = [];
    const fetchImpl = async (url) => {
      urls.push(new URL(url));
      return { ok: true, json: async () => ({ items: [{ id: "one" }] }) };
    };

    const results = await pullYouTubeMostPopularBatch({
      targets: [{ regionCode: "IN", videoCategoryId: null, maxResults: 1 }],
      apiKey: "test-key",
      fetchImpl,
      insertPosts: async (posts) => ({ inserted: posts, skipped: 0 }),
      logger: { log() {} },
    });

    expect(results).toHaveLength(1);
    expect(results[0].items).toEqual([{ id: "one" }]);
    expect(results[0].posts[0].source_url).toBe("https://www.youtube.com/watch?v=one");
    expect(urls[0].searchParams.get("chart")).toBe("mostPopular");
    expect(urls[0].searchParams.get("regionCode")).toBe("IN");
  });
});
