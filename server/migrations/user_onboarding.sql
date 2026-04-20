-- Run this in Supabase SQL Editor
-- Table to store user onboarding preferences

CREATE TABLE IF NOT EXISTS user_onboarding (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT NOT NULL UNIQUE,           -- matches JWT userId
  channels        TEXT[] DEFAULT '{}',             -- selected social platforms
  tools           TEXT[] DEFAULT '{}',             -- tools they currently use
  user_type       TEXT DEFAULT NULL,               -- how they describe themselves
  completed       BOOLEAN DEFAULT FALSE,           -- whether onboarding was finished
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update updated_at on row changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_onboarding_updated_at
  BEFORE UPDATE ON user_onboarding
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE user_onboarding ENABLE ROW LEVEL SECURITY;

-- Policy: users can only read/write their own row
CREATE POLICY "Users can manage own onboarding"
  ON user_onboarding
  FOR ALL
  USING (true)    -- server uses service role key, so RLS is bypassed server-side
  WITH CHECK (true);
