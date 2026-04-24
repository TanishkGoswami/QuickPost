import cron from 'node-cron';
import fs from 'fs';
import { default as supabase } from './supabase.js';
import { executeBroadcast } from './postingService.js';

// ─── Constants ────────────────────────────────────────────────────────────────
const STALE_PROCESSING_MINUTES = 10; // reset posts stuck in 'processing' > N min
const MAX_CONCURRENT_JOBS = 3;       // cap on parallel jobs per cron tick
const MAX_ATTEMPTS = 5;              // max retries before hard fail
const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

// Error codes we never retry (permanent failures)
const PERMANENT_ERROR_CODES = [
  'ACCOUNT_DISCONNECTED', 'INVALID_MEDIA', 'REAUTH_REQUIRED',
  'INVALID_CAPTION', 'UNSUPPORTED_COMBINATION',
];

// ─── Logger ──────────────────────────────────────────────────────────────────
function log(level, broadcastId, msg, meta = {}) {
  const idStr = broadcastId ? `[${broadcastId.slice(0, 8)}]` : '';
  console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](
    `⏰ [SCHEDULER]${idStr} ${msg}`,
    Object.keys(meta).length ? meta : ''
  );
}

// ─── File Cleanup Helper ──────────────────────────────────────────────────────
function cleanupFiles(filePaths = []) {
  try {
    let cleaned = 0;
    for (const p of filePaths) {
      if (p && fs.existsSync(p)) {
        fs.unlinkSync(p);
        cleaned++;
      }
    }
    if (cleaned > 0) log('log', null, `🗑️  Cleaned up ${cleaned} temp file(s) after scheduled post`);
  } catch (err) {
    log('error', null, 'File cleanup error', { error: err.message });
  }
}

// ─── Atomic Claim ─────────────────────────────────────────────────────────────
/**
 * Atomically transition a broadcast from 'scheduled' → 'processing'.
 * Returns true only if THIS call won the race — prevents double-posting.
 * The SQL function also increments attempt_count.
 */
async function claimBroadcast(id) {
  const { data, error } = await supabase.rpc('claim_scheduled_broadcast', { p_id: id });
  if (error) {
    log('error', id, 'claimBroadcast RPC error', { error: error.message });
    return false;
  }
  return data === true;
}

// ─── Status Updater ───────────────────────────────────────────────────────────
async function setStatus(id, status, extras = {}) {
  const { error } = await supabase
    .from('broadcasts')
    .update({ status, ...extras })
    .eq('id', id);

  if (error) {
    log('error', id, `setStatus(${status}) failed`, { error: error.message });
  }
}

// ─── Retry Eligibility ────────────────────────────────────────────────────────
function isRetryable(error) {
  const msg = (error?.message || '').toUpperCase();
  const code = error?.code || error?.statusCode;

  if (PERMANENT_ERROR_CODES.some(c => msg.includes(c))) return false;
  if (RETRYABLE_STATUS_CODES.has(Number(code))) return true;
  if (msg.includes('NETWORK') || msg.includes('TIMEOUT') || msg.includes('ECONNRESET')) return true;

  // Default: retry unknown errors up to MAX_ATTEMPTS
  return true;
}

