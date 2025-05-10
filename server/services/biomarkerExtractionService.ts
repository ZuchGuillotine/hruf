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
import { labResults } from '../../db/schema';
import { eq } from 'drizzle-orm';

// Zod schema for biomarker validation
const BiomarkerSchema = z.object({
  name: z.string(),
  value: z.number(),
  unit: z.string(),
  referenceRange: z.string().optional(),
  testDate: z.string().datetime().optional(),
  category: z.enum(['lipid', 'metabolic', 'thyroid', 'vitamin', 'mineral', 'blood', 'liver', 'kidney', 'hormone', 'other']).optional(),
});

const BiomarkersArraySchema = z.array(BiomarkerSchema);

type BiomarkerCategory = 'lipid' | 'metabolic' | 'thyroid' | 'vitamin' | 'mineral' | 'blood' | 'liver' | 'kidney' | 'hormone' | 'other';

// Comprehensive biomarker regex patterns
const BIOMARKER_PATTERNS: Record<string, { pattern: RegExp; category: BiomarkerCategory }> = {
  // Lipid Panel
  cholesterol: {
    pattern: /(?:Total Cholesterol|Cholesterol, Total|Cholesterol):\s*(\d+(?:\.\d+)?)\s*(mg\/dL|mmol\/L)/i,
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
    pattern: /(?:Glucose|Blood Glucose|Fasting Glucose|FBG):\s*(\d+(?:\.\d+)?)\s*(mg\/dL|mmol\/L)/i,
    category: 'metabolic'
  },
  hemoglobinA1c: {
    pattern: /(?:HbA1c|Hemoglobin A1c|A1C):\s*(\d+(?:\.\d+)?)\s*(%|mmol\/mol)/i,
    category: 'metabolic'
  },
  insulin: {
    pattern: /(?:Insulin|Fasting Insulin):\s*(\d+(?:\.\d+)?)\s*(µIU\/mL|pmol\/L)/i,
    category: 'metabolic'
  },

  // Thyroid Panel
  tsh: {
    pattern: /(?:TSH|Thyroid Stimulating Hormone):\s*(\d+(?:\.\d+)?)\s*(mIU\/L|µIU\/mL)/i,
    category: 'thyroid'
  },
  t4: {
    pattern: /(?:T4|Free T4|Thyroxine):\s*(\d+(?:\.\d+)?)\s*(ng\/dL|pmol\/L)/i,
    category: 'thyroid'
  },
  t3: {
    pattern: /(?:T3|Free T3|Triiodothyronine):\s*(\d+(?:\.\d+)?)\s*(pg\/mL|pmol\/L)/i,
    category: 'thyroid'
  },

  // Vitamins
  vitaminD: {
    pattern: /(?:Vitamin D|25-OH Vitamin D|25-Hydroxyvitamin D|25(OH)D):\s*(\d+(?:\.\d+)?)\s*(ng\/mL|nmol\/L)/i,
    category: 'vitamin'
  },
  vitaminB12: {
    pattern: /(?:Vitamin B12|B12|Cobalamin):\s*(\d+(?:\.\d+)?)\s*(pg\/mL|pmol\/L)/i,
    category: 'vitamin'
  },
  folate: {
    pattern: /(?:Folate|Folic Acid|Vitamin B9):\s*(\d+(?:\.\d+)?)\s*(ng\/mL|nmol\/L)/i,
    category: 'vitamin'
  },

  // Minerals
  ferritin: {
    pattern: /(?:Ferritin):\s*(\d+(?:\.\d+)?)\s*(ng\/mL|µg\/L)/i,
    category: 'mineral'
  },
  iron: {
    pattern: /(?:Iron|Serum Iron):\s*(\d+(?:\.\d+)?)\s*(µg\/dL|µmol\/L)/i,
    category: 'mineral'
  },
  magnesium: {
    pattern: /(?:Magnesium|Mg):\s*(\d+(?:\.\d+)?)\s*(mg\/dL|mmol\/L)/i,
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
          break;
        } catch (e) {
          logger.warn('Failed to parse date:', dateMatch[1]);
        }
      }
    }

    // Extract reference ranges
    const referenceRangePattern = /(?:Reference Range|Normal Range|Reference Values?):\s*([^\.]+)/i;
    const referenceRangeMatch = text.match(referenceRangePattern);
    const referenceRange = referenceRangeMatch ? referenceRangeMatch[1].trim() : undefined;

    for (const [name, { pattern, category }] of Object.entries(BIOMARKER_PATTERNS)) {
      const match = text.match(pattern);
      if (match) {
        const [_, value, unit] = match;
        results.push({
          name,
          value: parseFloat(value),
          unit,
          testDate,
          referenceRange,
          category
        });
      }
    }

    return results;
  }

  private async extractWithLLM(text: string): Promise<z.infer<typeof BiomarkerSchema>[]> {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You're a JSON‐only extractor for medical lab results. Extract every lab marker into an array of objects with fields:
                • name (string)
                • value (number)
                • unit (string)
                • referenceRange (optional string)
                • testDate (optional ISO date)
                • category (optional string: 'lipid', 'metabolic', 'thyroid', 'vitamin', 'mineral', 'blood', 'liver', 'kidney', 'hormone', 'other')
              Do not output any commentary—only valid JSON. If a field is missing, omit it.
              Ensure values are numbers, not strings.`
          },
          {
            role: "user",
            content: text
          }
        ],
        response_format: { type: "json_object" }
      });

      const response = JSON.parse(completion.choices[0]?.message?.content || "{}");
      return BiomarkersArraySchema.parse(response.biomarkers || []);
    } catch (error) {
      logger.error('Error extracting biomarkers with LLM:', error);
      return [];
    }
  }

  async extractBiomarkers(text: string): Promise<{
    parsedBiomarkers: z.infer<typeof BiomarkerSchema>[];
    parsingErrors: string[];
  }> {
    const errors: string[] = [];
    try {
      // First try regex extraction
      const regexResults = await this.extractWithRegex(text);

      // If we got less than 15 results or detected potential missing data,
      // fall back to LLM
      if (regexResults.length < 15 || text.length > 1000) {
        const llmResults = await this.extractWithLLM(text);

        // Merge results, preferring regex matches
        const regexNames = new Set(regexResults.map(r => r.name));
        const combinedResults = [
          ...regexResults,
          ...llmResults.filter(r => !regexNames.has(r.name))
        ];

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
      errors.push(`Failed to parse biomarkers: ${error instanceof Error ? error.message : String(error)}`);
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

      // Update the lab result with biomarker data
      await db
        .update(labResults)
        .set({
          metadata: {
            ...labResult.metadata,
            biomarkers: biomarkerResults.parsedBiomarkers,
            parsingErrors: biomarkerResults.parsingErrors,
            extractedAt: new Date().toISOString()
          }
        })
        .where(eq(labResults.id, labResultId));

      logger.info(`Successfully extracted biomarkers for lab result ${labResultId}`, {
        biomarkerCount: biomarkerResults.parsedBiomarkers.length,
        errorCount: biomarkerResults.parsingErrors.length
      });
    } catch (error) {
      logger.error(`Error processing biomarkers for lab result ${labResultId}:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  }
}

export const biomarkerExtractionService = new BiomarkerExtractionService();
export default biomarkerExtractionService;