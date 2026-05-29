-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Add plan & subscription_status to users table
-- Date: 2026-04-29
-- Purpose: Allow cross-DB sync from getaipilot.in hub to store plan info
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add plan column (Free / Pro / Enterprise)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'Free';

-- 2. Add subscription_status column
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active';

-- 3. Add hub_user_id for cross-reference (optional but useful)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS hub_user_id UUID;

-- 4. Index for lookups
CREATE INDEX IF NOT EXISTS idx_users_hub_user_id
  ON public.users (hub_user_id)
  WHERE hub_user_id IS NOT NULL;

-- 5. Verify
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
  AND column_name IN ('plan', 'subscription_status', 'hub_user_id');
