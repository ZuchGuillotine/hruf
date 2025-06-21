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
import './config/env';
import { validateEnvVars, loadEnvironmentSecrets } from './config/env';

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
// Vite imports moved to dynamic imports to avoid loading in production
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";
import { db } from '../db';
import cors from 'cors';
import { setupAuthentication } from './auth/setup';
import authRoutes from './auth/routes';
import setupQueryRoutes from './routes/queryRoutes';
import setupSummaryRoutes from './routes/summaryRoutes';
import { setAuthInfo } from './middleware/authMiddleware';
import { handleStripeRedirects } from './middleware/stripeAuthMiddleware';
import { serviceInitializer } from './services/serviceInitializer';
import path from "path";
import stripeRoutes from './routes/stripe';
import adminRoutes from './routes/admin';
import { summaryTaskManager } from './cron/summaryManager';
import { updateTrialStatusesCron } from './cron/updateTrialStatuses';
import { processMissingBiomarkersCron } from './cron/processMissingBiomarkers';
import { healthCheck, livenessCheck, setReadinessCheck } from './utils/healthCheck';
import fs from 'fs';
import { checkAndReprocessBiomarkers } from '../scripts/check-biomarkers';
import logger from './utils/logger';
import { createServer, type Server } from "http";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Add type for custom error
interface CustomError extends Error {
  status?: number;
  statusCode?: number;
  code?: string;
}

// Initialize and start server with proper React app serving
async function initializeAndStart() {
  try {
    console.log('Initializing application...');

    // Load environment secrets in production with proper error handling
    if (process.env.NODE_ENV === 'production') {
      console.log('🚀 Production mode: Loading environment secrets from AWS Secrets Manager...');
      try {
        await loadEnvironmentSecrets();
        console.log('✅ Successfully loaded all environment secrets');
      } catch (error) {
        console.error('❌ Failed to load environment secrets:', error);
        console.log('⚠️ Application will continue with fallback/embedded credentials');
        // Don't crash - let the app start with minimal functionality
      }
    } else {
      console.log('🔧 Development mode: Using local environment variables');
    }

    // Validate required environment variables (with graceful handling)
    try {
      validateEnvVars();
      console.log('Environment validation successful');
      setReadinessCheck('environment', true);
    } catch (error) {
      console.error('Environment validation failed:', error);
      console.log('App will continue with limited functionality - some features may not work');
      // Still mark environment as ready for basic functionality
      setReadinessCheck('environment', true);
    }

    const app = express();

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

    // Test database connection (non-blocking)
    console.log('Testing database connection...');
    db.execute('SELECT 1')
      .then(() => {
        console.log('Database connection successful');
        setReadinessCheck('database', true);
      })
      .catch((error) => {
        console.error('Database connection failed:', error);
        console.log('App will continue without database - some features may be limited');
        // Don't crash - app can still serve static content and basic endpoints
      });

    // Setup authentication (includes session middleware)
    await setupAuthentication(app);

    // Add auth routes
    app.use(authRoutes);

    // Handle Stripe redirects and set auth info
    app.use(handleStripeRedirects);
    app.use(setAuthInfo);

    // Debug middleware to log session info
    app.use((req, res, next) => {
      if (req.path.startsWith('/api') && process.env.NODE_ENV === 'development') {
        console.log('Request to:', req.path, {
          method: req.method,
          sessionID: req.sessionID,
          hasSession: !!req.session,
          isAuthenticated: req.isAuthenticated(),
          userId: req.user?.id,
          timestamp: new Date().toISOString()
        });
      }
      next();
    });

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
    // Basic liveness check - always returns 200 when server is running
    app.get(['/ping', '/api/ping'], (req, res) => {
      return livenessCheck(req, res);
    });
    
    // Full readiness check - checks if services are ready
    app.get(['/health', '/api/health'], (req, res) => {
      return healthCheck(req, res);
    });

    // Setup routes
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

    // Start server
    console.log('Starting server...');
    await startServer(server, app);

    // Initialize background services after server is running (non-blocking)
    process.nextTick(async () => {
      try {
        console.log('Starting background initialization...');

        // Start cron jobs in background (these are fire-and-forget)
        try {
          summaryTaskManager.startDailySummaryTask();
          summaryTaskManager.startWeeklySummaryTask();
          updateTrialStatusesCron.start();
          processMissingBiomarkersCron.start();
          console.log('Cron jobs started successfully');
        } catch (error) {
          console.error('Some cron jobs failed to start:', error);
        }

        // Initialize services after server is running
        try {
          await serviceInitializer.initializeServices();
          console.log('Background services initialized successfully');
          setReadinessCheck('services', true);
        } catch (error) {
          console.error('Background service initialization failed:', error);
          console.log('App will continue with limited functionality');
        }

        // Biomarker processing (optional, can fail without affecting app)
        const SKIP_BIOMARKER_PROCESSING = true; // Temporary flag to isolate SSL issues
        if (!SKIP_BIOMARKER_PROCESSING) {
            try {
                await checkAndReprocessBiomarkers();
                console.log('Biomarker reprocessing completed');
            } catch (error) {
                logger.error('Error in biomarker reprocessing script:', {
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        } else {
            logger.info('Skipping biomarker processing during SSL debugging');
        }
      } catch (error) {
        console.error('Background initialization failed:', error);
        // Don't crash the app - it can still serve basic functionality
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Use port 8080 for App Runner deployment, 3001 for local development
const PORT = process.env.PORT ? parseInt(process.env.PORT) : (process.env.NODE_ENV === 'production' ? 8080 : 3001);
const HOST = '0.0.0.0'; // Required for App Runner deployments

async function startServer(server: Server, app: express.Express) {
  try {
    console.log(`Starting server on ${HOST}:${PORT}`);

    // Setup Vite/static serving BEFORE starting the server
    if (process.env.NODE_ENV !== 'production') {
      console.log('Setting up Vite development server...');
      const { setupVite } = await import('./vite');
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

    server.listen(PORT, HOST, () => {
      console.log(`Server started on ${HOST}:${PORT} (${process.env.NODE_ENV || 'development'} mode)`);
      console.log('Health check endpoints available at /health and /api/health');

      // Log where the static files are expected to be found in production
      if (process.env.NODE_ENV === 'production') {
        const publicPath = path.join(__dirname, '..', 'dist');
        console.log('In production mode, looking for static files at:', publicPath);
        
        if (fs.existsSync(publicPath)) {
          const indexPath = path.join(publicPath, 'index.html');
          if (fs.existsSync(indexPath)) {
            console.log('✅ index.html found at:', indexPath);
          } else {
            console.log('❌ index.html NOT found at:', indexPath);
          }
        }
      }
    });

    // Handle graceful shutdown
    process.on('SIGTERM', () => handleShutdown(server));
    process.on('SIGINT', () => handleShutdown(server));
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
async function handleShutdown(server: Server) {
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

// Export initialization function for startup script
export default initializeAndStart;

// Only auto-start if this file is run directly (not imported)
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeAndStart().catch(console.error);
}