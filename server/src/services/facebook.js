import axios from 'axios';

const GRAPH_API_URL = 'https://graph.facebook.com/v18.0';

/**
 * Post to Facebook Page (Supports single image or multiple images)
 * @param {string} accessToken - Page access token
 * @param {string} pageId - Facebook Page ID
 * @param {string} caption - Post text
 * @param {string|string[]} imageUrls - Single URL string or array of URL strings
 * @returns {Object} Result
 */
async function postToFacebook(accessToken, pageId, caption, imageUrls) {
  try {
    console.log(`\n📘 Posting to Facebook Page: ${pageId}`);
    
    // Normalize to array
    const urls = Array.isArray(imageUrls) ? imageUrls : [imageUrls].filter(Boolean);

    if (urls.length === 0) {
      // Text-only post
      const response = await axios.post(
        `${GRAPH_API_URL}/${pageId}/feed`,
        {
          message: caption,
          access_token: accessToken,
        }
      );
      return { success: true, postId: response.data.id };
    }

    if (urls.length === 1) {
      // Single image post (more robust than feed with attached_media for single items)
      const response = await axios.post(
        `${GRAPH_API_URL}/${pageId}/photos`,
        {
          url: urls[0],
          caption: caption,
          access_token: accessToken,
        }
      );
      return { success: true, postId: response.data.id };
    }

    // Multiple images post
    console.log(`🖼️ Uploading ${urls.length} images to Facebook...`);
    const mediaIds = [];
    for (const url of urls) {
      const uploadRes = await axios.post(
        `${GRAPH_API_URL}/${pageId}/photos`,
        {
          url: url,
          published: false,
          access_token: accessToken,
        }
      );
      mediaIds.push({ media_fbid: uploadRes.data.id });
    }

    console.log('📝 Creating multi-photo feed post...');
    const response = await axios.post(
      `${GRAPH_API_URL}/${pageId}/feed`,
      {
        message: caption,
        attached_media: JSON.stringify(mediaIds),
        access_token: accessToken,
      }
    );

    console.log('✅ Facebook multi-photo post successful');
    return {
      success: true,
      postId: response.data.id,
      platform: 'Facebook'
    };

  } catch (error) {
    console.error('❌ Facebook posting error:', error.response?.data || error.message);
    throw new Error(
      error.response?.data?.error?.message || 'Failed to post to Facebook'
    );
  }
}

/**
 * Post video to Facebook Page
 * @param {string} accessToken - Page access token
 * @param {string} pageId - Facebook Page ID
 * @param {string} caption - Post text
 * @param {string} videoUrl - Video URL
 * @param {string} thumbUrl - Optional thumbnail image URL
 * @returns {Object} Result
 */
async function postVideoToFacebook(accessToken, pageId, caption, videoUrl, thumbUrl) {
  try {
    console.log(`\n📘 Posting Video to Facebook Page: ${pageId}`);
    
    const payload = {
      description: caption,
      file_url: videoUrl,
      access_token: accessToken,
    };

    if (thumbUrl) {
      payload.thumb = thumbUrl;
    }

    const response = await axios.post(
      `${GRAPH_API_URL}/${pageId}/videos`,
      payload
    );

    return { success: true, postId: response.data.id, platform: 'Facebook' };
  } catch (error) {
    console.error('❌ Facebook video error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.error?.message || 'Failed to post video to Facebook');
  }
}

export { postToFacebook, postVideoToFacebook };
