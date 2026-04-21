-- Migration: Add Threads support to QuickPost
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- Step 1: Drop the existing CHECK constraint on provider column
ALTER TABLE social_tokens 
DROP CONSTRAINT IF EXISTS social_tokens_provider_check;

-- Step 2: Add new CHECK constraint including 'threads' and all other supported platforms
-- This ensures the database accepts 'threads' as a valid provider name
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
  'threads'
));

-- Step 3: Verify the update
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'social_tokens'::regclass 
AND conname = 'social_tokens_provider_check';
