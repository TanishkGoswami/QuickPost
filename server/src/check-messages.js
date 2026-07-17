import supabase from './services/supabase.js';

async function checkMessages() {
  console.log('--- MESSAGES TABLE CHECK ---');
  
  const { data: messages, error } = await supabase
    .from('instagram_messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);
    
  if (error) {
    console.error('Error fetching instagram_messages:', error.message);
    return;
  }
  
  console.log(`Found ${messages?.length || 0} messages.\n`);
  for (const msg of messages || []) {
    console.log(`Time: ${msg.created_at}`);
    console.log(`ID: ${msg.id}`);
    console.log(`Direction: ${msg.direction}, Type: ${msg.message_type}`);
    console.log(`Sender: ${msg.sender_id}, Recipient: ${msg.recipient_id}`);
    console.log(`Text: "${msg.message_text}"`);
    console.log(`AI generated: ${msg.ai_generated}, Confidence: ${msg.confidence_score}`);
    console.log(`Status: ${msg.status}`);
    console.log('-----------------------------');
  }
}

checkMessages().catch(console.error);
