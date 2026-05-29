import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import supabase from './supabase.js';

const autodmTokenEncryptionKey = process.env.AUTODM_TOKEN_ENCRYPTION_KEY_BASE64;
const GRAPH_VERSION = process.env.META_GRAPH_VERSION || 'v21.0';
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

const getAutoDMSupabaseAdmin = () => {
  return supabase;
};

const base64Url = (value) =>
  Buffer.from(value).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');

const bytesToBase64 = (buffer) => Buffer.from(buffer).toString('base64');

const getTokenEncryptionKey = () => {
  if (!autodmTokenEncryptionKey) {
    throw new Error('Missing AUTODM_TOKEN_ENCRYPTION_KEY_BASE64.');
  }

  const key = Buffer.from(autodmTokenEncryptionKey, 'base64');
  if (key.length !== 32) {
    throw new Error('AUTODM_TOKEN_ENCRYPTION_KEY_BASE64 must decode to 32 bytes.');
  }

  return key;
};

export function signAutoDMBridgeToken(user) {
  return {
    token: 'dummy',
    expiresAt: Math.floor(Date.now() / 1000) + 3600,
  };
}

export async function startAutoDMInstagramOAuth(user, frontendUrl, authHeader) {
  const supabaseUrl = process.env.SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error('Missing SUPABASE_URL in env.');
  }

  // Ensure we pass the active user auth token
  const token = authHeader || `Bearer ${process.env.SUPABASE_ANON_KEY}`;

  console.log(`🔗 [AUTODM-OAUTH] Invoking oauth-start Edge Function on Social Pilot Supabase: ${supabaseUrl}`);
  const response = await fetch(`${supabaseUrl}/functions/v1/oauth-start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token,
    },
    body: JSON.stringify({ frontendUrl }),
  });

  const payload = await response.json().catch(async () => {
    const text = await response.text().catch(() => '');
    return text ? { error: text } : {};
  });

  if (!response.ok) {
    throw new Error(
      payload.error ||
        payload.message ||
        `AutoDM OAuth function failed with status ${response.status}`
    );
  }

  if (!payload?.redirectTo || typeof payload.redirectTo !== 'string') {
    throw new Error('AutoDM OAuth URL not returned by server');
  }

  return payload.redirectTo;
}

export async function encryptAutoDMTokenBundle(bundle) {
  const iv = crypto.randomBytes(12);
  const key = getTokenEncryptionKey();
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([
    cipher.update(Buffer.from(JSON.stringify(bundle), 'utf8')),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  const payload = Buffer.concat([encrypted, authTag]);

  return `enc:v1:${bytesToBase64(iv)}:${bytesToBase64(payload)}`;
}

async function ensureAutoDMUser(user) {
  return;
}

async function fetchInstagramBusinessProfile({ accessToken, instagramBusinessId }) {
  const url = new URL(`${GRAPH_BASE}/${instagramBusinessId}`);
  url.searchParams.set('access_token', accessToken);
  url.searchParams.set('fields', 'username,name,profile_picture_url,followers_count,media_count');

  const res = await fetch(url.toString());
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.error?.message || 'Instagram Graph API error fetching business profile');
  }

  return {
    username: json.username,
    name: json.name,
    profile_picture_url: json.profile_picture_url,
    followers_count: json.followers_count,
    media_count: json.media_count,
  };
}

export async function importInstagramAccountToAutoDM(user) {
  const autoDMSupabase = getAutoDMSupabaseAdmin();

  // Ensure user exists in AutoDM auth.users (required by FK constraint)
  await ensureAutoDMUser(user);

  const { data: socialInstagram, error: socialError } = await supabase
    .from('social_tokens')
    .select('access_token, token_expiry, instagram_business_id, page_id, username, profile_data')
    .eq('user_id', user.userId)
    .eq('provider', 'instagram')
    .maybeSingle();

  if (socialError) {
    throw new Error(`Failed to read Social Pilot Instagram connection: ${socialError.message}`);
  }

  if (!socialInstagram?.access_token || !socialInstagram?.instagram_business_id) {
    throw new Error('Instagram is not connected in Social Pilot.');
  }

  const profile = socialInstagram.profile_data || {};
  const liveProfile = await fetchInstagramBusinessProfile({
    accessToken: socialInstagram.access_token,
    instagramBusinessId: socialInstagram.instagram_business_id,
  }).catch((error) => {
    console.warn('[AUTODM] Live Instagram profile fetch failed:', error.message);
    return null;
  });
  const encryptedTokenBundle = await encryptAutoDMTokenBundle({
    pageAccessToken: socialInstagram.access_token,
    userAccessToken: socialInstagram.access_token,
  });

  const upsertPayload = {
    user_id: user.userId,
    instagram_user_id: socialInstagram.instagram_business_id,
    username: liveProfile?.username || socialInstagram.username || profile.username || `ig_${socialInstagram.instagram_business_id}`,
    full_name: liveProfile?.name || profile.name || profile.full_name || null,
    profile_picture_url:
      liveProfile?.profile_picture_url ||
      profile.profile_picture_url ||
      profile.profilePicture ||
      profile.picture?.data?.url ||
      profile.picture ||
      null,
    account_type: 'BUSINESS',
    access_token_encrypted: encryptedTokenBundle,
    token_expires_at:
      socialInstagram.token_expiry || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    is_connected: true,
    followers_count: liveProfile?.followers_count || profile.followers_count || null,
    media_count: liveProfile?.media_count || profile.media_count || null,
    page_id: socialInstagram.page_id || null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await autoDMSupabase
    .from('instagram_accounts')
    .upsert(upsertPayload, {
      onConflict: 'user_id,instagram_user_id',
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to import Instagram account into AutoDM: ${error.message}`);
  }

  const { error: profileError } = await autoDMSupabase.from('profiles').upsert(
    {
      id: user.userId,
      email: user.email,
      full_name: user.name || user.email?.split('@')[0] || null,
      avatar_url: user.profilePicture || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );

  if (profileError) {
    console.warn('[AUTODM] Failed to sync profile:', profileError.message);
  }

  return data;
}

