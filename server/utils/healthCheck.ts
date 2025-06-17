import { Request, Response } from 'express';

// Track application readiness state
let isApplicationReady = false;
let readinessChecks: { [key: string]: boolean } = {
  database: false,
  environment: false,
  services: false
};

export function setReadinessCheck(service: string, ready: boolean) {
  readinessChecks[service] = ready;
  
  // Update overall readiness - all critical services must be ready
  isApplicationReady = readinessChecks.database && 
                      readinessChecks.environment && 
                      readinessChecks.services;
  
  console.log(`Readiness check ${service}: ${ready ? 'READY' : 'NOT READY'}`);
  console.log(`Overall application ready: ${isApplicationReady}`);
}

export function healthCheck(req: Request, res: Response) {
  const uptime = process.uptime();
  
  // During startup phase (first 3 minutes), return detailed status
  const isStartupPhase = uptime < 180;
  
  const healthData = {
    status: isApplicationReady ? 'ready' : (isStartupPhase ? 'starting' : 'unhealthy'),
    timestamp: new Date().toISOString(),
    uptime: uptime,
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || '5000',
    checks: readinessChecks,
    ready: isApplicationReady
  };

  // Log health check for debugging deployment issues
  if (process.env.NODE_ENV === 'production') {
    console.log('Health check accessed:', {
      url: req.url,
      method: req.method,
      status: healthData.status,
      ready: isApplicationReady,
      uptime: uptime,
      timestamp: new Date().toISOString()
    });
  }

  // Return appropriate HTTP status
  if (isApplicationReady) {
    return res.status(200).json(healthData);
  } else if (isStartupPhase) {
    // During startup, return 503 Service Unavailable but with retry info
    return res.status(503).json({
      ...healthData,
      message: 'Application is starting up, please retry in a few moments'
    });
  } else {
    // After startup window, something is wrong
    return res.status(503).json({
      ...healthData,
      message: 'Application failed to initialize properly'
    });
  }
}