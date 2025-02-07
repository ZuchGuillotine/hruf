import express, { type Request, Response, Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { chatWithAI } from "./openai";
import { db } from "@db";
import { supplements, supplementLogs, supplementReference, healthStats, users } from "@db/schema";
import { eq, and, ilike, sql } from "drizzle-orm";
import { supplementService } from "./services/supplements";
import { sendTwoFactorAuthEmail } from './controllers/authController';
import { sendWelcomeEmail } from './services/emailService';

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Test email endpoint (remove in production)
  app.post("/api/test-email", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      await sendWelcomeEmail(email, "Test User");
      res.json({ message: "Test email sent successfully" });
    } catch (error) {
      console.error("Test email error:", {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        details: error instanceof Error && 'response' in error ? (error as any).response?.body : undefined
      });
      res.status(500).json({ 
        error: "Failed to send test email",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

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


  // Add 2FA endpoint
  app.post("/api/auth/2fa/send", async (req, res, next) => {
    try {
      await sendTwoFactorAuthEmail(req, res, next);
    } catch (error) {
      console.error('Error in 2FA route:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      next(error);
    }
  });

  // Remove email verification from registration endpoint
  app.post("/api/register", async (req, res) => {
    try {
      console.log('Starting registration process:', {
        email: req.body.email,
        bodyKeys: Object.keys(req.body),
        timestamp: new Date().toISOString()
      });

      // Check for existing user with same email
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, req.body.email));

      if (existingUser) {
        return res.status(409).json({
          status: 'error',
          message: "An account with this email already exists. Please use a different email or try logging in.",
          code: "EMAIL_EXISTS"
        });
      }

      // Create user
      const [user] = await db
        .insert(users)
        .values({
          ...req.body,
          emailVerified: true, // Auto-verify for now since we don't have email service
        })
        .returning();

      console.log('User created successfully:', {
        userId: user.id,
        email: user.email,
        timestamp: new Date().toISOString()
      });

      res.json({
        message: "Registration successful",
        user: user
      });
    } catch (error: any) {
      console.error('Error in registration process:', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });

      res.status(500).json({
        message: "Error registering user",
        error: error.message
      });
    }
  });


  // Health Stats endpoints
  app.get("/api/health-stats", requireAuth, async (req, res) => {
    try {
      const [userStats] = await db
        .select()
        .from(healthStats)
        .where(eq(healthStats.userId, req.user!.id));
      res.json(userStats || {});
    } catch (error) {
      console.error("Error fetching health stats:", error);
      res.status(500).send("Failed to fetch health stats");
    }
  });

  app.post("/api/health-stats", requireAuth, async (req, res) => {
    try {
      const [existing] = await db
        .select()
        .from(healthStats)
        .where(eq(healthStats.userId, req.user!.id));

      let result;
      if (existing) {
        [result] = await db
          .update(healthStats)
          .set({ ...req.body, lastUpdated: new Date() })
          .where(eq(healthStats.userId, req.user!.id))
          .returning();
      } else {
        [result] = await db
          .insert(healthStats)
          .values({ ...req.body, userId: req.user!.id })
          .returning();
      }

      res.json(result);
    } catch (error) {
      console.error("Error updating health stats:", error);
      res.status(500).send("Failed to update health stats");
    }
  });

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
      const { logs } = req.body;

      if (!Array.isArray(logs)) {
        return res.status(400).json({ error: "Logs must be an array" });
      }

      // Insert all logs for the current day
      const insertedLogs = await Promise.all(
        logs.map(async (log) => {
          const [newLog] = await db
            .insert(supplementLogs)
            .values({
              userId: req.user!.id,
              supplementId: log.supplementId,
              takenAt: log.takenAt,
              notes: log.notes || null,
              effects: log.effects || null,
            })
            .returning();
          return newLog;
        })
      );

      res.json(insertedLogs);
    } catch (error) {
      console.error("Error creating supplement logs:", error);
      res.status(500).send("Failed to create supplement logs");
    }
  });

  app.get("/api/supplement-logs/:date", requireAuth, async (req, res) => {
    try {
      const date = req.params.date;
      const logs = await db
        .select({
          id: supplementLogs.id,
          supplementId: supplementLogs.supplementId,
          takenAt: supplementLogs.takenAt,
          notes: supplementLogs.notes,
          effects: supplementLogs.effects,
          name: supplements.name,
          dosage: supplements.dosage,
          frequency: supplements.frequency
        })
        .from(supplementLogs)
        .leftJoin(supplements, eq(supplements.id, supplementLogs.supplementId))
        .where(
          and(
            eq(supplementLogs.userId, req.user!.id),
            sql`DATE(${supplementLogs.takenAt}) = ${date}`
          )
        );

      // Format the logs for the frontend
      const formattedLogs = {
        supplements: logs.map(log => ({
          supplementId: log.supplementId,
          name: log.name,
          dosage: log.dosage,
          frequency: log.frequency,
          taken: true, // If there's a log, it means it was taken
          takenAt: log.takenAt,
          notes: log.notes,
          effects: log.effects
        }))
      };

      res.json(formattedLogs);
    } catch (error) {
      console.error("Error fetching supplement logs by date:", error);
      res.status(500).send("Failed to fetch supplement logs");
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

      const suggestions = await supplementService.search(query);
      console.log(`Returning ${suggestions.length} suggestions`);
      res.json(suggestions);
    } catch (error) {
      console.error("Supplement search error:", {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        query: req.query.q,
        timestamp: new Date().toISOString()
      });
      res.status(500).json({ 
        error: "Failed to search supplements",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

    // User profile endpoints
    app.post("/api/profile", requireAuth, async (req, res) => {
      try {
        const [updated] = await db
          .update(users)
          .set({
            ...req.body,
            updatedAt: new Date(),
          })
          .where(eq(users.id, req.user!.id))
          .returning();

        res.json({ message: "Profile updated successfully", user: updated });
      } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).send("Failed to update profile");
      }
    });
  
    // Admin endpoint to delete non-admin users
    app.delete("/api/admin/users/delete-non-admin", requireAuth, requireAdmin, async (req, res) => {
      try {
        const result = await db
          .delete(users)
          .where(eq(users.isAdmin, false))
          .returning();

        console.log('Successfully deleted non-admin users:', {
          count: result.length,
          timestamp: new Date().toISOString()
        });

        res.json({ 
          message: `Successfully deleted ${result.length} non-admin users`,
          deletedCount: result.length 
        });
      } catch (error) {
        console.error("Error deleting non-admin users:", {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString()
        });
        res.status(500).json({
          error: "Failed to delete non-admin users",
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });
  

  const httpServer = createServer(app);
  return httpServer;
}