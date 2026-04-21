import express from 'express';
import { upload, handleUploadError } from '../middleware/upload.js';
import { getTokensForUser } from '../services/supabase.js';
import { postToInstagram, postImageToInstagram, postCarouselToInstagram } from '../services/instagram.js';
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
import googleOAuth from '../services/googleOAuth.js';
import { createJob, updateJob, failJob, getJob } from '../services/jobQueue.js';
import fs from 'fs';

const router = express.Router();

/**
 * POST /api/broadcast
 * Accepts media files + metadata, creates an async job, responds immediately.
 * The actual upload & publishing runs in the background.
 * @protected Requires authentication
 */
router.post('/broadcast', authenticateUser, (req, res, next) => {
  upload.fields([
    { name: 'media', maxCount: 10 },
    { name: 'youtubeThumbnail', maxCount: 1 }
  ])(req, res, (err) => {
    if (err) return handleUploadError(err, req, res, next);
    next();
  });
}, async (req, res) => {
  console.log('📥 [BROADCAST] Sync job request received');

  try {
    // ── Validate request ──────────────────────────────────────────────────
    if (!req.files || (!req.files['media'] && !req.files['youtubeThumbnail'])) {
      return res.status(400).json({ success: false, error: 'No media files uploaded' });
    }

    const { caption, selectedChannels, platformData, scheduledAt, isScheduled: isScheduledField } = req.body;
    const userId = req.user.userId;

    const channels = typeof selectedChannels === 'string' ? JSON.parse(selectedChannels) : selectedChannels;
    const platData = typeof platformData === 'string' ? JSON.parse(platformData) : platformData;
    const isScheduled = isScheduledField === 'true' || !!scheduledAt;

    const uploadedFiles = req.files['media'] || [];
    const thumbnailFile = req.files['youtubeThumbnail'] ? req.files['youtubeThumbnail'][0] : null;

    const filePaths = uploadedFiles.map(f => f.path);
    const filenames = uploadedFiles.map(f => f.filename);

    // ── Detect media type ─────────────────────────────────────────────────
    const videos = uploadedFiles.filter(f => f.mimetype.startsWith('video/'));
    const isVideo = videos.length > 0;
    const mediaType = isVideo ? 'video' : 'image';
    const primaryVideoPath = videos.length > 0 ? videos[0].path : null;

    console.log(`🚀 Broadcast job queued. Type: ${mediaType}, User: ${userId}, Scheduled: ${isScheduled ? scheduledAt : 'Immediate'}`);

    // ── Create the job ────────────────────────────────────────────────────
    const jobId = createJob(userId, {
      caption,
      channels,
      mediaType,
      filenames,
      fileCount: uploadedFiles.length,
      hasThumbnail: !!thumbnailFile,
      isScheduled,
      scheduledAt
    });

    // ── Respond immediately — UI unblocked ────────────────────────────────
    res.status(202).json({ success: true, jobId });

    // ── Background processing (fire-and-forget) ───────────────────────────
    processBroadcastJob({
      jobId,
      userId,
      caption,
      channels,
      platData,
      uploadedFiles,
      filePaths,
      filenames,
      thumbnailFile,
      isVideo,
      mediaType,
      primaryVideoPath,
      isScheduled,
      scheduledAt
    }).catch(err => {
      console.error(`❌ [BROADCAST_JOB] Unhandled error in job ${jobId}:`, err);
      failJob(jobId, err.message || 'Unknown error');
    });

  } catch (error) {
    console.error('❌ [BROADCAST] Failed to create job:', error);
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        error: 'Failed to queue broadcast job',
        message: error.message
      });
    }
  }
});

// ── Background Worker ──────────────────────────────────────────────────────

/**
 * The actual broadcast processing logic, now running asynchronously.
 * Updates job progress as it advances through each phase.
 */
