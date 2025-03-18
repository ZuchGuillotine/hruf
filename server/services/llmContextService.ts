/**
    * @description      : 
    * @author           : 
    * @group            : 
    * @created          : 13/03/2025 - 16:10:58
    * 
    * MODIFICATION LOG
    * - Version         : 1.0.0
    * - Date            : 13/03/2025
    * - Author          : 
    * - Modification    : 
**/
// server/services/llmContextService.ts

import { SYSTEM_PROMPT } from "../openai";
import { Message } from "@/lib/types";
import { db } from "../../db";
import { healthStats, logSummaries } from "../../db/schema";
import { eq, desc, and } from "drizzle-orm";
import { advancedSummaryService } from "./advancedSummaryService";
import { summaryTaskManager } from "../cron/summaryManager";
import { supplementLookupService } from "./supplementLookupService";
import logger from "../utils/logger";
import { debugContext } from '../utils/contextDebugger';
import { qualitativeLogs } from '../../db/schema';


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
    try {
      await summaryTaskManager.runRealtimeSummary(userIdNum);
      logger.info('Real-time summary successfully triggered');
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

    // Get direct supplement context using the new service
    const directSupplementContext = await supplementLookupService.getSupplementContext(userIdNum, userQuery);

    // Get relevant qualitative chat logs
    const qualitativeLogs = await db
      .select()
      .from(qualitativeLogs)
      .where(
        and(
          eq(qualitativeLogs.userId, userIdNum),
          eq(qualitativeLogs.type, 'chat')
        )
      )
      .orderBy(desc(qualitativeLogs.loggedAt))
      .limit(5);

    const qualitativeContext = qualitativeLogs.length > 0 
      ? `Recent Qualitative Observations:\n${qualitativeLogs.map(log => {
          const date = new Date(log.loggedAt).toLocaleDateString();
          return `[${date}] ${log.content}`;
        }).join('\n')}`
      : '';

    // ENHANCEMENT: Increase the number of relevant summaries retrieved
    logger.info(`Retrieving relevant summaries with expanded search`);
    const relevantContent = await advancedSummaryService.getRelevantSummaries(userIdNum, userQuery, 12);

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
    let supplementLogContent = '';

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

    // ENHANCEMENT: Add fallback to get recent summaries if vector search returns insufficient results
    if (relevantContent.filter(item => item.type === 'summary').length < 3) {
      logger.info('Insufficient vector search results, fetching recent logs as fallback');

      // Get the most recent summaries regardless of relevance
      const recentSummaries = await db
        .select()
        .from(logSummaries)
        .where(eq(logSummaries.userId, userIdNum))
        .orderBy(desc(logSummaries.createdAt))
        .limit(5);

      // Process recent summaries to add their content
      for (const summary of recentSummaries) {
        const dateRange = `${new Date(summary.startDate).toLocaleDateString()} to ${new Date(summary.endDate).toLocaleDateString()}`;
        supplementLogContent += `[${summary.summaryType.toUpperCase()} SUMMARY: ${dateRange}]\n${summary.content}\n\n`;
      }

      logger.info(`Added ${recentSummaries.length} recent summaries as fallback context`);
    }

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

    // Debug logging enhancements
    logger.info(`Context built with:
    - Recent summaries: ${recentSummaryContent ? 'Yes' : 'No'}
    - Historical summaries: ${historicalSummaryContent ? 'Yes' : 'No'}
    - Qualitative logs: ${qualitativeLogContent ? 'Yes' : 'No'}
    - Quantitative logs: ${quantitativeLogContent ? 'Yes' : 'No'}
    - Fallback summaries: ${supplementLogContent ? 'Yes' : 'No'}
    - Direct supplement context: ${directSupplementContext ? 'Yes' : 'No'}`);

    // Construct the final context message
    const messages: Message[] = [
      { role: "system" as const, content: SYSTEM_PROMPT },
      { role: "user" as const, content: `
User Context - Health Statistics:
${healthStatsContext}

${directSupplementContext ? `Direct Supplement Information:\n${directSupplementContext}\n` : ''}

User Context - Recent Summaries (last 14 days):
${recentSummaryContent || 'No recent summaries available.'}

User Context - Historical Health Summaries:
${historicalSummaryContent || 'No historical summaries available.'}

User Context - Relevant Qualitative Observations:
${qualitativeLogContent || 'No relevant qualitative observations found.'}

User Context - Relevant Supplement Logs:
${quantitativeLogContent || supplementLogContent || 'No relevant supplement logs found.'}

User Query:
${userQuery}
` }
    ];

    logger.info(`Context successfully built for user ${userId} with token-efficient approach`);

    const context = { messages };

    // Debug log the context
    const { debugContext } = await import('../utils/contextDebugger');
    await debugContext(userId, context, 'qualitative');

    return context;
  } catch (error) {
    logger.error("Error constructing user context:", {
      userId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });

    // Fallback to basic prompt on error
    return {
      messages: [
        { role: "system" as const, content: SYSTEM_PROMPT },
        { role: "user" as const, content: userQuery }
      ]
    };
  }
}

// Placeholder for debugQualitativeChat function.  Replace with actual implementation.
async function debugQualitativeChat(userId: string, messages: Message[], debugInfo: any) {
  logger.debug(`Qualitative Chat Debug: userId=${userId}, chatType=${debugInfo.chatType}, messagePreview=${debugInfo.messagePreview}, contextComponents=${debugInfo.contextComponents}, messages=${JSON.stringify(messages, null, 2)}`);
}