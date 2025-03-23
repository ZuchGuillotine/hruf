// server/services/labSummaryService.ts
import OpenAI from "openai";
import { db } from "../../db";
import { labResults } from "../../db/schema";
import { and, eq, desc } from "drizzle-orm";
import embeddingService from "./embeddingService";
import logger from "../utils/logger";
import path from "path";
import fs from "fs";
import { fileTypeFromBuffer } from "file-type";
// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

class LabSummaryService {
  // Constants for summarization
  private SUMMARY_MODEL = "gpt-4o-mini";
  private MAX_TOKEN_LIMIT = 16000; // Conservative token limit for input context
  private MAX_LABS_PER_REQUEST = 50; // Maximum number of labs to summarize in one request

  // System prompt for lab result summarization
  private LAB_SUMMARY_PROMPT = `
  You are a medical assistant helping to summarize lab results. Focus on:

  1. Highlighting key measurements and their values
  2. Noting any abnormal values (high or low) and their significance
  3. Identifying trends if multiple lab results are provided
  4. Extracting the test date and type of lab (blood work, urine analysis, etc.)
  5. Being concise yet comprehensive about important health markers

  Format the summary in a clear, structured way that prioritizes the most clinically significant findings.
  `;

  /**
   * Summarizes a lab result file
   * @param labResultId ID of the lab result to summarize
   * @returns The summary content or null if unsuccessful
   */
  async summarizeLabResult(labResultId: number): Promise<string | null> {
    try {
      // Fetch lab result from database
      const [labResult] = await db
        .select()
        .from(labResults)
        .where(eq(labResults.id, labResultId))
        .limit(1);

      if (!labResult) {
        logger.error(`Lab result with ID ${labResultId} not found`);
        return null;
      }

      // Get the file path
      const filePath = path.join(process.cwd(), labResult.fileUrl);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        logger.error(`Lab result file not found at path: ${filePath}`);
        return null;
      }

      // Extract text content based on file type
      const fileBuffer = fs.readFileSync(filePath);
      const fileType = await fileTypeFromBuffer(fileBuffer);

      let textContent = "";

      // Process different file types
      if (labResult.fileType === 'application/pdf' || (fileType && fileType.mime === 'application/pdf')) {
        try {
          // Parse PDF to text using dynamic import and absolute file path
          const { default: pdfParse } = await import('pdf-parse');
          const filePath = path.join(process.cwd(), labResult.fileUrl);
          const fileBuffer = fs.readFileSync(filePath);
          const pdfData = await pdfParse(fileBuffer);
          textContent = pdfData.text;
          
          // Generate summary using OpenAI
          const completion = await openai.chat.completions.create({
            model: this.SUMMARY_MODEL,
            messages: [
              {
                role: "system",
                content: this.LAB_SUMMARY_PROMPT
              },
              {
                role: "user",
                content: `Here is a lab result to summarize:\n\n${textContent}`
              }
            ],
            max_tokens: 1000
          });
          
          return completion.choices[0]?.message?.content?.trim() || 'No summary generated.';
        } catch (error) {
          logger.error(`Error parsing PDF: ${error}`);
          return null;
        }
      } else if (
        labResult.fileType.startsWith('image/') ||
        (fileType && fileType.mime && fileType.mime.startsWith('image/'))
      ) {
        // For images, we need a different approach
        // For now, just use the file name and basic metadata
        textContent = `Image lab result: ${labResult.fileName}, uploaded on ${new Date(labResult.uploadedAt).toLocaleDateString()}. 
        This is an image file that may contain lab results. The file type is ${labResult.fileType}.`;
      } else if (
        labResult.fileType === 'application/msword' ||
        labResult.fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ) {
        // For Word documents, use basic metadata for now
        // In a production environment, you'd want to use a library to extract text from .doc/.docx
        textContent = `Document lab result: ${labResult.fileName}, uploaded on ${new Date(labResult.uploadedAt).toLocaleDateString()}. 
        This is a document file that contains lab results. The file type is ${labResult.fileType}.`;
      } else {
        // For other file types, use metadata
        textContent = `Lab result file: ${labResult.fileName}, uploaded on ${new Date(labResult.uploadedAt).toLocaleDateString()}. 
        File type: ${labResult.fileType}. Notes: ${labResult.notes || "No notes provided"}`;
      }

      // If we have notes, add them to the content
      if (labResult.notes) {
        textContent += `\n\nUser notes: ${labResult.notes}`;
      }

      // Generate summary using OpenAI
      const completion = await openai.chat.completions.create({
        model: this.SUMMARY_MODEL,
        messages: [
          {
            role: "system",
            content: this.LAB_SUMMARY_PROMPT
          },
          {
            role: "user",
            content: `Here is a lab result to summarize:\n\n${textContent}`
          }
        ],
        max_tokens: 1000
      });

      const summaryContent = completion.choices[0]?.message?.content?.trim() || 'No summary generated.';

      // Update lab result with summary in metadata
      await db
        .update(labResults)
        .set({
          metadata: {
            ...labResult.metadata,
            summary: summaryContent,
            summarizedAt: new Date().toISOString()
          }
        })
        .where(eq(labResults.id, labResultId));

      // Create embedding for the summary to enable similarity search
      await embeddingService.createLabEmbedding(labResultId, summaryContent);

      logger.info(`Generated summary for lab result ${labResultId}`);
      return summaryContent;

    } catch (error) {
      logger.error(`Error summarizing lab result ${labResultId}:`, error);
      return null;
    }
  }

  /**
   * Get summaries for all lab results of a user
   * @param userId User ID
   * @param limit Maximum number of summaries to return
   * @returns Array of lab result summaries
   */
  async getUserLabSummaries(userId: number, limit: number = 5): Promise<any[]> {
    try {
      // Fetch recent lab results for the user
      const userLabResults = await db
        .select()
        .from(labResults)
        .where(eq(labResults.userId, userId))
        .orderBy(desc(labResults.uploadedAt))
        .limit(limit);

      const summaries = [];

      for (const labResult of userLabResults) {
        // Check if we already have a summary
        if (labResult.metadata && labResult.metadata.summary) {
          summaries.push({
            id: labResult.id,
            fileName: labResult.fileName,
            uploadedAt: labResult.uploadedAt,
            summary: labResult.metadata.summary
          });
        } else {
          // Generate summary if not already available
          const summary = await this.summarizeLabResult(labResult.id);

          if (summary) {
            summaries.push({
              id: labResult.id,
              fileName: labResult.fileName,
              uploadedAt: labResult.uploadedAt,
              summary
            });
          }
        }
      }

      return summaries;
    } catch (error) {
      logger.error(`Error fetching lab summaries for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Find lab results relevant to a user query
   * @param userId User ID
   * @param query User query
   * @param limit Maximum number of results to return
   * @returns Array of relevant lab results with summaries
   */
  async findRelevantLabResults(userId: number, query: string, limit: number = 3): Promise<any[]> {
    try {
      // Get recent lab results, sorted by date
      const recentLabs = await db
        .select()
        .from(labResults)
        .where(
          and(
            eq(labResults.userId, userId)
          )
        )
        .orderBy(desc(labResults.uploadedAt))
        .limit(limit);

      return recentLabs;
    } catch (error) {
      logger.error('Error finding relevant lab results:', error);
      return [];
    }
  }
}

// Export singleton instance
export const labSummaryService = new LabSummaryService();
export default labSummaryService;