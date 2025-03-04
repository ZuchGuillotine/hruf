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
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Session configuration
const MemoryStore = createMemoryStore(session);
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  store: new MemoryStore({
    checkPeriod: 86400000
  }),
  cookie: {
    secure: app.get('env') === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
};

// Core middleware setup
app.use(session(sessionConfig));
setupAuth(app);
app.use(setAuthInfo);

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

// API middleware
app.use('/api', (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  next();
});


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

// Setup routes after middleware
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

// Start server
const BASE_PORT = process.env.PORT ? parseInt(process.env.PORT) : 5000;

function startServer(retries = 3) {
  try {
    server.listen(BASE_PORT, "0.0.0.0", () => {
      log(`Server started on port ${BASE_PORT}`);
    });
  } catch (err) {
    if (retries > 0) {
      console.log(`Retrying server start... (${retries} attempts remaining)`);
      setTimeout(() => startServer(retries - 1), 1000);
    } else {
      console.error('Failed to start server:', err);
      process.exit(1);
    }
  }
}

startServer();