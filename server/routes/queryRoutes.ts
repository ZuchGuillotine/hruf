
import express, { type Request, Response, Express } from "express";
import { queryWithAI } from "../services/openaiQueryService";
import { constructQueryContext } from "../services/llmContextService_query";
import { db } from "@db";
import { queryChats } from "@db/schema";

function setupQueryRoutes(app: Express) {
  // Middleware to check authentication
  const requireAuth = (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({
        error: "Authentication required",
        redirect: "/login"
      });
    }
    next();
  };

  // Query endpoint - works for both authenticated and non-authenticated users
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

      // Store chat history if user is authenticated
      if (userId) {
        try {
          await db.insert(queryChats).values({
            userId,
            messages: [...messages],
            metadata: {
              savedAt: new Date().toISOString()
            }
          });
        } catch (error) {
          console.error("Error saving query chat:", error);
          // Don't block the response if saving fails
        }
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

  // Get query history (only for authenticated users)
  app.get("/api/query/history", requireAuth, async (req: Request, res: Response) => {
    try {
      const history = await db
        .select()
        .from(queryChats)
        .where({ userId: req.user!.id })
        .orderBy({ createdAt: "desc" })
        .limit(50);

      res.json(history);
    } catch (error) {
      console.error("Error fetching query history:", error);
      res.status(500).json({
        error: "Failed to fetch query history",
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}

export default setupQueryRoutes;
