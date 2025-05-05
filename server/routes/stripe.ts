import express from 'express';
import stripeService from '../services/stripe';
import { db } from '@db';
import { users } from '@db/schema';
import { eq } from 'drizzle-orm';

const router = express.Router();

/**
 * Create a checkout session
 * POST /api/stripe/create-checkout-session
 */
router.post('/create-checkout-session', async (req, res) => {
  try {
    const { priceId, customerId, metadata = {} } = req.body;

    if (!priceId) {
      return res.status(400).json({ error: 'Price ID is required' });
    }

    // If user is authenticated, add their ID to metadata
    if (req.isAuthenticated() && req.user) {
      metadata.userId = req.user.id.toString();
    }

    // Create a checkout session
    const session = await stripeService.createCheckoutSession(
      priceId,
      `${req.protocol}://${req.get('host')}/payment-success`,
      `${req.protocol}://${req.get('host')}/subscription`,
      customerId,
      metadata
    );

    // Return the checkout session URL
    res.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

/**
 * Get checkout session details
 * GET /api/stripe/checkout-session/:id
 */
router.get('/checkout-session/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'Session ID is required' });
    }
    
    const session = await stripeService.getCheckoutSession(id);
    res.json(session);
  } catch (error) {
    console.error('Error retrieving checkout session:', error);
    res.status(500).json({ error: 'Failed to retrieve checkout session' });
  }
});

/**
 * Cancel subscription
 * POST /api/stripe/cancel-subscription
 */
router.post('/cancel-subscription', async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Get the user's subscription ID
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, req.user.id))
      .limit(1);
    
    if (!user || !user.subscriptionId) {
      return res.status(400).json({ error: 'No active subscription found' });
    }
    
    // Cancel the subscription
    await stripeService.cancelSubscription(user.subscriptionId);
    
    // Update user record
    await db
      .update(users)
      .set({
        subscriptionId: null,
        subscriptionTier: 'free',
        updatedAt: new Date(),
      })
      .where(eq(users.id, req.user.id));
    
    res.json({ success: true, message: 'Subscription canceled successfully' });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

export default router;