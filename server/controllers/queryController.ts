
import { Request, Response } from "express";
import { constructQueryContext } from "../services/llmContextService_query";
import { queryWithAI } from "../services/openaiQueryService";
import { db } from "../../db";
import { queryChats } from "../../db/schema";
import { Message } from "@/lib/types";

export async function query(req: Request, res: Response) {
  try {
    // Determine if this is a streaming request
    const isStreaming = req.query.stream === 'true';
    
    // Get messages either from query parameter (streaming) or body (non-streaming)
    let messages: Message[] = [];
    
    if (isStreaming) {
      // For streaming requests, we get messages from query params
      try {
        const messagesParam = req.query.messages as string;
        if (messagesParam) {
          messages = JSON.parse(decodeURIComponent(messagesParam));
        } else {
          console.error("No messages found in query params for streaming request");
          return res.status(400).json({ error: "Messages required for streaming" });
        }
      } catch (err) {
        console.error("Error parsing messages from query params:", err);
        return res.status(400).json({ error: "Invalid messages format" });
      }
    } else {
      // For regular requests, get messages from the request body
      if (!Array.isArray(req.body.messages)) {
        return res.status(400).json({ error: "Messages must be an array" });
      }
      messages = req.body.messages;
    }
    
    // Get the user query from the last message
    const userQuery = messages[messages.length - 1]?.content;
    if (!userQuery) {
      return res.status(400).json({ error: "No user query found in messages" });
    }
    
    // Check for user authentication
    const userId = req.isAuthenticated() && req.user ? req.user.id : null;
    console.log("Processing query:", {
      userId,
      isStreaming,
      messageCount: messages.length,
      isAuthenticated: !!userId,
      timestamp: new Date().toISOString()
    });
    
    // Get user context if available, or use minimal context
    const queryContext = await constructQueryContext(userId, userQuery);
    const contextualizedMessages = [...queryContext.messages, ...messages.slice(1)];
    
    // Handle streaming response
    if (isStreaming) {
      // Set appropriate headers for streaming
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering for Nginx
      
      // Begin streaming response
      return await queryWithAI(contextualizedMessages, userId, res);
    }
    
    // For non-streaming responses, continue with standard approach
    const { response } = await queryWithAI(contextualizedMessages, userId);
    
    // If user is authenticated, store the query in query_chats table (not qualitative_logs)
    if (userId) {
      await db
        .insert(queryChats)
        .values({
          userId,
          messages: contextualizedMessages.concat({ role: 'assistant', content: response }),
          metadata: {
            savedAt: new Date().toISOString(),
            query: userQuery
          }
        });
    }
    
    // Send AI response
    res.json({ response });
  } catch (error) {
    console.error("Error in query controller:", {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    
    // If streaming was already started, try to end it gracefully
    if (res.headersSent) {
      try {
        res.write(`data: ${JSON.stringify({ error: "An error occurred during processing" })}\n\n`);
        res.end();
      } catch (endError) {
        console.error("Error ending stream:", endError);
      }
      return;
    }
    
    // Otherwise send a standard error response
    res.status(500).json({
      error: "Query error",
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
