import { corsHeaders, getSupabaseAdmin, logError, logInfo, requireEnv } from '../_shared/db.ts';
import {
  exchangeIGCodeForShortLivedToken,
  exchangeIGForLongLivedToken,
  fetchIGUserInfo,
} from '../_shared/metaService.ts';
import { encryptTokenBundle } from '../_shared/tokenService.ts';

interface OAuthStatePayload {
  uid: string;
  iat: number;
  nonce: string;
  redirect: string;
}

const fromBase64Url = (input: string): string => {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  return atob(padded);
};

const toBase64Url = (input: string): string =>
  btoa(input).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');

const timingSafeEqual = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
};

const hmacSign = async (message: string, secret: string): Promise<string> => {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return toBase64Url(String.fromCharCode(...new Uint8Array(signature)));
};

const verifyState = async (state: string): Promise<OAuthStatePayload> => {
  const [payloadEncoded, signature] = state.split('.');
  if (!payloadEncoded || !signature) {
    throw new Error('Invalid OAuth state');
  }

  const expected = await hmacSign(payloadEncoded, requireEnv('OAUTH_STATE_SECRET'));
  if (!timingSafeEqual(expected, signature)) {
    throw new Error('OAuth state signature mismatch');
  }

  const payload = JSON.parse(fromBase64Url(payloadEncoded)) as OAuthStatePayload;
  if (!payload.uid || !payload.redirect || !payload.iat) {
    throw new Error('OAuth state missing required fields');
  }

  const maxAgeMs = 10 * 60 * 1000;
  if (Date.now() - payload.iat > maxAgeMs) {
    throw new Error('OAuth state expired');
  }

  return payload;
};

const redirectWithError = (frontendUrl: string, message: string) => {
  const url = new URL('/connect', frontendUrl);
  url.searchParams.set('error', message);
  return Response.redirect(url.toString(), 302);
};

Deno.serve(async (request: Request) => {
  const requestId = crypto.randomUUID();

  try {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== 'GET') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const oauthError = url.searchParams.get('error_description') || url.searchParams.get('error');

    const fallbackFrontendUrl = requireEnv('FRONTEND_URL');
    if (oauthError) {
      return redirectWithError(fallbackFrontendUrl, oauthError);
    }
    if (!code || !state) {
      return redirectWithError(fallbackFrontendUrl, 'Instagram did not return an OAuth code');
    }

    const statePayload = await verifyState(state);
    const frontendUrl = statePayload.redirect || fallbackFrontendUrl;
    const callbackUrl = requireEnv('META_OAUTH_CALLBACK_URL');

    const shortToken = await exchangeIGCodeForShortLivedToken(code, callbackUrl);
    const longToken = await exchangeIGForLongLivedToken(shortToken.access_token);
    const igUser = await fetchIGUserInfo(longToken.access_token);

    const encryptedToken = await encryptTokenBundle({
      pageAccessToken: longToken.access_token,
      userAccessToken: longToken.access_token,
    });
    const expiresAt = new Date(Date.now() + longToken.expires_in * 1000).toISOString();

    const supabase = getSupabaseAdmin();
    const accountPayload = {
      user_id: statePayload.uid,
      page_id: igUser.id,
      instagram_user_id: igUser.id,
      access_token_encrypted: encryptedToken,
      token_expires_at: expiresAt,
      username: igUser.username,
      full_name: igUser.name ?? null,
      profile_picture_url: igUser.profile_picture_url ?? null,
      account_type: igUser.account_type === 'CREATOR' ? 'CREATOR' : 'BUSINESS',
      followers_count: igUser.followers_count ?? 0,
      media_count: igUser.media_count ?? 0,
      is_connected: true,
      updated_at: new Date().toISOString(),
    };

    const { data: updatedAccount, error: updateError } = await supabase
      .from('instagram_accounts')
      .update(accountPayload)
      .eq('instagram_user_id', igUser.id)
      .select('id')
      .maybeSingle();

    if (updateError) {
      throw new Error(`Failed updating Instagram account: ${updateError.message}`);
    }

    if (!updatedAccount) {
      const { error: insertError } = await supabase
        .from('instagram_accounts')
        .insert(accountPayload);

      if (insertError) {
        throw new Error(`Failed saving Instagram account: ${insertError.message}`);
      }
    }

    logInfo('Instagram OAuth callback completed', {
      requestId,
      userId: statePayload.uid,
      igId: igUser.id,
      username: igUser.username,
    });

    const successUrl = new URL('/connect/success', frontendUrl);
    successUrl.searchParams.set('username', igUser.username);
    return Response.redirect(successUrl.toString(), 302);
  } catch (error) {
    logError('OAuth callback failed', {
      requestId,
      error: error instanceof Error ? error.message : String(error),
    });

    const frontendUrl = Deno.env.get('FRONTEND_URL')?.trim() || 'http://localhost:5173';
    return redirectWithError(
      frontendUrl,
      error instanceof Error ? error.message : 'Unable to connect Instagram'
    );
  }
});
