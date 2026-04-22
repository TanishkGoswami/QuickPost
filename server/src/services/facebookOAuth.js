import axios from 'axios';
import crypto from 'crypto';
import supabase from './supabase.js';

const GRAPH_VERSION = 'v21.0';

const FACEBOOK_SCOPES = [
  'public_profile',
  'pages_show_list',
  'pages_read_engagement',
  'pages_manage_metadata',
  'pages_manage_posts'
];

function base64urlEncode(obj) {
  return Buffer.from(JSON.stringify(obj)).toString('base64url');
}

class FacebookOAuth {
  constructor() {
    this.appId = process.env.FACEBOOK_APP_ID || process.env.INSTAGRAM_APP_ID;
    this.appSecret = process.env.FACEBOOK_APP_SECRET || process.env.INSTAGRAM_APP_SECRET;
    this.redirectUri =
      process.env.FACEBOOK_REDIRECT_URI ||
      'http://localhost:5000/api/auth/facebook/callback';
  }

  makeState(userId) {
    return base64urlEncode({
      userId,
      provider: 'facebook',
      nonce: crypto.randomUUID(),
      ts: Date.now()
    });
  }

  getAuthorizationUrl(state) {
    const params = new URLSearchParams({
      client_id: this.appId,
      redirect_uri: this.redirectUri,
      scope: FACEBOOK_SCOPES.join(','),
      response_type: 'code',
      auth_type: 'rerequest',
      prompt: 'consent',
      state
    });

    return `https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth?${params.toString()}`;
  }

  async exchangeCodeForToken(code) {
    try {
      console.log('\n🔵 FB: Starting token exchange...');

      // code -> short-lived user token
      const shortRes = await axios.get(`https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token`, {
        params: {
          client_id: this.appId,
          client_secret: this.appSecret,
          redirect_uri: this.redirectUri,
          code
        }
      });
      const shortUserToken = shortRes.data.access_token;
      console.log('✅ FB: short-lived token obtained');

      // short -> long-lived user token
      const longRes = await axios.get(`https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token`, {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: this.appId,
          client_secret: this.appSecret,
          fb_exchange_token: shortUserToken
        }
      });

      const longUserToken = longRes.data.access_token;
      console.log('✅ FB: long-lived token obtained');

      // user info
      const meRes = await axios.get(`https://graph.facebook.com/${GRAPH_VERSION}/me`, {
        params: { access_token: longUserToken, fields: 'id,name' }
      });

      console.log('\n👤 Facebook User Info:');
      console.log('  Name:', meRes.data.name);
      console.log('  ID:', meRes.data.id);

      // pages try /me/accounts
      let pages = [];
      try {
        const pagesRes = await axios.get(`https://graph.facebook.com/${GRAPH_VERSION}/me/accounts`, {
          params: { access_token: longUserToken, fields: 'id,name,access_token' }
        });
        pages = pagesRes.data?.data || [];
      } catch (e) {}

      // fallback debug_token granular scopes
      if (!pages.length) {
        console.log('⚠️ FB: /me/accounts empty, using debug_token fallback...');

        const debugRes = await axios.get(`https://graph.facebook.com/${GRAPH_VERSION}/debug_token`, {
          params: {
            input_token: longUserToken,
            access_token: `${this.appId}|${this.appSecret}`
          }
        });

        const granular = debugRes.data?.data?.granular_scopes || [];
        const pageScope = granular.find(g => g.scope === 'pages_show_list');
        const pageIds = pageScope?.target_ids || [];

        console.log('📌 FB: Page IDs from granular scopes:', pageIds);

        for (const pid of pageIds) {
          const pageDetails = await axios.get(`https://graph.facebook.com/${GRAPH_VERSION}/${pid}`, {
            params: { access_token: longUserToken, fields: 'id,name,access_token' }
          });
          pages.push(pageDetails.data);
        }
      }

      console.log('\n📄 Found pages:', pages.length);

      if (!pages.length) {
        throw new Error(
          'No Facebook Pages found for this token. During consent, select your Page (Pages selection screen) and try again.'
        );
      }

      // Buffer clone: you should store user token too, plus page token for selected page
      // For now: auto-pick first page (you can add page-picker UI later)
      const selectedPage = pages[0];

      return {
        userAccessToken: longUserToken,
        pageAccessToken: selectedPage.access_token || longUserToken,
        pageId: selectedPage.id,
        userInfo: {
          pageName: selectedPage.name,
          pageId: selectedPage.id
        }
      };
    } catch (error) {
      console.error('❌ FB token exchange error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error?.message || error.message || 'Failed to exchange Facebook authorization code');
    }
  }

  async storeTokens(userId, tokenData) {
    try {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 60);

      const payload = {
        user_id: userId,
        provider: 'facebook',
        access_token: tokenData.pageAccessToken,
        token_expiry: expiryDate.toISOString(),
        page_id: tokenData.pageId,
        account_id: tokenData.pageId,
        username: tokenData.userInfo?.pageName,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('social_tokens')
        .upsert(payload, { onConflict: 'user_id,provider' })
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error storing FB tokens:', error);
      throw new Error('Failed to store Facebook authentication');
    }
  }
}

export default new FacebookOAuth();
