import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";
import { db } from '../db';
import cors from 'cors';
import { setupAuth } from './auth';
import setupQueryRoutes from './routes/queryRoutes';
import { setAuthInfo } from './middleware/authMiddleware';
import session from 'express-session';
import createMemoryStore from "memorystore";

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

// Session configuration
const MemoryStore = createMemoryStore(session);
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  store: new MemoryStore({
    checkPeriod: 86400000
  }),
  cookie: {
    secure: app.get('env') === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax',
    path: '/'
  },
  name: 'stacktracker.sid'
};

console.log('Session configuration:', {
  secure: app.get('env') === 'production',
  environment: app.get('env'),
  sessionSecretLength: (process.env.SESSION_SECRET || 'your-secret-key').length,
  timestamp: new Date().toISOString()
});

// Core middleware setup - order is important
app.use(session(sessionConfig));
setupAuth(app);
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

// Setup Vite last
if (app.get("env") === "development") {
  await setupVite(app, server);
} else {
  serveStatic(app);
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
  } catch (err) {
    console.error('Failed to start server:', {
      error: err.message,
      code: err.code,
      timestamp: new Date().toISOString()
    });
    process.exit(1);
  }
}

startServer().catch(console.error);