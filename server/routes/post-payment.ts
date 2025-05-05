import express from 'express';
import { db } from '@db';
import { users } from '@db/schema';
import { eq } from 'drizzle-orm';
import stripeService from '../services/stripe';
import { z } from 'zod';
import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const router = express.Router();
const scryptAsync = promisify(scrypt);

// Schema for post-payment registration
const postPaymentSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(50),
  password: z.string().min(8),
  sessionId: z.string(),
  name: z.string().optional(),
});

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

/**
 * Register a user after they've completed payment
 * POST /api/post-payment-registration
 */
router.post('/post-payment-registration', async (req, res) => {
  try {
    // Validate request body
    const validationResult = postPaymentSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Invalid request data',
        details: validationResult.error.errors 
      });
    }

    const { email, username, password, sessionId, name } = validationResult.data;

    // Check if user with this email already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Check if username is already taken
    const existingUsername = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (existingUsername.length > 0) {
      return res.status(400).json({ error: 'Username is already taken' });
    }

    // Retrieve the checkout session to verify and get subscription info
    const session = await stripeService.getCheckoutSession(sessionId);
    
    if (!session || session.status !== 'complete') {
      return res.status(400).json({ error: 'Invalid or incomplete checkout session' });
    }

    // Get the subscription data
    const subscriptionId = session.subscription as string;
    const customerId = session.customer as string;
    
    if (!subscriptionId || !customerId) {
      return res.status(400).json({ error: 'No subscription information found' });
    }

    // Retrieve the subscription to get the product
    const subscription = await stripeService.stripe.subscriptions.retrieve(subscriptionId);
    const productId = subscription.items.data[0].price.product as string;

    // Create the user
    const [user] = await db
      .insert(users)
      .values({
        email,
        username,
        password: await hashPassword(password),
        name: name || null,
        subscriptionId,
        customerId,
        subscriptionTier: getTierFromProductId(productId), 
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Log the user in
    req.login(user, (err) => {
      if (err) {
        console.error('Error logging in user after registration:', err);
        return res.status(500).json({ error: 'Failed to log in after registration' });
      }
      
      // Return success with user data (without sensitive fields)
      const { password: _, ...userData } = user;
      return res.status(201).json(userData);
    });
  } catch (error) {
    console.error('Error in post-payment registration:', error);
    return res.status(500).json({ error: 'Failed to complete registration' });
  }
});

/**
 * Determine subscription tier from Stripe product ID
 */
function getTierFromProductId(productId: string): 'free' | 'starter' | 'pro' {
  // These should match the product IDs in your Stripe account
  const PRODUCT_MAP: Record<string, 'free' | 'starter' | 'pro'> = {
    'prod_SF40NCVtZWsX05': 'starter', // Starter AI essentials
    'prod_RtcuCvjOY9gHvm': 'pro',     // Pro biohacker suite
  };

  return PRODUCT_MAP[productId] || 'free';
}

export default router;