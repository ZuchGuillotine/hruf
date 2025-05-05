import express from 'express';
import { db } from '@db';
import { users } from '@db/schema';
import { eq } from 'drizzle-orm';
import Stripe from 'stripe';
import { z } from 'zod';
import crypto from 'crypto';
import { scrypt } from 'crypto';
import { promisify } from 'util';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const scryptAsync = promisify(scrypt);

// Helper function to hash password
async function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString('hex');
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

// Validation schema for post-payment registration
const registerPostPaymentSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
  sessionId: z.string(),
  subscriptionTier: z.string().optional(),
  purchaseId: z.string().optional()
});

router.post('/register-post-payment', async (req, res) => {
  try {
    // Validate request data
    const validationResult = registerPostPaymentSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: 'Invalid registration data', 
        errors: validationResult.error.errors 
      });
    }
    
    const { username, email, password, sessionId, subscriptionTier, purchaseId } = validationResult.data;
    
    // Check if user already exists
    const existingUser = await db
      .select({ count: sql`count(*)` })
      .from(users)
      .where(eq(users.email, email))
      .then(rows => Number(rows[0]?.count || '0'));
      
    if (existingUser > 0) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }
    
    // Verify Stripe session exists and is valid
    let stripeSubscriptionId = null;
    let verified = false;
    let verifiedTier = subscriptionTier || 'starter';
    
    try {
      if (sessionId) {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        
        if (session && session.payment_status === 'paid') {
          verified = true;
          
          // Set subscription ID if available
          if (session.subscription) {
            stripeSubscriptionId = session.subscription as string;
            
            // Get more details about the subscription
            const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
            
            // Set the verified tier based on the product
            if (subscription && subscription.items?.data[0]?.price?.product) {
              const productId = subscription.items.data[0].price.product;
              
              // Map product IDs to subscription tiers
              if (typeof productId === 'string') {
                if (productId === 'prod_SF40NCVtZWsX05') {
                  verifiedTier = 'starter';
                } else if (productId === 'prod_RtcuCvjOY9gHvm') {
                  verifiedTier = 'pro';
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error verifying Stripe session:', error);
      // We'll still create the account, but as free tier
      verified = false;
      verifiedTier = 'free';
    }
    
    // Create the user account
    const [newUser] = await db
      .insert(users)
      .values({
        username,
        email,
        password: await hashPassword(password),
        subscriptionTier: verified ? verifiedTier : 'free',
        stripeSubscriptionId: stripeSubscriptionId,
        stripeCustomerId: null, // Will be updated later if needed
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    if (!newUser) {
      return res.status(500).json({ message: 'Failed to create user account' });
    }
    
    // Log the user in (create a session)
    req.login(newUser, (err) => {
      if (err) {
        console.error('Error logging in after registration:', err);
        return res.status(500).json({ message: 'Account created but login failed' });
      }
      
      // Return success with user data (excluding sensitive fields)
      const { password, ...userWithoutPassword } = newUser;
      return res.status(201).json({ 
        message: 'Account created successfully',
        user: userWithoutPassword
      });
    });
  } catch (error: any) {
    console.error('Error in post-payment registration:', error);
    res.status(500).json({ 
      message: 'Registration failed',
      error: error.message
    });
  }
});

export default router;