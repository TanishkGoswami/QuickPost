import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Post to LinkedIn
 * @param {string} imageUrl - Public URL to image (from Cloudinary) or null for text-only
 * @param {string} text - Post text/caption
 * @param {Object} tokens - LinkedIn tokens object with accessToken
 * @returns {Object} Result with post ID and URL
 */
export async function postToLinkedIn(imageUrl, text, tokens) {
  try {
    if (!tokens || !tokens.accessToken) {
      throw new Error('Missing LinkedIn credentials');
    }

    console.log('🔵 Starting LinkedIn post...');

    // Get user URN
    const userInfoResponse = await axios.get('https://api.linkedin.com/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokens.accessToken}`
      }
    });

    const userUrn = `urn:li:person:${userInfoResponse.data.sub}`;
    console.log('User URN:', userUrn);

    let postData;

    if (imageUrl) {
      // Post with image
      console.log('Posting with image:', imageUrl);

      // Register the image
      const registerResponse = await axios.post(
        'https://api.linkedin.com/v2/assets?action=registerUpload',
        {
          registerUploadRequest: {
            recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
            owner: userUrn,
            serviceRelationships: [{
              relationshipType: 'OWNER',
              identifier: 'urn:li:userGeneratedContent'
            }]
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${tokens.accessToken}`,
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0'
          }
        }
      );

      const uploadUrl = registerResponse.data.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
      const asset = registerResponse.data.value.asset;

      // Upload the image
      const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      await axios.put(uploadUrl, imageResponse.data, {
        headers: {
          'Authorization': `Bearer ${tokens.accessToken}`,
          'Content-Type': 'image/jpeg'
        }
      });

      console.log('✓ Image uploaded:', asset);

      // Create post with image
      postData = {
        author: userUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: text || ''
            },
            shareMediaCategory: 'IMAGE',
            media: [{
              status: 'READY',
              media: asset,
              title: {
                text: 'QuickPost Image'
              }
            }]
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      };
    } else {
      // Text-only post
      console.log('Posting text only');
      postData = {
        author: userUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: text || ''
            },
            shareMediaCategory: 'NONE'
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      };
    }

    // Create the post
    const response = await axios.post(
      'https://api.linkedin.com/v2/ugcPosts',
      postData,
      {
        headers: {
          'Authorization': `Bearer ${tokens.accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        }
      }
    );

    const postId = response.data.id;
    const postUrl = `https://www.linkedin.com/feed/update/${postId}/`;

    console.log(`✓ LinkedIn post created: ${postId}`);
    console.log(`URL: ${postUrl}`);

    return {
      success: true,
      postId: postId,
      url: postUrl,
      platform: 'LinkedIn',
      message: 'Successfully posted to LinkedIn'
    };

  } catch (error) {
    console.error('❌ LinkedIn post failed:', error.message);

    const errorMessage = error.response?.data?.message || error.message;
    console.error('Full error details:', error.response?.data);

    return {
      success: false,
      platform: 'LinkedIn',
      error: errorMessage,
      details: error.response?.data
    };
  }
}

/**
 * Post text-only to LinkedIn
 */
export async function postTextToLinkedIn(text, tokens) {
  return postToLinkedIn(null, text, tokens);
}
