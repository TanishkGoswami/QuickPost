import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: './.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testFetchLogs() {
  const { data } = await supabase
    .from('webhook_logs')
    .select('payload')
    .eq('event_type', 'comments')
    .order('created_at', { ascending: false })
    .limit(1);
    
  console.log("Got log!");
}
testFetchLogs();
