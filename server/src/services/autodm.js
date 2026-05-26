import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import supabase from './supabase.js';

const autodmUrl = process.env.AUTODM_SUPABASE_URL;
const autodmServiceKey =
  process.env.AUTODM_SUPABASE_SERVICE_KEY ||
  process.env.AUTODM_SUPABASE_SERVICE_ROLE_KEY;
const autodmJwtSecret = process.env.AUTODM_SUPABASE_JWT_SECRET;
const autodmTokenEncryptionKey = process.env.AUTODM_TOKEN_ENCRYPTION_KEY_BASE64;

const getAutoDMSupabaseAdmin = () => {
  if (!autodmUrl || !autodmServiceKey) {
    throw new Error(
      'Missing AutoDM admin credentials. Required: AUTODM_SUPABASE_URL and AUTODM_SUPABASE_SERVICE_KEY.'
    );
  }

  return createClient(autodmUrl, autodmServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
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
  if (!autodmJwtSecret) {
    throw new Error('Missing AUTODM_SUPABASE_JWT_SECRET.');
  }

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: 'authenticated',
    exp: now + 60 * 30,
    iat: now,
    iss: 'gap-social-pilot-autodm-bridge',
    role: 'authenticated',
    sub: user.userId,
    email: user.email,
    user_metadata: {
      full_name: user.name || user.email?.split('@')[0] || 'User',
      avatar_url: user.profilePicture || null,
      bridged_from: 'social.getaipilot.in',
    },
    app_metadata: {
      provider: 'social-bridge',
    },
  };

  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64Url(JSON.stringify(header));
  const encodedPayload = base64Url(JSON.stringify(payload));
  const signature = crypto
    .createHmac('sha256', autodmJwtSecret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');

  return {
    token: `${encodedHeader}.${encodedPayload}.${signature}`,
    expiresAt: payload.exp,
  };
}

export async function startAutoDMInstagramOAuth(user, frontendUrl) {
  if (!autodmUrl || !autodmServiceKey) {
    throw new Error(
      'Missing AutoDM admin credentials. Required: AUTODM_SUPABASE_URL and AUTODM_SUPABASE_SERVICE_KEY.'
    );
  }

  const { token } = signAutoDMBridgeToken(user);
  const response = await fetch(`${autodmUrl}/functions/v1/oauth-start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      apikey: autodmServiceKey,
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
  if (!user?.email) {
    return;
  }

  try {
    const res = await fetch(`${autodmUrl}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${autodmServiceKey}`,
        apikey: autodmServiceKey,
      },
      body: JSON.stringify({
        id: user.userId,
        email: user.email,
        email_confirm: true,
        user_metadata: {
          full_name: user.name || user.email?.split('@')[0] || 'User',
          avatar_url: user.profilePicture || null,
          bridged_from: 'social.getaipilot.in',
        },
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      // 422 = already registered — fine, ignore
      if (res.status !== 422) {
        console.warn('[AUTODM] ensureAutoDMUser warning:', err.msg || err.message);
      }
    }
  } catch (e) {
    console.warn('[AUTODM] ensureAutoDMUser error:', e.message);
  }
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
  const encryptedTokenBundle = await encryptAutoDMTokenBundle({
    pageAccessToken: socialInstagram.access_token,
    userAccessToken: socialInstagram.access_token,
  });

  const upsertPayload = {
    user_id: user.userId,
    instagram_user_id: socialInstagram.instagram_business_id,
    username: socialInstagram.username || profile.username || `ig_${socialInstagram.instagram_business_id}`,
    full_name: profile.name || profile.full_name || null,
    profile_picture_url: profile.profile_picture_url || profile.picture || null,
    account_type: 'BUSINESS',
    access_token_encrypted: encryptedTokenBundle,
    token_expires_at:
      socialInstagram.token_expiry || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    is_connected: true,
    followers_count: profile.followers_count || null,
    media_count: profile.media_count || null,
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

  const [{ data: accounts, error: accountsError }, { data: socialInstagram, error: socialError }] =
    await Promise.all([
      autoDMSupabase
        .from('instagram_accounts')
        .select('*')
        .eq('user_id', user.userId)
        .eq('is_connected', true)
        .order('created_at', { ascending: false }),
      supabase
        .from('social_tokens')
        .select('provider, username, instagram_business_id, page_id')
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

  return {
    autodmAccounts: accounts || [],
    hasSocialInstagramConnection: Boolean(
      socialInstagram?.instagram_business_id || socialInstagram?.page_id
    ),
    socialInstagram: socialInstagram || null,
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
    user_id: user.userId,
    updated_at: new Date().toISOString(),
  };
}

export async function listAutomationsForUser(user, { instagramAccountId } = {}) {
  const autoDMSupabase = getAutoDMSupabaseForUserMutation();
  let query = autoDMSupabase
    .from('automations')
    .select('*')
    .eq('user_id', user.userId)
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
    .eq('user_id', user.userId)
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
    .eq('user_id', user.userId)
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
    .eq('user_id', user.userId);

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
    user_id: user.userId,
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
      .eq('user_id', user.userId)
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
        .eq('user_id', user.userId)
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
      .eq('user_id', user.userId)
      .eq('source_broadcast_id', sourceBroadcastId)
      .maybeSingle();

    if (existingError || !existing?.id) {
      throw new Error(`Failed to recover duplicate Auto DM automation: ${existingError?.message || error.message}`);
    }

    const { data: updated, error: updateError } = await autoDMSupabase
      .from('automations')
      .update(payload)
      .eq('id', existing.id)
      .eq('user_id', user.userId)
      .select('*')
      .single();

    if (updateError) throw new Error(`Failed to update Auto DM automation: ${updateError.message}`);
    return { skipped: false, automation: updated, updated: true };
  }

  throw new Error(`Failed to create Auto DM automation: ${error.message}`);
}
