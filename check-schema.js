import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: path.resolve(process.cwd(), 'server', '.env.staging') });

async function check() {
  const r = await fetch(process.env.SUPABASE_URL + '/graphql/v1', { 
    method: 'POST', 
    headers: { 
      apikey: process.env.SUPABASE_SERVICE_KEY, 
      Authorization: 'Bearer ' + process.env.SUPABASE_SERVICE_KEY, 
      'Content-Type': 'application/json' 
    }, 
    body: JSON.stringify({query: '{ __type(name: "InstagramAccounts") { fields { name } } }'}) 
  });
  const data = await r.json();
  console.log('InstagramAccounts schema from GraphQL:', JSON.stringify(data, null, 2));

  // try reloading schema cache
  console.log('Sending schema reload request...');
  const reload = await fetch(process.env.SUPABASE_URL + '/rest/v1/', { 
    method: 'OPTIONS', 
    headers: { 
      apikey: process.env.SUPABASE_SERVICE_KEY, 
      Authorization: 'Bearer ' + process.env.SUPABASE_SERVICE_KEY, 
      'Accept-Profile': 'public' 
    }
  });
  console.log('Reload response status:', reload.status);
}
check();
