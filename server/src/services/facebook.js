import axios from 'axios';

const GRAPH_API_URL = 'https://graph.facebook.com/v18.0';

/**
 * Post a photo to Facebook Page
 */
async function postToFacebook(accessToken, pageId, caption, imageUrl) {
  try {
    console.log('\n📘 Posting to Facebook...');
    console.log('Page ID:', pageId);
    console.log('Caption length:', caption?.length || 0);
    console.log('Image URL:', imageUrl ? 'provided' : 'none');

    // Post to Facebook Page
    const response = await axios.post(
      `${GRAPH_API_URL}/${pageId}/photos`,
      {
        url: imageUrl,
        caption: caption,
        access_token: accessToken,
      }
    );

    console.log('✅ Facebook post successful');
    console.log('Post ID:', response.data.id);

    return {
      success: true,
      postId: response.data.id,
      postUrl: `https://facebook.com/${response.data.id}`,
    };
  } catch (error) {
    console.error('❌ Facebook posting error:', error.response?.data || error.message);
    throw new Error(
      error.response?.data?.error?.message || 'Failed to post to Facebook'
    );
  }
}

export { postToFacebook };
