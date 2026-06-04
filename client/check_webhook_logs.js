import { createClient } from '@supabase/supabase-js';

const dbs = [
  {
    name: 'Hub Database (uklxlappjcuvdqjvecfh)',
    url: 'https://uklxlappjcuvdqjvecfh.supabase.co',
    anon: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrbHhsYXBwamN1dmRxanZlY2ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxNDcwODMsImV4cCI6MjA4MzcyMzA4M30.v-TvyQrYpttcmCnzT9MkUlBgGXXU3lspZCxCYm-Oil4'
  }
];

async function checkDBs() {
  for (const db of dbs) {
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
