import type { Request, Response, Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { chatWithAI } from "./openai";
import { db } from "@db";
import { supplements, supplementLogs, supplementReference } from "@db/schema";
import { eq, and, ilike } from "drizzle-orm";
import { supplementService } from "./services/supplements";

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Middleware to check authentication
  const requireAuth = (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Authentication required");
    }
    next();
  };

  // Middleware to check admin role
  const requireAdmin = (req: Request, res: Response, next: Function) => {
    if (!req.user?.isAdmin) {
      return res.status(403).send("Admin access required");
    }
    next();
  };

  // Admin endpoints
  app.get("/api/admin/supplements", requireAuth, requireAdmin, async (req, res) => {
    try {
      const supplements = await db
        .select()
        .from(supplementReference)
        .orderBy(supplementReference.name);
      res.json(supplements);
    } catch (error) {
      console.error("Error fetching supplement reference data:", error);
      res.status(500).send("Failed to fetch supplement reference data");
    }
  });

  app.post("/api/admin/supplements", requireAuth, requireAdmin, async (req, res) => {
    try {
      const [newSupplement] = await db
        .insert(supplementReference)
        .values(req.body)
        .returning();

      // Reinitialize the supplement service to include the new supplement
      await supplementService.initialize();

      res.json(newSupplement);
    } catch (error) {
      console.error("Error creating supplement reference:", error);
      res.status(500).send("Failed to create supplement reference");
    }
  });

  // Chat endpoint
  app.post("/api/chat", requireAuth, async (req, res) => {
    try {
      const { messages } = req.body;

      if (!Array.isArray(messages)) {
        return res.status(400).send("Messages must be an array");
      }

      const response = await chatWithAI(messages);
      res.json(response);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Supplements CRUD
  app.get("/api/supplements", requireAuth, async (req, res) => {
    try {
      const userSupplements = await db
        .select()
        .from(supplements)
        .where(eq(supplements.userId, req.user!.id));
      res.json(userSupplements);
    } catch (error) {
      res.status(500).send("Failed to fetch supplements");
    }
  });

  app.post("/api/supplements", requireAuth, async (req, res) => {
    try {
      const [newSupplement] = await db
        .insert(supplements)
        .values({
          ...req.body,
          userId: req.user!.id,
        })
        .returning();
      res.json(newSupplement);
    } catch (error) {
      res.status(500).send("Failed to create supplement");
    }
  });

  app.put("/api/supplements/:id", requireAuth, async (req, res) => {
    try {
      const [updated] = await db
        .update(supplements)
        .set(req.body)
        .where(
          and(
            eq(supplements.id, parseInt(req.params.id)),
            eq(supplements.userId, req.user!.id)
          )
        )
        .returning();

      if (!updated) {
        return res.status(404).send("Supplement not found");
      }

      res.json(updated);
    } catch (error) {
      res.status(500).send("Failed to update supplement");
    }
  });

  app.delete("/api/supplements/:id", requireAuth, async (req, res) => {
    try {
      const [deleted] = await db
        .delete(supplements)
        .where(
          and(
            eq(supplements.id, parseInt(req.params.id)),
            eq(supplements.userId, req.user!.id)
          )
        )
        .returning();

      if (!deleted) {
        return res.status(404).send("Supplement not found");
      }

      res.json({ message: "Supplement deleted successfully" });
    } catch (error) {
      res.status(500).send("Failed to delete supplement");
    }
  });

  // Supplement Logs
  app.get("/api/supplement-logs", requireAuth, async (req, res) => {
    try {
      const logs = await db
        .select()
        .from(supplementLogs)
        .where(eq(supplementLogs.userId, req.user!.id));
      res.json(logs);
    } catch (error) {
      res.status(500).send("Failed to fetch supplement logs");
    }
  });

  app.post("/api/supplement-logs", requireAuth, async (req, res) => {
    try {
      const [newLog] = await db
        .insert(supplementLogs)
        .values({
          ...req.body,
          userId: req.user!.id,
        })
        .returning();
      res.json(newLog);
    } catch (error) {
      res.status(500).send("Failed to create supplement log");
    }
  });

  // Initialize supplement service
  supplementService.initialize().catch(console.error);

  // Supplement search endpoint
  app.get("/api/supplements/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      console.log(`Received search request for query: "${query}"`);

      if (!query) {
        console.log("Empty query, returning empty results");
        return res.json([]);
      }

      const suggestions = supplementService.search(query);
      console.log(`Returning ${suggestions.length} suggestions`);
      res.json(suggestions);
    } catch (error) {
      console.error("Supplement search error:", error);
      res.status(500).send("Failed to search supplements");
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}