require('dotenv').config({ path: './server/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkLogs() {
  const { data, error } = await supabase
    .from('webhook_logs')
    .select('id, event_type, processed, processing_error, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error fetching logs:', error);
  } else {
    console.log('Recent webhook logs:', data);
  }
}

checkLogs();
