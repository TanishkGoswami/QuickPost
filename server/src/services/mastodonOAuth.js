import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

class MastodonOAuth {
  constructor() {
    this.clientName = 'QuickPost';
    this.redirectUri = process.env.MASTODON_REDIRECT_URI || 'http://localhost:5000/api/auth/mastodon/callback';
    this.scopes = 'read write:statuses write:media';
  }

  /**
   * Register the app on a specific instance
   * Mastodon requires app registration per instance
   */
  async registerApp(instanceUrl) {
    try {
      const baseUrl = instanceUrl.startsWith('http') ? instanceUrl : `https://${instanceUrl}`;
      const response = await axios.post(`${baseUrl}/api/v1/apps`, {
        client_name: this.clientName,
        redirect_uris: this.redirectUri,
        scopes: this.scopes,
        website: 'https://quick-post-livid.vercel.app'
      });

      return {
        clientId: response.data.client_id,
        clientSecret: response.data.client_secret,
        baseUrl
      };
    } catch (error) {
      console.error('Mastodon app registration error:', error.response?.data || error.message);
      throw new Error(`Failed to register app on instance ${instanceUrl}: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * Generate Mastodon authorization URL
   */
  getAuthorizationUrl(instanceUrl, clientId, state = '') {
    const baseUrl = instanceUrl.startsWith('http') ? instanceUrl : `https://${instanceUrl}`;
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: this.scopes,
      state: state
    });

    return `${baseUrl}/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange code for token
   */
  async exchangeCodeForToken(instanceUrl, clientId, clientSecret, code) {
    try {
      const baseUrl = instanceUrl.startsWith('http') ? instanceUrl : `https://${instanceUrl}`;
      const response = await axios.post(`${baseUrl}/oauth/token`, {
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: this.redirectUri,
        grant_type: 'authorization_code',
        code: code,
        scope: this.scopes
      });

      const { access_token } = response.data;
      const userInfo = await this.getUserProfile(baseUrl, access_token);

      return {
        accessToken: access_token,
        userInfo: {
          id: userInfo.id,
          username: userInfo.username,
          displayName: userInfo.display_name,
          avatar: userInfo.avatar,
          url: userInfo.url
        }
      };
    } catch (error) {
      console.error('Mastodon token exchange error:', error.response?.data || error.message);
      throw new Error(`Mastodon authentication failed: ${error.response?.data?.error_description || error.message}`);
    }
  }

  /**
   * Get Mastodon user profile
   */
  async getUserProfile(baseUrl, accessToken) {
    try {
      const response = await axios.get(`${baseUrl}/api/v1/accounts/verify_credentials`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Get Mastodon profile error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Create state for OAuth
   */
  makeState(userId, instanceUrl, clientId, clientSecret) {
    return Buffer.from(JSON.stringify({ 
      userId, 
      provider: 'mastodon',
      instanceUrl,
      clientId,
      clientSecret,
      nonce: Math.random().toString(36),
      ts: Date.now() 
    })).toString('base64url');
  }

  /**
   * Store tokens in DB
   */
  async storeTokens(userId, instanceUrl, tokenData) {
    try {
      const { default: supabase } = await import('./supabase.js');

      const { data, error } = await supabase
        .from('social_tokens')
        .upsert({
          user_id: userId,
          provider: 'mastodon',
          access_token: tokenData.accessToken,
          refresh_token: null,
          mastodon_instance: instanceUrl,
          profile_data: tokenData.userInfo,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,provider'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error storing Mastodon tokens:', error);
      throw error;
    }
  }
}

export default new MastodonOAuth();
