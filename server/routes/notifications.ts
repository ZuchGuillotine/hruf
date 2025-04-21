import express from 'express';
import { db } from '../../db';
import { users, supplements } from '../../db/schema';
import { eq, and, ne, isNotNull } from 'drizzle-orm';
import { sendPushNotification, sendSupplementFeedbackNotification } from '../services/pushNotificationService';

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

// Middleware to check admin role
const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({
      error: "Admin access required",
      message: "You do not have admin privileges"
    });
  }
  next();
};

// Send a test notification to current user
router.post('/test', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    
    const success = await sendPushNotification(userId, {
      title: 'Test Notification',
      message: 'This is a test notification from HealthTrac!',
      url: '/profile',
      tag: 'test-notification',
    });

    if (success) {
      res.json({ success: true, message: 'Test notification sent successfully' });
    } else {
      res.status(400).json({ 
        success: false, 
        message: 'Failed to send notification. Make sure you have enabled notifications and granted permission.'
      });
    }
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({ error: 'Failed to send test notification' });
  }
});

// Send supplement feedback notifications to all eligible users (Admin only)
router.post('/send-supplement-feedback', requireAuth, requireAdmin, async (req, res) => {
  try {
    // Find users with active supplements who have enabled push notifications
    const usersWithSupplements = await db
      .select({ userId: supplements.userId })
      .from(supplements)
      .where(
        and(
          eq(supplements.active, true),
          isNotNull(supplements.userId)
        )
      )
      .groupBy(supplements.userId);

    const userIds = usersWithSupplements
      .map(u => u.userId!)
      .filter(id => id !== null);

    // Get users who have enabled push notifications
    const eligibleUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          eq(users.pushNotificationsEnabled, true),
          ne(users.id, 0)
        )
      );

    const eligibleUserIds = eligibleUsers.map(u => u.id);
    
    // Get intersection of users with supplements and those who enabled notifications
    const targetUserIds = userIds.filter(id => eligibleUserIds.includes(id));

    if (targetUserIds.length === 0) {
      return res.json({ 
        success: true, 
        message: 'No eligible users found for supplement feedback notifications',
        count: 0
      });
    }

    const result = await sendSupplementFeedbackNotification(targetUserIds);

    res.json({
      success: true,
      message: `Sent notifications to ${result.success} users. Failed for ${result.failed} users.`,
      sent: result.success,
      failed: result.failed,
      total: targetUserIds.length
    });
  } catch (error) {
    console.error('Error sending supplement feedback notifications:', error);
    res.status(500).json({ error: 'Failed to send supplement feedback notifications' });
  }
});

export default router;