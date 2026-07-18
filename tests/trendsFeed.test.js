import { describe, expect, it } from 'vitest';
import { normalizeBlueskyPost } from '../server/src/services/trends/bluesky.adapter.js';
import { normalizeGoogleNewsItem } from '../server/src/services/trends/googleNews.adapter.js';
import { normalizeHackerNewsItem } from '../server/src/services/trends/hackerNews.adapter.js';
import { normalizeGithubRepo } from '../server/src/services/trends/github.adapter.js';
import { normalizeLemmyPost } from '../server/src/services/trends/lemmy.adapter.js';
import { normalizeMastodonStatus, normalizeMastodonTag } from '../server/src/services/trends/mastodon.adapter.js';
import { normalizeRedditApiPosts } from '../server/src/services/trends/reddit.adapter.js';
import { normalizeWikipediaArticle } from '../server/src/services/trends/wikipedia.adapter.js';
import { normalizeDevtoArticle } from '../server/src/services/trends/devto.adapter.js';
import { normalizeStackExchangeQuestion } from '../server/src/services/trends/stackExchange.adapter.js';
import { parseRssItems, validateTrendItem } from '../server/src/services/trends/shared.js';

describe('trend source adapters', () => {
  it('normalizes Reddit posts without unsafe or non-visual entries', () => {
    const posts = normalizeRedditApiPosts([
      {
        id: 'abc',
        title: 'AI launch',
        subreddit: 'technology',
        permalink: '/r/technology/comments/abc/ai_launch/',
        url: 'https://example.com/image.jpg',
        score: 120,
        ups: 120,
        num_comments: 8,
        created_utc: 1710000000,
      },
      { id: 'nsfw', title: 'skip', over_18: true, permalink: '/r/x/comments/y/' },
    ], 1);

    expect(posts).toHaveLength(1);
    expect(posts[0]).toMatchObject({ type: 'post', source: 'reddit', authorUsername: 'technology' });
    expect(posts[0].originalUrl).toContain('reddit.com/r/technology');
    expect(validateTrendItem(posts[0])).toBe(true);
  });

  it('normalizes Bluesky post links and engagement', () => {
    const item = normalizeBlueskyPost({
      uri: 'at://did:plc:test/app.bsky.feed.post/3abc',
      record: { text: 'Artificial intelligence update', createdAt: '2026-07-18T10:00:00.000Z' },
      author: { handle: 'creator.bsky.social', displayName: 'Creator' },
      likeCount: 3,
      repostCount: 2,
      replyCount: 1,
      quoteCount: 4,
    });

    expect(item.originalUrl).toBe('https://bsky.app/profile/creator.bsky.social/post/3abc');
    expect(item.engagement).toMatchObject({ likes: 3, shares: 2, comments: 1 });
    expect(item).toMatchObject({ type: 'post', source: 'bluesky' });
    expect(validateTrendItem(item)).toBe(true);
  });

  it('sanitizes Mastodon HTML and tag trend summaries', () => {
    const status = normalizeMastodonStatus({
      id: '1',
      content: '<p>Hello <strong>AI</strong></p>',
      url: 'https://mastodon.social/@a/1',
      account: { username: 'a' },
      favourites_count: 5,
      reblogs_count: 2,
      replies_count: 1,
      created_at: '2026-07-18T10:00:00.000Z',
    });
    const tag = normalizeMastodonTag({ name: 'AI', url: 'https://mastodon.social/tags/AI', history: [{ uses: '7', accounts: '3' }] });

    expect(status.title).toBe('Hello AI');
    expect(tag.description).toContain('7 recent uses');
    expect(status).toMatchObject({ type: 'post', source: 'mastodon' });
    expect(validateTrendItem(status)).toBe(true);
  });

  it('normalizes Lemmy and Google News RSS items', () => {
    const lemmy = normalizeLemmyPost({
      post: { id: 1, name: 'Open source launch', ap_id: 'https://lemmy.world/post/1', published: '2026-07-18T10:00:00.000Z' },
      counts: { score: 9, comments: 2 },
      community: { name: 'technology' },
    });
    const rss = parseRssItems('<rss><channel><item><title><![CDATA[AI News]]></title><link>https://news.example/a</link><description>Latest</description><pubDate>Sat, 18 Jul 2026 10:00:00 GMT</pubDate></item></channel></rss>');
    const news = normalizeGoogleNewsItem(rss[0]);

    expect(lemmy).toMatchObject({ type: 'post', source: 'lemmy' });
    expect(news).toMatchObject({ type: 'article', source: 'google-news', title: 'AI News' });
    expect(validateTrendItem(lemmy)).toBe(true);
    expect(validateTrendItem(news)).toBe(true);
  });

  it('normalizes Phase 2 developer and knowledge sources', () => {
    const hn = normalizeHackerNewsItem({ id: 1, title: 'AI startup', by: 'pg', score: 42, descendants: 5, time: 1784388000 });
    const github = normalizeGithubRepo({
      id: 2,
      full_name: 'openai/example',
      html_url: 'https://github.com/openai/example',
      description: 'AI repo',
      stargazers_count: 100,
      owner: { login: 'openai' },
      created_at: '2026-07-18T10:00:00.000Z',
    });
    const wiki = normalizeWikipediaArticle({ article: 'Artificial_intelligence', views: 9000 });
    const devto = normalizeDevtoArticle({ id: 3, title: 'React tips', url: 'https://dev.to/a/react', user: { username: 'a' } });
    const stack = normalizeStackExchangeQuestion({
      question_id: 4,
      title: 'How to test React?',
      link: 'https://stackoverflow.com/q/4',
      score: 7,
      creation_date: 1784388000,
    });

    expect(hn).toMatchObject({ type: 'post', source: 'hacker-news' });
    expect(github).toMatchObject({ type: 'repository', source: 'github' });
    expect(wiki).toMatchObject({ type: 'article', source: 'wikipedia', title: 'Artificial intelligence' });
    expect(devto).toMatchObject({ type: 'article', source: 'dev' });
    expect(stack).toMatchObject({ type: 'question', source: 'stack-overflow' });
    expect([hn, github, wiki, devto, stack].every(validateTrendItem)).toBe(true);
  });
});
