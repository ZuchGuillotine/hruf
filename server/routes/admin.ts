import express from 'express';
import { db } from '@db';
import { users } from '@db/schema';
import { eq } from 'drizzle-orm';
import cors from 'cors';

const router = express.Router();

// Configure CORS for admin routes
router.use(
  cors({
    origin: process.env.ADMIN_DASHBOARD_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Middleware to check admin status
const requireAdmin = async (req: any, res: any, next: any) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

router.use(requireAdmin);

// Get all users' subscription information
router.get('/users/subscriptions', async (req, res) => {
  try {
    const userSubscriptions = await db
      .select({
        id: users.id,
        email: users.email,
        subscriptionTier: users.subscriptionTier,
        subscriptionId: users.subscriptionId,
      })
      .from(users);

    res.json(userSubscriptions);
  } catch (error) {
    console.error('Error fetching user subscriptions:', error);
    res.status(500).json({ error: 'Failed to fetch user subscriptions' });
  }
});

// Get specific user's subscription information
router.get('/users/:userId/subscription', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const userSubscription = await db
      .select({
        id: users.id,
        email: users.email,
        subscriptionTier: users.subscriptionTier,
        subscriptionId: users.subscriptionId,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!userSubscription.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(userSubscription[0]);
  } catch (error) {
    console.error('Error fetching user subscription:', error);
    res.status(500).json({ error: 'Failed to fetch user subscription' });
  }
});

export default router;
