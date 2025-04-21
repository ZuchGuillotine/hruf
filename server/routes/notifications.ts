import express from 'express';
import { db } from '../../db';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { sendSupplementFeedbackNotification } from '../services/pushNotificationService';
import logger from '../utils/logger';

const router = express.Router();

/**
 * Update notification settings for the authenticated user
 * Enables or disables push notifications
 */
router.post('/settings', async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Get user ID from session
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Invalid user session' });
    }
    
    // Validate request data
    const { enabled } = req.body;
    
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ error: 'Enabled parameter must be a boolean' });
    }
    
    // Update user settings
    await db.update(users)
      .set({ 
        pushNotificationsEnabled: enabled,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
      
    logger.info('User notification settings updated', { 
      userId,
      pushNotificationsEnabled: enabled
    });
    
    res.json({ 
      success: true,
      message: `Push notifications ${enabled ? 'enabled' : 'disabled'} successfully` 
    });
  } catch (error) {
    logger.error('Error updating notification settings', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get current notification settings
 * Returns the user's notification preferences
 */
router.get('/settings', async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Get user ID from session
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Invalid user session' });
    }
    
    // Get user's notification settings
    const userSettings = await db.select({ 
      pushNotificationsEnabled: users.pushNotificationsEnabled 
    })
    .from(users)
    .where(eq(users.id, userId));
    
    if (userSettings.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ 
      pushNotificationsEnabled: userSettings[0].pushNotificationsEnabled
    });
  } catch (error) {
    logger.error('Error retrieving notification settings', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Test endpoint to send a notification to the authenticated user
 * This is for testing push notification functionality
 */
router.post('/test', async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Get user ID from session
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Invalid user session' });
    }
    
    // Send a test notification
    const supplementNames = req.body.supplementNames || ['Test Supplement'];
    const success = await sendSupplementFeedbackNotification(userId, supplementNames);
    
    if (success) {
      res.json({ 
        success: true, 
        message: 'Test notification sent successfully' 
      });
    } else {
      res.status(400).json({ 
        success: false, 
        message: 'Failed to send test notification. Notifications may be disabled for this user or no subscriptions exist.'
      });
    }
  } catch (error) {
    logger.error('Error sending test notification', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;