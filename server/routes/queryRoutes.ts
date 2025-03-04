
import { Request, Response } from 'express';
import { db } from '../../db';
import { queryChats } from '../../db/schema';
import { and, eq, desc } from 'drizzle-orm';
import { requireAuth } from '../auth';

export default function setupQueryRoutes(app: any) {
  // Save query chat history
  app.post('/api/query/save', requireAuth, async (req: Request, res: Response) => {
    try {
      const { messages } = req.body;
      const userId = req.user?.id;
      
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'Invalid messages format' });
      }
      
      const insertResult = await db.insert(queryChats).values({
        userId,
        messages,
        updatedAt: new Date(),
        metadata: { savedAt: new Date().toISOString() }
      }).returning();
      
      res.json(insertResult[0]);
    } catch (error) {
      console.error("Error saving query chat:", {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      
      res.status(500).json({
        error: "Failed to save query chat",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Get query chat history
  app.get('/api/query/history', requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      
      const history = await db
        .select()
        .from(queryChats)
        .where(eq(queryChats.userId, userId))
        .orderBy(desc(queryChats.createdAt))
        .limit(50);
      
      res.json(history);
    } catch (error) {
      console.error("Error fetching query chat history:", {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      
      res.status(500).json({
        error: "Failed to fetch query chat history",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}
