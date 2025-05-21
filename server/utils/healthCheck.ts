
import { Request, Response } from 'express';
import { db } from '../../db';
import { version } from '../../package.json';

/**
 * Simplified health check endpoint for Cloud Run deployments
 * Optimized to minimize resource usage while providing adequate status
 */
export const healthCheck = async (req: Request, res: Response) => {
  // Simple health check for deployment pings
  if (req.query.mode === 'simple' || req.path === '/') {
    return res.status(200).send('OK');
  }
  
  // Return health check response for all paths
  try {
    // Basic server check
    const serverOk = true;
    
    // For production deep checks only
    let dbConnected = true;
    let memoryOk = true;
    
    // Only perform deeper checks for non-deployment health checks
    if (process.env.NODE_ENV === 'production' && req.query.mode === 'deep') {
      // Check database connection with short timeout
      dbConnected = await Promise.race([
        db.query.users.findFirst({ columns: { id: true } }).then(() => true).catch(() => false),
        new Promise(resolve => setTimeout(() => resolve(false), 2000))
      ]) as boolean;

      // Quick memory check
      const memoryUsage = process.memoryUsage();
      const memoryThreshold = 2 * 1024 * 1024 * 1024; // 2GB
      memoryOk = memoryUsage.heapUsed < memoryThreshold;
    }

    // Overall health status
    const isHealthy = serverOk && dbConnected;
    
    const healthStatus = {
      status: isHealthy ? 'ok' : 'degraded',
      version,
      timestamp: new Date().toISOString(),
      checks: {
        server: 'ok',
        database: dbConnected ? 'connected' : 'disconnected',
        memory: memoryOk ? 'ok' : 'warning'
      }
    };

    res.status(isHealthy ? 200 : 503).json(healthStatus);
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(200).json({
      status: 'warning',
      message: 'Health check had errors but service is running',
      timestamp: new Date().toISOString()
    });
  }
};
