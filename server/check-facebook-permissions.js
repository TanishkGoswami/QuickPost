import axios from "axios";
import dotenv from 'dotenv';
import supabase from './src/services/supabase.js';

dotenv.config();

async function debugFacebookToken(accessToken) {
  const appId = process.env.FACEBOOK_APP_ID;
  const appSecret = process.env.FACEBOOK_APP_SECRET;

  const res = await axios.get(`https://graph.facebook.com/v18.0/debug_token`, {
    params: {
      input_token: accessToken,
      access_token: `${appId}|${appSecret}`
    }
  });

  console.log("🧪 Facebook Token Debug Info:");
  console.log(JSON.stringify(res.data.data, null, 2));
  console.log("\n🔐 Scopes:", res.data?.data?.scopes);
  console.log("\n✅ Has pages_manage_posts:", res.data?.data?.scopes?.includes('pages_manage_posts'));
  return res.data?.data?.scopes || [];
}

async function checkFacebookPermissions(userId) {
  try {
    const { data, error } = await supabase
      .from('social_tokens')
      .select('access_token')
      .eq('user_id', userId)
      .eq('provider', 'facebook')
      .single();

    if (error || !data) {
      console.error('❌ Facebook not connected');
      return;
    }

    await debugFacebookToken(data.access_token);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Replace with your user ID
const userId = '812e8c72-34cd-4ce7-bac8-ca828af70f78';
checkFacebookPermissions(userId);
