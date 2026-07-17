-- SSO nonce table for JTI replay prevention.
-- Each inbound SSO token's jti is inserted here on first use;
-- a duplicate insert (unique violation) signals a replay attack.

CREATE TABLE IF NOT EXISTS public.sso_nonces (
  jti        TEXT        PRIMARY KEY,
  email      TEXT        NOT NULL,
  used_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS sso_nonces_expires_at_idx
  ON public.sso_nonces (expires_at);

-- No public access — service role key bypasses RLS automatically.
ALTER TABLE public.sso_nonces ENABLE ROW LEVEL SECURITY;

-- Optional: clean up nonces older than 1 hour past expiry.
-- Call this from a pg_cron job or a maintenance script.
CREATE OR REPLACE FUNCTION public.cleanup_expired_sso_nonces()
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  DELETE FROM public.sso_nonces
  WHERE expires_at < NOW() - INTERVAL '1 hour';
$$;