export async function getAutoDMStatus(user) {
  const autoDMSupabase = getAutoDMSupabaseAdmin();

  let [{ data: accounts, error: accountsError }, { data: socialInstagram, error: socialError }] =
    await Promise.all([
      autoDMSupabase
        .from('instagram_accounts')
        .select('*')
        .eq('user_id', user.userId)
        .eq('is_connected', true)
        .order('created_at', { ascending: false }),
      supabase
        .from('social_tokens')
        .select('access_token, token_expiry, instagram_business_id, page_id, username, profile_data, provider')
        .eq('user_id', user.userId)
        .eq('provider', 'instagram')
        .maybeSingle(),
    ]);

  if (accountsError) {
    throw new Error(`Failed to load AutoDM accounts: ${accountsError.message}`);
  }
  if (socialError) {
    throw new Error(`Failed to load Social Pilot Instagram state: ${socialError.message}`);
  }

  const hasSocialInstagramConnection = Boolean(
    socialInstagram?.instagram_business_id || socialInstagram?.page_id
  );

  // Auto-sync existing Social Pilot Instagram connection to AutoDM if not already imported
  if ((!accounts || accounts.length === 0) && hasSocialInstagramConnection && socialInstagram?.access_token) {
    try {
      console.log(`🔄 [AUTODM-AUTO-SYNC] Auto-importing connected Instagram account for user ${user.userId} on status check...`);
      await importInstagramAccountToAutoDM(user);
      
      // Fetch accounts again to include the newly imported account
      const { data: refreshedAccounts, error: refreshError } = await autoDMSupabase
        .from('instagram_accounts')
        .select('*')
        .eq('user_id', user.userId)
        .eq('is_connected', true)
        .order('created_at', { ascending: false });
        
      if (!refreshError && refreshedAccounts) {
        accounts = refreshedAccounts;
        console.log(`✅ [AUTODM-AUTO-SYNC] Automatically synced and loaded ${refreshedAccounts.length} Instagram account(s)`);
      }
    } catch (syncErr) {
      console.warn(`⚠️ [AUTODM-AUTO-SYNC] On-the-fly AutoDM sync failed:`, syncErr.message);
    }
  }

  return {
    autodmAccounts: accounts || [],
    hasSocialInstagramConnection,
    socialInstagram: socialInstagram || null,
    autoDMStorageReady: true,
    autoDMStorageError: null,
  };
}

