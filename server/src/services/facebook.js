import axios from 'axios';

const GRAPH_API_URL = 'https://graph.facebook.com/v18.0';

function getFacebookErrorMessage(error, fallback) {
  return error.response?.data?.error?.message || fallback;
}

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

async function transferFacebookVideoUpload(uploadUrl, accessToken, fileUrl, http = axios) {
  await http.post(
    uploadUrl,
    { file_url: fileUrl },
    { headers: { Authorization: `OAuth ${accessToken}` } }
  );
}

async function postFacebookReel(accessToken, pageId, caption, videoUrl, http = axios) {
  try {
    const startRes = await http.post(`${GRAPH_API_URL}/${pageId}/video_reels`, {
      upload_phase: 'start',
      access_token: accessToken,
    });
    const { video_id: videoId, upload_url: uploadUrl } = startRes.data;
    await transferFacebookVideoUpload(uploadUrl, accessToken, videoUrl, http);
    const finishRes = await http.post(`${GRAPH_API_URL}/${pageId}/video_reels`, {
      upload_phase: 'finish',
      video_id: videoId,
      description: caption,
      access_token: accessToken,
    });
    return { success: true, postId: finishRes.data.id || videoId, platform: 'Facebook' };
  } catch (error) {
    console.error('Facebook reel error:', error.response?.data || error.message);
    throw new Error(getFacebookErrorMessage(error, 'Failed to post Facebook Reel'));
  }
}

async function postFacebookStory(accessToken, pageId, caption, mediaUrl, mediaType = 'image', http = axios) {
  try {
    if (mediaType === 'video') {
      const startRes = await http.post(`${GRAPH_API_URL}/${pageId}/video_stories`, {
        upload_phase: 'start',
        access_token: accessToken,
      });
      const { video_id: videoId, upload_url: uploadUrl } = startRes.data;
      await transferFacebookVideoUpload(uploadUrl, accessToken, mediaUrl, http);
      const finishRes = await http.post(`${GRAPH_API_URL}/${pageId}/video_stories`, {
        upload_phase: 'finish',
        video_id: videoId,
        description: caption,
        access_token: accessToken,
      });
      return { success: true, postId: finishRes.data.id || videoId, platform: 'Facebook' };
    }

    const photoRes = await http.post(`${GRAPH_API_URL}/${pageId}/photos`, {
      url: mediaUrl,
      caption,
      published: false,
      access_token: accessToken,
    });
    const storyRes = await http.post(`${GRAPH_API_URL}/${pageId}/photo_stories`, {
      photo_id: photoRes.data.id,
      access_token: accessToken,
    });
    return { success: true, postId: storyRes.data.id || photoRes.data.id, platform: 'Facebook' };
  } catch (error) {
    console.error('Facebook story error:', error.response?.data || error.message);
    throw new Error(getFacebookErrorMessage(error, 'Failed to post Facebook Story'));
  }
}

export { postToFacebook, postVideoToFacebook, postFacebookReel, postFacebookStory };
