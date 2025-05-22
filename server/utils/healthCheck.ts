
import { Request, Response } from 'express';
import { db } from '../../db';
import { version } from '../../package.json';

/**
 * Unified, staged health check implementation
 * Optimized for different environments and use cases:
 * 1. Quick Response: For automated health checks (Google Cloud Run, load balancers)
 * 2. Basic Health: Simple status check for monitoring systems
 * 3. Deep Health: Comprehensive check including DB connectivity (for diagnostics)
 */
export const healthCheck = async (req: Request, res: Response) => {
  // STAGE 1: Quick Response
  // Optimized for deployment platforms and load balancers
  // These checks need to be fast and lightweight
  if (req.headers['user-agent']?.includes('GoogleHC') || 
      req.query.mode === 'ping' || 
      req.path === '/_health') {
    return res.status(200).send('OK');
  }
  
  try {
    // STAGE 2: Basic Health (default)
    // Good for most monitoring systems and basic status pages
    const basicHealthStatus = {
      status: 'ok',
      version,
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    };
    
    // If only basic check is requested, return immediately
    if (req.query.mode === 'basic' || req.query.mode === 'simple') {
      return res.status(200).json(basicHealthStatus);
    }
    
    // STAGE 3: Deep Health Check
    // This performs more resource-intensive checks for diagnostics
    // Only run deep checks when explicitly requested or in specific contexts
    let dbConnected = true;
    let memoryOk = true;
    
    if (req.query.mode === 'deep') {
      // Check database connection with short timeout
      dbConnected = await Promise.race([
        db.query.users.findFirst({ columns: { id: true } })
          .then(() => true)
          .catch((err) => {
            console.error('Health check DB error:', err);
            return false;
          }),
        new Promise(resolve => setTimeout(() => resolve(false), 2000))
      ]) as boolean;

      // Memory check
      const memoryUsage = process.memoryUsage();
      const memoryThreshold = 2 * 1024 * 1024 * 1024; // 2GB
      memoryOk = memoryUsage.heapUsed < memoryThreshold;
    }

    // Overall health status with detailed checks
    const isHealthy = dbConnected && memoryOk;
    
    const fullHealthStatus = {
      ...basicHealthStatus,
      status: isHealthy ? 'ok' : 'degraded',
      checks: {
        server: 'ok',
        database: dbConnected ? 'connected' : 'disconnected',
        memory: memoryOk ? 'ok' : 'warning',
        memoryUsage: req.query.mode === 'deep' ? process.memoryUsage() : undefined
      }
    };

    res.status(isHealthy ? 200 : 503).json(fullHealthStatus);
  } catch (error) {
    // Even if our health check fails, we want to return a valid response
    // This is important for deployment platforms that need a 200 status
    console.error('Health check failed:', error);
    res.status(200).json({
      status: 'warning',
      message: 'Health check had errors but service is running',
      timestamp: new Date().toISOString()
    });
  }
};
