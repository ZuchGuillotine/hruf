import { getQuantitativeLogs, getQualitativeLogs } from "./logService";
import { Message } from "@/lib/types";
import { db } from "../../db";
import { chatSummaries, healthStats } from "../../db/schema";
import { eq, desc } from "drizzle-orm";

// Separate system prompt for general supplement queries
export const QUERY_SYSTEM_PROMPT = 
  'You are an expert advisor in supplementation, health, wellness, and human molecular biology. Your role is to provide evidence-based, scientifically grounded insights regarding supplement use, dietary needs, and potential interactions to help optimize the users health
When responding to user queries:
  • **Role & Expertise:**  
  – Act as a knowledgeable professional specializing in supplementation, wellness, and human molecular biology.  
  – Use current scientific research and reliable evidence to guide your answers.
  • **Utilizing Context:**  
  – If the user provides health statistics, quantitative supplement intake logs, or qualitative supplement feedback, incorporate this context to tailor your response to their specific history and needs.  
  – If no personal context is provided, offer a comprehensive, general expert response and subtly suggest that signing up for StackTracker can enable more personalized recommendations.

  • **Response Guidelines:**  
  – Focus on providing factual, scientifically-backed information.  
  – Clearly indicate when the evidence is limited, controversial, or evolving.  
  – Acknowledge if there is insufficient information to deliver a complete answer.  
  – Consider potential interactions with the users current regimen based on the available context.  
  – Avoid definitive medical claims or instructions to take or avoid any supplement.  
  – Do not include additional warnings about medical advice or prompt the user to consult a doctor.

  • **Content Style & Length:**  
  – Maintain clarity, balance, and neutrality in your responses.  
  – Ensure that the response does not exceed 700 words.  
  – Provide information and recommendations strictly based on available evidence and the user’s data (if provided), while encouraging users to explore StackTracker for deeper insights.

  Your goal is to empower users with reliable, objective, and personalized information to help them make informed decisions about their supplement and wellness regimen, without directly advising them on specific actions.'
    ;

// Constructs context for general supplement queries
export async function constructQueryContext(userId: number | null, userQuery: string): Promise<{ messages: Message[] }> {
  try {
    // If user is not authenticated, return basic context
    if (userId === null || userId === undefined) {
      console.log('User not authenticated, returning basic context:', {
        isAuthenticated: false,
        userId: null,
        hasSystemPrompt: true,
        timestamp: new Date().toISOString()
      });

      return {
        messages: [
          { role: "system", content: QUERY_SYSTEM_PROMPT },
          { role: "user", content: userQuery }
        ]
      };
    }

    console.log('Building context for authenticated user:', {
      userId,
      timestamp: new Date().toISOString()
    });

    // For authenticated users, include their supplement history and preferences
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    // Fetch both quantitative and qualitative data, plus health stats
    const [quantitativeLogs, recentLogs, historicalSummaries, userHealthStats] = await Promise.all([
      getQuantitativeLogs(userId),
      getQualitativeLogs(userId, twoWeeksAgo),
      db.query.chatSummaries.findMany({
        where: eq(chatSummaries.userId, userId),
        orderBy: desc(chatSummaries.periodEnd)
      }),
      db.query.healthStats.findFirst({
        where: eq(healthStats.userId, userId)
      })
    ]);

    // Format health stats data if available
    const healthStatsContext = userHealthStats ? `
Weight: ${userHealthStats.weight || 'Not provided'} lbs
Height: ${userHealthStats.height || 'Not provided'} inches
Gender: ${userHealthStats.gender || 'Not provided'}
Date of Birth: ${userHealthStats.dateOfBirth || 'Not provided'}
Average Sleep: ${userHealthStats.averageSleep ? `${Math.floor(userHealthStats.averageSleep / 60)}h ${userHealthStats.averageSleep % 60}m` : 'Not provided'}
Allergies: ${userHealthStats.allergies || 'None listed'}
` : 'No health stats data available.';

    // Format supplement logs
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

    // Format qualitative logs
    const recentQualitativeContext = recentLogs
      .map(log => {
        const date = new Date(log.loggedAt).toISOString().split('T')[0];
        return `${date}: ${log.content}`;
      })
      .join('\n');

    // Format historical summaries
    const historicalContext = historicalSummaries.length > 0 ? 
      historicalSummaries.map(s => s.summary).join('\n\n') : 'No historical summaries found.';

    const messages = [
      { role: "system", content: QUERY_SYSTEM_PROMPT },
      { role: "user", content: `
User Health Profile:
${healthStatsContext}

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

    console.log('Context built successfully:', {
      userId,
      hasHealthStats: !!userHealthStats,
      hasSupplementLogs: quantitativeLogs.length > 0,
      hasQualitativeLogs: recentLogs.length > 0,
      hasSummaries: historicalSummaries.length > 0,
      timestamp: new Date().toISOString()
    });

    return { messages };
  } catch (error) {
    console.error("Error constructing query context:", {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });

    // Fallback to basic context on error
    return {
      messages: [
        { role: "system", content: QUERY_SYSTEM_PROMPT },
        { role: "user", content: userQuery }
      ]
    };
  }
}