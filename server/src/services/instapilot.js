import crypto from 'crypto';
import axios from 'axios';
import supabase from './supabase.js';

const GRAPH_VERSION = process.env.META_GRAPH_VERSION || 'v21.0';
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;
const DEFAULT_REPLY =
  'I am not fully sure about that. Our team will help you shortly.';

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function getEncryptionKey() {
  const raw = requiredEnv('INSTAPILOT_TOKEN_ENCRYPTION_KEY_BASE64');
  const key = Buffer.from(raw, 'base64');
  if (key.length !== 32) {
    throw new Error('INSTAPILOT_TOKEN_ENCRYPTION_KEY_BASE64 must decode to 32 bytes');
  }
  return key;
}

export function encryptToken(value) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(value), 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `enc:v1:${iv.toString('base64')}:${Buffer.concat([encrypted, tag]).toString('base64')}`;
}

export function decryptToken(payload) {
  if (!payload?.startsWith('enc:v1:')) throw new Error('Unsupported encrypted token format');
  const [, , ivB64, dataB64] = payload.split(':');
  const data = Buffer.from(dataB64, 'base64');
  const encrypted = data.subarray(0, -16);
  const tag = data.subarray(-16);
  const decipher = crypto.createDecipheriv('aes-256-gcm', getEncryptionKey(), Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
  return JSON.parse(decrypted);
}

export function verifyMetaSignature(rawBody, signature) {
  const appSecret = process.env.INSTAGRAM_APP_SECRET || process.env.META_APP_SECRET;
  if (!appSecret) return false;
  if (!rawBody || !signature?.startsWith('sha256=')) return false;
  const expected = `sha256=${crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex')}`;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export async function listAccounts(userId) {
  const { data, error } = await supabase
    .from('instagram_accounts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(({ access_token_encrypted, ...account }) => account);
}

export async function importConnectedInstagram(user) {
  const { data: socialToken, error } = await supabase
    .from('social_tokens')
    .select('access_token, token_expiry, instagram_business_id, page_id, username, profile_data')
    .eq('user_id', user.userId)
    .eq('provider', 'instagram')
    .maybeSingle();

  if (error) throw error;
  if (!socialToken?.access_token || !socialToken?.instagram_business_id || !socialToken?.page_id) {
    throw new Error('Connect an Instagram Professional account through Meta OAuth first.');
  }

  const permissions = await fetchTokenPermissions(socialToken.access_token).catch(() => []);
  const profile = socialToken.profile_data || {};
  const liveProfile = await fetchInstagramProfile({
    accessToken: socialToken.access_token,
    instagramBusinessId: socialToken.instagram_business_id,
  }).catch(() => null);
  const profilePictureUrl =
    liveProfile?.profile_picture_url ||
    liveProfile?.profilePicture ||
    profile.profile_picture_url ||
    profile.profilePicture ||
    profile.picture?.data?.url ||
    profile.picture ||
    null;
  const accountPayload = {
    user_id: user.userId,
    page_id: socialToken.page_id,
    page_name: profile.page_name || liveProfile?.name || profile.name || null,
    instagram_business_account_id: socialToken.instagram_business_id,
    instagram_username: liveProfile?.username || socialToken.username || profile.username || null,
    profile_picture_url: profilePictureUrl,
    access_token_encrypted: encryptToken({ pageAccessToken: socialToken.access_token }),
    token_expires_at: socialToken.token_expiry || null,
    permissions,
    webhook_status: 'configure_in_meta',
    token_status: 'active',
    is_connected: true,
    updated_at: new Date().toISOString(),
  };

  const { data, error: upsertError } = await supabase
    .from('instagram_accounts')
    .upsert(accountPayload, { onConflict: 'user_id,instagram_business_account_id' })
    .select('*')
    .single();
  if (upsertError) throw upsertError;
  const { access_token_encrypted, ...safe } = data;
  return safe;
}

async function fetchTokenPermissions(accessToken) {
  const { data } = await axios.get(`${GRAPH_BASE}/me/permissions`, {
    params: { access_token: accessToken },
  });
  return data?.data || [];
}

async function fetchInstagramProfile({ accessToken, instagramBusinessId }) {
  const { data } = await axios.get(`${GRAPH_BASE}/${instagramBusinessId}`, {
    params: {
      access_token: accessToken,
      fields: 'id,username,name,profile_picture_url',
    },
  });
  return data || null;
}

async function getOwnedAccount(userId, accountId) {
  const { data, error } = await supabase
    .from('instagram_accounts')
    .select('*')
    .eq('id', accountId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Instagram account not found');
  return data;
}

async function getPageTokenForAccount(account) {
  return decryptToken(account.access_token_encrypted).pageAccessToken;
}

export async function disconnectAccount(userId, accountId) {
  const account = await getOwnedAccount(userId, accountId);
  const { error } = await supabase
    .from('instagram_accounts')
    .update({ is_connected: false, token_status: 'disconnected' })
    .eq('id', account.id)
    .eq('user_id', userId);
  if (error) throw error;
  await audit(userId, 'disconnect', 'instagram_account', account.id);
  return true;
}

export async function subscribeAccountToWebhooks(userId, accountId) {
  const account = await getOwnedAccount(userId, accountId);
  const accessToken = await getPageTokenForAccount(account);
  const subscribedFields = process.env.INSTAPILOT_SUBSCRIBED_FIELDS || 'messages,messaging_postbacks';

  const { data } = await axios.post(
    `${GRAPH_BASE}/${account.page_id}/subscribed_apps`,
    null,
    {
      params: {
        access_token: accessToken,
        subscribed_fields: subscribedFields,
      },
    }
  );

  await supabase
    .from('instagram_accounts')
    .update({
      webhook_status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('id', account.id)
    .eq('user_id', userId);

  await audit(userId, 'subscribe_webhooks', 'instagram_account', account.id, {
    subscribed_fields: subscribedFields,
    response: data,
  });

  return data;
}

export async function listBots(userId) {
  const { data, error } = await supabase
    .from('instagram_bots')
    .select('*, instagram_accounts(instagram_username, page_name, page_id, instagram_business_account_id)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

function cleanBotPayload(payload, userId) {
  return {
    user_id: userId,
    instagram_account_id: payload.instagram_account_id,
    bot_name: payload.bot_name?.trim(),
    business_name: payload.business_name?.trim(),
    tone: payload.tone || 'friendly',
    language: payload.language || 'auto-detect',
    bot_goal: payload.bot_goal || 'support',
    fallback_message: payload.fallback_message || DEFAULT_REPLY,
    welcome_message:
      payload.welcome_message || 'Hi! Welcome to {{business_name}}. How can I help you today?',
    quick_replies: payload.quick_replies || ['Pricing', 'Services', 'Book a Call', 'Talk to Human'],
    handoff_keywords: payload.handoff_keywords || ['human', 'agent', 'call me', 'support'],
    lead_fields: payload.lead_fields || ['name', 'phone', 'email', 'requirement'],
    business_hours: payload.business_hours || {},
    is_active: Boolean(payload.is_active),
    human_handoff_enabled: payload.human_handoff_enabled !== false,
    confidence_threshold: Number(payload.confidence_threshold || 0.68),
    daily_reply_limit: Number(payload.daily_reply_limit || 250),
  };
}

export async function createBot(userId, payload) {
  if (!payload?.instagram_account_id || !payload?.bot_name || !payload?.business_name) {
    throw new Error('Instagram account, bot name, and business name are required.');
  }
  await getOwnedAccount(userId, payload.instagram_account_id);
  const { data: existingBot, error: existingError } = await supabase
    .from('instagram_bots')
    .select('id, bot_name')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existingBot?.id) {
    const err = new Error('Only one InstaPilot bot is allowed. Please edit the existing bot instead.');
    err.status = 409;
    throw err;
  }
  if (payload.is_active) {
    await deactivateOtherBots(userId, payload.instagram_account_id);
  }
  const { data, error } = await supabase
    .from('instagram_bots')
    .insert(cleanBotPayload(payload, userId))
    .select('*')
    .single();
  if (error) throw error;
  await audit(userId, 'create', 'instagram_bot', data.id);
  return data;
}

export async function updateBot(userId, botId, payload) {
  const existing = await getOwnedBot(userId, botId);
  const targetAccountId = payload.instagram_account_id || existing.instagram_account_id;
  const mergedPayload = { ...existing, ...payload, instagram_account_id: targetAccountId };
  await getOwnedAccount(userId, targetAccountId);
  if (mergedPayload.is_active) {
    await deactivateOtherBots(userId, targetAccountId, botId);
  }
  const { user_id, id, created_at, updated_at, ...clean } = cleanBotPayload(mergedPayload, userId);
  const { data, error } = await supabase
    .from('instagram_bots')
    .update({ ...clean, updated_at: new Date().toISOString() })
    .eq('id', botId)
    .eq('user_id', userId)
    .select('*')
    .single();
  if (error) throw error;
  await audit(userId, 'update', 'instagram_bot', botId);
  return data;
}

export async function deleteBot(userId, botId) {
  await getOwnedBot(userId, botId);
  const { error } = await supabase
    .from('instagram_bots')
    .delete()
    .eq('id', botId)
    .eq('user_id', userId);
  if (error) throw error;
  await audit(userId, 'delete', 'instagram_bot', botId);
  return true;
}

async function deactivateOtherBots(userId, instagramAccountId, exceptBotId = null) {
  let query = supabase
    .from('instagram_bots')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('instagram_account_id', instagramAccountId)
    .eq('is_active', true);
  if (exceptBotId) query = query.neq('id', exceptBotId);
  const { error } = await query;
  if (error) throw error;
}

export async function addKnowledgeSource(userId, payload) {
  const bot = await getOwnedBot(userId, payload.bot_id);
  const sourcePayload = {
    user_id: userId,
    bot_id: bot.id,
    source_type: payload.source_type || 'manual',
    title: payload.title || 'Knowledge source',
    original_file_url: payload.url || null,
    status: 'processing',
  };
  const { data: source, error } = await supabase
    .from('knowledge_sources')
    .insert(sourcePayload)
    .select('*')
    .single();
  if (error) throw error;

  try {
    const text = await resolveKnowledgeText(payload);
    const chunks = chunkText(text).map((chunk, index) => ({
      source_id: source.id,
      bot_id: bot.id,
      chunk_text: chunk,
      metadata: { index, source_type: sourcePayload.source_type },
    }));
    if (chunks.length) {
      const embeddings = await embedChunks(chunks.map((c) => c.chunk_text)).catch(() => null);
      const rows = chunks.map((chunk, index) => ({
        ...chunk,
        embedding: embeddings?.[index] || null,
      }));
      const { error: chunkError } = await supabase.from('knowledge_chunks').insert(rows);
      if (chunkError) throw chunkError;
    }
    await supabase.from('knowledge_sources').update({ status: 'ready' }).eq('id', source.id);
    return { ...source, status: 'ready', chunks: chunks.length };
  } catch (err) {
    await supabase
      .from('knowledge_sources')
      .update({ status: 'failed', error_message: err.message })
      .eq('id', source.id);
    throw err;
  }
}

export async function updateKnowledgeSource(userId, sourceId, payload) {
  const source = await getOwnedKnowledgeSource(userId, sourceId);
  await getOwnedBot(userId, source.bot_id);

  await supabase
    .from('knowledge_sources')
    .update({
      source_type: payload.source_type || source.source_type,
      title: payload.title || source.title,
      original_file_url: payload.url || source.original_file_url || null,
      status: 'processing',
      error_message: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', source.id)
    .eq('user_id', userId);

  try {
    await supabase.from('knowledge_chunks').delete().eq('source_id', source.id);
    const text = await resolveKnowledgeText(payload);
    const chunks = chunkText(text).map((chunk, index) => ({
      source_id: source.id,
      bot_id: source.bot_id,
      chunk_text: chunk,
      metadata: { index, source_type: payload.source_type || source.source_type },
    }));
    if (chunks.length) {
      const embeddings = await embedChunks(chunks.map((c) => c.chunk_text)).catch(() => null);
      const rows = chunks.map((chunk, index) => ({
        ...chunk,
        embedding: embeddings?.[index] || null,
      }));
      const { error: chunkError } = await supabase.from('knowledge_chunks').insert(rows);
      if (chunkError) throw chunkError;
    }
    const { data, error } = await supabase
      .from('knowledge_sources')
      .update({ status: 'ready', updated_at: new Date().toISOString() })
      .eq('id', source.id)
      .eq('user_id', userId)
      .select('*, knowledge_chunks(id,chunk_text)')
      .single();
    if (error) throw error;
    await audit(userId, 'update', 'knowledge_source', source.id);
    return data;
  } catch (err) {
    await supabase
      .from('knowledge_sources')
      .update({ status: 'failed', error_message: err.message, updated_at: new Date().toISOString() })
      .eq('id', source.id)
      .eq('user_id', userId);
    throw err;
  }
}

export async function deleteKnowledgeSource(userId, sourceId) {
  const source = await getOwnedKnowledgeSource(userId, sourceId);
  await supabase.from('knowledge_chunks').delete().eq('source_id', source.id);
  const { error } = await supabase
    .from('knowledge_sources')
    .delete()
    .eq('id', source.id)
    .eq('user_id', userId);
  if (error) throw error;
  await audit(userId, 'delete', 'knowledge_source', source.id);
  return true;
}

async function resolveKnowledgeText(payload) {
  if (payload.text) return String(payload.text);
  if (payload.faqs) return payload.faqs.map((f) => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n');
  if (payload.url) {
    const { data } = await axios.get(payload.url, { timeout: 12000, maxContentLength: 2_000_000 });
    return String(data).replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ');
  }
  throw new Error('Provide text, FAQ items, or a website URL.');
}

function chunkText(text) {
  const cleaned = String(text || '').replace(/\s+/g, ' ').trim();
  const chunks = [];
  for (let i = 0; i < cleaned.length; i += 1200) {
    const chunk = cleaned.slice(i, i + 1400).trim();
    if (chunk.length > 80) chunks.push(chunk);
  }
  return chunks.slice(0, 200);
}

async function embedChunks(input) {
  if (!process.env.OPENAI_API_KEY || !input.length) return null;
  const { data } = await axios.post(
    'https://api.openai.com/v1/embeddings',
    { model: process.env.INSTAPILOT_EMBEDDING_MODEL || 'text-embedding-3-small', input },
    { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` } }
  );
  return data.data.map((item) => item.embedding);
}

async function getOwnedBot(userId, botId) {
  const { data, error } = await supabase
    .from('instagram_bots')
    .select('*')
    .eq('id', botId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Bot not found');
  return data;
}

async function getOwnedKnowledgeSource(userId, sourceId) {
  const { data, error } = await supabase
    .from('knowledge_sources')
    .select('*')
    .eq('id', sourceId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Knowledge source not found');
  return data;
}

export async function listKnowledge(userId, botId) {
  await getOwnedBot(userId, botId);
  const { data, error } = await supabase
    .from('knowledge_sources')
    .select('*, knowledge_chunks(id,chunk_text)')
    .eq('bot_id', botId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

async function retrieveKnowledge(botId, question) {
  const words = String(question || '')
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 3)
    .slice(0, 12);
  const { data, error } = await supabase
    .from('knowledge_chunks')
    .select('chunk_text, metadata')
    .eq('bot_id', botId)
    .limit(80);
  if (error) throw error;
  return (data || [])
    .map((chunk) => ({
      ...chunk,
      score: words.reduce((sum, word) => sum + (chunk.chunk_text.toLowerCase().includes(word) ? 1 : 0), 0),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
}

export async function generateReply({ bot, messageText, conversation = null }) {
  const chunks = await retrieveKnowledge(bot.id, messageText);
  if (!chunks.length) {
    return { text: bot.fallback_message || DEFAULT_REPLY, confidence: 0.25, handoff: true };
  }

  if (!process.env.OPENAI_API_KEY) {
    return {
      text: `${chunks[0].chunk_text.slice(0, 420)}${chunks[0].chunk_text.length > 420 ? '...' : ''}`,
      confidence: 0.55,
      handoff: true,
    };
  }

  const prompt = [
    `You reply as ${bot.business_name}, never as ChatGPT.`,
    `Tone: ${bot.tone}. Language: ${bot.language}. Goal: ${bot.bot_goal}.`,
    'Use only the knowledge base excerpts. Keep Instagram DM replies short and natural.',
    'If the answer is not present, say the team will help or ask one clarifying question.',
    'Never invent prices, policies, discounts, timelines, or guarantees.',
    'Do not request sensitive information unless configured lead fields require it.',
  ].join('\n');

  const { data } = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: process.env.INSTAPILOT_OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.3,
      messages: [
        { role: 'system', content: prompt },
        {
          role: 'user',
          content: `Knowledge:\n${chunks.map((c, i) => `[${i + 1}] ${c.chunk_text}`).join('\n\n')}\n\nUser: ${messageText}`,
        },
      ],
    },
    { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` } }
  );
  const text = data.choices?.[0]?.message?.content?.trim() || bot.fallback_message || DEFAULT_REPLY;
  const confidence = chunks[0]?.score > 0 ? 0.82 : 0.58;
  return { text, confidence, handoff: confidence < Number(bot.confidence_threshold || 0.68) };
}

export async function testReply(userId, botId, messageText) {
  const bot = await getOwnedBot(userId, botId);
  return generateReply({ bot, messageText });
}

function needsHandoff(bot, text) {
  const normalized = String(text || '').toLowerCase();
  const keywords = bot.handoff_keywords || ['human', 'agent', 'call me', 'support'];
  const riskWords = ['refund', 'legal', 'payment failed', 'angry', 'complaint', 'fraud', 'cancel'];
  return [...keywords, ...riskWords].some((word) => normalized.includes(String(word).toLowerCase()));
}

async function findActiveBotForAccount(accountId) {
  const { data, error } = await supabase
    .from('instagram_bots')
    .select('*')
    .eq('instagram_account_id', accountId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function findAccountByRecipient(recipientId) {
  let { data, error } = await supabase
    .from('instagram_accounts')
    .select('*')
    .eq('instagram_business_account_id', recipientId)
    .eq('is_connected', true)
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    const fallback = await supabase
      .from('instagram_accounts')
      .select('*')
      .eq('page_id', recipientId)
      .eq('is_connected', true)
      .maybeSingle();
    if (fallback.error) throw fallback.error;
    data = fallback.data;
  }
  return data;
}

async function upsertConversation(account, bot, senderId) {
  const profile = await fetchInstagramScopedUserProfile(account, senderId).catch(() => null);
  const payload = {
    user_id: account.user_id,
    bot_id: bot?.id || null,
    instagram_account_id: account.id,
    instagram_user_id: senderId,
    instagram_username: profile?.username || null,
    instagram_name: profile?.name || null,
    profile_pic_url: profile?.profile_pic || null,
    follower_count: Number.isFinite(profile?.follower_count) ? profile.follower_count : null,
    is_user_follow_business:
      typeof profile?.is_user_follow_business === 'boolean' ? profile.is_user_follow_business : null,
    is_business_follow_user:
      typeof profile?.is_business_follow_user === 'boolean' ? profile.is_business_follow_user : null,
    last_message_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from('instagram_conversations')
    .upsert(payload, { onConflict: 'instagram_account_id,instagram_user_id' })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

async function fetchInstagramScopedUserProfile(account, senderId) {
  const accessToken = await getPageTokenForAccount(account);
  const { data } = await axios.get(`https://graph.instagram.com/${GRAPH_VERSION}/${senderId}`, {
    params: {
      access_token: accessToken,
      fields: 'name,username,profile_pic,follower_count,is_user_follow_business,is_business_follow_user',
    },
  });
  return data || null;
}

export async function processInstagramWebhook(payload) {
  const events = [];
  for (const entry of payload.entry || []) {
    for (const messaging of entry.messaging || []) {
      if (!messaging.message?.text || messaging.message?.is_echo) continue;
      const senderId = messaging.sender?.id;
      const recipientId = messaging.recipient?.id;
      if (!senderId || !recipientId || senderId === recipientId) continue;
      events.push(await handleInboundMessage({ senderId, recipientId, messaging }));
    }
  }
  return events.filter(Boolean);
}

async function handleInboundMessage({ senderId, recipientId, messaging }) {
  const account = await findAccountByRecipient(recipientId);
  if (!account) return { skipped: true, reason: 'account_not_found' };
  const bot = await findActiveBotForAccount(account.id);
  const conversation = await upsertConversation(account, bot, senderId);
  const text = messaging.message.text;

  await supabase.from('instagram_messages').insert({
    user_id: account.user_id,
    bot_id: bot?.id || null,
    instagram_account_id: account.id,
    conversation_id: conversation.id,
    sender_id: senderId,
    recipient_id: recipientId,
    message_text: text,
    direction: 'inbound',
    raw_payload: messaging,
  });

  if (!bot || conversation.bot_paused || conversation.status === 'human_active' || conversation.status === 'closed') {
    return { skipped: true, reason: 'bot_inactive_or_paused' };
  }

  if (needsHandoff(bot, text) || conversation.failure_count >= 2) {
    await supabase.from('instagram_conversations').update({ status: 'human_needed' }).eq('id', conversation.id);
    return { skipped: true, reason: 'human_handoff' };
  }

  const quotaBot = await resetAndCheckBotQuota(bot);
  if (!quotaBot.canSend) {
    await supabase.from('instagram_conversations').update({ status: 'human_needed' }).eq('id', conversation.id);
    return { skipped: true, reason: 'daily_reply_limit_reached' };
  }

  const reply = await generateReply({ bot, messageText: text, conversation });
  if (reply.handoff) {
    await supabase
      .from('instagram_conversations')
      .update({ status: 'human_needed', failure_count: conversation.failure_count + 1 })
      .eq('id', conversation.id);
  }

  const sendText = reply.handoff ? bot.fallback_message || DEFAULT_REPLY : reply.text;
  await sendInstagramMessage({ account, recipientId: senderId, text: sendText, messagingType: 'RESPONSE' });
  await supabase.from('instagram_messages').insert({
    user_id: account.user_id,
    bot_id: bot.id,
    instagram_account_id: account.id,
    conversation_id: conversation.id,
    sender_id: recipientId,
    recipient_id: senderId,
    message_text: sendText,
    direction: 'outbound',
    ai_generated: true,
    confidence_score: reply.confidence,
    status: 'sent',
  });
  await supabase
    .from('instagram_bots')
    .update({ replies_sent_today: quotaBot.repliesSentToday + 1 })
    .eq('id', bot.id);
  await maybeCaptureLead(bot, conversation.id, account.user_id, text);
  return { sent: true, conversationId: conversation.id };
}

export async function sendInstagramMessage({ account, recipientId, text, messagingType = 'RESPONSE' }) {
  const accessToken = await getPageTokenForAccount(account);
  const { data } = await axios.post(
    `${GRAPH_BASE}/${account.page_id}/messages`,
    {
      recipient: { id: recipientId },
      messaging_type: messagingType,
      message: { text: String(text).slice(0, 1000) },
    },
    { params: { access_token: accessToken } }
  );
  return data;
}

async function resetAndCheckBotQuota(bot) {
  const today = new Date().toISOString().slice(0, 10);
  let repliesSentToday = bot.replies_sent_today || 0;
  if (bot.last_reply_quota_reset !== today) {
    repliesSentToday = 0;
    await supabase
      .from('instagram_bots')
      .update({ replies_sent_today: 0, last_reply_quota_reset: today })
      .eq('id', bot.id);
  }
  return {
    canSend: repliesSentToday < Number(bot.daily_reply_limit || 250),
    repliesSentToday,
  };
}

async function maybeCaptureLead(bot, conversationId, userId, text) {
  const lead = {};
  const email = String(text).match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
  const phone = String(text).match(/(?:\+?\d[\d\s-]{7,}\d)/)?.[0];
  if (email) lead.email = email;
  if (phone) lead.phone = phone;
  if (!Object.keys(lead).length) return;
  await supabase
    .from('instagram_leads')
    .upsert({ user_id: userId, bot_id: bot.id, conversation_id: conversationId, ...lead }, { onConflict: 'conversation_id' });
}

export async function listConversations(userId) {
  const { data, error } = await supabase
    .from('instagram_conversations')
    .select('*, instagram_bots(bot_name), instagram_messages(message_text,direction,created_at)')
    .eq('user_id', userId)
    .order('last_message_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return data || [];
}

export async function getConversation(userId, conversationId) {
  const { data: conversation, error } = await supabase
    .from('instagram_conversations')
    .select('*, instagram_leads(*)')
    .eq('user_id', userId)
    .eq('id', conversationId)
    .maybeSingle();
  if (error) throw error;
  const { data: messages, error: messagesError } = await supabase
    .from('instagram_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (messagesError) throw messagesError;
  return { conversation, messages: messages || [] };
}

export async function manualReply(userId, conversationId, text) {
  const { conversation } = await getConversation(userId, conversationId);
  if (!conversation) throw new Error('Conversation not found');
  const account = await getOwnedAccount(userId, conversation.instagram_account_id);
  await sendInstagramMessage({ account, recipientId: conversation.instagram_user_id, text, messagingType: 'RESPONSE' });
  const { data, error } = await supabase
    .from('instagram_messages')
    .insert({
      user_id: userId,
      bot_id: conversation.bot_id,
      instagram_account_id: conversation.instagram_account_id,
      conversation_id: conversationId,
      sender_id: account.instagram_business_account_id,
      recipient_id: conversation.instagram_user_id,
      message_text: text,
      direction: 'outbound',
      status: 'sent',
    })
    .select('*')
    .single();
  if (error) throw error;
  await supabase.from('instagram_conversations').update({ status: 'human_active', bot_paused: true }).eq('id', conversationId);
  await audit(userId, 'manual_reply', 'instagram_conversation', conversationId);
  return data;
}

export async function updateConversation(userId, conversationId, payload) {
  const allowed = ['status', 'assigned_to', 'bot_paused', 'failure_count', 'labels', 'notes', 'lead_data'];
  const updates = Object.fromEntries(Object.entries(payload || {}).filter(([key]) => allowed.includes(key)));
  const { data, error } = await supabase
    .from('instagram_conversations')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', conversationId)
    .eq('user_id', userId)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function getAnalytics(userId) {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const [conversations, botReplies, handoffs, leads, unanswered] = await Promise.all([
    supabase.from('instagram_conversations').select('id', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', since),
    supabase.from('instagram_messages').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('direction', 'outbound').eq('ai_generated', true).gte('created_at', since),
    supabase.from('instagram_conversations').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'human_needed').gte('created_at', since),
    supabase.from('instagram_leads').select('id', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', since),
    supabase.from('instagram_messages').select('id', { count: 'exact', head: true }).eq('user_id', userId).lt('confidence_score', 0.68).gte('created_at', since),
  ]);
  return {
    totalConversations: conversations.count || 0,
    botReplies: botReplies.count || 0,
    humanHandoffs: handoffs.count || 0,
    leadsCaptured: leads.count || 0,
    unansweredQuestions: unanswered.count || 0,
    conversionRate: conversations.count ? Math.round(((leads.count || 0) / conversations.count) * 100) : 0,
  };
}

async function audit(userId, action, entityType, entityId, metadata = {}) {
  await supabase.from('instagram_audit_logs').insert({
    user_id: userId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    metadata,
  });
}
