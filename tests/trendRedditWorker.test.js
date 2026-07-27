import { describe, expect, it } from "vitest";
import { getRedditIngestionTargets, pullRedditHotBatch } from "../server/src/workers/trendRedditWorker.js";

describe("trend Reddit worker", () => {
  it("builds subreddit targets from env", () => {
    expect(getRedditIngestionTargets({
      TREND_REDDIT_SUBREDDITS: "ChatGPT, SaaS",
      TREND_REDDIT_LIMIT: "10",
    })).toEqual([
      { subreddit: "ChatGPT", limit: "10" },
      { subreddit: "SaaS", limit: "10" },
    ]);
  });

  it("normalizes and inserts pulled subreddit posts", async () => {
    const fetchImpl = async (url) => {
      const parsed = new URL(url);
      if (parsed.hostname === "www.reddit.com") {
        return { ok: true, json: async () => ({ access_token: "token" }) };
      }
      return {
        ok: true,
        json: async () => ({
          data: {
            children: [{ data: { id: "abc", title: "Idea", permalink: "/r/test/comments/abc/idea/", score: 4 } }],
          },
        }),
      };
    };
    const inserted = [];

    const result = await pullRedditHotBatch({
      targets: [{ subreddit: "test", limit: 1 }],
      fetchImpl,
      insertPosts: async (posts) => {
        inserted.push(...posts);
        return { inserted: posts.map((post) => ({ source_url: post.source_url })), skipped: 0 };
      },
      logger: { log() {} },
      clientId: "client",
      clientSecret: "secret",
    });

    expect(inserted[0].source_platform).toBe("reddit");
    expect(result[0].write.inserted).toHaveLength(1);
  });
});
