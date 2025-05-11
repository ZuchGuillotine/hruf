/**
    * @description      : Service for extracting and validating biomarkers from lab reports
    * @author           : 
    * @group            : 
    * @created          : 07/05/2025 - 22:56:18
    * 
    * MODIFICATION LOG
    * - Version         : 1.0.0
    * - Date            : 07/05/2025
    * - Author          : 
    * - Modification    : Enhanced regex patterns and added more biomarkers
**/
import { z } from 'zod';
import { openai } from '../openai';
import logger from '../utils/logger';
import { db } from '../../db';
import { labResults, biomarkerResults, biomarkerProcessingStatus } from '../../db/schema';
import { eq } from 'drizzle-orm';
import type { InsertBiomarkerResult } from '../../db/schema';

interface Biomarker {
  name: string;
  value: number;
  unit: string;
  category: string;
  referenceRange?: string;
  testDate: Date;
  source: string;
  confidence?: number;
  sourceText?: string;
}

// Zod schema for biomarker validation
const BiomarkerSchema = z.object({
  name: z.string(),
  value: z.number(),
  unit: z.string(),
  referenceRange: z.string().optional(),
  testDate: z.string().transform(date => {
    // Handle YYYY-MM-DD format by appending time
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return `${date}T00:00:00.000Z`;
    }
    return date;
  }).optional(),
  category: z.enum(['lipid', 'metabolic', 'thyroid', 'vitamin', 'mineral', 'blood', 'liver', 'kidney', 'hormone', 'other']).optional(),
});

const BiomarkersArraySchema = z.array(BiomarkerSchema);

type BiomarkerCategory = 'lipid' | 'metabolic' | 'thyroid' | 'vitamin' | 'mineral' | 'blood' | 'liver' | 'kidney' | 'hormone' | 'other';

