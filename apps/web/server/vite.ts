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

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        __dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(`src="/src/main.tsx"`, `src="/src/main.tsx?v=${nanoid()}"`)
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // Try multiple possible static file locations
  const possiblePaths = [
    path.resolve(__dirname, "public"),
    path.resolve(__dirname, "..", "dist", "public"),
    path.resolve(process.cwd(), "dist", "public"),
    path.resolve(process.cwd(), "dist")
  ];
  
  let distPath = null;
  
  // Find the first existing path
  for (const checkPath of possiblePaths) {
    console.log("Checking for static files at:", checkPath);
    if (fs.existsSync(checkPath)) {
      const indexPath = path.join(checkPath, "index.html");
      if (fs.existsSync(indexPath)) {
        distPath = checkPath;
        console.log("✅ Found static files with index.html at:", distPath);
        break;
      } else {
        console.log("❌ No index.html found at:", checkPath);
      }
    } else {
      console.log("❌ Directory doesn't exist:", checkPath);
    }
  }

  if (!distPath) {
    console.error("❌ No valid static file directory found!");
    console.error("Searched paths:", possiblePaths);
    console.error("Current working directory:", process.cwd());
    console.error("__dirname:", __dirname);
    
    // List contents of potential directories for debugging
    for (const checkPath of possiblePaths) {
      try {
        const parentDir = path.dirname(checkPath);
        if (fs.existsSync(parentDir)) {
          console.error(`Contents of ${parentDir}:`, fs.readdirSync(parentDir));
        }
      } catch (error) {
        console.error(`Error reading ${checkPath}:`, error);
      }
    }
    
    throw new Error("Could not find the build directory with index.html");
  }

  console.log("✅ Using static files from:", distPath);
  console.log("Static directory contents:", fs.readdirSync(distPath));
  
  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    const indexPath = path.resolve(distPath, "index.html");
    console.log("Serving index.html from:", indexPath);
    
    if (!fs.existsSync(indexPath)) {
      console.error("index.html not found at:", indexPath);
      return res.status(404).send("index.html not found");
    }
    
    res.sendFile(indexPath);
  });
}
