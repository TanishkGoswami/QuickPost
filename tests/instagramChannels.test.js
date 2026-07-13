import { describe, expect, it } from 'vitest';
import { resolveInstagramPublishChannels } from '../server/src/utils/instagramChannels.js';

describe('resolveInstagramPublishChannels', () => {
  const accounts = [{ id: 'one' }, { id: 'two' }];

  it('uses only explicitly selected Instagram accounts', () => {
    expect(resolveInstagramPublishChannels(['instagram', 'instagram:one'], accounts)).toEqual(['instagram:one']);
  });

  it('rejects base Instagram when multiple accounts are connected', () => {
    expect(() => resolveInstagramPublishChannels(['instagram'], accounts)).toThrow(
      'Select one specific Instagram account',
    );
  });

  it('maps base Instagram to the only connected account', () => {
    expect(resolveInstagramPublishChannels(['instagram'], [{ id: 'one' }])).toEqual(['instagram:one']);
  });

  it('rejects disconnected selected Instagram accounts', () => {
    expect(() => resolveInstagramPublishChannels(['instagram:missing'], accounts)).toThrow(
      'Selected Instagram account is disconnected',
    );
  });
});
