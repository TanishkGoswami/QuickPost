import express from 'express';
import { authenticateUser } from '../middleware/authenticateUser.js';
import {
  addKnowledgeSource,
  createBot,
  disconnectAccount,
  getAnalytics,
  getConversation,
  importConnectedInstagram,
  listAccounts,
  listBots,
  listConversations,
  listKnowledge,
  manualReply,
  processInstagramWebhook,
  testReply,
  updateBot,
  updateConversation,
  verifyMetaSignature,
} from '../services/instapilot.js';

const router = express.Router();

const asyncHandler = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (error) {
    console.error('[INSTAPILOT]', error);
    res.status(error.status || 500).json({
      success: false,
      error: error.message || 'InstaPilot request failed',
    });
  }
};

router.get('/accounts', authenticateUser, asyncHandler(async (req, res) => {
  const accounts = await listAccounts(req.user.userId);
  res.json({ success: true, accounts });
}));

router.post('/accounts/import-social-instagram', authenticateUser, asyncHandler(async (req, res) => {
  const account = await importConnectedInstagram(req.user);
  res.status(201).json({ success: true, account });
}));

router.delete('/accounts/:id', authenticateUser, asyncHandler(async (req, res) => {
  await disconnectAccount(req.user.userId, req.params.id);
  res.json({ success: true });
}));

router.get('/bots', authenticateUser, asyncHandler(async (req, res) => {
  const bots = await listBots(req.user.userId);
  res.json({ success: true, bots });
}));

router.post('/bots', authenticateUser, asyncHandler(async (req, res) => {
  const bot = await createBot(req.user.userId, req.body || {});
  res.status(201).json({ success: true, bot });
}));

router.patch('/bots/:id', authenticateUser, asyncHandler(async (req, res) => {
  const bot = await updateBot(req.user.userId, req.params.id, req.body || {});
  res.json({ success: true, bot });
}));

router.get('/bots/:id/knowledge', authenticateUser, asyncHandler(async (req, res) => {
  const sources = await listKnowledge(req.user.userId, req.params.id);
  res.json({ success: true, sources });
}));

router.post('/knowledge', authenticateUser, asyncHandler(async (req, res) => {
  const source = await addKnowledgeSource(req.user.userId, req.body || {});
  res.status(201).json({ success: true, source });
}));

router.post('/bots/:id/test-reply', authenticateUser, asyncHandler(async (req, res) => {
  const reply = await testReply(req.user.userId, req.params.id, req.body?.message || '');
  res.json({ success: true, reply });
}));

router.get('/inbox/conversations', authenticateUser, asyncHandler(async (req, res) => {
  const conversations = await listConversations(req.user.userId);
  res.json({ success: true, conversations });
}));

router.get('/inbox/conversations/:id', authenticateUser, asyncHandler(async (req, res) => {
  const thread = await getConversation(req.user.userId, req.params.id);
  res.json({ success: true, ...thread });
}));

router.patch('/inbox/conversations/:id', authenticateUser, asyncHandler(async (req, res) => {
  const conversation = await updateConversation(req.user.userId, req.params.id, req.body || {});
  res.json({ success: true, conversation });
}));

router.post('/inbox/conversations/:id/reply', authenticateUser, asyncHandler(async (req, res) => {
  const message = await manualReply(req.user.userId, req.params.id, req.body?.message || '');
  res.status(201).json({ success: true, message });
}));

router.get('/analytics', authenticateUser, asyncHandler(async (req, res) => {
  const analytics = await getAnalytics(req.user.userId);
  res.json({ success: true, analytics });
}));

router.get('/webhooks/instagram', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  const expected = process.env.INSTAPILOT_WEBHOOK_VERIFY_TOKEN;

  if (mode === 'subscribe' && token && expected && token === expected) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

router.post('/webhooks/instagram', asyncHandler(async (req, res) => {
  const signature = req.headers['x-hub-signature-256'];
  if (!verifyMetaSignature(req.rawBody, signature)) {
    return res.status(401).json({ success: false, error: 'Invalid Meta webhook signature' });
  }

  const events = await processInstagramWebhook(req.body || {});
  res.json({ success: true, events });
}));

export default router;
