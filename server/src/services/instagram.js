import axios from 'axios';

const GRAPH_API_URL = 'https://graph.facebook.com/v18.0';

/**
 * Post image to Instagram Feed using the Container workflow
 * @param {string} imageUrl - Publicly accessible URL of the image
 * @param {string} caption - Post caption
 * @param {Object} tokens - Instagram tokens object
 * @returns {Object} Result with media ID
 */
export async function postImageToInstagram(imageUrl, caption, tokens) {
  try {
    if (!tokens || !tokens.accessToken || !tokens.businessId) {
      throw new Error('Missing Instagram credentials');
    }

    // Check if URL is publicly accessible
    if (imageUrl.includes('localhost') || imageUrl.includes('127.0.0.1')) {
      throw new Error('Instagram requires a publicly accessible HTTPS URL. Localhost URLs are not supported. Please use ngrok, Cloudinary, or another public hosting service.');
    }

    const { accessToken, businessId } = tokens;

    console.log('📸 Starting Instagram Image Container workflow...');
    console.log('Image URL:', imageUrl);
    console.log('Business ID:', businessId);

    // Step 1: Create Media Container for Image
    console.log('Step 1: Creating image container...');
    const containerResponse = await axios.post(
      `${GRAPH_API_URL}/${businessId}/media`,
      {
        image_url: imageUrl,
        caption: caption,
        access_token: accessToken
      }
    );

    const containerId = containerResponse.data.id;
    console.log(`✓ Container created: ${containerId}`);

    // Step 2: Wait for Instagram to process the image
    console.log('Step 2: Waiting 3 seconds for image processing...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Step 3: Publish the container
    console.log('Step 3: Publishing media...');
    const publishResponse = await axios.post(
      `${GRAPH_API_URL}/${businessId}/media_publish`,
      {
        creation_id: containerId,
        access_token: accessToken
      }
    );

    const mediaId = publishResponse.data.id;
    console.log(`✓ Media published: ${mediaId}`);

    // Get the permalink for the published media
    let permalink = null;
    try {
      const mediaDetailsResponse = await axios.get(
        `${GRAPH_API_URL}/${mediaId}`,
        {
          params: {
            fields: 'permalink',
            access_token: accessToken
          }
        }
      );
      permalink = mediaDetailsResponse.data.permalink;
      console.log(`✓ Instagram URL: ${permalink}`);
    } catch (error) {
      console.warn('Could not fetch permalink:', error.message);
    }

    return {
      success: true,
      mediaId: mediaId,
      url: permalink,
      platform: 'Instagram',
      message: 'Successfully posted to Instagram Feed'
    };

  } catch (error) {
    console.error('❌ Instagram image posting failed:', error.message);
    
    // Extract detailed error from Instagram API
    const errorMessage = error.response?.data?.error?.message || error.message;
    const errorCode = error.response?.data?.error?.code;

    console.error('Full error details:', error.response?.data);

    return {
      success: false,
      platform: 'Instagram',
      error: errorMessage,
      errorCode: errorCode,
      details: error.response?.data
    };
  }
}

/**
 * Post video to Instagram Reels using the Container workflow
 * @param {string} videoUrl - Publicly accessible URL of the video
 * @param {string} caption - Post caption
 * @param {Object} tokens - Instagram tokens object
 * @returns {Object} Result with media ID
 */
export async function postToInstagram(videoUrl, caption, tokens) {
  try {
    if (!tokens || !tokens.accessToken || !tokens.businessId) {
      throw new Error('Missing Instagram credentials');
    }

    // Check if URL is publicly accessible
    if (videoUrl.includes('localhost') || videoUrl.includes('127.0.0.1')) {
      throw new Error('Instagram requires a publicly accessible HTTPS URL. Localhost URLs are not supported. Please use ngrok, Cloudinary, or another public hosting service.');
    }

    const { accessToken, businessId } = tokens;

    console.log('📸 Starting Instagram Reels Container workflow...');

    // Step 1: Create Media Container
    console.log('Step 1: Creating media container...');
    const containerResponse = await axios.post(
      `${GRAPH_API_URL}/${businessId}/media`,
      {
        media_type: 'REELS',
        video_url: videoUrl,
        caption: caption,
        access_token: accessToken
      }
    );

    const containerId = containerResponse.data.id;
    console.log(`✓ Container created: ${containerId}`);

    // Step 2: Wait for Instagram to process the video
    console.log('Step 2: Waiting 5 seconds for video processing...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Step 3: Publish the container
    console.log('Step 3: Publishing media...');
    const publishResponse = await axios.post(
      `${GRAPH_API_URL}/${businessId}/media_publish`,
      {
        creation_id: containerId,
        access_token: accessToken
      }
    );

    const mediaId = publishResponse.data.id;
    console.log(`✓ Media published: ${mediaId}`);

    // Get the permalink for the published media
    let permalink = null;
    try {
      const mediaDetailsResponse = await axios.get(
        `${GRAPH_API_URL}/${mediaId}`,
        {
          params: {
            fields: 'permalink',
            access_token: accessToken
          }
        }
      );
      permalink = mediaDetailsResponse.data.permalink;
      console.log(`✓ Instagram URL: ${permalink}`);
    } catch (error) {
      console.warn('Could not fetch permalink:', error.message);
    }

    return {
      success: true,
      mediaId: mediaId,
      url: permalink,
      platform: 'Instagram',
      message: 'Successfully posted to Instagram Reels'
    };

  } catch (error) {
    console.error('❌ Instagram posting failed:', error.message);
    
    // Extract detailed error from Instagram API
    const errorMessage = error.response?.data?.error?.message || error.message;
    const errorCode = error.response?.data?.error?.code;

    return {
      success: false,
      platform: 'Instagram',
      error: errorMessage,
      errorCode: errorCode,
      details: error.response?.data
    };
  }
}

/**
 * Get Instagram media details
 * @param {string} mediaId - Instagram media ID
 * @param {string} accessToken - Access token
 * @returns {Object} Media details
 */
export async function getInstagramMediaDetails(mediaId, accessToken) {
  try {
    const response = await axios.get(
      `${GRAPH_API_URL}/${mediaId}`,
      {
        params: {
          fields: 'id,media_type,media_url,permalink,timestamp',
          access_token: accessToken
        }
      }
    );

    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch media details: ${error.message}`);
  }
}
