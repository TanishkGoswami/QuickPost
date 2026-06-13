import supabase from './services/supabase.js';

async function check() {
  console.log('--- DATABASE STATUS CHECK ---');
  
  const { data: accounts, error: accError } = await supabase
    .from('instagram_accounts')
    .select('*');
    
  if (accError) {
    console.error('Error fetching instagram_accounts:', accError.message);
  } else {
    console.log(`\n--- instagram_accounts (${accounts.length}) ---`);
    for (const acc of accounts) {
      console.log(`ID: ${acc.id}`);
      console.log(`  User ID: ${acc.user_id}`);
      console.log(`  Username: ${acc.instagram_username}`);
      console.log(`  Is Connected: ${acc.is_connected}`);
      console.log(`  Token Status: ${acc.token_status}`);
      console.log(`  Webhook Status: ${acc.webhook_status}`);
      console.log(`  Page ID: ${acc.page_id}`);
      console.log(`  IG Business ID: ${acc.instagram_business_account_id}`);
    }
  }

  const { data: bots, error: botError } = await supabase
    .from('instagram_bots')
    .select('*');
    
  if (botError) {
    console.error('Error fetching instagram_bots:', botError.message);
  } else {
    console.log(`\n--- instagram_bots (${bots.length}) ---`);
    for (const bot of bots) {
      console.log(`ID: ${bot.id}`);
      console.log(`  User ID: ${bot.user_id}`);
      console.log(`  Bot Name: ${bot.bot_name}`);
      console.log(`  Business Name: ${bot.business_name}`);
      console.log(`  Instagram Account ID: ${bot.instagram_account_id}`);
      console.log(`  Is Active: ${bot.is_active}`);
    }
  }

  console.log('-----------------------------');
}

check().catch(console.error);
