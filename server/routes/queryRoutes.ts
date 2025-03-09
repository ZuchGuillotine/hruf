import express, { type Request, Response, Express } from "express";
import { Router } from 'express';
import { handleQueryRequest } from '../controllers/queryController';
import { constructQueryContext } from "../services/llmContextService_query";
import { db } from "@db";
import { queryChats } from "@db/schema";
import { eq, desc } from "drizzle-orm";
import { setAuthInfo } from "../middleware/authMiddleware";

// Create router for query-related endpoints
const queryRouter = Router();

// Create an endpoint for querying the AI
queryRouter.post('/', handleQueryRequest);


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

  // Mount the query router at /api/query
  app.use('/api/query', queryRouter);

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
  console.log('Query routes initialized');
}

export default setupQueryRoutes;