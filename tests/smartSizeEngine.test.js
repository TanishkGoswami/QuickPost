import { describe, expect, it } from 'vitest';
import { isPresetCompatible } from '../client/src/components/composer/engines/SmartSizeEngine.js';

describe('SmartSizeEngine', () => {
  it('treats specific Instagram accounts as Instagram for story and reel presets', () => {
    expect(isPresetCompatible('ig-story', 'instagram', ['instagram:one'])).toBe(true);
    expect(isPresetCompatible('ig-reel', 'instagram', ['instagram:one'])).toBe(true);
  });
});
