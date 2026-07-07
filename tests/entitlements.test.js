import { describe, expect, it, vi } from 'vitest';

vi.mock('../server/src/services/supabase.js', () => ({ default: {} }));

import {
  currentMonthPeriod,
  selectBestSubscription,
  subscriptionIsUsable,
  todayPeriod,
} from '../server/src/config/entitlementPolicy.js';

const NOW = Date.parse('2026-06-30T12:00:00Z');

describe('subscription validity', () => {
  it('accepts active subscriptions and valid trials', () => {
    expect(subscriptionIsUsable({ status: 'active' }, NOW)).toBe(true);
    expect(
      subscriptionIsUsable(
        {
          status: 'trialing',
          trial_ends_at: '2026-07-01T00:00:00Z',
        },
        NOW,
      ),
    ).toBe(true);
  });

  it('rejects inactive, expired, and ended trial subscriptions', () => {
    expect(subscriptionIsUsable({ status: 'cancelled' }, NOW)).toBe(false);
    expect(
      subscriptionIsUsable(
        { status: 'active', current_period_end: '2026-06-29T00:00:00Z' },
        NOW,
      ),
    ).toBe(false);
    expect(
      subscriptionIsUsable(
        { status: 'trialing', trial_ends_at: '2026-06-29T00:00:00Z' },
        NOW,
      ),
    ).toBe(false);
  });

  it('allows access during grace period', () => {
    expect(
      subscriptionIsUsable(
        {
          status: 'active',
          current_period_end: '2026-06-20T00:00:00Z',
          grace_period_ends_at: '2026-07-01T00:00:00Z',
        },
        NOW,
      ),
    ).toBe(true);
  });

  it('selects Enterprise over Pro and Free', () => {
    const selected = selectBestSubscription(
      [
        { plan_id: 'free', status: 'active' },
        { plan_id: 'pro', status: 'active' },
        { plan_id: 'enterprise', status: 'active' },
      ],
      NOW,
    );
    expect(selected.plan_id).toBe('enterprise');
  });

  it('returns null when no subscription is usable', () => {
    expect(
      selectBestSubscription([{ plan_id: 'pro', status: 'expired' }], NOW),
    ).toBeNull();
  });
});

describe('usage periods', () => {
  it('calculates UTC month boundaries', () => {
    expect(currentMonthPeriod(new Date('2026-02-14T23:00:00Z'))).toEqual({
      start: '2026-02-01',
      end: '2026-02-28',
    });
    expect(currentMonthPeriod(new Date('2028-02-14T23:00:00Z')).end).toBe(
      '2028-02-29',
    );
  });

  it('calculates a UTC daily period', () => {
    expect(todayPeriod(new Date('2026-06-30T23:59:59Z'))).toEqual({
      start: '2026-06-30',
      end: '2026-06-30',
    });
  });
});
