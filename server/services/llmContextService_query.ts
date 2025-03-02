
import { getQuantitativeLogs, getQualitativeLogs } from "./logService";
import { Message } from "@/lib/types";
import { db } from "../../db";
import { chatSummaries } from "../../db/schema";
import { eq, desc } from "drizzle-orm";

// Separate system prompt for general supplement queries
export const QUERY_SYSTEM_PROMPT = `You are an expert assistant specializing in supplement knowledge and health information. 
Your role is to provide accurate, evidence-based information about supplements, their effects, interactions, and best practices.

When answering:
1. Focus on providing factual, scientifically-backed information
2. Specify when something is based on limited evidence or is controversial
3. Avoid making definitive medical claims or prescribing supplements
4. Acknowledge when you don't have enough information to give a complete answer
5. Consider the user's personal health context if provided, but make it clear you are not replacing medical advice

If the user has shared their supplement tracking history, you may reference it to provide more personalized context, but always clarify that your suggestions are not medical advice.`;

// Constructs context for general supplement queries
// This service handles context for general supplement information requests
export async function constructQueryContext(userId: string | null, userQuery: string): Promise<{ messages: Message[] }> {
  try {
    // If user is not authenticated, return basic context
    if (!userId) {
      return {
        messages: [
          { role: "system", content: QUERY_SYSTEM_PROMPT },
          { role: "user", content: userQuery }
        ]
      };
    }

    // For authenticated users, include their supplement history and preferences
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    // Fetch both quantitative and qualitative data
    const [quantitativeLogs, recentLogs, historicalSummaries] = await Promise.all([
      getQuantitativeLogs(userId),
      getQualitativeLogs(userId, twoWeeksAgo),
      db.query.chatSummaries.findMany({
        where: eq(chatSummaries.userId, userId),
        orderBy: desc(chatSummaries.periodEnd)
      })
    ]);

    const quantitativeContext = quantitativeLogs
      .map(log => {
        const date = new Date(log.takenAt).toISOString().split('T')[0];
        const effects = log.effects ? 
          `Effects: ${Object.entries(log.effects)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ')}` : 'No effects recorded';

        return `${date}: Supplement: ${log.supplementName}, Dosage: ${log.dosage}, Notes: ${log.notes || 'None'}, ${effects}`;
      })
      .join('\n');

    const recentQualitativeContext = recentLogs
      .map(log => {
        const date = new Date(log.loggedAt).toISOString().split('T')[0];
        return `${date}: ${log.content}`;
      })
      .join('\n');

    const historicalContext = historicalSummaries.length > 0 ? 
      historicalSummaries.map(s => s.summary).join('\n\n') : 'No historical summaries found.';

    const messages = [
      { role: "system", content: QUERY_SYSTEM_PROMPT },
      { role: "user", content: `
User Supplement History (last 30 days):
${quantitativeContext || 'No recent supplement logs.'}

Recent User Observations (last 14 days):
${recentQualitativeContext || 'No recent health notes.'}

Historical Context:
${historicalContext}

User Query:
${userQuery}
` }
    ];

    console.log('Query LLM Context being sent:', JSON.stringify(messages, null, 2));

    return { messages };
  } catch (error) {
    console.error("Error constructing query context:", error);
    return {
      messages: [
        { role: "system", content: QUERY_SYSTEM_PROMPT },
        { role: "user", content: userQuery }
      ]
    };
  }
}
