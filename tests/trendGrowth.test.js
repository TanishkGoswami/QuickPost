import { describe, expect, it } from 'vitest';
import { calculateGrowthFromSnapshots, lifecycleFromGrowth } from '../server/src/services/trends/store.js';

describe('trend growth calculation', () => {
  it('returns null growth when comparison snapshots are unavailable', () => {
    expect(calculateGrowthFromSnapshots({ trendScore: 80 }, {})).toEqual({
      oneHour: null,
      sixHour: null,
      twentyFourHour: null,
      sevenDay: null,
    });
  });

  it('calculates growth only from real historical trend scores', () => {
    expect(calculateGrowthFromSnapshots({ trendScore: 80 }, {
      oneHour: { trend_score: 64 },
      sixHour: { trend_score: 100 },
      twentyFourHour: { trend_score: 0 },
      sevenDay: null,
    })).toEqual({
      oneHour: 25,
      sixHour: -20,
      twentyFourHour: null,
      sevenDay: null,
    });
  });

  it('updates lifecycle only when recent historical growth exists', () => {
    expect(lifecycleFromGrowth('hot', { oneHour: null, sixHour: null })).toBe('hot');
    expect(lifecycleFromGrowth('peaked', { oneHour: 10, sixHour: null })).toBe('rising');
    expect(lifecycleFromGrowth('hot', { oneHour: 10, sixHour: null })).toBe('hot');
    expect(lifecycleFromGrowth('rising', { oneHour: -5, sixHour: null })).toBe('falling');
    expect(lifecycleFromGrowth('rising', { oneHour: 0, sixHour: null })).toBe('peaked');
  });
});
