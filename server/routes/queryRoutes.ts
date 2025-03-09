import express, { type Request, Response, Express } from "express";
import { queryWithAI } from "../services/openaiQueryService";
import { constructQueryContext } from "../services/llmContextService_query";
import { db } from "@db";
import { queryChats } from "@db/schema";
import { eq, desc } from "drizzle-orm";
import { setAuthInfo } from "../middleware/authMiddleware";

function setupQueryRoutes(app: Express) {
  // Debug endpoint to verify authentication state
  app.get("/api/query/debug", async (req, res) => {
    console.log('Query Debug Info:', {
      session: {
        id: req.sessionID,
        exists: !!req.session,
        cookie: req.session?.cookie
      },
      auth: {
        isAuthenticated: req.isAuthenticated(),
        hasUser: !!req.user,
        user: req.user ? {
          id: req.user.id,
          email: req.user.email
        } : null
      },
      headers: {
        cookie: req.headers.cookie,
        authorization: req.headers.authorization
      },
      timestamp: new Date().toISOString()
    });

    res.json({
      authenticated: req.isAuthenticated(),
      sessionActive: !!req.session,
      hasUser: !!req.user,
      userId: req.user?.id
    });
  });

  // Regular query endpoint with enhanced auth logging
  app.post("/api/query", async (req, res) => {
    try {
      console.log('Query Authentication State:', {
        session: {
          id: req.sessionID,
          exists: !!req.session,
          cookie: req.session?.cookie
        },
        auth: {
          isAuthenticated: req.isAuthenticated(),
          hasUser: !!req.user,
          userId: req.user?.id
        },
        timestamp: new Date().toISOString()
      });

      const { messages } = req.body;
      if (!Array.isArray(messages)) {
        return res.status(400).json({ error: "Messages must be an array" });
      }

      const userQuery = messages[messages.length - 1].content;
      const isAuthenticated = req.isAuthenticated();
      const userId = isAuthenticated && req.user ? req.user.id : null;

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
      if (isAuthenticated && userId) {
        try {
          await db.insert(queryChats).values({
            userId,
            messages: [...messages],
            metadata: {
              savedAt: new Date().toISOString()
            }
          });
        } catch (error) {
          console.error("Error saving query chat:", {
            userId,
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            timestamp: new Date().toISOString()
          });
        }
      }

      res.json(aiResponse);
    } catch (error) {
      console.error("Error in query endpoint:", {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        authStatus: {
          hasUser: !!req.user,
          hasSession: !!req.session,
          isAuthenticated: req.isAuthenticated()
        },
        timestamp: new Date().toISOString()
      });
      res.status(500).json({
        error: "Query error",
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get query history (only for authenticated users)
  app.get("/api/query/history", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({
          error: "Authentication required",
          redirect: "/login"
        });
      }

      const history = await db
        .select()
        .from(queryChats)
        .where(eq(queryChats.userId, req.user!.id))
        .orderBy(desc(queryChats.createdAt))
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
// Test endpoint for streaming
app.get("/api/query/test-stream", (req: Request, res: Response) => {
  console.log("Test streaming endpoint hit");
  
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  
  // CORS headers
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Send initial ping and connection message
  res.write(': ping\n\n');
  res.write(`data: ${JSON.stringify({ debug: "Stream test connection established" })}\n\n`);
  
  if (typeof res.flush === 'function') {
    res.flush();
  }

  // Send test data every second for 5 seconds
  let count = 0;
  const interval = setInterval(() => {
    count++;
    res.write(`data: ${JSON.stringify({ content: `Test message ${count}. ` })}\n\n`);
    
    if (typeof res.flush === 'function') {
      res.flush();
    }
    
    if (count >= 5) {
      clearInterval(interval);
      res.write('data: [DONE]\n\n');
      res.end();
    }
  }, 1000);

  // Handle client disconnect
  req.on('close', () => {
    clearInterval(interval);
    console.log("Client disconnected from test stream");
  });
});
