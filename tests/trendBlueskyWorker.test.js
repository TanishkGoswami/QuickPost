import { describe, expect, it } from "vitest";
import { startBlueskyTrendWorker } from "../server/src/workers/trendBlueskyWorker.js";

describe("trend Bluesky worker", () => {
  it("batches firehose posts into the shared insert path", async () => {
    const inserted = [];
    class FakeWebSocket {
      constructor() {
        this.handlers = {};
      }
      addEventListener(type, handler) {
        this.handlers[type] = handler;
      }
      emit(type, event) {
        this.handlers[type]?.(event);
      }
      close() {}
    }

    const worker = startBlueskyTrendWorker({
      WebSocketImpl: FakeWebSocket,
      baseUrl: "wss://example.test/subscribe",
      batchSize: 1,
      flushMs: 999999,
      logger: { log() {}, error() {} },
      insertPosts: async (posts) => {
        inserted.push(...posts);
        return { inserted: posts.map((post) => ({ source_url: post.source_url })), skipped: 0 };
      },
    });

    worker.socket.emit("message", {
      data: JSON.stringify({
        kind: "commit",
        did: "did:plc:abc",
        commit: {
          operation: "create",
          collection: "app.bsky.feed.post",
          rkey: "3k",
          record: { text: "Idea" },
        },
      }),
    });
    await worker.flush();
    await worker.stop();

    expect(inserted[0].source_platform).toBe("bluesky");
  });
});
