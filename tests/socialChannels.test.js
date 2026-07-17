import { describe, expect, it } from 'vitest';
import { resolveSocialPublishChannels } from '../server/src/utils/socialChannels.js';

describe('resolveSocialPublishChannels', () => {
  const accounts = [
    { id: 'row-one', account_id: 'external-one' },
    { id: 'row-two', account_id: 'external-two' },
  ];

  it('maps a plain provider to the only connected account', () => {
    expect(resolveSocialPublishChannels('facebook', ['facebook'], [accounts[0]])).toEqual([
      { ...accounts[0], channel: 'facebook:row-one' },
    ]);
  });

  it('rejects a plain provider when multiple accounts are connected', () => {
    expect(() => resolveSocialPublishChannels('facebook', ['facebook'], accounts)).toThrow(
      'Multiple facebook accounts are connected',
    );
  });

  it('resolves specific account channels and dedupes duplicate external accounts', () => {
    const duplicate = { id: 'row-three', account_id: 'external-two' };
    expect(
      resolveSocialPublishChannels('facebook', ['facebook:row-two', 'facebook:row-three'], [
        ...accounts,
        duplicate,
      ]),
    ).toEqual([{ ...accounts[1], channel: 'facebook:row-two' }]);
  });

  it('rejects disconnected specific account channels', () => {
    expect(() => resolveSocialPublishChannels('facebook', ['facebook:missing'], accounts)).toThrow(
      'Selected facebook account is not connected',
    );
  });
});
