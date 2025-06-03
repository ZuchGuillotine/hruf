import { Request, Response } from 'express';

export function healthCheck(req: Request, res: Response) {
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || '5000'
  };

  // Log health check for debugging deployment issues
  if (process.env.NODE_ENV === 'production') {
    console.log('Health check accessed:', {
      url: req.url,
      method: req.method,
      headers: req.headers,
      timestamp: new Date().toISOString()
    });
  }

  return res.json(healthData);
}