async function processBroadcastJob({
  jobId, userId, caption, channels, platData,
  uploadedFiles, filePaths, filenames,
  thumbnailFile, isVideo, mediaType, primaryVideoPath,
  isScheduled, scheduledAt
}) {
  console.log(`\n🚀 [JOB:${jobId}] Starting background broadcast for user: ${userId}`);

  // ── Phase 1: Uploading to cloud (0 → 30%) ──────────────────────────────
  updateJob(jobId, {
    status: 'processing',
    progress: 5,
    step: 'Uploading to cloud storage…',
  });

  let mediaUrls = [];
  let finalThumbnailUrl = null;
  let autoCoverImageUrl = null;

  try {
    if (isCloudinaryConfigured()) {
      console.log(`☁️  [JOB:${jobId}] Uploading ${uploadedFiles.length} file(s) to Cloudinary...`);

      const uploadPromises = filePaths.map((p, i) => {
        return uploadToCloudinary(p, isVideo ? 'video' : 'image').then(r => {
          // Update progress incrementally as each file uploads
          const perFileProgress = Math.floor(25 / filePaths.length);
          updateJob(jobId, {
            progress: 5 + (i + 1) * perFileProgress,
            step: `Uploading file ${i + 1} of ${filePaths.length}…`,
          });
          return r;
        });
      });

      const uploadResults = await Promise.all(uploadPromises);
      mediaUrls = uploadResults.map(r => r.url);

      // Auto cover: first image in set
      const firstImageIdx = uploadedFiles.findIndex(f => f.mimetype.startsWith('image/'));
      if (firstImageIdx !== -1) {
        autoCoverImageUrl = mediaUrls[firstImageIdx];
      }

      // Thumbnail logic
      finalThumbnailUrl = autoCoverImageUrl;
      if (thumbnailFile && isCloudinaryConfigured()) {
        updateJob(jobId, { step: 'Uploading thumbnail…', progress: 28 });
        const thumbUpload = await uploadToCloudinary(thumbnailFile.path, 'image');
        finalThumbnailUrl = thumbUpload.url;
      } else if (mediaType === 'video' && !finalThumbnailUrl && mediaUrls[0]) {
        finalThumbnailUrl = mediaUrls[0].replace(/\.[^/.]+$/, ".jpg");
        console.log(`🎬 [JOB:${jobId}] Generated auto-thumbnail for video:`, finalThumbnailUrl);
      }

      updateJob(jobId, {
        progress: 30,
        step: isScheduled ? 'Media ready. Scheduling...' : 'Cloud upload complete. Publishing...',
        meta: {
          ...(getJob_internal(jobId)?.meta || {}),
          previewUrl: finalThumbnailUrl || mediaUrls[0] || null,
        },
      });

      console.log(`✓ [JOB:${jobId}] All files uploaded. URLs:`, mediaUrls);
    } else {
      // Fallback to local URLs if No Cloudinary
      const serverPublicUrl = process.env.SERVER_PUBLIC_URL || 'http://localhost:5000';
      mediaUrls = filenames.map(name => `${serverPublicUrl}/uploads/${name}`);
      const firstImageIdx = uploadedFiles.findIndex(f => f.mimetype.startsWith('image/'));
      if (firstImageIdx !== -1) autoCoverImageUrl = mediaUrls[firstImageIdx];
      finalThumbnailUrl = autoCoverImageUrl;
      updateJob(jobId, { progress: 30, step: 'Publishing to platforms…' });
    }
  } catch (uploadErr) {
    console.error(`❌ [JOB:${jobId}] Cloud upload failed:`, uploadErr.message);
    failJob(jobId, `Cloud upload failed: ${uploadErr.message}`);
    cleanupFiles(filePaths, thumbnailFile);
    return;
  }

  // ── Phase 2: Decision - Schedule or Broadcast ───────────────────────────
  if (isScheduled) {
    updateJob(jobId, { progress: 80, step: 'Saving schedule to database…' });
    try {
      await saveBroadcast(
        userId, 
        caption, 
        filenames, 
        { mediaUrls, thumbnailUrl: finalThumbnailUrl }, 
        mediaType, 
        { ...platData, selectedChannels: channels, filePaths }, // Store filePaths for scheduler cleanup later
        'scheduled', 
        scheduledAt
      );
      
      updateJob(jobId, {
        status: 'completed',
        progress: 100,
        step: `Post scheduled for ${new Date(scheduledAt).toLocaleString()}!`,
      });
      console.log(`📅 [JOB:${jobId}] Broadcast successfully scheduled.`);
      return; // Stop here, scheduler will pick it up
    } catch (dbErr) {
      failJob(jobId, `Scheduling failed: ${dbErr.message}`);
      cleanupFiles(filePaths, thumbnailFile);
      return;
    }
  }

  // ── Phase 3: Immediate Broadcast (Platform APIs) ────────────────────────
  const primaryMediaUrl = mediaUrls[0];
  const youtubeThumbnailPath = thumbnailFile ? thumbnailFile.path :
    (uploadedFiles.findIndex(f => f.mimetype.startsWith('image/')) !== -1
      ? filePaths[uploadedFiles.findIndex(f => f.mimetype.startsWith('image/'))]
      : null);

  let tokens;
  try {
    tokens = await getTokensForUser(userId);
  } catch (tokenErr) {
    failJob(jobId, `Failed to fetch tokens: ${tokenErr.message}`);
    cleanupFiles(filePaths, thumbnailFile);
    return;
  }

  const results = {
    mediaUrl: primaryMediaUrl,
    mediaUrls,
    thumbnailUrl: finalThumbnailUrl,
  };

  let platformPromises = [];
  const selectedChannelCount = channels.length;
  let completedChannels = 0;

  const onChannelComplete = (platform, result) => {
    completedChannels++;
    const pct = 30 + Math.floor((completedChannels / selectedChannelCount) * 55);
    updateJob(jobId, {
      progress: Math.min(pct, 85),
      step: `Published to ${platform}… (${completedChannels}/${selectedChannelCount})`,
    });
    return { platform, result };
  };

  // Pinterest
  if (channels.includes('pinterest') && tokens.pinterest) {
    platformPromises.push(
      postToPinterest(primaryMediaUrl, platData?.pinterest?.title || caption, tokens.pinterest, platData?.pinterest?.link, platData?.pinterest?.boardId)
        .then(r => onChannelComplete('Pinterest', r))
    );
  }

  // Instagram
  if (channels.includes('instagram') && tokens.instagram) {
    let action;
    if (mediaUrls.length > 1 && !isVideo) {
      action = postCarouselToInstagram(mediaUrls, caption, tokens.instagram);
    } else if (isVideo) {
      const igTokens = { ...tokens.instagram, coverUrl: autoCoverImageUrl };
      action = postToInstagram(primaryMediaUrl, caption, igTokens);
    } else {
      action = postImageToInstagram(primaryMediaUrl, caption, tokens.instagram);
    }
    platformPromises.push(action.then(r => onChannelComplete('Instagram', r)));
  }

  // Facebook
  if (channels.includes('facebook') && tokens.facebook?.pageId) {
    const fbAction = isVideo
      ? postVideoToFacebook(tokens.facebook.accessToken, tokens.facebook.pageId, caption, primaryMediaUrl, autoCoverImageUrl)
      : postToFacebook(tokens.facebook.accessToken, tokens.facebook.pageId, caption, mediaUrls);
    platformPromises.push(fbAction.then(r => onChannelComplete('Facebook', r)));
  }

  // LinkedIn
  if (channels.includes('linkedin') && tokens.linkedin) {
    platformPromises.push(
      postToLinkedIn(mediaUrls, caption, tokens.linkedin).then(r => onChannelComplete('LinkedIn', r))
    );
  }

  // Bluesky
  if (channels.includes('bluesky') && tokens.bluesky?.did) {
    const stats = filePaths.map(p => { try { return fs.statSync(p).size; } catch { return 0; } });
    const totalSize = stats.reduce((a, b) => a + b, 0);
    if (totalSize <= 30 * 1024 * 1024) {
      const blobs = filePaths.map(p => { try { return fs.readFileSync(p); } catch { return null; } }).filter(Boolean);
      platformPromises.push(
        postToBluesky(tokens.bluesky.accessToken, tokens.bluesky.did, caption, mediaUrls, blobs, isVideo)
          .then(r => onChannelComplete('Bluesky', r))
      );
    } else {
      console.warn(`⚠️ [JOB:${jobId}] Media too large for Bluesky, skipping.`);
    }
  }

  // X (Twitter)
  if (channels.includes('x') && tokens.x) {
    platformPromises.push(
      broadcastToX(caption, mediaUrls, tokens.x, userId)
        .then(r => typeof r === 'object' ? r : { success: true, result: r }) // ensure object response
        .then(r => onChannelComplete('X', r))
    );
  }

  // YouTube
  if (channels.includes('youtube') && isVideo && tokens.youtube && primaryVideoPath) {
    platformPromises.push(
      (async () => {
        const validAccessToken = await googleOAuth.getValidAccessToken(userId);
        const ytTokens = { ...tokens.youtube, accessToken: validAccessToken };
        updateJob(jobId, { step: 'Uploading video to YouTube…' });
        const result = await postToYouTube(primaryVideoPath, caption, ytTokens);
        if (result.success && result.videoId && youtubeThumbnailPath) {
          const thumbResult = await setVideoThumbnail(result.videoId, youtubeThumbnailPath, ytTokens);
          result.thumbnailSuccess = thumbResult.success;
        }
        return onChannelComplete('YouTube', result);
      })()
    );
  }

  // TikTok, Mastodon, Reddit, Threads... 
  if (channels.includes('tiktok') && tokens.tiktok && primaryVideoPath) {
    platformPromises.push(tiktok.publishVideo(tokens.tiktok.accessToken, primaryVideoPath, caption).then(r => onChannelComplete('TikTok', r)));
  }
  if (channels.includes('mastodon') && tokens.mastodon) {
    platformPromises.push(mastodon.postStatus(tokens.mastodon.accessToken, tokens.mastodon.instanceUrl, caption, filePaths).then(r => onChannelComplete('Mastodon', r)));
  }
  if (channels.includes('reddit') && tokens.reddit) {
    platformPromises.push(postToReddit(userId, caption, primaryMediaUrl, tokens.reddit, platData?.reddit).then(r => onChannelComplete('Reddit', r)));
  }
  if (channels.includes('threads') && tokens.threads) {
    platformPromises.push(postToThreads(tokens.threads.accessToken, tokens.threads.account_id, caption, primaryMediaUrl, mediaType).then(r => onChannelComplete('Threads', r)));
  }

  updateJob(jobId, { progress: 31, step: `Publishing to ${selectedChannelCount} platform(s)…` });
  const platformResults = await Promise.allSettled(platformPromises);

  for (const promiseResult of platformResults) {
    if (promiseResult.status === 'fulfilled') {
      const { platform, result } = promiseResult.value;
      results[platform.toLowerCase()] = result;
    }
  }

  // ── Phase 4: Save to DB (85 → 95%) ────────────────────────────────────
  updateJob(jobId, { progress: 87, step: 'Saving broadcast record…' });
  try {
    await saveBroadcast(userId, caption, filenames, results, mediaType, platData, 'sent');
    console.log(`✅ [JOB:${jobId}] Broadcast saved to database`);
  } catch (dbErr) {
    console.error(`⚠️ [JOB:${jobId}] DB save failed:`, dbErr.message);
  }

  // ── Phase 5: Cleanup (95 → 100%) ──────────────────────────────────────
  updateJob(jobId, { progress: 95, step: 'Cleaning up…' });
  setTimeout(() => cleanupFiles(filePaths, thumbnailFile), 10000);

  updateJob(jobId, {
    status: 'completed',
    progress: 100,
    step: 'Broadcast complete!',
    result: results,
  });
  console.log(`🎉 [JOB:${jobId}] Broadcast job completed successfully.`);
}

function getJob_internal(jobId) { return getJob(jobId); }

function cleanupFiles(filePaths, thumbnailFile) {
  try {
    filePaths?.forEach(p => { if (p && fs.existsSync(p)) fs.unlinkSync(p); });
    if (thumbnailFile?.path && fs.existsSync(thumbnailFile.path)) fs.unlinkSync(thumbnailFile.path);
    console.log('✅ [CLEANUP] Temp files removed.');
  } catch (err) { console.error('❌ [CLEANUP] Error:', err); }
}

export default router;
