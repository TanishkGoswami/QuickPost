import express from 'express';
import { authenticateUser } from '../middleware/authenticateUser.js';
import { PLANS } from '../config/plans.js';
import { getEntitlements } from '../services/entitlements.js';

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

export default router;
