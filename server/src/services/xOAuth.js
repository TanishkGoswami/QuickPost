import axios from 'axios';
import crypto from 'crypto';
import supabase from './supabase.js';

const X_AUTH_URL = 'https://twitter.com/i/oauth2/authorize';
const X_TOKEN_URL = 'https://api.twitter.com/2/oauth2/token';
const X_USER_URL = 'https://api.twitter.com/2/users/me';

const X_SCOPES = [
  'tweet.read',
  'tweet.write',
  'users.read',
  'media.write',
  'offline.access'
];

function base64urlEncode(buffer) {
  return buffer.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

class XOAuth {
  constructor() {
    this.clientId = process.env.X_CLIENT_ID;
    this.clientSecret = process.env.X_CLIENT_SECRET;
    this.redirectUri = (process.env.X_REDIRECT_URI || 'http://localhost:5000/api/auth/x/callback').trim();
  }

  /**
   * Generates PKCE verifier and challenge
   */
  generatePKCE() {
    const verifier = base64urlEncode(crypto.randomBytes(32));
    const challenge = base64urlEncode(
      crypto.createHash('sha256').update(verifier).digest()
    );
    return { verifier, challenge };
  }

  makeState(userId) {
    return Buffer.from(JSON.stringify({
      userId,
      provider: 'x',
      nonce: crypto.randomUUID(),
      ts: Date.now()
    })).toString('base64url');
  }

  getAuthorizationUrl(state, codeChallenge) {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: X_SCOPES.join(' '),
      state: state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    });

    console.log(`\n𝕏 Generated X Auth URL:`);
    console.log(`   Client ID: ${this.clientId}`);
    console.log(`   Redirect URI: ${this.redirectUri}`);

    return `${X_AUTH_URL}?${params.toString()}`;
  }

  async exchangeCodeForTokens(code, codeVerifier) {
    try {
      console.log('\n𝕏 X: Starting token exchange...');
      
      const authHeader = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

      console.log(' - Using Redirect URI:', this.redirectUri);

      const response = await axios.post(X_TOKEN_URL, new URLSearchParams({
        code: code.trim(),
        grant_type: 'authorization_code',
        redirect_uri: this.redirectUri,
        code_verifier: codeVerifier.trim()
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${authHeader}`,
          'User-Agent': 'QuickPost-App/2.0.0'
        }
      });

      console.log('✅ X: Tokens obtained successfully');
      
      const tokenData = response.data;

      // Get user profile info
      const meRes = await axios.get(X_USER_URL, {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`
        },
        params: {
          'user.fields': 'profile_image_url,username'
        }
      });

      console.log('\n👤 X User Info:');
      console.log('  Username:', meRes.data.data.username);
      console.log('  ID:', meRes.data.data.id);

      return {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresIn: tokenData.expires_in,
        xUserId: meRes.data.data.id,
        userInfo: {
          username: meRes.data.data.username,
          profilePicture: meRes.data.data.profile_image_url
        }
      };
    } catch (error) {
      console.error('❌ X token exchange error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error_description || error.message || 'Failed to exchange X authorization code');
    }
  }

  async storeTokens(userId, tokenData) {
    try {
      const expiryDate = new Date();
      expiryDate.setSeconds(expiryDate.getSeconds() + (tokenData.expiresIn || tokenData.expires_in || 7200));

      const payload = {
        user_id: userId,
        provider: 'x',
        access_token: tokenData.accessToken || tokenData.access_token,
        refresh_token: tokenData.refreshToken || tokenData.refresh_token,
        token_expiry: expiryDate.toISOString(),
        account_id: tokenData.xUserId || tokenData.account_id,
        username: tokenData.userInfo?.username,
        profile_data: tokenData.userInfo,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('social_tokens')
        .upsert(payload, { onConflict: 'user_id,provider' })
        .select();

      if (error) {
        console.error('💥 [SUPABASE] X storeTokens error:', error.message);
        throw error;
      }

      console.log('✅ X tokens stored in database');
      return data;
    } catch (error) {
      console.error('❌ Error storing X tokens:', error);
      throw new Error('Failed to store X authentication');
    }
  }

  /**
   * Refresh the X OAuth 2.0 Access Token
   */
  async refreshAccessToken(userId, refreshToken, accountId = null) {
    try {
      console.log('🔄 X: Refreshing OAuth 2.0 token...');
      const cleanId = (this.clientId || '').trim();
      const cleanSecret = (this.clientSecret || '').trim();
      const authHeader = Buffer.from(`${cleanId}:${cleanSecret}`).toString('base64');

      const response = await axios.post(X_TOKEN_URL, new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${authHeader}`,
          'User-Agent': 'QuickPost-App/2.0.0'
        }
      });

      const tokenData = response.data;
      console.log('✅ X: Token refreshed successfully');

      // Update the database
      await this.storeTokens(userId, {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresIn: tokenData.expires_in,
        xUserId: accountId // preserve the existing ID
      });

      return tokenData.access_token;
    } catch (error) {
      console.error('❌ X token refresh error:', error.response?.data || error.message);
      throw new Error('Failed to refresh X token');
    }
  }
}

export default new XOAuth();
