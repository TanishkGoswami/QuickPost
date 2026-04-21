import fs from 'fs';
import { getTokensForUser } from './supabase.js';
import { postToInstagram, postImageToInstagram, postCarouselToInstagram } from './instagram.js';
import { postToYouTube, setVideoThumbnail } from './youtube.js';
import { postToPinterest } from './pinterest.js';
import { postToFacebook, postVideoToFacebook } from './facebook.js';
import { postToBluesky } from './bluesky.js';
import { postToLinkedIn } from './linkedin.js';
import mastodon from './mastodon.js';
import tiktok from './tiktok.js';
import { postToThreads } from './threads.js';
import { broadcastToX } from './x.js';
import { postToReddit } from './reddit.js';
import { updateBroadcastResults } from './broadcasts.js';

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
      platformPromises.push(
        postToPinterest(primaryMediaUrl, platData?.pinterest?.title || caption, tokens.pinterest, platData?.pinterest?.link, platData?.pinterest?.boardId)
          .then(result => ({ platform: 'pinterest', result }))
      );
    }
    
    // Instagram
    if (channels.includes('instagram') && tokens.instagram) {
      let instagramAction;
      if (mediaUrls.length > 1 && !isVideo) {
        instagramAction = postCarouselToInstagram(mediaUrls, caption, tokens.instagram);
      } else if (isVideo) {
        const igTokens = { ...tokens.instagram, coverUrl: coverImageUrl };
        const videoUrl = mediaUrls[filePaths.findIndex(p => p.includes('video-'))] || primaryMediaUrl;
        instagramAction = postToInstagram(videoUrl, caption, igTokens);
      } else {
        instagramAction = postImageToInstagram(primaryMediaUrl, caption, tokens.instagram);
      }
      platformPromises.push(instagramAction.then(result => ({ platform: 'instagram', result })));
    }

    // Facebook
    if (channels.includes('facebook') && tokens.facebook?.pageId) {
      const fbAction = isVideo
        ? postVideoToFacebook(tokens.facebook.accessToken, tokens.facebook.pageId, caption, mediaUrls[filePaths.findIndex(p => p.includes('video-'))] || primaryMediaUrl, coverImageUrl)
        : postToFacebook(tokens.facebook.accessToken, tokens.facebook.pageId, caption, mediaUrls);
      platformPromises.push(fbAction.then(result => ({ platform: 'facebook', result })));
    }

    // LinkedIn
    if (channels.includes('linkedin') && tokens.linkedin) {
      platformPromises.push(
        postToLinkedIn(mediaUrls, caption, tokens.linkedin)
          .then(result => ({ platform: 'linkedin', result }))
      );
    }

    // Bluesky
    if (channels.includes('bluesky') && tokens.bluesky?.did) {
      const blobs = filePaths.map(p => fs.existsSync(p) ? fs.readFileSync(p) : null).filter(Boolean);
      platformPromises.push(
        postToBluesky(tokens.bluesky.accessToken, tokens.bluesky.did, caption, mediaUrls, blobs, isVideo)
          .then(result => ({ platform: 'bluesky', result }))
      );
    }

    // X
    if (channels.includes('x') && tokens.x) {
      platformPromises.push(
        broadcastToX(caption, mediaUrls, tokens.x, userId)
          .then(result => ({ platform: 'x', result }))
      );
    }

    // YouTube
    if (channels.includes('youtube') && isVideo && tokens.youtube) {
      const primaryVideoPath = filePaths.find(p => p.includes('video-'));
      if (primaryVideoPath && fs.existsSync(primaryVideoPath)) {
        platformPromises.push(
          postToYouTube(primaryVideoPath, caption, tokens.youtube)
            .then(async result => {
              if (result.success && result.mediaId && coverImagePath && fs.existsSync(coverImagePath)) {
                await setVideoThumbnail(result.mediaId, coverImagePath, tokens.youtube);
              }
              return { platform: 'youtube', result };
            })
        );
      }
    }
    
    // TikTok
    if (channels.includes('tiktok') && tokens.tiktok) {
      const primaryVideoPath = filePaths.find(p => p.includes('video-'));
      if (primaryVideoPath && fs.existsSync(primaryVideoPath)) {
        platformPromises.push(
          tiktok.publishVideo(tokens.tiktok.accessToken, primaryVideoPath, caption)
            .then(result => ({ platform: 'tiktok', result }))
        );
      }
    }

    // Mastodon
    if (channels.includes('mastodon') && tokens.mastodon) {
      platformPromises.push(
        mastodon.postStatus(tokens.mastodon.accessToken, tokens.mastodon.instanceUrl, caption, filePaths.filter(p => fs.existsSync(p)))
          .then(result => ({ platform: 'mastodon', result }))
      );
    }

    // Reddit
    if (channels.includes('reddit') && tokens.reddit) {
      platformPromises.push(
        postToReddit(userId, caption, primaryMediaUrl, tokens.reddit, platData?.reddit)
          .then(result => ({ platform: 'reddit', result }))
      );
    }
    
    // Threads
    if (channels.includes('threads') && tokens.threads) {
      platformPromises.push(
        postToThreads(tokens.threads.accessToken, tokens.threads.account_id, caption, primaryMediaUrl, mediaType)
          .then(result => ({ platform: 'threads', result }))
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
