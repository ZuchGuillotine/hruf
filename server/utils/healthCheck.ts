
import { Request, Response } from 'express';
import { db } from '@db';
import { redis } from '../services/redis';
import { version } from '../../package.json';

/**
 * Enhanced health check endpoint handler 
 * Verifies critical service dependencies and returns detailed status
 */
export const healthCheck = async (req: Request, res: Response) => {
  try {
    // Basic server check - if we get here, server is running
    const serverOk = true;
    
    // Check database connection with timeout
    const dbConnected = await Promise.race([
      db.query.users.findFirst().then(() => true).catch(() => false),
      new Promise(resolve => setTimeout(() => resolve(false), 5000))
    ]);

    // Memory usage check with higher threshold for production
    const memoryUsage = process.memoryUsage();
    const memoryThreshold = 2 * 1024 * 1024 * 1024; // 2GB
    const memoryOk = memoryUsage.heapUsed < memoryThreshold;

    // Overall health status - server must be ok
    const isHealthy = serverOk && (process.env.NODE_ENV === 'production' ? dbConnected : true);
    
    const healthStatus = {
      status: isHealthy ? 'ok' : 'degraded',
      version,
      timestamp: new Date().toISOString(),
      checks: {
        database: dbConnected ? 'connected' : 'disconnected',
        memory: {
          status: memoryOk ? 'ok' : 'warning',
          used: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
          total: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB'
        }
      }
    };

    res.status(isHealthy ? 200 : 503).json(healthStatus);
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
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
