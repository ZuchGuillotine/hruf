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
import { healthCheck } from './utils/healthCheck';
import fs from 'fs';
import { checkAndReprocessBiomarkers } from '../scripts/check-biomarkers';
import logger from './utils/logger';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Remove the immediate "/" route - let Vite/static serving handle the React app

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

// More permissive CORS for development
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow any localhost origin in development
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    
    // Allow the custom domain
    if (process.env.CUSTOM_DOMAIN && origin.includes(process.env.CUSTOM_DOMAIN.replace(/^https?:\/\//, ''))) {
      return callback(null, true);
    }
    
    // Log rejected origins for debugging
    console.log('CORS rejected origin:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['Set-Cookie']
};

app.use(cors(corsOptions));

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

const sessionConfig = {
  secret: sessionSecret || crypto.randomBytes(32).toString('hex'),
  resave: false,
  saveUninitialized: false, // Don't create sessions until something is stored
  store: new MemoryStore({
    checkPeriod: DAY_IN_MS, // Prune expired sessions every 24 hours
    ttl: DAY_IN_MS // Session TTL (time to live)
  }),
  // Cookie settings – automatically loosen for local HTTP development
  cookie: {
    // Use secure cookies only when we are *actually* serving over HTTPS
    secure: false, // will be overwritten below if we detect HTTPS env
    httpOnly: true,
    maxAge: DAY_IN_MS,
    sameSite: 'lax' as 'lax' | 'none',
    path: '/',
    // Ensure cookies work with proxied requests in development
    domain: undefined // Let the browser handle domain automatically
  },
  name: 'stacktracker.sid' // Custom name to avoid default "connect.sid"
};

// Strengthen cookie only if we are confident the *request origin* itself is HTTPS and not localhost.
const customDomainRaw = process.env.CUSTOM_DOMAIN ?? '';
const customDomain = customDomainRaw.replace(/^https?:\/\//, '').replace(/\/$/, '');

const runningOnLocalhost = ['localhost', '127.0.0.1'].some((host) => customDomain.startsWith(host));
const isDevelopment = process.env.NODE_ENV !== 'production';

// CRITICAL: Only use secure cookies when ACTUALLY served over HTTPS
// Check if we're being accessed via HTTPS by looking at the protocol
const isActuallyHttps = process.env.FORCE_HTTPS === 'true' || 
  (customDomain && customDomain.startsWith('https://') && !runningOnLocalhost);

if (isActuallyHttps) {
  sessionConfig.cookie.secure = true;
  sessionConfig.cookie.sameSite = 'none';
} else {
  // For ANY HTTP access (including localhost), disable secure cookies
  sessionConfig.cookie.secure = false;
  sessionConfig.cookie.sameSite = 'lax';
}

// Log session configuration for debugging
console.log('Session Configuration:', {
  environment: process.env.NODE_ENV,
  customDomain,
  runningOnLocalhost,
  cookieSettings: {
    secure: sessionConfig.cookie.secure,
    sameSite: sessionConfig.cookie.sameSite,
    httpOnly: sessionConfig.cookie.httpOnly,
    path: sessionConfig.cookie.path
  },
  timestamp: new Date().toISOString()
});

// Core middleware setup - order is important
app.use(session(sessionConfig));

// Debug middleware to log session info
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    console.log('Request to:', req.path, {
      method: req.method,
      sessionID: req.sessionID,
      hasSession: !!req.session,
      sessionData: req.session,
      cookies: req.headers.cookie,
      timestamp: new Date().toISOString()
    });
  }
  next();
});

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

// Health checks must come before static file handling
// Health check endpoints - excluding root path which should serve React app
app.get(['/health', '/api/health'], (req, res) => {
  return healthCheck(req, res);
});

// Setup routes and error handling
setupQueryRoutes(app);
setupSummaryRoutes(app);
app.use('/api/stripe', stripeRoutes);
app.use('/api/admin', adminRoutes);
const server = registerRoutes(app);

// Global error handling middleware
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


