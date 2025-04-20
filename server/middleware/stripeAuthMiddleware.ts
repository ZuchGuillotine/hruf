import { Request, Response, NextFunction } from 'express';
import { db } from '@db';
import { users } from '@db/schema';
import { eq } from 'drizzle-orm';

/**
 * Middleware to handle Stripe checkout session continuity
 * This middleware checks for a session_id parameter in redirects from Stripe
 * and maintains the user's authentication state
 */
export const handleStripeRedirects = async (req: Request, res: Response, next: NextFunction) => {
  // Only check on specific routes related to Stripe redirects
  const isStripeRedirect = req.query.session_id && req.query.setup_complete;
  
  if (!isStripeRedirect) {
    return next();
  }

  try {
    const sessionId = req.query.session_id as string;
    console.log('Processing Stripe redirect with session ID:', {
      sessionId,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString()
    });

    // If user is already authenticated, no need to do anything
    if (req.isAuthenticated()) {
      console.log('User already authenticated during Stripe redirect', {
        userId: req.user?.id,
        sessionId,
        timestamp: new Date().toISOString()
      });
      return next();
    }

    // If session exists but user data is missing, we need to re-establish the user data
    if (req.session) {
      // Try to get user ID from Stripe's client_reference_id (stored during checkout creation)
      const stripe = await import('stripe').then(module => 
        new module.default(process.env.STRIPE_SECRET_KEY!));
      
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      const userId = parseInt(session.client_reference_id || '0', 10);
      
      if (userId) {
        // Get user from database
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);
          
        if (user) {
          // Re-establish session auth
          req.login(user, (err) => {
            if (err) {
              console.error('Error restoring user session after Stripe redirect:', {
                error: err.message,
                userId,
                sessionId,
                timestamp: new Date().toISOString()
              });
            } else {
              console.log('Successfully restored user session after Stripe redirect', {
                userId,
                sessionId,
                timestamp: new Date().toISOString()
              });
            }
            next();
          });
          return;
        }
      }
    }
    
    console.log('Unable to restore user session from Stripe redirect', {
      sessionId,
      hasSession: !!req.session,
      timestamp: new Date().toISOString()
    });
    next();
  } catch (error: any) {
    console.error('Error processing Stripe redirect:', {
      error: error.message,
      stack: error.stack,
      path: req.path,
      timestamp: new Date().toISOString()
    });
    next();
  }
};