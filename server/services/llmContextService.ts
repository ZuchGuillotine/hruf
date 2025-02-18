
import { getQuantitativeLogs, getQualitativeLogs } from "./logService";
import { SYSTEM_PROMPT } from "../openai";

export async function constructUserContext(userId: string, userQuery: string) {
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

  return {
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `
User Context - Quantitative Logs (last 30 days):
${quantitativeContext || 'No recent quantitative logs.'}

User Context - Qualitative Logs (last 30 days):
${qualitativeContext || 'No recent qualitative logs.'}

User Query:
${userQuery}
` }
    ]
  };
}
