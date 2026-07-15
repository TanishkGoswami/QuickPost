import dotenv from 'dotenv';
dotenv.config();

/**
 * Fetches and validates Social pricing plans from GetAiPilot (Hub) pricing catalog.
 * Enforces fail-closed validation rules.
 *
 * @returns {Promise<Array<{plan_name: string, amount: number, currency: string, duration: string, plan_label: string}>>}
 */
export async function getSocialPricing() {
  const hubUrl = process.env.HUB_SUPABASE_URL;
  const hubAnonKey = process.env.HUB_SUPABASE_ANON_KEY;

  if (!hubUrl || !hubAnonKey) {
    throw new Error('Pricing service misconfiguration: HUB_SUPABASE_URL or HUB_SUPABASE_ANON_KEY is missing');
  }

  const url = `${hubUrl.replace(/\/$/, '')}/functions/v1/get-pricing?category=social&currency=INR`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'apikey': hubAnonKey,
      'Authorization': `Bearer ${hubAnonKey}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Authoritative pricing fetch failed: API returned status ${response.status}`);
  }

  const data = await response.json();
  if (!data || typeof data !== 'object') {
    throw new Error('Authoritative pricing response is invalid (not an object)');
  }

  if (data.currency !== 'INR') {
    throw new Error(`Authoritative pricing response contains unsupported currency: ${data.currency}`);
  }

  const plans = data.plans;
  if (!Array.isArray(plans)) {
    throw new Error('Authoritative pricing plans is not an array');
  }

  const validatedPlans = [];
  const seenPlanNames = new Set();

  for (const plan of plans) {
    if (!plan || typeof plan !== 'object') {
      throw new Error('Authoritative pricing plan entry is invalid (not an object)');
    }

    const { plan_name, amount, currency, duration, plan_label, is_active, category } = plan;

    if (!plan_name) {
      throw new Error('Authoritative pricing plan entry is missing plan_name');
    }

    // Ignore unrelated categories (e.g. crm, telegram) to prevent their validation rules from blocking social checkouts
    if (category !== 'social') {
      continue;
    }

    if (seenPlanNames.has(plan_name)) {
      throw new Error(`Authoritative pricing contains duplicate plan_name: ${plan_name}`);
    }
    seenPlanNames.add(plan_name);

    if (typeof amount !== 'number' || amount <= 0) {
      throw new Error(`Authoritative pricing plan ${plan_name} has invalid amount: ${amount}`);
    }

    if (currency !== 'INR') {
      throw new Error(`Authoritative pricing plan ${plan_name} has invalid currency: ${currency}`);
    }

    if (is_active !== true) {
      // Skip inactive plans if unexpectedly returned
      continue;
    }

    validatedPlans.push({
      plan_name,
      amount,
      currency,
      duration,
      plan_label: plan_label || plan_name
    });
  }

  return validatedPlans;
}