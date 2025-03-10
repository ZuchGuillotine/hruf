import express, { type Request, Response, Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { chatWithAI } from "./openai";
import { queryWithAI } from "./services/openaiQueryService";
import { qualitativeChatWithAI } from "./services/llmService";
import { db } from "@db";
import {
  supplements,
  healthStats,
  users,
  blogPosts,
  supplementLogs,
  supplementReference,
  qualitativeLogs,
  researchDocuments,
  logSummaries
} from "@db/schema";
import { eq, and, ilike, sql, desc, notInArray, between } from "drizzle-orm";
import { supplementService } from "./services/supplements";
import { sendTwoFactorAuthEmail } from './controllers/authController';
import { sendWelcomeEmail } from './services/emailService';
import { type SelectSupplement } from "@db/schema";
import { constructUserContext } from './services/llmContextService';
import { constructQueryContext } from './services/llmContextService_query';
import { registerUser, loginUser, logoutUser, verifyEmail } from "./controllers/authController";
import { getHealthStats, updateHealthStats } from "./controllers/healthStatsController";
import { getSupplements, createSupplement, updateSupplement, deleteSupplement, searchSupplements } from "./controllers/supplementController";
import { getSupplementLogs, createSupplementLog, getSupplementLogsByDate } from "./controllers/supplementLogController";
import { createQualitativeLog, getQualitativeLogs } from "./controllers/qualitativeLogController";
import { chat } from "./controllers/chatController";
import { query } from "./controllers/queryController";
import supplementsRouter from './routes/supplements';
import stripeRouter from './routes/stripe';  // Import Stripe routes
import setupSummaryRoutes from './routes/summaryRoutes'; // Import summary routes
import { generateResearch, getResearch, updateResearch, deleteResearch, getResearchBySlug } from './controllers/researchController';
import { getFoodSensitivity, updateFoodSensitivity } from './controllers/foodSensitivityController';
import { healthCheck } from './utils/healthCheck';

export function registerRoutes(app: Express): Server {
  // Setup authentication first
  setupAuth(app);

  // Ensure JSON parsing middleware is applied globally
  app.use(express.json());

  // Mount Stripe routes with explicit path
  app.use('/api/stripe', stripeRouter);

  // Mount supplements router
  app.use('/api/supplements', supplementsRouter);

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
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        })
        .returning();

      console.log('User created successfully:', {
        userId: user.id,
        email: user.email,
        timestamp: new Date().toISOString()
      });

      // Log the user in after registration
      req.login(user, (err) => {
        if (err) {
          console.error('Error logging in after registration:', err);
          return res.status(500).json({
            message: "Error logging in after registration",
            error: err.message
          });
        }

        res.json({
          message: "Registration successful",
          user: user
        });
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
      console.log('Chat request received:', {
        session: req.sessionID,
        isAuthenticated: req.isAuthenticated(),
        userId: req.user?.id,
        timestamp: new Date().toISOString()
      });

      const { messages } = req.body;

      if (!Array.isArray(messages)) {
        return res.status(400).json({ error: "Messages must be an array" });
      }

      // Get user context and merge with messages
      if (!req.user?.id) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const userContext = await constructUserContext(req.user.id.toString(), messages[messages.length - 1].content);
      const contextualizedMessages = [...userContext.messages, ...messages.slice(1)];

      // Set up streaming headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      console.log('Starting streaming response');

      // Create streaming response
      try {
        console.log('Starting qualitative chat with context:', {
          messageCount: contextualizedMessages.length,
          userContextIncluded: true,
          userId: req.user?.id,
          model: "gpt-4o-mini-2024-07-18", // Explicitly using this model for qualitative feedback
          modelConstant: "QUALITATIVE_CHAT", // Using the constant from MODELS object
          timestamp: new Date().toISOString()
        });

        // Get AI response with context
        const chatStream = chatWithAI(contextualizedMessages);

        // Handle each chunk from the stream
        for await (const chunk of chatStream) {
          console.log('Processing stream chunk:', {
            hasContent: !!chunk.response,
            contentLength: chunk.response?.length,
            isStreaming: chunk.streaming,
            timestamp: new Date().toISOString()
          });

          const sseData = `data: ${JSON.stringify(chunk)}\n\n`;
          console.log('Sending SSE chunk:', {
            dataLength: sseData.length,
            timestamp: new Date().toISOString()
          });
          res.write(sseData);

          // If this is the final chunk, end the response
          if (!chunk.streaming) {
            res.end();
            return;
          }
        }
      } catch (streamError) {
        console.error('Streaming error:', {
          error: streamError instanceof Error ? streamError.message : 'Unknown error',
          stack: streamError instanceof Error ? streamError.stack : undefined,
          timestamp: new Date().toISOString()
        });
        res.write(`data: ${JSON.stringify({ error: 'Streaming error' })}\n\n`);
        res.end();
      }
    } catch (error) {
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

  // Supplement query endpoint - works for both authenticated and non-authenticated users
  app.post("/api/query", async (req, res) => {
    try {
      const { messages } = req.body;

      if (!Array.isArray(messages)) {
        return res.status(400).json({ error: "Messages must be an array" });
      }

      const userQuery = messages[messages.length - 1].content;
      const userId = req.isAuthenticated() ? req.user?.id : null;

      // Get user context if available, or use minimal context for non-authenticated users
      const queryContext = await constructQueryContext(userId, userQuery);
      const contextualizedMessages = [...queryContext.messages, ...messages.slice(1)];

      // Get AI response with appropriate context
      const aiResponse = await queryWithAI(contextualizedMessages, userId);

      if (!aiResponse?.response) {
        return res.status(500).json({
          error: "Failed to get AI response",
          message: "The AI service did not provide a valid response"
        });
      }

      // Send AI response
      res.json(aiResponse);
    } catch (error: any) {
      console.error("Error in query endpoint:", {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      res.status(500).json({
        error: "Query error",
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Endpoint to save chat
  app.post("/api/chat/save", requireAuth, async (req, res) => {
    try {
      const { content, type = 'chat', tags = ['ai_conversation'] } = req.body;

      const [log] = await db
        .insert(qualitativeLogs)
        .values({
          userId: req.user!.id,
          content,
          type,
          tags,
          metadata: {
            savedAt: new Date().toISOString()
          }
        })
        .returning();

      res.json(log);
    } catch (error) {
      console.error("Error saving chat:", {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      res.status(500).json({
        error: "Failed to save chat",
        details: error instanceof Error ? error.message : 'Unknown error'
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
      const hours = parseInt(req.body.sleepHours || '0', 10);
      const minutes = parseInt(req.body.sleepMinutes || '0', 10);
      const totalMinutes = (hours * 60) + minutes;

      const healthStatsData = {
        ...req.body,
        averageSleep: totalMinutes > 0 ? totalMinutes : null,
        sleepHours: undefined,
        sleepMinutes: undefined,
        lastUpdated: new Date()
      };

      if (existing) {
        [result] = await db
          .update(healthStats)
          .set(healthStatsData)
          .where(eq(healthStats.userId, req.user!.id))
          .returning();
      } else {
        [result] = await db
          .insert(healthStats)
          .values({ ...healthStatsData, userId: req.user!.id })
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

  // Supplement Logs endpoints
  app.get("/api/supplement-logs/:date", requireAuth, async (req, res) => {
    try {
      const date = req.params.date;
      console.log('Fetching logs for date:', {
        requestDate: date,
        serverTime: new Date().toISOString()
      });

      // Convert the requested date to UTC day boundaries
      const startOfDay = new Date(`${date}T00:00:00.000Z`);
      const endOfDay = new Date(`${date}T23:59:59.999Z`);

      // In one query, fetch:
      // 1. Supplement logs for the requested date
      // 2. Qualitative logs for the date (excluding query-type logs)
      // 3. Any daily summaries for this date

      // First, get supplement logs for the date
      const logsResult = await db
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
        .leftJoin(supplements, eq(supplementLogs.supplementId, supplements.id))
        .where(
          and(
            eq(supplementLogs.userId, req.user!.id),
            sql`${supplementLogs.takenAt} >= ${startOfDay} AND ${supplementLogs.takenAt} <= ${endOfDay}`
          )
        )
        .orderBy(desc(supplementLogs.takenAt));

      // Get qualitative logs for the date
      const qualitativeLogsResult = await db
        .select({
          id: qualitativeLogs.id,
          content: qualitativeLogs.content,
          loggedAt: qualitativeLogs.loggedAt,
          type: qualitativeLogs.type,
          metadata: qualitativeLogs.metadata
        })
        .from(qualitativeLogs)
        .where(
          and(
            eq(qualitativeLogs.userId, req.user!.id),
            sql`${qualitativeLogs.loggedAt} >= ${startOfDay} AND ${qualitativeLogs.loggedAt} <= ${endOfDay}`,
            notInArray(qualitativeLogs.type, ['query'])
          )
        )
        .orderBy(desc(qualitativeLogs.loggedAt));

      // Get any summaries for this date
      const summariesResult = await db
        .select()
        .from(logSummaries)
        .where(
          and(
            eq(logSummaries.userId, req.user!.id),
            eq(logSummaries.summaryType, 'daily'),
            between(logSummaries.startDate, startOfDay, endOfDay)
          )
        )
        .limit(1);

      // Format logs while preserving original timestamps
      const enrichedLogs = logsResult.map(log => ({
        id: log.id,
        supplementId: log.supplementId,
        takenAt: log.takenAt.toISOString(),
        notes: log.notes,
        effects: log.effects,
        name: log.name || 'Unknown Supplement',
        dosage: log.dosage || '',
        frequency: log.frequency || ''
      }));

      const processedQualLogs = qualitativeLogsResult.map(log => {
        // Try to parse JSON content if it's a chat
        let summary = log.content;
        try {
          if (log.type === 'chat') {
            const messages = JSON.parse(log.content);
            if (Array.isArray(messages) && messages.length >= 2) {
              const userMsg = messages[0];
              const assistantMsg = messages[1];
              summary = `${req.user?.username || 'user'}: ${userMsg.content.slice(0, 50)}... | assistant: ${assistantMsg.content.slice(0, 100)}...`;
            } else if (Array.isArray(messages) && messages.length === 1) {
              const firstMessage = messages[0];
              summary = `${firstMessage.role === 'user' ? req.user?.username || 'user' : 'assistant'}: ${firstMessage.content.slice(0, 150)}...`;
            }
          }
        } catch (e) {
          // Not JSON or couldn't parse, use content as is
        }

        return {
          id: log.id,
          content: log.content,
          loggedAt: log.loggedAt.toISOString(),
          type: log.type,
          metadata: log.metadata,
          summary
        };
      });

      // Add the daily summary if available
      if (summariesResult.length > 0) {
        const summary = summariesResult[0];

        // Add the summary as a special qualitative log entry
        processedQualLogs.unshift({
          id: -summary.id, // Negative ID to indicate it's a summary
          content: summary.content,
          loggedAt: summary.createdAt.toISOString(),
          type: 'summary',
          metadata: summary.metadata,
          summary: `Daily Summary: ${summary.content.slice(0, 150)}...`
        });
      }

      res.json({
        supplements: enrichedLogs,
        qualitativeLogs: processedQualLogs
      });
    } catch (error) {
      console.error("Error fetching logs by date:", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        date: req.params.date,
        serverTime: new Date().toISOString()
      });
      res.status(500).json({
        error: "Failed to fetch logs",
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
        sampleLog: logs[0] ? {
          supplementId: logs[0].supplementId,
          takenAt: logs[0].takenAt,
          serverTime: new Date().toISOString()
        } : null
      });

      // First, delete all logs for the current day that aren't in the new logs
      const today = new Date();
      const supplementIds = logs.map(log => log.supplementId);

      if (supplementIds.length > 0) {
        await db
          .delete(supplementLogs)
          .where(
            and(
              eq(supplementLogs.userId, req.user!.id),
              sql`DATE(${supplementLogs.takenAt} AT TIME ZONE 'UTC') = DATE(${today}::timestamptz AT TIME ZONE 'UTC')`,
              notInArray(supplementLogs.supplementId, supplementIds)
            )
          );
      }

      // Update or insert logs with explicit timezone handling
      const insertedLogs = await Promise.all(
        logs.map(async (log) => {
          try {
            const [existingLog] = await db
              .select()
              .from(supplementLogs)
              .where(
                and(
                  eq(supplementLogs.userId, req.user!.id),
                  eq(supplementLogs.supplementId, log.supplementId),
                  sql`DATE(${supplementLogs.takenAt} AT TIME ZONE 'UTC') = DATE(${new Date(log.takenAt)}::timestamptz AT TIME ZONE 'UTC')`
                )
              )
              .limit(1);

            if (existingLog) {
              const hasChanged = JSON.stringify(existingLog.effects) !== JSON.stringify(log.effects) ||
                                existingLog.notes !== log.notes;

              if (hasChanged) {
                const [updatedLog] = await db
                  .update(supplementLogs)
                  .set({
                    notes: log.notes || null,
                    effects: log.effects || null,
                    takenAt: new Date()
                  })
                  .where(eq(supplementLogs.id, existingLog.id))
                  .returning();
                return updatedLog;
              }
              return existingLog;
            } else {
              const [newLog] = await db
                .insert(supplementLogs)
                .values({
                  userId: req.user!.id,
                  supplementId: parseInt(String(log.supplementId)),
                  takenAt: new Date(log.takenAt),
                  notes: log.notes || null,
                  effects: log.effects || null
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
        timestamp: new Date().toISOString(),
        sampleLog: insertedLogs[0] ? {
          id: insertedLogs[0].id,
          takenAt: insertedLogs[0].takenAt,
          dateOnly: new Date(insertedLogs[0].takenAt).toISOString().split('T')[0]
        } : null
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

  // Blog routes - Removed as blog management is now in a separate application
  // Only maintaining direct implementation for backward compatibility
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

  // Research documents routes - direct implementation like blog posts
  app.get("/api/research", async (req, res) => {
    try {
      const documents = await db
        .select()
        .from(researchDocuments)
        .orderBy(sql`${researchDocuments.publishedAt} DESC`);

      res.status(200).json(documents);
    } catch (error) {
      console.error("Error fetching research documents:", error);
      res.status(500).json({
        error: "Failed to retrieve research documents",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.get("/api/research/:slug", async (req, res) => {
    try {
      const { slug } = req.params;

      const [document] = await db
        .select()
        .from(researchDocuments)
        .where(eq(researchDocuments.slug, slug))
        .limit(1);

      if (!document) {
        return res.status(404).json({ error: "Research document not found" });
      }

      res.status(200).json(document);
    } catch (error) {
      console.error("Error fetching research document:", error);
      res.status(404).json({
        error: "Research document not found",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  //// Admin endpoints for research documents CRUD
  app.post("/api/admin/research", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { title, summary, content, authors, imageUrls, tags } = req.body;

      // Generate slug from title
      const slug = title
        .toLowerCase()
        .replace(/[^\w\s]/gi, '')        .replace(/\s+/g, '-');

      const [newDocument] = await db
        .insert(researchDocuments)
        .values({
          title,
          slug,
          summary,
          content,
          authors,
          imageUrls: imageUrls || [],
          tags: tags || []
        })
        .returning();

      return res.status(201).json(newDocument);
    } catch (error) {
      console.error("Error creating research document:", error);
      return res.status(500).json({ error: "Failed to create research document" });
    }
  });

  app.put("/api/admin/research/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { title, summary, content, authors, imageUrls, tags } = req.body;

      const updatedDocument = await db
        .update(researchDocuments)
        .set({
          title,
          summary,
          content,
          authors,
          imageUrls,
          tags,
          updatedAt: new Date()
        })
        .where(eq(researchDocuments.id, parseInt(id)))
        .returning();

      if (updatedDocument.length === 0) {
        return res.status(404).json({ error: "Research document not found" });
      }

      return res.status(200).json(updatedDocument[0]);
    } catch (error) {
      console.error("Error updating research document:", error);
      return res.status(500).json({ error: "Failed to update research document" });
    }
  });

  app.delete("/api/admin/research/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;

      const deletedDocument = await db
        .delete(researchDocuments)
        .where(eq(researchDocuments.id, parseInt(id)))
        .returning();

      if (deletedDocument.length === 0) {
        return res.status(404).json({ error: "Research document not found" });
      }

      return res.status(200).json({ message: "Research document deleted successfully" });
    } catch (error) {
      console.error("Error deleting research document:", error);
      return res.status(500).json({ error: "Failed todelete research document" });
    }
  });

  // Blog management endpoints
  app.get("/api/blog", async (req, res) => {
    try {
      const posts = await db
        .select()
        .from(blogPosts)
        .orderBy(sql`${blogPosts.publishedAt} DESC`);
      res.json(posts);
    } catch (error) {
      console.error("Errorfetching blog posts:", error);
      res.status(500).send("Failed to fetch blog posts");
    }
  });

  app.get("/api/api/blog/:slug", async (req, res) => {
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

  // Add supplement streak endpoint
  app.get("/api/supplement-streak", requireAuth, async (req, res) => {
    try {
      const result = await db
        .select({
          takenAt: supplementLogs.takenAt,
        })
        .from(supplementLogs)
        .where(eq(supplementLogs.userId, req.user!.id))
        .orderBy(desc(supplementLogs.takenAt));

      let currentStreak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Check if logged today
      const hasLoggedToday = result.some(log => {
        const logDate = new Date(log.takenAt);
        logDate.setHours(0, 0, 0, 0);
        return logDate.getTime() === today.getTime();
      });

      if (!hasLoggedToday) {
        // Check if streak is broken
        const hasLoggedYesterday = result.some(log => {
          const logDate = new Date(log.takenAt);
          logDate.setHours(0, 0, 0, 0);
          return logDate.getTime() === yesterday.getTime();
        });

        if (!hasLoggedYesterday) {
          res.json({ currentStreak: 0 });
          return;
        }
      }

      // Calculate streak
      let checkDate = new Date(today);
      for (let i = 0; i < result.length; i++) {
        const logDate = new Date(result[i].takenAt);
        logDate.setHours(0, 0, 0, 0);

        if (logDate.getTime() === checkDate.getTime()) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }

      res.json({ currentStreak });
    } catch (error) {
      console.error("Error calculating streak:", error);
      res.status(500).json({ error: "Failed to calculate streak" });
    }
  });

  // Setup summary routes
  setupSummaryRoutes(app);

  app.get('/api/health-check', healthCheck);
  
  // Add the ChatGPT endpoint
  app.post('/api/chat', async (req, res) => {
    try {
      // Extract user ID if authenticated, use default if not
      const userId = req.user?.id || '0';

      // Get user message from request body
      const { message } = req.body;

      // If no message, return error
      if (!message) {
        return res.status(400).json({ error: 'No message provided' });
      }

      // Setup streaming response
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      // Log request details for debugging
      console.log('Qualitative chat request received:', {
        userId,
        messagePreview: message.substring(0, 50) + '...',
        authenticated: !!req.user,
        timestamp: new Date().toISOString()
      });

      try {
        // Use the LLM service to generate a response with streaming
        const stream = await qualitativeChatWithAI(userId.toString(), message);
        
        // Track if we've written any chunks to detect empty responses
        let chunksWritten = 0;

        // Process each chunk from the stream
        for await (const chunk of stream) {
          // Send chunk to client
          res.write(`data: ${JSON.stringify(chunk)}\n\n`);
          
          // Count valid chunks for monitoring
          if (chunk.response) {
            chunksWritten++;
          }

          // Debug log chunk information
          if (chunk.error) {
            console.error('Stream chunk error:', chunk.error);
          }
        }

        console.log(`Chat stream completed: ${chunksWritten} chunks written`);
        
        // End the stream
        res.end();
      } catch (error) {
        console.error('Streaming error:', error instanceof Error ? {
          message: error.message,
          stack: error.stack
        } : error);
        res.write(`data: ${JSON.stringify({ 
          error: 'Streaming error', 
          details: error instanceof Error ? error.message : 'Unknown error'
        })}\n\n`);
        res.end();
      }
    } catch (error) {
      console.error('Chat API error:', error instanceof Error ? {
        message: error.message,
        stack: error.stack
      } : error);
      
      // If headers are already sent, we need to send the error as an event
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ 
          error: 'Server error occurred',
          details: error instanceof Error ? error.message : 'Unknown error' 
        })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ 
          error: 'Server error occurred',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  });

  // Add support for GET method with query parameter for EventSource compatibility
  app.get('/api/chat', async (req, res) => {
    try {
      // Extract user ID if authenticated, use default if not
      const userId = req.user?.id || '0';

      // Get message from query parameter
      const message = req.query.message as string;

      // If no message, return error
      if (!message) {
        return res.status(400).json({ error: 'No message provided' });
      }

      // Setup streaming response
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      try {
        // Use the LLM service to generate a response
        const stream = await qualitativeChatWithAI(userId.toString(), message);

        for await (const chunk of stream) {
          res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        }

        // End the stream
        res.end();
      } catch (error) {
        console.error('Streaming error:', error);
        res.write(`data: ${JSON.stringify({ error: 'Streaming error' })}\n\n`);
        res.end();
      }
    } catch (error) {
      console.error('Chat API error:', error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: 'Server error occurred' })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: 'Server error occurred' });
      }
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// ChatGPT endpoints are now properly integrated into the registerRoutes function