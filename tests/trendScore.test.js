import { describe, expect, it } from 'vitest';
import { applyTrendScores, calculateTrendScore, withTrendDefaults } from '../server/src/services/trends/shared.js';

const NOW = '2026-07-18T12:00:00.000Z';

describe('trend score calculation', () => {
  it('uses weighted engagement, freshness, and cross-platform presence', () => {
    const item = withTrendDefaults({
      source: 'reddit',
      type: 'post',
      title: 'Artificial intelligence launch',
      originalUrl: 'https://reddit.com/r/technology/comments/a',
      publishedAt: '2026-07-18T06:00:00.000Z',
      engagement: { likes: 1200, comments: 100, shares: 25, views: 0, score: 0 },
    });

    const score = calculateTrendScore(item, { now: NOW, presenceCount: 3 });

    expect(score.scoreBreakdown).toEqual({
      engagement: 78,
      freshness: 92,
      crossPlatformPresence: 67,
      weights: { engagement: 45, freshness: 35, crossPlatformPresence: 20 },
    });
    expect(score.trendScore).toBe(80);
    expect(score.lifecycle).toBe('rising');
    expect(score.calculatedAt).toBe(NOW);
  });

  it('normalizes engagement independently per source', () => {
    const reddit = withTrendDefaults({
      source: 'reddit',
      type: 'post',
      title: 'Same raw metric',
      originalUrl: 'https://reddit.com/r/a/comments/1',
      publishedAt: NOW,
      engagement: { score: 1000 },
    });
    const github = withTrendDefaults({
      source: 'github',
      type: 'repository',
      title: 'Same raw metric repo',
      originalUrl: 'https://github.com/a/b',
      publishedAt: NOW,
      engagement: { score: 1000 },
    });

    expect(calculateTrendScore(reddit, { now: NOW }).scoreBreakdown.engagement)
      .not.toBe(calculateTrendScore(github, { now: NOW }).scoreBreakdown.engagement);
  });

  it('adds cross-platform presence when related titles appear on multiple sources', () => {
    const items = [
      withTrendDefaults({ source: 'reddit', type: 'post', title: 'OpenAI launches new AI model', originalUrl: 'https://reddit.com/a', publishedAt: NOW }),
      withTrendDefaults({ source: 'bluesky', type: 'post', title: 'OpenAI launches new AI model', originalUrl: 'https://bsky.app/a', publishedAt: NOW }),
      withTrendDefaults({ source: 'github', type: 'repository', title: 'Different repository trend', originalUrl: 'https://github.com/a/b', publishedAt: NOW }),
    ];

    const scored = applyTrendScores(items, { now: NOW });

    expect(scored[0].scoreBreakdown.crossPlatformPresence).toBe(33);
    expect(scored[1].scoreBreakdown.crossPlatformPresence).toBe(33);
    expect(scored[2].scoreBreakdown.crossPlatformPresence).toBe(0);
  });
});
