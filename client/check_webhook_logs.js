import { createClient } from '@supabase/supabase-js';

const dbs = [
  {
    name: 'Hub Database',
    url: process.env.HUB_SUPABASE_URL,
    anon: process.env.HUB_SUPABASE_ANON_KEY
  }
];

async function checkDBs() {
  for (const db of dbs) {
    if (!db.url || !db.anon) {
      console.error('Set HUB_SUPABASE_URL and HUB_SUPABASE_ANON_KEY before running this script.');
      process.exitCode = 1;
      return;
    }

    console.log(`\n=== Checking ${db.name} ===`);
    try {
      const client = createClient(db.url, db.anon);
      
      // Check social_tokens
      console.log('Querying social_tokens...');
      const { data: tokens, error: tokenError } = await client.from('social_tokens').select('*').limit(10);
      if (tokenError) {
        console.log('❌ Error querying social_tokens:', tokenError.message);
      } else {
        console.log(`✅ Found ${tokens?.length || 0} token(s) in social_tokens:`);
        tokens?.forEach(t => {
          console.log(`  - ID: ${t.id}, Provider: ${t.provider}, Username: ${t.username}, IG Business ID: ${t.instagram_business_account_id || t.instagram_business_id}, Created At: ${t.created_at}`);
        });
      }
    } catch (e) {
      console.log(`❌ Crashed querying ${db.name}:`, e.message);
    }
  }
}

checkDBs();
