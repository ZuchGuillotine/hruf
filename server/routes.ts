import type { Request, Response, Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { chatWithAI } from "./openai";
import { db } from "@db";
import { supplements, supplementLogs, supplementReference, healthStats, users } from "@db/schema";
import { eq, and, ilike, sql } from "drizzle-orm";
import { supplementService } from "./services/supplements";
import { sendVerificationEmail, generateVerificationToken } from './utils/email';

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

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  // Add email verification endpoint
  app.get("/api/verify-email", async (req, res) => {
    try {
      const { token } = req.query;

      if (!token || typeof token !== 'string') {
        return res.status(400).send("Invalid verification token");
      }

      const [user] = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.verificationToken, token),
            eq(users.emailVerified, false),
            sql`${users.verificationTokenExpiry} > CURRENT_TIMESTAMP`
          )
        );

      if (!user) {
        return res.status(400).send("Invalid or expired verification token");
      }

      await db
        .update(users)
        .set({
          emailVerified: true,
          verificationToken: null,
          verificationTokenExpiry: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      // Automatically log the user in after verification
      req.login(user, (err) => {
        if (err) {
          console.error('Error logging in after verification:', err);
          return res.status(500).send("Error logging in after verification");
        }
        res.redirect('/dashboard');
      });
    } catch (error) {
      console.error('Error verifying email:', error);
      res.status(500).send("Error verifying email");
    }
  });

  // Registration endpoint with improved error handling
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
        return res.status(400).json({
          message: "An account with this email already exists",
          code: "EMAIL_EXISTS"
        });
      }

      const verificationToken = generateVerificationToken();
      const tokenExpiry = new Date();
      tokenExpiry.setHours(tokenExpiry.getHours() + 24); // Token expires in 24 hours

      console.log('Generated verification token:', {
        tokenLength: verificationToken.length,
        expiry: tokenExpiry,
        timestamp: new Date().toISOString()
      });

      // Create user first
      const [user] = await db
        .insert(users)
        .values({
          ...req.body,
          emailVerified: false,
          verificationToken,
          verificationTokenExpiry: tokenExpiry,
        })
        .returning();

      console.log('User created successfully:', {
        userId: user.id,
        email: user.email,
        timestamp: new Date().toISOString()
      });

      try {
        // Attempt to send verification email
        const emailSent = await sendVerificationEmail(user.email, verificationToken);

        console.log('Email sending attempt completed:', {
          success: emailSent,
          email: user.email,
          timestamp: new Date().toISOString()
        });

        if (emailSent) {
          res.json({
            message: "Registration successful. Please check your email to verify your account.",
            requiresVerification: true,
          });
        } else {
          res.json({
            message: "Account created but verification email could not be sent. Please contact support.",
            requiresVerification: true,
            emailError: true,
          });
        }
      } catch (emailError: any) {
        console.error('Failed to send verification email:', {
          error: emailError.message,
          code: emailError.code,
          response: emailError.response?.body,
          stack: emailError.stack,
          timestamp: new Date().toISOString()
        });

        // Provide specific error messages based on the type of failure
        let errorMessage = "Account created but verification email failed to send. ";

        if (emailError.message.includes('API key does not have permission')) {
          errorMessage += "Email service not properly configured.";
        } else if (emailError.message.includes('The from address does not match')) {
          errorMessage += "Email sender not verified.";
        } else if (emailError.message.includes('domain authentication')) {
          errorMessage += "Domain authentication required.";
        } else {
          errorMessage += "Please contact support.";
        }

        res.json({
          message: errorMessage,
          requiresVerification: true,
          emailError: true,
        });
      }
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

  const httpServer = createServer(app);
  return httpServer;
}