-- ============================================================
-- CHECK ACTUAL TABLE NAMES in social.getaipilot.in
-- Run this FIRST to see what tables actually exist
-- ============================================================

-- List all public tables
SELECT
  table_name,
  CASE
    WHEN table_name LIKE '%payment%' THEN '💰 PAYMENT TABLE'
    WHEN table_name LIKE '%token%' THEN '🔑 TOKEN TABLE'
    WHEN table_name LIKE '%broadcast%' THEN '📢 BROADCAST TABLE'
    WHEN table_name LIKE '%user%' THEN '👤 USER TABLE'
    ELSE '📋 OTHER'
  END as table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check if these specific tables exist
SELECT 'Checking for social-payments (hyphen)...' as check;
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_name = 'social-payments' AND table_schema = 'public'
) as exists_hyphen;

SELECT 'Checking for social_payments (underscore)...' as check;
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_name = 'social_payments' AND table_schema = 'public'
) as exists_underscore;

SELECT 'Checking for payments...' as check;
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_name = 'payments' AND table_schema = 'public'
) as exists_payments;