// ─── Process a Single Broadcast ───────────────────────────────────────────────
async function processOneBroadcast(post) {
  const {
    id,
    user_id,
    caption,
    media_url,       // single fallback URL
    media_urls,      // array of all media URLs (preferred)
    platform_data,
    media_type,
    attempt_count = 0,
  } = post;

  log('log', id, `Processing (attempt ${attempt_count + 1})`, { channels: platform_data?.selectedChannels });

  // ── Atomic claim: prevents double-posting ─────────────────────────
  // claim_scheduled_broadcast() in DB increments attempt_count and sets status='processing'
  const claimed = await claimBroadcast(id);
  if (!claimed) {
    log('log', id, 'Skipped — already claimed by another worker or not due yet');
    return;
  }

  // After claim, the DB attempt_count is now attempt_count + 1
  const currentAttempt = attempt_count + 1;

  const channels = platform_data?.selectedChannels || [];
  const filePaths = platform_data?.filePaths || [];
  const startTime = Date.now();

  // ── Resolve media URLs (BUG 2 FIX) ───────────────────────────────
  // media_urls may be null if stored as JSONB null; fall back to media_url
  const resolvedMediaUrls = (Array.isArray(media_urls) && media_urls.length > 0)
    ? media_urls
    : (media_url ? [media_url] : []);

  // Warn if no media available
  if (resolvedMediaUrls.length === 0) {
    log('warn', id, '⚠️ No media URLs found for this post — platforms will receive no media');
  }

  // ── Verify local files still exist for file-dependent platforms ───
  const existingFilePaths = filePaths.filter(p => p && fs.existsSync(p));
  const missingFiles = filePaths.filter(p => p && !fs.existsSync(p));
  if (missingFiles.length > 0) {
    log('warn', id, `⚠️ ${missingFiles.length} local file(s) missing (may affect YouTube/Bluesky)`, { missingFiles });
  }

  try {
    await executeBroadcast(
      id,
      user_id,
      caption,
      resolvedMediaUrls,
      existingFilePaths,  // only pass files that still exist
      channels,
      platform_data,
      media_type
    );

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    log('log', id, `✅ Success in ${elapsed}s`);

    // ── Cleanup local files now that posting is done ───────────────
    // (Files were preserved during scheduling so we could use them here)
    cleanupFiles(filePaths);

  } catch (err) {
    const errorMsg = err?.message || String(err);

    log('error', id, `❌ Failed (attempt ${currentAttempt}/${MAX_ATTEMPTS})`, { error: errorMsg });

    if (currentAttempt >= MAX_ATTEMPTS || !isRetryable(err)) {
      // Hard fail — no more retries, clean up files
      await setStatus(id, 'failed', {
        last_error: `[Attempt ${currentAttempt}] ${errorMsg}`,
        processing_started_at: null,
      });
      cleanupFiles(filePaths); // Clean up even on permanent failure
      log('error', id, `💀 Permanently failed after ${currentAttempt} attempts`);
    } else {
      // Soft fail — exponential backoff, files kept for retry
      const backoffSeconds = Math.pow(2, currentAttempt) * 15; // 30s, 60s, 120s, 240s…
      log('warn', id, `🔄 Will retry in ~${backoffSeconds}s`);
      await setStatus(id, 'scheduled', {
        last_error: `[Attempt ${currentAttempt}] ${errorMsg}`,
        processing_started_at: null,
        scheduled_for: new Date(Date.now() + backoffSeconds * 1000).toISOString(),
      });
    }
  }
}

// ─── Recovery: Reset Stale Processing Posts ───────────────────────────────────
async function recoverStalePosts() {
  const { data, error } = await supabase.rpc('recover_stale_broadcasts', {
    p_stale_minutes: STALE_PROCESSING_MINUTES,
  });
  if (error) {
    log('error', null, 'Recovery RPC error', { error: error.message });
    return 0;
  }
  if (data > 0) {
    log('warn', null, `♻️  Recovered ${data} stale processing post(s)`);
  }
  return data || 0;
}

// ─── Main Poll ────────────────────────────────────────────────────────────────
async function pollAndProcess() {
  try {
    // 1. Recover any stale posts from server crashes
    await recoverStalePosts();

    // 2. Fetch due scheduled posts
    const now = new Date().toISOString();
    const { data: duePosts, error } = await supabase
      .from('broadcasts')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_for', now)
      .order('scheduled_for', { ascending: true })
      .limit(MAX_CONCURRENT_JOBS);

    if (error) {
      log('error', null, 'Error querying due posts', { error: error.message });
      return;
    }

    if (!duePosts || duePosts.length === 0) return;

    log('log', null, `📋 Found ${duePosts.length} due post(s). Processing...`);

    // 3. Process concurrently (up to MAX_CONCURRENT_JOBS)
    await Promise.allSettled(duePosts.map(processOneBroadcast));

  } catch (err) {
    log('error', null, 'Unexpected scheduler error', { error: err?.message });
  }
}

// ─── Public: Initialize Scheduler ────────────────────────────────────────────
export function initScheduler() {
  log('log', null, '🚀 Initializing production-grade Post Scheduler...');

  // Poll every minute — checks for due posts and recovers stale ones
  cron.schedule('*/1 * * * *', pollAndProcess);

  log('log', null, `✅ Scheduler running (poll every 1 min, max ${MAX_CONCURRENT_JOBS} concurrent jobs, max ${MAX_ATTEMPTS} attempts)`);
}
