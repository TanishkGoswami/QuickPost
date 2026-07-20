import cron from 'node-cron';
import { withTrendRefreshLock } from './locks.js';

let started = false;

export function initTrendRefreshScheduler(port) {
  if (started || process.env.TRENDS_REFRESH_CRON === 'off') return;
  started = true;

  const expression = process.env.TRENDS_REFRESH_CRON || '*/30 * * * *';
  cron.schedule(expression, async () => {
    if (!process.env.TRENDS_REFRESH_SECRET) {
      console.warn('[Trends/scheduler] refresh skipped: TRENDS_REFRESH_SECRET is not configured');
      return;
    }

    const locked = await withTrendRefreshLock(async () => {
      const base = process.env.API_BASE_URL || `http://localhost:${port || process.env.PORT || 5000}`;
      const url = `${base}/api/trends/feed?sort=trending&limit=60&enrich=false&refresh=true`;
      const res = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'x-trends-refresh-secret': process.env.TRENDS_REFRESH_SECRET,
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      console.log('[Trends/scheduler] refreshed trend snapshots');
    });

    if (locked.skipped) {
      console.warn('[Trends/scheduler] refresh skipped:', locked.reason);
    } else if (!locked.ok) {
      console.warn('[Trends/scheduler] refresh failed:', locked.error);
    }
  });
}
