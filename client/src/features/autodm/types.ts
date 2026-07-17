export const PLAN_LIMITS = {
  free: {
    max_automations: 2,
    max_dms_per_day: 50,
    max_instagram_accounts: 1,
    has_analytics: false,
    has_crm: false,
    has_forms: false,
    has_priority_support: false,
  },
  pro: {
    max_automations: 50,
    max_dms_per_day: 1000,
    max_instagram_accounts: 5,
    has_analytics: true,
    has_crm: true,
    has_forms: true,
    has_priority_support: true,
  },
  enterprise: {
    max_automations: -1,
    max_dms_per_day: -1,
    max_instagram_accounts: -1,
    has_analytics: true,
    has_crm: true,
    has_forms: true,
    has_priority_support: true,
  },
};