// Comprehensive biomarker regex patterns
const BIOMARKER_PATTERNS: Record<string, { pattern: RegExp; category: BiomarkerCategory }> = {
  // Lipid Panel
  cholesterol: {
    pattern: /(?:Total Cholesterol|Cholesterol, Total|Cholesterol)\s*(?:Normal range:[^]*?)?\s*(?:\d+(?:\.\d+)?[^]*?)?(\d+(?:\.\d+)?)\s*(?:High|Low|Normal)?\s*(mg\/dL|mmol\/L)/i,
    category: 'lipid'
  },
  hdl: {
    pattern: /(?:HDL|HDL-C|HDL Cholesterol|High-Density Lipoprotein):\s*(\d+(?:\.\d+)?)\s*(mg\/dL|mmol\/L)/i,
    category: 'lipid'
  },
  ldl: {
    pattern: /(?:LDL|LDL-C|LDL Cholesterol|Low-Density Lipoprotein):\s*(\d+(?:\.\d+)?)\s*(mg\/dL|mmol\/L)/i,
    category: 'lipid'
  },
  triglycerides: {
    pattern: /(?:Triglycerides|TG):\s*(\d+(?:\.\d+)?)\s*(mg\/dL|mmol\/L)/i,
    category: 'lipid'
  },
  vldl: {
    pattern: /(?:VLDL|VLDL-C|Very Low-Density Lipoprotein):\s*(\d+(?:\.\d+)?)\s*(mg\/dL|mmol\/L)/i,
    category: 'lipid'
  },

  // Metabolic Panel
  glucose: {
    pattern: /(?:Glucose|Blood Glucose|Fasting Glucose|FBG)\s*(?:Normal range:[^]*?)?\s*(?:\d+(?:\.\d+)?[^]*?)?(\d+(?:\.\d+)?)\s*(?:High|Low|Normal)?\s*(mg\/dL|mmol\/L)/i,
    category: 'metabolic'
  },
  hemoglobinA1c: {
    pattern: /(?:HbA1c|Hemoglobin A1c|A1C)\s*(?:Normal range:[^]*?)?\s*(?:\d+(?:\.\d+)?[^]*?)?(\d+(?:\.\d+)?)\s*(?:High|Low|Normal)?\s*(%|mmol\/mol)/i,
    category: 'metabolic'
  },
  insulin: {
    pattern: /(?:Insulin|Fasting Insulin)\s*(?:Normal range:[^]*?)?\s*(?:\d+(?:\.\d+)?[^]*?)?(\d+(?:\.\d+)?)\s*(?:High|Low|Normal)?\s*(µIU\/mL|pmol\/L)/i,
    category: 'metabolic'
  },

  // Thyroid Panel
  tsh: {
    pattern: /(?:TSH|Thyroid Stimulating Hormone)\s*(?:Normal range:[^]*?)?\s*(?:\d+(?:\.\d+)?[^]*?)?(\d+(?:\.\d+)?)\s*(?:High|Low|Normal)?\s*(mIU\/L|µIU\/mL)/i,
    category: 'thyroid'
  },
  t4: {
    pattern: /(?:T4|Free T4|Thyroxine)\s*(?:Normal range:[^]*?)?\s*(?:\d+(?:\.\d+)?[^]*?)?(\d+(?:\.\d+)?)\s*(?:High|Low|Normal)?\s*(ng\/dL|pmol\/L)/i,
    category: 'thyroid'
  },
  t3: {
    pattern: /(?:T3|Free T3|Triiodothyronine)\s*(?:Normal range:[^]*?)?\s*(?:\d+(?:\.\d+)?[^]*?)?(\d+(?:\.\d+)?)\s*(?:High|Low|Normal)?\s*(pg\/mL|pmol\/L)/i,
    category: 'thyroid'
  },

  // Vitamins
  vitaminD: {
    pattern: /(?:Vitamin D|25-OH Vitamin D|25-Hydroxyvitamin D|25\(OH\)D)\s*(?:Normal range:[^]*?)?\s*(?:\d+(?:\.\d+)?[^]*?)?(\d+(?:\.\d+)?)\s*(?:High|Low|Normal)?\s*(ng\/mL|nmol\/L)/i,
    category: 'vitamin'
  },
  vitaminB12: {
    pattern: /(?:Vitamin B12|B12|Cobalamin)\s*(?:Normal range:[^]*?)?\s*(?:\d+(?:\.\d+)?[^]*?)?(\d+(?:\.\d+)?)\s*(?:High|Low|Normal)?\s*(pg\/mL|pmol\/L)/i,
    category: 'vitamin'
  },
  folate: {
    pattern: /(?:Folate|Folic Acid|Vitamin B9)\s*(?:Normal range:[^]*?)?\s*(?:\d+(?:\.\d+)?[^]*?)?(\d+(?:\.\d+)?)\s*(?:High|Low|Normal)?\s*(ng\/mL|nmol\/L)/i,
    category: 'vitamin'
  },

  // Minerals
  ferritin: {
    pattern: /(?:Ferritin)\s*(?:Normal range:[^]*?)?\s*(?:\d+(?:\.\d+)?[^]*?)?(\d+(?:\.\d+)?)\s*(?:High|Low|Normal)?\s*(ng\/mL|µg\/L)/i,
    category: 'mineral'
  },
  iron: {
    pattern: /(?:Iron|Serum Iron)\s*(?:Normal range:[^]*?)?\s*(?:\d+(?:\.\d+)?[^]*?)?(\d+(?:\.\d+)?)\s*(?:High|Low|Normal)?\s*(µg\/dL|µmol\/L)/i,
    category: 'mineral'
  },
  magnesium: {
    pattern: /(?:Magnesium|Mg)\s*(?:Normal range:[^]*?)?\s*(?:\d+(?:\.\d+)?[^]*?)?(\d+(?:\.\d+)?)\s*(?:High|Low|Normal)?\s*(mg\/dL|mmol\/L)/i,
    category: 'mineral'
  },

  // Blood Count
  hemoglobin: {
    pattern: /(?:Hemoglobin|Hgb|Hb):\s*(\d+(?:\.\d+)?)\s*(g\/dL|g\/L)/i,
    category: 'blood'
  },
  hematocrit: {
    pattern: /(?:Hematocrit|Hct):\s*(\d+(?:\.\d+)?)\s*(%)/i,
    category: 'blood'
  },
  platelets: {
    pattern: /(?:Platelets|PLT):\s*(\d+(?:\.\d+)?)\s*(K\/µL|10³\/µL)/i,
    category: 'blood'
  },

  // Liver Function
  alt: {
    pattern: /(?:ALT|Alanine Transaminase|SGPT):\s*(\d+(?:\.\d+)?)\s*(U\/L|IU\/L)/i,
    category: 'liver'
  },
  ast: {
    pattern: /(?:AST|Aspartate Transaminase|SGOT):\s*(\d+(?:\.\d+)?)\s*(U\/L|IU\/L)/i,
    category: 'liver'
  },
  alkalinePhosphatase: {
    pattern: /(?:Alkaline Phosphatase|ALP):\s*(\d+(?:\.\d+)?)\s*(U\/L|IU\/L)/i,
    category: 'liver'
  },

  // Kidney Function
  creatinine: {
    pattern: /(?:Creatinine|Cr):\s*(\d+(?:\.\d+)?)\s*(mg\/dL|µmol\/L)/i,
    category: 'kidney'
  },
  bun: {
    pattern: /(?:BUN|Blood Urea Nitrogen|Urea):\s*(\d+(?:\.\d+)?)\s*(mg\/dL|mmol\/L)/i,
    category: 'kidney'
  },
  egfr: {
    pattern: /(?:eGFR|Estimated GFR|Glomerular Filtration Rate):\s*(\d+(?:\.\d+)?)\s*(mL\/min\/1.73m²)/i,
    category: 'kidney'
  },

  // Hormones
  cortisol: {
    pattern: /(?:Cortisol):\s*(\d+(?:\.\d+)?)\s*(µg\/dL|nmol\/L)/i,
    category: 'hormone'
  },
  testosterone: {
    pattern: /(?:Testosterone|Total Testosterone):\s*(\d+(?:\.\d+)?)\s*(ng\/dL|nmol\/L)/i,
    category: 'hormone'
  },
  estradiol: {
    pattern: /(?:Estradiol|E2):\s*(\d+(?:\.\d+)?)\s*(pg\/mL|pmol\/L)/i,
    category: 'hormone'
  }
};

