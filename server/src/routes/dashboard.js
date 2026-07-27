import express from 'express';
import { authenticateUser } from '../middleware/authenticateUser.js';
import { getDashboardOverview } from '../services/dashboardOverview.js';

const router = express.Router();

router.get('/dashboard/overview', authenticateUser, async (req, res) => {
  try {
    const overview = await getDashboardOverview(req.user, req.query);
    res.json(overview);
  } catch (error) {
    console.error('[DASHBOARD] Overview error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to load dashboard overview',
    });
  }
});

export default router;
