import express from 'express';
import { upload, handleUploadError } from '../middleware/upload.js';
import { getTokensForUser } from '../services/supabase.js';
import { postToInstagram, postImageToInstagram } from '../services/instagram.js';
import { postToYouTube, setVideoThumbnail } from '../services/youtube.js';
import { postToPinterest } from '../services/pinterest.js';
import { postToFacebook, postVideoToFacebook } from '../services/facebook.js';
import { postToBluesky } from '../services/bluesky.js';
import { postToLinkedIn } from '../services/linkedin.js';
import mastodon from '../services/mastodon.js';
import tiktok from '../services/tiktok.js';
import { postToThreads } from '../services/threads.js';
import { broadcastToX } from '../services/x.js';
import { postToReddit } from '../services/reddit.js';
import { authenticateUser } from '../middleware/authenticateUser.js';
import { saveBroadcast } from '../services/broadcasts.js';
import { uploadToCloudinary, isCloudinaryConfigured } from '../services/cloudinary.js';
import fs from 'fs';
import path from 'path';

const router = express.Router();

/**
 * POST /api/broadcast
 * Universal endpoint for broadcasting images or videos to appropriate platforms
 * @protected Requires authentication
 */
router.post('/broadcast', authenticateUser, upload.array('media', 10), handleUploadError, async (req, res) => {
  let uploadedFiles = [];

  try {
    // Validate request
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No media files uploaded'
      });
    }

    const { caption, selectedChannels, platformData } = req.body;
    const userId = req.user.userId;

    const channels = typeof selectedChannels === 'string' ? JSON.parse(selectedChannels) : selectedChannels;
    const platData = typeof platformData === 'string' ? JSON.parse(platformData) : platformData;

    uploadedFiles = req.files;
    const filenames = uploadedFiles.map(f => f.filename);
    const filePaths = uploadedFiles.map(f => f.path);
    
    // Improved media detection for mixed sets
    const videos = uploadedFiles.filter(f => f.mimetype.startsWith('video/'));
    const images = uploadedFiles.filter(f => f.mimetype.startsWith('image/'));
    
    const isVideo = videos.length > 0;
    const mediaType = isVideo ? 'video' : 'image';
    
    // Main video info
    const primaryVideoPath = videos.length > 0 ? videos[0].path : null;
    const primaryVideoFilename = videos.length > 0 ? videos[0].filename : null;

    console.log(`\n🚀 Broadcasting ${uploadedFiles.length} ${mediaType}(s) for user: ${userId}`);

    const tokens = await getTokensForUser(userId);

    // Upload all to Cloudinary
    let mediaUrls = [];
    if (isCloudinaryConfigured()) {
      console.log(`\n☁️  Uploading ${uploadedFiles.length} files to Cloudinary...`);
      const uploadPromises = filePaths.map(path => uploadToCloudinary(path, isVideo ? 'video' : 'image'));
      const uploadResults = await Promise.all(uploadPromises);
      mediaUrls = uploadResults.map(r => r.url);
      console.log(`✓ All files uploaded. URLs:`, mediaUrls);
    } else {
      const serverPublicUrl = process.env.SERVER_PUBLIC_URL || 'http://localhost:5000';
      mediaUrls = filenames.map(name => `${serverPublicUrl}/uploads/${name}`);
    }

    const primaryMediaUrl = mediaUrls[0];
    
    // Find cover image (first image in the set, if any)
    let coverImageUrl = null;
    let coverImagePath = null;
    
    const firstImageIdx = uploadedFiles.findIndex(f => f.mimetype.startsWith('image/'));
    if (firstImageIdx !== -1) {
      coverImageUrl = mediaUrls[firstImageIdx];
      coverImagePath = filePaths[firstImageIdx];
    }

    const results = { mediaUrl: primaryMediaUrl, mediaUrls: mediaUrls };
    let platformPromises = [];

    // Pinterest
    if (channels.includes('pinterest')) {
      if (tokens.pinterest) {
        platformPromises.push(
          postToPinterest(primaryMediaUrl, platData?.pinterest?.title || caption, tokens.pinterest, platData?.pinterest?.link, platData?.pinterest?.boardId)
            .then(result => ({ platform: 'pinterest', result }))
        );
      }
    }
    
    // Instagram (Single or Carousel or Reels)
    if (channels.includes('instagram')) {
      if (tokens.instagram) {
        let instagramAction;
        if (mediaUrls.length > 1 && !isVideo) {
          // Carousel of images
          instagramAction = postCarouselToInstagram(mediaUrls, caption, tokens.instagram);
        } else if (isVideo) {
          // Video/Reels with potential cover
          const igTokens = { ...tokens.instagram, coverUrl: coverImageUrl };
          instagramAction = postToInstagram(mediaUrls[uploadedFiles.findIndex(f => f.mimetype.startsWith('video/'))], caption, igTokens);
        } else {
          // Single image
          instagramAction = postImageToInstagram(primaryMediaUrl, caption, tokens.instagram);
        }
        
        platformPromises.push(instagramAction.then(result => ({ platform: 'instagram', result })));
      }
    }

    // Facebook (Single or Multi-photo)
    if (channels.includes('facebook')) {
      if (tokens.facebook && tokens.facebook.pageId) {
        const fbAction = isVideo
          ? postVideoToFacebook(tokens.facebook.accessToken, tokens.facebook.pageId, caption, mediaUrls[uploadedFiles.findIndex(f => f.mimetype.startsWith('video/'))], coverImageUrl)
          : postToFacebook(tokens.facebook.accessToken, tokens.facebook.pageId, caption, mediaUrls);
          
        platformPromises.push(fbAction.then(result => ({ platform: 'facebook', result })));
      }
    }

    // LinkedIn (Single or Multi-image)
    if (channels.includes('linkedin')) {
      if (tokens.linkedin) {
        platformPromises.push(
          postToLinkedIn(mediaUrls, caption, tokens.linkedin)
            .then(result => ({ platform: 'linkedin', result }))
        );
      }
    }

    // Bluesky (Supports up to 4 images)
    if (channels.includes('bluesky')) {
      if (tokens.bluesky && tokens.bluesky.did) {
        const blobs = filePaths.map(p => fs.readFileSync(p));
        platformPromises.push(
          postToBluesky(tokens.bluesky.accessToken, tokens.bluesky.did, caption, mediaUrls, blobs, isVideo)
            .then(result => ({ platform: 'bluesky', result }))
        );
      }
    }

    // X (Already supports array)
    if (channels.includes('x')) {
      if (tokens.x) {
        platformPromises.push(
          broadcastToX(caption, mediaUrls, tokens.x, userId)
            .then(result => ({ platform: 'x', result }))
        );
      }
    }

    // ... handle other platforms (fallback to primary image for now) ...
    // YouTube
    if (channels.includes('youtube')) {
      if (isVideo && tokens.youtube && primaryVideoPath) {
        platformPromises.push(
          postToYouTube(primaryVideoPath, caption, tokens.youtube)
            .then(async result => {
              if (result.success && result.mediaId && coverImagePath) {
                console.log(`🎬 Video uploaded to YouTube. Setting thumbnail...`);
                await setVideoThumbnail(result.mediaId, coverImagePath, tokens.youtube);
              }
              return { platform: 'youtube', result };
            })
        );
      }
    }
    
    // TikTok
    if (channels.includes('tiktok')) {
      if (tokens.tiktok && primaryVideoPath) {
        platformPromises.push(
          tiktok.publishVideo(tokens.tiktok.accessToken, primaryVideoPath, caption)
            .then(result => ({ platform: 'tiktok', result }))
        );
      }
    }

    // Mastodon
    if (channels.includes('mastodon')) {
      if (tokens.mastodon) {
        platformPromises.push(
          mastodon.postStatus(tokens.mastodon.accessToken, tokens.mastodon.instanceUrl, caption, filePaths)
            .then(result => ({ platform: 'mastodon', result }))
        );
      }
    }

    // Reddit
    if (channels.includes('reddit')) {
      if (tokens.reddit) {
        platformPromises.push(
          postToReddit(userId, caption, primaryMediaUrl, tokens.reddit, platData?.reddit)
            .then(result => ({ platform: 'reddit', result }))
        );
      }
    }
    
    // Threads
    if (channels.includes('threads')) {
      if (tokens.threads) {
        platformPromises.push(
          postToThreads(tokens.threads.accessToken, tokens.threads.account_id, caption, primaryMediaUrl, mediaType)
            .then(result => ({ platform: 'threads', result }))
        );
      }
    }

    // Broadcast concurrently
    const platformResults = await Promise.allSettled(platformPromises);
    for (const promiseResult of platformResults) {
      if (promiseResult.status === 'fulfilled') {
        const { platform, result } = promiseResult.value;
        results[platform] = result;
      }
    }

    // Save to DB
    await saveBroadcast(userId, caption, filenames, results, mediaType, platData);

    // Cleanup
    setTimeout(() => {
      filePaths.forEach(p => {
        if (fs.existsSync(p)) fs.unlinkSync(p);
      });
    }, 5000);

    return res.status(200).json({ success: true, results });

  } catch (error) {
    console.error('❌ Broadcast error:', error);
    return res.status(500).json({ success: false, error: 'Broadcasting failed', message: error.message });
  }
});

export default router;
