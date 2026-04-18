import { default as supabase } from './supabase.js';

/**
 * Save broadcast record to database
 */
export async function saveBroadcast(userId, caption, videoFilename, results, mediaType = 'video', platformData = {}) {
  try {
    const broadcastData = {
      user_id: userId,
      caption: caption,
      video_filename: videoFilename,
      status: 'sent',
      posted_at: new Date().toISOString(),
      
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
    };

    const { data, error } = await supabase
      .from('broadcasts')
      .insert([broadcastData])
      .select()
      .single();

    if (error) {
      console.error('Error saving broadcast:', error);
      throw error;
    }

    console.log('✅ Broadcast saved to database:', data.id);
    return data;
  } catch (error) {
    console.error('Failed to save broadcast:', error);
    throw error;
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
