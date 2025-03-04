
// Authentication middleware to ensure consistent user authentication checks
import { Request, Response, NextFunction } from 'express';

// Check if user is authenticated and set authentication information consistently
export const setAuthInfo = (req: Request, res: Response, next: NextFunction) => {
  // Use Passport's isAuthenticated if available, fallback to checking req.user
  const isAuthenticated = req.isAuthenticated ? req.isAuthenticated() : (req.user ? true : false);
  
  // Attach auth info to request object for consistent access
  req.authInfo = {
    isAuthenticated,
    userId: isAuthenticated && req.user ? req.user.id : null,
  };
  
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