function getAutoDMSupabaseForUserMutation() {
  return getAutoDMSupabaseAdmin();
}

function cleanAutomationPayload(payload = {}, user) {
  const {
    id,
    created_at,
    updated_at,
    user_id,
    ...rest
  } = payload;

  return {
    ...rest,
    user_id: user.authUserId || user.userId,
    updated_at: new Date().toISOString(),
  };
}

export async function listAutomationsForUser(user, { instagramAccountId } = {}) {
  const autoDMSupabase = getAutoDMSupabaseForUserMutation();
  let query = autoDMSupabase
    .from('automations')
    .select('*')
    .eq('user_id', user.authUserId || user.userId)
    .order('created_at', { ascending: false });

  if (instagramAccountId) {
    query = query.eq('instagram_account_id', instagramAccountId);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to load Auto DM automations: ${error.message}`);
  return data || [];
}

export async function getAutomationForUser(user, automationId) {
  const autoDMSupabase = getAutoDMSupabaseForUserMutation();
  const { data, error } = await autoDMSupabase
    .from('automations')
    .select('*')
    .eq('id', automationId)
    .eq('user_id', user.authUserId || user.userId)
    .maybeSingle();

  if (error) throw new Error(`Failed to load Auto DM automation: ${error.message}`);
  return data;
}

export async function createAutomationForUser(user, payload) {
  const autoDMSupabase = getAutoDMSupabaseForUserMutation();
  const cleanPayload = cleanAutomationPayload(payload, user);

  const { data, error } = await autoDMSupabase
    .from('automations')
    .insert(cleanPayload)
    .select('*')
    .single();

  if (error) throw new Error(`Failed to create Auto DM automation: ${error.message}`);
  return data;
}

export async function updateAutomationForUser(user, automationId, payload) {
  const autoDMSupabase = getAutoDMSupabaseForUserMutation();
  const cleanPayload = cleanAutomationPayload(payload, user);

  const { data, error } = await autoDMSupabase
    .from('automations')
    .update(cleanPayload)
    .eq('id', automationId)
    .eq('user_id', user.authUserId || user.userId)
    .select('*')
    .single();

  if (error) throw new Error(`Failed to update Auto DM automation: ${error.message}`);
  return data;
}

export async function deleteAutomationForUser(user, automationId) {
  const autoDMSupabase = getAutoDMSupabaseForUserMutation();
  const { error } = await autoDMSupabase
    .from('automations')
    .delete()
    .eq('id', automationId)
    .eq('user_id', user.authUserId || user.userId);

  if (error) throw new Error(`Failed to delete Auto DM automation: ${error.message}`);
  return true;
}

export async function fetchInstagramMediaForUser(user, limit = 30) {
  const { data: token, error } = await supabase
    .from('social_tokens')
    .select('access_token, instagram_business_id')
    .eq('user_id', user.userId)
    .eq('provider', 'instagram')
    .maybeSingle();

  if (error) throw new Error(`Failed to read Instagram token: ${error.message}`);
  if (!token?.access_token || !token?.instagram_business_id) {
    throw new Error('Instagram is not connected in Social Pilot.');
  }

  const url = new URL(`https://graph.facebook.com/v21.0/${token.instagram_business_id}/media`);
  url.searchParams.set('access_token', token.access_token);
  url.searchParams.set('fields', 'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,like_count,comments_count');
  url.searchParams.set('limit', String(limit));

  const res = await fetch(url.toString());
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.error?.message || 'Instagram Graph API error');
  }

  return json.data || [];
}

function isAutoDMComposerEnabled(config) {
  return Boolean(config?.enabled && Array.isArray(config.keywords) && config.keywords.length);
}

function buildComposerAutomationPayload({ user, account, config, publication, sourceBroadcastId, sourceJobId }) {
  const triggerType =
    config.triggerType ||
    (publication?.mediaType === 'video' ? 'comment_on_reel' : 'comment_on_post');

  return {
    user_id: user.authUserId || user.userId,
    instagram_account_id: account.id,
    name: config.name || `Auto DM for ${publication?.mediaId || 'Instagram post'}`,
    trigger_type: triggerType,
    media_id: publication?.mediaId || null,
    media_url: publication?.permalink || publication?.mediaUrl || null,
    media_thumbnail: publication?.thumbnailUrl || publication?.mediaUrl || null,
    keywords: config.keywords || [],
    is_case_sensitive: Boolean(config.isCaseSensitive),
    comment_reply_enabled: Boolean(config.commentReplyEnabled),
    comment_reply_text: config.commentReplyEnabled ? config.commentReplyText || null : null,
    response_flow: config.responseFlow || { nodes: [], opening_message_enabled: false, opening_message: '' },
    is_active: true,
    source: 'social_pilot_composer',
    source_broadcast_id: sourceBroadcastId || null,
    source_job_id: sourceJobId || null,
    updated_at: new Date().toISOString(),
  };
}

