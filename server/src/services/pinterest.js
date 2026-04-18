import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Post image to Pinterest as a Pin
 * @param {string} imageUrl - Public URL to image (from Cloudinary)
 * @param {string} title - Pin title
 * @param {Object} tokens - Pinterest tokens object with accessToken and boardId
 * @param {string} link - Optional link URL
 * @param {string} boardId - Optional board ID (overrides tokens.boardId)
 * @returns {Object} Result with pin ID and URL
 */
export async function postToPinterest(imageUrl, title, tokens, link = '', boardId = null) {
  try {
    if (!tokens || !tokens.accessToken) {
      throw new Error('Missing Pinterest credentials');
    }

    const targetBoardId = boardId || tokens.boardId;
    if (!targetBoardId) {
      throw new Error('No Pinterest board selected');
    }

    // Check if URL is publicly accessible
    if (imageUrl.includes('localhost') || imageUrl.includes('127.0.0.1')) {
      throw new Error('Pinterest requires a publicly accessible HTTPS URL. Localhost URLs are not supported.');
    }

    console.log('📌 Starting Pinterest upload...');
    console.log('Image URL:', imageUrl);
    console.log('Board ID:', targetBoardId);

    // Create pin
    const response = await axios.post('https://api.pinterest.com/v5/pins', {
      board_id: targetBoardId,
      title: title.substring(0, 100) || 'QuickPost Pin',
      description: title,
      link: link || imageUrl,
      media_source: {
        source_type: 'image_url',
        url: imageUrl
      }
    }, {
      headers: {
        'Authorization': `Bearer ${tokens.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const pinId = response.data.id;
    const pinUrl = `https://www.pinterest.com/pin/${pinId}/`;

    console.log(`✓ Pin created: ${pinId}`);
    console.log(`URL: ${pinUrl}`);

    return {
      success: true,
      pinId: pinId,
      url: pinUrl,
      platform: 'Pinterest',
      message: 'Successfully uploaded to Pinterest'
    };

  } catch (error) {
    console.error('❌ Pinterest upload failed:', error.message);

    const errorMessage = error.response?.data?.message || error.message;
    const errorCode = error.response?.data?.code;

    console.error('Full error details:', error.response?.data);

    return {
      success: false,
      platform: 'Pinterest',
      error: errorMessage,
      errorCode: errorCode,
      details: error.response?.data
    };
  }
}

/**
 * Upload image directly to Pinterest (alternative method using media upload)
 */
export async function uploadImageToPinterest(imagePath, caption, tokens) {
  try {
    // Create form data
    const form = new FormData();
    form.append('image', fs.createReadStream(imagePath));

    // Upload media
    const uploadResponse = await axios.post('https://api.pinterest.com/v5/media', form, {
      headers: {
        'Authorization': `Bearer ${tokens.accessToken}`,
        ...form.getHeaders()
      }
    });

    const mediaId = uploadResponse.data.media_id;

    // Create pin with uploaded media
    const pinResponse = await axios.post('https://api.pinterest.com/v5/pins', {
      board_id: tokens.boardId,
      title: caption.substring(0, 100) || 'QuickPost Pin',
      description: caption,
      media_source: {
        source_type: 'image_upload',
        media_id: mediaId
      }
    }, {
      headers: {
        'Authorization': `Bearer ${tokens.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const pinId = pinResponse.data.id;
    const pinUrl = `https://www.pinterest.com/pin/${pinId}/`;

    return {
      success: true,
      pinId: pinId,
      pinUrl: pinUrl,
      platform: 'Pinterest',
      message: 'Successfully uploaded to Pinterest'
    };

  } catch (error) {
    console.error('Pinterest upload error:', error);
    return {
      success: false,
      platform: 'Pinterest',
      error: error.response?.data?.message || error.message
    };
  }
}
