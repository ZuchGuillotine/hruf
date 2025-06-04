
import { Request, Response } from 'express';

/**
 * Ultra-fast health check endpoint handler 
 * Returns immediately without any external dependencies
 */
export const healthCheck = (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime())
  });
};
