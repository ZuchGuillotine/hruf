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

// Immediate health check responses - must be first
const getHealthResponse = () => ({
  status: "ok",
  service: "StackTracker Health Platform", 
  timestamp: new Date().toISOString(),
  environment: process.env.NODE_ENV || 'production',
  uptime: process.uptime(),
  version: "1.0.0"
});

// Health check endpoints with immediate response
app.get('/health', (req, res) => {
  res.status(200).json(getHealthResponse());
});

app.get('/healthz', (req, res) => {
  res.status(200).json(getHealthResponse());
});

app.get('/health-check', (req, res) => {
  res.status(200).json(getHealthResponse());
});

app.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

app.get('/status', (req, res) => {
  res.status(200).json(getHealthResponse());
});

app.get('/api/health', (req, res) => {
  res.status(200).json(getHealthResponse());
});

app.get('/api/healthz', (req, res) => {
  res.status(200).json(getHealthResponse());
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

// Force production mode for deployment
const IS_PRODUCTION = process.env.NODE_ENV === 'production' || process.env.REPLIT_DEPLOYMENT === 'true';
console.log('Environment check:', {
  NODE_ENV: process.env.NODE_ENV,
  REPLIT_DEPLOYMENT: process.env.REPLIT_DEPLOYMENT,
  IS_PRODUCTION
});

// Setup Vite or static serving based on environment
if (IS_PRODUCTION) {
  // Calculate the correct dist path relative to the compiled server location
  // When compiled, server files are in dist/server/, so we need to go up to dist/
  const distPath = path.join(__dirname, '..');

  console.log('Production mode - serving static files from:', distPath);

  // Serve static files from the dist directory
  app.use(express.static(distPath));

  // Serve public assets
  app.use(express.static(path.join(__dirname, '..', '..', 'client', 'public')));

  // SPA fallback - must be after all other routes
  app.get('*', (req, res) => {
    // Skip API routes
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API route not found' });
    }

    // Check for health check requests
    const userAgent = req.get('User-Agent') || '';
    const acceptHeader = req.get('Accept') || '';
    const isHealthCheck = userAgent.includes('kube-probe') || 
                          userAgent.includes('GoogleHC') || 
                          userAgent.includes('health-check') ||
                          userAgent.includes('HealthCheck') ||
                          userAgent.includes('curl') ||
                          userAgent.includes('Replit') ||
                          (!acceptHeader.includes('text/html') && !acceptHeader.includes('*/*'));

    if (isHealthCheck) {
      return res.status(200).json(getHealthResponse());
    }

    // Serve the index.html for all other routes
    const indexPath = path.join(distPath, 'index.html');
    console.log('Serving index.html from:', indexPath);
    res.sendFile(indexPath);
  });
} else {
  // Development mode - use Vite
  console.log('Development mode - using Vite');
  await setupVite(app, server);
}

// Root endpoint for deployment health checks (after Vite setup)
app.get('/', (req, res) => {
  // Check if this is a health check request
  const userAgent = req.get('User-Agent') || '';
  const acceptHeader = req.get('Accept') || '';
  const isHealthCheck = userAgent.includes('kube-probe') || 
                        userAgent.includes('GoogleHC') || 
                        userAgent.includes('health-check') ||
                        userAgent.includes('HealthCheck') ||
                        userAgent.includes('curl') ||
                        userAgent.includes('Replit') ||
                        (!acceptHeader.includes('text/html') && !acceptHeader.includes('*/*'));

  if (isHealthCheck) {
    return res.status(200).json(getHealthResponse());
  }

  // For production web requests, serve the frontend
  if (IS_PRODUCTION) {
    const indexPath = path.join(__dirname, '..', 'index.html');
    return res.sendFile(indexPath);
  }

  // In development, this should not be reached due to Vite middleware
  // If it is reached, something is wrong with the Vite setup
  console.warn('Root route reached in development mode - this should not happen');
  res.status(500).json({ error: 'Development routing error' });
});

// Initialize services after starting the server
async function initializeAndStart() {
  try {
    // Start server immediately for health checks
    await startServer();

    // Initialize services in background - completely non-blocking
    process.nextTick(async () => {
      try {
        console.log('Starting background service initialization...');
        await serviceInitializer.initializeServices();

        // Start background supplement loading after all services are initialized
        const { supplementService } = await import('./services/supplements.js');
        
        // Use setTimeout to ensure this doesn't block the event loop
        setTimeout(() => {
          supplementService.startBackgroundLoading();
        }, 1000);

        // Start cron jobs only after services are ready
        if (IS_PRODUCTION) {
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
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start server with improved error handling
async function startServer() {
  try {
    const host = '0.0.0.0'; // Always bind to 0.0.0.0 for Replit
    const port = process.env.PORT ? parseInt(process.env.PORT) : 5000;

    console.log('Server startup configuration:', {
      nodeEnv: process.env.NODE_ENV,
      replitDeployment: process.env.REPLIT_DEPLOYMENT,
      port: port,
      host: host,
      isProduction: IS_PRODUCTION
    });

    await new Promise<void>((resolve, reject) => {
      server.listen(port, host, () => {
        console.log(`🚀 Server running on ${host}:${port} (${IS_PRODUCTION ? 'production' : 'development'})`);
        log(`Server started successfully on ${host}:${port}`);
        resolve();
      });
      server.on('error', reject);
    });

    // Handle graceful shutdown
    process.on('SIGTERM', handleShutdown);
    process.on('SIGINT', handleShutdown);

    // Add error handler for server
    server.on('error', (error: any) => {
      console.error('Server error:', {
        message: error.message,
        code: error.code,
        port: error.port,
        timestamp: new Date().toISOString()
      });

      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${error.port} is already in use`);
      }
    });

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
initializeAndStart().catch((error) => {
  console.error('Failed to initialize and start:', error);
  process.exit(1);
});