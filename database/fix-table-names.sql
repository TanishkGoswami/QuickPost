-- ============================================================
-- FIX: Rename social-payments to social_payments
-- Run in social.getaipilot.in Supabase SQL Editor
-- ============================================================

-- Step 1: Check if hyphenated table exists
SELECT 'Step 1: Checking if table exists...' as step;
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_name = 'social-payments' AND table_schema = 'public'
) as table_exists;

-- Step 2: Rename the table (if it exists) - ONLY if hyphenated version exists
-- Uncomment and run if the table has a hyphen
/*
ALTER TABLE IF EXISTS "social-payments" RENAME TO social_payments;
*/

-- Step 3: Verify rename worked
SELECT 'Step 3: Verifying rename...' as step;
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_name = 'social_payments' AND table_schema = 'public'
) as table_exists_underscore;

-- Step 4: List all tables to confirm
SELECT 'Step 4: All tables in public schema' as step;
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
