import axios from 'axios';

const BLUESKY_API_URL = 'https://bsky.social/xrpc';

/**
 * Post to Bluesky
 * @param {string} accessJwt - Access token
 * @param {string} did - Decentralized Identifier
 * @param {string} text - Post text (max 300 characters)
 * @param {string} mediaUrl - Optional: URL to media
 * @param {Object} mediaBlob - Optional: Media blob data if mediaUrl is provided
 * @param {boolean} isVideo - Optional: Is the media a video
 * @returns {Object} Result with post URI
 */
async function postToBluesky(accessJwt, did, text, mediaUrl = null, mediaBlob = null, isVideo = false) {
  try {
    console.log('\n🦋 Posting to Bluesky...');
    console.log('DID:', did);
    console.log('Text length:', text?.length || 0);
    console.log('Media:', mediaUrl ? 'provided' : 'none');

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

    // Handle media upload if provided
    if (mediaUrl && mediaBlob) {
      console.log(`📸 Uploading ${isVideo ? 'video' : 'image'} to Bluesky...`);
      
      if (isVideo) {
        const uploadedMedia = await uploadVideoToBlueskyService(accessJwt, did, mediaBlob);
        record.embed = {
          $type: 'app.bsky.embed.video',
          video: uploadedMedia.blob
        };
      } else {
        const uploadedMedia = await uploadMedia(accessJwt, mediaBlob, 'image/jpeg');
        record.embed = {
          $type: 'app.bsky.embed.images',
          images: [{
            alt: text.substring(0, 100) || 'Media',
            image: uploadedMedia.blob
          }]
        };
      }
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
 * Upload media to Bluesky
 * @param {string} accessJwt - Access token
 * @param {Buffer} mediaBlob - Media data
 * @param {string} contentType - MIME type of the media
 * @returns {Object} Uploaded blob reference
 */
async function uploadMedia(accessJwt, mediaBlob, contentType = 'image/jpeg') {
  try {
    const response = await axios.post(
      `${BLUESKY_API_URL}/com.atproto.repo.uploadBlob`,
      mediaBlob,
      {
        headers: {
          'Authorization': `Bearer ${accessJwt}`,
          'Content-Type': contentType
        }
      }
    );

    console.log(`✅ Media uploaded to Bluesky (${contentType})`);
    return response.data;
  } catch (error) {
    console.error('❌ Bluesky media upload error:', error.response?.data || error.message);
    throw new Error('Failed to upload media to Bluesky');
  }
}

/**
 * Upload video utilizing Bluesky's dedicated video service
 */
async function uploadVideoToBlueskyService(accessJwt, did, videoBlob) {
  try {
    console.log('🎬 Resolving user PDS DID from DID document...');
    let pdsDid = 'did:web:bsky.social'; // Default fallback
    try {
      let didDocUrl = `https://plc.directory/${did}`;
      if (did.startsWith('did:web:')) {
        const host = did.split(':')[2];
        didDocUrl = `https://${host}/.well-known/did.json`;
      }
      
      const didDocRes = await axios.get(didDocUrl);
      const pdsService = didDocRes.data.service?.find(s => s.id === '#atproto_pds');
      if (pdsService && pdsService.serviceEndpoint) {
        const serviceEndpoint = pdsService.serviceEndpoint;
        const describeRes = await axios.get(`${serviceEndpoint}/xrpc/com.atproto.server.describeServer`);
        if (describeRes.data && describeRes.data.did) {
          pdsDid = describeRes.data.did;
          console.log(`🎬 Found PDS DID: ${pdsDid}`);
        } else {
          pdsDid = `did:web:${new URL(serviceEndpoint).hostname}`;
        }
      }
    } catch (err) {
      console.warn('⚠️ Could not resolve PDS DID explicitly, will try fallback.', err.message);
    }

    console.log('🎬 Getting service auth for video upload...');
    const authRes = await axios.get(`${BLUESKY_API_URL}/com.atproto.server.getServiceAuth`, {
      params: {
        aud: pdsDid,
        lxm: 'com.atproto.repo.uploadBlob',
        exp: Math.floor(Date.now() / 1000) + 1800
      },
      headers: {
        'Authorization': `Bearer ${accessJwt}`
      }
    });
    
    const serviceAuthToken = authRes.data.token;
    
    console.log('🎬 Uploading video payload to video.bsky.app...');
    const uploadRes = await axios.post(`https://video.bsky.app/xrpc/app.bsky.video.uploadVideo`, videoBlob, {
      params: {
        did: did,
        name: 'video.mp4'
      },
      headers: {
        'Authorization': `Bearer ${serviceAuthToken}`,
        'Content-Type': 'video/mp4'
      }
    });
    
    const jobId = uploadRes.data.jobId;
    console.log(`🎬 Video uploaded, jobId: ${jobId}, waiting for processing...`);
    
    // Poll for status
    let jobStatus = null;
    let completed = false;
    for (let i = 0; i < 60; i++) { // Poll up to ~2 minutes
      await new Promise(resolve => setTimeout(resolve, 2000));
      const statusRes = await axios.get(`https://video.bsky.app/xrpc/app.bsky.video.getJobStatus`, {
        params: { jobId },
        // Often auth is not required for getJobStatus, but passing service auth is safe
        headers: {
          'Authorization': `Bearer ${serviceAuthToken}`
        }
      });
      
      jobStatus = statusRes.data.jobStatus;
      console.log(`Job status: ${jobStatus.state}`);
      
      if (jobStatus.state === 'JOB_STATE_COMPLETED') {
        completed = true;
        break;
      } else if (jobStatus.state === 'JOB_STATE_FAILED') {
        throw new Error(jobStatus.error || 'Video processing failed on Bluesky');
      }
    }
    
    if (!completed) {
      throw new Error('Video processing timed out');
    }
    
    console.log('✅ Video successfully processed by Bluesky');
    
    return { blob: jobStatus.blob };
  } catch (error) {
    console.error('❌ Bluesky video upload error:', error.response?.data || error.message);
    throw new Error(error.message || 'Failed to upload video to Bluesky');
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

export { postToBluesky, uploadMedia as uploadImage, getBlueskyProfile, deleteBlueskyPost };
