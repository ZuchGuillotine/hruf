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

// Set NODE_ENV to production if not already set and we're in deployment mode
if (!process.env.NODE_ENV && (
  process.env.REPLIT_DEPLOYMENT === 'true' ||
  process.env.RAILWAY_ENVIRONMENT === 'production' ||
  process.env.VERCEL === '1' ||
  process.env.NETLIFY === 'true' ||
  !process.env.REPL_SLUG
)) {
  process.env.NODE_ENV = 'production';
  console.log('Set NODE_ENV to production for deployment');
}

// Force production mode for deployment - be more aggressive about detecting deployment
const IS_PRODUCTION = process.env.NODE_ENV === 'production' || 
                      process.env.REPLIT_DEPLOYMENT === 'true' ||
                      process.env.RAILWAY_ENVIRONMENT === 'production' ||
                      process.env.VERCEL === '1' ||
                      process.env.NETLIFY === 'true' ||
                      !process.env.REPL_SLUG || // If not in Replit dev environment, assume production
                      process.argv.includes('--production') ||
                      process.env.PORT !== undefined; // If PORT is set externally, likely production

console.log('Environment check:', {
  NODE_ENV: process.env.NODE_ENV,
  REPLIT_DEPLOYMENT: process.env.REPLIT_DEPLOYMENT,
  REPL_SLUG: process.env.REPL_SLUG,
  IS_PRODUCTION
});

// Enhanced health check responses for deployment - immediate response without any service dependencies
const getHealthResponse = () => ({
  status: "healthy",
  timestamp: new Date().toISOString(),
  uptime: process.uptime(),
  environment: process.env.NODE_ENV || 'development',
  version: "1.0.0"
});

// Setup Vite or static serving based on environment FIRST
// Health check endpoints FIRST - before any other routing
// These endpoints respond immediately without any service dependencies
app.get('/', (req, res) => {
  res.status(200).json(getHealthResponse());
});

app.get('/health', (req, res) => {
  res.status(200).json(getHealthResponse());
});

app.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

app.get('/ready', (req, res) => {
  res.status(200).json({
    status: "ready",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/readiness', (req, res) => {
  res.status(200).json({
    status: "ready", 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

if (IS_PRODUCTION) {
  // Calculate the correct dist path relative to the compiled server location
  // When compiled, server files are in dist/server/, so we need to go up to dist/
  const distPath = path.join(__dirname, '..');

  console.log('Production mode - serving static files from:', distPath);

  // Serve static files from the dist directory (but not index.html)
  app.use(express.static(distPath, { index: false }));

  // Serve public assets
  app.use(express.static(path.join(__dirname, '..', '..', 'client', 'public')));

  // Frontend route - serve index.html for the frontend app
  app.get('/app', (req, res) => {
    const indexPath = path.join(distPath, 'index.html');
    res.sendFile(indexPath, (err) => {
      if (err) {
        console.error('Error serving index.html:', err);
        res.status(500).json({ error: 'Failed to load application' });
      }
    });
  });

  // SPA fallback for all other non-API routes
  app.get('*', (req, res) => {
    // Skip API routes and health check routes
    if (req.path.startsWith('/api/') || 
        req.path === '/health' || 
        req.path === '/ping' || 
        req.path === '/ready' || 
        req.path === '/readiness' ||
        req.path === '/') {
      return res.status(404).json({ error: 'Route not found' });
    }

    // Serve the index.html for SPA routes
    const indexPath = path.join(distPath, 'index.html');
    res.sendFile(indexPath, (err) => {
      if (err) {
        console.error('Error serving SPA fallback:', err);
        res.status(500).json({ error: 'Failed to load application' });
      }
    });
  });
} else {
  // Development mode - use Vite
  console.log('Development mode - using Vite');
  await setupVite(app, server);
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

// Start server first, then initialize services in background
startServerFirst().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

// New function to start server immediately for health checks
async function startServerFirst() {
  try {
    // Start server immediately for health checks
    await startServer();

    console.log('Server started successfully, health checks are now available');

    // Check if we're in deployment mode and skip service initialization for faster health checks
    const isDeploymentMode = process.env.REPLIT_DEPLOYMENT === 'true' || 
                             process.env.RAILWAY_ENVIRONMENT === 'production' ||
                             process.env.VERCEL === '1' ||
                             process.env.NETLIFY === 'true';

    if (isDeploymentMode) {
      console.log('Deployment mode detected - skipping all service initialization for faster health checks');
    } else {
      // Initialize services in background after server is ready (only in non-deployment mode)
      // Reduced delay from 15 seconds to 2 seconds to prevent health check timeouts
      setTimeout(async () => {
        try {
          console.log('Starting background service initialization...');
          await serviceInitializer.initializeServices();

          // Supplement service is now lazy-loaded on first use
          console.log('Supplement service configured for lazy loading');

          // Start cron jobs only after services are ready and only in production
          console.log('Background service initialization completed successfully');
        } catch (error) {
          console.error('Background service initialization failed (non-fatal):', error);
          // Don't let background initialization failures affect server operation
        }
      }, 2000); // Reduced delay from 15000ms to 2000ms to prevent health check timeouts
    }

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}