import webpush from 'web-push';
import { db } from '../../db';
import { pushSubscriptions, users } from '../../db/schema';
import { eq } from 'drizzle-orm';
import logger from '../utils/logger';

// Configure web-push with VAPID keys
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:support@stacktracker.com';

// Initialize web-push with VAPID keys if available
if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    vapidSubject,
    vapidPublicKey,
    vapidPrivateKey
  );
} else {
  logger.warn('VAPID keys not set. Push notifications will not work.');
}

/**
 * Get the VAPID public key for client-side subscription
 */
export const getVapidPublicKey = (): string | null => {
  return vapidPublicKey || null;
};

/**
 * Send a push notification to a specific subscription
 */
export const sendPushNotification = async (
  subscription: webpush.PushSubscription,
  payload: any
): Promise<boolean> => {
  try {
    if (!vapidPublicKey || !vapidPrivateKey) {
      logger.error('VAPID keys not set. Cannot send push notification.');
      return false;
    }

    const result = await webpush.sendNotification(
      subscription,
      JSON.stringify(payload)
    );
    
    logger.info('Push notification sent successfully', { 
      statusCode: result.statusCode,
      endpoint: subscription.endpoint 
    });
    
    return true;
  } catch (error: any) {
    // Check if subscription is expired or invalid
    if (error.statusCode === 404 || error.statusCode === 410) {
      logger.warn('Subscription is no longer valid, removing', { 
        endpoint: subscription.endpoint,
        statusCode: error.statusCode 
      });
      
      try {
        // Remove invalid subscription from database
        await db.delete(pushSubscriptions)
          .where(eq(pushSubscriptions.endpoint, subscription.endpoint));
      } catch (dbError) {
        logger.error('Error removing invalid subscription', { error: dbError });
      }
    } else {
      logger.error('Error sending push notification', { 
        error: error.message,
        stack: error.stack,
        statusCode: error.statusCode 
      });
    }
    
    return false;
  }
};

/**
 * Send a notification to a specific user
 */
export const sendUserNotification = async (
  userId: number,
  title: string,
  message: string,
  options: {
    tag?: string;
    url?: string;
    requireInteraction?: boolean;
    actions?: Array<{ action: string; title: string }>;
  } = {}
): Promise<boolean> => {
  try {
    // Check if user has push notifications enabled
    const userResults = await db.select({ pushNotificationsEnabled: users.pushNotificationsEnabled })
      .from(users)
      .where(eq(users.id, userId));
      
    if (!userResults.length || !userResults[0].pushNotificationsEnabled) {
      logger.info('User has push notifications disabled', { userId });
      return false;
    }
    
    // Get all subscriptions for the user
    const subscriptions = await db.select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId));
      
    if (!subscriptions.length) {
      logger.info('User has no push subscriptions', { userId });
      return false;
    }
    
    // Prepare notification payload
    const payload = {
      title,
      message,
      tag: options.tag || 'default',
      url: options.url || '/',
      requireInteraction: options.requireInteraction || false,
      actions: options.actions || [],
      timestamp: new Date().toISOString()
    };
    
    // Send notification to all user's subscriptions
    const results = await Promise.all(
      subscriptions.map(sub => {
        const subscription: webpush.PushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        };
        
        return sendPushNotification(subscription, payload);
      })
    );
    
    // Return true if at least one notification was sent successfully
    return results.some(result => result);
  } catch (error) {
    logger.error('Error sending user notification', { 
      error,
      userId 
    });
    
    return false;
  }
};

/**
 * Send a supplement feedback notification to a user
 */
export const sendSupplementFeedbackNotification = async (
  userId: number,
  supplementNames: string[]
): Promise<boolean> => {
  try {
    // Format supplement names for the message
    let supplementText: string;
    if (supplementNames.length === 0) {
      supplementText = 'your supplements';
    } else if (supplementNames.length === 1) {
      supplementText = supplementNames[0];
    } else if (supplementNames.length === 2) {
      supplementText = `${supplementNames[0]} and ${supplementNames[1]}`;
    } else {
      const lastSupplement = supplementNames.pop();
      supplementText = `${supplementNames.join(', ')}, and ${lastSupplement}`;
    }
    
    const title = 'Supplement Feedback Reminder';
    const message = `How are you feeling after taking ${supplementText}? Tap to log your experience.`;
    
    // Add action buttons for quick feedback
    const actions = [
      { action: 'feedback', title: 'Give Feedback' },
      { action: 'later', title: 'Remind Later' }
    ];
    
    return await sendUserNotification(userId, title, message, {
      tag: 'supplement-feedback',
      url: '/supplement-history',
      requireInteraction: true,
      actions
    });
  } catch (error) {
    logger.error('Error sending supplement feedback notification', { 
      error,
      userId,
      supplementNames
    });
    
    return false;
  }
};