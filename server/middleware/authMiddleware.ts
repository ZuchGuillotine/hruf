
// Authentication middleware to ensure consistent user authentication checks
import { Request, Response, NextFunction } from 'express';

// Check if user is authenticated and set authentication information consistently
export const setAuthInfo = (req: Request, res: Response, next: NextFunction) => {
  // Directly use Passport's isAuthenticated method - this is the standard way
  const isAuthenticated = req.isAuthenticated?.();
  
  // Attach auth info to request object for consistent access
  req.authInfo = {
    isAuthenticated: !!isAuthenticated,
    userId: isAuthenticated && req.user ? req.user.id : null,
  };
  
  console.log('Auth middleware check:', {
    isAuthenticated: !!isAuthenticated,
    hasUser: !!req.user,
    userId: req.user?.id || null,
    sessionId: req.sessionID || null,
    timestamp: new Date().toISOString()
  });
  
  next();
};

// Middleware to require authentication (for protected routes)
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({
      error: "Authentication required",
      redirect: "/login"
    });
  }
  next();
};
