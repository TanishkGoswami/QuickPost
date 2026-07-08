import { load } from 'https://deno.land/std@0.224.0/dotenv/mod.ts';
import { getSupabaseAdmin } from './db.ts';
import { sendInstagramPrivateReplyGenericTemplate, sendInstagramGenericTemplate } from './metaService.ts';
import { decryptTokenBundle } from './tokenService.ts';

const env = await load({ envPath: '../../server/.env' });
Object.keys(env).forEach(key => Deno.env.set(key, env[key]));

const supabase = getSupabaseAdmin();

async function test() {
  const { data: account } = await supabase
    .from('instagram_accounts')
    .select('*')
    .eq('ig_id', '26502131352780274')
    .single();

  const tokenBundle = decryptTokenBundle(account.access_token);
  const pageAccessToken = tokenBundle.pageAccessToken;

  const elements = [
    {
      title: 'Test Template',
      buttons: [
        { type: 'postback', title: 'Send me the link', payload: 'Send me the link' }
      ]
    }
  ];

  console.log("Testing Private Reply Template...");
  const res1 = await sendInstagramPrivateReplyGenericTemplate(
    '26502131352780274',
    '18106329409814431', // The comment ID from latest log
    elements,
    pageAccessToken
  );
  console.log("Private Reply Result:", res1);

  console.log("Testing Standard DM Template...");
  const res2 = await sendInstagramGenericTemplate(
    '26502131352780274',
    '17841449227923094', // The sender IGSID
    elements,
    pageAccessToken
  );
  console.log("Standard DM Result:", res2);
}

test();
