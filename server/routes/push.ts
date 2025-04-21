import express from 'express';
import { db } from '../../db';
import { pushSubscriptions } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { getVapidPublicKey } from '../services/pushNotificationService';
import logger from '../utils/logger';

const router = express.Router();

/**
 * Get the VAPID public key for browser push notification subscription
 */
router.get('/vapid-public-key', (req, res) => {
  try {
    const publicKey = getVapidPublicKey();
    
    if (!publicKey) {
      return res.status(500).json({ 
        error: 'VAPID keys not configured on the server' 
      });
    }
    
    res.json({ publicKey });
  } catch (error) {
    logger.error('Error retrieving VAPID public key', { error });
    res.status(500).json({ 
      error: 'Internal server error retrieving VAPID public key' 
    });
  }
});

/**
 * Subscribe to push notifications
 * Requires authentication
 */
router.post('/subscribe', async (req, res) => {
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
    
    // Validate subscription data
    const { endpoint, keys } = req.body;
    
    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return res.status(400).json({ 
        error: 'Invalid subscription data. Endpoint and keys (p256dh, auth) are required' 
      });
    }

    // Check if subscription already exists
    const existingSubscription = await db.select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, endpoint));
      
    if (existingSubscription.length > 0) {
      // If the subscription exists but for a different user, update it
      if (existingSubscription[0].userId !== userId) {
        await db.update(pushSubscriptions)
          .set({ 
            userId,
            p256dh: keys.p256dh,
            auth: keys.auth,
            updatedAt: new Date()
          })
          .where(eq(pushSubscriptions.endpoint, endpoint));
          
        logger.info('Updated existing push subscription to new user', { 
          userId,
          endpoint 
        });
      }
    } else {
      // Create new subscription
      await db.insert(pushSubscriptions)
        .values({
          userId,
          endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth
        });
        
      logger.info('New push subscription created', { userId, endpoint });
    }
    
    res.status(201).json({ success: true, message: 'Subscription successful' });
  } catch (error) {
    logger.error('Error subscribing to push notifications', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Unsubscribe from push notifications
 * Requires authentication
 */
router.post('/unsubscribe', async (req, res) => {
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
    const { endpoint } = req.body;
    
    if (!endpoint) {
      return res.status(400).json({ error: 'Endpoint is required' });
    }
    
    // Delete subscription
    const result = await db.delete(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, endpoint));
      
    logger.info('Push subscription deleted', { userId, endpoint });
    
    res.json({ success: true, message: 'Unsubscribed successfully' });
  } catch (error) {
    logger.error('Error unsubscribing from push notifications', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;