// Initialize and start server with proper React app serving
async function initializeAndStart() {
  try {
    console.log('Initializing application...');

    // Start server first, then setup Vite/static serving
    console.log('Starting server...');
    await startServer();

    // Setup Vite/static serving AFTER server is running
    if (process.env.NODE_ENV !== 'production') {
      console.log('Setting up Vite development server...');
      await setupVite(app, server);
      
      // Also serve the app directly on port 3001 for direct access
      // This ensures the app works when accessed at localhost:3001
      const clientPath = path.join(__dirname, '..', 'client');
      if (fs.existsSync(clientPath)) {
        // Serve the Vite-processed files
        app.get('*', async (req, res, next) => {
          if (req.path.startsWith('/api') || req.path.startsWith('/auth')) {
            return next();
          }
          
          try {
            // For development, redirect to Vite dev server
            if (!req.headers.host?.includes('5173')) {
              console.log('Direct access detected, redirecting to Vite dev server...');
              return res.redirect(`http://localhost:5173${req.path}`);
            }
            next();
          } catch (error) {
            next(error);
          }
        });
      }
    } else {
      console.log('Setting up static file serving...');
      const publicPath = path.join(__dirname, '..', 'dist');
      console.log('Looking for static files at:', publicPath);
      
      if (!fs.existsSync(publicPath)) {
        console.error('Static files directory not found at:', publicPath);
        throw new Error('Static files directory not found');
      }
      
      app.use(express.static(publicPath));
      
      // Serve index.html for all routes not explicitly handled
      app.get('*', (req, res) => {
        const indexPath = path.join(publicPath, 'index.html');
        if (!fs.existsSync(indexPath)) {
          console.error('index.html not found at:', indexPath);
          return res.status(404).send('index.html not found');
        }
        res.sendFile(indexPath);
      });
    }

    // Initialize background services after server is running
    setTimeout(async () => {
      try {
        console.log('Starting background initialization...');

        // Start cron jobs in background
        summaryTaskManager.startDailySummaryTask();
        summaryTaskManager.startWeeklySummaryTask();
        updateTrialStatusesCron.start();
        processMissingBiomarkersCron.start();

        // Initialize services after server is running
        await serviceInitializer.initializeServices();
        console.log('Background initialization completed successfully');

        // Find where checkAndReprocessBiomarkers is called and modify it
        const SKIP_BIOMARKER_PROCESSING = true; // Temporary flag to isolate SSL issues
        if (!SKIP_BIOMARKER_PROCESSING) {
            try {
                await checkAndReprocessBiomarkers();
            } catch (error) {
                logger.error('Error in biomarker reprocessing script:', {
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        } else {
            logger.info('Skipping biomarker processing during SSL debugging');
        }
      } catch (error) {
        console.error('Failed to initialize background services:', error);
      }
    }, 1000);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Use port 3001 for deployment compatibility (mapped to port 80)
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;
const HOST = '0.0.0.0'; // Required for Replit deployments

async function startServer() {
  try {
    console.log(`Starting server on ${HOST}:${PORT}`);

    // Use port 5000 consistently as in successful deployment
    server.listen(PORT, HOST, () => {
      console.log(`Server started on ${HOST}:${PORT} (${process.env.NODE_ENV || 'development'} mode)`);
      console.log('Health check endpoints available at /, /health, and /api/health');

      // Log where the static files are expected to be found in production
      if (process.env.NODE_ENV === 'production') {
        const publicPath = path.join(__dirname, 'public');
        console.log('In production mode, looking for static files at:', publicPath);
        console.log('Current working directory:', process.cwd());
        console.log('__dirname:', __dirname);

        try {
          // Check multiple possible locations
          const possiblePaths = [
            publicPath,
            path.join(__dirname, '..', 'dist', 'server', 'public'),
            path.join(process.cwd(), 'dist', 'server', 'public'),
            path.join(process.cwd(), 'dist', 'public')
          ];

          for (const checkPath of possiblePaths) {
            if (fs.existsSync(checkPath)) {
              console.log(`Found static files at: ${checkPath}`);
              console.log('Contents:', fs.readdirSync(checkPath));

              // Check for index.html specifically
              const indexPath = path.join(checkPath, 'index.html');
              if (fs.existsSync(indexPath)) {
                console.log('✅ index.html found at:', indexPath);
              } else {
                console.log('❌ index.html NOT found at:', indexPath);
              }
            } else {
              console.log(`Static files NOT found at: ${checkPath}`);
            }
          }
        } catch (error) {
          console.error('Error checking static directories:', error);
        }
      }
    });

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