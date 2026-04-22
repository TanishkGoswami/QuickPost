import express from 'express';
import { authenticateUser } from '../middleware/authenticateUser.js';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

/**
 * @route   GET /api/onboarding
 * @desc    Check if user has completed onboarding + get their preferences
 * @access  Protected
 */
router.get('/onboarding', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.userId;

    const { data, error } = await supabase
      .from('user_onboarding')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = row not found
      throw error;
    }

    res.json({
      success: true,
      onboarding: data || null,
      completed: data?.completed || false
    });
  } catch (error) {
    console.error('Get onboarding error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch onboarding status' });
  }
});

/**
 * @route   POST /api/onboarding
 * @desc    Save or update onboarding preferences
 * @access  Protected
 * @body    { channels: [], tools: [], user_type: string, completed: boolean }
 */
router.post('/onboarding', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { channels = [], tools = [], user_type = null, completed = false } = req.body;

    const { data, error } = await supabase
      .from('user_onboarding')
      .upsert(
        {
          user_id:   userId,
          channels:  channels,
          tools:     tools,
          user_type: user_type,
          completed: completed,
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, onboarding: data });
  } catch (error) {
    console.error('Save onboarding error:', error);
    res.status(500).json({ success: false, error: 'Failed to save onboarding data' });
  }
});

export default router;
