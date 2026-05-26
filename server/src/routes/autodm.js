import express from 'express';
import { authenticateUser } from '../middleware/authenticateUser.js';
import {
  getAutoDMStatus,
  importInstagramAccountToAutoDM,
  startAutoDMInstagramOAuth,
  signAutoDMBridgeToken,
  fetchInstagramMediaForUser,
  listAutomationsForUser,
  getAutomationForUser,
  createAutomationForUser,
  updateAutomationForUser,
  deleteAutomationForUser,
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

router.post('/oauth-start', authenticateUser, async (req, res) => {
  try {
    const redirectTo = await startAutoDMInstagramOAuth(req.user, req.body?.frontendUrl);
    res.json({
      success: true,
      redirectTo,
    });
  } catch (error) {
    console.error('[AUTODM] OAuth start error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to start AutoDM Instagram login',
    });
  }
});

router.get('/automations', authenticateUser, async (req, res) => {
  try {
    const automations = await listAutomationsForUser(req.user, {
      instagramAccountId: req.query.instagramAccountId,
    });
    res.json({ success: true, automations });
  } catch (error) {
    console.error('[AUTODM] List automations error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to load Auto DM automations',
    });
  }
});

router.get('/automations/:id', authenticateUser, async (req, res) => {
  try {
    const automation = await getAutomationForUser(req.user, req.params.id);
    res.json({ success: true, automation });
  } catch (error) {
    console.error('[AUTODM] Get automation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to load Auto DM automation',
    });
  }
});

router.post('/automations', authenticateUser, async (req, res) => {
  try {
    const automation = await createAutomationForUser(req.user, req.body || {});
    res.status(201).json({ success: true, automation });
  } catch (error) {
    console.error('[AUTODM] Create automation error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to create Auto DM automation',
    });
  }
});

router.patch('/automations/:id', authenticateUser, async (req, res) => {
  try {
    const automation = await updateAutomationForUser(req.user, req.params.id, req.body || {});
    res.json({ success: true, automation });
  } catch (error) {
    console.error('[AUTODM] Update automation error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to update Auto DM automation',
    });
  }
});

router.delete('/automations/:id', authenticateUser, async (req, res) => {
  try {
    await deleteAutomationForUser(req.user, req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('[AUTODM] Delete automation error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to delete Auto DM automation',
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
