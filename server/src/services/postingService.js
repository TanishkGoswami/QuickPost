import fs from 'fs';
import { getTokensForUser } from './supabase.js';
import { postToInstagram, postImageToInstagram, postCarouselToInstagram, postStoryToInstagram } from './instagram.js';
import { postToYouTube, setVideoThumbnail } from './youtube.js';
import { postToPinterest } from './pinterest.js';
import { postFacebookReel, postFacebookStory, postToFacebook, postVideoToFacebook } from './facebook.js';
import { postToBluesky } from './bluesky.js';
import { postToLinkedIn } from './linkedin.js';
import mastodon from './mastodon.js';
import { postToThreads } from './threads.js';
import { broadcastToX } from './x.js';
import { postToReddit } from './reddit.js';
import { postToGoogleBusiness } from './googleBusiness.js';
import googleOAuth from './googleOAuth.js';
import googleBusinessOAuth from './googleBusinessOAuth.js';
import { updateBroadcastResults } from './broadcasts.js';
import { resolveMentions } from './mentions.js';
import { createOrUpdateComposerAutomation } from './autodm.js';
import { getValidInstagramTokensForPosting, isInstagramAuthError } from './instagramToken.js';
import { decryptToken } from './instapilot.js';
import { resolveInstagramPublishChannels } from '../utils/instagramChannels.js';
import { resolvePublishPostType } from '../utils/postType.js';

/**
 * Core function to broadcast to platforms
 */
