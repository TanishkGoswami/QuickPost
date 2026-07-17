import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Load the staging environment variables
dotenv.config({ path: path.resolve(process.cwd(), 'server', '.env.staging') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const TEST_USER_UUID = process.env.TEST_USER_UUID;
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'quickpost-staging-test@example.com';
const TEST_USER_PASSWORD = 'password123';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !SUPABASE_ANON_KEY || !TEST_USER_UUID) {
  console.error('Missing required environment variables in server/.env.staging');
  process.exit(1);
}

// 1. Service Client (for admin tasks)
const adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// 2. Authenticated Client (for RLS testing)
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false }
});

async function runSeedScript(boundary) {
  console.log(`\n⏳ Seeding environment for: ${boundary}...`);
  try {
    const { stdout, stderr } = await execAsync(`node tests/seed-boundaries.js ${boundary}`);
    // console.log(stdout); // Optional: print seed output
    console.log(`✅ Seeded ${boundary}`);
  } catch (error) {
    console.error(`❌ Failed to run seed script for ${boundary}:`, error.stdout, error.stderr);
    process.exit(1);
  }
}

async function testAccountsBoundary(plan, boundaryArg, currentCount, maxAllowed) {
  await runSeedScript(boundaryArg);
  
  console.log(`\n🧪 Testing Accounts Boundary [${plan.toUpperCase()}]`);
  
  // Test Nth Allowed
  const { data: acc1, error: err1 } = await supabase.from('instagram_accounts').insert({
    user_id: TEST_USER_UUID,
    page_id: `test_page_allowed_${Date.now()}`,
    instagram_user_id: `test_biz_id_allowed_${Date.now()}`,
    access_token_encrypted: 'mock_token',
    token_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  });

  if (err1) {
    console.log(`❌ FAILURE: Expected ${currentCount + 1}th account to be ALLOWED, but it failed:`, err1.message);
  } else {
    console.log(`✅ SUCCESS: ${currentCount + 1}th account was ALLOWED as expected.`);
  }

  // Test N+1 Blocked
  const { data: acc2, error: err2 } = await supabase.from('instagram_accounts').insert({
    user_id: TEST_USER_UUID,
    page_id: `test_page_blocked_${Date.now()}`,
    instagram_user_id: `test_biz_id_blocked_${Date.now()}`,
    access_token_encrypted: 'mock_token',
    token_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  });

  if (!err2) {
    console.log(`❌ FAILURE (SECURITY ISSUE): Expected ${maxAllowed + 1}th account to be BLOCKED by RLS, but it succeeded!`);
  } else {
    console.log(`✅ SUCCESS: ${maxAllowed + 1}th account was BLOCKED as expected (Error: ${err2.message})`);
  }
}

async function testAutomationsBoundary() {
  await runSeedScript('free-automations');
  console.log(`\n🧪 Testing Automations Boundary [FREE]`);
  
  const accountId = await getFirstAccountId();
  
  // Test 1st Allowed
  const { error: err1 } = await supabase.from('automations').insert({
    user_id: TEST_USER_UUID,
    name: 'Allowed Automation',
    instagram_account_id: accountId,
    trigger_type: 'comment',
    trigger_keywords: ['test']
  });

  if (err1) console.log(`❌ FAILURE: Expected 1st automation to be ALLOWED, but it failed:`, err1.message);
  else console.log(`✅ SUCCESS: 1st automation was ALLOWED as expected.`);

  // Test 2nd Blocked
  const { error: err2 } = await supabase.from('automations').insert({
    user_id: TEST_USER_UUID,
    name: 'Blocked Automation',
    instagram_account_id: accountId,
    trigger_type: 'comment',
    trigger_keywords: ['test']
  });

  if (!err2) console.log(`❌ FAILURE (SECURITY ISSUE): Expected 2nd automation to be BLOCKED, but it succeeded!`);
  else console.log(`✅ SUCCESS: 2nd automation was BLOCKED as expected (Error: ${err2.message})`);
}

