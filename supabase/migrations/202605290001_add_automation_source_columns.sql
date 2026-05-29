-- ─── Add composer source columns to automations table ──────────────────────────
-- These columns allow createOrUpdateComposerAutomation to perform an idempotent
-- upsert: look up an existing automation by source_broadcast_id and update it
-- instead of always inserting a new one on every retry/re-run.
--
-- 'source'              — where the automation was created from (e.g. 'social_pilot_composer')
-- 'source_broadcast_id' — the broadcast (post) UUID that triggered this automation
-- 'source_job_id'       — the background job UUID that created this automation

ALTER TABLE public.automations
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS source_broadcast_id uuid,
  ADD COLUMN IF NOT EXISTS source_job_id text;

-- Index for fast lookup by source_broadcast_id (used in idempotency check)
CREATE INDEX IF NOT EXISTS idx_automations_source_broadcast_id
  ON public.automations (source_broadcast_id)
  WHERE source_broadcast_id IS NOT NULL;

-- Index for source (optional, useful for filtering composer automations)
CREATE INDEX IF NOT EXISTS idx_automations_source
  ON public.automations (source)
  WHERE source IS NOT NULL;