async function resolveImportedAutoDMInstagramAccount(autoDMSupabase, user) {
  const { data: socialInstagram, error: socialError } = await supabase
    .from('social_tokens')
    .select('instagram_business_id, page_id')
    .eq('user_id', user.userId)
    .eq('provider', 'instagram')
    .maybeSingle();

  if (socialError) {
    throw new Error(`Failed to resolve Social Pilot Instagram account: ${socialError.message}`);
  }

  const instagramBusinessId = socialInstagram?.instagram_business_id;
  if (!instagramBusinessId) {
    throw new Error('Instagram is not connected in Social Pilot.');
  }

  let { data: account, error: accountError } = await autoDMSupabase
    .from('instagram_accounts')
    .select('*')
    .eq('user_id', user.userId)
    .eq('instagram_user_id', instagramBusinessId)
    .eq('is_connected', true)
    .maybeSingle();

  if (accountError) {
    throw new Error(`Failed to resolve Auto DM Instagram account: ${accountError.message}`);
  }

  if (!account) {
    account = await importInstagramAccountToAutoDM(user);
  }

  return account;
}

export async function createOrUpdateComposerAutomation({
  user,
  config,
  publication,
  sourceBroadcastId,
  sourceJobId,
}) {
  if (!isAutoDMComposerEnabled(config)) {
    return { skipped: true, reason: 'disabled' };
  }

  if (!publication?.success || !publication?.mediaId) {
    return { skipped: true, reason: 'instagram_not_published' };
  }

  const autoDMSupabase = getAutoDMSupabaseAdmin();
  await ensureAutoDMUser(user);
  const account = await resolveImportedAutoDMInstagramAccount(autoDMSupabase, user);
  const payload = buildComposerAutomationPayload({
    user,
    account,
    config,
    publication,
    sourceBroadcastId,
    sourceJobId,
  });

  if (sourceBroadcastId) {
    const { data: existing, error: findError } = await autoDMSupabase
      .from('automations')
      .select('id')
      .eq('user_id', user.authUserId || user.userId)
      .eq('source_broadcast_id', sourceBroadcastId)
      .maybeSingle();

    const sourceColumnMissing =
      findError &&
      (findError.code === '42703' ||
        findError.code === 'PGRST204' ||
        String(findError.message || '').includes('source_broadcast_id'));

    if (findError && !sourceColumnMissing) {
      throw new Error(`Failed to check existing Auto DM automation: ${findError.message}`);
    }

    if (existing?.id) {
      const { data, error } = await autoDMSupabase
        .from('automations')
        .update(payload)
        .eq('id', existing.id)
        .eq('user_id', user.authUserId || user.userId)
        .select('*')
        .single();

      if (error) throw new Error(`Failed to update Auto DM automation: ${error.message}`);
      return { skipped: false, automation: data, updated: true };
    }
  }

  const { data, error } = await autoDMSupabase.from('automations').insert(payload).select('*').single();

  if (!error) {
    return { skipped: false, automation: data, updated: false };
  }

  if (error.code === '42703' || String(error.message || '').includes('source_')) {
    const { source, source_broadcast_id, source_job_id, ...legacyPayload } = payload;
    const { data: legacyData, error: legacyError } = await autoDMSupabase
      .from('automations')
      .insert(legacyPayload)
      .select('*')
      .single();

    if (legacyError) {
      throw new Error(`Failed to create Auto DM automation: ${legacyError.message}`);
    }

    return {
      skipped: false,
      automation: legacyData,
      updated: false,
      warning: 'Auto DM source columns are missing; idempotency migration should be applied.',
    };
  }

  if (error.code === '23505' && sourceBroadcastId) {
    const { data: existing, error: existingError } = await autoDMSupabase
      .from('automations')
      .select('id')
      .eq('user_id', user.authUserId || user.userId)
      .eq('source_broadcast_id', sourceBroadcastId)
      .maybeSingle();

    if (existingError || !existing?.id) {
      throw new Error(`Failed to recover duplicate Auto DM automation: ${existingError?.message || error.message}`);
    }

    const { data: updated, error: updateError } = await autoDMSupabase
      .from('automations')
      .update(payload)
      .eq('id', existing.id)
      .eq('user_id', user.authUserId || user.userId)
      .select('*')
      .single();

    if (updateError) throw new Error(`Failed to update Auto DM automation: ${updateError.message}`);
    return { skipped: false, automation: updated, updated: true };
  }

  throw new Error(`Failed to create Auto DM automation: ${error.message}`);
}

