import { describe, expect, it } from 'vitest';

import { PLAN_IDS, PLANS, getPlan } from '../server/src/config/plans.js';

describe('canonical QuickPost plans', () => {
  it('falls back safely to Free for missing or unknown plans', () => {
    expect(getPlan()).toBe(PLANS.free);
    expect(getPlan('not-a-plan')).toBe(PLANS.free);
    expect(getPlan('FREE')).toBe(PLANS.free);
  });

  it('matches the documented prices', () => {
    expect(PLANS.free.prices).toEqual({ month: 0, year: 0 });
    expect(PLANS.slite.prices).toEqual({ month: 999, year: 9588 });
    expect(PLANS.sgrowth.prices).toEqual({ month: 1999, year: 19188 });
  });

  it('matches account, automation, reply, contact, team, and history limits', () => {
    expect(PLANS.free.limits).toMatchObject({
      social_accounts: 3,
      scheduled_queue: 10,
      team_members: 1,
      history_days: 7,
      autodm_accounts: 3,
      autodm_automations: 1,
      autodm_replies_per_month: 50,
      contacts: 100,
    });
    expect(PLANS.slite.limits).toMatchObject({
      social_accounts: 10,
      team_members: 1,
      history_days: 90,
      autodm_accounts: 10,
    });
    expect(PLANS.sgrowth.limits).toMatchObject({
      social_accounts: 30,
      team_members: 10,
      history_days: 365,
      autodm_accounts: 30,
    });
  });

  it('gates advanced features by tier', () => {
    expect(PLANS.free.features).toMatchObject({
      publishing: true,
      scheduling: true,
      analytics: true,
      autodm: true,
      approval_workflow: false,
      api: false,
      priority_support: false,
    });
    expect(PLANS.slite.features.priority_support).toBe(true);
    expect(PLANS.slite.features.api).toBe(false);
    expect(PLANS.sgrowth.features.approval_workflow).toBe(true);
    expect(PLANS.sgrowth.features.api).toBe(true);
  });

  it('keeps plan objects immutable', () => {
    expect(PLAN_IDS).toEqual({
      FREE: 'free',
      SLITE: 'slite',
      SGROWTH: 'sgrowth',
    });
    expect(Object.isFrozen(PLANS)).toBe(true);
    expect(Object.isFrozen(PLANS.free.limits)).toBe(true);
  });
});
