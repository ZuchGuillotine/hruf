import express from 'express';
import { db } from '../../db';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { pushNotificationService } from '../services/pushNotificationService';
import logger from '../utils/logger';

const router = express.Router();

/**
 * Send a test notification to the current user
 */
router.post('/test', async (req, res) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({
      error: 'Not authenticated'
    });
  }
  
  try {
    const userId = (req.user as any).id;
    
    // Check if user has notifications enabled
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    if (!user || !user.pushNotificationsEnabled) {
      return res.status(400).json({
        error: 'Push notifications are not enabled for this user'
      });
    }
    
    // Send a test notification
    const result = await pushNotificationService.sendNotificationToUser(
      userId,
      'Test Notification',
      'This is a test notification from StackTracker',
      {
        tag: 'test-notification'
      }
    );
    
    return res.json({
      success: result.success,
      sent: result.sent,
      failed: result.failed
    });
  } catch (error) {
    logger.error('Error sending test notification:', error);
    return res.status(500).json({
      error: 'Failed to send test notification'
    });
  }
});

/**
 * Send a supplement feedback reminder notification to the current user
 */
router.post('/supplement-feedback-reminder', async (req, res) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({
      error: 'Not authenticated'
    });
  }
  
  try {
    const userId = (req.user as any).id;
    
    // Check if user has notifications enabled
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    if (!user || !user.pushNotificationsEnabled) {
      return res.status(400).json({
        error: 'Push notifications are not enabled for this user'
      });
    }
    
    // Send a supplement feedback reminder notification
    const result = await pushNotificationService.sendSupplementFeedbackReminder(userId);
    
    return res.json({
      success: result.success
    });
  } catch (error) {
    logger.error('Error sending supplement feedback reminder:', error);
    return res.status(500).json({
      error: 'Failed to send supplement feedback reminder'
    });
  }
});

/**
 * Send a broadcast notification to all users (admin only)
 */
router.post('/broadcast', async (req, res) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({
      error: 'Not authenticated'
    });
  }
  
  try {
    const userId = (req.user as any).id;
    
    // Check if user is an admin
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    if (!user || !user.isAdmin) {
      return res.status(403).json({
        error: 'Not authorized to send broadcast notifications'
      });
    }
    
    const { title, message, options } = req.body;
    
    if (!title || !message) {
      return res.status(400).json({
        error: 'Title and message are required'
      });
    }
    
    // Send broadcast notification
    const result = await pushNotificationService.sendBroadcastNotification(
      title,
      message,
      options
    );
    
    return res.json({
      success: result.success,
      sent: result.sent,
      failed: result.failed
    });
  } catch (error) {
    logger.error('Error sending broadcast notification:', error);
    return res.status(500).json({
      error: 'Failed to send broadcast notification'
    });
  }
});

export default router;