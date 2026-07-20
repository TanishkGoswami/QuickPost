import { describe, expect, it } from "vitest";
import {
  decodeTrendCursor,
  encodeTrendCursor,
  getTrendFeedPage,
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
    or(filter) {
      state.filters.push(filter);
      return this;
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
    const post = { id: "00000000-0000-0000-0000-000000000001", ingested_at: "2026-07-20T00:00:00Z" };
    expect(decodeTrendCursor(encodeTrendCursor(post))).toEqual(post);
    expect(decodeTrendCursor("bad")).toBeNull();
  });

  it("fetches one extra row and returns a next cursor", async () => {
    const rows = [
      { id: "3", ingested_at: "2026-07-20T03:00:00Z" },
      { id: "2", ingested_at: "2026-07-20T02:00:00Z" },
      { id: "1", ingested_at: "2026-07-20T01:00:00Z" },
    ];
    const supabase = mockSupabase(rows);

    const page = await getTrendFeedPage({ limit: 2 }, { supabase });

    expect(supabase.state.limit).toBe(3);
    expect(page.items).toEqual(rows.slice(0, 2));
    expect(decodeTrendCursor(page.nextCursor)).toEqual(rows[1]);
  });

  it("applies a keyset cursor filter", async () => {
    const cursor = encodeTrendCursor({ id: "2", ingested_at: "2026-07-20T02:00:00Z" });
    const supabase = mockSupabase([]);

    await getTrendFeedPage({ cursor }, { supabase });

    expect(supabase.state.filters[0]).toContain("ingested_at.lt.2026-07-20T02:00:00Z");
    expect(supabase.state.filters[0]).toContain("id.lt.2");
  });
});
