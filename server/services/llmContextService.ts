
import { getQuantitativeLogs, getQualitativeLogs } from "./logService";
import { SYSTEM_PROMPT } from "../openai";
import { Message } from "@/lib/types";

export async function constructUserContext(userId: string, userQuery: string): Promise<{ messages: Message[] }> {
  try {
    const [quantitativeLogs, qualitativeLogs] = await Promise.all([
      getQuantitativeLogs(userId),
      getQualitativeLogs(userId)
    ]);

    const quantitativeContext = quantitativeLogs
      .map(log => `${new Date(log.takenAt).toISOString().split('T')[0]}: Effects: ${log.effects || 'None'}, Notes: ${log.notes || 'None'}`)
      .join('\n');

    const qualitativeContext = qualitativeLogs
      .map(log => `${new Date(log.loggedAt).toISOString().split('T')[0]}: ${log.content}`)
      .join('\n');

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `
User Context - Quantitative Logs (last 30 days):
${quantitativeContext || 'No recent quantitative logs.'}

User Context - Qualitative Logs (last 30 days):
${qualitativeContext || 'No recent qualitative logs.'}

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
