import { db } from '../../db';
import { pushSubscriptions, users } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { SelectPushSubscription } from '../../db/schema';
import webpush from 'web-push';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configure web-push with VAPID keys
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';

if (!vapidPublicKey || !vapidPrivateKey) {
  console.warn('VAPID keys are not set. Push notifications will not work correctly.');
} else {
  webpush.setVapidDetails(
    'mailto:' + (process.env.CONTACT_EMAIL || 'webmaster@healthtrac.app'),
    vapidPublicKey,
    vapidPrivateKey
  );
}

export interface NotificationPayload {
  title: string;
  message: string;
  url?: string;
  tag?: string;
  requireInteraction?: boolean;
  actions?: Array<{
    action: string;
    title: string;
  }>;
}

/**
 * Send push notification to a specific user
 */
export async function sendPushNotification(
  userId: number,
  payload: NotificationPayload
): Promise<boolean> {
  try {
    // First check if the user has enabled push notifications
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!user || !user.pushNotificationsEnabled) {
      console.log(`Push notifications not enabled for user ${userId}`);
      return false;
    }

    // Get all subscriptions for the user
    const subscriptions = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId));

    if (subscriptions.length === 0) {
      console.log(`No push subscriptions found for user ${userId}`);
      return false;
    }

    let success = false;
    // Send notification to all subscriptions
    for (const subscription of subscriptions) {
      try {
        await sendNotificationToSubscription(subscription, payload);
        success = true;
      } catch (error) {
        console.error(`Error sending push notification to subscription ${subscription.id}:`, error);
        
        // Check if subscription is expired or invalid
        if (
          error instanceof Error && 
          (error.message.includes('410') || error.message.includes('404'))
        ) {
          // Remove invalid subscription
          await db
            .delete(pushSubscriptions)
            .where(eq(pushSubscriptions.id, subscription.id));
          
          console.log(`Removed invalid subscription ${subscription.id}`);
        }
      }
    }

    return success;
  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
  }
}

/**
 * Send notification to a specific subscription
 */
async function sendNotificationToSubscription(
  subscription: SelectPushSubscription,
  payload: NotificationPayload
): Promise<void> {
  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth,
    },
  };

  const data = JSON.stringify({
    title: payload.title,
    message: payload.message,
    url: payload.url,
    tag: payload.tag || 'default',
    requireInteraction: payload.requireInteraction || false,
    actions: payload.actions || [],
  });

  // Send the notification
  await webpush.sendNotification(pushSubscription, data);
}

/**
 * Send feedback prompt notification to multiple users
 */
export async function sendSupplementFeedbackNotification(
  userIds: number[]
): Promise<{success: number, failed: number}> {
  let success = 0;
  let failed = 0;

  for (const userId of userIds) {
    const result = await sendPushNotification(userId, {
      title: 'Supplement Feedback',
      message: 'How are your supplements working for you today? Tap to provide feedback.',
      url: '/supplement-history',
      tag: 'supplement-feedback',
      requireInteraction: true,
      actions: [
        {
          action: 'feedback',
          title: 'Give Feedback'
        },
        {
          action: 'later',
          title: 'Remind Me Later'
        }
      ]
    });

    if (result) {
      success++;
    } else {
      failed++;
    }
  }

  return { success, failed };
}