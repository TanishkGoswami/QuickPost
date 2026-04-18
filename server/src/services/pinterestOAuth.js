import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

class PinterestOAuth {
  constructor() {
    this.clientId = process.env.PINTEREST_APP_ID;
    this.clientSecret = process.env.PINTEREST_APP_SECRET;
    this.redirectUri = process.env.PINTEREST_REDIRECT_URI || 'http://localhost:5000/auth/pinterest/callback';
    this.scopes = 'boards:read,pins:read,pins:write';
  }

  /**
   * Generate Pinterest OAuth authorization URL
   */
  getAuthorizationUrl(state = '') {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: this.scopes,
      state: state
    });

    return `https://www.pinterest.com/oauth/?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code) {
    try {
      const response = await axios.post('https://api.pinterest.com/v5/oauth/token', {
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: this.redirectUri
      }, {
        auth: {
          username: this.clientId,
          password: this.clientSecret
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      const { access_token, refresh_token, token_type } = response.data;

      // Get user info
      const userInfo = await this.getUserInfo(access_token);
      
      // Get boards
      const boards = await this.getBoards(access_token);
      const defaultBoard = boards[0]; // Use first board

      return {
        accessToken: access_token,
        refreshToken: refresh_token,
        tokenType: token_type,
        userInfo: {
          username: userInfo.username,
          profileImage: userInfo.profile_image
        },
        boardId: defaultBoard?.id || null,
        boardName: defaultBoard?.name || null
      };
    } catch (error) {
      console.error('Pinterest token exchange error:', error.response?.data || error.message);
      throw new Error(`Pinterest authentication failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get Pinterest user info
   */
  async getUserInfo(accessToken) {
    try {
      console.log('🔍 Testing Pinterest API with token...');
      const response = await axios.get('https://api.pinterest.com/v5/user_account', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      console.log('✅ Pinterest API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Pinterest API Error:');
      console.error('Status:', error.response?.status);
      console.error('Error Code:', error.response?.data?.code);
      console.error('Error Message:', error.response?.data?.message);
      console.error('Full Response:', JSON.stringify(error.response?.data, null, 2));
      throw error;
    }
  }

  /**
   * Get user's Pinterest boards
   */
  async getBoards(accessToken) {
    try {
      const response = await axios.get('https://api.pinterest.com/v5/boards', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      return response.data.items || [];
    } catch (error) {
      console.error('Get Pinterest boards error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Store Pinterest tokens in database
   */
  async storeTokens(userId, tokenData) {
    try {
      const { default: supabase } = await import('./supabase.js');
      
      const { data, error } = await supabase
        .from('social_tokens')
        .upsert({
          user_id: userId,
          provider: 'pinterest',
          access_token: tokenData.accessToken,
          refresh_token: tokenData.refreshToken,
          pinterest_board_id: tokenData.boardId,
          expires_at: null, // Pinterest tokens don't expire
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,provider'
        })
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Pinterest tokens stored for user:', userId);
      return data;
    } catch (error) {
      console.error('Error storing Pinterest tokens:', error);
      throw error;
    }
  }
}

export default new PinterestOAuth();
