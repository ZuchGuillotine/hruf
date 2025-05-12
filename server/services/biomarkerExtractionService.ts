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
  value: number | string; // Allow both number and string values for flexibility
  unit: string;
  category: string;
  referenceRange?: string;
  testDate: Date | string; // Allow both Date object and string dates
  source?: string; // Optional source field
  extractionMethod?: string; // Alternative field for extraction method
  status?: string; // Add status field for High/Low/Normal
  confidence?: number | string; // Allow both number and string for confidence
  sourceText?: string | null; // Allow null values
}

// Zod schema for biomarker validation - More flexible to reduce validation failures
const BiomarkerSchema = z.object({
  name: z.string().min(1),
  // More flexible value handling - allow string or number and convert to number
  value: z.union([
    z.number(),
    z.string().transform(val => {
      const parsed = Number(val);
      if (isNaN(parsed)) {
        logger.warn(`Failed to parse biomarker value as number: ${val}`);
        return 0; // Fallback value to prevent pipeline failure
      }
      return parsed;
    })
  ]),
  unit: z.string().min(1),
  // More flexible category enum with proper error handling
  category: z.string()
    .transform(val => {
      const validCategories = ['lipid', 'metabolic', 'thyroid', 'vitamin', 
        'mineral', 'blood', 'liver', 'kidney', 'hormone', 'other'];
      if (validCategories.includes(val.toLowerCase())) {
        return val.toLowerCase();
      }
      logger.warn(`Invalid biomarker category: ${val}. Defaulting to 'other'`);
      return 'other';
    }),
  referenceRange: z.string().optional(),
  // More flexible date handling with better error recovery
  testDate: z.union([
    z.date(),
    z.string().transform(dateStr => {
      try {
        // Handle ISO strings
        if (/^\d{4}-\d{2}-\d{2}T/.test(dateStr)) {
          return new Date(dateStr);
        }
        // Handle YYYY-MM-DD format
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          return new Date(`${dateStr}T00:00:00.000Z`);
        }
        // Handle MM/DD/YYYY format
        if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
          const [month, day, year] = dateStr.split('/');
          return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00.000Z`);
        }
        // Default parsing
        const parsed = new Date(dateStr);
        if (isNaN(parsed.getTime())) {
          logger.warn(`Failed to parse date: ${dateStr}. Using current date.`);
          return new Date();
        }
        return parsed;
      } catch (e) {
        logger.warn(`Error parsing date: ${e instanceof Error ? e.message : String(e)}. Using current date.`);
        return new Date();
      }
    })
  ]),
  // More flexible status handling
  status: z.union([
    z.enum(['High', 'Low', 'Normal']),
    z.string().transform(val => {
      const normalized = val.toLowerCase();
      if (normalized.includes('high')) return 'High';
      if (normalized.includes('low')) return 'Low';
      return 'Normal';
    })
  ]).optional(),
  extractionMethod: z.enum(['regex', 'llm']).default('regex'),
  confidence: z.number().min(0).max(1).default(1.0),
  sourceText: z.string().optional()
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
            category,
            source: 'regex'
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
              description: "Array of biomarkers extracted from lab report. Each must have name, value, unit, and category.",
              items: {
                type: "object",
                required: ["name", "value", "unit", "category"],
                properties: {
                  name: { 
                    type: "string",
                    description: "Name of the biomarker (e.g., 'Glucose', 'Cholesterol')"
                  },
                  value: { 
                    type: "number",
                    description: "Numeric value of the biomarker measurement"
                  },
                  unit: { 
                    type: "string",
                    description: "Unit of measurement (e.g., 'mg/dL', 'mmol/L'). Must not be empty.",
                    minLength: 1
                  },
                  referenceRange: { 
                    type: "string",
                    description: "Reference range for this biomarker (e.g., '70-99 mg/dL')"
                  },
                  testDate: { 
                    type: "string", 
                    description: "ISO date format (YYYY-MM-DD)",
                    pattern: "^\\d{4}-\\d{2}-\\d{2}$"
                  },
                  category: { 
                    type: "string", 
                    description: "Category of biomarker",
                    enum: ["lipid", "metabolic", "thyroid", "vitamin", "mineral", "blood", "liver", "kidney", "hormone", "other"]
                  },
                  status: { 
                    type: "string",
                    description: "Status of biomarker value relative to reference range",
                    enum: ["High", "Low", "Normal"]
                  }
                }
              }
            }
          },
          required: ["biomarkers"]
        }
      }];

      const systemPrompt = `You are a precise medical lab report parser. Extract biomarkers with these strict requirements:

CRITICAL RULES:
1. The "unit" field MUST NOT be empty - it must contain a valid unit string
2. If a unit is not clearly specified, use the most appropriate standard unit (e.g., mg/dL for glucose)
3. All "value" fields MUST be numeric only
4. All returned data MUST comply with the function schema exactly

Extract these biomarker types:
- Lipids: Cholesterol, LDL, HDL, Triglycerides
- Metabolic: Glucose, HbA1c, Insulin
- Thyroid: TSH, T3, T4
- Vitamins: D, B12, Folate
- Minerals: Iron, Ferritin, Magnesium
- Blood: Hemoglobin, Hematocrit, RBC, WBC, Platelets
- Liver: ALT, AST, ALP, Bilirubin
- Kidney: Creatinine, BUN, eGFR
- Hormones: Testosterone, Estrogen, Cortisol

Use closest standard units when needed (e.g., mg/dL, µg/dL, ng/mL).
Ignore any text not related to biomarkers.`;

      // Call OpenAI with function calling
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text }
        ],
        temperature: 0.1,
        tools: functions.map(func => ({
          type: "function",
          function: func
        })),
        tool_choice: {
          type: "function",
          function: { name: "extract_lab_biomarkers" }
        }
      });

      // Extract biomarkers from the response
      const toolCall = response.choices[0]?.message?.tool_calls?.[0];
      if (toolCall?.type === 'function' && toolCall.function.name === 'extract_lab_biomarkers') {
        try {
          const parsedFunction = JSON.parse(toolCall.function.arguments);
          const biomarkers = parsedFunction.biomarkers;
          
          logger.info('LLM extraction extracted biomarkers:', { 
            count: biomarkers.length,
            firstBiomarker: biomarkers.length > 0 ? 
              `${biomarkers[0].name}: ${biomarkers[0].value} ${biomarkers[0].unit}` : null
          });

          // Map to our schema and validate each biomarker
          const validatedBiomarkers: z.infer<typeof BiomarkerSchema>[] = [];
          for (const b of biomarkers) {
            try {
              // Convert to our schema format
              const biomarker = {
                ...b,
                extractionMethod: 'llm',
                source: 'llm',
                confidence: 0.9,
                testDate: b.testDate || new Date().toISOString().split('T')[0]
              };
              
              // Validate
              const validated = BiomarkerSchema.parse(biomarker);
              validatedBiomarkers.push(validated);
            } catch (valErr) {
              logger.warn('Failed to validate LLM biomarker:', {
                biomarker: b.name,
                error: valErr instanceof Error ? valErr.message : String(valErr),
                issues: valErr instanceof z.ZodError ? valErr.issues : undefined
              });
            }
          }
          
          logger.info('LLM extraction validation complete:', {
            originalCount: biomarkers.length,
            validCount: validatedBiomarkers.length
          });
          
          return validatedBiomarkers;
        } catch (parseError) {
          logger.error('Failed to parse LLM function response:', {
            error: parseError instanceof Error ? parseError.message : String(parseError),
            rawResponse: toolCall.function.arguments
          });
        }
      } else {
        logger.warn('LLM extraction did not return expected tool call');
      }
      
      return [];
    } catch (error) {
      logger.error('LLM extraction failed:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      return [];
    }
  }

  async extractBiomarkers(text: string): Promise<{
    parsedBiomarkers: Biomarker[];
    parsingErrors: string[];
  }> {
    logger.info('Starting biomarker extraction');
    
    try {
      // Run both extraction methods in parallel
      const [regexResults, llmResults] = await Promise.all([
        this.extractWithRegex(text).catch(e => {
          logger.error('Regex extraction failed:', e);
          return [];
        }),
        this.extractWithLLM(text).catch(e => {
          logger.error('LLM extraction failed:', e);
          return [];
        })
      ]);
      
      // Merge results, preferring LLM where there's overlap (using biomarker name as the key)
      const biomarkerMap = new Map<string, Biomarker>();
      const errors: string[] = [];
      
      // Add regex results first
      for (const b of regexResults) {
        try {
          biomarkerMap.set(b.name.toLowerCase(), {
            ...b,
            source: 'regex'
          });
        } catch (e) {
          errors.push(`Failed to process regex biomarker ${b.name}: ${e instanceof Error ? e.message : String(e)}`);
        }
      }
      
      // Then add/override with LLM results
      for (const b of llmResults) {
        try {
          biomarkerMap.set(b.name.toLowerCase(), {
            ...b,
            source: 'llm'
          });
        } catch (e) {
          errors.push(`Failed to process LLM biomarker ${b.name}: ${e instanceof Error ? e.message : String(e)}`);
        }
      }
      
      // Convert map to array
      const combinedResults = Array.from(biomarkerMap.values());
      
      logger.info('Biomarker extraction complete:', {
        totalExtracted: combinedResults.length,
        fromRegex: regexResults.length,
        fromLLM: llmResults.length,
        errorCount: errors.length
      });
      
      return {
        parsedBiomarkers: combinedResults,
        parsingErrors: errors
      };
    } catch (error) {
      logger.error('Error in biomarker extraction process:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      return {
        parsedBiomarkers: [],
        parsingErrors: [`Extraction failed: ${error instanceof Error ? error.message : String(error)}`]
      };
    }
  }

  async storeBiomarkers(labResultId: number, biomarkers: Biomarker[]): Promise<void> {
    // Add debug logging before storage operation
    logger.info(`Attempting to store ${biomarkers.length} biomarkers for lab ${labResultId}`, {
      firstBiomarker: biomarkers[0] ? JSON.stringify({
        name: biomarkers[0].name,
        value: biomarkers[0].value,
        unit: biomarkers[0].unit
      }) : null
    });
    
    try {
      // First, make sure all existing biomarkers for this lab result are deleted
      // This ensures we don't have conflicting or duplicate entries
      await db.delete(biomarkerResults)
        .where(eq(biomarkerResults.labResultId, labResultId));
      
      logger.info(`Deleted any existing biomarker records for lab ${labResultId}`);
      
      // Prepare biomarker inserts with proper data types
      const biomarkerInserts: InsertBiomarkerResult[] = [];
      
      for (const b of biomarkers) {
        try {
          // Ensure the values are properly formatted for database
          const numericValue = typeof b.value === 'string' ? 
            parseFloat(b.value) : b.value;
            
          const numericConfidence = b.confidence !== undefined ?
            (typeof b.confidence === 'string' ? 
              parseFloat(b.confidence) : b.confidence) : 
            1.0;
          
          // Parse test date properly ensuring a valid date object
          let testDateValue: Date;
          try {
            if (b.testDate instanceof Date) {
              testDateValue = b.testDate;
            } else if (typeof b.testDate === 'string') {
              testDateValue = new Date(b.testDate);
              // Validate that the parsed date is valid
              if (isNaN(testDateValue.getTime())) {
                throw new Error('Invalid date string');
              }
            } else {
              // Fallback to lab upload date or current date
              testDateValue = new Date();
            }
          } catch (dateError) {
            logger.warn(`Error parsing test date for biomarker ${b.name}, using current date:`, {
              providedDate: b.testDate,
              error: dateError instanceof Error ? dateError.message : String(dateError)
            });
            testDateValue = new Date();
          }
          
          // Only add valid biomarkers with proper numeric values
          if (!isNaN(numericValue) && b.name && b.unit) {
            biomarkerInserts.push({
              labResultId,
              name: b.name,
              // Convert to string for PostgreSQL numeric type
              value: String(numericValue), 
              unit: b.unit,
              category: b.category || 'other',
              referenceRange: b.referenceRange,
              testDate: testDateValue,
              status: b.status || null,
              extractionMethod: b.source || 'regex',
              // Handle confidence as numeric
              confidence: isNaN(numericConfidence) ? null : String(numericConfidence), 
              metadata: {
                sourceText: b.sourceText || undefined,
                extractionTimestamp: new Date().toISOString(),
                validationStatus: 'validated'
              }
            });
          } else {
            logger.warn(`Skipping invalid biomarker: ${b.name} with value ${b.value}`);
          }
        } catch (biomarkerError) {
          logger.error(`Error formatting biomarker for database: ${b.name}`, {
            error: biomarkerError instanceof Error ? biomarkerError.message : String(biomarkerError),
            value: b.value,
            valueType: typeof b.value
          });
        }
      }

      if (biomarkerInserts.length === 0) {
        logger.warn(`No valid biomarker inserts were prepared for lab ${labResultId}`);
        return;
      }

      logger.info(`Prepared ${biomarkerInserts.length} biomarker inserts with proper conversion:`, {
        sampleValue: biomarkerInserts[0]?.value,
        valueType: typeof biomarkerInserts[0]?.value,
        sampleDate: biomarkerInserts[0]?.testDate,
        sampleDataPoint: JSON.stringify({
          name: biomarkerInserts[0]?.name,
          value: biomarkerInserts[0]?.value,
          unit: biomarkerInserts[0]?.unit,
          category: biomarkerInserts[0]?.category
        })
      });

      // Insert biomarkers in chunks to avoid transaction timeout or payload size issues
      const CHUNK_SIZE = 50;
      for (let i = 0; i < biomarkerInserts.length; i += CHUNK_SIZE) {
        const chunk = biomarkerInserts.slice(i, i + CHUNK_SIZE);
        try {
          await db.insert(biomarkerResults).values(chunk);
          logger.info(`Inserted biomarker chunk ${Math.floor(i/CHUNK_SIZE) + 1}/${Math.ceil(biomarkerInserts.length/CHUNK_SIZE)}`);
        } catch (chunkError) {
          logger.error(`Error inserting biomarker chunk ${Math.floor(i/CHUNK_SIZE) + 1}:`, {
            error: chunkError instanceof Error ? chunkError.message : String(chunkError),
            firstBiomarkerInChunk: JSON.stringify({
              name: chunk[0]?.name,
              value: chunk[0]?.value,
              testDate: chunk[0]?.testDate
            })
          });
          throw chunkError;
        }
      }

      logger.info(`Successfully stored all ${biomarkerInserts.length} biomarker records for lab ${labResultId}`);
    } catch (error) {
      // Enhanced error logging
      logger.error(`Error storing biomarker data for lab ${labResultId}:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        biomarkerCount: biomarkers.length
      });
      throw error;
    }
  }

  async processLabResult(labResultId: number): Promise<void> {
    try {
      logger.info(`Starting biomarker processing for lab result ${labResultId}`);
      
      // Get the lab result from the database
      const [labResult] = await db
        .select()
        .from(labResults)
        .where(eq(labResults.id, labResultId))
        .limit(1);

      if (!labResult) {
        logger.error(`Lab result with ID ${labResultId} not found`);
        return;
      }

      // Get the text content from metadata
      const textContent = labResult.metadata?.parsedText || labResult.metadata?.ocr?.text || labResult.metadata?.summary;

      if (!textContent) {
        logger.error(`No text content found for lab result ${labResultId}`);
        // Create a processing status record with error
        await db.insert(biomarkerProcessingStatus)
          .values({
            labResultId,
            status: 'error',
            errorMessage: 'No text content available for biomarker extraction',
            startedAt: new Date(),
            completedAt: new Date(),
            metadata: {
              processingTime: 0
            }
          });
        return;
      }

      // Create a processing status record
      await db.insert(biomarkerProcessingStatus)
        .values({
          labResultId,
          status: 'processing',
          startedAt: new Date(),
          metadata: {}
        });

      // Record start time for performance tracking
      const startTime = new Date();

      try {
        // Extract biomarkers from text content
        const biomarkerResults = await this.extractBiomarkers(textContent);
        
        // Calculate processing time
        const processingTime = new Date().getTime() - startTime.getTime();
        
        // Update processing status
        await db.update(biomarkerProcessingStatus)
          .set({
            status: 'extracted',
            completedAt: new Date(),
            biomarkerCount: biomarkerResults.parsedBiomarkers.length,
            errorCount: biomarkerResults.parsingErrors.length,
            metadata: {
              processingTime,
              parsingErrors: biomarkerResults.parsingErrors
            }
          })
          .where(eq(biomarkerProcessingStatus.labResultId, labResultId));
        
        logger.info(`Extracted ${biomarkerResults.parsedBiomarkers.length} biomarkers from lab result ${labResultId}`, {
          processingTime,
          biomarkers: biomarkerResults.parsedBiomarkers.map(b => b.name)
        });
        
        // Store biomarkers in database
        if (biomarkerResults.parsedBiomarkers.length > 0) {
          await this.storeBiomarkers(labResultId, biomarkerResults.parsedBiomarkers);
          
          // Update processing status to stored
          await db.update(biomarkerProcessingStatus)
            .set({
              status: 'completed',
              completedAt: new Date(),
              metadata: {
                processingTime,
                storedAt: new Date().toISOString()
              }
            })
            .where(eq(biomarkerProcessingStatus.labResultId, labResultId));
          
          logger.info(`Successfully processed and stored biomarkers for lab result ${labResultId}`);
        } else {
          // Update processing status to no biomarkers found
          await db.update(biomarkerProcessingStatus)
            .set({
              status: 'no_biomarkers',
              completedAt: new Date(),
              metadata: {
                processingTime,
                parsingErrors: biomarkerResults.parsingErrors
              }
            })
            .where(eq(biomarkerProcessingStatus.labResultId, labResultId));
          
          logger.warn(`No biomarkers found for lab result ${labResultId}`);
        }
        
        // Update lab metadata with biomarker extraction info
        await db.update(labResults)
          .set({
            metadata: {
              ...labResult.metadata,
              biomarkers: {
                extractedAt: new Date().toISOString(),
                count: biomarkerResults.parsedBiomarkers.length
              }
            }
          })
          .where(eq(labResults.id, labResultId));
        
      } catch (error) {
        // Handle errors during extraction or storage
        const processingTime = new Date().getTime() - startTime.getTime();
        
        // Update processing status to error
        await db.update(biomarkerProcessingStatus)
          .set({
            status: 'error',
            completedAt: new Date(),
            errorMessage: error instanceof Error ? error.message : String(error),
            metadata: {
              processingTime,
              error: error instanceof Error ? error.message : String(error),
              stack: error instanceof Error ? error.stack : undefined
            }
          })
          .where(eq(biomarkerProcessingStatus.labResultId, labResultId));
        
        logger.error(`Error processing biomarkers for lab result ${labResultId}:`, {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
      }
    } catch (error) {
      logger.error(`Unhandled error in processLabResult for lab ${labResultId}:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Ensure we update the processing status even on unhandled errors
      try {
        await db.update(biomarkerProcessingStatus)
          .set({
            status: 'error',
            completedAt: new Date(),
            errorMessage: error instanceof Error ? error.message : String(error),
            metadata: {
              error: error instanceof Error ? error.message : String(error),
              stack: error instanceof Error ? error.stack : undefined
            }
          })
          .where(eq(biomarkerProcessingStatus.labResultId, labResultId));
      } catch (statusUpdateError) {
        logger.error(`Failed to update processing status for lab ${labResultId}:`, {
          originalError: error instanceof Error ? error.message : String(error),
          statusUpdateError: statusUpdateError instanceof Error ? statusUpdateError.message : String(statusUpdateError)
        });
      }
    }
  }
}

export const biomarkerExtractionService = new BiomarkerExtractionService();