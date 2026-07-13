import { describe, expect, it } from 'vitest';
import {
  buildInstagramStoryContainerPayload,
  postStoryToInstagram,
} from '../server/src/services/instagram.js';

const tokens = {
  accessToken: 'EAATEST',
  businessId: '17890000000000000',
};

describe('Instagram story publishing helpers', () => {
  it('builds an image story container payload', () => {
    expect(
      buildInstagramStoryContainerPayload('https://cdn.example.com/story.jpg', 'hello', 'image', 'EAATEST'),
    ).toEqual({
      media_type: 'STORIES',
      image_url: 'https://cdn.example.com/story.jpg',
      access_token: 'EAATEST',
    });
  });

  it('builds a video story container payload', () => {
    expect(
      buildInstagramStoryContainerPayload('https://cdn.example.com/story.mp4', 'hello', 'video', 'EAATEST'),
    ).toEqual({
      media_type: 'STORIES',
      video_url: 'https://cdn.example.com/story.mp4',
      access_token: 'EAATEST',
    });
  });

  it('rejects localhost media URLs before calling Meta', async () => {
    const result = await postStoryToInstagram('http://localhost:5000/uploads/story.jpg', 'hello', tokens, 'image');

    expect(result.success).toBe(false);
    expect(result.error).toContain('publicly accessible HTTPS URL');
  });

  it('sends media_type=STORIES to Meta when creating the story container', async () => {
    const calls = [];
    const http = {
      post: async (url, payload) => {
        calls.push({ url, payload });
        return { data: { id: calls.length === 1 ? 'container_1' : 'media_1' } };
      },
      get: async () => ({ data: { status_code: 'FINISHED' } }),
    };

    const result = await postStoryToInstagram(
      'https://cdn.example.com/story.jpg',
      '',
      tokens,
      'image',
      null,
      null,
      http,
    );

    expect(result.success).toBe(true);
    expect(calls[0].url).toContain('/17890000000000000/media');
    expect(calls[0].payload).toEqual({
      image_url: 'https://cdn.example.com/story.jpg',
      media_type: 'STORIES',
      access_token: 'EAATEST',
    });
  });
});