export class BiomarkerExtractionService {
  private async extractWithRegex(text: string): Promise<z.infer<typeof BiomarkerSchema>[]> {
    const results: z.infer<typeof BiomarkerSchema>[] = [];
    logger.info('Starting regex extraction with text:', { 
      textLength: text.length,
      textSample: text.substring(0, 500), // Log first 500 chars
      patterns: Object.keys(BIOMARKER_PATTERNS) 
    });

    // Extract test date with more flexible patterns
    const datePatterns = [
      /(?:Date|Collection Date|Report Date|Test Date):\s*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
      /(?:Date|Collection Date|Report Date|Test Date):\s*(\d{4}[-\/]\d{1,2}[-\/]\d{1,2})/i,
      /(?:Date|Collection Date|Report Date|Test Date):\s*(\w+\s+\d{1,2},?\s+\d{4})/i
    ];

    let testDate: string | undefined;
    for (const pattern of datePatterns) {
      const dateMatch = text.match(pattern);
      if (dateMatch) {
        try {
          testDate = new Date(dateMatch[1]).toISOString();
          logger.info('Found test date with regex:', { date: testDate, pattern: pattern.toString() });
          break;
        } catch (e) {
          logger.warn('Failed to parse date:', { date: dateMatch[1], error: e instanceof Error ? e.message : String(e) });
        }
      }
    }

    // Extract reference ranges
    const referenceRangePattern = /(?:Reference Range|Normal Range|Reference Values?):\s*([^\.]+)/i;
    const referenceRangeMatch = text.match(referenceRangePattern);
    const referenceRange = referenceRangeMatch ? referenceRangeMatch[1].trim() : undefined;
    if (referenceRange) {
      logger.info('Found reference range:', { range: referenceRange });
    }

    // Track matches and validation results
    let totalMatches = 0;
    let validationFailures = 0;

    for (const [name, { pattern, category }] of Object.entries(BIOMARKER_PATTERNS)) {
      const match = text.match(pattern);
      logger.debug('Pattern matching attempt:', {
        biomarker: name,
        pattern: pattern.toString(),
        matched: !!match,
        matchValue: match ? match[1] : null,
        matchGroups: match ? match.groups : null,
        surroundingText: match ? text.substring(Math.max(0, text.indexOf(match[0]) - 50), Math.min(text.length, text.indexOf(match[0]) + match[0].length + 50)) : null
      });
      if (match) {
        totalMatches++;
        const [_, value, unit] = match;
        logger.info('Regex match found:', { 
          biomarker: name,
          rawValue: value,
          unit: unit,
          category
        });

        try {
          const parsedValue = parseFloat(value);
          if (isNaN(parsedValue)) {
            logger.warn('Failed to parse biomarker value as number:', {
              biomarker: name,
              rawValue: value
            });
            validationFailures++;
            continue;
          }

          const biomarker = {
            name,
            value: parsedValue,
            unit,
            testDate,
            referenceRange,
            category
          };

          try {
            const validated = BiomarkerSchema.parse(biomarker);
            results.push(validated);
            logger.info('Successfully validated biomarker:', {
              biomarker: name,
              value: parsedValue,
              unit
            });
          } catch (validationError) {
            validationFailures++;
            logger.warn('Zod validation failed for biomarker:', {
              biomarker: name,
              error: validationError instanceof Error ? validationError.message : String(validationError),
              issues: validationError instanceof z.ZodError ? validationError.issues : undefined
            });
          }
        } catch (parseError) {
          validationFailures++;
          logger.warn('Error processing biomarker value:', {
            biomarker: name,
            error: parseError instanceof Error ? parseError.message : String(parseError)
          });
        }
      }
    }

    logger.info('Regex extraction complete:', {
      totalMatches,
      validationFailures,
      successfulExtractions: results.length,
      biomarkersFound: results.map(r => r.name)
    });

    return results;
  }

