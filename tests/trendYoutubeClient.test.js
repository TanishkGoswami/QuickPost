import { describe, expect, it, beforeEach } from "vitest";
import {
  getYouTubeQuotaSnapshot,
  listMostPopularYouTubeVideos,
  resetYouTubeQuotaForTest,
} from "../server/src/services/trendYoutubeClient.js";

describe("trend YouTube Data API client", () => {
  beforeEach(() => resetYouTubeQuotaForTest());

  it("builds a quota-aware mostPopular videos request", async () => {
    const calls = [];
    const fetchImpl = async (url, init) => {
      calls.push({ url: new URL(url), init });
      return {
        ok: true,
        json: async () => ({ items: [{ id: "video_1" }], nextPageToken: "next" }),
      };
    };

    const result = await listMostPopularYouTubeVideos({
      apiKey: "test-key",
      regionCode: "US",
      videoCategoryId: "24",
      maxResults: 80,
      fetchImpl,
      now: new Date("2026-07-20T12:00:00Z"),
    });

    expect(result.items).toEqual([{ id: "video_1" }]);
    expect(result.nextPageToken).toBe("next");
    expect(result.quota.used).toBe(1);
    expect(calls[0].url.pathname).toBe("/youtube/v3/videos");
    expect(calls[0].url.searchParams.get("chart")).toBe("mostPopular");
    expect(calls[0].url.searchParams.get("regionCode")).toBe("US");
    expect(calls[0].url.searchParams.get("videoCategoryId")).toBe("24");
    expect(calls[0].url.searchParams.get("maxResults")).toBe("50");
    expect(calls[0].init.headers.Accept).toBe("application/json");
  });

  it("requires a server-side API key before reserving quota", async () => {
    await expect(
      listMostPopularYouTubeVideos({ apiKey: "", fetchImpl: async () => ({}) }),
    ).rejects.toThrow("Missing YOUTUBE_DATA_API_KEY.");

    expect(getYouTubeQuotaSnapshot().used).toBe(0);
  });
});
