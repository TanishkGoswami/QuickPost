import supabase from './supabase.js';
import { getPlan } from '../config/plans.js';
import {
  currentMonthPeriod,
  selectBestSubscription,
  todayPeriod,
} from '../config/entitlementPolicy.js';

export async function getEntitlements(userId) {
  const { data: subscriptions, error } = await supabase
    .from('app_subscriptions')
    .select('plan_id,source,status,billing_interval,current_period_start,current_period_end,trial_ends_at,cancel_at_period_end,grace_period_ends_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error && error.code !== '42P01') {
    throw new Error(`Failed to load subscription: ${error.message}`);
  }

  const subscription = selectBestSubscription(subscriptions);
  const plan = getPlan(subscription?.plan_id || 'free');

  const { data: usage, error: usageError } = await supabase
    .from('entitlement_usage')
    .select('metric,used,period_start,period_end')
    .eq('user_id', userId)
    .gte('period_end', new Date().toISOString().slice(0, 10));

  if (usageError && usageError.code !== '42P01') {
    throw new Error(`Failed to load usage: ${usageError.message}`);
  }

  return {
    plan: { id: plan.id, name: plan.name },
    subscription: subscription || {
      source: 'standalone',
      status: 'active',
      billing_interval: null,
      current_period_end: null,
      cancel_at_period_end: false,
    },
    features: plan.features,
    limits: plan.limits,
    usage: Object.fromEntries((usage || []).map((row) => [row.metric, row])),
  };
}

export async function consumeUsage(userId, metric, amount = 1, cadence = 'month') {
  const entitlements = await getEntitlements(userId);
  const limit = entitlements.limits[metric];
  if (!Number.isFinite(limit)) {
    throw new Error(`Unknown metered entitlement: ${metric}`);
  }

  const period = cadence === 'day' ? todayPeriod() : currentMonthPeriod();
  const { data, error } = await supabase.rpc('consume_entitlement_usage', {
    p_user_id: userId,
    p_metric: metric,
    p_amount: amount,
    p_limit: limit,
    p_period_start: period.start,
    p_period_end: period.end,
  });

  if (error) throw new Error(`Failed to reserve usage: ${error.message}`);
  const result = data?.[0] || { allowed: false, used: 0, limit_value: limit };
  return { ...result, entitlements };
}

export async function countUserResource(userId, table, filters = {}) {
  let query = supabase
    .from(table)
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);
  for (const [column, value] of Object.entries(filters)) {
    query = query.eq(column, value);
  }
  const { count, error } = await query;
  if (error) throw new Error(`Failed to count ${table}: ${error.message}`);
  return count || 0;
}
