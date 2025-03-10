
// server/services/llmContextService_query.ts

import { Message } from "@/lib/types";
import { db } from "../../db";
import { healthStats } from "../../db/schema";
import { eq } from "drizzle-orm";
import { advancedSummaryService } from "./advancedSummaryService";
import logger from "../utils/logger";

// Separate system prompt for general supplement queries
export const QUERY_SYSTEM_PROMPT = `You are an expert assistant specializing in supplement knowledge and health information. 
Your role is to provide accurate, evidence-based information about supplements, their effects, interactions, and best practices.

When answering:
1. Focus on providing factual, scientifically-backed information
2. Specify when something is based on limited evidence or is controversial
3. Avoid making definitive medical claims or prescribing supplements
4. Acknowledge when you don't have enough information to give a complete answer
5. Consider the user's personal health context if provided
6. Think deeply about how supplements may interact with the user's current regimen and provide specific recommendations
7. It is not necessary to advise the user to consult with a healthcare provider, the user is already receiving a disclaimer in static text on the page

If the user has shared their supplement tracking history, you may reference it to provide more personalized context.`;

/**
 * Constructs context for general supplement queries using vector-based retrieval
 * @param userId User ID (null for non-authenticated users)
 * @param userQuery The user's query text
 * @returns Object containing constructed messages
 */
export async function constructQueryContext(userId: number | null, userQuery: string): Promise<{ messages: Message[] }> {
  try {
    // If user is not authenticated, return basic context
    if (userId === null || userId === undefined) {
      logger.info('User not authenticated, returning basic context');
      return {
        messages: [
          { role: "system", content: QUERY_SYSTEM_PROMPT },
          { role: "user", content: userQuery }
        ]
      };
    }

    logger.info(`Building context for authenticated user ${userId}`);
    
    // For authenticated users, use vector search to find relevant summaries and logs
    
    // Fetch user's health stats
    const userHealthStats = await db.query.healthStats.findFirst({
      where: eq(healthStats.userId, userId)
    });
    
    // Format health stats data if available
    const healthStatsContext = userHealthStats ? `
Weight: ${userHealthStats.weight || 'Not provided'} lbs
Height: ${userHealthStats.height || 'Not provided'} inches
Gender: ${userHealthStats.gender || 'Not provided'}
Date of Birth: ${userHealthStats.dateOfBirth || 'Not provided'}
Average Sleep: ${userHealthStats.averageSleep ? `${Math.floor(userHealthStats.averageSleep / 60)}h ${userHealthStats.averageSleep % 60}m` : 'Not provided'}
Allergies: ${userHealthStats.allergies || 'None listed'}
` : 'No health stats data available.';

    // Use vector search to retrieve the most relevant summaries and logs
    const relevantContent = await advancedSummaryService.getRelevantSummaries(userId, userQuery, 5);
    
    // Format the relevant content
    let contextContent = '';
    
    // Process summaries
    const summaries = relevantContent.filter(item => item.type === 'summary');
    if (summaries.length > 0) {
      contextContent += "Recent Summary Information:\n";
      summaries.forEach(summary => {
        const dateRange = `${new Date(summary.startDate).toLocaleDateString()} to ${new Date(summary.endDate).toLocaleDateString()}`;
        contextContent += `[${summary.summaryType.toUpperCase()} SUMMARY: ${dateRange}]\n${summary.content}\n\n`;
      });
    }
    
    // Process qualitative logs
    const qualitativeLogs = relevantContent.filter(item => item.type === 'qualitative_log');
    if (qualitativeLogs.length > 0) {
      contextContent += "Relevant User Observations:\n";
      qualitativeLogs.forEach(log => {
        let content = log.content;
        
        // Try to extract meaningful content from JSON if applicable
        try {
          const parsed = JSON.parse(log.content);
          if (Array.isArray(parsed)) {
            content = parsed
              .filter(msg => msg.role === 'user')
              .map(msg => msg.content)
              .join(' | ');
          }
        } catch (e) {
          // Not JSON, use as is
        }
        
        contextContent += `[${new Date(log.loggedAt).toLocaleDateString()}] ${content}\n`;
      });
      contextContent += '\n';
    }
    
    // Process quantitative logs
    const quantitativeLogs = relevantContent.filter(item => item.type === 'quantitative_log');
    if (quantitativeLogs.length > 0) {
      contextContent += "Relevant Supplement Logs:\n";
      quantitativeLogs.forEach(log => {
        const effectsText = log.effects
          ? Object.entries(log.effects)
              .map(([key, value]) => `${key}: ${value}`)
              .join(', ')
          : 'No effects recorded';
          
        contextContent += `[${new Date(log.takenAt).toLocaleDateString()}] ${log.name} (${log.dosage}): ${effectsText}\n`;
      });
      contextContent += '\n';
    }
    
    // If no relevant content was found, mention this
    if (contextContent === '') {
      contextContent = "No relevant supplement history found for this query.\n";
    }

    // Construct the final context message
    const messages = [
      { role: "system", content: QUERY_SYSTEM_PROMPT },
      { role: "user", content: `
User Health Profile:
${healthStatsContext}

${contextContent}

User Query:
${userQuery}
` }
    ];

    logger.info(`Context built successfully for user ${userId}`);
    
    return { messages };
  } catch (error) {
    logger.error(`Error constructing query context for user ${userId}:`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
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
