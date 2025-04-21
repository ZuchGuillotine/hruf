import express from 'express';
import { db } from '../../db';
import { pushSubscriptions, users } from '../../db/schema';
import { eq, and } from 'drizzle-orm';

const router = express.Router();

// Middleware to check authentication
const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({
      error: "Authentication required",
      redirect: "/login"
    });
  }
  next();
};

// Save a push subscription
router.post('/subscribe', requireAuth, async (req, res) => {
  try {
    const { endpoint, keys } = req.body;
    
    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return res.status(400).json({ error: 'Invalid subscription data' });
    }

    // Check if subscription already exists
    const [existingSubscription] = await db
      .select()
      .from(pushSubscriptions)
      .where(
        and(
          eq(pushSubscriptions.userId, req.user!.id),
          eq(pushSubscriptions.endpoint, endpoint)
        )
      );

    if (existingSubscription) {
      // Update existing subscription
      await db
        .update(pushSubscriptions)
        .set({
          p256dh: keys.p256dh,
          auth: keys.auth,
          updatedAt: new Date(),
        })
        .where(eq(pushSubscriptions.id, existingSubscription.id));

      // Make sure user has push notifications enabled
      await db
        .update(users)
        .set({ pushNotificationsEnabled: true })
        .where(eq(users.id, req.user!.id));

      return res.json({ message: 'Subscription updated successfully' });
    }

    // Create new subscription
    const [subscription] = await db
      .insert(pushSubscriptions)
      .values({
        userId: req.user!.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      })
      .returning();

    // Also update user preferences
    await db
      .update(users)
      .set({ pushNotificationsEnabled: true })
      .where(eq(users.id, req.user!.id));

    res.json({ 
      message: 'Subscription saved successfully',
      subscription
    });
  } catch (error) {
    console.error('Error saving push subscription:', error);
    res.status(500).json({ error: 'Failed to save subscription' });
  }
});

// Remove a push subscription
router.post('/unsubscribe', requireAuth, async (req, res) => {
  try {
    const { endpoint } = req.body;
    
    if (!endpoint) {
      return res.status(400).json({ error: 'Endpoint is required' });
    }

    // Delete subscription
    await db
      .delete(pushSubscriptions)
      .where(
        and(
          eq(pushSubscriptions.userId, req.user!.id),
          eq(pushSubscriptions.endpoint, endpoint)
        )
      );

    // Update user preferences
    await db
      .update(users)
      .set({ pushNotificationsEnabled: false })
      .where(eq(users.id, req.user!.id));

    res.json({ message: 'Subscription removed successfully' });
  } catch (error) {
    console.error('Error removing push subscription:', error);
    res.status(500).json({ error: 'Failed to remove subscription' });
  }
});

export default router;