import { describe, expect, it } from 'vitest';
import { clusterTrendItems, matchTrendItems } from '../server/src/services/trends/clustering.js';
import { withTrendDefaults } from '../server/src/services/trends/shared.js';

const NOW = '2026-07-18T12:00:00.000Z';

function trend(overrides) {
  return withTrendDefaults({
    source: 'news',
    type: 'article',
    title: 'Sample trend',
    originalUrl: 'https://example.com/story',
    publishedAt: NOW,
    ...overrides,
  });
}

describe('trend cross-platform clustering', () => {
  it('merges items with the same canonical URL and keeps the best primary item', () => {
    const items = [
      trend({
        source: 'reddit',
        type: 'post',
        title: 'OpenAI releases a new model',
        originalUrl: 'https://example.com/story?utm_source=reddit',
        engagement: { score: 25 },
      }),
      trend({
        source: 'news',
        type: 'article',
        title: 'OpenAI releases a new model',
        originalUrl: 'https://www.example.com/story',
        imageUrl: 'https://example.com/image.jpg',
        description: 'A complete report on the release.',
        engagement: { score: 10 },
      }),
    ];

    const [cluster] = clusterTrendItems(items);

    expect(cluster.source).toBe('news');
    expect(cluster.crossPlatformCount).toBe(2);
    expect(cluster.platformBadges.sort()).toEqual(['news', 'reddit']);
    expect(cluster.clusterItems).toHaveLength(2);
    expect(cluster.matchReason).toBe('canonical_url');
    expect(cluster.matchConfidence).toBe(1);
  });

  it('merges similar headlines across sources with saved match metadata', () => {
    const reddit = trend({
      source: 'reddit',
      title: 'OpenAI releases new artificial intelligence model for developers',
      originalUrl: 'https://reddit.com/r/technology/comments/123/openai-model',
    });
    const bluesky = trend({
      source: 'bluesky',
      title: 'OpenAI launches new artificial intelligence model for developers',
      originalUrl: 'https://bsky.app/profile/example.com/post/abc',
    });

    const clusters = clusterTrendItems([reddit, bluesky]);

    expect(clusters).toHaveLength(1);
    expect(clusters[0].crossPlatformCount).toBe(2);
    expect(clusters[0].matchReason).toBe('important_keywords');
    expect(clusters[0].matchConfidence).toBeGreaterThan(0.7);
  });

  it('does not merge unrelated topics just because they share generic words', () => {
    const funding = trend({
      source: 'reddit',
      title: 'AI startup raises funding after product launch',
      originalUrl: 'https://reddit.com/r/startups/comments/1/funding',
    });
    const lawsuit = trend({
      source: 'mastodon',
      title: 'AI startup faces lawsuit after data breach',
      originalUrl: 'https://mastodon.social/@news/2',
    });

    expect(matchTrendItems(funding, lawsuit).matched).toBe(false);
    expect(clusterTrendItems([funding, lawsuit])).toHaveLength(2);
  });
});
