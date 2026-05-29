# Historical Data Migration Guide

## Syncing All Social Pilot Data to Admin Dashboard

This guide walks you through syncing all existing/historical data from `social.getaipilot.in` to `getaipilot.in` admin dashboard.

---

## Step 1: Verify Source Data

Run these queries in **social.getaipilot.in** Supabase SQL Editor to see how much historical data you have:

```sql
-- Count records in each table
SELECT
  'users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'social-payments', COUNT(*) FROM "social-payments"
UNION ALL
SELECT 'social_tokens', COUNT(*) FROM social_tokens
UNION ALL
SELECT 'broadcasts', COUNT(*) FROM broadcasts
UNION ALL
SELECT 'user_onboarding', COUNT(*) FROM user_onboarding;
```

**Expected Output** (example):

```
table_name          | record_count
--------------------|-------------
users               | 150
social-payments     | 328
social_tokens       | 245
broadcasts          | 1,240
user_onboarding     | 89
```

---

## Step 2: Verify Hub Database Tables Exist

Run this in **getaipilot.in** Supabase SQL Editor:

```sql
-- Verify all hub tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('users', 'social_payments', 'social_tokens', 'broadcasts', 'user_onboarding')
ORDER BY table_name;
```

**Expected Output**:

```
broadcasts
social_payments
social_tokens
user_onboarding
users
```

If any table is missing, run `hub_schema.sql` first.

---

## Step 3: Deploy Edge Function

Deploy the sync function to **social.getaipilot.in**:

```bash
cd social.getaipilot.in
supabase functions deploy sync-to-hub
```

---

## Step 4: Trigger Full Historical Data Sync

### Option A: Via Admin Dashboard (Easiest)

1. Go to **getaipilot.in** → Admin Dashboard
2. Navigate to **Social Hub** tab
3. Click **"Start Sync Now"** button
4. Wait for sync to complete (shows progress and row count)

### Option B: Via cURL (Manual)

```bash
curl -X POST \
  https://YOUR_SOCIAL_PROJECT.supabase.co/functions/v1/sync-to-hub \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

Replace:

- `YOUR_SOCIAL_PROJECT` = your social.getaipilot.in project reference
- `YOUR_ANON_KEY` = anon key from social.getaipilot.in

### Option C: Via JavaScript (In Browser Console)

```javascript
const syncUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-to-hub`;
const response = await fetch(syncUrl, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
  },
});
const result = await response.json();
console.log("Sync Result:", result);
```

---

## Step 5: Verify Synced Data

After sync completes, run these in **getaipilot.in** SQL Editor:

### Check Row Counts

```sql
SELECT
  'users' as table_name, COUNT(*) as synced_count FROM users
UNION ALL
SELECT 'social_payments', COUNT(*) FROM social_payments
UNION ALL
SELECT 'social_tokens', COUNT(*) FROM social_tokens
UNION ALL
SELECT 'broadcasts', COUNT(*) FROM broadcasts
UNION ALL
SELECT 'user_onboarding', COUNT(*) FROM user_onboarding;
```

### Sample Data Verification

```sql
-- Users
SELECT id, email, name, created_at FROM users LIMIT 5;

-- Payments
SELECT id, user_id, amount, status, created_at FROM social_payments LIMIT 5;

-- Tokens
SELECT id, user_id, provider, created_at FROM social_tokens LIMIT 5;

-- Broadcasts
SELECT id, user_id, status, posted_at, created_at FROM broadcasts LIMIT 5;
```

---

## Step 6: Verify in Admin Dashboard

1. Refresh the **Social Hub** tab in Admin Dashboard
2. Check each tab to see synced data:
   - **Users** tab → Should show all users from social project
   - **Payments** tab → Should show all social-payments transactions
   - **Tokens** tab → Should show all connected social accounts
   - **Broadcasts** tab → Should show all historical posts/broadcasts

---

## Understanding the Sync Process

The edge function:

1. **Fetches all records** from each source table (users → social-payments → social_tokens → broadcasts → user_onboarding)
2. **Maps table names** (`social-payments` → `social_payments`) to match hub schema
3. **Upserts all data** in chunks of 500 rows (if record exists, updates; if new, inserts)
4. **Preserves IDs** (uses existing `id` field as unique key)

**Key Point**: The upsert operation means:

- ✅ All historical data gets synced on first run
- ✅ Running sync multiple times is safe (updates existing records)
- ✅ New data added to source will be included in next sync

---

## Sync Response Example

After running sync, you'll get a response like:

```json
{
  "success": true,
  "timestamp": "2026-04-28T10:30:45.123Z",
  "tables": [
    {
      "table": "users",
      "rowsFetched": 150,
      "rowsUpserted": 150,
      "status": "success"
    },
    {
      "table": "social-payments",
      "rowsFetched": 328,
      "rowsUpserted": 328,
      "status": "success"
    },
    {
      "table": "social_tokens",
      "rowsFetched": 245,
      "rowsUpserted": 245,
      "status": "success"
    },
    {
      "table": "broadcasts",
      "rowsFetched": 1240,
      "rowsUpserted": 1240,
      "status": "success"
    },
    {
      "table": "user_onboarding",
      "rowsFetched": 89,
      "rowsUpserted": 89,
      "status": "success"
    }
  ],
  "summary": {
    "total_tables": 5,
    "succeeded": 5,
    "failed": 0,
    "total_rows_synced": 2052
  }
}
```

---

## Troubleshooting

### Sync Returns Error

Check these in edge function logs (Supabase Dashboard → Functions → sync-to-hub):

- Missing HUB_SUPABASE_URL secret
- Missing HUB_SUPABASE_SERVICE_ROLE_KEY secret
- Network connectivity between projects

### Some Tables Failed But Others Succeeded

- Verify hub table schema matches source table structure
- Check if hub table has all columns from source table
- Run `hub_schema.sql` to ensure hub tables are complete

### Data Not Appearing in Admin Dashboard

1. Verify data exists in hub database (run SQL queries above)
2. Refresh admin dashboard
3. Check browser console for JavaScript errors
4. Verify you're logged in with admin role

---

## Schedule Recurring Syncs (Optional)

After initial sync, you can set up recurring syncs:

1. **Via Admin Dashboard**: Click "Enable Scheduled Sync" → Choose interval (1 hour, 6 hours, daily)
2. **Via Backend Cron**: Set up a scheduled function in Supabase or external cron service

---

## Data Safety

- ✅ Synced data is read-only in admin dashboard
- ✅ Source data in social.getaipilot.in remains unchanged
- ✅ Upsert is safe to run multiple times
- ✅ Each record uses `id` as unique constraint (prevents duplicates)

---

## Next Steps

After successful sync:

- [ ] Set up recurring/scheduled syncs if needed
- [ ] Configure admin dashboard role access
- [ ] Set up alerts for sync failures (optional)
- [ ] Train team on using Social Hub dashboard
