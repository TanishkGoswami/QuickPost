import { beforeEach, describe, expect, it, vi } from 'vitest';

const axiosMock = vi.hoisted(() => ({ post: vi.fn() }));

vi.mock('axios', () => ({ default: axiosMock }));

vi.resetModules();
const { postFacebookReel, postFacebookStory } = await import('../server/src/services/facebook.js');

describe('Facebook publishing helpers', () => {
  beforeEach(() => {
    axiosMock.post.mockReset();
  });

  it('publishes reels through the upload-session flow', async () => {
    axiosMock.post
      .mockResolvedValueOnce({ data: { video_id: 'video_1', upload_url: 'https://upload.facebook.com/session' } })
      .mockResolvedValueOnce({ data: {} })
      .mockResolvedValueOnce({ data: { id: 'reel_1' } });

    const result = await postFacebookReel('PAGE_TOKEN', 'page_1', 'caption', 'https://cdn.example.com/reel.mp4', axiosMock);

    expect(result).toMatchObject({ success: true, postId: 'reel_1' });
    expect(axiosMock.post).toHaveBeenNthCalledWith(1, expect.stringContaining('/page_1/video_reels'), {
      upload_phase: 'start',
      access_token: 'PAGE_TOKEN',
    });
    expect(axiosMock.post).toHaveBeenNthCalledWith(
      2,
      'https://upload.facebook.com/session',
      { file_url: 'https://cdn.example.com/reel.mp4' },
      { headers: { Authorization: 'OAuth PAGE_TOKEN' } },
    );
    expect(axiosMock.post).toHaveBeenNthCalledWith(3, expect.stringContaining('/page_1/video_reels'), {
      upload_phase: 'finish',
      video_id: 'video_1',
      description: 'caption',
      access_token: 'PAGE_TOKEN',
    });
  });

  it('publishes image stories from an unpublished page photo', async () => {
    axiosMock.post
      .mockResolvedValueOnce({ data: { id: 'photo_1' } })
      .mockResolvedValueOnce({ data: { id: 'story_1' } });

    const result = await postFacebookStory('PAGE_TOKEN', 'page_1', 'caption', 'https://cdn.example.com/story.jpg', 'image', axiosMock);

    expect(result).toMatchObject({ success: true, postId: 'story_1' });
    expect(axiosMock.post).toHaveBeenNthCalledWith(1, expect.stringContaining('/page_1/photos'), {
      url: 'https://cdn.example.com/story.jpg',
      caption: 'caption',
      published: false,
      access_token: 'PAGE_TOKEN',
    });
    expect(axiosMock.post).toHaveBeenNthCalledWith(2, expect.stringContaining('/page_1/photo_stories'), {
      photo_id: 'photo_1',
      access_token: 'PAGE_TOKEN',
    });
  });
});