  private async extractWithLLM(text: string): Promise<z.infer<typeof BiomarkerSchema>[]> {
    try {
      logger.info('Starting LLM extraction with text length:', { textLength: text.length });

      const functions = [{
        name: "extract_lab_biomarkers",
        description: "Extract biomarkers from medical lab report text with precise values and units",
        parameters: {
          type: "object",
          properties: {
            biomarkers: {
              type: "array",
              items: {
                type: "object",
                required: ["name", "value", "unit"],
                properties: {
                  name: { type: "string" },
                  value: { type: "number" },
                  unit: { type: "string" },
                  referenceRange: { type: "string" },
                  testDate: { type: "string", format: "date" },
                  category: { 
                    type: "string",
                    enum: ['lipid', 'metabolic', 'thyroid', 'vitamin', 'mineral', 'blood', 'liver', 'kidney', 'hormone', 'other']
                  },
                  status: {
                    type: "string",
                    enum: ['High', 'Low', 'Normal']
                  }
                }
              }
            }
          },
          required: ["biomarkers"]
        }
      }];

      const systemPrompt = `You are a precise medical lab report parser. Extract all biomarkers with the following rules:
- Convert all numeric values to valid numbers (never return null values)
- If a value is "pending" or "not available", skip that biomarker
- Include units exactly as written
- Capture any reference ranges
- Note if values are marked High/Low/Normal
- Categorize biomarkers into appropriate types
- Format dates as YYYY-MM-DD`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4-0613",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: text
          }
        ],
        functions,
        function_call: { name: "extract_lab_biomarkers" },
        temperature: 0.5
      });

      const rawArgs = completion.choices[0]?.message?.function_call?.arguments;
      logger.info('Raw LLM response:', { 
        contentLength: rawArgs?.length,
        contentPreview: rawArgs?.substring(0, 200), // Log first 200 chars
        finishReason: completion.choices[0]?.finish_reason,
        modelUsed: completion.model,
        promptTokens: completion.usage?.prompt_tokens,
        completionTokens: completion.usage?.completion_tokens
      });

      const funcCall = completion.choices[0]?.message?.function_call;
      if (!funcCall?.arguments) {
        logger.error('No function_call arguments returned from LLM');
        return [];
      }

      try {
        const parsed = JSON.parse(funcCall.arguments);
        if (!parsed.biomarkers) {
          logger.error('No biomarkers array in function response');
          return [];
        }

        logger.info('Successfully parsed LLM function response:', {
          biomarkerCount: parsed.biomarkers.length,
          sampleBiomarker: parsed.biomarkers[0],
          finishReason: completion.choices[0]?.finish_reason
        });

        const validated = BiomarkersArraySchema.parse(parsed.biomarkers);
        logger.info('Successfully validated biomarkers with Zod schema', {
          biomarkerCount: validated.length,
          sampleValidated: validated[0]
        });

        return validated;
      } catch (error) {
        logger.error('Error processing LLM response:', {
          error: error instanceof Error ? error.message : String(error),
          issues: error instanceof z.ZodError ? error.issues : undefined,
          rawArgs: funcCall.arguments.substring(0, 200) // Log first 200 chars
        });
        return [];
      }
    } catch (error) {
      logger.error('Error in LLM extraction:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      return [];
    }
  }

  async extractBiomarkers(text: string): Promise<{
    parsedBiomarkers: z.infer<typeof BiomarkerSchema>[];
    parsingErrors: string[];
  }> {
    const errors: string[] = [];
    try {
      logger.info('Starting biomarker extraction process');

      // First try regex extraction
      const regexResults = await this.extractWithRegex(text);
      logger.info('Regex extraction results:', {
        biomarkerCount: regexResults.length,
        biomarkers: regexResults.map(r => ({ name: r.name, value: r.value, unit: r.unit }))
      });

      // Extract the text portions that weren't matched by regex
      const unmatchedText = this.getUnmatchedText(text, regexResults);

      // If we have significant unmatched text, try LLM on just that portion
      if (unmatchedText.length > 200) { // Threshold for "significant" unmatched text
        logger.info('Found unmatched text portions, attempting LLM extraction', {
          unmatchedLength: unmatchedText.length
        });

        const llmResults = await this.extractWithLLM(unmatchedText);
        logger.info('LLM extraction results from unmatched text:', {
          biomarkerCount: llmResults.length,
          biomarkers: llmResults.map(r => ({ name: r.name, value: r.value, unit: r.unit }))
        });

        // Merge results, preferring regex matches
        const regexNames = new Set(regexResults.map(r => r.name));
        const combinedResults = [
          ...regexResults,
          ...llmResults.filter(r => !regexNames.has(r.name))
        ];

        logger.info('Combined extraction results:', {
          totalBiomarkers: combinedResults.length,
          fromRegex: regexResults.length,
          fromLLM: llmResults.length,
          uniqueFromLLM: llmResults.filter(r => !regexNames.has(r.name)).length
        });

        return {
          parsedBiomarkers: combinedResults,
          parsingErrors: errors
        };
      }

      return {
        parsedBiomarkers: regexResults,
        parsingErrors: errors
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push(`Failed to parse biomarkers: ${errorMessage}`);
      logger.error('Error in biomarker extraction:', {
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      });
      return {
        parsedBiomarkers: [],
        parsingErrors: errors
      };
    }
  }

  async processLabResult(labResultId: number): Promise<void> {
  try {
    // Get the lab result from the database
    const [labResult] = await db
      .select()
      .from(labResults)
      .where(eq(labResults.id, labResultId))


  async storeBiomarkers(labResultId: number, biomarkers: Biomarker[]): Promise<void> {
    const trx = await db.transaction();
    try {
      logger.info(`Starting biomarker storage for lab result ${labResultId}`, {
        biomarkerCount: biomarkers.length
      });

      // Update processing status
      await trx.insert(biomarkerProcessingStatus).values({
        labResultId,
        status: 'processing',
        startedAt: new Date(),
        metadata: {
          biomarkerCount: biomarkers.length
        }
      });

      // Store biomarkers
      const biomarkerInserts: InsertBiomarkerResult[] = biomarkers.map(b => ({
        labResultId,
        name: b.name,
        value: b.value,
        unit: b.unit,
        category: b.category,
        referenceRange: b.referenceRange,
        testDate: b.testDate,
        extractionMethod: b.source,
        confidence: b.confidence,
        metadata: {
          sourceText: b.sourceText,
          extractionTimestamp: new Date().toISOString()
        }
      }));

      await trx.insert(biomarkerResults).values(biomarkerInserts);

      // Update status to completed
      await trx.update(biomarkerProcessingStatus)
        .set({
          status: 'completed',
          completedAt: new Date(),
          biomarkerCount: biomarkers.length,
          metadata: {
            processingTime: Date.now() - new Date().getTime(),
            regexMatches: biomarkers.filter(b => b.source === 'regex').length,
            llmExtractions: biomarkers.filter(b => b.source === 'llm').length
          }
        })
        .where(eq(biomarkerProcessingStatus.labResultId, labResultId));

      await trx.commit();
      logger.info(`Successfully stored biomarkers for lab result ${labResultId}`);
    } catch (error) {
      await trx.rollback();
      logger.error(`Failed to store biomarkers for lab result ${labResultId}`, {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

      .limit(1);

    if (!labResult) {
      logger.error(`Lab result with ID ${labResultId} not found`);
      return;
    }

    // Get the text content from metadata
    const textContent = labResult.metadata?.parsedText || labResult.metadata?.ocr?.text;

    if (!textContent) {
      logger.error(`No text content found for lab result ${labResultId}`);
      return;
    }

    // Extract biomarkers from the text
    const biomarkerResults = await this.extractBiomarkers(textContent);

    // Log the extraction results
    logger.info(`Biomarker extraction results for lab ${labResultId}:`, {
      biomarkerCount: biomarkerResults.parsedBiomarkers.length,
      biomarkers: biomarkerResults.parsedBiomarkers.map(b => ({
        name: b.name,
        value: b.value,
        unit: b.unit,
        category: b.category
      })),
      errors: biomarkerResults.parsingErrors
    });

    // Only update if we have extracted biomarkers
    if (biomarkerResults.parsedBiomarkers.length > 0) {
      // Ensure we preserve existing metadata structure
      const existingMetadata = labResult.metadata || {};
      const updatedMetadata = {
        ...existingMetadata,
        biomarkers: {
          parsedBiomarkers: biomarkerResults.parsedBiomarkers,
          parsingErrors: biomarkerResults.parsingErrors,
          extractedAt: new Date().toISOString()
        }
      };

      // Update the lab result with biomarker data
      await db
        .update(labResults)
        .set({ metadata: updatedMetadata })
        .where(eq(labResults.id, labResultId));

      logger.info(`Successfully updated lab result ${labResultId} with biomarker data`, {
        biomarkerCount: biomarkerResults.parsedBiomarkers.length,
        labResultId
      });
    } else {
      logger.warn(`No biomarkers extracted for lab result ${labResultId}`);
    }
  } catch (error) {
    logger.error(`Error processing biomarkers for lab result ${labResultId}:`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      labResultId
    });
  }
}
private getUnmatchedText(fullText: string, regexResults: z.infer<typeof BiomarkerSchema>[]): string {
    let unmatchedText = fullText;

    // Sort regex patterns by their position in the text to process sequentially
    const matchedSegments: Array<{start: number, end: number}> = [];

    // Find all matched segments
    for (const [name, { pattern }] of Object.entries(BIOMARKER_PATTERNS)) {
      const matches = Array.from(fullText.matchAll(new RegExp(pattern, 'gi')));
      matches.forEach(match => {
        if (match.index !== undefined) {
          matchedSegments.push({
            start: match.index,
            end: match.index + match[0].length
          });
        }
      });
    }

    // Sort segments by start position
    matchedSegments.sort((a, b) => a.start - b.start);

    // Remove matched segments from the text, keeping track of unmatched portions
    let lastEnd = 0;
    let result = '';

    matchedSegments.forEach(segment => {
      if (segment.start > lastEnd) {
        result += fullText.substring(lastEnd, segment.start) + ' ';
      }
      lastEnd = segment.end;
    });

    // Add any remaining text after the last match
    if (lastEnd < fullText.length) {
      result += fullText.substring(lastEnd);
    }

    return result.trim();
  }
}

export const biomarkerExtractionService = new BiomarkerExtractionService();
export default biomarkerExtractionService;