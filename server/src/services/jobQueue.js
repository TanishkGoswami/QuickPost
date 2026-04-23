import { randomUUID } from 'crypto';
import { EventEmitter } from 'events';

/**
 * In-memory job queue for background broadcast processing.
 * Jobs are stored in a Map and expire after JOB_TTL_MS.
 * No Redis or external broker required.
 */

const JOB_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/** @type {Map<string, Job>} */
const jobs = new Map();

export const jobEvents = new EventEmitter();
jobEvents.setMaxListeners(200);

/**
 * @typedef {Object} Job
 * @property {string} id
 * @property {string} userId
 * @property {'pending'|'processing'|'completed'|'failed'} status
 * @property {number} progress  0–100
 * @property {string} step      Human-readable current step label
 * @property {Object|null} result
 * @property {string|null} error
 * @property {Array<{step:string, status:string, message:string, ts:number}>} logs
 * @property {Object} meta      Arbitrary metadata (caption, channels, thumbnailUrl, etc.)
 * @property {number} createdAt Unix ms
 * @property {number} updatedAt Unix ms
 * @property {number} expiresAt Unix ms
 */

/**
 * Create a new job and return its ID.
 * @param {string} userId
 * @param {Object} meta  Arbitrary metadata to store alongside the job.
 * @returns {string} jobId
 */
export function createJob(userId, meta = {}) {
  const id = randomUUID();
  const now = Date.now();

  /** @type {Job} */
  const job = {
    id,
    userId,
    status: 'pending',
    progress: 0,
    step: 'Queued',
    result: null,
    error: null,
    logs: [],
    meta,
    createdAt: now,
    updatedAt: now,
    expiresAt: now + JOB_TTL_MS,
  };

  jobs.set(id, job);
  jobEvents.emit('created', job);
  console.log(`📋 [JOBS] Created job ${id} for user ${userId}`);
  return id;
}

/**
 * Retrieve a job by ID (returns null if not found or expired).
 * @param {string} jobId
 * @returns {Job|null}
 */
export function getJob(jobId) {
  const job = jobs.get(jobId);
  if (!job) return null;
  if (Date.now() > job.expiresAt) {
    jobs.delete(jobId);
    return null;
  }
  return job;
}

/**
 * Get all jobs belonging to a user, sorted newest-first.
 * @param {string} userId
 * @returns {Job[]}
 */
export function getJobsForUser(userId) {
  const now = Date.now();
  return Array.from(jobs.values())
    .filter(j => j.userId === userId && j.expiresAt > now)
    .sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Update a job's fields and emit a 'updated' event.
 * @param {string} jobId
 * @param {Partial<Job>} patch
 */
export function updateJob(jobId, patch) {
  const job = jobs.get(jobId);
  if (!job) {
    console.warn(`⚠️ [JOBS] updateJob called on unknown job: ${jobId}`);
    return;
  }

  Object.assign(job, patch, { updatedAt: Date.now() });

  // Append to log if a step message is provided
  if (patch.step || patch.status) {
    job.logs.push({
      step: patch.step || job.step,
      status: patch.status || job.status,
      message: patch.logMessage || patch.step || '',
      ts: Date.now(),
    });
  }

  jobs.set(jobId, job);
  jobEvents.emit('updated', job);

  console.log(`📊 [JOBS] Job ${jobId} → ${job.status} (${job.progress}%) — ${job.step}`);
}

/**
 * Mark a job as failed with an error message.
 * @param {string} jobId
 * @param {string} errorMessage
 */
export function failJob(jobId, errorMessage) {
  const job = jobs.get(jobId);
  if (!job) {
    console.warn(`⚠️ [JOBS] failJob called on unknown job: ${jobId}`);
    return;
  }
  job.status = 'failed';
  job.error = errorMessage;
  job.step = 'Failed';
  job.updatedAt = Date.now();
  job.logs.push({ step: 'Failed', status: 'failed', message: errorMessage, ts: Date.now() });
  jobs.set(jobId, job);
  jobEvents.emit('updated', job);
  console.error(`❌ [JOBS] Job ${jobId} failed: ${errorMessage}`);
}

// ─── Cleanup Interval ───────────────────────────────────────────────────────
// Remove expired jobs every hour to avoid memory leaks.
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  let removed = 0;
  for (const [id, job] of jobs.entries()) {
    if (now > job.expiresAt) {
      jobs.delete(id);
      removed++;
    }
  }
  if (removed > 0) {
    console.log(`🧹 [JOBS] Cleaned up ${removed} expired jobs. Active: ${jobs.size}`);
  }
}, 60 * 60 * 1000);

// Don't block process exit
if (cleanupInterval.unref) cleanupInterval.unref();

export default { createJob, getJob, getJobsForUser, updateJob, failJob };