export async function listContactsForUser(user, { instagramAccountId } = {}) {
  const autoDMSupabase = getAutoDMSupabaseAdmin();
  let query = autoDMSupabase
    .from('contacts')
    .select('*')
    .eq('user_id', user.userId)
    .order('last_interaction_at', { ascending: false });

  if (instagramAccountId) {
    query = query.eq('instagram_account_id', instagramAccountId);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to load contacts: ${error.message}`);
  return data || [];
}

export async function listMessagesForContact(user, contactId) {
  const autoDMSupabase = getAutoDMSupabaseAdmin();
  const { data, error } = await autoDMSupabase
    .from('messages')
    .select('*')
    .eq('contact_id', contactId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(`Failed to load messages: ${error.message}`);
  return data || [];
}

export async function getDailyMetrics(user, { instagramAccountId, startDate } = {}) {
  const autoDMSupabase = getAutoDMSupabaseAdmin();
  let query = autoDMSupabase
    .from('daily_metrics')
    .select('*')
    .eq('user_id', user.userId)
    .order('date', { ascending: false });

  if (instagramAccountId) {
    query = query.eq('instagram_account_id', instagramAccountId);
  }
  if (startDate) {
    query = query.gte('date', startDate);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to load daily metrics: ${error.message}`);
  return data || [];
}

export async function getAutomationAnalytics(user, automationId) {
  const autoDMSupabase = getAutoDMSupabaseAdmin();

  // Verify ownership
  const { data: automation, error: automationError } = await autoDMSupabase
    .from('automations')
    .select('*')
    .eq('id', automationId)
    .eq('user_id', user.authUserId || user.userId)
    .maybeSingle();

  if (automationError) throw new Error(`Failed to verify automation: ${automationError.message}`);
  if (!automation) throw new Error('Automation not found');

  const [
    { data: messageRows },
    { data: sessionRows },
    { data: webhookRows },
  ] = await Promise.all([
    autoDMSupabase
      .from('messages')
      .select('direction, status, message_type, contact_id, created_at')
      .eq('instagram_account_id', automation.instagram_account_id)
      .eq('automation_id', automationId)
      .order('created_at', { ascending: false }),
    autoDMSupabase
      .from('automation_sessions')
      .select('status, created_at, updated_at')
      .eq('instagram_account_id', automation.instagram_account_id)
      .eq('automation_id', automationId),
    automation.media_id
      ? autoDMSupabase
          .from('webhook_logs')
          .select('payload, processing_error, created_at')
          .eq('event_type', 'comments')
          .order('created_at', { ascending: false })
          .limit(300)
      : { data: [] },
  ]);

  const contactIds = [...new Set((messageRows || []).map((r) => r.contact_id).filter(Boolean))];
  const { data: contactRows } =
    contactIds.length > 0
      ? await autoDMSupabase
          .from('contacts')
          .select('id, username, full_name, total_messages_sent, total_messages_received')
          .in('id', contactIds)
          .order('updated_at', { ascending: false })
          .limit(8)
      : { data: [] };

  let webhookCommentCount = 0;
  const recentErrors = [];
  for (const row of webhookRows || []) {
    if (row.payload?.value?.media?.id === automation.media_id) {
      webhookCommentCount += 1;
      if (row.processing_error) recentErrors.push(String(row.processing_error));
    }
  }

  const outbound = (messageRows || []).filter((r) => r.direction === 'outbound');
  const inbound = (messageRows || []).filter((r) => r.direction === 'inbound');
  const successful = outbound.filter((r) => ['sent', 'delivered', 'seen'].includes(String(r.status || 'sent'))).length;
  const failed = outbound.filter((r) => r.status === 'failed').length;
  const dmsSent = outbound.length;
  const comments = Math.max(inbound.length, webhookCommentCount);

  return {
    automation,
    comments,
    dmsSent,
    inboundMessages: inbound.length,
    uniqueContacts: contactIds.length,
    successfulMessages: successful,
    failedMessages: failed,
    successRate: dmsSent > 0 ? Math.round((successful / dmsSent) * 100) : 0,
    lastUsedAt: (messageRows || [])[0]?.created_at ?? null,
    pendingSessions: (sessionRows || []).filter((r) => r.status === 'pending').length,
    completedSessions: (sessionRows || []).filter((r) => r.status === 'completed').length,
    expiredSessions: (sessionRows || []).filter((r) => r.status === 'expired').length,
    recentContacts: contactRows || [],
    recentErrors: [...new Set(recentErrors)].slice(0, 4),
    followersBefore: automation.follower_count_at_create ?? null,
    followersNow: automation.latest_followers_count ?? null,
    followerGrowth:
      automation.follower_count_at_create != null && automation.latest_followers_count != null
        ? automation.latest_followers_count - automation.follower_count_at_create
        : null,
    postLikes: automation.media_like_count ?? null,
    postComments: automation.media_comments_count ?? null,
    postViews: automation.media_view_count ?? null,
    postCaption: automation.media_caption ?? null,
    postPermalink: automation.media_permalink ?? null,
    insightsSyncedAt: automation.media_insights_synced_at ?? null,
  };
}

