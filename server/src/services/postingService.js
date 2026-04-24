import fs from 'fs';
import { getTokensForUser } from './supabase.js';
import { postToInstagram, postImageToInstagram, postCarouselToInstagram } from './instagram.js';
import { postToYouTube, setVideoThumbnail } from './youtube.js';
import { postToPinterest } from './pinterest.js';
import { postToFacebook, postVideoToFacebook } from './facebook.js';
import { postToBluesky } from './bluesky.js';
import { postToLinkedIn } from './linkedin.js';
import mastodon from './mastodon.js';
import { postToThreads } from './threads.js';
import { broadcastToX } from './x.js';
import { postToReddit } from './reddit.js';
import googleOAuth from './googleOAuth.js';
import { updateBroadcastResults } from './broadcasts.js';
import { resolveMentions } from './mentions.js';

/**
 * Core function to broadcast to platforms
 */
export async function executeBroadcast(broadcastId, userId, caption, mediaUrls, filePaths, channels, platData, mediaType) {
  try {
    const tokens = await getTokensForUser(userId);
    const isVideo = mediaType === 'video';
    const primaryMediaUrl = mediaUrls[0];

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
    if (channels.includes('instagram') && tokens.instagram) {
      const resolvedCaption = resolveMentions(caption, 'instagram', tokens.instagram);
      let instagramAction;
      if (mediaUrls.length > 1 && !isVideo) {
        instagramAction = postCarouselToInstagram(mediaUrls, resolvedCaption, tokens.instagram);
      } else if (isVideo) {
        const igTokens = { ...tokens.instagram, coverUrl: coverImageUrl };
        const videoUrl = mediaUrls[filePaths.findIndex(p => p.includes('video-'))] || primaryMediaUrl;
        instagramAction = postToInstagram(videoUrl, resolvedCaption, igTokens);
      } else {
        instagramAction = postImageToInstagram(primaryMediaUrl, resolvedCaption, tokens.instagram);
      }
      platformPromises.push(instagramAction.then(result => ({ platform: 'instagram', result })));
    }

    // Facebook
    if (channels.includes('facebook') && tokens.facebook?.pageId) {
      const resolvedCaption = resolveMentions(caption, 'facebook', tokens.facebook);
      const fbAction = isVideo
        ? postVideoToFacebook(tokens.facebook.accessToken, tokens.facebook.pageId, resolvedCaption, mediaUrls[filePaths.findIndex(p => p.includes('video-'))] || primaryMediaUrl, coverImageUrl)
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
    const platformResults = await Promise.allSettled(platformPromises);
    for (const promiseResult of platformResults) {
      if (promiseResult.status === 'fulfilled') {
        const { platform, result } = promiseResult.value;
        results[platform] = result;
      }
    }

    // Update DB with results
    await updateBroadcastResults(broadcastId, results, 'sent');

    // Cleanup files if needed (scheduler might handle this)
    return results;

  } catch (error) {
    console.error(`❌ executeBroadcast error for ${broadcastId}:`, error);
    await updateBroadcastResults(broadcastId, { error: error.message }, 'failed');
    throw error;
  }
}
