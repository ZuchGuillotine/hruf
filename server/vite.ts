/**
    * @description      : 
    * @author           : 
    * @group            : 
    * @created          : 13/06/2025 - 14:03:08
    * 
    * MODIFICATION LOG
    * - Version         : 1.0.0
    * - Date            : 13/06/2025
    * - Author          : 
    * - Modification    : 
**/
import express, { type Express } from "express";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer, createLogger } from "vite";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: {
      middlewareMode: true,
      allowedHosts: [".replit.dev"], 
      hmr: { server },
    },
    appType: "custom",
  });

  // Serve static files from the public directory
  app.use(express.static(path.resolve(vite.config.root, 'public')));

  app.use(vite.middlewares);

  // Fallback to client-side routing
  app.use("*", async (req, res, next) => {
    // Let API routes pass through
    if (req.originalUrl.startsWith("/api")) {
      return next();
    }

    try {
      // Resolve the path to the root index.html file
      const clientTemplate = path.resolve(vite.config.root, "index.html");

      // Read the template file from disk
      let template = await fs.promises.readFile(clientTemplate, "utf-8");

      // Apply Vite's HTML transformations, including HMR client
      template = await vite.transformIndexHtml(req.originalUrl, template);

      // Send the transformed HTML back to the client
      res.status(200).set({ "Content-Type": "text/html" }).end(template);
    } catch (e) {
      // If an error occurs, pass it to the Vite error middleware
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, '..', 'dist');
  console.log('Serving static files from:', distPath);

  app.use(express.static(distPath));

  // Fallback for client-side routing in production
  app.get('*', (req, res) => {
    // Let API routes pass through
    if (req.originalUrl.startsWith('/api')) {
      return res.status(404).json({ error: 'Not Found' });
    }
    res.sendFile(path.resolve(distPath, 'index.html'));
  });
}
