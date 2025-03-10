// server/services/advancedSummaryService.ts (summmarizes quantitative logs)

import OpenAI from "openai";
import { db } from "../../db";
import { logSummaries, qualitativeLogs, supplementLogs, supplements } from "../../db/schema";
import { embeddingService } from "./embeddingService";
import { eq, and, between, sql } from "drizzle-orm";
import logger from "../utils/logger";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Improved summary service that consolidates logs using OpenAI
 */
class AdvancedSummaryService {
  // Constants for summarization
  private SUMMARY_MODEL = "gpt-4o-mini";
  private MAX_TOKEN_LIMIT = 16000; // Conservative token limit for input context
  private MAX_LOGS_PER_REQUEST = 50; // Maximum number of logs to summarize in one request

  // System prompt for daily summarization
  private DAILY_SUMMARY_PROMPT = `
  You are an expert supplement analyst tasked with summarizing a user's daily supplement logs and qualitative experiences.

  Guidelines:
  1. Focus ONLY on significant changes or notable experiences (new supplements, dosage changes, unique effects)
  2. Consolidate redundant information and eliminate repetition
  3. Highlight correlations between supplement intake and reported effects
  4. Include both quantitative data (supplements taken) and qualitative observations
  5. Organize information clearly with timestamps where relevant
  6. Maintain medical accuracy and precision in summarizing health information
  7. Keep the summary concise but comprehensive, focusing on changes and patterns

  Your summary should help the user understand their supplement regimen's effects and changes over time.
  `;

  /**
   * Generates summary for a single day's logs
   * @param userId User ID
   * @param date Date to summarize
   * @returns The created summary ID
   */
  async generateDailySummary(userId: number, date: Date): Promise<number | null> {
    try {
      // Set date boundaries to ensure we get all logs for the specified date
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      logger.info(`Generating daily summary for user ${userId} on ${date.toISOString().split('T')[0]}`);

      // Fetch all supplement logs for the day
      const supplementLogEntries = await db
        .select({
          id: supplementLogs.id,
          supplementId: supplementLogs.supplementId,
          supplementName: supplements.name,
          dosage: supplements.dosage,
          frequency: supplements.frequency,
          takenAt: supplementLogs.takenAt,
          notes: supplementLogs.notes,
          effects: supplementLogs.effects
        })
        .from(supplementLogs)
        .leftJoin(supplements, eq(supplements.id, supplementLogs.supplementId))
        .where(
          and(
            eq(supplementLogs.userId, userId),
            between(supplementLogs.takenAt, startOfDay, endOfDay)
          )
        );

      // Fetch all qualitative logs for the day
      const qualitativeLogEntries = await db
        .select()
        .from(qualitativeLogs)
        .where(
          and(
            eq(qualitativeLogs.userId, userId),
            between(qualitativeLogs.loggedAt, startOfDay, endOfDay)
          )
        );

      // Check if we have enough data to summarize
      if (supplementLogEntries.length === 0 && qualitativeLogEntries.length === 0) {
        logger.info(`No logs found for user ${userId} on ${date.toISOString().split('T')[0]}`);
        return null;
      }

      // Format logs for summarization
      const formattedSupplementLogs = supplementLogEntries.map(log => {
        const timestamp = new Date(log.takenAt).toLocaleTimeString();
        const effectsText = log.effects 
          ? Object.entries(log.effects)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ')
          : 'No effects recorded';

        return `[${timestamp}] Supplement: ${log.supplementName}, Dosage: ${log.dosage}, Notes: ${log.notes || 'None'}, Effects: ${effectsText}`;
      }).join('\n');

      const formattedQualitativeLogs = qualitativeLogEntries.map(log => {
        const timestamp = new Date(log.loggedAt).toLocaleTimeString();

        // Extract chat content if available
        let content = log.content;
        try {
          // Check if content is JSON (chat history)
          const parsed = JSON.parse(log.content);
          if (Array.isArray(parsed)) {
            // Extract only user messages from chat history
            content = parsed
              .filter(msg => msg.role === 'user')
              .map(msg => msg.content)
              .join('\n');
          }
        } catch (e) {
          // Not JSON, use as is
        }

        return `[${timestamp}] ${content}`;
      }).join('\n');

      // Construct the input for the summarization model
      const dateStr = date.toISOString().split('T')[0];
      const summaryInput = `
      Date: ${dateStr}

      Supplement Logs:
      ${formattedSupplementLogs || 'No supplement logs for this day.'}

      Qualitative Experiences:
      ${formattedQualitativeLogs || 'No qualitative logs for this day.'}
      `;

      // Generate summary using OpenAI
      const completion = await openai.chat.completions.create({
        model: this.SUMMARY_MODEL,
        messages: [
          {
            role: "system",
            content: this.DAILY_SUMMARY_PROMPT
          },
          {
            role: "user",
            content: summaryInput
          }
        ],
        max_tokens: 1000
      });

      const summaryContent = completion.choices[0]?.message?.content?.trim() || 'No summary generated.';

      // Store summary in database
      const [summary] = await db
        .insert(logSummaries)
        .values({
          userId,
          content: summaryContent,
          summaryType: 'daily',
          startDate: startOfDay,
          endDate: endOfDay,
          metadata: {
            supplementCount: supplementLogEntries.length,
            qualitativeLogCount: qualitativeLogEntries.length,
            // Extract any significant changes mentioned in the summary
            significantChanges: this.extractSignificantChanges(summaryContent)
          }
        })
        .returning();

      // Create embedding for the summary
      if (summary) {
        await embeddingService.createSummaryEmbedding(summary.id, summaryContent);
      }

      logger.info(`Generated daily summary for user ${userId} on ${dateStr} with ID ${summary?.id}`);
      return summary?.id || null;

    } catch (error) {
      logger.error(`Error generating daily summary for user ${userId}:`, error);
      return null;
    }
  }

