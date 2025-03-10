
// server/services/llmService.ts

import { sql } from 'drizzle-orm';
import { eq, gte, and } from 'drizzle-orm/expressions';
import { db } from '../../db';
import { qualitativeLogs, users } from '../../db/schema';
import { chatWithAI as openAIChatWithAI, MODELS } from "../openai";

async function getUserDailyChatCount(userId: number): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const count = await db
    .select({ count: sql<number>`count(*)` })
    .from(qualitativeLogs)
    .where(
      and(
        eq(qualitativeLogs.userId, userId),
        gte(qualitativeLogs.createdAt, today),
        eq(qualitativeLogs.type, 'chat')
      )
    );

  return count[0].count;
}

/**
 * Chat with AI for user feedback on supplements - uses the qualitative model
 * @param messages Array of message objects with role and content
 * @param userId User ID for context and rate limiting
 * @returns Async generator that yields response chunks
 */
export async function chatWithAI(messages: Array<{ role: string; content: string }>, userId: number) {
  try {
    console.log('Qualitative chat request:', {
      userId,
      messageCount: messages.length,
      timestamp: new Date().toISOString()
    });
    
    const userRecord = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    
    if (!userRecord || userRecord.length === 0) {
      console.error('User record not found:', { userId });
      throw new Error('User not found');
    }
    
    const chatCount = await getUserDailyChatCount(userId);
    console.log('Daily chat count:', { userId, chatCount, isPro: userRecord[0].isPro });
    
    if (!userRecord[0].isPro && chatCount >= 5) {
      throw new Error('Daily chat limit reached. Please upgrade to Pro to continue.');
    }
    
    // Verify model being used - explicitly logging to help debug model selection issues
    // IMPORTANT: This service must always use the QUALITATIVE_CHAT model (gpt-4o-mini)
    console.log('Using qualitative chat model:', { 
      model: MODELS.QUALITATIVE_CHAT,
      modelName: "gpt-4o-mini",
      userId,
      timestamp: new Date().toISOString()
    });
    
    // Call OpenAI chat with the qualitative model
    // The second parameter ensures we're always using the correct model for this context
    // Enable streaming for real-time responses
    return openAIChatWithAI(messages, MODELS.QUALITATIVE_CHAT, true); // Set streaming to true
  } catch (error) {
    console.error('Error in qualitative chat service:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

/**
 * Process a single message from a user for qualitative feedback
 * This function builds context and initiates a streaming chat with the AI
 * @param userId User ID as string
 * @param message User's message content
 * @returns Async generator for streaming response
 */
export async function qualitativeChatWithAI(userId: string, message: string) {
  try {
    console.log('Qualitative chat request with single message:', {
      userId,
      messagePreview: message.substring(0, 50) + '...',
      timestamp: new Date().toISOString()
    });
    
    // Convert string userId to number for database queries
    const userIdNum = parseInt(userId, 10);
    
    if (isNaN(userIdNum)) {
      throw new Error('Invalid user ID');
    }
    
    // Format the message into the expected format for the LLM
    const formattedMessages = [
      { role: 'user', content: message }
    ];
    
    // Use the existing chatWithAI function with the formatted messages
    return chatWithAI(formattedMessages, userIdNum);
  } catch (error) {
    console.error('Error in qualitative chat with AI service:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

import { sql } from 'drizzle-orm';
import { eq, gte, and } from 'drizzle-orm/expressions';
import { db } from './db';
import { qualitativeLogs, users } from './schema';

async function getUserDailyChatCount(userId: number): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const count = await db
    .select({ count: sql<number>`count(*)` })
    .from(qualitativeLogs)
    .where(
      and(
        eq(qualitativeLogs.userId, userId),
        gte(qualitativeLogs.createdAt, today),
        eq(qualitativeLogs.type, 'chat')
      )
    );

  return count[0].count;
}

import { chatWithAI as openAIChatWithAI, MODELS } from "../openai";

export async function chatWithAI(messages: Array<{ role: string; content: string }>, userId: number) {
  try {
    console.log('Qualitative chat request:', {
      userId,
      messageCount: messages.length,
      timestamp: new Date().toISOString()
    });
    
    const userRecord = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    
    if (!userRecord || userRecord.length === 0) {
      console.error('User record not found:', { userId });
      throw new Error('User not found');
    }
    
    const chatCount = await getUserDailyChatCount(userId);
    console.log('Daily chat count:', { userId, chatCount, isPro: userRecord[0].isPro });

    if (!userRecord[0].isPro && chatCount >= 5) {
      throw new Error('Daily chat limit reached. Please upgrade to Pro to continue.');
    }
    
    // Verify model being used - explicitly logging to help debug model selection issues
    // IMPORTANT: This service must always use the QUALITATIVE_CHAT model (gpt-4o-mini)
    console.log('Using qualitative chat model:', { 
      model: MODELS.QUALITATIVE_CHAT,
      modelName: "gpt-4o-mini",
      userId,
      timestamp: new Date().toISOString()
    });
    
    // Call OpenAI chat with the qualitative model
    // The second parameter ensures we're always using the correct model for this context
    // Enable streaming for real-time responses
    return openAIChatWithAI(messages, MODELS.QUALITATIVE_CHAT, true); // Set streaming to true
  } catch (error) {
    console.error('Error in qualitative chat service:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}