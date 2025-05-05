import { Router } from 'express';
import { db } from '@db';
import { users } from '@db/schema';
import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import Stripe from 'stripe';
import { getTierFromProductId } from '../utils/stripe-utils';

const router = Router();
const scryptAsync = promisify(scrypt);

// Helper for hashing passwords
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

// Register a user after they've completed a Stripe payment
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, sessionId, subscriptionTier } = req.body;

    // Validate required fields
    if (!username || !email || !password || !sessionId) {
      return res.status(400).json({ 
        message: 'Username, email, password, and session ID are required' 
      });
    }

    // Check if username or email already exists
    const existingUser = await db.select().from(users).where(
      users => users.username.equals(username).or(users.email.equals(email))
    ).limit(1);

    if (existingUser.length > 0) {
      return res.status(400).json({
        message: 'Username or email already exists'
      });
    }

    // Verify the Stripe session
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'line_items.data.price.product', 'customer']
    });

    if (!session || session.status !== 'complete') {
      return res.status(400).json({
        message: 'Invalid or incomplete payment session'
      });
    }

    // Get the subscription ID and customer ID from the session
    const subscriptionId = session.subscription as string;
    const stripeCustomerId = session.customer as string;

    // Determine the subscription tier from the product ID
    // If we couldn't determine it from the sessionId, use the provided tier
    let tier = subscriptionTier;
    if (session.line_items?.data[0]?.price?.product) {
      const productId = session.line_items.data[0].price.product as string;
      tier = getTierFromProductId(productId);
    }

    // Create the user with subscription information
    const [user] = await db.insert(users).values({
      username,
      email,
      password: await hashPassword(password),
      subscriptionTier: tier,
      subscriptionId,
      stripeCustomerId,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    // Log in the user by setting a session
    if (req.session) {
      req.session.userId = user.id;
    }

    // Return success
    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        subscriptionTier: user.subscriptionTier
      }
    });
  } catch (error: any) {
    console.error('Post-payment registration error:', error);
    
    res.status(500).json({
      message: `Registration failed: ${error.message}`
    });
  }
});

export default router;