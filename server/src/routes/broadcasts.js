import express from 'express';
import { authenticateUser } from '../middleware/authenticateUser.js';
import {
  getBroadcasts,
  cancelBroadcast,
  updateScheduledBroadcast,
  retryFailedBroadcast,
  getScheduledBroadcasts,
  getScheduledStats,
} from '../services/broadcasts.js';

const router = express.Router();

/**
 * @route   GET /api/broadcasts
 * @desc    Get user's broadcast history (optionally filter by status)
 * @access  Protected
 * @query   status - optional: 'sent' | 'scheduled' | 'failed' | 'cancelled' | 'processing'
 */
router.get('/broadcasts', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status } = req.query;

    const broadcasts = await getBroadcasts(userId, status || null);

    res.json({
      success: true,
      broadcasts,
      count: broadcasts.length,
    });
  } catch (error) {
    console.error('Get broadcasts error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch broadcast history' });
  }
});

/**
 * @route   GET /api/broadcasts/queue
 * @desc    Get all scheduled/processing/failed/cancelled posts for the queue page
 * @access  Protected
 */
router.get('/broadcasts/queue', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.userId;
    const [broadcasts, stats] = await Promise.all([
      getScheduledBroadcasts(userId),
      getScheduledStats(userId),
    ]);
    res.json({ success: true, broadcasts, stats });
  } catch (error) {
    console.error('Get queue error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch queue' });
  }
});

/**
 * @route   GET /api/broadcasts/stats
 * @desc    Get queue stats (pending count) for dashboard badge
 * @access  Protected
 */
router.get('/broadcasts/stats', authenticateUser, async (req, res) => {
  try {
    const stats = await getScheduledStats(req.user.userId);
    res.json({ success: true, ...stats });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
});

/**
 * @route   PATCH /api/broadcasts/:id
 * @desc    Edit a scheduled broadcast (caption, time, timezone, channels)
 * @access  Protected
 * @body    { caption?, scheduledFor?, userTimezone?, selectedChannels? }
 */
router.patch('/broadcasts/:id', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { caption, scheduledFor, userTimezone, selectedChannels } = req.body;

    if (!caption && !scheduledFor && !userTimezone && !selectedChannels) {
      return res.status(400).json({ success: false, error: 'No fields to update provided.' });
    }

    const updated = await updateScheduledBroadcast(id, userId, {
      caption,
      scheduledFor,
      userTimezone,
      selectedChannels,
    });

    res.json({ success: true, broadcast: updated });
  } catch (error) {
    const isClientError = error.message?.includes('Cannot edit') || error.message?.includes('future');
    res.status(isClientError ? 400 : 500).json({
      success: false,
      error: error.message || 'Failed to update broadcast',
    });
  }
});

/**
 * @route   POST /api/broadcasts/:id/cancel
 * @desc    Cancel a scheduled or failed broadcast
 * @access  Protected
 */
router.post('/broadcasts/:id/cancel', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const cancelled = await cancelBroadcast(id, req.user.userId);
    res.json({ success: true, broadcast: cancelled });
  } catch (error) {
    const isClientError = error.message?.includes('Cannot cancel') || error.message?.includes('not found');
    res.status(isClientError ? 400 : 500).json({
      success: false,
      error: error.message || 'Failed to cancel broadcast',
    });
  }
});

/**
 * @route   POST /api/broadcasts/:id/retry
 * @desc    Manually retry a failed broadcast
 * @access  Protected
 */
router.post('/broadcasts/:id/retry', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const retried = await retryFailedBroadcast(id, req.user.userId);
    res.json({ success: true, broadcast: retried, message: 'Post queued for retry. It will publish within 30 seconds.' });
  } catch (error) {
    const isClientError = error.message?.includes('Cannot retry') || error.message?.includes('not found');
    res.status(isClientError ? 400 : 500).json({
      success: false,
      error: error.message || 'Failed to retry broadcast',
    });
  }
});

export default router;