  /**
   * Generate weekly summary from daily summaries
   * @param userId User ID
   * @param startDate Start date of the week
   * @param endDate End date of the week
   * @returns The created summary ID
   */
  async generateWeeklySummary(userId: number, startDate: Date, endDate: Date): Promise<number | null> {
    try {
      // Fetch all daily summaries for the week
      const dailySummaries = await db
        .select()
        .from(logSummaries)
        .where(
          and(
            eq(logSummaries.userId, userId),
            eq(logSummaries.summaryType, 'daily'),
            between(logSummaries.startDate, startDate, endDate)
          )
        )
        .orderBy(logSummaries.startDate);

      if (dailySummaries.length === 0) {
        logger.info(`No daily summaries found for user ${userId} between ${startDate.toISOString()} and ${endDate.toISOString()}`);
        return null;
      }

      // Construct input for weekly summarization
      const weeklyInput = dailySummaries.map(summary => {
        const date = summary.startDate.toISOString().split('T')[0];
        return `Date: ${date}\n${summary.content}`;
      }).join('\n\n');

      // Weekly summarization prompt
      const weeklyPrompt = `
      You are tasked with creating a weekly summary of a user's supplement regimen and experiences.

      Guidelines:
      1. Identify patterns, trends, and correlations across the week
      2. Highlight significant changes that occurred during the week
      3. Note any consistent effects or experiences from specific supplements
      4. Summarize overall adherence to the supplement regimen
      5. Focus on the most important information, eliminating redundancy
      6. Organize the summary in a clear, readable format

      The input contains daily summaries - create a concise weekly overview.
      `;

      // Generate summary using OpenAI
      const completion = await openai.chat.completions.create({
        model: this.SUMMARY_MODEL,
        messages: [
          {
            role: "system",
            content: weeklyPrompt
          },
          {
            role: "user",
            content: weeklyInput
          }
        ],
        max_tokens: 1000
      });

      const summaryContent = completion.choices[0]?.message?.content?.trim() || 'No summary generated.';

      // Store weekly summary
      const [summary] = await db
        .insert(logSummaries)
        .values({
          userId,
          content: summaryContent,
          summaryType: 'weekly',
          startDate,
          endDate,
          metadata: {
            dailySummaryCount: dailySummaries.length,
            significantChanges: this.extractSignificantChanges(summaryContent)
          }
        })
        .returning();

      // Create embedding for the summary
      if (summary) {
        await embeddingService.createSummaryEmbedding(summary.id, summaryContent);
      }

      logger.info(`Generated weekly summary for user ${userId} from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]} with ID ${summary?.id}`);
      return summary?.id || null;

    } catch (error) {
      logger.error(`Error generating weekly summary for user ${userId}:`, error);
      return null;
    }
  }

  /**
   * Extracts significant changes mentioned in a summary
   */
  private extractSignificantChanges(summary: string): string[] {
    const changes: string[] = [];

    // Look for indicators of significant changes
    const changeIndicators = [
      'increased', 'decreased', 'started', 'stopped', 'changed',
      'new supplement', 'dosage change', 'notable', 'significant',
      'improvement', 'worsening', 'side effect'
    ];

    // Extract sentences containing change indicators
    const sentences = summary.split(/[.!?]\s+/);
    for (const sentence of sentences) {
      if (changeIndicators.some(indicator => sentence.toLowerCase().includes(indicator))) {
        // Clean up the sentence and add to changes
        const cleanSentence = sentence.trim().replace(/^\s*[-•]\s*/, '');
        if (cleanSentence && !changes.includes(cleanSentence)) {
          changes.push(cleanSentence);
        }
      }
    }

    return changes;
  }

  /**
   * Process daily summaries for all users for a specific date
   * @param date Date to process
   */
  async processDailySummaries(date: Date = new Date()): Promise<void> {
    try {
      // Get all users with logs on the specified date
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // Find users with logs on this date
      const usersWithLogs = await db.execute(sql`
        SELECT DISTINCT user_id
        FROM (
          SELECT user_id FROM supplement_logs 
          WHERE taken_at BETWEEN ${startOfDay} AND ${endOfDay}
          UNION
          SELECT user_id FROM qualitative_logs 
          WHERE logged_at BETWEEN ${startOfDay} AND ${endOfDay}
        ) AS logs
      `);

      logger.info(`Found ${usersWithLogs.length} users with logs on ${date.toISOString().split('T')[0]}`);