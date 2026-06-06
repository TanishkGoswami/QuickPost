import instagramOAuth from './instagramOAuth.js';
import supabase from './supabase.js';

const RECONNECT_MESSAGE =
  'REAUTH_REQUIRED: Instagram connection expired. Please reconnect Instagram, then post again.';
const REFRESH_BUFFER_MS = 5 * 60 * 1000;
const FALLBACK_BUFFER_MS = 60 * 1000;

export function isInstagramAuthError(errorOrMessage) {
  const message = String(errorOrMessage?.message || errorOrMessage || '').toLowerCase();
  return (
    message.includes('error validating access token') ||
    message.includes('session has expired') ||
    message.includes('access token') && message.includes('expired') ||
    message.includes('reauth_required')
  );
}

export function buildInstagramReconnectError(detail = '') {
  const error = new Error(detail ? `${RECONNECT_MESSAGE} (${detail})` : RECONNECT_MESSAGE);
  error.code = 'REAUTH_REQUIRED';
  error.statusCode = 401;
  error.requiresReconnect = true;
  return error;
}

async function patchInstagramProfileData(userId, patch) {
  try {
    const { data: tokenRow } = await supabase
      .from('social_tokens')
      .select('profile_data')
      .eq('user_id', userId)
      .eq('provider', 'instagram')
      .maybeSingle();

    await supabase
      .from('social_tokens')
      .update({
        profile_data: {
          ...(tokenRow?.profile_data || {}),
          ...patch,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('provider', 'instagram');
  } catch (error) {
    console.warn('[INSTAGRAM_TOKEN] Failed updating Instagram token profile data:', error.message);
  }
}

async function markInstagramDisconnected(userId, reason) {
  await patchInstagramProfileData(userId, {
    token_status: 'expired',
    token_error: reason,
    updated_by: 'instagram_token_guard',
  });
}

async function markInstagramHealthy(userId) {
  try {
    const { data: tokenRow } = await supabase
      .from('social_tokens')
      .select('profile_data')
      .eq('user_id', userId)
      .eq('provider', 'instagram')
      .maybeSingle();

    const profileData = tokenRow?.profile_data || {};
    if (profileData.token_status !== 'expired' && !profileData.token_error) return;

    await patchInstagramProfileData(userId, {
      token_status: 'active',
      token_error: null,
      updated_by: 'instagram_token_guard',
    });
  } catch (error) {
    console.warn('[INSTAGRAM_TOKEN] Failed marking Instagram token healthy:', error.message);
  }
}

function getTokenExpiryMs(tokenExpiry) {
  if (!tokenExpiry) return null;
  const expiryMs = new Date(tokenExpiry).getTime();
  return Number.isFinite(expiryMs) ? expiryMs : null;
}

function hasUsableTokenWindow(tokenExpiry, bufferMs = REFRESH_BUFFER_MS) {
  const expiryMs = getTokenExpiryMs(tokenExpiry);
  return expiryMs !== null && expiryMs - Date.now() > bufferMs;
}

export async function getValidInstagramTokensForPosting(userId, currentTokens) {
  if (!currentTokens?.accessToken || !currentTokens?.businessId) {
    throw buildInstagramReconnectError('missing Instagram credentials');
  }

  if (hasUsableTokenWindow(currentTokens.tokenExpiry)) {
    await markInstagramHealthy(userId);
    return currentTokens;
  }

  try {
    const valid = await instagramOAuth.getValidAccessToken(userId);
    return {
      ...currentTokens,
      accessToken: valid.accessToken,
      businessId: valid.instagramBusinessId || currentTokens.businessId,
      pageId: valid.pageId || currentTokens.pageId,
      tokenExpiry: valid.tokenExpiry || currentTokens.tokenExpiry,
    };
  } catch (error) {
    const message = error?.message || String(error);

    if (hasUsableTokenWindow(currentTokens.tokenExpiry, FALLBACK_BUFFER_MS)) {
      console.warn('[INSTAGRAM_TOKEN] Refresh failed; using token while it is still valid:', {
        expiresAt: currentTokens.tokenExpiry,
        error: message
      });
      await markInstagramHealthy(userId);
      return currentTokens;
    }

    await markInstagramDisconnected(userId, message);
    throw isInstagramAuthError(message)
      ? buildInstagramReconnectError(message)
      : error;
  }
}
