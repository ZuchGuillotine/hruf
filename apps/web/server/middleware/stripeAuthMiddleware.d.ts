import { Request, Response, NextFunction } from 'express';
/**
 * Middleware to handle Stripe checkout session continuity
 * This middleware checks for a session_id parameter in redirects from Stripe
 * and maintains the user's authentication state
 */
export declare const handleStripeRedirects: (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;
//# sourceMappingURL=stripeAuthMiddleware.d.ts.map
