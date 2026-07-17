import { describe, expect, it } from 'vitest';

import {
  SOCIALPILOT_WATERMARK,
  applyDeliveryBranding,
  getDeliveryPlan,
  stripBrandingWatermark,
} from '../supabase/functions/_shared/deliveryPolicy.ts';

const NOW = Date.parse('2026-06-30T12:00:00Z');

describe('Auto-DM delivery policy', () => {
  it('appends the exact SocialPilot watermark once for Free users', () => {
    const actions = applyDeliveryBranding(
      [{ type: 'text', text: 'Here is your guide' }],
      true,
    );
    expect(actions[0].text).toBe(`Here is your guide${SOCIALPILOT_WATERMARK}`);
    expect(String(actions[0].text).match(/@Getaipilot/g)).toHaveLength(1);
  });

  it('removes legacy or stored branding for paid users', () => {
    const oldQuickPost = 'Hello\n\n_⚡ Automated via QuickPost.co (Get it Free)_';
    const oldSocialPilot =
      'Hello\n\n_⚡ Automation is powered by @Getaipilot_';
    expect(stripBrandingWatermark(oldQuickPost)).toBe('Hello');
    expect(stripBrandingWatermark(oldSocialPilot)).toBe('Hello');
    expect(
      applyDeliveryBranding([{ type: 'text', text: oldSocialPilot }], false)[0].text,
    ).toBe('Hello');
  });

  it('adds a separate text action for image-only flows', () => {
    const actions = applyDeliveryBranding(
      [{ type: 'image', imageUrl: 'https://example.com/image.jpg' }],
      true,
    );
    expect(actions).toHaveLength(2);
    expect(actions[1]).toEqual({
      type: 'text',
      text: SOCIALPILOT_WATERMARK.trim(),
    });
  });

  it('brands only the first text action', () => {
    const actions = applyDeliveryBranding(
      [
        { type: 'text', text: 'First' },
        { type: 'text', text: 'Second' },
      ],
      true,
    );
    expect(actions[0].text).toContain('SocialPilot');
    expect(actions[1].text).toBe('Second');
  });

  it('defaults missing and invalid subscriptions to Free', () => {
    expect(getDeliveryPlan([], NOW)).toEqual({ id: 'free', replyLimit: 50 });
    expect(
      getDeliveryPlan([{ plan_id: 'enterprise', status: 'cancelled' }], NOW),
    ).toEqual({ id: 'free', replyLimit: 50 });
  });

  it('selects the highest usable paid subscription', () => {
    expect(
      getDeliveryPlan(
        [
          { plan_id: 'pro', status: 'active' },
          { plan_id: 'enterprise', status: 'active' },
        ],
        NOW,
      ),
    ).toEqual({ id: 'enterprise', replyLimit: 1_000_000 });
  });

  it('rejects expired periods and expired trials', () => {
    expect(
      getDeliveryPlan(
        [{
          plan_id: 'pro',
          status: 'active',
          current_period_end: '2026-06-29T00:00:00Z',
        }],
        NOW,
      ).id,
    ).toBe('free');
    expect(
      getDeliveryPlan(
        [{
          plan_id: 'pro',
          status: 'trialing',
          trial_ends_at: '2026-06-29T00:00:00Z',
        }],
        NOW,
      ).id,
    ).toBe('free');
  });

  it('honors an active grace period', () => {
    expect(
      getDeliveryPlan(
        [{
          plan_id: 'pro',
          status: 'active',
          current_period_end: '2026-06-20T00:00:00Z',
          grace_period_ends_at: '2026-07-02T00:00:00Z',
        }],
        NOW,
      ).id,
    ).toBe('pro');
  });
});
