
import { Request, Response } from 'express';
import { db } from '@db';

/**
 * Health check endpoint handler
 * Verifies database connection and returns service status
 */
export const healthCheck = async (req: Request, res: Response) => {
  try {
    // Check database connection
    await db.query.users.findFirst();
    
    res.status(200).json({
      status: 'ok',
      message: 'Service is healthy',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    console.error('Health check failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    
    res.status(500).json({
      status: 'error',
      message: 'Service is unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
