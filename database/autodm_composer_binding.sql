-- Apply this migration to the AutoDM Supabase project.
-- It lets Social Pilot composer-created automations bind idempotently to posts.

ALTER TABLE public.automations
  ADD COLUMN IF NOT EXISTS source TEXT,
  ADD COLUMN IF NOT EXISTS source_broadcast_id UUID,
  ADD COLUMN IF NOT EXISTS source_job_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS automations_social_pilot_source_broadcast_uidx
  ON public.automations (user_id, source_broadcast_id)
  WHERE source_broadcast_id IS NOT NULL;