export async function syncAutomationInsights(user, automationId) {
  const autoDMSupabase = getAutoDMSupabaseAdmin();

  const { data: automation, error: automationError } = await autoDMSupabase
    .from('automations')
    .select('*')
    .eq('id', automationId)
    .eq('user_id', user.authUserId || user.userId)
    .maybeSingle();

  if (automationError) throw new Error(`Failed to verify automation: ${automationError.message}`);
  if (!automation) throw new Error('Automation not found');

  const { data: token } = await supabase
    .from('social_tokens')
    .select('access_token, instagram_business_id')
    .eq('user_id', user.userId)
    .eq('provider', 'instagram')
    .maybeSingle();

  if (!token?.access_token || !token?.instagram_business_id) {
    throw new Error('Instagram not connected in Social Pilot');
  }

  // Fetch account followers
  const accountUrl = new URL(`https://graph.facebook.com/v21.0/${token.instagram_business_id}`);
  accountUrl.searchParams.set('access_token', token.access_token);
  accountUrl.searchParams.set('fields', 'followers_count');
  const accountRes = await fetch(accountUrl.toString());
  const accountJson = await accountRes.json();
  const followersNow = accountJson.followers_count ?? null;

  let matchedMedia = null;
  if (automation.media_id) {
    const mediaUrl = new URL(`https://graph.facebook.com/v21.0/${automation.media_id}`);
    mediaUrl.searchParams.set('access_token', token.access_token);
    mediaUrl.searchParams.set('fields', 'like_count,comments_count,permalink,caption');
    const mediaRes = await fetch(mediaUrl.toString());
    if (mediaRes.ok) matchedMedia = await mediaRes.json();
  }

  const updates = {
    ...(automation.follower_count_at_create == null && followersNow != null
      ? { follower_count_at_create: followersNow }
      : {}),
    latest_followers_count: followersNow,
    media_like_count: matchedMedia?.like_count ?? automation.media_like_count ?? null,
    media_comments_count: matchedMedia?.comments_count ?? automation.media_comments_count ?? null,
    media_caption: matchedMedia?.caption ?? automation.media_caption ?? null,
    media_permalink: matchedMedia?.permalink ?? automation.media_permalink ?? null,
    media_insights_synced_at: new Date().toISOString(),
  };

  const { data: updated, error: updateError } = await autoDMSupabase
    .from('automations')
    .update(updates)
    .eq('id', automationId)
    .eq('user_id', user.authUserId || user.userId)
    .select('*')
    .single();

  if (updateError) throw new Error(`Failed to update automation: ${updateError.message}`);
  return { automation: updated };
}
