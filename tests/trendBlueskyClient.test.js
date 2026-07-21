import { describe, expect, it } from "vitest";
import {
  buildBlueskyJetstreamUrl,
  connectBlueskyJetstream,
  parseBlueskyJetstreamPostEvent,
} from "../server/src/services/trendBlueskyClient.js";

describe("trend Bluesky client", () => {
  it("builds a filtered Jetstream URL for posts", () => {
    const url = new URL(buildBlueskyJetstreamUrl({ baseUrl: "wss://example.test/subscribe", cursor: 123 }));
    expect(url.searchParams.get("wantedCollections")).toBe("app.bsky.feed.post");
    expect(url.searchParams.get("cursor")).toBe("123");
  });

  it("filters Jetstream events to top-level Bluesky posts", () => {
    const post = parseBlueskyJetstreamPostEvent({
      kind: "commit",
      did: "did:plc:abc",
      time_us: 1784548800000000,
      commit: {
        operation: "create",
        collection: "app.bsky.feed.post",
        rkey: "3k",
        record: { text: "Idea", langs: ["en"] },
      },
    });

    expect(post).toEqual({
      did: "did:plc:abc",
      rkey: "3k",
      text: "Idea",
      createdAt: "2026-07-20T12:00:00.000Z",
      langs: ["en"],
    });
    expect(parseBlueskyJetstreamPostEvent({
      kind: "commit",
      did: "did:plc:abc",
      commit: {
        operation: "create",
        collection: "app.bsky.feed.post",
        rkey: "reply",
        record: { text: "Reply", reply: {} },
      },
    })).toBeNull();
  });

  it("connects a websocket and emits parsed posts", () => {
    const received = [];
    class FakeWebSocket {
      constructor(url) {
        this.url = url;
        this.handlers = {};
      }
      addEventListener(type, handler) {
        this.handlers[type] = handler;
      }
      emit(type, event) {
        this.handlers[type]?.(event);
      }
    }

    const socket = connectBlueskyJetstream({
      baseUrl: "wss://example.test/subscribe",
      WebSocketImpl: FakeWebSocket,
      onPost: (post) => received.push(post),
    });
    socket.emit("message", {
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

    expect(socket.url).toContain("wantedCollections=app.bsky.feed.post");
    expect(received[0].text).toBe("Idea");
  });
});
