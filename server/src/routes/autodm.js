import express from 'express';
import { authenticateUser } from '../middleware/authenticateUser.js';
import {
  getAutoDMStatus,
  importInstagramAccountToAutoDM,
  signAutoDMBridgeToken,
  fetchInstagramMediaForUser,
} from '../services/autodm.js';

const router = express.Router();

router.get('/bridge-token', authenticateUser, async (req, res) => {
  try {
    const token = signAutoDMBridgeToken(req.user);
    res.json({
      success: true,
      ...token,
    });
  } catch (error) {
    console.error('[AUTODM] Bridge token error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate bridge token',
    });
  }
});

router.get('/status', authenticateUser, async (req, res) => {
  try {
    const status = await getAutoDMStatus(req.user);
    res.json({
      success: true,
      ...status,
    });
  } catch (error) {
    console.error('[AUTODM] Status error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to load AutoDM status',
    });
  }
});

router.post('/import-instagram', authenticateUser, async (req, res) => {
  try {
    const account = await importInstagramAccountToAutoDM(req.user);
    res.json({
      success: true,
      account,
    });
  } catch (error) {
    console.error('[AUTODM] Import Instagram error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to import Instagram account',
    });
  }
});

router.get('/instagram-media', authenticateUser, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 30;
    const media = await fetchInstagramMediaForUser(req.user, limit);
    res.json({ success: true, media });
  } catch (error) {
    console.error('[AUTODM] Instagram media error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch Instagram media',
    });
  }
});

export default router;
