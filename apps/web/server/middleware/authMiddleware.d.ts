import { Request, Response, NextFunction } from 'express';
export declare const setAuthInfo: (req: Request, res: Response, next: NextFunction) => void;
declare global {
  namespace Express {
    interface Request {
      authInfo?: {
        isAuthenticated: boolean;
        userId: number | null;
      };
    }
  }
}
//# sourceMappingURL=authMiddleware.d.ts.map
