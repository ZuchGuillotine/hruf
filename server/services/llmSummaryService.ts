
import { db } from '../../db';
import { qualitativeLogs, chatSummaries } from '../../db/schema';
import { and, lt, gte } from 'drizzle-orm';
import { chatWithAI } from '../openai';

const SUMMARY_PROMPT = `Summarize the following chat interactions, focusing on key insights about the user's supplement experience, notable effects, and any consistent patterns or concerns. Keep the summary concise but informative.`;

export async function summarizeOldChats(userId: number) {
  console.log(`Starting chat summarization for user ${userId}`);
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  console.log(`Looking for chats older than ${twoWeeksAgo.toISOString()}`);

  // Get old chats
  const oldChats = await db.query.qualitativeLogs.findMany({
    where: and(
      eq(qualitativeLogs.userId, userId),
      eq(qualitativeLogs.type, 'chat'),
      lt(qualitativeLogs.createdAt, twoWeeksAgo)
    ),
    orderBy: asc(qualitativeLogs.createdAt)
  });

  if (oldChats.length === 0) {
    console.log(`No old chats found for user ${userId}`);
    return;
  }
  console.log(`Found ${oldChats.length} chats to summarize for user ${userId}`);

  // Prepare chats for summarization
  const chatContent = oldChats.map(chat => {
    try {
      const messages = JSON.parse(chat.content);
      return messages.map((m: any) => `${m.role}: ${m.content}`).join('\n');
    } catch (e) {
      return chat.content;
    }
  }).join('\n---\n');

  // Generate summary using OpenAI
  const summaryResponse = await chatWithAI([
    { role: 'system', content: SUMMARY_PROMPT },
    { role: 'user', content: chatContent }
  ]);

  // Store summary
  await db.insert(chatSummaries).values({
    userId,
    summary: summaryResponse.response,
    periodStart: oldChats[0].createdAt,
    periodEnd: oldChats[oldChats.length - 1].createdAt,
    metadata: {
      chatCount: oldChats.length,
      originalIds: oldChats.map(c => c.id)
    }
  });

  // Optional: Delete old chats after successful summarization
  await db.delete(qualitativeLogs)
    .where(and(
      eq(qualitativeLogs.userId, userId),
      inArray(qualitativeLogs.id, oldChats.map(c => c.id))
    ));
}
