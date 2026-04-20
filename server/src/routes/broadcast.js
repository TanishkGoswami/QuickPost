import express from 'express';
import { upload, handleUploadError } from '../middleware/upload.js';
import { getTokensForUser } from '../services/supabase.js';
import { postToInstagram, postImageToInstagram } from '../services/instagram.js';
import { postToYouTube } from '../services/youtube.js';
import { postToPinterest } from '../services/pinterest.js';
import { postToFacebook } from '../services/facebook.js';
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
router.post('/broadcast', authenticateUser, upload.single('media'), handleUploadError, async (req, res) => {
  let uploadedFilePath = null;

  try {
    // Validate request
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No media file uploaded'
      });
    }

    const { caption, selectedChannels, platformData } = req.body;
    const userId = req.user.userId;

    // Parse JSON strings if needed
    const channels = typeof selectedChannels === 'string' ? JSON.parse(selectedChannels) : selectedChannels;
    const platData = typeof platformData === 'string' ? JSON.parse(platformData) : platformData;

    uploadedFilePath = req.file.path;
    
    // Detect media type
    const isVideo = req.file.mimetype.startsWith('video/');
    const isImage = req.file.mimetype.startsWith('image/');
    const mediaType = isVideo ? 'video' : 'image';

    console.log(`\n🚀 Broadcasting ${mediaType} for user: ${userId}`);
    console.log(`📁 File: ${req.file.filename} (${(req.file.size / 1024 / 1024).toFixed(2)}MB)`);
    console.log(`📝 Caption: ${caption || '(no caption)'}`);
    console.log(`📊 Media type: ${mediaType.toUpperCase()}`);
    console.log(`🎯 Selected channels:`, channels);

    // Fetch user's social media tokens
    console.log('\n🔑 Fetching user tokens from Supabase...');
    const tokens = await getTokensForUser(userId);

    // Upload to Cloudinary for public URL (required by Instagram/Pinterest)
    let mediaUrl;
    if (isCloudinaryConfigured()) {
      console.log('\n☁️  Uploading to Cloudinary for public access...');
      const cloudinaryResult = await uploadToCloudinary(
        uploadedFilePath,
        isVideo ? 'video' : 'image'
      );
      mediaUrl = cloudinaryResult.url;
      console.log(`✓ Cloudinary URL: ${mediaUrl}`);
    } else {
      console.log('\n⚠️  Cloudinary not configured, using local URL (Instagram/Pinterest will fail)');
      const serverPublicUrl = process.env.SERVER_PUBLIC_URL || 'http://localhost:5000';
      mediaUrl = `${serverPublicUrl}/uploads/${req.file.filename}`;
    }

    // Build platform promises based on selected channels
    let platformPromises = [];
    let results = {
      youtube: { success: false, platform: 'YouTube', error: 'Not selected' },
      instagram: { success: false, platform: 'Instagram', error: 'Not selected' },
      pinterest: { success: false, platform: 'Pinterest', error: 'Not selected' },
      facebook: { success: false, platform: 'Facebook', error: 'Not selected' },
      bluesky: { success: false, platform: 'Bluesky', error: 'Not selected' },
      linkedin: { success: false, platform: 'LinkedIn', error: 'Not selected' },
      mastodon: { success: false, platform: 'Mastodon', error: 'Not selected' },
      tiktok: { success: false, platform: 'TikTok', error: 'Not selected' },
      threads: { success: false, platform: 'Threads', error: 'Not selected' },
      x: { success: false, platform: 'X', error: 'Not selected' },
      reddit: { success: false, platform: 'Reddit', error: 'Not selected' }
    };

    if (isVideo && channels && channels.length > 0) {
      // Video: Process selected channels
      console.log('🎯 Processing video for selected channels:', channels);
      
      // YouTube
      if (channels.includes('youtube')) {
        if (tokens.youtube) {
          platformPromises.push(
            postToYouTube(uploadedFilePath, caption, tokens.youtube)
              .then(result => ({ platform: 'youtube', result }))
          );
        } else {
          results.youtube = { success: false, platform: 'YouTube', error: 'No YouTube token found' };
        }
      }
      
      // Instagram Reels
      if (channels.includes('instagram')) {
        if (tokens.instagram) {
          platformPromises.push(
            postToInstagram(mediaUrl, caption, tokens.instagram, platData?.instagram)
              .then(result => ({ platform: 'instagram', result }))
          );
        } else {
          results.instagram = { success: false, platform: 'Instagram', error: 'No Instagram token found' };
        }
      }

      // TikTok
      if (channels.includes('tiktok')) {
        if (tokens.tiktok) {
          platformPromises.push(
            tiktok.publishVideo(tokens.tiktok.accessToken, uploadedFilePath, caption)
              .then(result => ({ platform: 'tiktok', result }))
          );
        } else {
          results.tiktok = { success: false, platform: 'TikTok', error: 'No TikTok token found' };
        }
      }

      // Mastodon Video
      if (channels.includes('mastodon')) {
        if (tokens.mastodon) {
          platformPromises.push(
            mastodon.postStatus(tokens.mastodon.accessToken, tokens.mastodon.instanceUrl, caption, [uploadedFilePath])
              .then(result => ({ platform: 'mastodon', result }))
          );
        } else {
          results.mastodon = { success: false, platform: 'Mastodon', error: 'No Mastodon token found' };
        }
      }

      // Threads Video
      if (channels.includes('threads')) {
        if (tokens.threads) {
          platformPromises.push(
            postToThreads(tokens.threads.accessToken, tokens.threads.account_id, caption, mediaUrl, 'video')
              .then(result => ({ platform: 'threads', result }))
          );
        } else {
          results.threads = { success: false, platform: 'Threads', error: 'No Threads token found' };
        }
      }

      // X Video
      if (channels.includes('x')) {
        if (tokens.x) {
          platformPromises.push(
            broadcastToX(caption, [mediaUrl], tokens.x, userId)
              .then(result => ({ platform: 'x', result }))
          );
        } else {
          results.x = { success: false, platform: 'X', error: 'No X token found' };
        }
      }

      // Reddit Video
      if (channels.includes('reddit')) {
        if (tokens.reddit) {
          platformPromises.push(
            postToReddit(userId, caption, mediaUrl, tokens.reddit, platData?.reddit)
              .then(result => ({ platform: 'reddit', result }))
          );
        } else {
          results.reddit = { success: false, platform: 'Reddit', error: 'No Reddit token found' };
        }
      }
    } else if (isImage && channels && channels.length > 0) {
      // Image: Process selected channels
      console.log('🎯 Processing image for selected channels:', channels);
      
      // Pinterest
      if (channels.includes('pinterest')) {
        if (tokens.pinterest) {
          // Pass Pinterest-specific data
          const pinterestTitle = platData?.pinterest?.title || caption;
          const pinterestLink = platData?.pinterest?.link || '';
          const pinterestBoardId = platData?.pinterest?.boardId;
          
          platformPromises.push(
            postToPinterest(mediaUrl, pinterestTitle, tokens.pinterest, pinterestLink, pinterestBoardId)
              .then(result => ({ platform: 'pinterest', result }))
          );
        } else {
          results.pinterest = { success: false, platform: 'Pinterest', error: 'No Pinterest token found' };
        }
      }
      
      // Instagram Feed (images)
      if (channels.includes('instagram')) {
        if (tokens.instagram) {
          platformPromises.push(
            postImageToInstagram(mediaUrl, caption, tokens.instagram)
              .then(result => ({ platform: 'instagram', result }))
          );
        } else {
          results.instagram = { success: false, platform: 'Instagram', error: 'No Instagram token found' };
        }
      }

      // Facebook
      if (channels.includes('facebook')) {
        console.log('🔵 Facebook selected, checking tokens...');
        console.log('   Facebook token exists:', !!tokens.facebook);
        if (tokens.facebook) {
          console.log('   Facebook token structure:', tokens.facebook);
          const pageId = tokens.facebook.pageId;
          console.log('   Facebook Page ID:', pageId);
          if (pageId) {
            console.log('📘 Posting to Facebook...');
            platformPromises.push(
              postToFacebook(tokens.facebook.accessToken, pageId, caption, mediaUrl)
                .then(result => ({ platform: 'facebook', result }))
            );
          } else {
            console.log('❌ No Facebook Page ID found');
            results.facebook = { success: false, platform: 'Facebook', error: 'No Facebook Page ID found' };
          }
        } else {
          console.log('❌ No Facebook token found');
          results.facebook = { success: false, platform: 'Facebook', error: 'No Facebook token found' };
        }
      }

      // Bluesky (text with optional image)
      if (channels.includes('bluesky')) {
        console.log('🦋 Bluesky selected, checking tokens...');
        console.log('   Bluesky token exists:', !!tokens.bluesky);
        if (tokens.bluesky) {
          console.log('   Bluesky token structure:', tokens.bluesky);
          const did = tokens.bluesky.did;
          console.log('   Bluesky DID:', did);
          if (did) {
            console.log('🦋 Posting to Bluesky...');
            // Download image for Bluesky upload
            let imageBlob = null;
            if (uploadedFilePath) {
              imageBlob = fs.readFileSync(uploadedFilePath);
            }
            platformPromises.push(
              postToBluesky(tokens.bluesky.accessToken, did, caption, mediaUrl, imageBlob)
                .then(result => ({ platform: 'bluesky', result }))
            );
          } else {
            console.log('❌ No Bluesky DID found');
            results.bluesky = { success: false, platform: 'Bluesky', error: 'No Bluesky DID found' };
          }
        } else {
          console.log('❌ No Bluesky token found');
          results.bluesky = { success: false, platform: 'Bluesky', error: 'No Bluesky token found' };
        }
      }

      // LinkedIn (images only)
      if (channels.includes('linkedin')) {
        console.log('🔵 LinkedIn selected, checking tokens...');
        if (tokens.linkedin) {
          console.log('🔵 Posting to LinkedIn...');
          platformPromises.push(
            postToLinkedIn(mediaUrl, caption, tokens.linkedin)
              .then(result => ({ platform: 'linkedin', result }))
          );
        } else {
          console.log('❌ No LinkedIn token found');
          results.linkedin = { success: false, platform: 'LinkedIn', error: 'No LinkedIn token found' };
        }
      }

      // Mastodon Image
      if (channels.includes('mastodon')) {
        console.log('🐘 Mastodon selected, checking tokens...');
        if (tokens.mastodon) {
          console.log('🐘 Posting to Mastodon...');
          platformPromises.push(
            mastodon.postStatus(tokens.mastodon.accessToken, tokens.mastodon.instanceUrl, caption, [uploadedFilePath])
              .then(result => ({ platform: 'mastodon', result }))
          );
        } else {
          console.log('❌ No Mastodon token found');
          results.mastodon = { success: false, platform: 'Mastodon', error: 'No Mastodon token found' };
        }
      }

      // Threads Image
      if (channels.includes('threads')) {
        console.log('🧵 Threads selected, checking tokens...');
        if (tokens.threads) {
          console.log('🧵 Posting to Threads...');
          platformPromises.push(
            postToThreads(tokens.threads.accessToken, tokens.threads.account_id, caption, mediaUrl, 'image')
              .then(result => ({ platform: 'threads', result }))
          );
        } else {
          console.log('❌ No Threads token found');
          results.threads = { success: false, platform: 'Threads', error: 'No Threads token found' };
        }
      }

      // X Image
      if (channels.includes('x')) {
        console.log('𝕏 X selected, checking tokens...');
        if (tokens.x) {
          console.log('𝕏 Posting to X...');
          platformPromises.push(
            broadcastToX(caption, [mediaUrl], tokens.x, userId)
              .then(result => ({ platform: 'x', result }))
          );
        } else {
          console.log('❌ No X token found');
          results.x = { success: false, platform: 'X', error: 'No X token found' };
        }
      }

      // Reddit Image
      if (channels.includes('reddit')) {
        console.log('🤖 Reddit selected, checking tokens...');
        if (tokens.reddit) {
          console.log('🤖 Posting to Reddit...');
          platformPromises.push(
            postToReddit(userId, caption, mediaUrl, tokens.reddit, platData?.reddit)
              .then(result => ({ platform: 'reddit', result }))
          );
        } else {
          console.log('❌ No Reddit token found');
          results.reddit = { success: false, platform: 'Reddit', error: 'No Reddit token found' };
        }
      }
    }

    // Broadcast concurrently
    console.log('\n📤 Broadcasting to platforms...');
    const platformResults = await Promise.allSettled(platformPromises);

    // Process results
    for (const promiseResult of platformResults) {
      if (promiseResult.status === 'fulfilled') {
        const { platform, result } = promiseResult.value;
        results[platform] = result;
      } else {
        console.error('Platform promise rejected:', promiseResult.reason);
      }
    }

    // Log results
    console.log('\n✨ Broadcasting complete!\n');
    if (results.youtube?.success !== undefined) console.log('YouTube:', results.youtube.success ? '✅ Success' : '❌ Failed');
    if (results.instagram?.success !== undefined) console.log('Instagram:', results.instagram.success ? '✅ Success' : '❌ Failed');
    if (results.pinterest?.success !== undefined) console.log('Pinterest:', results.pinterest.success ? '✅ Success' : '❌ Failed');
    if (results.facebook?.success !== undefined) console.log('Facebook:', results.facebook.success ? '✅ Success' : '❌ Failed');
    if (results.bluesky?.success !== undefined) console.log('Bluesky:', results.bluesky.success ? '✅ Success' : '❌ Failed');
    if (results.linkedin?.success !== undefined) console.log('LinkedIn:', results.linkedin.success ? '✅ Success' : '❌ Failed');
    if (results.mastodon?.success !== undefined) console.log('Mastodon:', results.mastodon.success ? '✅ Success' : '❌ Failed');
    if (results.tiktok?.success !== undefined) console.log('TikTok:', results.tiktok.success ? '✅ Success' : '❌ Failed');
    if (results.threads?.success !== undefined) console.log('Threads:', results.threads.success ? '✅ Success' : '❌ Failed');
    if (results.x?.success !== undefined) console.log('X:', results.x.success ? '✅ Success' : '❌ Failed');
    if (results.reddit?.success !== undefined) console.log('Reddit:', results.reddit.success ? '✅ Success' : '❌ Failed');

    // Save broadcast to database
    try {
      // Add mediaUrl to results for the service to pick up
      const broadcastResults = { ...results, mediaUrl: mediaUrl };
      await saveBroadcast(userId, caption, req.file.filename, broadcastResults, mediaType, platData);
      console.log('💾 Broadcast saved to database');
    } catch (error) {
      console.error('Failed to save broadcast to database:', error);
      // Continue even if database save fails
    }

    // Cleanup: Delete uploaded file after processing
    setTimeout(() => {
      if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
        fs.unlinkSync(uploadedFilePath);
        console.log(`\n🗑️  Cleaned up temporary file: ${req.file.filename}`);
      }
    }, 2000);

    // Return response
    const overallSuccess = results.youtube?.success || 
                          results.instagram?.success || 
                          results.pinterest?.success || 
                          results.facebook?.success || 
                          results.bluesky?.success ||
                          results.linkedin?.success ||
                          results.mastodon?.success ||
                          results.tiktok?.success ||
                          results.threads?.success ||
                          results.x?.success ||
                          results.reddit?.success;
    
    return res.status(overallSuccess ? 200 : 500).json({
      success: overallSuccess,
      message: overallSuccess 
        ? 'Broadcasting completed (check individual platform results)'
        : 'Broadcasting failed on all platforms',
      results: results,
      mediaType: mediaType
    });

  } catch (error) {
    console.error('❌ Broadcast error:', error);

    // Clean up uploaded file on error
    if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
      fs.unlinkSync(uploadedFilePath);
    }

    return res.status(500).json({
      success: false,
      error: 'Broadcasting failed',
      message: error.message
    });
  }
});

export default router;
