
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to handle payment flow for new users
 * Sets a flag in the session to indicate if payment modal should be shown
 */
export const ensurePaymentFlow = (req: Request, res: Response, next: NextFunction) => {
  // Check if this is a new signup
  const isNewSignup = req.query.signup === 'success' || req.query.showPayment === 'true';
  
  if (isNewSignup && req.session) {
    // Set a flag in session to indicate payment modal should be shown
    req.session.showPaymentModal = true;
    console.log('Setting payment modal flag in session:', {
      sessionId: req.sessionID,
      showPaymentModal: true,
      isAuthenticated: req.isAuthenticated(),
      timestamp: new Date().toISOString()
    });
  }
  
  next();
};
