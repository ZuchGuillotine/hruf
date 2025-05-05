import express from 'express';
import { stripeService } from '../services/stripe';
import Stripe from 'stripe';
import { db } from '@db';
import { users } from '@db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Ensure JSON parsing middleware is applied
router.use(express.json());

router.post('/create-checkout-session', async (req, res) => {
  try {
    console.log('Creating checkout session:', {
      body: req.body,
      user: req.user,
      timestamp: new Date().toISOString()
    });

    const { priceId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      console.log('Unauthorized request - no user ID');
      return res.status(401).json({ error: 'Unauthorized' });
    }

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

    console.log('Creating checkout session with user ID:', {
      userId,
      priceId: stripePriceId,
      timestamp: new Date().toISOString()
    });
    
    // Determine if this plan should include a trial period
    // Usually starter and free plans get trials, pro plans don't
    const shouldIncludeTrial = stripePriceId.includes('starter') || priceId.includes('starter');
    
    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/?session_id={CHECKOUT_SESSION_ID}&setup_complete=true`,
      cancel_url: `${baseUrl}/profile`,
      client_reference_id: userId.toString(),
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      customer_email: req.user?.email,
      subscription_data: {
        // Add trial period for starter plans
        trial_period_days: shouldIncludeTrial ? 14 : undefined,
        metadata: {
          userId: userId.toString(),
        },
      },
    });

    console.log('Checkout session created:', {
      sessionId: session.id,
      url: session.url,
      timestamp: new Date().toISOString()
    });

    res.json({ url: session.url });
  } catch (error: any) {
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


router.get('/subscription-success', async (req, res) => {
  try {
    const sessionId = req.query.session_id as string;
    if (!sessionId) {
      return res.status(400).json({ error: 'No session ID provided' });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status === 'paid') {
      // Process the subscription update
      await stripeService.handleSubscriptionUpdated(session.subscription as any);
      
      // Instead of redirecting, return success for the client to handle
      return res.status(200).json({ 
        success: true,
        subscriptionId: session.subscription,
        status: 'active'
      });
    }

    res.status(400).json({ 
      error: 'Payment not completed',
      status: session.payment_status
    });
  } catch (error) {
    console.error('Error handling subscription success:', error);
    res.status(500).json({ 
      error: 'Failed to process subscription',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/extend-trial', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await stripeService.extendTrialPeriod(userId, 7);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to extend trial period' });
  }
});

// Endpoint to start free trial without requiring payment info
router.post('/start-free-trial', async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    console.log('Starting free trial for user:', {
      userId,
      timestamp: new Date().toISOString()
    });
    
    // Set trial end date to 28 days from now
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 28);
    
    // Update user with trial information
    await db
      .update(users)
      .set({ 
        trialEndsAt: trialEndDate,
        subscriptionTier: 'free',
        subscriptionStatus: 'trial',
        isPro: false,
      })
      .where(eq(users.id, userId));
    
    console.log('Free trial started successfully', {
      userId,
      trialEndsAt: trialEndDate.toISOString(),
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
      trialEndsAt: trialEndDate.toISOString(),
      user: updatedUser
    });
  } catch (error: any) {
    console.error('Error starting free trial:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    res.status(500).json({ 
      error: 'Failed to start free trial',
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