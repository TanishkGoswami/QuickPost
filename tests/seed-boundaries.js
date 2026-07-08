import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load the staging environment variables from server/.env.staging
dotenv.config({ path: path.resolve(process.cwd(), 'server', '.env.staging') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const TEST_USER_UUID = process.env.TEST_USER_UUID;
const TEST_USER_EMAIL =
  process.env.TEST_USER_EMAIL || 'quickpost-staging-test@example.com';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !TEST_USER_UUID) {
  console.error('Missing required environment variables in server/.env.staging');
  console.error('Ensure SUPABASE_URL, SUPABASE_SERVICE_KEY, and TEST_USER_UUID are set.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  const args = process.argv.slice(2);
  const boundary = args[0];

  if (!boundary) {
    console.log(`
Usage: node tests/seed-boundaries.js <boundary>

Available boundaries:
  all-free          : Seeds ALL free boundaries at once
  all-pro           : Seeds ALL pro boundaries at once
  all-ent           : Seeds ALL enterprise boundaries at once
  free-autodm       : 49/50 Free Auto-DM replies
  free-contacts     : 99/100 Free contacts
  free-automations  : 0/1 Free automations
  free-accounts     : 2/3 Free accounts
  free-queue        : 9/10 Free scheduled queue (per channel)
  free-history      : sent posts at 6 and 8 days for retention testing
  pro-accounts      : 9/10 Pro accounts
  ent-accounts      : 29/30 Enterprise accounts
  
Use this script against a STAGING database only.
    `);
    process.exit(0);
  }

  console.log(`Seeding boundary: ${boundary} for user: ${TEST_USER_UUID}...`);
  await ensurePublicUser();

  switch (boundary) {
    case 'free-autodm':
      await setPlan('free');
      await seedUsage('autodm_replies_per_month', 49);
      console.log('Seeded 49 Auto-DM replies. Next DM (50th) should succeed with watermark. 51st should fail.');
      break;
    
    case 'free-contacts':
      await setPlan('free');
      await clearContacts();
      await seedMockContacts(99);
      console.log('Seeded 99 contacts. 100th contact should succeed. 101st should fail.');
      break;

    case 'free-automations':
      await setPlan('free');
      await clearAutomations();
      console.log('Cleared automations (0/1). 1st automation should succeed. 2nd should fail.');
      break;

    case 'free-accounts':
      await setPlan('free');
      await clearAccounts();
      await seedMockAccounts(2);
      console.log('Seeded 2 accounts. 3rd account should succeed. 4th should fail.');
      break;

    case 'free-queue':
      await setPlan('free');
      await clearBroadcasts();
      await seedMockBroadcasts(9, 'scheduled');
      console.log('Seeded 9 scheduled broadcasts. 10th should succeed. 11th should fail.');
      break;
      
    case 'free-history':
      await setPlan('free');
      await clearBroadcasts();
      await seedHistoryBroadcasts(7);
      console.log('Seeded 2 sent broadcasts (6 days ago and 8 days ago).');
      console.log('Querying history should only return the 6-day-old one.');
      break;
      
    case 'pro-accounts':
      await setPlan('pro');
      await clearAccounts();
      await seedMockAccounts(9);
      console.log('Set plan to PRO and seeded 9 accounts. 10th should succeed. 11th should fail.');
      break;
      
    case 'ent-accounts':
      await setPlan('enterprise');
      await clearAccounts();
      await seedMockAccounts(29);
      console.log('Set plan to ENTERPRISE and seeded 29 accounts. 30th should succeed. 31st should fail.');
      break;

    case 'all-free':
      await setPlan('free');
      await clearContacts();
      await clearAutomations();
      await clearAccounts();
      await clearBroadcasts();
      
      // Seed all free boundaries
      await seedUsage('autodm_replies_per_month', 49);
      await seedMockAccounts(2);
      await seedMockContacts(99); // depends on mock accounts
      await seedMockBroadcasts(9, 'scheduled');
      await seedHistoryBroadcasts(7);
      
      console.log('✅ Seeded ALL free boundaries:');
      console.log(' - 49/50 Auto-DM replies');
      console.log(' - 99/100 Contacts');
      console.log(' - 0/1 Automations');
      console.log(' - 2/3 Instagram Accounts');
      console.log(' - 9/10 Scheduled Queue items');
      console.log(' - 2 History items (6 and 8 days old)');
      break;

    case 'all-pro':
      await setPlan('pro');
      await clearContacts();
      await clearAutomations();
      await clearAccounts();
      await clearBroadcasts();
      
      await seedMockAccounts(9);
      await seedHistoryBroadcasts(90);
      console.log('✅ Seeded ALL pro boundaries:');
      console.log(' - 9/10 Instagram Accounts');
      console.log(' - 2 History items (89 and 91 days old, retention is 90 days)');
      console.log(' - (Contacts, Automations, and Scheduled Queue limits are virtually unlimited)');
      break;

    case 'all-ent':
      await setPlan('enterprise');
      await clearContacts();
      await clearAutomations();
      await clearAccounts();
      await clearBroadcasts();
      
      await seedMockAccounts(29);
      await seedHistoryBroadcasts(365);
      console.log('✅ Seeded ALL enterprise boundaries:');
      console.log(' - 29/30 Instagram Accounts');
      console.log(' - 2 History items (364 and 366 days old, retention is 365 days)');
      console.log(' - (Contacts, Automations, and Scheduled Queue limits are virtually unlimited)');
      break;

    default:
      console.error(`Unknown boundary: ${boundary}`);
      process.exit(1);
  }

  console.log('Done.');
}

async function setPlan(planId) {
  const { error } = await supabase
    .from('app_subscriptions')
    .upsert({ 
      user_id: TEST_USER_UUID, 
      plan_id: planId, 
      status: 'active',
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      source: 'standalone'
    }, { onConflict: 'user_id, source' });
    
  if (error) {
    console.error('Error setting plan:', error);
    process.exit(1);
  }
}

async function ensurePublicUser() {
  // 1. Ensure user exists in auth.users via admin API
  const { data: existingUser } = await supabase.auth.admin.getUserById(TEST_USER_UUID);
  
  if (!existingUser?.user) {
    const { error: authErr } = await supabase.auth.admin.createUser({
      id: TEST_USER_UUID,
      email: TEST_USER_EMAIL,
      email_confirm: true,
      user_metadata: { name: 'QuickPost Staging Test' }
    });
    
    // Ignore error if it's just a duplicate key or similar already-exists error
    if (authErr && !authErr.message?.includes('already exists') && authErr.status !== 500) {
      console.error('Error ensuring auth.users test row:', authErr);
      process.exit(1);
    }
  }

  // 2. Ensure user exists in public.users
  const { error } = await supabase
    .from('users')
    .upsert(
      {
        id: TEST_USER_UUID,
        email: TEST_USER_EMAIL,
        name: 'QuickPost Staging Test',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    );

  if (error) {
    console.error('Error ensuring public.users test row:', error);
    process.exit(1);
  }
}

async function seedUsage(metric, amount) {
  const now = new Date();
  const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    .toISOString()
    .slice(0, 10);
  const periodEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0))
    .toISOString()
    .slice(0, 10);

  const { error } = await supabase
    .from('entitlement_usage')
    .upsert({
      user_id: TEST_USER_UUID,
      metric: metric,
      used: amount,
      period_start: periodStart,
      period_end: periodEnd
    }, { onConflict: 'user_id,metric,period_start' });

  if (error) {
    console.error(`Error seeding usage for ${metric}:`, error);
    process.exit(1);
  }
}

async function clearContacts() {
  const { error } = await supabase.from('contacts').delete().eq('user_id', TEST_USER_UUID);
  if (error) console.error('Error clearing contacts:', error);
}

async function seedMockContacts(count) {
  // we also need a dummy account to associate contacts with
  let { data: accounts } = await supabase.from('instagram_accounts').select('id').eq('user_id', TEST_USER_UUID).limit(1);
  let accountId;
  if (!accounts || accounts.length === 0) {
    const { data: newAccount, error: accError } = await supabase.from('instagram_accounts').insert({
      user_id: TEST_USER_UUID,
      page_id: 'mock_page',
      instagram_user_id: 'mock_biz_id',
      access_token_encrypted: 'mock_token',
      token_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    }).select('id').single();
    if (accError) {
      console.error('Failed to create dummy account for contacts', accError);
      process.exit(1);
    }
    accountId = newAccount.id;
  } else {
    accountId = accounts[0].id;
  }

  const contacts = Array.from({ length: count }).map((_, i) => ({
    user_id: TEST_USER_UUID,
    instagram_account_id: accountId,
    instagram_user_id: `mock_user_${i}_${Date.now()}`,
    username: `mock_contact_${i}`
  }));
  
  const { error } = await supabase.from('contacts').insert(contacts);
  if (error) {
    console.error('Error seeding contacts:', error);
    process.exit(1);
  }
}

async function clearAutomations() {
  const { error } = await supabase.from('automations').delete().eq('user_id', TEST_USER_UUID);
  if (error) console.error('Error clearing automations:', error);
}

async function clearAccounts() {
  const { error } = await supabase.from('instagram_accounts').delete().eq('user_id', TEST_USER_UUID);
  if (error) console.error('Error clearing accounts:', error);
}

async function seedMockAccounts(count) {
  const accounts = Array.from({ length: count }).map((_, i) => ({
    user_id: TEST_USER_UUID,
    page_id: `mock_page_${i}_${Date.now()}`,
    instagram_user_id: `mock_biz_id_${i}_${Date.now()}`,
    access_token_encrypted: 'mock_token',
    token_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  }));

  const { error } = await supabase.from('instagram_accounts').insert(accounts);
  if (error) {
    console.error('Error seeding accounts:', error);
    process.exit(1);
  }
}

async function clearBroadcasts() {
  const { error } = await supabase.from('broadcasts').delete().eq('user_id', TEST_USER_UUID);
  if (error) console.error('Error clearing broadcasts:', error);
}

async function seedMockBroadcasts(count, status) {
  const broadcasts = Array.from({ length: count }).map((_, i) => ({
    user_id: TEST_USER_UUID,
    caption: `Mock Broadcast ${i}`,
    video_filename: `mock_video_${i}.mp4`,
    status: status,
    scheduled_for: status === 'scheduled' ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null,
    selected_channels: ['instagram']
  }));
  const { error } = await supabase.from('broadcasts').insert(broadcasts);
  if (error) {
    console.error('Error seeding broadcasts:', error);
    process.exit(1);
  }
}

async function seedHistoryBroadcasts(boundaryDays) {
  const insideDaysAgo = new Date();
  insideDaysAgo.setDate(insideDaysAgo.getDate() - (boundaryDays - 1));
  
  const outsideDaysAgo = new Date();
  outsideDaysAgo.setDate(outsideDaysAgo.getDate() - (boundaryDays + 1));

  const broadcasts = [
    {
      user_id: TEST_USER_UUID,
      caption: `${boundaryDays - 1} Days Ago Post`,
      video_filename: `mock_vid.mp4`,
      status: 'sent',
      created_at: insideDaysAgo.toISOString()
    },
    {
      user_id: TEST_USER_UUID,
      caption: `${boundaryDays + 1} Days Ago Post`,
      video_filename: `mock_vid2.mp4`,
      status: 'sent',
      created_at: outsideDaysAgo.toISOString()
    }
  ];

  const { error } = await supabase.from('broadcasts').insert(broadcasts);
  if (error) {
    console.error('Error seeding history broadcasts:', error);
    process.exit(1);
  }
}

main().catch(console.error);
