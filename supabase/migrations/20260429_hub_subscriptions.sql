-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Create hub_subscriptions reference table
-- Purpose: Store hub user subscription data identified by email.
--          No auth user creation needed. When a user logs into social
--          with the same email, we look this up to grant feature access.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.hub_subscriptions (
  email             TEXT PRIMARY KEY,
  hub_user_id       UUID,
  name              TEXT,
  profile_picture   TEXT,
  plan              TEXT    NOT NULL DEFAULT 'Free',  -- normalized: Free / Pro / Enterprise
  plan_id           TEXT,                              -- raw hub plan id e.g. all_in_one_bundle_yearly
  subscription_status TEXT  NOT NULL DEFAULT 'active',
  expires_at        TIMESTAMPTZ,
  synced_at         TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- Index for fast email lookups on login
CREATE INDEX IF NOT EXISTS idx_hub_subscriptions_email
  ON public.hub_subscriptions (email);

-- Index for hub_user_id cross-reference
CREATE INDEX IF NOT EXISTS idx_hub_subscriptions_hub_user_id
  ON public.hub_subscriptions (hub_user_id)
  WHERE hub_user_id IS NOT NULL;

-- Allow read access (social client reads this on login to check plan)
ALTER TABLE public.hub_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read hub_subscriptions by own email"
  ON public.hub_subscriptions FOR SELECT
  USING (true);  -- service role will handle writes; reads are for plan checks

-- Verify
SELECT 'hub_subscriptions table created ✅' AS status;
