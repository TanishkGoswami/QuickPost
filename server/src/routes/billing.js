import express from 'express';
import { authenticateUser } from '../middleware/authenticateUser.js';
import { PLANS } from '../config/plans.js';
import { getEntitlements } from '../services/entitlements.js';
import supabase from '../services/supabase.js';

const router = express.Router();

import { getSocialPricing } from '../services/pricing.js';

router.get('/plans', async (_req, res) => {
  try {
    const socialPricing = await getSocialPricing();
    const starterPlan = socialPricing.find(p => p.plan_name === 'social_pilot_starter');
    const growthPlan = socialPricing.find(p => p.plan_name === 'social_pilot_growth');

    const freePlan = JSON.parse(JSON.stringify(PLANS.free));
    const slitePlan = JSON.parse(JSON.stringify(PLANS.slite));
    const sgrowthPlan = JSON.parse(JSON.stringify(PLANS.sgrowth));

    if (starterPlan) {
      const base = starterPlan.amount;
      slitePlan.prices = {
        month: base / 100,
        quarterly: Math.round(base * 3 * 0.90) / 100 / 3,
        six_months: Math.round(base * 6 * 0.80) / 100 / 6,
        year: Math.round(base * 12 * 0.70) / 100 / 12
      };
    } else {
      slitePlan.prices = { month: null, quarterly: null, six_months: null, year: null };
    }

    if (growthPlan) {
      const base = growthPlan.amount;
      sgrowthPlan.prices = {
        month: base / 100,
        quarterly: Math.round(base * 3 * 0.90) / 100 / 3,
        six_months: Math.round(base * 6 * 0.80) / 100 / 6,
        year: Math.round(base * 12 * 0.70) / 100 / 12
      };
    } else {
      sgrowthPlan.prices = { month: null, quarterly: null, six_months: null, year: null };
    }

    res.json({
      success: true,
      plans: [freePlan, slitePlan, sgrowthPlan],
    });
  } catch (error) {
    console.error('Failed to load dynamic pricing, failing closed:', error.message);
    const freePlan = JSON.parse(JSON.stringify(PLANS.free));
    const slitePlan = JSON.parse(JSON.stringify(PLANS.slite));
    const sgrowthPlan = JSON.parse(JSON.stringify(PLANS.sgrowth));

    slitePlan.prices = { month: null, quarterly: null, six_months: null, year: null };
    sgrowthPlan.prices = { month: null, quarterly: null, six_months: null, year: null };

    res.json({
      success: true,
      plans: [freePlan, slitePlan, sgrowthPlan],
    });
  }
});

router.get('/entitlements', authenticateUser, async (req, res, next) => {
  try {
    const entitlements = await getEntitlements(req.user.authUserId || req.user.userId, req.user.email, req.token);
    res.json({ success: true, entitlements });
  } catch (error) {
    next(error);
  }
});

router.get('/invoices', authenticateUser, async (req, res, next) => {
  try {
    const ids = [req.user.authUserId, req.user.userId].filter(Boolean);
    let query = supabase
      .from('social_payments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(24);

    query = ids.length > 1
      ? query.or(ids.map((id) => `user_id.eq.${id}`).join(','))
      : query.eq('user_id', ids[0]);

    const { data, error } = await query;
    if (error?.code === '42P01') {
      return res.json({ success: true, invoices: [] });
    }
    if (error) throw new Error(`Failed to load invoices: ${error.message}`);

    const invoices = (data || []).map((row) => ({
      id: row.id || row.razorpay_payment_link_id,
      plan: row.plan || row.plan_id || 'QuickPost',
      amount: row.amount || row.amount_paid || 0,
      status: row.status || 'pending',
      createdAt: row.created_at || row.updated_at,
      paymentId: row.razorpay_payment_link_id || row.provider_payment_id || row.payment_id,
      downloadUrl: row.invoice_url || row.invoice_pdf || row.receipt_url || row.receipt_url_short || row.payment_link || row.short_url || null,
    }));

    res.json({ success: true, invoices });
  } catch (error) {
    next(error);
  }
});

export default router;
