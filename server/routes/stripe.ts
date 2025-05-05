import { Router } from 'express';
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}

const router = Router();
const stripeApiVersion = '2023-10-16';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: stripeApiVersion as any, // Type cast to handle version mismatch
});

// Endpoint to retrieve session details for post-payment account creation
router.get('/checkout-session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Retrieve the Stripe session
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items.data.price.product', 'customer'],
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Return selected session data for account creation
    res.json({
      sessionId: session.id,
      customerId: session.customer,
      customerEmail: session.customer_details?.email,
      paymentStatus: session.payment_status,
      priceId: session.line_items?.data[0]?.price?.id,
      productId: session.line_items?.data[0]?.price?.product ? 
        (typeof session.line_items.data[0].price.product === 'string' ? 
          session.line_items.data[0].price.product : 
          session.line_items.data[0].price.product.id) 
        : null,
    });
  } catch (error: any) {
    console.error('Error retrieving checkout session:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve checkout session', 
      message: error.message 
    });
  }
});

// Express redirect route for Stripe checkout success
router.get('/checkout-success', (req, res) => {
  const { session_id } = req.query;
  
  // Redirect to our payment success page with session ID
  res.redirect(`/payment-success?session_id=${session_id}`);
});

export default router;