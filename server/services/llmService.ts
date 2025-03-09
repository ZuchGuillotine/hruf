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
  const userRecord = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const chatCount = await getUserDailyChatCount(userId);

  if (!userRecord[0].isPro && chatCount >= 5) {
    throw new Error('Daily chat limit reached. Please upgrade to Pro to continue.');
  }
  
  // Call OpenAI chat with the qualitative model
  return openAIChatWithAI(messages, MODELS.QUALITATIVE_CHAT);
}