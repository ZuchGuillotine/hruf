/**
 * @description      : Service for pre-processing and normalizing text from lab reports
 * @author           :
 * @group            :
 * @created          : 17/05/2025 - 01:24:23
 *
 * MODIFICATION LOG
 * - Version         : 1.0.0
 * - Date            : 17/05/2025
 * - Author          :
 * - Modification    : Initial implementation
 **/
import { z } from 'zod';
declare const PreprocessedTextSchema: z.ZodObject<
  {
    rawText: z.ZodString;
    normalizedText: z.ZodString;
    metadata: z.ZodObject<
      {
        originalFormat: z.ZodString;
        processingSteps: z.ZodArray<z.ZodString, 'many'>;
        confidence: z.ZodOptional<z.ZodNumber>;
        ocrEngine: z.ZodOptional<z.ZodString>;
        processingTimestamp: z.ZodString;
        textLength: z.ZodNumber;
        lineCount: z.ZodNumber;
        hasHeaders: z.ZodBoolean;
        hasFooters: z.ZodBoolean;
        qualityMetrics: z.ZodOptional<
          z.ZodObject<
            {
              whitespaceRatio: z.ZodNumber;
              specialCharRatio: z.ZodNumber;
              numericRatio: z.ZodNumber;
              potentialOcrErrors: z.ZodNumber;
            },
            'strip',
            z.ZodTypeAny,
            {
              whitespaceRatio: number;
              specialCharRatio: number;
              numericRatio: number;
              potentialOcrErrors: number;
            },
            {
              whitespaceRatio: number;
              specialCharRatio: number;
              numericRatio: number;
              potentialOcrErrors: number;
            }
          >
        >;
      },
      'strip',
      z.ZodTypeAny,
      {
        textLength: number;
        originalFormat: string;
        processingSteps: string[];
        processingTimestamp: string;
        lineCount: number;
        hasHeaders: boolean;
        hasFooters: boolean;
        confidence?: number | undefined;
        ocrEngine?: string | undefined;
        qualityMetrics?:
          | {
              whitespaceRatio: number;
              specialCharRatio: number;
              numericRatio: number;
              potentialOcrErrors: number;
            }
          | undefined;
      },
      {
        textLength: number;
        originalFormat: string;
        processingSteps: string[];
        processingTimestamp: string;
        lineCount: number;
        hasHeaders: boolean;
        hasFooters: boolean;
        confidence?: number | undefined;
        ocrEngine?: string | undefined;
        qualityMetrics?:
          | {
              whitespaceRatio: number;
              specialCharRatio: number;
              numericRatio: number;
              potentialOcrErrors: number;
            }
          | undefined;
      }
    >;
  },
  'strip',
  z.ZodTypeAny,
  {
    metadata: {
      textLength: number;
      originalFormat: string;
      processingSteps: string[];
      processingTimestamp: string;
      lineCount: number;
      hasHeaders: boolean;
      hasFooters: boolean;
      confidence?: number | undefined;
      ocrEngine?: string | undefined;
      qualityMetrics?:
        | {
            whitespaceRatio: number;
            specialCharRatio: number;
            numericRatio: number;
            potentialOcrErrors: number;
          }
        | undefined;
    };
    rawText: string;
    normalizedText: string;
  },
  {
    metadata: {
      textLength: number;
      originalFormat: string;
      processingSteps: string[];
      processingTimestamp: string;
      lineCount: number;
      hasHeaders: boolean;
      hasFooters: boolean;
      confidence?: number | undefined;
      ocrEngine?: string | undefined;
      qualityMetrics?:
        | {
            whitespaceRatio: number;
            specialCharRatio: number;
            numericRatio: number;
            potentialOcrErrors: number;
          }
        | undefined;
    };
    rawText: string;
    normalizedText: string;
  }
>;
type PreprocessedText = z.infer<typeof PreprocessedTextSchema>;
export declare class LabTextPreprocessingService {
  private processPdf;
  private preprocessPdfText;
  private processDocx;
  private processImage;
  private countMedicalTerms;
  private countNumericValues;
  private checkUnitConsistency;
  private calculateQualityMetrics;
  private calculateOverallQualityScore;
  private reflowPdfColumns;
  private normalizeText;
  private detectHeaders;
  private detectFooters;
  preprocessLabText(buffer: Buffer, mimeType?: string): Promise<PreprocessedText>;
  private countBiomarkers;
  private checkValueRanges;
}
export declare const labTextPreprocessingService: LabTextPreprocessingService;
export {};
//# sourceMappingURL=labTextPreprocessingService.d.ts.map
