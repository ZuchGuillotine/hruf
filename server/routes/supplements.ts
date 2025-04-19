import express from 'express';
import { db } from '../../db';
import { supplements, supplementLogs } from '../../db/schema';
import { eq, and, gte } from 'drizzle-orm';

const router = express.Router();

// Middleware to check authentication
const requireAuth = (req: any, res: any, next: any) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
};

// Get user's supplement streak
router.get('/streak', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get supplements logged in the last 14 days
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const logs = await db.select()
      .from(supplementLogs)
      .where(
        and(
          eq(supplementLogs.userId, userId),
          gte(supplementLogs.takenAt, twoWeeksAgo)
        )
      );

    // Count consecutive days, handling timezone correctly
    const streakDays = logs.reduce((streak, log) => {
      if (!log.takenAt) return streak;
      const logDate = new Date(log.takenAt).toLocaleDateString('en-CA'); // Use toLocaleDateString to get date in consistent format regardless of timezone.
      const today = new Date().toLocaleDateString('en-CA');
      return logDate === today ? streak + 1 : streak;
    }, 0);

    console.log('Streak calculation result:', {
      userId,
      streakDays,
      logsCount: logs.length,
      timestamp: new Date().toISOString()
    });

    res.json({ streakDays });
  } catch (error) {
    console.error('Error fetching streak:', error);
    res.status(500).json({ error: 'Failed to fetch streak data' });
  }
});

export default router;