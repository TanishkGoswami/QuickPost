import express from 'express';
import { authenticateUser } from '../middleware/authenticateUser.js';
import { getBroadcasts } from '../services/broadcasts.js';

const router = express.Router();

/**
 * @route   GET /api/broadcasts
 * @desc    Get user's broadcast history
 * @access  Protected
 */
router.get('/broadcasts', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status } = req.query; // Optional: filter by status (sent, draft, scheduled)

    const broadcasts = await getBroadcasts(userId, status);

    res.json({
      success: true,
      broadcasts: broadcasts,
      count: broadcasts.length
    });
  } catch (error) {
    console.error('Get broadcasts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch broadcast history'
    });
  }
});

export default router;
