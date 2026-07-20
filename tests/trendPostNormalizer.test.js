import { describe, expect, it } from "vitest";
import {
  normalizeRedditPostToTrendPost,
  normalizeYouTubeVideoToPost,
} from "../server/src/services/trendPostNormalizer.js";

describe("trend post normalizer", () => {
  it("maps a YouTube video resource into the posts schema", () => {
    const post = normalizeYouTubeVideoToPost(
      {
        id: "abc123",
        snippet: {
          title: "A useful idea",
          channelTitle: "Creator Lab",
          description: "Hook breakdown",
          publishedAt: "2026-07-20T06:00:00Z",
          thumbnails: {
            medium: { url: "https://i.ytimg.com/medium.jpg" },
            high: { url: "https://i.ytimg.com/high.jpg" },
          },
        },
        statistics: {
          viewCount: "100",
          likeCount: "5",
          commentCount: "2",
        },
      },
      new Date("2026-07-20T07:00:00Z"),
    );

    expect(post).toEqual({
      source_platform: "youtube",
      source_url: "https://www.youtube.com/watch?v=abc123",
      embed_html: '<iframe src="https://www.youtube.com/embed/abc123" title="YouTube video" loading="lazy" allowfullscreen></iframe>',
      thumbnail_url: "https://i.ytimg.com/high.jpg",
      caption: "A useful idea by Creator Lab\n\nHook breakdown",
      engagement_score: 116,
      niche_tags: [],
      published_at: "2026-07-20T06:00:00Z",
      ingested_at: "2026-07-20T07:00:00.000Z",
    });
  });

  it("rejects malformed YouTube resources", () => {
    expect(() => normalizeYouTubeVideoToPost({})).toThrow("without an id");
  });

  it("does not store iframe HTML for non-embeddable YouTube videos", () => {
    const post = normalizeYouTubeVideoToPost({
      id: "locked123",
      status: { embeddable: false },
      snippet: { title: "Members only" },
    });

    expect(post.embed_html).toBeNull();
    expect(post.thumbnail_url).toBeNull();
  });

  it("maps a Reddit listing item into the posts schema", () => {
    const post = normalizeRedditPostToTrendPost(
      {
        id: "abc",
        title: "Hook idea",
        selftext: "Breakdown",
        permalink: "/r/ChatGPT/comments/abc/hook_idea/",
        score: 10,
        num_comments: 2,
        created_utc: 1784548800,
        preview: { images: [{ source: { url: "https://preview.redd.it/a.jpg?x=1&amp;y=2" } }] },
      },
      new Date("2026-07-20T07:00:00Z"),
    );

    expect(post).toEqual({
      source_platform: "reddit",
      source_url: "https://www.reddit.com/r/ChatGPT/comments/abc/hook_idea/",
      embed_html: null,
      thumbnail_url: "https://preview.redd.it/a.jpg?x=1&y=2",
      caption: "Hook idea\n\nBreakdown",
      engagement_score: 16,
      niche_tags: [],
      published_at: "2026-07-20T12:00:00.000Z",
      ingested_at: "2026-07-20T07:00:00.000Z",
    });
  });
});
