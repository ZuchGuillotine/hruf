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

// Detect deployment mode and set NODE_ENV immediately
const isDeploymentMode = process.env.REPLIT_DEPLOYMENT === 'true' || 
                         process.env.REPLIT_DEPLOYMENT === '1' ||
                         process.env.RAILWAY_ENVIRONMENT === 'production' ||
                         process.env.VERCEL === '1' ||
                         process.env.NETLIFY === 'true';

// Force NODE_ENV to production during deployment BEFORE any imports
if (isDeploymentMode || !process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
  console.log('Set NODE_ENV to production for deployment');
}

console.log('Deployment mode check at startup:', {
  REPLIT_DEPLOYMENT: process.env.REPLIT_DEPLOYMENT,
  NODE_ENV: process.env.NODE_ENV,
  isDeploymentMode
});
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
import path from "path";
import stripeRoutes from './routes/stripe';
import adminRoutes from './routes/admin';

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

// HEALTH CHECK ENDPOINTS - specific paths only
// These endpoints respond immediately without any service dependencies
app.get('/health', (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime())
  });
});

app.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

app.get('/ready', (req, res) => {
  res.status(200).json({
    status: "ready",
    timestamp: new Date().toISOString()
  });
});

app.get('/readiness', (req, res) => {
  res.status(200).json({
    status: "ready",
    timestamp: new Date().toISOString()
  });
});

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
// Check for various deployment indicators
const isDeployment = process.env.REPLIT_DEPLOYMENT === 'true' || 
                     process.env.REPLIT_DEPLOYMENT === '1' ||
                     process.env.RAILWAY_ENVIRONMENT === 'production' ||
                     process.env.VERCEL === '1' ||
                     process.env.NETLIFY === 'true' ||
                     process.env.NODE_ENV === 'production';

if (!process.env.NODE_ENV && isDeployment) {
  process.env.NODE_ENV = 'production';
  console.log('Set NODE_ENV to production for deployment');
} else if (isDeployment && process.env.NODE_ENV !== 'production') {
  process.env.NODE_ENV = 'production';
  console.log('Forced NODE_ENV to production for deployment');
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

// Static file serving and SPA setup based on environment

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

  // SPA fallback for frontend routes only (excluding API and health check routes)
  app.get('*', (req, res) => {
    // Skip API routes - these should return 404 if not found
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API route not found' });
    }

    // Health check routes are already handled above, so they won't reach here
    // Serve the index.html for all other SPA routes
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



// Start server with simplified startup for fast health checks
async function startServer() {
  const host = '0.0.0.0';
  const port = process.env.PORT ? parseInt(process.env.PORT) : 5000;

  console.log(`Starting server on ${host}:${port}`);

  return new Promise<void>((resolve, reject) => {
    server.listen(port, host, () => {
      console.log(`Server running on ${host}:${port}`);
      resolve();
    });
    server.on('error', reject);
  });
}

// Graceful shutdown function
async function handleShutdown() {
  console.log('Received shutdown signal, closing server...');

  try {
    // Shutdown services gracefully only if they were initialized
    try {
      const { serviceInitializer } = await import('./services/serviceInitializer');
      await serviceInitializer.shutdownServices();
    } catch (error) {
      console.log('Service initializer not loaded, skipping service shutdown');
    }

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

// Start server immediately for fast health check responses
startServer()
  .then(() => {
    console.log('Server started successfully, health checks are now available');
    
    // Add graceful shutdown handlers
    process.on('SIGTERM', handleShutdown);
    process.on('SIGINT', handleShutdown);
    
    // Initialize services in background only in development mode
    const isDeployment = process.env.REPLIT_DEPLOYMENT === 'true' || 
                        process.env.NODE_ENV === 'production';
    
    if (!isDeployment) {
      // Only initialize services in development after a delay
      setTimeout(async () => {
        try {
          const { serviceInitializer } = await import('./services/serviceInitializer');
          await serviceInitializer.initializeServices();
          console.log('Background services initialized');
        } catch (error) {
          console.log('Background service initialization skipped:', error instanceof Error ? error.message : 'Unknown error');
        }
      }, 1000);
    } else {
      console.log('Deployment mode - skipping service initialization for faster startup');
    }
  })
  .catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });