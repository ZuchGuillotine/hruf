
import { getQuantitativeLogs, getQualitativeLogs } from "./logService";
import { SYSTEM_PROMPT } from "../openai";
import { Message } from "@/lib/types";

// Constructs context for qualitative feedback chat interactions
// This service specifically handles context for supplement experience discussions
export async function constructUserContext(userId: string, userQuery: string): Promise<{ messages: Message[] }> {
  try {
    // Fetch both quantitative and qualitative data to provide complete context for feedback discussions
    const [quantitativeLogs, qualitativeLogs] = await Promise.all([
      getQuantitativeLogs(userId),
      getQualitativeLogs(userId)
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

    const qualitativeContext = qualitativeLogs
      .map(log => {
        const date = new Date(log.loggedAt).toISOString().split('T')[0];
        const metadata = log.metadata ? ` (${JSON.stringify(log.metadata)})` : '';
        return `${date}: ${log.content}${metadata}`;
      })
      .join('\n');

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `
User Context - Supplement Log History (last 30 days):
${quantitativeContext || 'No recent supplement logs.'}

User Context - Health Notes and Observations (last 30 days):
${qualitativeContext || 'No recent health notes.'}

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
