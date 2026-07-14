import { describe, expect, it } from 'vitest';
import { resolvePublishPostType } from '../server/src/utils/postType.js';

describe('resolvePublishPostType', () => {
  it('does not let stale Instagram platform data override an explicit story selection', () => {
    expect(resolvePublishPostType({
      hasInstagramChannel: true,
      postType: 'story',
      platformData: { instagram: { type: 'post' } },
    })).toBe('story');
  });

  it('uses Instagram type when the body only has the default post type', () => {
    expect(resolvePublishPostType({
      hasInstagramChannel: true,
      postType: 'post',
      platformData: { instagram: { type: 'reel' } },
    })).toBe('reel');
  });

  it('uses the Instagram story preset when post fields are stale defaults', () => {
    expect(resolvePublishPostType({
      hasInstagramChannel: true,
      postType: 'post',
      platformData: {
        instagram: { type: 'post' },
        selectedPostSizePreset: 'ig-story',
      },
    })).toBe('story');
  });
});
