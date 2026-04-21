import axios from 'axios';
import redditOAuth from './redditOAuth.js';

const REDDIT_SUBMIT_URL = 'https://oauth.reddit.com/api/submit';

/**
 * Post to Reddit
 * @param {string} userId - User ID to fetch and refresh tokens
 * @param {string} caption - Post title/content
 * @param {string} mediaUrl - URL of the image/video (Cloudinary)
 * @param {Object} redditTokens - User's reddit tokens
 * @param {Object} platformData - Extra data (subreddit)
 */
export async function postToReddit(userId, caption, mediaUrl, redditTokens, platformData = {}) {
  try {
    console.log(`\n🤖 Reddit: Posting to subreddit...`);
    
    // 1. Get tokens and handle refresh if needed
    let accessToken = redditTokens.accessToken;
    
    // Check if we need to refresh (simple check, or just refresh to be safe)
    // For now, assume it's fresh or implement a check if tokenExpiry is passed
    if (!accessToken) {
      throw new Error('No Reddit access token found');
    }

    const subreddit = platformData.subreddit || `u_${redditTokens.accountId}`;
    console.log(`   Destination: r/${subreddit}`);

    // 2. Submit to Reddit
    // Reddit kind: 'self' (text), 'link' (url), 'image' (requires redd.it host), 'video'
    // Since we have a Cloudinary URL, 'link' is safest. 
    // If it's an image, Reddit might embed it if the URL ends in extension.
    
    const params = new URLSearchParams({
      sr: subreddit,
      kind: 'link',
      title: caption,
      url: mediaUrl,
      resubmit: 'true'
    });

    const response = await axios.post(REDDIT_SUBMIT_URL, params, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'QuickPost-App/1.0.0'
      }
    });

    if (response.data.errors && response.data.errors.length > 0) {
      console.error('❌ Reddit submit error:', response.data.errors);
      return {
        success: false,
        platform: 'Reddit',
        error: response.data.errors[0][1] || 'Failed to submit to Reddit'
      };
    }

    console.log('✅ Reddit: Post submitted successfully');
    
    // Extract post URL if possible
    const postUrl = response.data.json?.data?.url || '';

    return {
      success: true,
      platform: 'Reddit',
      url: postUrl,
      postId: response.data.json?.data?.id
    };

  } catch (error) {
    // If 401, try to refresh and retry once
    if (error.response?.status === 401 && redditTokens.refreshToken) {
      try {
        console.log('🔄 Reddit: Token expired, refreshing...');
        const newAccessToken = await redditOAuth.refreshAccessToken(userId, redditTokens.refreshToken);
        // Retry with new token
        redditTokens.accessToken = newAccessToken;
        return postToReddit(userId, caption, mediaUrl, redditTokens, platformData);
      } catch (refreshError) {
        console.error('❌ Reddit: Token refresh failed during post');
      }
    }

    console.error('❌ Reddit post error:', error.response?.data || error.message);
    return {
      success: false,
      platform: 'Reddit',
      error: error.response?.data?.message || error.message
    };
  }
}

export default {
  postToReddit
};
