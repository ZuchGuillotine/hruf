import { SYSTEM_PROMPT } from '../openai';
import { Message } from '../lib/types';
import { db } from '../../db';
import { eq, desc, and, notInArray } from 'drizzle-orm';
import { logger } from '../utils/logger';
import { logSummaries, healthStats, qualitativeLogs } from '../../db/schema';
import { summaryTaskManager } from '../cron/summaryManager';
import { supplementLookupService } from './supplementLookupService';
import { advancedSummaryService } from './advancedSummaryService';
import { debugContext } from '../utils/contextDebugger';
import { labSummaryService } from './labSummaryService';

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

    // Get direct supplement context using the service
    const directSupplementContext = await supplementLookupService.getSupplementContext(userIdNum, userQuery);

    // Get relevant content with error handling and fallback
    logger.info(`Retrieving relevant content with expanded search`);
    let relevantContent = [];

    try {
      relevantContent = await advancedSummaryService.getRelevantSummaries(userIdNum, userQuery, 12);

      // Log what we found
      const contentTypes = {
        summary: relevantContent.filter(item => item.type === 'summary').length,
        qualitative_log: relevantContent.filter(item => item.type === 'qualitative_log').length,
        quantitative_log: relevantContent.filter(item => item.type === 'quantitative_log').length
      };

      logger.info(`Retrieved ${relevantContent.length} relevant items:`, contentTypes);
    } catch (vectorError) {
      logger.error(`Vector retrieval error, falling back to recent summaries:`, {
        error: vectorError instanceof Error ? vectorError.message : String(vectorError),
        stack: vectorError instanceof Error ? vectorError.stack : undefined
      });

      // Fall back to direct database queries for recent content
      relevantContent = await getFallbackRelevantContent(userIdNum);
    }

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

    // Process qualitative logs - with proper filtering
    const qualitativeLogs = relevantContent.filter(item => 
      item.type === 'qualitative_log' && 
      item.type !== 'query' // Explicitly exclude query logs
    );

    qualitativeLogs.forEach(log => {
      let content = log.content;

      try {
        // Attempt to parse as JSON format (chat messages)
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

    // FALLBACK: Add recent summaries if vector search returns insufficient results
    if (relevantContent.filter(item => item.type === 'summary').length < 2) {
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

    // Debug logging
    logger.info(`Context built with:
    - Recent summaries: ${recentSummaryContent ? 'Yes' : 'No'}
    - Historical summaries: ${historicalSummaryContent ? 'Yes' : 'No'}
    - Qualitative logs: ${qualitativeLogContent ? 'Yes' : 'No'}
    - Quantitative logs: ${quantitativeLogContent ? 'Yes' : 'No'}
    - Fallback summaries: ${supplementLogContent ? 'Yes' : 'No'}
    - Direct supplement context: ${directSupplementContext ? 'Yes' : 'No'}`);

        // Get lab results summaries
    let labResultsContext = '';
    try {
      const relevantLabResults = await labSummaryService.findRelevantLabResults(parseInt(userId), userQuery, 3);

      if (relevantLabResults.length > 0) {
        labResultsContext = "User's Lab Test Results:\n";
        for (const lab of relevantLabResults) {
          const labDate = new Date(lab.uploadedAt).toLocaleDateString();
          
          // First try to get OCR text from Google Vision result
          let extractedText = lab.metadata?.ocr?.text;
          
          // If no OCR text, try PDF parsed text
          if (!extractedText) {
            extractedText = lab.metadata?.parsedText;
          }
          
          // Finally try generic extracted text field
          if (!extractedText) {
            extractedText = lab.metadata?.extractedText;
          }

          if (extractedText) {
            logger.info(`Found extracted text for lab ${lab.id}:`, {
              textLength: extractedText.length,
              source: lab.metadata?.ocr ? 'OCR' : 'PDF',
              fileName: lab.fileName
            });
            labResultsContext += `[${labDate}] ${lab.fileName}:\n${extractedText}\n\n`;
          } else if (lab.metadata?.summary) {
            logger.info(`Using summary for lab ${lab.id} - no extracted text found`);
            labResultsContext += `[${labDate}] ${lab.fileName}:\n${lab.metadata.summary}\n\n`;
          } else {
            logger.warn(`No text or summary found for lab ${lab.id}`);
            labResultsContext += `[${labDate}] ${lab.fileName}: Processing lab results...\n\n`;
          }
        }
      }
    } catch (labError) {
      logger.warn(`Failed to fetch lab results for context: ${labError}`);
      // Continue without lab results
    }

    // Construct the final context message
    const messages: Message[] = [
      { role: "system" as const, content: SYSTEM_PROMPT },
      { role: "user" as const, content: `
User Context - Health Statistics:
${healthStatsContext}

${directSupplementContext ? `Direct Supplement Information:\n${directSupplementContext}\n` : ''}

${labResultsContext ? `User Context - Lab Results:\n${labResultsContext}\n` : ''}

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

// Helper function to get fallback content when vector search fails
async function getFallbackRelevantContent(userId: number): Promise<any[]> {
  try {
    const result = [];

    // Get most recent daily summaries
    const recentSummaries = await db
      .select()
      .from(logSummaries)
      .where(
        and(
          eq(logSummaries.userId, userId),
          eq(logSummaries.summaryType, 'daily')
        )
      )
      .orderBy(desc(logSummaries.createdAt))
      .limit(3);

    // Add as summary type
    for (const summary of recentSummaries) {
      result.push({
        ...summary,
        type: 'summary',
        similarity: 0.8
      });
    }

    // Get recent qualitative logs (non-query)
    const recentLogs = await db
      .select()
      .from(qualitativeLogs)
      .where(
        and(
          eq(qualitativeLogs.userId, userId),
          notInArray(qualitativeLogs.type, ['query'])
        )
      )
      .orderBy(desc(qualitativeLogs.createdAt))
      .limit(5);

    // Add as qualitative_log type
    for (const log of recentLogs) {
      result.push({
        ...log,
        type: 'qualitative_log',
        similarity: 0.7
      });
    }

    logger.info(`Fallback content retrieval found ${result.length} items`);
    return result;
  } catch (error) {
    logger.error(`Error in fallback content retrieval:`, error);
    return [];
  }
}