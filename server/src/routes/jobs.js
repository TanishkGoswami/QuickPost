import express from 'express';
import { clearTerminalJobsForUser, deleteJob, getJob, getJobsForUser } from '../services/jobQueue.js';
import { authenticateUser } from '../middleware/authenticateUser.js';
import supabase from '../services/supabase.js';

const router = express.Router();

/**
 * GET /api/jobs
 * List all jobs for the authenticated user (newest first, limited to last 20).
 */
router.get('/jobs', authenticateUser, (req, res) => {
  try {
    const userId = req.user.userId;
    const allJobs = getJobsForUser(userId).slice(0, 20);

    return res.json({
      success: true,
      jobs: allJobs.map(safeJob),
    });
  } catch (err) {
    console.error('❌ [JOBS_ROUTE] GET /jobs error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/jobs/:jobId
 * Poll status of a single job. Frontend polls this every 1.5s.
 */
router.get('/jobs/:jobId', authenticateUser, async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.userId;

    const job = getJob(jobId);

    if (!job) {
      const recoveredJob = await recoverJobFromBroadcast(userId, jobId);
      if (recoveredJob) {
        return res
          .set('Cache-Control', 'no-store')
          .json({ success: true, job: recoveredJob, recovered: true });
      }

      return res.status(404).json({ success: false, error: 'Job not found or expired' });
    }

    // Security: only allow the owning user to see their job
    if (job.userId !== userId) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    return res
      .set('Cache-Control', 'no-store')
      .json({ success: true, job: safeJob(job) });
  } catch (err) {
    console.error('❌ [JOBS_ROUTE] GET /jobs/:jobId error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/jobs', authenticateUser, (req, res) => {
  try {
    const removed = clearTerminalJobsForUser(req.user.userId);
    return res.json({ success: true, removed });
  } catch (err) {
    console.error('❌ [JOBS_ROUTE] DELETE /jobs error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/jobs/:jobId', authenticateUser, (req, res) => {
  try {
    const removed = deleteJob(req.params.jobId, req.user.userId);
    return res.json({ success: true, removed });
  } catch (err) {
    console.error('❌ [JOBS_ROUTE] DELETE /jobs/:jobId error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

async function recoverJobFromBroadcast(userId, jobId) {
  const record =
    (await findBroadcastByJobId(userId, jobId, 'sourceJobId')) ||
    (await findBroadcastByJobId(userId, jobId, 'source_job_id'));

  if (!record) return null;

  const platformErrors = [
    ['Instagram', record.instagram_error],
    ['YouTube', record.youtube_error],
    ['Pinterest', record.pinterest_error],
    ['Facebook', record.facebook_error],
    ['LinkedIn', record.linkedin_error],
    ['Mastodon', record.mastodon_error],
    ['Bluesky', record.bluesky_error],
    ['Threads', record.threads_error],
    ['X', record.x_error],
  ].filter(([, error]) => Boolean(error));

  const isFailed = record.status === 'failed';
  const error = isFailed
    ? platformErrors.map(([platform, message]) => `${platform}: ${message}`).join(' | ') || 'Broadcast failed.'
    : null;

  return {
    id: jobId,
    status: isFailed ? 'failed' : 'completed',
    progress: 100,
    step: record.status === 'scheduled'
      ? 'Broadcast scheduled.'
      : isFailed
        ? 'Recovered failed broadcast.'
        : 'Broadcast complete.',
    error,
    result: {
      instagram: record.instagram_success
        ? { success: true, mediaId: record.instagram_post_id, url: record.instagram_url }
        : null,
      youtube: record.youtube_success
        ? { success: true, videoId: record.youtube_video_id, url: record.youtube_url }
        : null,
    },
    logs: [],
    meta: {
      caption: record.caption,
      channels: record.selected_channels || record.platform_data?.selectedChannels || [],
      mediaType: record.media_type,
      previewUrl: record.thumbnail_url || record.media_url,
      recoveredFromBroadcastId: record.id,
      statusRecovered: true,
    },
    createdAt: new Date(record.created_at || Date.now()).getTime(),
    updatedAt: Date.now(),
  };
}

async function findBroadcastByJobId(userId, jobId, jsonKey) {
  const { data, error } = await supabase
    .from('broadcasts')
    .select('*')
    .eq('user_id', userId)
    .filter(`platform_data->>${jsonKey}`, 'eq', jobId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn(`⚠️ [JOBS_ROUTE] Broadcast recovery lookup failed (${jsonKey}):`, error.message);
    return null;
  }

  return data || null;
}

/**
 * Strip internal fields from a job before sending to client.
 * @param {import('../services/jobQueue.js').Job} job
 */
function safeJob(job) {
  return {
    id: job.id,
    status: job.status,
    progress: job.progress,
    step: job.step,
    error: job.error,
    result: job.result,
    logs: job.logs?.slice(-10) ?? [], // last 10 log entries
    meta: job.meta,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  };
}

export default router;
