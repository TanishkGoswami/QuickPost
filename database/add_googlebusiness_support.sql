-- Add googleBusiness to the allowed providers in social_tokens table

-- 1. Drop the existing constraint
ALTER TABLE social_tokens 
DROP CONSTRAINT IF EXISTS social_tokens_provider_check;

-- 2. Add the new constraint including 'googleBusiness'
ALTER TABLE social_tokens 
ADD CONSTRAINT social_tokens_provider_check 
CHECK (provider IN ('youtube', 'instagram', 'facebook', 'linkedin', 'twitter', 'x', 'pinterest', 'tiktok', 'mastodon', 'bluesky', 'threads', 'reddit', 'googleBusiness'));

-- 3. Verify it was added
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'social_tokens'::regclass 
AND conname = 'social_tokens_provider_check';
