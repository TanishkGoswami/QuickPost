import axios from 'axios';
import crypto from 'crypto';
import supabase from './supabase.js';

const GRAPH_VERSION = 'v21.0';

// ✅ Add instagram_content_publish (required for posting)
const INSTAGRAM_SCOPES = [
  'public_profile',
  'pages_show_list',
  'pages_read_engagement',
  'pages_manage_metadata',
  'instagram_basic',
  'instagram_manage_insights',
  'instagram_content_publish'
];

function base64urlEncode(obj) {
  return Buffer.from(JSON.stringify(obj)).toString('base64url');
}

class InstagramOAuthService {
  constructor() {
    this.appId = process.env.INSTAGRAM_APP_ID;
    this.appSecret = process.env.INSTAGRAM_APP_SECRET;
    this.redirectUri =
      process.env.INSTAGRAM_REDIRECT_URI ||
      'http://localhost:5000/api/auth/instagram/callback';

    if (!this.appId || !this.appSecret) {
      console.warn('⚠️ INSTAGRAM_APP_ID or INSTAGRAM_APP_SECRET missing in env');
    }
  }

  /**
   * Create secure state for OAuth
   */
  makeState(userId) {
    return base64urlEncode({
      userId,
      provider: 'instagram',
      nonce: crypto.randomUUID(),
      ts: Date.now()
    });
  }

  /**
   * Generate Instagram OAuth authorization URL
   */
  getAuthorizationUrl(state) {
    const params = new URLSearchParams({
      client_id: this.appId,
      redirect_uri: this.redirectUri,
      scope: INSTAGRAM_SCOPES.join(','),
      response_type: 'code',
      auth_type: 'rerequest',
      prompt: 'consent',
      state
    });

    const url = `https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth?${params.toString()}`;
    console.log('🔍 IG Auth URL:', url);
    return url;
  }

  // ✅ Read permissions + debug scopes for token
  async debugToken(accessToken) {
    const permsRes = await axios.get(
      `https://graph.facebook.com/${GRAPH_VERSION}/me/permissions`,
      { params: { access_token: accessToken } }
    );

    const debugRes = await axios.get(
      `https://graph.facebook.com/${GRAPH_VERSION}/debug_token`,
      {
        params: {
          input_token: accessToken,
          access_token: `${this.appId}|${this.appSecret}`
        }
      }
    );

    const granted = (permsRes.data?.data || [])
      .filter((p) => p.status === 'granted')
      .map((p) => p.permission);

    const scopes = debugRes.data?.data?.scopes || [];

    return {
      granted,
      scopes,
      rawPermissions: permsRes.data,
      rawDebug: debugRes.data
    };
  }

  extractPageIdsFromDebug(debugData) {
    const granular = debugData?.data?.granular_scopes || [];
    const pageScope = granular.find((g) => g.scope === 'pages_show_list');
    return pageScope?.target_ids || [];
  }