export async function executeBroadcast(broadcastId, userId, caption, mediaUrls, filePaths, channels, platData, mediaType) {
  try {
    const tokens = await getTokensForUser(userId);
    const isVideo = mediaType === 'video';
    const primaryMediaUrl = mediaUrls[0];
    const hasInstagramChannel = (channels || []).some((channel) =>
      channel === 'instagram' || String(channel).startsWith('instagram:')
    );
    const instagramPostType = resolvePublishPostType({
      hasInstagramChannel,
      postType: platData?.postType,
      platformData: platData,
    });

    // Detect videos and images from filePaths/mediaUrls
    // This is a bit tricky if we only have URLs. For scheduled posts, we might need to download them or keep local paths.
    // For now, let's assume filePaths are available if needed.

    const videos = filePaths.filter(p => p.includes('video-'));
    const images = filePaths.filter(p => p.includes('image-'));
    
    // Find cover image (first image in the set, if any)
    let coverImageUrl = null;
    let coverImagePath = null;
    const firstImageIdx = filePaths.findIndex(p => p.includes('image-'));
    if (firstImageIdx !== -1) {
      coverImageUrl = mediaUrls[firstImageIdx];
      coverImagePath = filePaths[firstImageIdx];
    }

    const results = { mediaUrl: primaryMediaUrl, mediaUrls: mediaUrls };
    let platformPromises = [];

    // Pinterest
    if (channels.includes('pinterest') && tokens.pinterest) {
      const resolvedCaption = resolveMentions(platData?.pinterest?.title || caption, 'pinterest', tokens.pinterest);
      platformPromises.push(
        postToPinterest(primaryMediaUrl, resolvedCaption, tokens.pinterest, platData?.pinterest?.link, platData?.pinterest?.boardId)
          .then(result => ({ platform: 'pinterest', result }))
      );
    }
    
    // Instagram
    const instagramChannels = resolveInstagramPublishChannels(channels, tokens.instagramAccounts || []);
    if (instagramChannels.length > 0 && (tokens.instagram || tokens.instagramAccounts?.length > 0)) {
      const postedBusinessIds = new Set();
      
      for (const igChannel of instagramChannels) {
        let currentTokens;
        let platformKey = igChannel;
        
        if (igChannel === 'instagram') {
          currentTokens = tokens.instagram;
        } else {
          const accountId = igChannel.split(':')[1];
          const igAccount = tokens.instagramAccounts?.find(acc => acc.id === accountId);
          if (igAccount && igAccount.access_token_encrypted) {
            try {
              const decrypted = decryptToken(igAccount.access_token_encrypted);
              currentTokens = {
                accessToken: decrypted.pageAccessToken || decrypted.userAccessToken,
                businessId: igAccount.instagram_business_account_id,
                pageId: igAccount.page_id,
                tokenExpiry: igAccount.token_expires_at,
                username: igAccount.instagram_username
              };
            } catch (err) {
              console.error(`Failed to decrypt token for IG account ${accountId}:`, err);
            }
          }
        }

        if (currentTokens) {
          if (currentTokens.businessId) {
            if (postedBusinessIds.has(currentTokens.businessId)) continue;
            postedBusinessIds.add(currentTokens.businessId);
          }
          const freshInstagramTokens = await getValidInstagramTokensForPosting(userId, currentTokens);
          const resolvedCaption = resolveMentions(caption, 'instagram', freshInstagramTokens);
          let instagramAction;
          if (instagramPostType === 'story') {
            const storyUrl = isVideo
              ? mediaUrls[filePaths.findIndex(p => p.includes('video-'))] || primaryMediaUrl
              : primaryMediaUrl;
            instagramAction = postStoryToInstagram(storyUrl, resolvedCaption, freshInstagramTokens, mediaType, null, platData?.instagramAspectRatio);
          } else if (mediaUrls.length > 1) {
            instagramAction = postCarouselToInstagram(mediaUrls, resolvedCaption, freshInstagramTokens, platData?.instagramAspectRatio);
          } else if (isVideo) {
            const igTokens = { ...freshInstagramTokens, coverUrl: coverImageUrl };
            const videoUrl = mediaUrls[filePaths.findIndex(p => p.includes('video-'))] || primaryMediaUrl;
            instagramAction = postToInstagram(videoUrl, resolvedCaption, igTokens, null, platData?.instagramAspectRatio);
          } else {
            instagramAction = postImageToInstagram(primaryMediaUrl, resolvedCaption, freshInstagramTokens, platData?.instagramAspectRatio);
          }
          platformPromises.push(instagramAction.then(result => ({ platform: platformKey, result })));
        }
      }
    }

    // Facebook
    if (channels.includes('facebook') && tokens.facebook?.pageId) {
      const resolvedCaption = resolveMentions(caption, 'facebook', tokens.facebook);
      const videoUrl = mediaUrls[filePaths.findIndex(p => p.includes('video-'))] || primaryMediaUrl;
      const fbAction = instagramPostType === 'story'
        ? postFacebookStory(tokens.facebook.accessToken, tokens.facebook.pageId, resolvedCaption, isVideo ? videoUrl : primaryMediaUrl, mediaType)
        : instagramPostType === 'reel'
          ? postFacebookReel(tokens.facebook.accessToken, tokens.facebook.pageId, resolvedCaption, videoUrl)
          : isVideo
            ? postVideoToFacebook(tokens.facebook.accessToken, tokens.facebook.pageId, resolvedCaption, videoUrl, coverImageUrl)
            : postToFacebook(tokens.facebook.accessToken, tokens.facebook.pageId, resolvedCaption, mediaUrls);
      platformPromises.push(fbAction.then(result => ({ platform: 'facebook', result })));
    }

    // LinkedIn
    if (channels.includes('linkedin') && tokens.linkedin) {
      const resolvedCaption = resolveMentions(caption, 'linkedin', tokens.linkedin);
      platformPromises.push(
        postToLinkedIn(mediaUrls, resolvedCaption, tokens.linkedin)
          .then(result => ({ platform: 'linkedin', result }))
      );
    }

    // Bluesky
    if (channels.includes('bluesky') && tokens.bluesky?.did) {
      const resolvedCaption = resolveMentions(caption, 'bluesky', tokens.bluesky);
      const blobs = filePaths.map(p => fs.existsSync(p) ? fs.readFileSync(p) : null).filter(Boolean);
      platformPromises.push(
        postToBluesky(tokens.bluesky.accessToken, tokens.bluesky.did, resolvedCaption, mediaUrls, blobs, isVideo)
          .then(result => ({ platform: 'bluesky', result }))
      );
    }

    // X
    if (channels.includes('x') && tokens.x) {
      const resolvedCaption = resolveMentions(caption, 'x', tokens.x);
      platformPromises.push(
        broadcastToX(resolvedCaption, mediaUrls, tokens.x, userId)
          .then(result => ({ platform: 'x', result }))
      );
    }

    // YouTube — always refresh the Google token before posting
    // Google access tokens expire after 1 hour; scheduled posts may fire much later
    if (channels.includes('youtube') && isVideo && tokens.youtube) {
      const primaryVideoPath = filePaths.find(p => p.includes('video-'));
      if (primaryVideoPath && fs.existsSync(primaryVideoPath)) {
        platformPromises.push(
          (async () => {
            // Refresh token right before posting (BUG 4 FIX)
            let ytTokens = tokens.youtube;
            try {
              const freshAccessToken = await googleOAuth.getValidAccessToken(userId);
              ytTokens = { ...tokens.youtube, accessToken: freshAccessToken };
            } catch (tokenErr) {
              console.warn(`⚠️ [postingService] Could not refresh YouTube token: ${tokenErr.message}. Using stored token.`);
            }
            return postToYouTube(primaryVideoPath, resolveMentions(caption, 'youtube', ytTokens), ytTokens)
              .then(async result => {
                if (result.success && result.mediaId && coverImagePath && fs.existsSync(coverImagePath)) {
                  await setVideoThumbnail(result.mediaId, coverImagePath, ytTokens);
                }
                return { platform: 'youtube', result };
              });
          })()
        );
      } else {
        console.warn(`⚠️ [postingService] YouTube video file not found at expected path. Skipping YouTube.`);
      }
    }
    


    // Mastodon
    if (channels.includes('mastodon') && tokens.mastodon) {
      const resolvedCaption = resolveMentions(caption, 'mastodon', tokens.mastodon);
      platformPromises.push(
        mastodon.postStatus(tokens.mastodon.accessToken, tokens.mastodon.instanceUrl, resolvedCaption, filePaths.filter(p => fs.existsSync(p)))
          .then(result => ({ platform: 'mastodon', result }))
      );
    }

    // Reddit
    if (channels.includes('reddit') && tokens.reddit) {
      const resolvedCaption = resolveMentions(caption, 'reddit', tokens.reddit);
      platformPromises.push(
        postToReddit(userId, resolvedCaption, primaryMediaUrl, tokens.reddit, platData?.reddit)
          .then(result => ({ platform: 'reddit', result }))
      );
    }
    
    // Google Business Profile
    if (channels.includes('googleBusiness') && tokens.googleBusiness) {
      const resolvedCaption = resolveMentions(caption, 'googleBusiness', tokens.googleBusiness);
      platformPromises.push(
        (async () => {
          let gbpTokens = tokens.googleBusiness;
          try {
            const freshAccessToken = await googleBusinessOAuth.getValidAccessToken(userId);
            gbpTokens = { ...tokens.googleBusiness, accessToken: freshAccessToken };
          } catch (tokenErr) {
            console.warn(`⚠️ [postingService] Could not refresh GBP token: ${tokenErr.message}. Using stored token.`);
          }
          return postToGoogleBusiness(resolvedCaption, mediaUrls, gbpTokens, platData?.googleBusiness)
            .then(result => ({ platform: 'googleBusiness', result }));
        })()
      );
    }

    // Threads — supports single image, single video, and carousel (mixed images+videos)
    if (channels.includes('threads') && tokens.threads) {
      const resolvedCaption = resolveMentions(caption, 'threads', tokens.threads);

      // Build mediaItems array: [{url, type}] — one entry per uploaded file
      const threadsMediaItems = mediaUrls.map((url, idx) => ({
        url,
        type: filePaths[idx]?.includes('video-') ? 'video' : 'image',
      }));

      platformPromises.push(
        postToThreads(
          tokens.threads.accessToken,
          tokens.threads.account_id,
          resolvedCaption,
          mediaUrls[0],   // fallback single url
          mediaType,
          threadsMediaItems // full list for carousel detection
        ).then(result => ({ platform: 'threads', result }))
      );
    }

    // Broadcast concurrently
    if (platformPromises.length === 0) {
      const message = 'No publishable platforms were resolved. Reconnect/select the target account and try again.';
      await updateBroadcastResults(broadcastId, { ...results, unknown: { success: false, error: message } }, 'failed');
      throw new Error(message);
    }

    const platformResults = await Promise.allSettled(platformPromises);
    for (const promiseResult of platformResults) {
      if (promiseResult.status === 'fulfilled') {
        const { platform, result } = promiseResult.value;
        results[platform] = result;
      } else {
        results.unknown = {
          success: false,
          error: promiseResult.reason?.message || String(promiseResult.reason),
        };
      }
    }
    const instagramResults = Object.entries(results)
      .filter(([platform]) => platform === 'instagram' || platform.startsWith('instagram:'))
      .map(([, result]) => result);
    if (instagramResults.length > 0) {
      results.instagram = instagramResults.find((result) => result?.success) || instagramResults[0];
      results.instagramAccounts = instagramResults;
    }

    const failedPlatformEntries = Object.entries(results)
      .filter(([platform, result]) =>
        !['mediaUrl', 'mediaUrls', 'instagramAccounts'].includes(platform) &&
        !(platform === 'instagram' && results.instagramAccounts) &&
        result?.success === false
      )
      .map(([platform, result]) => ({
        platform,
        error: result.error || 'Unknown error',
      }));
    const failedPlatforms = failedPlatformEntries.map((failure) => `${failure.platform}: ${failure.error}`);

    if (failedPlatforms.length > 0) {
      const status = failedPlatforms.length === platformPromises.length ? 'failed' : 'sent';
      await updateBroadcastResults(broadcastId, results, status);
      const requiresReconnect = failedPlatformEntries.some((failure) =>
        (failure.platform === 'instagram' || failure.platform.startsWith('instagram:')) && isInstagramAuthError(failure.error)
      );
      const error = new Error(
        `${requiresReconnect ? 'REAUTH_REQUIRED: ' : ''}Platform publishing failed - ${failedPlatforms.join(' | ')}`
      );
      if (requiresReconnect) {
        error.code = 'REAUTH_REQUIRED';
        error.statusCode = 401;
      }
      throw error;
    }

    // Update DB with results
    await updateBroadcastResults(broadcastId, results, 'sent');

    if (platData?.autoDMConfig?.enabled && instagramPostType !== 'story' && results.instagram?.success) {
      try {
        await createOrUpdateComposerAutomation({
          user: { userId },
          config: platData.autoDMConfig,
          publication: {
            success: true,
            mediaId: results.instagram.mediaId,
            permalink: results.instagram.url || results.instagram.permalink,
            mediaUrl: primaryMediaUrl,
            thumbnailUrl: results.thumbnailUrl || primaryMediaUrl,
            mediaType,
          },
          sourceBroadcastId: broadcastId,
          sourceJobId: broadcastId,
        });
      } catch (autoDMError) {
        console.error(`⚠️ Auto DM binding failed for scheduled broadcast ${broadcastId}:`, autoDMError.message);
      }
    }

    // Cleanup files if needed (scheduler might handle this)
    return results;

  } catch (error) {
    console.error(`❌ executeBroadcast error for ${broadcastId}:`, error);
    await updateBroadcastResults(broadcastId, { error: error.message }, 'failed');
    throw error;
  }
}
