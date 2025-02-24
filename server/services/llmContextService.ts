import { getQuantitativeLogs, getQualitativeLogs } from "./logService";
import { SYSTEM_PROMPT } from "../openai";
import { Message } from "@/lib/types";
import { db } from "../../db";
import { chatSummaries } from "../../db/schema";
import { eq, desc } from "drizzle-orm";

// Constructs context for qualitative feedback chat interactions
// This service specifically handles context for supplement experience discussions
export async function constructUserContext(userId: string, userQuery: string): Promise<{ messages: Message[] }> {
  try {
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    // Fetch both quantitative and qualitative data to provide complete context for feedback discussions
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
        const metadata = log.metadata ? ` (${JSON.stringify(log.metadata)})` : '';
        return `${date}: ${log.content}${metadata}`;
      })
      .join('\n');

    const historicalContext = historicalSummaries.length > 0 ? 
      historicalSummaries.map(s => s.summary).join('\n\n') : 'No historical summaries found.';


    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `
User Context - Supplement Log History (last 30 days):
${quantitativeContext || 'No recent supplement logs.'}

User Context - Recent Health Notes and Observations (last 14 days):
${recentQualitativeContext || 'No recent health notes.'}

User Context - Summarized Health Notes and Observations (older than 14 days):
${historicalContext}

User Query:
${userQuery}
` }
    ];

    console.log('LLM Context being sent:', JSON.stringify(messages, null, 2));

    return { messages };
  } catch (error) {
    console.error("Error constructing user context:", error);
    return {
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userQuery }
      ]
    };
  }
}