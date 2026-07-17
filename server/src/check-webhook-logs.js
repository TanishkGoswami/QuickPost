import supabase from './services/supabase.js';

async function checkLogs() {
  console.log('--- WEBHOOK LOGS CHECK ---');
  
  const { data: logs, error } = await supabase
    .from('webhook_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);
    
  if (error) {
    console.error('Error fetching webhook_logs:', error.message);
    return;
  }
  
  console.log(`Found ${logs?.length || 0} logs.\n`);
  for (const log of logs || []) {
    console.log(`Time: ${log.created_at}`);
    console.log(`Event ID: ${log.event_id}, Type: ${log.event_type}`);
    console.log(`IG ID: ${log.ig_id}, Sender: ${log.sender_id}`);
    console.log(`Message: "${log.message_text}"`);
    console.log(`Processed: ${log.processed}`);
    console.log(`Processing Error: ${log.processing_error || 'None'}`);
    console.log('-----------------------------');
  }
}

checkLogs().catch(console.error);