async function testQueueBoundary() {
  await runSeedScript('free-queue');
  console.log(`\n🧪 Testing Scheduled Queue Boundary [FREE]`);
  
  // Test 10th Allowed
  const { error: err1 } = await supabase.from('broadcasts').insert({
    user_id: TEST_USER_UUID,
    caption: `Allowed Broadcast`,
    status: 'scheduled',
    scheduled_for: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  });

  if (err1) console.log(`❌ FAILURE: Expected 10th scheduled post to be ALLOWED, but failed:`, err1.message);
  else console.log(`✅ SUCCESS: 10th scheduled post was ALLOWED as expected.`);

  // Test 11th Blocked
  const { error: err2 } = await supabase.from('broadcasts').insert({
    user_id: TEST_USER_UUID,
    caption: `Blocked Broadcast`,
    status: 'scheduled',
    scheduled_for: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  });

  if (!err2) console.log(`❌ FAILURE (SECURITY ISSUE): Expected 11th scheduled post to be BLOCKED, but it succeeded!`);
  else console.log(`✅ SUCCESS: 11th scheduled post was BLOCKED as expected (Error: ${err2.message})`);
}

async function testHistoryBoundary() {
  await runSeedScript('free-history');
  console.log(`\n🧪 Testing History Boundary [FREE]`);
  
  // The history boundary script seeds a 6-day old and 8-day old post.
  // The RLS policy should only allow us to select the 6-day old post.
  const { data: broadcasts, error } = await supabase
    .from('broadcasts')
    .select('*')
    .eq('status', 'sent');

  if (error) {
    console.log(`❌ FAILURE: Failed to query history:`, error.message);
    return;
  }

  if (broadcasts.length === 1) {
    console.log(`✅ SUCCESS: History correctly returned exactly 1 record (the 6-day old one).`);
  } else {
    console.log(`❌ FAILURE (SECURITY ISSUE): Expected exactly 1 history record, but got ${broadcasts.length}.`);
  }
}

async function getFirstAccountId() {
  const { data } = await adminSupabase.from('instagram_accounts').select('id').eq('user_id', TEST_USER_UUID).limit(1);
  if (!data || data.length === 0) {
    // Quick fallback creation if none exists
    const { data: acc } = await adminSupabase.from('instagram_accounts').insert({
      user_id: TEST_USER_UUID,
      page_id: `test_page_mock_${Date.now()}`,
      instagram_user_id: `test_biz_id_mock_${Date.now()}`,
      access_token_encrypted: 'mock_token',
      token_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    }).select('id').single();
    return acc.id;
  }
  return data[0].id;
}

async function main() {
  console.log('🔄 Setting up test user password and authenticating...');
  
  // 0. Fetch the actual email of the user
  const { data: userData, error: getUserErr } = await adminSupabase.auth.admin.getUserById(TEST_USER_UUID);
  if (getUserErr || !userData?.user) {
    console.error('Failed to get test user from auth.users:', getUserErr?.message);
    process.exit(1);
  }
  const actualEmail = userData.user.email;

  // 1. Force the test user's password using the admin API
  const { error: updateErr } = await adminSupabase.auth.admin.updateUserById(TEST_USER_UUID, {
    password: TEST_USER_PASSWORD,
    email_confirm: true
  });
  if (updateErr) {
    console.error('Failed to update test user password:', updateErr.message);
    process.exit(1);
  }

  // 2. Sign in as the user
  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email: actualEmail,
    password: TEST_USER_PASSWORD
  });
  if (signInErr) {
    console.error('Failed to sign in:', signInErr.message);
    process.exit(1);
  }

  console.log('✅ Logged in successfully. Starting Boundary Tests...\n');

  // FREE TIER
  await testAccountsBoundary('free', 'free-accounts', 2, 3);
  await testAutomationsBoundary();
  await testQueueBoundary();
  await testHistoryBoundary();

  // PRO TIER
  await testAccountsBoundary('pro', 'all-pro', 9, 10);
  
  // ENTERPRISE TIER
  await testAccountsBoundary('enterprise', 'all-ent', 29, 30);
  
  console.log('\n🎉 All tests completed.');
  process.exit(0);
}

main().catch(console.error);
