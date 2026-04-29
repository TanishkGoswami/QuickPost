-- ============================================================
-- QuickPost HUB Schema - FIX Migration
-- Run this if broadcasts table already exists but is missing user_id
-- ============================================================

-- Step 1: Add user_id column to broadcasts if it doesn't exist
ALTER TABLE broadcasts
ADD COLUMN IF NOT EXISTS user_id UUID NOT NULL DEFAULT gen_random_uuid();

-- Step 2: Add FOREIGN KEY constraint to users table
ALTER TABLE broadcasts
ADD CONSTRAINT fk_broadcasts_user_id
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Step 3: Now create the index
CREATE INDEX IF NOT EXISTS idx_broadcasts_user_id ON broadcasts(user_id);

-- Step 4: Verify columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'broadcasts'
ORDER BY ordinal_position;
