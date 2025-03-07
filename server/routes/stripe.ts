import express from 'express';
import { stripeService } from '../services/stripe';
import Stripe from 'stripe';

const router = express.Router();

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

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16',
    });

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${req.protocol}://${req.get('host')}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.protocol}://${req.get('host')}/subscription`,
      client_reference_id: userId.toString(),
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

router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16',
    });

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