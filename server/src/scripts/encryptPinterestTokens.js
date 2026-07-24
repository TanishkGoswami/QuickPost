import 'dotenv/config';
import supabase from '../services/supabase.js';
import { encryptToken } from '../services/tokenEncryption.js';

/**
 * Migration Script: Safely and idempotently encrypt plaintext Pinterest tokens in social_tokens table.
 */
async function migratePinterestTokens() {
  console.log('\n==================================================');
  console.log('MIGRATION: Encrypt Pinterest Tokens in social_tokens');
  console.log('==================================================\n');

  const { data: rows, error } = await supabase
    .from('social_tokens')
    .select('id, user_id, provider, access_token, refresh_token, username')
    .eq('provider', 'pinterest');

  if (error) {
    console.error('❌ Failed to fetch social_tokens:', error.message);
    process.exit(1);
  }

  console.log(`Found ${rows?.length || 0} Pinterest token record(s) in social_tokens.`);

  let updatedCount = 0;
  for (const row of (rows || [])) {
    const isAccessEncrypted = row.access_token && row.access_token.startsWith('enc:v1:');
    const isRefreshEncrypted = row.refresh_token ? row.refresh_token.startsWith('enc:v1:') : true;

    if (isAccessEncrypted && isRefreshEncrypted) {
      console.log(`- Record ID ${row.id} (@${row.username}): Already encrypted ✅`);
      continue;
    }

    const updates = {};
    if (!isAccessEncrypted && row.access_token) {
      updates.access_token = encryptToken(row.access_token);
    }
    if (!isRefreshEncrypted && row.refresh_token) {
      updates.refresh_token = encryptToken(row.refresh_token);
    }

    if (Object.keys(updates).length > 0) {
      updates.updated_at = new Date().toISOString();
      const { error: updateErr } = await supabase
        .from('social_tokens')
        .update(updates)
        .eq('id', row.id);

      if (updateErr) {
        console.error(`❌ Failed to update record ID ${row.id}:`, updateErr.message);
      } else {
        console.log(`- Record ID ${row.id} (@${row.username}): Encrypted successfully ✅`);
        updatedCount++;
      }
    }
  }

  console.log(`\nMigration complete. Successfully encrypted ${updatedCount} token record(s).\n`);
}

migratePinterestTokens().then(() => process.exit(0)).catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
