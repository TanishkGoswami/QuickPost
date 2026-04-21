-- ============================================================
-- QuickPost — Scheduling System Upgrade Migration
-- Run this in your Supabase SQL Editor (one-time migration)
-- ============================================================

-- ── 1. Add scheduling-related columns to broadcasts ────────
ALTER TABLE broadcasts
  ADD COLUMN IF NOT EXISTS user_timezone TEXT DEFAULT 'UTC',
  ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS attempt_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_error TEXT,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS media_urls JSONB;  -- Array of all media CDN URLs

-- ── 2. Widen the status CHECK constraint to include new states ──
-- Drop the old constraint first if it exists (Supabase may name it automatically)
DO $$
BEGIN
  -- Drop existing status check if it exists
  ALTER TABLE broadcasts DROP CONSTRAINT IF EXISTS broadcasts_status_check;
EXCEPTION
  WHEN others THEN NULL;
END $$;

-- Re-add the constraint with the full set of states
ALTER TABLE broadcasts
  ADD CONSTRAINT broadcasts_status_check
  CHECK (status IN ('draft', 'scheduled', 'processing', 'sent', 'partially_sent', 'failed', 'cancelled'));

-- ── 3. Performance indexes ─────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_broadcasts_status_scheduled
  ON broadcasts (status, scheduled_for)
  WHERE status IN ('scheduled', 'processing');

CREATE INDEX IF NOT EXISTS idx_broadcasts_user_status
  ON broadcasts (user_id, status, created_at DESC);

-- ── 4. Atomic claim function (idempotency guard) ───────────
-- This function atomically transitions a broadcast from 'scheduled' → 'processing'.
-- Only ONE concurrent caller will succeed — PostgreSQL row-level locking ensures this.
-- Returns TRUE if the claim succeeded, FALSE if already claimed by another worker.
CREATE OR REPLACE FUNCTION claim_scheduled_broadcast(p_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_updated INT;
BEGIN
  UPDATE broadcasts
  SET
    status               = 'processing',
    processing_started_at = NOW(),
    attempt_count        = attempt_count + 1,
    updated_at           = NOW()
  WHERE
    id     = p_id
    AND status = 'scheduled'
    AND scheduled_for <= NOW();

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$;

-- ── 5. Recovery function: unstick crashed processing posts ──
-- Call periodically to reset posts stuck in 'processing' for > 10 minutes
-- (handles server crash mid-execution)
CREATE OR REPLACE FUNCTION recover_stale_broadcasts(p_stale_minutes INT DEFAULT 10)
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
  v_updated INT;
BEGIN
  UPDATE broadcasts
  SET
    status                = 'scheduled',
    processing_started_at = NULL,
    updated_at            = NOW()
  WHERE
    status = 'processing'
    AND processing_started_at < NOW() - (p_stale_minutes || ' minutes')::INTERVAL;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated;
END;
$$;

-- ── 6. Verify ──────────────────────────────────────────────
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'broadcasts'
  AND column_name IN (
    'user_timezone', 'processing_started_at',
    'attempt_count', 'last_error', 'cancelled_at',
    'updated_at', 'media_urls', 'status'
  )
ORDER BY column_name;
