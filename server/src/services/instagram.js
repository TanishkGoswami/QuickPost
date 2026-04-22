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
    const containerPayload = {
      media_type: 'REELS',
      video_url: videoUrl,
      caption: caption,
      access_token: accessToken
    };

    if (tokens.coverUrl) {
      containerPayload.cover_url = tokens.coverUrl;
    }

    const containerResponse = await axios.post(
      `${GRAPH_API_URL}/${businessId}/media`,
      containerPayload
    );

    const containerId = containerResponse.data.id;
    console.log(`✓ Container created: ${containerId}`);

    // Step 2: Poll for processing status
    console.log('Step 2: Polling for video processing status...');
    let isReady = false;
    let attempts = 0;
    const maxAttempts = 12; // Wait up to 60 seconds
    
    while (!isReady && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      attempts++;
      
      try {
        const statusRes = await axios.get(
          `${GRAPH_API_URL}/${containerId}?fields=status_code&access_token=${accessToken}`
        );
        const statusCode = statusRes.data.status_code;
        console.log(`Polling attempt ${attempts}: Status is ${statusCode}`);
        
        if (statusCode === 'FINISHED') {
          isReady = true;
        } else if (statusCode === 'ERROR') {
          throw new Error('Instagram failed to process the video container. Check video format requirements.');
        }
        // IF IN_PROGRESS, it loops
      } catch (err) {
        if (err.message.includes('Instagram failed')) throw err;
        console.warn(`Polling error at attempt ${attempts}:`, err.message);
      }
    }

    if (!isReady) {
      throw new Error('Video processing timed out on Instagram side. Please try again later.');
    }

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
 * Post a Carousel (multiple images/videos) to Instagram
 * @param {string[]} mediaUrls - Array of public URLs
 * @param {string} caption - Post caption
 * @param {Object} tokens - Instagram tokens
 * @returns {Object} Result
 */
export async function postCarouselToInstagram(mediaUrls, caption, tokens) {
  try {
    if (!tokens || !tokens.accessToken || !tokens.businessId) {
      throw new Error('Missing Instagram credentials');
    }

    const { accessToken, businessId } = tokens;
    console.log(`📸 Starting Instagram Carousel workflow with ${mediaUrls.length} items...`);

    // Step 1: Create individual media containers for each item
    const childIds = [];
    for (const [index, url] of mediaUrls.entries()) {
      console.log(`Step 1.${index + 1}: Creating container for item ${index + 1}...`);
      const isVideo = url.toLowerCase().match(/\.(mp4|mov|avi)$/) || url.includes('/video/');
      
      const containerRes = await axios.post(
        `${GRAPH_API_URL}/${businessId}/media`,
        {
          media_type: isVideo ? 'VIDEO' : 'IMAGE',
          [isVideo ? 'video_url' : 'image_url']: url,
          is_carousel_item: true,
          access_token: accessToken
        }
      );
      childIds.push(containerRes.data.id);
      console.log(`✓ Child container created: ${containerRes.data.id}`);
    }

    // Step 2: Wait for all processing
    console.log('Step 2: Waiting 10 seconds for items to process...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Step 3: Create the Carousel Container
    console.log('Step 3: Creating carousel container...');
    const carouselRes = await axios.post(
      `${GRAPH_API_URL}/${businessId}/media`,
      {
        media_type: 'CAROUSEL',
        children: childIds,
        caption: caption,
        access_token: accessToken
      }
    );
    const creationId = carouselRes.data.id;
    console.log(`✓ Carousel container created: ${creationId}`);

    // Step 4: Publish
    console.log('Step 4: Publishing carousel...');
    const publishRes = await axios.post(
      `${GRAPH_API_URL}/${businessId}/media_publish`,
      {
        creation_id: creationId,
        access_token: accessToken
      }
    );

    const mediaId = publishRes.data.id;
    console.log(`✓ Carousel published: ${mediaId}`);

    return {
      success: true,
      mediaId: mediaId,
      platform: 'Instagram',
      message: 'Successfully posted Carousel to Instagram'
    };

  } catch (error) {
    console.error('❌ Instagram Carousel failed:', error.response?.data || error.message);
    const errorMessage = error.response?.data?.error?.message || error.message;
    return {
      success: false,
      platform: 'Instagram',
      error: errorMessage,
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
