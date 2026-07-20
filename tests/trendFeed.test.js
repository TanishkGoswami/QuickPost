import { describe, expect, it } from "vitest";
import {
  decodeTrendCursor,
  encodeTrendCursor,
  getTrendFeedPage,
  scoreTrendPost,
} from "../server/src/services/trendFeed.js";

function mockSupabase(rows) {
  const state = { limit: null, filters: [] };
  const query = {
    select() { return this; },
    order() { return this; },
    limit(value) {
      state.limit = value;
      return Promise.resolve({ data: rows.slice(0, value), error: null });
    },
  };
  return {
    state,
    from(table) {
      expect(table).toBe("posts");
      return query;
    },
  };
}

describe("trend feed cursor pagination", () => {
  it("round-trips cursors", () => {
    const post = { id: "00000000-0000-0000-0000-000000000001", rank_score: 12.34 };
    expect(decodeTrendCursor(encodeTrendCursor(post))).toEqual(post);
    expect(decodeTrendCursor("bad")).toBeNull();
  });

  it("ranks by recency decay times engagement velocity", () => {
    const now = new Date("2026-07-20T12:00:00Z");
    const fast = scoreTrendPost({ engagement_score: 100, published_at: "2026-07-20T11:00:00Z" }, now);
    const stale = scoreTrendPost({ engagement_score: 100, published_at: "2026-07-10T11:00:00Z" }, now);

    expect(fast).toBeGreaterThan(stale);
  });

  it("fetches a bounded candidate pool and returns a rank cursor", async () => {
    const rows = [
      { id: "3", ingested_at: "2026-07-20T03:00:00Z", published_at: "2026-07-20T03:00:00Z", engagement_score: 3 },
      { id: "2", ingested_at: "2026-07-20T02:00:00Z", published_at: "2026-07-20T02:00:00Z", engagement_score: 100 },
      { id: "1", ingested_at: "2026-07-20T01:00:00Z", published_at: "2026-07-20T01:00:00Z", engagement_score: 1 },
    ];
    const supabase = mockSupabase(rows);

    const page = await getTrendFeedPage({ limit: 2 }, { supabase, now: new Date("2026-07-20T04:00:00Z") });

    expect(supabase.state.limit).toBe(500);
    expect(page.items.map((item) => item.id)).toEqual(["2", "3"]);
    expect(decodeTrendCursor(page.nextCursor)).toMatchObject({ id: "3" });
  });

  it("applies a rank cursor without offset", async () => {
    const rows = [
      { id: "3", ingested_at: "2026-07-20T03:00:00Z", published_at: "2026-07-20T03:00:00Z", engagement_score: 30 },
      { id: "2", ingested_at: "2026-07-20T02:00:00Z", published_at: "2026-07-20T02:00:00Z", engagement_score: 20 },
      { id: "1", ingested_at: "2026-07-20T01:00:00Z", published_at: "2026-07-20T01:00:00Z", engagement_score: 10 },
    ];
    const supabase = mockSupabase(rows);
    const firstPage = await getTrendFeedPage({ limit: 1 }, { supabase, now: new Date("2026-07-20T04:00:00Z") });

    const secondPage = await getTrendFeedPage(
      { limit: 1, cursor: firstPage.nextCursor },
      { supabase, now: new Date("2026-07-20T04:00:00Z") },
    );

    expect(secondPage.items[0].id).not.toBe(firstPage.items[0].id);
  });

  it("serves and writes hot feed pages through cache", async () => {
    const rows = [
      { id: "1", ingested_at: "2026-07-20T01:00:00Z", published_at: "2026-07-20T01:00:00Z", engagement_score: 10 },
    ];
    const writes = [];
    const cache = {
      value: null,
      async get() { return this.value; },
      async set(key, value, mode, ttl) {
        writes.push({ key, value, mode, ttl });
        this.value = value;
      },
    };

    const first = await getTrendFeedPage({ limit: 1 }, { supabase: mockSupabase(rows), cache, now: new Date("2026-07-20T04:00:00Z") });
    const second = await getTrendFeedPage({ limit: 1 }, { supabase: mockSupabase([]), cache, now: new Date("2026-07-20T04:00:00Z") });

    expect(first.cached).toBe(false);
    expect(second.cached).toBe(true);
    expect(second.items).toEqual(first.items);
    expect(writes[0]).toMatchObject({ mode: "EX", ttl: 60 });
  });
});
