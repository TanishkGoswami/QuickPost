-- Migration: Add Bluesky support to QuickPost
-- Run this in your Supabase SQL Editor

-- Step 1: Drop the existing CHECK constraint on provider column
ALTER TABLE social_tokens 
DROP CONSTRAINT IF EXISTS social_tokens_provider_check;

-- Step 2: Add new CHECK constraint including 'bluesky'
ALTER TABLE social_tokens 
ADD CONSTRAINT social_tokens_provider_check 
CHECK (provider IN ('instagram', 'youtube', 'pinterest', 'facebook', 'bluesky'));

-- Step 3: Add bluesky_did column to store Bluesky DID (Decentralized Identifier)
ALTER TABLE social_tokens 
ADD COLUMN IF NOT EXISTS bluesky_did TEXT;

-- Step 4: Add bluesky_handle column to store Bluesky handle
ALTER TABLE social_tokens 
ADD COLUMN IF NOT EXISTS bluesky_handle TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_social_tokens_bluesky_did ON social_tokens(bluesky_did);
CREATE INDEX IF NOT EXISTS idx_social_tokens_bluesky_handle ON social_tokens(bluesky_handle);

-- Add comments
COMMENT ON COLUMN social_tokens.bluesky_did IS 'Bluesky DID (Decentralized Identifier) for AT Protocol';
COMMENT ON COLUMN social_tokens.bluesky_handle IS 'Bluesky handle (e.g., user.bsky.social)';

-- Display the updated constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'social_tokens'::regclass 
AND conname = 'social_tokens_provider_check';
