import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const axiosMock = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));

vi.mock('axios', () => ({ default: axiosMock }));

vi.resetModules();
const { postCarouselToInstagram } = await import('../server/src/services/instagram.js');

const tokens = {
  accessToken: 'EAATEST',
  businessId: '17890000000000000',
};

describe('Instagram carousel publishing', () => {
  beforeEach(() => {
    axiosMock.get.mockReset();
    axiosMock.post.mockReset();
    vi.spyOn(global, 'setTimeout').mockImplementation((callback) => {
      callback();
      return 0;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('polls video carousel children before publishing the carousel', async () => {
    axiosMock.post
      .mockResolvedValueOnce({ data: { id: 'child_image' } })
      .mockResolvedValueOnce({ data: { id: 'child_video' } })
      .mockResolvedValueOnce({ data: { id: 'carousel_1' } })
      .mockResolvedValueOnce({ data: { id: 'media_1' } });
    axiosMock.get.mockResolvedValueOnce({ data: { status_code: 'FINISHED' } });

    const result = await postCarouselToInstagram(
      ['https://cdn.example.com/photo.jpg', 'https://res.cloudinary.com/demo/video/upload/reel.mp4'],
      'caption',
      tokens,
      null,
      axiosMock,
    );

    expect(result).toMatchObject({ success: true, mediaId: 'media_1' });
    expect(axiosMock.post).toHaveBeenNthCalledWith(1, expect.stringContaining('/media'), expect.objectContaining({
      media_type: 'IMAGE',
      image_url: 'https://cdn.example.com/photo.jpg',
      is_carousel_item: true,
    }));
    expect(axiosMock.post).toHaveBeenNthCalledWith(2, expect.stringContaining('/media'), expect.objectContaining({
      media_type: 'VIDEO',
      video_url: 'https://res.cloudinary.com/demo/video/upload/reel.mp4',
      is_carousel_item: true,
    }));
    expect(axiosMock.get).toHaveBeenCalledWith(expect.stringContaining('/child_video'), {
      params: {
        fields: 'status_code',
        access_token: 'EAATEST',
      },
    });
  });
});
