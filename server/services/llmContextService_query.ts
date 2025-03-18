/**
    * @description      : 
    * @author           : 
    * @group            : 
    * @created          : 13/03/2025 - 16:16:27
    * 
    * MODIFICATION LOG
    * - Version         : 1.0.0
    * - Date            : 13/03/2025
    * - Author          : 
    * - Modification    : 
    **/
// server/services/llmContextService_query.ts

import { Message } from "@/lib/types";
import { db } from "../../db";
import { healthStats, supplementLogs, qualitativeLogs, logSummaries, supplements } from "../../db/schema";
import { eq, count, and, gte, desc } from "drizzle-orm";
import { advancedSummaryService } from "./advancedSummaryService";
import { summaryTaskManager } from "../cron/summaryManager";
import { supplementLookupService } from "./supplementLookupService";
import logger from "../utils/logger";
import { debugContext } from '../utils/contextDebugger';

/**
 * Check if the user has any logs or summaries in the database
 * @param userId User ID
 * @returns Boolean indicating if user has any logs
 */
async function checkUserHasAnyLogs(userId: number): Promise<boolean> {
  try {
    // Check for supplement logs
    const [supplementCount] = await db
      .select({ count: count() })
      .from(supplementLogs)
      .where(eq(supplementLogs.userId, userId));

    // Check for qualitative logs
    const [qualitativeCount] = await db
      .select({ count: count() })
      .from(qualitativeLogs)
      .where(eq(qualitativeLogs.userId, userId));

    // Check for summaries
    const [summaryCount] = await db
      .select({ count: count() })
      .from(logSummaries)
      .where(eq(logSummaries.userId, userId));

    logger.info(`User ${userId} has ${supplementCount?.count || 0} supplement logs, ${qualitativeCount?.count || 0} qualitative logs, and ${summaryCount?.count || 0} summaries`);

    return (
      (supplementCount?.count || 0) > 0 || 
      (qualitativeCount?.count || 0) > 0 || 
      (summaryCount?.count || 0) > 0
    );
  } catch (error) {
    logger.error(`Error checking if user has logs:`, error);
    return false;
  }
}

// Separate system prompt for general supplement queries
//This import is moved to the updated function.
//export const QUERY_SYSTEM_PROMPT = `You are an expert assistant specializing in supplement knowledge and health information. 
//Your role is to provide accurate, evidence-based information about supplements, their effects, interactions, and best practices.
//
//When answering:
//1. Focus on providing factual, scientifically-backed information
//2. Specify when something is based on limited evidence or is controversial
//3. Avoid making definitive medical claims or prescribing supplements
//4. Acknowledge when you don't have enough information to give a complete answer
//5. Consider the user's personal health context if provided
//6. Think deeply about how supplements may interact with the user's current regimen and provide specific recommendations
//7. It is not necessary to advise the user to consult with a healthcare provider, the user is already receiving a disclaimer in static text on the page
//
//If the user has shared their supplement tracking history, you may reference it to provide more personalized context.`;

import { Message } from '../lib/types';
import { QUERY_SYSTEM_PROMPT } from '../openai';
import { db } from '../../db';
import logger from '../utils/logger';
import { desc, eq, and, gte } from 'drizzle-orm';
import { logSummaries, supplementLogs, supplements, healthStats } from '../../db/schema';
import { debugContext } from '../utils/contextDebugger';
import { summaryTaskManager } from './summaryTaskManager';
import { supplementLookupService } from './supplementLookupService';
import { advancedSummaryService } from './advancedSummaryService';

