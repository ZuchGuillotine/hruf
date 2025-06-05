import { Request, Response, NextFunction } from 'express';
export declare const checkLLMLimit: (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void | Response<any, Record<string, any>>>;
export declare const checkLabUploadLimit: (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=tierLimitMiddleware.d.ts.map
