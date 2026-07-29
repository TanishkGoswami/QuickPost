import { describe, expect, it } from "vitest";
import {
  dedupePostsForInsert,
  insertNewTrendPosts,
  withContentHash,
} from "../server/src/services/trendPostStore.js";

const basePost = {
  source_platform: "youtube",
  source_url: "https://www.youtube.com/watch?v=one",
  caption: "One",
  thumbnail_url: "https://img.example.com/one.jpg",
  engagement_score: 1,
  niche_tags: [],
  published_at: "2026-07-20T00:00:00Z",
  ingested_at: "2026-07-20T01:00:00Z",
};

describe("trend post store", () => {
  it("adds a stable content hash", () => {
    expect(withContentHash(basePost).content_hash).toBe(withContentHash(basePost).content_hash);
  });

  it("dedupes by source URL and content hash before insert", () => {
    const duplicateContent = {
      ...basePost,
      source_url: "https://www.youtube.com/watch?v=two",
    };
    const posts = [basePost, basePost, duplicateContent];

    expect(dedupePostsForInsert(posts)).toHaveLength(2);
    expect(dedupePostsForInsert(posts, [withContentHash(basePost)])).toHaveLength(1);
  });

  it("inserts only new posts through Supabase", async () => {
    const inserted = [];
    const supabase = {
      from(table) {
        expect(table).toBe("posts");
        return {
          select() {
            return this;
          },
          in(column) {
            return Promise.resolve({
              data: column === "source_url" ? [{ source_url: basePost.source_url, content_hash: "old" }] : [],
              error: null,
            });
          },
          insert(rows) {
            inserted.push(...rows);
            return {
              select: async () => ({
                data: rows.map((row, index) => ({ id: String(index + 1), source_url: row.source_url, content_hash: row.content_hash })),
                error: null,
              }),
            };
          },
        };
      },
    };

    const result = await insertNewTrendPosts([
      basePost,
      { ...basePost, source_url: "https://www.youtube.com/watch?v=two", caption: "Two" },
    ], { supabase });

    expect(inserted).toHaveLength(1);
    expect(result.inserted).toHaveLength(1);
    expect(result.skipped).toBe(1);
  });
});