export async function constructQueryContext(userId: number | null, userQuery: string): Promise<{ messages: Message[] }> {
  try {
    // If user is not authenticated, return basic context
    if (userId === null || userId === undefined) {
      logger.info('User not authenticated, returning basic context');
      return {
        messages: [
          { role: "system" as const, content: QUERY_SYSTEM_PROMPT },
          { role: "user" as const, content: userQuery }
        ]
      };
    }

    logger.info(`Building query context for authenticated user ${userId}`);

    // Trigger real-time summary for consistency
    try {
      await summaryTaskManager.runRealtimeSummary(userId);
      logger.info('Real-time summary triggered for query context');
    } catch (summaryError) {
      logger.warn(`Real-time summary failed for query context: ${summaryError}`);
    }

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

    // Get direct supplement context
    const directSupplementContext = await supplementLookupService.getSupplementContext(userId, userQuery);

    // Build context content
    let contextContent = '';

    try {
      // Get recent supplement pattern summaries
      const recentSummaries = await db
        .select()
        .from(logSummaries)
        .where(
          and(
            eq(logSummaries.userId, userId),
            eq(logSummaries.summaryType, 'supplement_pattern')
          )
        )
        .orderBy(desc(logSummaries.createdAt))
        .limit(2);

      if (recentSummaries.length > 0) {
        contextContent += "Recent Supplement Patterns:\n";
        recentSummaries.forEach(summary => {
          const dateRange = `${new Date(summary.startDate).toLocaleDateString()} to ${new Date(summary.endDate).toLocaleDateString()}`;
          contextContent += `[${dateRange}]\n${summary.content}\n\n`;
        });
      }

      // Get daily summaries for the last 3 days
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const dailySummaries = await db
        .select()
        .from(logSummaries)
        .where(
          and(
            eq(logSummaries.userId, userId),
            eq(logSummaries.summaryType, 'daily'),
            gte(logSummaries.startDate, threeDaysAgo)
          )
        )
        .orderBy(desc(logSummaries.startDate))
        .limit(3);

      if (dailySummaries.length > 0) {
        contextContent += "Recent Daily Summaries:\n";
        dailySummaries.forEach(summary => {
          const date = new Date(summary.startDate).toLocaleDateString();
          contextContent += `[${date}]\n${summary.content}\n\n`;
        });
      }

      // Use vector search for relevant content
      logger.info(`Retrieving relevant logs for user ${userId}`);

      // Try vector search with error handling
      let relevantContent = [];
      try {
        relevantContent = await advancedSummaryService.getRelevantSummaries(userId, userQuery, 5);

        // Log what we found
        const contentTypes = {
          summary: relevantContent.filter(item => item.type === 'summary').length,
          qualitative_log: relevantContent.filter(item => item.type === 'qualitative_log').length,
          quantitative_log: relevantContent.filter(item => item.type === 'quantitative_log').length
        };

        logger.info(`Retrieved ${relevantContent.length} relevant items:`, contentTypes);
      } catch (vectorError) {
        logger.error(`Vector search failed for query context, using fallback:`, vectorError);
        // Use fallback method (continue with empty relevantContent array)
      }

      // Process summaries from relevant content
      const summaries = relevantContent.filter(item => item.type === 'summary');
      if (summaries.length > 0) {
        contextContent += "Relevant Summary Information:\n";
        summaries.forEach(summary => {
          const dateRange = `${new Date(summary.startDate).toLocaleDateString()} to ${new Date(summary.endDate).toLocaleDateString()}`;
          contextContent += `[${summary.summaryType.toUpperCase()} SUMMARY: ${dateRange}]\n${summary.content}\n\n`;
        });
      }

      // Process qualitative logs - IMPORTANT: Only include non-query logs
      const qualitativeLogs = relevantContent.filter(item => 
        item.type === 'qualitative_log' && 
        item.type !== 'query' // Explicitly filter out query logs
      );

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

      // If no relevant content was found, fetch recent supplement logs as fallback
      if (contextContent === '') {
        logger.info('No relevant content found, fetching recent supplement logs as fallback');

        const recentDate = new Date();
        recentDate.setDate(recentDate.getDate() - 7);

        const recentLogs = await db
          .select({
            name: supplements.name,
            dosage: supplements.dosage,
            takenAt: supplementLogs.takenAt,
            effects: supplementLogs.effects,
            notes: supplementLogs.notes
          })
          .from(supplementLogs)
          .leftJoin(supplements, eq(supplements.id, supplementLogs.supplementId))
          .where(
            and(
              eq(supplementLogs.userId, userId),
              gte(supplementLogs.takenAt, recentDate)
            )
          )
          .orderBy(desc(supplementLogs.takenAt))
          .limit(10);

        if (recentLogs.length > 0) {
          contextContent = "Recent Supplement History (Last 7 Days):\n";
          recentLogs.forEach(log => {
            const effectsText = log.effects
              ? Object.entries(log.effects)
                  .map(([key, value]) => `${key}: ${value}`)
                  .join(', ')
              : 'No effects recorded';

            contextContent += `[${new Date(log.takenAt).toLocaleDateString()}] ${log.name} (${log.dosage}): ${effectsText}\n`;
          });
        } else {
          contextContent = "No supplement history found for this query.\n";
        }
      }
    } catch (contentError) {
      logger.error(`Error building query context content:`, contentError);
      contextContent = "Error retrieving supplement history. Proceeding with limited context.\n";
    }

    // Construct the final context message
    const messages: Message[] = [
      { role: "system" as const, content: QUERY_SYSTEM_PROMPT },
      { role: "user" as const, content: `
User Health Profile:
${healthStatsContext}

${directSupplementContext ? `Direct Supplement Information:\n${directSupplementContext}\n` : ''}

${contextContent}

User Query:
${userQuery}
` }
    ];

    logger.info(`Query context built successfully for user ${userId}`);

    // Debug the context being sent to the LLM
    const context = { messages };
    await debugContext(userId.toString(), context, 'query');

    return context;
  } catch (error) {
    logger.error(`Error in constructQueryContext:`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      userId: userId || 'anonymous',
      timestamp: new Date().toISOString()
    });

    // Fallback to basic context
    return {
      messages: [
        { role: "system" as const, content: QUERY_SYSTEM_PROMPT },
        { role: "user" as const, content: userQuery }
      ]
    };
  }
}