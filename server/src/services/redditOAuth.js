import axios from 'axios';
import crypto from 'crypto';
import supabase from './supabase.js';

const REDDIT_AUTH_URL = 'https://www.reddit.com/api/v1/authorize';
const REDDIT_TOKEN_URL = 'https://www.reddit.com/api/v1/access_token';
const REDDIT_USER_URL = 'https://oauth.reddit.com/api/v1/me';

const REDDIT_SCOPES = [
  'identity',
  'submit',
  'mysubreddits',
  'read',
  'history'
];

class RedditOAuth {
  constructor() {
    this.clientId = process.env.REDDIT_CLIENT_ID;
    this.clientSecret = process.env.REDDIT_CLIENT_SECRET;
    this.redirectUri = (process.env.REDDIT_REDIRECT_URI || 'http://localhost:5000/api/auth/reddit/callback').trim();
  }

  makeState(userId) {
    return Buffer.from(JSON.stringify({
      userId,
      provider: 'reddit',
      nonce: crypto.randomUUID(),
      ts: Date.now()
    })).toString('base64url');
  }

  getAuthorizationUrl(state) {
    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      state: state,
      redirect_uri: this.redirectUri,
      duration: 'permanent',
      scope: REDDIT_SCOPES.join(' '),
    });

    return `${REDDIT_AUTH_URL}?${params.toString()}`;
  }

  async exchangeCodeForToken(code) {
    try {
      console.log('\n🤖 Reddit: Exchanging code for tokens...');
      
      const authHeader = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

      const response = await axios.post(REDDIT_TOKEN_URL, new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: this.redirectUri
      }), {
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'QuickPost-App/1.0.0'
        }
      });

      const tokenData = response.data;
      console.log('✅ Reddit: Tokens obtained successfully');

      // Get user info to get username
      const userRes = await axios.get(REDDIT_USER_URL, {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'User-Agent': 'QuickPost-App/1.0.0'
        }
      });

      return {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresIn: tokenData.expires_in,
        username: userRes.data.name,
        userInfo: {
          name: userRes.data.name,
          profileImage: userRes.data.icon_img
        }
      };
    } catch (error) {
      console.error('❌ Reddit token exchange error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || error.message || 'Failed to exchange Reddit authorization code');
    }
  }

  async storeTokens(userId, tokenData) {
    try {
      const expiryDate = new Date();
      expiryDate.setSeconds(expiryDate.getSeconds() + (tokenData.expiresIn || 3600));

      const payload = {
        user_id: userId,
        provider: 'reddit',
        access_token: tokenData.accessToken,
        refresh_token: tokenData.refreshToken,
        token_expiry: expiryDate.toISOString(),
        username: tokenData.username,
        profile_data: tokenData.userInfo,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('social_tokens')
        .upsert(payload, { onConflict: 'user_id,provider' })
        .select();

      if (error) throw error;
      
      console.log(`✅ Reddit tokens stored for user ${userId}`);
      return data;
    } catch (error) {
      console.error('❌ Reddit storeTokens error:', error);
      throw new Error('Failed to store Reddit authentication');
    }
  }

  async refreshAccessToken(userId, refreshToken) {
    try {
      console.log('🔄 Reddit: Refreshing access token...');
      const authHeader = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

      const response = await axios.post(REDDIT_TOKEN_URL, new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      }), {
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'QuickPost-App/1.0.0'
        }
      });

      const tokenData = response.data;
      
      // Update DB with new tokens
      await this.storeTokens(userId, {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || refreshToken, // Refresh can be same
        expiresIn: tokenData.expires_in,
        username: null // Use existing username if possible, or refetch
      });

      return tokenData.access_token;
    } catch (error) {
      console.error('❌ Reddit refresh error:', error.response?.data || error.message);
      throw new Error('Failed to refresh Reddit access token');
    }
  }
}

export default new RedditOAuth();
