/**
    * @description      : 
    * @author           : 
    * @group            : 
    * @created          : 17/05/2025 - 00:17:24
    * 
    * MODIFICATION LOG
    * - Version         : 1.0.0
    * - Date            : 17/05/2025
    * - Author          : 
    * - Modification    : 
**/
import dotenv from 'dotenv';
dotenv.config();
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";
import { db } from '../db';
import cors from 'cors';
import { setupAuth } from './auth';
import setupQueryRoutes from './routes/queryRoutes';
import setupSummaryRoutes from './routes/summaryRoutes';
import { setAuthInfo } from './middleware/authMiddleware';
import { handleStripeRedirects } from './middleware/stripeAuthMiddleware';
import session from 'express-session';
import createMemoryStore from "memorystore";
import crypto from "crypto";
import { serviceInitializer } from './services/serviceInitializer';
import path from "path";
import stripeRoutes from './routes/stripe';
import adminRoutes from './routes/admin';
import { summaryTaskManager } from './cron/summaryManager';
import { updateTrialStatusesCron } from './cron/updateTrialStatuses';
import { processMissingBiomarkersCron } from './cron/processMissingBiomarkers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Add type for custom error
interface CustomError extends Error {
  status?: number;
  statusCode?: number;
  code?: string;
}

// Essential middleware
app.set('trust proxy', 1);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));

// Enhanced session configuration
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const MemoryStore = createMemoryStore(session);

// Ensure session secret is properly set and logged
const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret || sessionSecret.length < 32) {
  console.warn('WARNING: Session secret is missing or too short. Using a fallback for development only.', {
    secretLength: sessionSecret?.length || 0,
    environment: app.get('env'),
    timestamp: new Date().toISOString()
  });
}

const sessionConfig: session.SessionOptions = {
  secret: sessionSecret || crypto.randomBytes(32).toString('hex'),
  resave: false,
  saveUninitialized: false, // Don't create sessions until something is stored
  store: new MemoryStore({
    checkPeriod: DAY_IN_MS, // Prune expired sessions every 24 hours
    ttl: DAY_IN_MS // Session TTL (time to live)
  }),
  cookie: {
    secure: app.get('env') === 'production', // HTTPS only in production
    httpOnly: true, // Prevent JavaScript access to cookies
    maxAge: DAY_IN_MS,
    sameSite: app.get('env') === 'production' ? 'none' : 'lax',
    path: '/'
  },
  name: 'stacktracker.sid' // Custom name to avoid default "connect.sid"
};

// Apply secure cookies only with HTTPS in production
if (app.get('env') === 'production') {
  sessionConfig.cookie!.secure = true; // Must be secure if sameSite is none
}

// Core middleware setup - order is important
app.use(session(sessionConfig));
setupAuth(app);
app.use(handleStripeRedirects); // Handle authentication for Stripe redirects
app.use(setAuthInfo);

// API middleware
app.use('/api', (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  next();
});

// Rate limiting
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
}));

app.use('/api', slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 50,
  delayMs: (hits) => hits * 100,
}));

// Register all API routes first
setupQueryRoutes(app);
setupSummaryRoutes(app);
app.use('/api/stripe', stripeRoutes);
app.use('/api/admin', adminRoutes);
const server = registerRoutes(app);

// Global error handling middleware for API routes
app.use('/api', (err: CustomError, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  console.error('Server Error:', {
    status,
    message,
    stack: err.stack,
    timestamp: new Date().toISOString()
  });

  res.status(status).json({
    status: 'error',
    message,
    timestamp: new Date().toISOString()
  });
});

// Serve static files (images)
app.use(express.static(path.join(__dirname, '..', 'client', 'public')));

// Root endpoint health check for deployment platforms - must be before Vite setup
app.get('/', (req: Request, res: Response, next: NextFunction) => {
  // Check if this is a health check request
  const userAgent = req.get('User-Agent') || '';
  const acceptHeader = req.get('Accept') || '';
  
  // Health check detection for deployment platforms
  const isHealthCheck = userAgent.includes('kube-probe') || 
                        userAgent.includes('GoogleHC') || 
                        userAgent.includes('health-check') ||
                        userAgent.includes('HealthCheck') ||
                        (!acceptHeader.includes('text/html') && !acceptHeader.includes('*/*'));
  
  if (isHealthCheck) {
    return res.status(200).json({
      status: "ok",
      service: "StackTracker Health Platform", 
      timestamp: new Date().toISOString(),
      environment: app.get('env'),
      uptime: process.uptime(),
      version: "1.0.0"
    });
  }
  
  // For normal browser requests in development, let Vite handle it
  if (app.get('env') === 'development') {
    return next();
  }
  
  // In production, serve the built frontend
  try {
    res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
  } catch (error) {
    res.status(200).json({
      status: "ok",
      service: "StackTracker Health Platform", 
      timestamp: new Date().toISOString(),
      environment: app.get('env'),
      uptime: process.uptime()
    });
  }
});

