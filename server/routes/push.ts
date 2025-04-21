import express from 'express';
import { db } from '../../db';
import { pushSubscriptions, users } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { pushNotificationService } from '../services/pushNotificationService';
import logger from '../utils/logger';

const router = express.Router();

/**
 * Get VAPID public key for web push
 */
router.get('/vapid-public-key', (req, res) => {
  const publicKey = pushNotificationService.getVapidPublicKey();
  
  if (!publicKey) {
    return res.status(500).json({
      error: 'VAPID public key not available'
    });
  }
  
  return res.json({ publicKey });
});

/**
 * Subscribe to push notifications
 */
router.post('/subscribe', async (req, res) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({
      error: 'Not authenticated'
    });
  }
  
  try {
    const { endpoint, keys } = req.body;
    
    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return res.status(400).json({
        error: 'Invalid subscription data'
      });
    }
    
    const userId = (req.user as any).id;
    
    // Check if subscription already exists
    const existingSubscription = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, endpoint))
      .limit(1);
    
    if (existingSubscription.length > 0) {
      // Update existing subscription
      await db
        .update(pushSubscriptions)
        .set({
          p256dh: keys.p256dh,
          auth: keys.auth,
          updatedAt: new Date()
        })
        .where(eq(pushSubscriptions.endpoint, endpoint));
      
      logger.info(`Updated push subscription for user ${userId}`);
    } else {
      // Create new subscription
      await db.insert(pushSubscriptions).values({
        userId,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      logger.info(`Created new push subscription for user ${userId}`);
    }
    
    // Update user preferences to enable push notifications
    await db
      .update(users)
      .set({
        pushNotificationsEnabled: true
      })
      .where(eq(users.id, userId));
    
    return res.status(201).json({
      success: true
    });
  } catch (error) {
    logger.error('Error subscribing to push notifications:', error);
    return res.status(500).json({
      error: 'Failed to save subscription'
    });
  }
});

/**
 * Unsubscribe from push notifications
 */
router.post('/unsubscribe', async (req, res) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({
      error: 'Not authenticated'
    });
  }
  
  try {
    const { endpoint } = req.body;
    
    if (!endpoint) {
      return res.status(400).json({
        error: 'Invalid subscription data'
      });
    }
    
    const userId = (req.user as any).id;
    
    // Delete subscription
    await db
      .delete(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, endpoint));
    
    logger.info(`Deleted push subscription for user ${userId}`);
    
    // Check if user has any remaining subscriptions
    const remainingSubscriptions = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId));
    
    // If no more subscriptions, disable push notifications in user preferences
    if (remainingSubscriptions.length === 0) {
      await db
        .update(users)
        .set({
          pushNotificationsEnabled: false
        })
        .where(eq(users.id, userId));
      
      logger.info(`Disabled push notifications for user ${userId} due to no remaining subscriptions`);
    }
    
    return res.json({
      success: true
    });
  } catch (error) {
    logger.error('Error unsubscribing from push notifications:', error);
    return res.status(500).json({
      error: 'Failed to delete subscription'
    });
  }
});

/**
 * Update notification preferences
 */
router.post('/preferences', async (req, res) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({
      error: 'Not authenticated'
    });
  }
  
  try {
    const { enabled } = req.body;
    
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        error: 'Invalid preferences data'
      });
    }
    
    const userId = (req.user as any).id;
    
    // Update user preferences
    await db
      .update(users)
      .set({
        pushNotificationsEnabled: enabled
      })
      .where(eq(users.id, userId));
    
    logger.info(`Updated push notification preferences for user ${userId}: enabled=${enabled}`);
    
    // If disabling notifications, delete all subscriptions
    if (!enabled) {
      await db
        .delete(pushSubscriptions)
        .where(eq(pushSubscriptions.userId, userId));
      
      logger.info(`Deleted all push subscriptions for user ${userId}`);
    }
    
    return res.json({
      success: true
    });
  } catch (error) {
    logger.error('Error updating notification preferences:', error);
    return res.status(500).json({
      error: 'Failed to update preferences'
    });
  }
});

/**
 * Get current notification preferences
 */
router.get('/preferences', async (req, res) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({
      error: 'Not authenticated'
    });
  }
  
  try {
    const userId = (req.user as any).id;
    
    // Get user preferences
    const [user] = await db
      .select({
        pushNotificationsEnabled: users.pushNotificationsEnabled
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    // Get subscription count
    const subscriptions = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId));
    
    return res.json({
      enabled: user?.pushNotificationsEnabled || false,
      subscriptionCount: subscriptions.length
    });
  } catch (error) {
    logger.error('Error getting notification preferences:', error);
    return res.status(500).json({
      error: 'Failed to get preferences'
    });
  }
});

export default router;