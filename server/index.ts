import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
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

const app = express();

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
    sameSite: app.get('env') === 'production' ? 'none' : 'lax', // Allow cross-site requests in production with HTTPS
    path: '/'
  },
  name: 'stacktracker.sid' // Custom name to avoid default "connect.sid"
};

// Apply secure cookies only with HTTPS in production
if (app.get('env') === 'production' && sessionConfig.cookie.sameSite === 'none') {
  sessionConfig.cookie.secure = true; // Must be secure if sameSite is none
}

// Log session configuration (excluding secret)
console.log('Session configuration:', {
  environment: app.get('env'),
  secureCookies: sessionConfig.cookie.secure,
  sameSite: sessionConfig.cookie.sameSite,
  cookieMaxAge: sessionConfig.cookie.maxAge,
  sessionTTL: sessionConfig.store.ttl,
  timestamp: new Date().toISOString()
});

console.log('Session configuration:', {
  secure: app.get('env') === 'production',
  environment: app.get('env'),
  sessionSecretLength: (process.env.SESSION_SECRET || 'your-secret-key').length,
  timestamp: new Date().toISOString()
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

// Setup routes and error handling
setupQueryRoutes(app);
setupSummaryRoutes(app);
app.use('/api/stripe', stripeRoutes);
app.use('/api/admin', adminRoutes);
const server = registerRoutes(app);

// Global error handling middleware
app.use('/api', (err: any, _req: Request, res: Response, _next: NextFunction) => {
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

// Setup Vite last
if (app.get("env") === "development") {
  await setupVite(app, server);
} else {
  serveStatic(app);
}

// Initialize services before starting the server
async function initializeAndStart() {
  try {
    // Initialize our services
    await serviceInitializer.initializeServices();
    console.log('Services initialized successfully');

    // Start server with improved error handling and retries
    await startServer();
  } catch (error) {
    console.error('Failed to initialize services:', error);
    // Start server anyway, with reduced capabilities
    await startServer();
  }
}

// Start server with improved error handling and retries
const BASE_PORT = process.env.PORT ? parseInt(process.env.PORT) : 5000;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

async function findAvailablePort(startPort: number, maxRetries: number): Promise<number> {
  for (let port = startPort; port < startPort + maxRetries; port++) {
    try {
      await new Promise((resolve, reject) => {
        const testServer = server.listen(port, "0.0.0.0", () => {
          testServer.close();
          resolve(port);
        });
        testServer.on('error', reject);
      });
      return port;
    } catch (err) {
      if (err.code !== 'EADDRINUSE' || port === startPort + maxRetries - 1) {
        throw err;
      }
      console.log(`Port ${port} is in use, trying next port...`);
    }
  }
  throw new Error(`Could not find an available port after ${maxRetries} attempts`);
}

async function startServer() {
  try {
    const port = await findAvailablePort(BASE_PORT, MAX_RETRIES);
    server.listen(port, "0.0.0.0", () => {
      log(`Server started successfully on port ${port}`);
    });

    // Handle graceful shutdown
    process.on('SIGTERM', handleShutdown);
    process.on('SIGINT', handleShutdown);
  } catch (err) {
    console.error('Failed to start server:', {
      error: err.message,
      code: err.code,
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
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
}

// Start services and server
initializeAndStart().catch(console.error);