  /**
   * Exchange auth code -> tokens + IG business account
   */
  async exchangeCodeForToken(code) {
    try {
      console.log('\n🔵 IG: Starting token exchange...');

      // 1) code -> short-lived user token
      const shortRes = await axios.get(
        `https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token`,
        {
          params: {
            client_id: this.appId,
            client_secret: this.appSecret,
            redirect_uri: this.redirectUri,
            code
          }
        }
      );

      const shortUserToken = shortRes.data.access_token;
      console.log('✅ IG: short-lived token obtained');

      // 2) short -> long-lived user token
      const longRes = await axios.get(
        `https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token`,
        {
          params: {
            grant_type: 'fb_exchange_token',
            client_id: this.appId,
            client_secret: this.appSecret,
            fb_exchange_token: shortUserToken
          }
        }
      );

      const longUserToken = longRes.data.access_token;
      console.log('✅ IG: long-lived token obtained');

      // 3) user info
      const meRes = await axios.get(
        `https://graph.facebook.com/${GRAPH_VERSION}/me`,
        { params: { access_token: longUserToken, fields: 'id,name' } }
      );

      console.log('\n👤 Facebook User Info:');
      console.log('  User ID:', meRes.data.id);
      console.log('  Name:', meRes.data.name);

      // 4) debug permissions + scopes
      const dbg = await this.debugToken(longUserToken);

      console.log('\n🔐 IG Permissions (granted):', dbg.granted);
      console.log('🧪 IG Token scopes:', dbg.scopes);

      const mustHave = [
        'pages_show_list',
        'pages_read_engagement',
        'instagram_basic',
        'instagram_content_publish'
      ];

      const missing = mustHave.filter(
        (p) => !dbg.granted.includes(p) && !dbg.scopes.includes(p)
      );

      if (missing.length) {
        throw new Error(
          `Missing required permissions: ${missing.join(', ')}. ` +
            `Fix: Remove app from Facebook -> Settings -> Apps and Websites AND Business Integrations, then login again. ` +
            `During consent, select your Page + IG account and continue.`
        );
      }

      // 5) Get pages - try /me/accounts first
      let pages = [];
      try {
        const pagesRes = await axios.get(
          `https://graph.facebook.com/${GRAPH_VERSION}/me/accounts`,
          {
            params: {
              access_token: longUserToken,
              fields: 'id,name,access_token,instagram_business_account'
            }
          }
        );
        pages = pagesRes.data?.data || [];
      } catch (e) {
        // ignore
      }

      // 6) Fallback: use debug_token granular scopes target_ids
      if (!pages.length) {
        console.log('⚠️ IG: /me/accounts empty, using debug_token fallback...');

        const pageIds = this.extractPageIdsFromDebug(dbg.rawDebug);
        console.log('📌 IG: Page IDs from granular scopes:', pageIds);

        for (const pid of pageIds) {
          // Fetch page info + token
          const pageDetails = await axios.get(
            `https://graph.facebook.com/${GRAPH_VERSION}/${pid}`,
            {
              params: {
                access_token: longUserToken,
                fields: 'id,name,access_token'
              }
            }
          );

          // Check IG business link
          let igLink = null;
          try {
            const linkRes = await axios.get(
              `https://graph.facebook.com/${GRAPH_VERSION}/${pid}`,
              {
                params: {
                  access_token: longUserToken,
                  fields: 'instagram_business_account'
                }
              }
            );
            igLink = linkRes.data?.instagram_business_account || null;
          } catch (e) {}

          pages.push({
            id: pageDetails.data.id,
            name: pageDetails.data.name,
            access_token: pageDetails.data.access_token,
            instagram_business_account: igLink
          });
        }
      }

      console.log('\n📄 Pages Count:', pages.length);
      if (!pages.length) {
        throw new Error(
          'No Facebook Pages found for this token. Make sure you selected your Page during consent and try again.'
        );
      }

      // 7) pick page with IG business account
      const pageWithIG =
        pages.find((p) => p.instagram_business_account?.id) ||
        pages.find((p) => p.instagram_business_account) ||
        null;

      if (!pageWithIG) {
        throw new Error(
          'No Instagram Business account connected to your Page. Please connect Instagram to your Facebook Page (Business/Creator account).'
        );
      }

      const pageId = pageWithIG.id;
      const pageToken = pageWithIG.access_token || longUserToken;
      const igBusinessId = pageWithIG.instagram_business_account.id;

      console.log('\n✅ Found IG Business via Page:');
      console.log('  Page:', pageWithIG.name, pageId);
      console.log('  IG Business ID:', igBusinessId);

      // 8) fetch IG profile using page token
      const igRes = await axios.get(
        `https://graph.facebook.com/${GRAPH_VERSION}/${igBusinessId}`,
        {
          params: {
            access_token: pageToken,
            fields: 'id,username,name,profile_picture_url'
          }
        }
      );

      return {
        accessToken: pageToken, // ✅ use page token for IG actions
        userAccessToken: longUserToken,
        pageId,
        instagramBusinessId: igBusinessId,
        userInfo: {
          username: igRes.data.username,
          name: igRes.data.name,
          profilePicture: igRes.data.profile_picture_url
        }
      };
    } catch (error) {
      console.error('❌ IG OAuth error:', error.response?.data || error.message);
      throw new Error(
        error.response?.data?.error?.message ||
          error.message ||
          'Failed to authenticate with Instagram'
      );
    }
  }

  async storeTokens(userId, tokenData) {
    try {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 60);

      const payload = {
        user_id: userId,
        provider: 'instagram',
        access_token: tokenData.accessToken,
        token_expiry: expiryDate.toISOString(),
        instagram_business_id: tokenData.instagramBusinessId,
        page_id: tokenData.pageId,
        account_id: tokenData.instagramBusinessId,
        username: tokenData.userInfo?.username,
        profile_data: tokenData.userInfo,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('social_tokens')
        .upsert(payload, { onConflict: 'user_id,provider' })
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Error storing IG tokens:', error);
      throw new Error('Failed to store Instagram authentication');
    }
  }

  async refreshAccessToken(currentToken) {
    try {
      const response = await axios.get(
        `https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token`,
        {
          params: {
            grant_type: 'fb_exchange_token',
            client_id: this.appId,
            client_secret: this.appSecret,
            fb_exchange_token: currentToken
          }
        }
      );

      return {
        accessToken: response.data.access_token,
        expiresIn: response.data.expires_in
      };
    } catch (error) {
      console.error('❌ IG refresh token error:', error.response?.data || error.message);
      throw new Error('Failed to refresh Instagram token');
    }
  }

  async getValidAccessToken(userId) {
    const { data, error } = await supabase
      .from('social_tokens')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', 'instagram')
      .single();

    if (error || !data) throw new Error('Instagram account not connected');

    const now = new Date();
    const expiry = new Date(data.token_expiry);

    if (expiry - now < 7 * 24 * 60 * 60 * 1000) {
      const refreshed = await this.refreshAccessToken(data.access_token);

      const newExpiry = new Date();
      newExpiry.setDate(newExpiry.getDate() + 60);

      await supabase
        .from('social_tokens')
        .update({
          access_token: refreshed.accessToken,
          token_expiry: newExpiry.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('provider', 'instagram');

      return {
        accessToken: refreshed.accessToken,
        instagramBusinessId: data.instagram_business_id,
        pageId: data.page_id
      };
    }

    return {
      accessToken: data.access_token,
      instagramBusinessId: data.instagram_business_id,
      pageId: data.page_id
    };
  }
}

export default new InstagramOAuthService();
