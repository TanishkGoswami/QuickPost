import os from 'node:os';
import { randomUUID } from 'node:crypto';

let processLockUntil = 0;

const owner = `${os.hostname()}:${process.pid}:${randomUUID()}`;

async function acquireDbLock(name, ttlSeconds) {
  const { default: supabase } = await import('../supabase.js');
  const { data, error } = await supabase.rpc('try_acquire_trend_refresh_lock', {
    p_name: name,
    p_owner: owner,
    p_ttl_seconds: ttlSeconds,
  });
  if (error) throw error;
  return data === true;
}

async function releaseDbLock(name) {
  const { default: supabase } = await import('../supabase.js');
  await supabase.rpc('release_trend_refresh_lock', { p_name: name, p_owner: owner });
}

export async function withTrendRefreshLock(fn, options = {}) {
  const name = options.name || 'trend-provider-refresh';
  const ttlSeconds = Number(options.ttlSeconds || process.env.TRENDS_REFRESH_LOCK_TTL_SECONDS || 900);
  let dbLocked = false;

  try {
    dbLocked = await acquireDbLock(name, ttlSeconds);
    if (!dbLocked) return { ok: false, skipped: true, reason: 'refresh already running' };
  } catch (err) {
    const now = Date.now();
    if (processLockUntil > now) return { ok: false, skipped: true, reason: 'refresh already running' };
    processLockUntil = now + ttlSeconds * 1000;
    // ponytail: process fallback is only for local/dev when the DB lock migration is missing.
    console.warn('[Trends/lock] DB lock unavailable, using process lock:', err.message);
  }

  try {
    const value = await fn();
    return { ok: true, value };
  } catch (err) {
    return { ok: false, error: err.message };
  } finally {
    if (dbLocked) await releaseDbLock(name).catch(err => console.warn('[Trends/lock] release failed:', err.message));
    else processLockUntil = 0;
  }
}
