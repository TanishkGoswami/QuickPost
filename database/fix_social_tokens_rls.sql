-- Fix RLS and platform constraints for social_tokens
-- Run this in your Supabase SQL Editor

-- 1. Add missing DELETE policy
DROP POLICY IF EXISTS "Users can delete their own tokens" ON social_tokens;
CREATE POLICY "Users can delete their own tokens"
    ON social_tokens FOR DELETE
    USING (auth.uid() = user_id);

-- 2. Relax the provider check constraint to include all supported platforms
ALTER TABLE social_tokens
DROP CONSTRAINT IF EXISTS social_tokens_provider_check;

ALTER TABLE social_tokens
ADD CONSTRAINT social_tokens_provider_check
CHECK (provider IN (
  'instagram',
  'youtube',
  'pinterest',
  'facebook',
  'bluesky',
  'linkedin',
  'mastodon',
  'tiktok',
  'threads',
  'x',
  'reddit'
));

-- 3. Ensure other policies exist (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own tokens') THEN
        CREATE POLICY "Users can view their own tokens" ON social_tokens FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own tokens') THEN
        CREATE POLICY "Users can insert their own tokens" ON social_tokens FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own tokens') THEN
        CREATE POLICY "Users can update their own tokens" ON social_tokens FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;
