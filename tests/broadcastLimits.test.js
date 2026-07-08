import { describe, expect, it, vi } from 'vitest';

vi.mock('../server/src/services/supabase.js', () => ({ default: {} }));

import { findFullScheduledChannel } from '../server/src/config/queuePolicy.js';

describe('scheduled queue limits', () => {
  it('allows channels below the per-channel limit', () => {
    expect(
      findFullScheduledChannel(
        ['instagram'],
        Array.from({ length: 9 }, () => ({ selected_channels: ['instagram'] })),
        10,
      ),
    ).toBeUndefined();
  });

  it('blocks the first requested channel at its limit', () => {
    const broadcasts = [
      ...Array.from({ length: 10 }, () => ({ selected_channels: ['instagram'] })),
      ...Array.from({ length: 4 }, () => ({ selected_channels: ['facebook'] })),
    ];
    expect(
      findFullScheduledChannel(['instagram', 'facebook'], broadcasts, 10),
    ).toBe('instagram');
  });

  it('counts multi-channel scheduled posts against every included channel', () => {
    const broadcasts = Array.from({ length: 10 }, () => ({
      selected_channels: ['instagram', 'facebook'],
    }));
    expect(
      findFullScheduledChannel(['facebook'], broadcasts, 10),
    ).toBe('facebook');
  });

  it('ignores unrelated channels and missing channel arrays', () => {
    expect(
      findFullScheduledChannel(
        ['instagram'],
        [
          { selected_channels: ['youtube'] },
          { selected_channels: null },
        ],
        1,
      ),
    ).toBeUndefined();
  });
});
