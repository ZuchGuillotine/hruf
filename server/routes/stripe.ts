import express from 'express';
import * as stripeService from '../services/stripe';
import Stripe from 'stripe';
import { db } from '@db';
import { users } from '@db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import { log } from '../vite';

// Check for Stripe API key
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing required Stripe secret: STRIPE_SECRET_KEY");
}

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

// Ensure JSON parsing middleware is applied
router.use(express.json());

// Create checkout session - this is now for unauthenticated users in our new flow
router.post('/create-checkout-session', async (req, res) => {
  try {
    log('Creating checkout session', 'express');
    const { planId, isAnnual } = req.body;

    if (!planId) {
      return res.status(400).json({ error: 'Plan ID is required' });
    }

    // Using the updated checkout service
    const result = await stripeService.createCheckoutSession({
      planId,
      isAnnual: !!isAnnual,
      successUrl: `${process.env.PUBLIC_URL || req.headers.origin}/auth`,
      cancelUrl: `${process.env.PUBLIC_URL || req.headers.origin}/`,
    });

    log(`Checkout session created: ${result.sessionId}`, 'express');

    res.json({ 
      url: result.url,
      sessionId: result.sessionId,
      purchaseId: result.purchaseId
    });
  } catch (error: any) {
    log(`Error creating checkout session: ${error.message}`, 'express');
    console.error('Error creating checkout session:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    res.status(500).json({ 
      error: 'Failed to create checkout session',
      message: error.message 
    });
  }
});


// Validate a Stripe checkout session before creating a user account
router.get('/validate-session', async (req, res) => {
  try {
    const sessionId = req.query.session_id as string;
    if (!sessionId) {
      return res.status(400).json({ error: 'No session ID provided' });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status === 'paid' || session.payment_status === 'no_payment_required') {
      // Get subscription tier from the session metadata or line items
      let subscriptionTier = 'premium';
      
      // Get optional customer info for pre-filling registration form
      const customerDetails = {
        email: session.customer_details?.email || null,
        name: session.customer_details?.name || null,
      };
      
      return res.status(200).json({ 
        valid: true,
        sessionId,
        customerDetails,
        subscriptionTier,
        status: session.payment_status
      });
    }

    res.status(400).json({ 
      valid: false,
      error: 'Payment not completed',
      status: session.payment_status
    });
  } catch (error) {
    log(`Error validating session: ${error instanceof Error ? error.message : 'Unknown error'}`, 'express');
    res.status(500).json({ 
      valid: false,
      error: 'Failed to validate session',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/check-subscription', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const tier = await stripeService.getSubscriptionTier(userId);
    const isPaid = await stripeService.hasActivePaidSubscription(userId);
    
    res.json({ 
      success: true,
      subscriptionTier: tier,
      isPaidSubscription: isPaid
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check subscription status' });
  }
});

// Endpoint to create a free tier account without requiring payment info
router.post('/create-free-account', async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    console.log('Creating free tier account for user:', {
      userId,
      timestamp: new Date().toISOString()
    });
    
    // Update user with free tier information
    await db
      .update(users)
      .set({ 
        subscriptionTier: 'free'
      })
      .where(eq(users.id, userId));
    
    console.log('Free tier account created successfully', {
      userId,
      timestamp: new Date().toISOString()
    });
    
    // Get user data to return with the response
    const [updatedUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    res.json({ 
      success: true,
      subscriptionTier: 'free',
      user: updatedUser
    });
  } catch (error: any) {
    console.error('Error creating free tier account:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    res.status(500).json({ 
      error: 'Failed to create free tier account',
      message: error.message 
    });
  }
});

// Guest checkout endpoint - no authentication required
router.post('/create-checkout-session-guest', async (req, res) => {
  try {
    console.log('Creating guest checkout session:', {
      body: req.body,
      timestamp: new Date().toISOString()
    });

    const { priceId } = req.body;

    if (!priceId) {
      console.log('Missing priceId in request');
      return res.status(400).json({ error: 'Price ID is required' });
    }

    // Map product IDs to their respective Stripe price IDs
    const priceIdMap: Record<string, string> = {
      'prod_RtcuCvjOY9gHvm': 'price_1QzpeMAIJBVVerrJ12ZYExkV', // Monthly no trial 
      'price_starter_yearly': 'price_1QzpeMAIJBVVerrJ12ZYFxkV', // Replace with actual yearly Starter price ID
      'prod_RpdfGxB4L6Rut7': 'price_1QvyNlAIJBVVerrJPOw4EIMa', // Pro monthly
      'price_pro_yearly': 'price_1QvyNlAIJBVVerrJPOw5FIMa', // Replace with actual yearly Pro price ID
    };

    // Use the provided product ID directly or map it if needed
    let stripePriceId = priceIdMap[priceId] || priceId;

    // Using Stripe instance defined at the top of the file
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
      : `${req.protocol}://${req.get('host')}`;

    console.log('Creating guest checkout session:', {
      priceId: stripePriceId,
      timestamp: new Date().toISOString()
    });
    
    // Generate a unique session identifier for this purchase
    const purchaseIdentifier = crypto.randomBytes(16).toString('hex');
    
    // Create Stripe checkout session for a guest (no authentication)
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}&purchase_id=${purchaseIdentifier}`,
      cancel_url: `${baseUrl}/`,
      metadata: {
        purchaseIdentifier
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      // No customer_email since this is for guests
    });

    console.log('Guest checkout session created:', {
      sessionId: session.id,
      purchaseIdentifier,
      url: session.url,
      timestamp: new Date().toISOString()
    });

    res.json({ url: session.url });
  } catch (error: any) {
    console.error('Error creating guest checkout session:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    res.status(500).json({ 
      error: 'Failed to create checkout session',
      message: error.message 
    });
  }
});

router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  try {
    // Using Stripe instance defined at the top of the file

    const event = stripe.webhooks.constructEvent(req.body, sig!, endpointSecret!);

    switch (event.type) {
      case 'customer.subscription.updated':
      case 'customer.subscription.created':
        await stripeService.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
    }

    res.json({ received: true });
  } catch (err: any) {
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

export default router;