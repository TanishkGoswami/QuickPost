import axios from 'axios';

const BLUESKY_API_URL = 'https://bsky.social/xrpc';

/**
 * Post to Bluesky
 * @param {string} accessJwt - Access token
 * @param {string} did - Decentralized Identifier
 * @param {string} text - Post text (max 300 characters)
 * @param {string} imageUrl - Optional: URL to image
 * @param {Object} imageBlob - Optional: Image blob data if imageUrl is provided
 * @returns {Object} Result with post URI
 */
async function postToBluesky(accessJwt, did, text, imageUrl = null, imageBlob = null) {
  try {
    console.log('\n🦋 Posting to Bluesky...');
    console.log('DID:', did);
    console.log('Text length:', text?.length || 0);
    console.log('Image:', imageUrl ? 'provided' : 'none');

    // Bluesky has a 300 character limit
    if (text && text.length > 300) {
      console.warn('⚠️ Text exceeds 300 characters, truncating...');
      text = text.substring(0, 297) + '...';
    }

    const record = {
      text: text || '',
      createdAt: new Date().toISOString(),
      $type: 'app.bsky.feed.post'
    };

    // Handle image upload if provided
    if (imageUrl && imageBlob) {
      console.log('📸 Uploading image to Bluesky...');
      const uploadedImage = await uploadImage(accessJwt, imageBlob);
      
      record.embed = {
        $type: 'app.bsky.embed.images',
        images: [{
          alt: text.substring(0, 100) || 'Image',
          image: uploadedImage.blob
        }]
      };
    }

    // Detect and format URLs, mentions, and hashtags
    record.facets = extractFacets(text);

    // Create the post
    const response = await axios.post(
      `${BLUESKY_API_URL}/com.atproto.repo.createRecord`,
      {
        repo: did,
        collection: 'app.bsky.feed.post',
        record: record
      },
      {
        headers: {
          'Authorization': `Bearer ${accessJwt}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const uri = response.data.uri;
    const cid = response.data.cid;

    console.log('✅ Bluesky post successful');
    console.log('URI:', uri);

    // Extract handle from DID for URL construction
    const postUrl = constructPostUrl(did, uri);

    return {
      success: true,
      uri: uri,
      cid: cid,
      postUrl: postUrl,
      message: 'Posted to Bluesky successfully'
    };
  } catch (error) {
    console.error('❌ Bluesky posting error:', error.response?.data || error.message);
    throw new Error(
      error.response?.data?.message ||
      error.message ||
      'Failed to post to Bluesky'
    );
  }
}

/**
 * Upload image to Bluesky
 * @param {string} accessJwt - Access token
 * @param {Buffer} imageBlob - Image data
 * @returns {Object} Uploaded blob reference
 */
async function uploadImage(accessJwt, imageBlob) {
  try {
    const response = await axios.post(
      `${BLUESKY_API_URL}/com.atproto.repo.uploadBlob`,
      imageBlob,
      {
        headers: {
          'Authorization': `Bearer ${accessJwt}`,
          'Content-Type': 'image/jpeg'
        }
      }
    );

    console.log('✅ Image uploaded to Bluesky');
    return response.data;
  } catch (error) {
    console.error('❌ Bluesky image upload error:', error.response?.data || error.message);
    throw new Error('Failed to upload image to Bluesky');
  }
}

/**
 * Extract facets (links, mentions, hashtags) from text
 * @param {string} text - Post text
 * @returns {Array} Facets array
 */
function extractFacets(text) {
  const facets = [];
  
  if (!text) return facets;

  // Match URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  let match;
  
  while ((match = urlRegex.exec(text)) !== null) {
    facets.push({
      index: {
        byteStart: Buffer.from(text.substring(0, match.index)).length,
        byteEnd: Buffer.from(text.substring(0, match.index + match[0].length)).length
      },
      features: [{
        $type: 'app.bsky.richtext.facet#link',
        uri: match[0]
      }]
    });
  }

  // Match mentions (@handle)
  const mentionRegex = /@([a-zA-Z0-9.-]+)/g;
  
  while ((match = mentionRegex.exec(text)) !== null) {
    facets.push({
      index: {
        byteStart: Buffer.from(text.substring(0, match.index)).length,
        byteEnd: Buffer.from(text.substring(0, match.index + match[0].length)).length
      },
      features: [{
        $type: 'app.bsky.richtext.facet#mention',
        did: match[1] // In production, you'd resolve this to an actual DID
      }]
    });
  }

  // Match hashtags (#tag)
  const hashtagRegex = /#([a-zA-Z0-9_]+)/g;
  
  while ((match = hashtagRegex.exec(text)) !== null) {
    facets.push({
      index: {
        byteStart: Buffer.from(text.substring(0, match.index)).length,
        byteEnd: Buffer.from(text.substring(0, match.index + match[0].length)).length
      },
      features: [{
        $type: 'app.bsky.richtext.facet#tag',
        tag: match[1]
      }]
    });
  }

  return facets.length > 0 ? facets : undefined;
}

/**
 * Construct Bluesky post URL from URI
 * @param {string} did - User's DID
 * @param {string} uri - Post URI
 * @returns {string} Bluesky post URL
 */
function constructPostUrl(did, uri) {
  try {
    // Extract record key from URI: at://did:plc:xxx/app.bsky.feed.post/xxxxx
    const parts = uri.split('/');
    const recordKey = parts[parts.length - 1];
    
    // For now, return a generic Bluesky URL
    // In production, you'd fetch the handle from the DID
    return `https://bsky.app/profile/${did}/post/${recordKey}`;
  } catch (error) {
    return 'https://bsky.app';
  }
}

/**
 * Get Bluesky profile
 * @param {string} accessJwt - Access token
 * @param {string} actor - DID or handle
 * @returns {Object} Profile data
 */
async function getBlueskyProfile(accessJwt, actor) {
  try {
    const response = await axios.get(
      `${BLUESKY_API_URL}/app.bsky.actor.getProfile`,
      {
        params: { actor },
        headers: {
          'Authorization': `Bearer ${accessJwt}`
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('❌ Error fetching Bluesky profile:', error.response?.data || error.message);
    throw new Error('Failed to fetch Bluesky profile');
  }
}

/**
 * Delete a Bluesky post
 * @param {string} accessJwt - Access token
 * @param {string} did - User's DID
 * @param {string} rkey - Record key from URI
 * @returns {Object} Result
 */
async function deleteBlueskyPost(accessJwt, did, rkey) {
  try {
    await axios.post(
      `${BLUESKY_API_URL}/com.atproto.repo.deleteRecord`,
      {
        repo: did,
        collection: 'app.bsky.feed.post',
        rkey: rkey
      },
      {
        headers: {
          'Authorization': `Bearer ${accessJwt}`
        }
      }
    );

    console.log('✅ Bluesky post deleted');
    return { success: true };
  } catch (error) {
    console.error('❌ Error deleting Bluesky post:', error.response?.data || error.message);
    throw new Error('Failed to delete Bluesky post');
  }
}

export { postToBluesky, uploadImage, getBlueskyProfile, deleteBlueskyPost };
