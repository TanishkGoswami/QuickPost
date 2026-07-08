import express from 'express';
import { authenticateUser } from '../middleware/authenticateUser.js';
import { PLANS } from '../config/plans.js';
import { getEntitlements } from '../services/entitlements.js';
import supabase from '../services/supabase.js';

const router = express.Router();

router.get('/plans', (_req, res) => {
  res.json({
    success: true,
    plans: Object.values(PLANS),
  });
});

router.get('/entitlements', authenticateUser, async (req, res, next) => {
  try {
    const entitlements = await getEntitlements(req.user.authUserId || req.user.userId);
    res.json({ success: true, entitlements });
  } catch (error) {
    next(error);
  }
});

router.get('/invoices', authenticateUser, async (req, res, next) => {
  try {
    const ids = [req.user.authUserId, req.user.userId].filter(Boolean);
    let query = supabase
      .from('payments')
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
