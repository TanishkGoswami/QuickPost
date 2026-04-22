import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Post to LinkedIn (Supports single image, multiple images, or text-only)
 * @param {string|string[]} imageUrls - Public URL(s) to images
 * @param {string} text - Post text/caption
 * @param {Object} tokens - LinkedIn tokens
 * @returns {Object} Result
 */
export async function postToLinkedIn(imageUrls, text, tokens) {
  try {
    if (!tokens || !tokens.accessToken) {
      throw new Error('Missing LinkedIn credentials');
    }

    console.log('🔵 Starting LinkedIn post process...');
    
    // Normalize to array
    const urls = Array.isArray(imageUrls) ? imageUrls : [imageUrls].filter(Boolean);

    // Get user URN
    const userInfoResponse = await axios.get('https://api.linkedin.com/v2/userinfo', {
      headers: { 'Authorization': `Bearer ${tokens.accessToken}` }
    });
    const userUrn = `urn:li:person:${userInfoResponse.data.sub}`;

    let postData;

    if (urls.length > 0) {
      console.log(`🖼️ Processing ${urls.length} images for LinkedIn...`);
      const mediaAssets = [];

      for (const url of urls) {
        // Step 1: Register the image
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

        // Step 2: Upload the image
        const imageBuffer = await axios.get(url, { responseType: 'arraybuffer' });
        await axios.put(uploadUrl, imageBuffer.data, {
          headers: {
            'Authorization': `Bearer ${tokens.accessToken}`,
            'Content-Type': 'image/jpeg'
          }
        });

        mediaAssets.push({
          status: 'READY',
          media: asset,
          title: { text: 'GAP Social-pilot Image' }
        });
        console.log(`✓ Image registered and uploaded: ${asset}`);
      }

      // Create post with multi-media
      postData = {
        author: userUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: text || '' },
            shareMediaCategory: 'IMAGE',
            media: mediaAssets
          }
        },
        visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' }
      };
    } else {
      // Text-only post
      postData = {
        author: userUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: text || '' },
            shareMediaCategory: 'NONE'
          }
        },
        visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' }
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

    return {
      success: true,
      postId: response.data.id,
      url: `https://www.linkedin.com/feed/update/${response.data.id}/`,
      platform: 'LinkedIn'
    };

  } catch (error) {
    console.error('❌ LinkedIn post failed:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'LinkedIn post failed');
  }
}

/**
 * Post text-only to LinkedIn
 */
export async function postTextToLinkedIn(text, tokens) {
  return postToLinkedIn(null, text, tokens);
}