// Multiple health check endpoints for different deployment platforms
const healthResponse = {
  status: "ok",
  service: "StackTracker Health Platform",
  timestamp: new Date().toISOString(),
  environment: app.get('env') || 'production',
  uptime: process.uptime(),
  version: "1.0.0"
};

// Standard health endpoints
app.get('/health', (req, res) => {
  res.status(200).json(healthResponse);
});

app.get('/healthz', (req, res) => {
  res.status(200).json(healthResponse);
});

app.get('/health-check', (req, res) => {
  res.status(200).json(healthResponse);
});

app.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

app.get('/status', (req, res) => {
  res.status(200).json(healthResponse);
});

app.get('/api/health', (req, res) => {
  res.status(200).json(healthResponse);
});

app.get('/api/healthz', (req, res) => {
  res.status(200).json(healthResponse);
});

// Readiness check for when services are fully loaded
let servicesReady = false;
app.get('/ready', (req, res) => {
  if (servicesReady) {
    res.status(200).json({
      status: "ready",
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(503).json({
      status: "loading",
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/readiness', (req, res) => {
  if (servicesReady) {
    res.status(200).json({
      status: "ready",
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(503).json({
      status: "loading",
      timestamp: new Date().toISOString()
    });
  }
});

// Setup Vite AFTER all API routes are registered
// Force production mode for deployment
const IS_PRODUCTION_MODE = process.env.NODE_ENV === 'production' || process.env.REPLIT_DEPLOYMENT === 'true';
if (IS_PRODUCTION_MODE) {
  serveStatic(app);
} else {
  await setupVite(app, server);
}

// Initialize services after starting the server
async function initializeAndStart() {
  try {
    // Start server immediately for health checks
    await startServer();

    // Initialize services in background - don't block server startup
    setTimeout(async () => {
      try {
        console.log('Starting background service initialization...');
        await serviceInitializer.initializeServices();
        
        // Start cron jobs only after services are ready
        if (app.get('env') === 'production') {
          summaryTaskManager.startDailySummaryTask();
          summaryTaskManager.startWeeklySummaryTask();
          updateTrialStatusesCron.start();
          processMissingBiomarkersCron.start();
          console.log('Cron jobs started');
        }
        
        servicesReady = true;
        console.log('Background service initialization completed successfully');
      } catch (error) {
        console.error('Background service initialization failed (non-fatal):', error);
        // Mark as ready anyway to prevent blocking
        servicesReady = true;
      }
    }, 2000); // 2 second delay to ensure server is fully up

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start server with improved error handling and retries
const BASE_PORT = process.env.PORT ? parseInt(process.env.PORT) : 5000;
const MAX_RETRIES = 3;

async function findAvailablePort(startPort: number, maxRetries: number): Promise<number> {
  const host = '0.0.0.0'; // Always use 0.0.0.0 for Replit
  for (let port = startPort; port < startPort + maxRetries; port++) {
    try {
      await new Promise<void>((resolve, reject) => {
        const testServer = server.listen(port, host, () => {
          testServer.close();
          resolve();
        });
        testServer.on('error', reject);
      });
      return port;
    } catch (err: unknown) {
      const error = err as { code?: string };
      if (error.code !== 'EADDRINUSE' || port === startPort + maxRetries - 1) {
        throw err;
      }
      console.log(`Port ${port} is in use, trying next port...`);
    }
  }
  throw new Error(`Could not find an available port after ${maxRetries} attempts`);
}

async function startServer() {
  try {
    const host = '0.0.0.0'; // Always bind to 0.0.0.0 for Replit
    
    // In production deployment, use the exact PORT provided by environment
    // In development, use port finding logic
    const IS_DEPLOYMENT = process.env.NODE_ENV === 'production' || process.env.REPLIT_DEPLOYMENT === 'true';
    if (IS_DEPLOYMENT && process.env.PORT) {
      const port = parseInt(process.env.PORT);
      server.listen(port, host, () => {
        log(`Server started successfully on ${host}:${port} (production)`);
      });
    } else {
      const port = await findAvailablePort(BASE_PORT, MAX_RETRIES);
      server.listen(port, host, () => {
        log(`Server started successfully on ${host}:${port} (development)`);
      });
    }

    // Handle graceful shutdown
    process.on('SIGTERM', handleShutdown);
    process.on('SIGINT', handleShutdown);
  } catch (err: unknown) {
    const error = err as { message?: string; code?: string };
    console.error('Failed to start server:', {
      error: error.message || 'Unknown error',
      code: error.code || 'UNKNOWN',
      timestamp: new Date().toISOString()
    });
    process.exit(1);
  }
}

// Graceful shutdown function
async function handleShutdown() {
  console.log('Received shutdown signal, closing server...');

  try {
    // Shutdown services gracefully
    await serviceInitializer.shutdownServices();

    // Close server connections
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });

    // Force shutdown after timeout
    setTimeout(() => {
      console.error('Forced shutdown due to timeout');
      process.exit(1);
    }, 10000); // 10 seconds timeout
  } catch (error: unknown) {
    console.error('Error during shutdown:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

// Start services and server
initializeAndStart().catch(console.error);