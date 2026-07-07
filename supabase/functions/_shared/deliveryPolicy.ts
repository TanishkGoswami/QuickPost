export type DeliveryPlanId = 'free' | 'pro' | 'enterprise';

export type BrandableAction = { type: string; text?: string };

export const SOCIALPILOT_WATERMARK =
  '\n\n_⚡ This automation is from SocialPilot (social.getaipilot.in)_';

export const STORED_BRANDING_PATTERN =
  /\n*\s*_(?:⚡\s*)?(?:This automation is from SocialPilot \(social\.getaipilot\.in\)|Automated via QuickPost\.co \(Get it Free\))_\s*$/i;

export const stripBrandingWatermark = (text: string) =>
  String(text || '').replace(STORED_BRANDING_PATTERN, '').trimEnd();

export const applyDeliveryBranding = <T extends BrandableAction>(
  actions: T[],
  isFreePlan: boolean
): T[] => {
  const cleaned = actions.map((action) =>
    action.type === 'text'
      ? { ...action, text: stripBrandingWatermark(action.text || '') }
      : action
  ) as T[];

  if (!isFreePlan) return cleaned;

  const firstTextIndex = cleaned.findIndex((action) => action.type === 'text');
  if (firstTextIndex === -1) {
    return [
      ...cleaned,
      { type: 'text', text: SOCIALPILOT_WATERMARK.trim() } as T,
    ];
  }

  return cleaned.map((action, index) =>
    index === firstTextIndex && action.type === 'text'
      ? { ...action, text: `${action.text || ''}${SOCIALPILOT_WATERMARK}` }
      : action
  ) as T[];
};

export const getDeliveryPlan = (
  subscriptions: Array<{
    plan_id?: string | null;
    status?: string | null;
    current_period_end?: string | null;
    trial_ends_at?: string | null;
    grace_period_ends_at?: string | null;
  }>,
  now = Date.now()
): { id: DeliveryPlanId; replyLimit: number } => {
  const rank: Record<string, number> = { free: 0, pro: 1, enterprise: 2 };
  const usable = subscriptions
    .filter((subscription) => {
      if (!['active', 'trialing'].includes(String(subscription.status))) return false;
      if (
        subscription.grace_period_ends_at &&
        Date.parse(subscription.grace_period_ends_at) >= now
      ) return true;
      if (
        subscription.current_period_end &&
        Date.parse(subscription.current_period_end) < now
      ) return false;
      if (
        subscription.status === 'trialing' &&
        subscription.trial_ends_at &&
        Date.parse(subscription.trial_ends_at) < now
      ) return false;
      return true;
    })
    .sort((a, b) => (rank[String(b.plan_id)] ?? 0) - (rank[String(a.plan_id)] ?? 0))[0];

  const id: DeliveryPlanId =
    usable?.plan_id === 'pro' || usable?.plan_id === 'enterprise'
      ? usable.plan_id
      : 'free';
  return { id, replyLimit: id === 'free' ? 50 : 1_000_000 };
};
