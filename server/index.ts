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

const sessionConfig = {
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
    sameSite: app.get('env') === 'production' ? 'none' as const : 'lax' as const, // Allow cross-site requests in production with HTTPS
    path: '/'
  },
  name: 'stacktracker.sid' // Custom name to avoid default "connect.sid"
};

// Apply secure cookies only with HTTPS in production
if (app.get('env') === 'production' && sessionConfig.cookie.sameSite === 'none') {
  sessionConfig.cookie.secure = true; // Must be secure if sameSite is none
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


// Serve static files (images)
app.use(express.static(path.join(__dirname, '..', 'client', 'public')));

// Initialize and start server with proper React app serving
async function initializeAndStart() {
  try {
    console.log('Initializing application...');

    // Start server first, then setup Vite/static serving
    console.log('Starting server...');
    await startServer();

    // Setup Vite/static serving AFTER server is running
    if (app.get("env") === "development") {
      console.log('Setting up Vite development server...');
      await setupVite(app, server);
    } else {
      console.log('Setting up static file serving...');
      serveStatic(app);
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
      } catch (error) {
        console.error('Failed to initialize background services:', error);
      }
    }, 1000);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Use consistent port 5000 for deployment compatibility
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5000;
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