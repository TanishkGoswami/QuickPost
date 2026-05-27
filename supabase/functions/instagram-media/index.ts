import {
  json,
  logError,
  logInfo,
  getAuthenticatedUser,
  getSupabaseAdmin,
  getInstagramAccount,
  corsHeaders,
} from '../_shared/db.ts';
import {
  fetchIGUserInfo,
  fetchInstagramMedia,
  fetchInstagramMediaInsights,
} from '../_shared/metaService.ts';
import { decryptTokenBundle } from '../_shared/tokenService.ts';

Deno.serve(async (request: Request) => {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const requestId = crypto.randomUUID();
  const functionName = 'instagram-media';

  try {
    // 1. Check method
    if (request.method !== 'POST') {
      return json(405, { error: 'Method not allowed' });
    }

    // 2. Authenticate user
    logInfo('Authenticating user', { requestId });
    const authHeader = request.headers.get('Authorization');
    const { user, error: authError } = await getAuthenticatedUser(authHeader);

    if (authError || !user) {
      logError('Auth failed', { requestId, error: authError });
      return json(401, { error: authError ?? 'Unauthorized' }, corsHeaders);
    }

    // 3. Get body
    const { instagramAccountId, limit = 30, targetMediaId } = await request.json();
    logInfo('Request body received', { requestId, instagramAccountId, limit, targetMediaId });

    if (!instagramAccountId) {
      return json(400, { error: 'Missing instagramAccountId' }, corsHeaders);
    }

    const supabase = getSupabaseAdmin();

    // 4. Fetch Instagram account from DB
    const { account, error: dbError } = await getInstagramAccount(
      supabase,
      user.id,
      instagramAccountId
    );

    if (dbError || !account) {
      logError('Account not found in DB', {
        requestId,
        userId: user.id,
        instagramAccountId,
        error: dbError,
      });
      return json(404, { error: 'Instagram account not found or access denied' }, corsHeaders);
    }

    logInfo('Account found, decrypting token', { requestId });

    // 5. Decrypt token bundle
    const tokenBundle = await decryptTokenBundle(account.access_token_encrypted);

    // 6. Fetch media from Instagram Graph API
    logInfo('Fetching media from Meta', { requestId, igUserId: account.instagram_user_id });
    const mediaResponse = await fetchInstagramMedia(
      account.instagram_user_id,
      tokenBundle.pageAccessToken,
      limit
    );
    const mediaItems = mediaResponse.data ?? [];
    let targetInsights: Awaited<ReturnType<typeof fetchInstagramMediaInsights>> | null = null;
    const insightTargetMediaId =
      targetMediaId ||
      [...mediaItems].sort(
        (a, b) => ((b.like_count ?? 0) + (b.comments_count ?? 0)) - ((a.like_count ?? 0) + (a.comments_count ?? 0))
      )[0]?.id;

    if (insightTargetMediaId) {
      targetInsights = await fetchInstagramMediaInsights(
        String(insightTargetMediaId),
        tokenBundle.pageAccessToken
      );
    }
    const accountInfo = await fetchIGUserInfo(tokenBundle.userAccessToken);

    await supabase
      .from('instagram_accounts')
      .update({
        followers_count: accountInfo.followers_count ?? account.followers_count ?? 0,
        media_count: accountInfo.media_count ?? account.media_count ?? 0,
        updated_at: new Date().toISOString(),
      })
      .eq('id', instagramAccountId)
      .eq('user_id', user.id);

    logInfo('Fetched Instagram media', {
      requestId,
      userId: user.id,
      instagramAccountId,
      mediaCount: mediaResponse.data?.length ?? 0,
    });

    return json(
      200,
      {
        media: mediaItems,
        targetInsights,
        insightTargetMediaId: insightTargetMediaId ?? null,
        account: {
          followers_count: accountInfo.followers_count ?? null,
          media_count: accountInfo.media_count ?? null,
        },
      },
      corsHeaders
    );
  } catch (error) {
    logError('instagram-media function failed', {
      requestId,
      functionName,
      error: error instanceof Error ? error.message : String(error),
    });

    return json(
      500,
      {
        error: 'Internal function error',
        message: error instanceof Error ? error.message : String(error),
      },
      corsHeaders
    );
  }
});
