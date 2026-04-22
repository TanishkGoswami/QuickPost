import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

class TikTokOAuth {
  constructor() {
    this.clientKey = process.env.TIKTOK_CLIENT_KEY;
    this.clientSecret = process.env.TIKTOK_CLIENT_SECRET;
    this.redirectUri = process.env.TIKTOK_REDIRECT_URI || 'http://localhost:5000/api/auth/tiktok/callback';
    // Scopes for video upload and publishing
    this.scopes = ['user.info.basic', 'video.upload', 'video.publish'];
  }

  /**
   * Generate TikTok OAuth authorization URL
   */
  getAuthorizationUrl(state = '') {
    const params = new URLSearchParams({
      client_key: this.clientKey,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: this.scopes.join(','),
      state: state
    });

    return `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code) {
    try {
      const response = await axios.post(
        'https://open.tiktokapis.com/v2/oauth/token/',
        new URLSearchParams({
          client_key: this.clientKey,
          client_secret: this.clientSecret,
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: this.redirectUri
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      const { access_token, refresh_token, expires_in, refresh_expires_in, open_id } = response.data;

      // Get user info
      const userInfo = await this.getUserProfile(access_token);

      return {
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresIn: expires_in,
        openId: open_id,
        userInfo: {
          display_name: userInfo.display_name,
          avatar_url: userInfo.avatar_url,
          username: userInfo.display_name // TikTok v2 doesn't return @handle easily in some scopes
        }
      };
    } catch (error) {
      console.error('TikTok token exchange error:', error.response?.data || error.message);
      throw new Error(`TikTok authentication failed: ${error.response?.data?.error_description || error.message}`);
    }
  }

  /**
   * Get TikTok user profile
   */
  async getUserProfile(accessToken) {
    try {
      const response = await axios.get('https://open.tiktokapis.com/v2/user/info/', {
        params: {
          fields: 'display_name,avatar_url'
        },
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      return response.data.data.user;
    } catch (error) {
      console.error('Get TikTok profile error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Create state for OAuth
   */
  makeState(userId) {
    return Buffer.from(JSON.stringify({ 
      userId, 
      provider: 'tiktok',
      nonce: Math.random().toString(36),
      ts: Date.now() 
    })).toString('base64url');
  }

  /**
   * Store TikTok tokens in database
   */
  async storeTokens(userId, tokenData) {
    try {
      const { default: supabase } = await import('./supabase.js');

      const expiresAt = new Date(Date.now() + (tokenData.expiresIn * 1000));
      
      const { data, error } = await supabase
        .from('social_tokens')
        .upsert({
          user_id: userId,
          provider: 'tiktok',
          access_token: tokenData.accessToken,
          refresh_token: tokenData.refreshToken,
          expires_at: expiresAt.toISOString(),
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
      console.error('Error storing TikTok tokens:', error);
      throw error;
    }
  }
}

export default new TikTokOAuth();
