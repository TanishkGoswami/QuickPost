export const PLAN_IDS = Object.freeze({
  FREE: 'free',
  SLITE: 'slite',
  SGROWTH: 'sgrowth',
});

export const PLANS = Object.freeze({
  free: Object.freeze({
    id: 'free',
    name: 'Free',
    prices: Object.freeze({ month: 0, year: 0 }),
    features: Object.freeze({
      publishing: true,
      scheduling: true,
      analytics: true,
      autodm: true,
      approval_workflow: false,
      api: false,
      priority_support: false,
    }),
    limits: Object.freeze({
      social_accounts: 3,
      scheduled_queue: 10,
      team_members: 1,
      history_days: 7,
      autodm_accounts: 3,
      autodm_automations: 1,
      autodm_replies_per_month: 50,
      contacts: 100,
    }),
  }),
  slite: Object.freeze({
    id: 'slite',
    name: 'Starter',
    prices: Object.freeze({ month: 999, year: 9588 }),
    features: Object.freeze({
      publishing: true,
      scheduling: true,
      analytics: true,
      autodm: true,
      approval_workflow: false,
      api: false,
      priority_support: true,
    }),
    limits: Object.freeze({
      social_accounts: 10,
      scheduled_queue: 1000000,
      team_members: 1,
      history_days: 90,
      autodm_accounts: 10,
      autodm_automations: 1000000,
      autodm_replies_per_month: 1000000,
      contacts: 1000000,
    }),
  }),
  sgrowth: Object.freeze({
    id: 'sgrowth',
    name: 'Growth',
    prices: Object.freeze({ month: 2999, year: 29988 }),
    features: Object.freeze({
      publishing: true,
      scheduling: true,
      analytics: true,
      autodm: true,
      approval_workflow: true,
      api: true,
      priority_support: true,
    }),
    limits: Object.freeze({
      social_accounts: 30,
      scheduled_queue: 1000000,
      team_members: 10,
      history_days: 365,
      autodm_accounts: 30,
      autodm_automations: 1000000,
      autodm_replies_per_month: 1000000,
      contacts: 1000000,
    }),
  }),
});

export function getPlan(planId) {
  return PLANS[String(planId || '').toLowerCase()] || PLANS.free;
}
