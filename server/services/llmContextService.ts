
// server/services/llmContextService.ts

import { SYSTEM_PROMPT } from "../openai";
import { Message } from "@/lib/types";
import { db } from "../../db";
import { healthStats } from "../../db/schema";
import { eq } from "drizzle-orm";
import { advancedSummaryService } from "./advancedSummaryService";
import { summaryTaskManager } from "../cron/summaryManager";
import logger from "../utils/logger";

/**
 * Constructs context for qualitative feedback chat interactions using our hybrid approach
 * @param userId User ID
 * @param userQuery The user's query text
 * @returns Object containing constructed messages
 */
export async function constructUserContext(userId: string, userQuery: string): Promise<{ messages: Message[] }> {
  try {
    const userIdNum = parseInt(userId);
    if (isNaN(userIdNum)) {
      throw new Error('Invalid user ID');
    }

    logger.info(`Building context for user ${userId} with query: "${userQuery.substring(0, 50)}..."`);
    
    // Check if we need to trigger a real-time summary
    // This helps ensure we have up-to-date summaries before building context
    try {
      await summaryTaskManager.runRealtimeSummary(userIdNum);
    } catch (error) {
      logger.warn(`Real-time summary generation failed but continuing with context building: ${error}`);
    }
    
    // Fetch user's health stats
    const userHealthStats = await db.query.healthStats.findFirst({
      where: eq(healthStats.userId, userIdNum)
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

    // For the feedback chat, we need more comprehensive context about the user's supplement history
    // Use vector search to find relevant summaries and logs based on user query
    logger.info(`Retrieving relevant summaries for user ${userId} with query: "${userQuery.substring(0, 50)}..."`);
    const relevantContent = await advancedSummaryService.getRelevantSummaries(userIdNum, userQuery, 8);
    
    // Log what we found
    const contentTypes = {
      summary: relevantContent.filter(item => item.type === 'summary').length,
      qualitative_log: relevantContent.filter(item => item.type === 'qualitative_log').length,
      quantitative_log: relevantContent.filter(item => item.type === 'quantitative_log').length
    };
    
    logger.info(`Retrieved ${relevantContent.length} relevant items:`, contentTypes);
    
    // Format the relevant content
    let recentSummaryContent = '';
    let historicalSummaryContent = '';
    let qualitativeLogContent = '';
    let quantitativeLogContent = '';
    
    // Current date for determining what's recent vs historical
    const now = new Date();
    const twoWeeksAgo = new Date(now);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    
    // Process summaries
    relevantContent.filter(item => item.type === 'summary').forEach(summary => {
      const dateRange = `${new Date(summary.startDate).toLocaleDateString()} to ${new Date(summary.endDate).toLocaleDateString()}`;
      const summaryEntry = `[${summary.summaryType.toUpperCase()} SUMMARY: ${dateRange}]\n${summary.content}\n\n`;
      
      // Determine if this is a recent or historical summary
      if (new Date(summary.endDate) >= twoWeeksAgo) {
        recentSummaryContent += summaryEntry;
      } else {
        historicalSummaryContent += summaryEntry;
      }
    });
    
    // Process qualitative logs
    relevantContent.filter(item => item.type === 'qualitative_log').forEach(log => {
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
      
      qualitativeLogContent += `[${new Date(log.loggedAt).toLocaleDateString()}] ${content}\n`;
    });
    
    // Process quantitative logs
    relevantContent.filter(item => item.type === 'quantitative_log').forEach(log => {
      const effectsText = log.effects
        ? Object.entries(log.effects)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ')
        : 'No effects recorded';
        
      quantitativeLogContent += `[${new Date(log.takenAt).toLocaleDateString()}] ${log.name} (${log.dosage}): ${effectsText}\n`;
    });

    // Construct the final context message
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `
User Context - Health Statistics:
${healthStatsContext}

User Context - Recent Summaries (last 14 days):
${recentSummaryContent || 'No recent summaries available.'}

User Context - Historical Health Summaries:
${historicalSummaryContent || 'No historical summaries available.'}

User Context - Relevant Qualitative Observations:
${qualitativeLogContent || 'No relevant qualitative observations found.'}

User Context - Relevant Supplement Logs:
${quantitativeLogContent || 'No relevant supplement logs found.'}

User Query:
${userQuery}
` }
    ];

    logger.info(`Context successfully built for user ${userId} with token-efficient approach`);
    
    // Debug the context being sent to the LLM
    const { debugContext } = require('../utils/contextDebugger');
    debugContext(userId, { messages }, 'qualitative');
    
    return { messages };
  } catch (error) {
    logger.error("Error constructing user context:", {
      userId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Fallback to basic prompt on error
    return {
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userQuery }
      ]
    };
  }
}
