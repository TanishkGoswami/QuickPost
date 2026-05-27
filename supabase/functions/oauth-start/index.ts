import { getAuthenticatedUser, json, logError, logInfo, requireEnv, corsHeaders } from '../_shared/db.ts';

const SCOPES = [
  'instagram_business_basic',
  'instagram_business_manage_messages',
  'instagram_business_manage_comments',
].join(',');

const toBase64Url = (input: string): string =>
  btoa(input).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');

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

Deno.serve(async (request: Request) => {
  const requestId = crypto.randomUUID();

  try {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (!['GET', 'POST'].includes(request.method)) {
      return json(405, { error: 'Method not allowed' }, corsHeaders);
    }

    const authHeader = request.headers.get('Authorization');
    const jwtSecretOverride = request.headers.get('x-jwt-secret');
    const { user, error } = await getAuthenticatedUser(authHeader, jwtSecretOverride);
    if (error || !user) {
      return json(401, { error: error ?? 'Unauthorized' }, corsHeaders);
    }

    const callbackUrl = requireEnv('META_OAUTH_CALLBACK_URL');
    const envFrontendUrl = requireEnv('FRONTEND_URL');
    const appId = requireEnv('IG_APP_ID');
    const stateSecret = requireEnv('OAUTH_STATE_SECRET');

    // Prefer the frontend URL sent by the browser (supports both live & ngrok).
    // Fall back to the environment variable if not provided.
    let bodyFrontendUrl: string | undefined;
    if (request.method === 'POST') {
      try {
        const body = await request.json();
        if (body?.frontendUrl && typeof body.frontendUrl === 'string') {
          bodyFrontendUrl = body.frontendUrl;
        }
      } catch {
        // ignore JSON parse errors — body is optional
      }
    }
    const frontendUrl = bodyFrontendUrl ?? envFrontendUrl;

    const statePayload = {
      uid: user.id,
      iat: Date.now(),
      nonce: crypto.randomUUID(),
      redirect: frontendUrl,
    };

    const payloadEncoded = toBase64Url(JSON.stringify(statePayload));
    const signature = await hmacSign(payloadEncoded, stateSecret);
    const state = `${payloadEncoded}.${signature}`;

    const authUrl = new URL('https://www.instagram.com/oauth/authorize');
    authUrl.searchParams.set('client_id', appId);
    authUrl.searchParams.set('redirect_uri', callbackUrl);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', SCOPES);

    logInfo('OAuth start generated', {
      requestId,
      userId: user.id,
    });

    if (request.method === 'GET') {
      return Response.redirect(authUrl.toString(), 302);
    }

    return json(
      200,
      {
        redirectTo: authUrl.toString(),
        state,
      },
      corsHeaders
    );
  } catch (error) {
    logError('OAuth start failed', {
      requestId,
      error: error instanceof Error ? error.message : String(error),
    });
    return json(500, { error: 'Unable to start OAuth flow' }, corsHeaders);
  }
});
