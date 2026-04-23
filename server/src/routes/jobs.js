import express from 'express';
import { getJob, getJobsForUser } from '../services/jobQueue.js';
import { authenticateUser } from '../middleware/authenticateUser.js';

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
router.get('/jobs/:jobId', authenticateUser, (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.userId;

    const job = getJob(jobId);

    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found or expired' });
    }

    // Security: only allow the owning user to see their job
    if (job.userId !== userId) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }

    return res.json({ success: true, job: safeJob(job) });
  } catch (err) {
    console.error('❌ [JOBS_ROUTE] GET /jobs/:jobId error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

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
