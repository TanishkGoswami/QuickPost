-- ============================================================
-- Pre-Sync Verification Script
-- Run in social.getaipilot.in Supabase SQL Editor
-- ============================================================

-- 1. Count all records in source tables
SELECT
  'users' as table_name,
  COUNT(*) as record_count,
  MIN(created_at) as oldest_record,
  MAX(created_at) as newest_record
FROM users

UNION ALL

SELECT
  'social_payments',
  COUNT(*),
  MIN(created_at),
  MAX(created_at)
FROM social_payments

UNION ALL

SELECT
  'social_tokens',
  COUNT(*),
  MIN(created_at),
  MAX(created_at)
FROM social_tokens

UNION ALL

SELECT
  'broadcasts',
  COUNT(*),
  MIN(created_at),
  MAX(created_at)
FROM broadcasts

UNION ALL

SELECT
  'user_onboarding',
  COUNT(*),
  MIN(created_at),
  MAX(created_at)
FROM user_onboarding;

-- 2. Check for any data quality issues
-- Duplicate emails
SELECT email, COUNT(*) as count
FROM users
GROUP BY email
HAVING COUNT(*) > 1;

-- Orphaned payments (payments without users)
SELECT COUNT(*) as orphaned_payments
FROM social_payments p
LEFT JOIN users u ON p.user_id = u.id
WHERE u.id IS NULL;

-- Orphaned tokens (tokens without users)
SELECT COUNT(*) as orphaned_tokens
FROM social_tokens t
LEFT JOIN users u ON t.user_id = u.id
WHERE u.id IS NULL;

-- Orphaned broadcasts (broadcasts without users)
SELECT COUNT(*) as orphaned_broadcasts
FROM broadcasts b
LEFT JOIN users u ON b.user_id = u.id
WHERE u.id IS NULL;

-- 3. Check payment statuses
SELECT status, COUNT(*) as count
FROM social_payments
GROUP BY status;

-- 4. Check broadcast statuses
SELECT status, COUNT(*) as count
FROM broadcasts
GROUP BY status;

-- 5. Check token providers distribution
SELECT provider, COUNT(*) as count
FROM social_tokens
GROUP BY provider
ORDER BY count DESC;
