import express, { type Request, Response, Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { chatWithAI } from "./openai";
import { db } from "@db"; // NeonDB connection
import { rdsDb } from "../db/rds"; // RDS connection for logs only
import { supplements, supplementLogs, supplementReference, healthStats, users, blogPosts } from "@db/schema";
import { eq, and, ilike, sql, desc, notInArray, inArray } from "drizzle-orm";
import { supplementService } from "./services/supplements";
import { sendTwoFactorAuthEmail } from './controllers/authController';
import { sendWelcomeEmail } from './services/emailService';
import { qualitativeLogs } from "@db/schema";

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Middleware to check authentication
  const requireAuth = (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated()) {
      console.log('Authentication check failed:', {
        session: req.session,
        user: req.user,
        timestamp: new Date().toISOString()
      });
      return res.status(401).json({ 
        error: "Authentication required",
        redirect: "/login"
      });
    }
    next();
  };

  // Middleware to check admin role
  const requireAdmin = (req: Request, res: Response, next: Function) => {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ 
        error: "Admin access required",
        message: "You do not have admin privileges"
      });
    }
    next();
  };

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

  // Chat endpoint with storage
  app.post("/api/chat", requireAuth, async (req, res) => {
    try {
      const { messages } = req.body;

      if (!Array.isArray(messages)) {
        return res.status(400).json({ error: "Messages must be an array" });
      }

      // Get AI response
      const response = await chatWithAI(messages);

      // Store the conversation in qualitative_logs with enhanced metadata
      const lastUserMessage = messages[messages.length - 1];
      const logResult = await db
        .insert(qualitativeLogs)
        .values({
          userId: req.user!.id,
          content: JSON.stringify({
            userMessage: lastUserMessage,
            aiResponse: response,
            fullContext: messages
          }),
          type: 'chat',
          tags: ['ai_conversation'],
          metadata: {
            messageCount: messages.length,
            timestamp: new Date().toISOString(),
            conversationLength: messages.length,
            userMessageCount: messages.filter(m => m.role === 'user').length,
            assistantMessageCount: messages.filter(m => m.role === 'assistant').length
          }
        })
        .returning();

      console.log('Chat log saved:', {
        logId: logResult[0].id,
        userId: req.user!.id,
        timestamp: new Date().toISOString()
      });

      res.json(response);
    } catch (error: any) {
      console.error("Error in chat endpoint:", {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      res.status(500).json({ 
        error: "Chat error",
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Add endpoint to retrieve chat history
  app.get("/api/chat/history", requireAuth, async (req, res) => {
    try {
      const history = await db
        .select()
        .from(qualitativeLogs)
        .where(
          and(
            eq(qualitativeLogs.userId, req.user!.id),
            eq(qualitativeLogs.type, 'chat')
          )
        )
        .orderBy(desc(qualitativeLogs.loggedAt))
        .limit(50);

      res.json(history);
    } catch (error) {
      console.error("Error fetching chat history:", {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      res.status(500).json({
        error: "Failed to fetch chat history",
        message: error instanceof Error ? error.message : 'Unknown error'
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
      const supplementId = parseInt(req.params.id);
      const userId = req.user!.id;

      // Verify supplement belongs to user before deletion
      const supplement = await db
        .select()
        .from(supplements)
        .where(and(
          eq(supplements.id, supplementId),
          eq(supplements.userId, userId)
        ))
        .limit(1);

      if (!supplement || supplement.length === 0) {
        return res.status(404).json({ error: "Supplement not found or unauthorized" });
      }

      // Perform deletion
      await db
        .delete(supplements)
        .where(and(
          eq(supplements.id, supplementId),
          eq(supplements.userId, userId)
        ));

      res.json({ message: "Supplement deleted successfully" });
    } catch (error) {
      res.status(500).send("Failed to delete supplement");
    }
  });

  // Supplement Logs endpoints - Handles the interaction between NeonDB (supplement details) and RDS (supplement logs)
  app.get("/api/supplement-logs/:date", requireAuth, async (req, res) => {
    try {
      const date = req.params.date;
      console.log('Fetching logs for date:', {
        date,
        userId: req.user?.id,
        timestamp: new Date().toISOString()
      });

      // Step 1: Get logs from RDS
      const logs = await rdsDb
        .select({
          id: supplementLogs.id,
          supplementId: supplementLogs.supplementId,
          takenAt: supplementLogs.takenAt,
          notes: supplementLogs.notes,
          effects: supplementLogs.effects
        })
        .from(supplementLogs)
        .where(
          and(
            eq(supplementLogs.userId, req.user!.id),
            sql`DATE(${supplementLogs.takenAt} AT TIME ZONE 'UTC') = DATE(${date}::timestamp AT TIME ZONE 'UTC')`
          )
        );

      if (logs.length === 0) {
        return res.json({ supplements: [] });
      }

      console.log('Found RDS logs:', {
        count: logs.length,
        sampleLogId: logs[0]?.id,
        timestamp: new Date().toISOString()
      });

      // Step 2: Get supplement details from NeonDB
      const supplementIds = logs.map(log => log.supplementId).filter(Boolean);
      const supplementDetails = await db
        .select({
          id: supplements.id,
          name: supplements.name,
          dosage: supplements.dosage,
          frequency: supplements.frequency
        })
        .from(supplements)
        .where(
          and(
            eq(supplements.userId, req.user!.id),
            inArray(supplements.id, supplementIds)
          )
        );

      console.log('Found supplement details:', {
        count: supplementDetails.length,
        sampleId: supplementDetails[0]?.id,
        timestamp: new Date().toISOString()
      });

      // Step 3: Create lookup map
      const supplementMap = supplementDetails.reduce((acc, supp) => {
        if (supp.id) {
          acc[supp.id] = supp;
        }
        return acc;
      }, {} as Record<number, typeof supplementDetails[0]>);

      // Step 4: Combine data
      const enrichedLogs = logs.map(log => {
        const supplement = log.supplementId ? supplementMap[log.supplementId] : null;
        return {
          id: log.id,
          supplementId: log.supplementId,
          takenAt: log.takenAt,
          notes: log.notes,
          effects: log.effects,
          name: supplement?.name || 'Unknown Supplement',
          dosage: supplement?.dosage || '',
          frequency: supplement?.frequency || ''
        };
      });

      console.log('Enriched logs:', {
        count: enrichedLogs.length,
        sampleLog: enrichedLogs[0],
        timestamp: new Date().toISOString()
      });

      res.json({
        supplements: enrichedLogs
      });
    } catch (error) {
      console.error("Error fetching supplement logs by date:", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        userId: req.user?.id,
        date: req.params.date,
        timestamp: new Date().toISOString()
      });
      res.status(500).json({
        error: "Failed to fetch supplement logs",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.post("/api/supplement-logs", requireAuth, async (req, res) => {
    try {
      const { logs } = req.body;

      if (!Array.isArray(logs)) {
        return res.status(400).json({ error: "Logs must be an array" });
      }

      console.log('Attempting to save supplement logs:', {
        userId: req.user!.id,
        logCount: logs.length,
        sampleLog: logs[0],
        timestamp: new Date().toISOString()
      });

      // First, delete all logs for the current day that aren't in the new logs
      const today = new Date();
      const supplementIds = logs.map(log => log.supplementId);
      
      await rdsDb
        .delete(supplementLogs)
        .where(
          and(
            eq(supplementLogs.userId, req.user!.id),
            sql`DATE_TRUNC('day', ${supplementLogs.takenAt}) = DATE_TRUNC('day', ${today}::timestamp)`,
            notInArray(supplementLogs.supplementId, supplementIds)
          )
        );

      // Then update or insert new logs
      const insertedLogs = await Promise.all(
        logs.map(async (log) => {
          try {
            const existingLog = await rdsDb
              .select()
              .from(supplementLogs)
              .where(
                and(
                  eq(supplementLogs.userId, req.user!.id),
                  eq(supplementLogs.supplementId, log.supplementId),
                  sql`DATE_TRUNC('day', ${supplementLogs.takenAt}) = DATE_TRUNC('day', ${new Date(log.takenAt)}::timestamp)`
                )
              )
              .limit(1);

            if (existingLog.length > 0) {
              // Only update if data has changed
              const hasChanged = existingLog[0].dosage !== log.dosage ||
                                existingLog[0].frequency !== log.frequency ||
                                existingLog[0].name !== log.name;

              if (hasChanged) {
                const [updatedLog] = await rdsDb
                  .update(supplementLogs)
                  .set({
                    dosage: log.dosage,
                    frequency: log.frequency,
                    name: log.name,
                    notes: log.notes || null,
                    effects: log.effects || null,
                    takenAt: new Date() // Only update timestamp if data changed
                  })
                  .where(eq(supplementLogs.id, existingLog[0].id))
                  .returning();
                return updatedLog;
              }
              return existingLog[0];
            } else {
              const [newLog] = await rdsDb
                .insert(supplementLogs)
                .values({
                  userId: req.user!.id,
                  supplementId: log.supplementId,
                  dosage: log.dosage,
                  frequency: log.frequency,
                  name: log.name,
                  takenAt: new Date(log.takenAt),
                  notes: log.notes || null,
                  effects: log.effects || null,
                })
                .returning();
              return newLog;
            }
          } catch (error) {
            console.error('Error inserting individual log:', {
              error: error instanceof Error ? error.message : String(error),
              supplementId: log.supplementId,
              timestamp: new Date().toISOString()
            });
            throw error;
          }
        })
      );

      console.log('Successfully saved supplement logs:', {
        count: insertedLogs.length,
        timestamp: new Date().toISOString()
      });

      res.json(insertedLogs);
    } catch (error) {
      console.error("Error creating supplement logs:", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });

      res.status(500).json({
        error: "Failed to create supplement logs",
        details: error instanceof Error ? error.message : String(error)
      });
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
    // Blog management endpoints
    app.get("/api/blog", async (req, res) => {
      try {
        const posts = await db
          .select()
          .from(blogPosts)
          .orderBy(sql`${blogPosts.publishedAt} DESC`);
        res.json(posts);
      } catch (error) {
        console.error("Error fetching blog posts:", error);
        res.status(500).send("Failed to fetch blog posts");
      }
    });

    app.get("/api/blog/:slug", async (req, res) => {
      try {
        const [post] = await db
          .select()
          .from(blogPosts)
          .where(eq(blogPosts.slug, req.params.slug))
          .limit(1);

        if (!post) {
          return res.status(404).send("Blog post not found");
        }
        res.json(post);
      } catch (error) {
        console.error("Error fetching blog post:", error);
        res.status(500).send("Failed to fetch blog post");
      }
    });

    app.post("/api/admin/blog", requireAuth, requireAdmin, async (req, res) => {
      try {
        const { title, content, excerpt, thumbnailUrl } = req.body;
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

        const [post] = await db
          .insert(blogPosts)
          .values({
            title,
            slug,
            content,
            excerpt,
            thumbnailUrl,
          })
          .returning();

        res.json(post);
      } catch (error) {
        console.error("Error creating blog post:", error);
        res.status(500).send("Failed to create blog post");
      }
    });

    app.put("/api/admin/blog/:id", requireAuth, requireAdmin, async (req, res) => {
      try {
        const { title, content, excerpt, thumbnailUrl } = req.body;
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

        const [post] = await db
          .update(blogPosts)
          .set({
            title,
            slug,
            content,
            excerpt,
            thumbnailUrl,
            updatedAt: new Date(),
          })
          .where(eq(blogPosts.id, parseInt(req.params.id)))
          .returning();

        if (!post) {
          return res.status(404).send("Blog post not found");
        }

        res.json(post);
      } catch (error) {
        console.error("Error updating blog post:", error);
        res.status(500).send("Failed to update blog post");
      }
    });

    app.delete("/api/admin/blog/:id", requireAuth, requireAdmin, async (req, res) => {
      try {
        const [post] = await db
          .delete(blogPosts)
          .where(eq(blogPosts.id, parseInt(req.params.id)))
          .returning();

        if (!post) {
          return res.status(404).send("Blog post not found");
        }

        res.json({ message: "Blog post deleted successfully" });
      } catch (error) {
        console.error("Error deleting blog post:", error);
        res.status(500).send("Failed to delete blog post");
      }
    });

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