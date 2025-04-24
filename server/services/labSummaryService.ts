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
  private MAX_TOKEN_LIMIT = 16000;
  private MAX_LABS_PER_REQUEST = 50;

  private LAB_SUMMARY_PROMPT = `
  You are a medical assistant helping to summarize lab results. Focus on:

  1. Highlighting key measurements and their values
  2. Noting any abnormal values (high or low) and their significance
  3. Identifying trends if multiple lab results are provided
  4. Extracting the test date and type of lab (blood work, urine analysis, etc.)
  5. Being concise yet comprehensive about important health markers

  Format the summary in a clear, structured way that prioritizes the most clinically significant findings.
  `;

  async summarizeLabResult(labResultId: number): Promise<string | null> {
    try {
      const [labResult] = await db
        .select()
        .from(labResults)
        .where(eq(labResults.id, labResultId))
        .limit(1);

      if (!labResult) {
        logger.error(`Lab result with ID ${labResultId} not found`);
        return null;
      }

      // Clean up the file URL to get the correct path
      const fileName = labResult.fileUrl.replace(/^\/uploads\//, '');
      const filePath = path.join(process.cwd(), 'uploads', fileName);

      // Verify file exists and is accessible
      if (!fs.existsSync(filePath)) {
        logger.error(`Lab result file not found at path: ${filePath}`);
        return null;
      }

      // Read file buffer once and reuse
      const fileBuffer = fs.readFileSync(filePath);
      const fileType = await fileTypeFromBuffer(fileBuffer);

      let textContent = "";

      if (labResult.fileType === 'application/pdf' || (fileType && fileType.mime === 'application/pdf')) {
        try {
          // Dynamically import pdf-parse
          const pdfParse = await import('pdf-parse').then(module => module.default);

          logger.info(`Processing PDF file: ${filePath}`, {
            fileSize: fileBuffer.length,
            fileName: labResult.fileName
          });
          
          // Parse PDF directly from buffer
          const pdfData = await pdfParse(fileBuffer, {
            max: 0,
            version: 'v1.10.100' // Force specific PDF.js version
          });
          
          textContent = pdfData.text;

          if (!textContent || textContent.trim().length === 0) {
            throw new Error('PDF parsing produced empty text content');
          }

          // Store parsed text in metadata
          await db
            .update(labResults)
            .set({
              metadata: {
                ...labResult.metadata,
                parsedText: textContent,
                parseDate: new Date().toISOString()
              }
            })
            .where(eq(labResults.id, labResultId));

          logger.info(`Successfully parsed PDF for lab result ${labResultId}`, {
            textLength: textContent.length
          });
        } catch (error) {
          logger.error('Error parsing PDF:', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            filePath,
            fileName: labResult.fileName,
            fileUrl: labResult.fileUrl,
            timestamp: new Date().toISOString()
          });

          // Fallback to basic metadata
          textContent = `Lab result file: ${labResult.fileName}, uploaded on ${new Date(labResult.uploadedAt).toLocaleDateString()}. 
          File type: PDF. This is a PDF document that could not be parsed. Notes: ${labResult.notes || "No notes provided"}`;
        }
      } else if (labResult.fileType.startsWith('image/') || (fileType && fileType.mime && fileType.mime.startsWith('image/'))) {
        try {
          logger.info(`Starting OCR processing for lab result ${labResultId}`, {
            fileName: labResult.fileName,
            fileType: labResult.fileType,
            fileSize: fileBuffer.length
          });

          const { createWorker } = await import('tesseract.js');
          const worker = await createWorker();
          
          await worker.loadLanguage('eng');
          await worker.initialize('eng');
          
          const { data: { text } } = await worker.recognize(fileBuffer);
          await worker.terminate();

          logger.info(`OCR processing completed for lab result ${labResultId}`, {
            textLength: text ? text.length : 0,
            hasContent: !!text
          });

          if (!text || text.trim().length === 0) {
            throw new Error('OCR produced empty text content');
          }

          textContent = text;
          
          // Verify text was extracted
          logger.info(`OCR text content sample for lab result ${labResultId}:`, {
            sample: text.substring(0, 100), // Log first 100 chars
            fullLength: text.length
          });
          
          // Store OCR text in metadata with standardized structure
          await db
            .update(labResults)
            .set({
              metadata: {
                ...labResult.metadata,
                ocrText: text,
                ocrDate: new Date().toISOString(),
                extractedText: text, // Standardized field for context building
                extractionMethod: 'ocr',
                extractionDate: new Date().toISOString()
              }
            })
            .where(eq(labResults.id, labResultId));

          logger.info(`Successfully extracted and stored OCR text for lab result ${labResultId}`, {
            textLength: text.length,
            method: 'ocr'
          });

          logger.info(`Successfully extracted text from image for lab result ${labResultId}`, {
            textLength: text.length
          });
        } catch (ocrError) {
          logger.error('Error performing OCR on image:', {
            error: ocrError instanceof Error ? ocrError.message : String(ocrError),
            stack: ocrError instanceof Error ? ocrError.stack : undefined,
            filePath,
            fileName: labResult.fileName
          });
          
          textContent = `Image lab result: ${labResult.fileName}, uploaded on ${new Date(labResult.uploadedAt).toLocaleDateString()}. 
          File type: ${labResult.fileType}. OCR processing failed. Notes: ${labResult.notes || "No notes provided"}`;
        }
      } else if (
        labResult.fileType === 'application/msword' ||
        labResult.fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ) {
        textContent = `Document lab result: ${labResult.fileName}, uploaded on ${new Date(labResult.uploadedAt).toLocaleDateString()}. 
        This is a document file that contains lab results. The file type is ${labResult.fileType}.`;
      } else {
        textContent = `Lab result file: ${labResult.fileName}, uploaded on ${new Date(labResult.uploadedAt).toLocaleDateString()}. 
        File type: ${labResult.fileType}. Notes: ${labResult.notes || "No notes provided"}`;
      }

      if (labResult.notes) {
        textContent += `\n\nUser notes: ${labResult.notes}`;
      }

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

      await embeddingService.createLabEmbedding(labResultId, summaryContent);

      logger.info(`Generated summary for lab result ${labResultId}`);
      return summaryContent;

    } catch (error) {
      logger.error(`Error summarizing lab result ${labResultId}:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      return null;
    }
  }

  async getUserLabSummaries(userId: number, limit: number = 5): Promise<any[]> {
    try {
      const userLabResults = await db
        .select()
        .from(labResults)
        .where(eq(labResults.userId, userId))
        .orderBy(desc(labResults.uploadedAt))
        .limit(limit);

      const summaries = [];

      for (const labResult of userLabResults) {
        if (labResult.metadata && labResult.metadata.summary) {
          summaries.push({
            id: labResult.id,
            fileName: labResult.fileName,
            uploadedAt: labResult.uploadedAt,
            summary: labResult.metadata.summary
          });
        } else {
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

  async findRelevantLabResults(userId: number, query: string, limit: number = 3): Promise<any[]> {
    try {
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

      for (const lab of recentLabs) {
        if (!lab.metadata?.summary) {
          this.summarizeLabResult(lab.id)
            .then(() => {
              logger.info(`Background summary generated for lab ${lab.id}`);
            })
            .catch(error => {
              logger.error(`Error generating background summary for lab ${lab.id}:`, error);
            });
        }
      }

      return recentLabs;
    } catch (error) {
      logger.error('Error finding relevant lab results:', error);
      return [];
    }
  }
}

export const labSummaryService = new LabSummaryService();
export default labSummaryService;