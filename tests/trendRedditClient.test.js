import { describe, expect, it } from "vitest";
import { listSubredditHotPosts, redditTrendInternals } from "../server/src/services/trendRedditClient.js";

describe("trend Reddit client", () => {
  it("pulls subreddit hot posts with app OAuth", async () => {
    const calls = [];
    const fetchImpl = async (url, init) => {
      calls.push({ url: new URL(url), init });
      if (calls.length === 1) {
        return { ok: true, json: async () => ({ access_token: "token" }) };
      }
      return {
        ok: true,
        json: async () => ({ data: { children: [{ data: { id: "abc", title: "Idea" } }], after: "next" } }),
      };
    };

    const result = await listSubredditHotPosts({
      clientId: "client",
      clientSecret: "secret",
      subreddit: "r/ChatGPT",
      limit: 150,
      fetchImpl,
      userAgent: "QuickPost-Test/1.0",
    });

    expect(result.subreddit).toBe("ChatGPT");
    expect(result.items).toEqual([{ id: "abc", title: "Idea" }]);
    expect(result.after).toBe("next");
    expect(calls[0].url.pathname).toBe("/api/v1/access_token");
    expect(String(calls[0].init.body)).toBe("grant_type=client_credentials");
    expect(calls[1].url.pathname).toBe("/r/ChatGPT/hot");
    expect(calls[1].url.searchParams.get("limit")).toBe("100");
  });

  it("normalizes subreddit names for official API paths", () => {
    expect(redditTrendInternals.normalizeSubreddit("/r/ArtificialInteligence!")).toBe("ArtificialInteligence");
  });

  it("surfaces Reddit rate-limit retry hints", async () => {
    const fetchImpl = async () => ({
      ok: false,
      status: 429,
      headers: { get: (name) => name === "retry-after" ? "60" : null },
      json: async () => ({ message: "slow down" }),
    });

    await expect(listSubredditHotPosts({
      clientId: "client",
      clientSecret: "secret",
      subreddit: "ChatGPT",
      fetchImpl,
    })).rejects.toMatchObject({
      message: "Reddit API rate limit reached. Retry after 60 seconds.",
      status: 429,
      retryAfterSeconds: "60",
    });
  });
});
