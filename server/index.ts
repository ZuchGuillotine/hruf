import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";
import { db } from '../db';
import cors from 'cors';
import setupQueryRoutes from './routes/queryRoutes';
import { setAuthInfo } from './middleware/authMiddleware';

const app = express();
app.use(cors({
  origin: process.env.ADMIN_APP_URL,
  credentials: true
}));

// Trust first proxy
app.set('trust proxy', 1);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later",
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

// DDoS protection
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // allow 50 requests per 15 minutes, then...
  delayMs: (hits) => hits * 100, // begin adding 100ms of delay per hit
});

// Body parsing middleware must be before route registration
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Make sure this is applied AFTER passport initialization in auth.ts
// but before any routes that need authentication
app.use((req, res, next) => {
  // Debug session and auth state
  console.log('Request auth state:', {
    path: req.path,
    hasSession: !!req.session,
    isAuthenticated: req.isAuthenticated?.() || false,
    hasUser: !!req.user,
    timestamp: new Date().toISOString()
  });
  next();
});

// Apply authentication middleware to all routes
app.use(setAuthInfo);

// API routes should be handled before static files
app.use('/api', (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  next();
});

// Apply rate limiting to API routes
app.use('/api', limiter);
app.use('/api', speedLimiter);

// API request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Initialize cron jobs
  const summarizeChatsModule = await import('./cron/summarizeChats.js');
  const { runChatSummarization } = summarizeChatsModule;

  // Run chat summarization every 24 hours
  setInterval(async () => {
    console.log('Starting scheduled chat summarization...');
    try {
      await runChatSummarization();
    } catch (error) {
      console.error('Failed to run chat summarization:', error);
    }
  }, 24 * 60 * 60 * 1000);

  // Direct RDS connection - no IP monitor needed

  // Create the HTTP server and register API routes first
  setupQueryRoutes(app); // Added this line
  const server = registerRoutes(app);

  // Global error handling middleware for API routes
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

  // Setup Vite last, after all API routes are registered
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const BASE_PORT = process.env.PORT ? parseInt(process.env.PORT) : 5000;
  const MAX_PORT_ATTEMPTS = 10;

  const tryPort = async (port: number): Promise<number> => {
    try {
      await new Promise((resolve, reject) => {
        server.listen(port, "0.0.0.0")
          .once('listening', () => {
            server.removeListener('error', reject);
            resolve(port);
          })
          .once('error', (err: NodeJS.ErrnoException) => {
            server.removeListener('listening', resolve);
            if (err.code === 'EADDRINUSE') {
              reject(err);
            } else {
              reject(err);
            }
          });
      });
      return port;
    } catch (err) {
      if (port - BASE_PORT >= MAX_PORT_ATTEMPTS) {
        throw new Error('No available ports found');
      }
      return tryPort(port + 1);
    }
  };

  try {
    const port = await tryPort(BASE_PORT);
    log(`serving on port ${port}`);
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
})();