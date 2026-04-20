import { default as supabase } from './supabase.js';

/**
 * Save broadcast record to database
 */
export async function saveBroadcast(userId, caption, mediaFilenames, results, mediaType = 'image', platformData = {}) {
  try {
    // Handle both single string and array for filenames
    const filenames = Array.isArray(mediaFilenames) ? mediaFilenames : [mediaFilenames].filter(Boolean);
    const mediaUrls = Array.isArray(results.mediaUrls) ? results.mediaUrls : [results.mediaUrl].filter(Boolean);

    const broadcastData = {
      user_id: userId,
      caption: caption,
      video_filename: filenames[0] || null, // Primary file
      status: 'sent',
      posted_at: new Date().toISOString(),
      media_type: mediaType,
      media_url: mediaUrls[0] || null, // Primary public URL
      
      // Instagram results
      instagram_success: results.instagram?.success || false,
      instagram_post_id: results.instagram?.mediaId || null,
      instagram_url: results.instagram?.url || results.instagram?.permalink || null,
      instagram_error: results.instagram?.error || null,
      
      // YouTube results
      youtube_success: results.youtube?.success || false,
      youtube_video_id: results.youtube?.videoId || null,
      youtube_url: results.youtube?.videoUrl || null,
      youtube_shorts_url: results.youtube?.shortsUrl || null,
      youtube_error: results.youtube?.error || null,

      // Pinterest results
      pinterest_success: results.pinterest?.success || false,
      pinterest_pin_id: results.pinterest?.pinId || null,
      pinterest_url: results.pinterest?.url || null,
      pinterest_error: results.pinterest?.error || null,

      // Facebook results
      facebook_success: results.facebook?.success || false,
      facebook_post_id: results.facebook?.postId || null,
      facebook_url: results.facebook?.postUrl || null,
      facebook_error: results.facebook?.error || null,
      
      // LinkedIn results
      linkedin_success: results.linkedin?.success || false,
      linkedin_post_id: results.linkedin?.postId || null,
      linkedin_url: results.linkedin?.url || null,
      linkedin_error: results.linkedin?.error || null,

      // Mastodon results
      mastodon_success: results.mastodon?.success || false,
      mastodon_post_id: results.mastodon?.id || null,
      mastodon_url: results.mastodon?.url || null,
      mastodon_error: results.mastodon?.error || null,

      // TikTok results
      tiktok_success: results.tiktok?.success || false,
      tiktok_publish_id: results.tiktok?.publishId || null,
      tiktok_error: results.tiktok?.error || null,
      
      // Bluesky results
      bluesky_success: results.bluesky?.success || false,
      bluesky_post_id: results.bluesky?.uri || results.bluesky?.id || null,
      bluesky_url: results.bluesky?.url || null,
      bluesky_error: results.bluesky?.error || null,

      // Threads results
      threads_success: results.threads?.success || false,
      threads_post_id: results.threads?.postId || null,
      threads_url: results.threads?.url || null,
      threads_error: results.threads?.error || null,

      // X results
      x_success: results.x?.success || false,
      x_post_id: results.x?.postId || null,
      x_url: results.x?.url || null,
      x_error: results.x?.error || null,
    };

    const { data, error } = await supabase
      .from('broadcasts')
      .insert([broadcastData])
      .select();

    if (error) {
      console.error('❌ [SUPABASE] Error saving broadcast record:', error.message);
      console.error('   Hint: If you see "threads_error" not found, run: NOTIFY pgrst, "reload schema";');
      // We don't throw here to prevent the whole broadcast response from being blocked
      // but we return null so the caller knows it wasn't saved.
      return null;
    }

    const savedRecord = data?.[0];
    if (savedRecord) {
      console.log('✅ Broadcast saved to database:', savedRecord.id);
      return savedRecord;
    }
    
    return null;
  } catch (error) {
    console.error('💥 Failed to save broadcast:', error.message || error);
    return null;
  }
}

/**
 * Get broadcasts for a user
 */
export async function getBroadcasts(userId, status = null) {
  try {
    let query = supabase
      .from('broadcasts')
      .select('*')
      .eq('user_id', userId)
      .order('posted_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching broadcasts:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Failed to fetch broadcasts:', error);
    throw error;
  }
}

/**
 * Get single broadcast by ID
 */
export async function getBroadcastById(broadcastId) {
  try {
    const { data, error } = await supabase
      .from('broadcasts')
      .select('*')
      .eq('id', broadcastId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to fetch broadcast:', error);
    throw error;
  }
}

/**
 * Delete broadcast
 */
export async function deleteBroadcast(broadcastId) {
  try {
    const { error } = await supabase
      .from('broadcasts')
      .delete()
      .eq('id', broadcastId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Failed to delete broadcast:', error);
    throw error;
  }
}
