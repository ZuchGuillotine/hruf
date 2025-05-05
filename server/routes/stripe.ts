import express from 'express';
import Stripe from 'stripe';
import stripeService from '../services/stripe';
import { PRODUCTS } from '../../client/src/lib/stripe-price-ids';

const router = express.Router();

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { 
  apiVersion: '2023-10-16' 
});

// Helper function to validate environment
function validateStripeEnvironment() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
  }
}

/**
 * Get checkout session
 * GET /api/stripe/checkout-session/:sessionId
 */
router.get('/checkout-session/:sessionId', async (req, res) => {
  try {
    validateStripeEnvironment();
    
    const { sessionId } = req.params;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }
    
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    return res.json(session);
  } catch (error: any) {
    console.error('Error retrieving checkout session:', error);
    return res.status(500).json({ 
      error: 'Failed to retrieve checkout session',
      message: error.message
    });
  }
});

/**
 * Create a checkout session
 * POST /api/stripe/create-checkout-session
 */
router.post('/create-checkout-session', async (req, res) => {
  try {
    validateStripeEnvironment();
    
    const { priceId, successUrl, cancelUrl, customerEmail } = req.body;
    
    if (!priceId || !successUrl || !cancelUrl) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Create checkout session
    const session = await stripeService.createCheckoutSession({
      priceId,
      successUrl,
      cancelUrl,
      customerEmail,
      metadata: {
        priceId,
        userAgent: req.headers['user-agent'] || '',
        referrer: req.headers.referer || '',
      }
    });
    
    return res.json({ 
      sessionId: session.id,
      url: session.url
    });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return res.status(500).json({ 
      error: 'Failed to create checkout session',
      message: error.message
    });
  }
});

/**
 * Get subscription details
 * GET /api/stripe/subscription/:subscriptionId
 */
router.get('/subscription/:subscriptionId', async (req, res) => {
  try {
    validateStripeEnvironment();
    
    // Ensure user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { subscriptionId } = req.params;
    
    if (!subscriptionId) {
      return res.status(400).json({ error: 'Subscription ID is required' });
    }
    
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    return res.json(subscription);
  } catch (error: any) {
    console.error('Error retrieving subscription:', error);
    return res.status(500).json({ 
      error: 'Failed to retrieve subscription',
      message: error.message
    });
  }
});

/**
 * Get subscription details for current user
 * GET /api/stripe/my-subscription
 */
router.get('/my-subscription', async (req, res) => {
  try {
    validateStripeEnvironment();
    
    // Ensure user is authenticated
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Check if user has a subscription
    const subscriptionId = req.user.subscriptionId;
    
    if (!subscriptionId) {
      return res.status(404).json({ error: 'No subscription found for user' });
    }
    
    const subscription = await stripe.subscriptions.retrieve(subscriptionId as string);
    
    return res.json(subscription);
  } catch (error: any) {
    console.error('Error retrieving user subscription:', error);
    return res.status(500).json({ 
      error: 'Failed to retrieve subscription',
      message: error.message
    });
  }
});

/**
 * Get available subscription plans
 * GET /api/stripe/plans
 */
router.get('/plans', async (req, res) => {
  try {
    validateStripeEnvironment();
    
    // Return the predefined products/plans
    return res.json({ products: PRODUCTS });
  } catch (error: any) {
    console.error('Error retrieving plans:', error);
    return res.status(500).json({ 
      error: 'Failed to retrieve plans',
      message: error.message
    });
  }
});

/**
 * Stripe webhook
 * POST /api/stripe/webhook
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'];
    
    if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
      return res.status(400).json({ error: 'Webhook signature missing' });
    }
    
    let event;
    
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err: any) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    // Handle events
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('Checkout session completed:', session.id);
        // Handle session completion (e.g., provision access)
        break;
        
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        const subscription = event.data.object as Stripe.Subscription;
        console.log('Subscription event:', event.type, subscription.id);
        // Update user subscription status
        break;
        
      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object as Stripe.Subscription;
        console.log('Subscription deleted:', deletedSubscription.id);
        // Downgrade user to free tier
        break;
        
      case 'invoice.payment_failed':
        const invoice = event.data.object as Stripe.Invoice;
        console.log('Payment failed:', invoice.id);
        // Notify user of payment failure
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    res.json({ received: true });
  } catch (error: any) {
    console.error('Error handling webhook:', error);
    return res.status(500).json({ 
      error: 'Webhook processing failed',
      message: error.message
    });
  }
});

export default router;