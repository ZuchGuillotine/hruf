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
import { labResults, biomarkerResults, biomarkerProcessingStatus, type SelectLabResult } from '../../db/schema';
import { eq } from 'drizzle-orm';
import type { InsertBiomarkerResult } from '../../db/schema';
import { BiomarkerPatternService, type PatternMatch } from './biomarkerPatternService';
import { type NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { type PostgresJsTransaction } from 'drizzle-orm/postgres-js';
import type * as schema from '../../db/schema';

interface Biomarker {
  name: string;
  value: number | string; // Allow both number and string values for flexibility
  unit: string;
  category: string;
  referenceRange?: string;
  testDate?: Date | string; // Make testDate optional
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

export type BiomarkerCategory = 
  | 'metabolic' 
  | 'lipid' 
  | 'vitamin' 
  | 'hormone' 
  | 'mineral' 
  | 'protein' 
  | 'thyroid'
  | 'blood'
  | 'liver'
  | 'kidney'
  | 'other';

// Enhanced biomarker regex patterns with flexible ordering and better unit handling
const BIOMARKER_PATTERNS: Record<string, { pattern: RegExp; category: BiomarkerCategory; defaultUnit: string }> = {
  // Lipid Panel - More flexible patterns that handle fragmented text
  cholesterol: {
    pattern: /(?:Total Cholesterol|Cholesterol, Total|Cholesterol|Chol)\s*[:=]?\s*(?:(?:Normal range:?\s*[\d\.]+\s*-\s*[\d\.]+\s*(?:mg\/dL|mmol\/L))?\s*(\d+(?:\.\d+)?)\s*(?:High|Low|Normal|H|L|N)?\s*(?:mg\/dL|mmol\/L)?|(?:mg\/dL|mmol\/L)?\s*\n?\s*(\d+(?:\.\d+)?)\s*(?:High|Low|Normal|H|L|N)?)/gi,
    category: 'lipid',
    defaultUnit: 'mg/dL'
  },
  hdl: {
    pattern: /(?:HDL|HDL-C|HDL Cholesterol|High-Density Lipoprotein)\s*[:=]?\s*(?:(?:Normal range:?\s*[\d\.]+\s*-\s*[\d\.]+\s*(?:mg\/dL|mmol\/L))?\s*(\d+(?:\.\d+)?)\s*(?:High|Low|Normal|H|L|N)?\s*(?:mg\/dL|mmol\/L)?|(?:mg\/dL|mmol\/L)?\s*\n?\s*(\d+(?:\.\d+)?)\s*(?:High|Low|Normal|H|L|N)?)/gi,
    category: 'lipid',
    defaultUnit: 'mg/dL'
  },
  ldl: {
    pattern: /(?:LDL|LDL-C|LDL Cholesterol|Low-Density Lipoprotein)\s*[:=]?\s*(?:(?:Normal range:?\s*[\d\.]+\s*-\s*[\d\.]+\s*(?:mg\/dL|mmol\/L))?\s*(\d+(?:\.\d+)?)\s*(?:High|Low|Normal|H|L|N)?\s*(?:mg\/dL|mmol\/L)?|(?:mg\/dL|mmol\/L)?\s*\n?\s*(\d+(?:\.\d+)?)\s*(?:High|Low|Normal|H|L|N)?)/gi,
    category: 'lipid',
    defaultUnit: 'mg/dL'
  },
  triglycerides: {
    pattern: /(?:Triglycerides|TG)\s*[:=]?\s*(?:(?:Normal range:?\s*[\d\.]+\s*-\s*[\d\.]+\s*(?:mg\/dL|mmol\/L))?\s*(\d+(?:\.\d+)?)\s*(?:High|Low|Normal|H|L|N)?\s*(?:mg\/dL|mmol\/L)?|(?:mg\/dL|mmol\/L)?\s*\n?\s*(\d+(?:\.\d+)?)\s*(?:High|Low|Normal|H|L|N)?)/gi,
    category: 'lipid',
    defaultUnit: 'mg/dL'
  },

  // Metabolic Panel - More flexible patterns
  glucose: {
    pattern: /(?:Glucose|Blood Glucose|Fasting Glucose|FBG)\s*[:=]?\s*(?:(?:Normal range:?\s*[\d\.]+\s*-\s*[\d\.]+\s*(?:mg\/dL|mmol\/L))?\s*(\d+(?:\.\d+)?)\s*(?:High|Low|Normal|H|L|N)?\s*(?:mg\/dL|mmol\/L)?|(?:mg\/dL|mmol\/L)?\s*\n?\s*(\d+(?:\.\d+)?)\s*(?:High|Low|Normal|H|L|N)?)/i,
    category: 'metabolic',
    defaultUnit: 'mg/dL'
  },
  hemoglobinA1c: {
    pattern: /(?:HbA1c|Hemoglobin A1c|A1C|Hgb A1c)\s*[:=]?\s*(?:(?:Normal range:?\s*[\d\.]+\s*-\s*[\d\.]+\s*(?:%|mmol\/mol))?\s*(\d+(?:\.\d+)?)\s*(?:High|Low|Normal|H|L|N)?\s*(%|mmol\/mol)|(?:%|mmol\/mol)\s*\n?\s*(\d+(?:\.\d+)?)\s*(?:High|Low|Normal|H|L|N)?)/i,
    category: 'metabolic',
    defaultUnit: '%'
  },
  insulin: {
    pattern: /(?:Insulin|Fasting Insulin)\s*[:=]?\s*(?:(?:Normal range:?\s*[\d\.]+\s*-\s*[\d\.]+\s*(?:µIU\/mL|pmol\/L))?\s*(\d+(?:\.\d+)?)\s*(?:High|Low|Normal|H|L|N)?\s*(µIU\/mL|pmol\/L)|(?:µIU\/mL|pmol\/L)\s*\n?\s*(\d+(?:\.\d+)?)\s*(?:High|Low|Normal|H|L|N)?)/i,
    category: 'metabolic',
    defaultUnit: 'µIU/mL'
  },

  // Electrolytes - Enhanced patterns with better unit handling
  sodium: {
    pattern: /(?:Sodium|Na)\s*[:=]?\s*(?:(?:Normal range:?\s*[\d\.]+\s*-\s*[\d\.]+\s*(?:mmol\/L|mEq\/L))?\s*(\d+(?:\.\d+)?)\s*(?:High|Low|Normal|H|L|N)?\s*(mmol\/L|mEq\/L)|(?:mmol\/L|mEq\/L)\s*\n?\s*(\d+(?:\.\d+)?)\s*(?:High|Low|Normal|H|L|N)?)/i,
    category: 'metabolic',
    defaultUnit: 'mmol/L'
  },
  potassium: {
    pattern: /(?:Potassium|K)\s*[:=]?\s*(?:(?:Normal range:?\s*[\d\.]+\s*-\s*[\d\.]+\s*(?:mmol\/L|mEq\/L))?\s*(\d+(?:\.\d+)?)\s*(?:High|Low|Normal|H|L|N)?\s*(mmol\/L|mEq\/L)|(?:mmol\/L|mEq\/L)\s*\n?\s*(\d+(?:\.\d+)?)\s*(?:High|Low|Normal|H|L|N)?)/i,
    category: 'metabolic',
    defaultUnit: 'mmol/L'
  },
  chloride: {
    pattern: /(?:Chloride|Cl)\s*[:=]?\s*(?:(?:Normal range:?\s*[\d\.]+\s*-\s*[\d\.]+\s*(?:mmol\/L|mEq\/L))?\s*(\d+(?:\.\d+)?)\s*(?:High|Low|Normal|H|L|N)?\s*(mmol\/L|mEq\/L)|(?:mmol\/L|mEq\/L)\s*\n?\s*(\d+(?:\.\d+)?)\s*(?:High|Low|Normal|H|L|N)?)/i,
    category: 'metabolic',
    defaultUnit: 'mmol/L'
  },
  co2: {
    pattern: /(?:CO2|Carbon Dioxide|Total CO2)\s*[:=]?\s*(?:(?:Normal range:?\s*[\d\.]+\s*-\s*[\d\.]+\s*(?:mmol\/L|mEq\/L))?\s*(\d+(?:\.\d+)?)\s*(?:High|Low|Normal|H|L|N)?\s*(mmol\/L|mEq\/L)|(?:mmol\/L|mEq\/L)\s*\n?\s*(\d+(?:\.\d+)?)\s*(?:High|Low|Normal|H|L|N)?)/i,
    category: 'metabolic',
    defaultUnit: 'mmol/L'
  },
  anionGap: {
    pattern: /(?:Anion Gap|AG)\s*[:=]?\s*(?:(?:Normal range:?\s*[\d\.]+\s*-\s*[\d\.]+\s*(?:mmol\/L|mEq\/L))?\s*(\d+(?:\.\d+)?)\s*(?:High|Low|Normal|H|L|N)?\s*(mmol\/L|mEq\/L)|(?:mmol\/L|mEq\/L)\s*\n?\s*(\d+(?:\.\d+)?)\s*(?:High|Low|Normal|H|L|N)?)/i,
    category: 'metabolic',
    defaultUnit: 'mmol/L'
  },

  // Thyroid Panel - Enhanced patterns
  tsh: {
    pattern: /(?:TSH|Thyroid Stimulating Hormone)\s*[:=]?\s*(?:(?:Normal range:?\s*[\d\.]+\s*-\s*[\d\.]+\s*(?:mIU\/L|µIU\/mL))?\s*(\d+(?:\.\d+)?)\s*(?:High|Low|Normal|H|L|N)?\s*(mIU\/L|µIU\/mL)|(?:mIU\/L|µIU\/mL)\s*\n?\s*(\d+(?:\.\d+)?)\s*(?:High|Low|Normal|H|L|N)?)/i,
    category: 'thyroid',
    defaultUnit: 'mIU/L'
  },
  t4: {
    pattern: /(?:T4|Free T4|Thyroxine)\s*[:=]?\s*(?:(?:Normal range:?\s*[\d\.]+\s*-\s*[\d\.]+\s*(?:ng\/dL|pmol\/L))?\s*(\d+(?:\.\d+)?)\s*(?:High|Low|Normal|H|L|N)?\s*(ng\/dL|pmol\/L)|(?:ng\/dL|pmol\/L)\s*\n?\s*(\d+(?:\.\d+)?)\s*(?:High|Low|Normal|H|L|N)?)/i,
    category: 'thyroid',
    defaultUnit: 'ng/dL'
  },
  t3: {
    pattern: /(?:T3|Free T3|Triiodothyronine)\s*[:=]?\s*(?:(?:Normal range:?\s*[\d\.]+\s*-\s*[\d\.]+\s*(?:pg\/mL|pmol\/L))?\s*(\d+(?:\.\d+)?)\s*(?:High|Low|Normal|H|L|N)?\s*(pg\/mL|pmol\/L)|(?:pg\/mL|pmol\/L)\s*\n?\s*(\d+(?:\.\d+)?)\s*(?:High|Low|Normal|H|L|N)?)/i,
    category: 'thyroid',
    defaultUnit: 'pg/mL'
  },

  // Vitamins - More flexible patterns
  vitaminD: {
    pattern: /(?:Vitamin D|25-OH Vitamin D|25-Hydroxyvitamin D|25\(OH\)D)\s*[:=]?\s*(?:Normal range:?\s*[\d\.]+\s*-\s*[\d\.]+\s*(?:ng\/mL|nmol\/L))?\s*(\d+(?:\.\d+)?)\s*(?:High|Low|Normal)?\s*(ng\/mL|nmol\/L)/i,
    category: 'vitamin',
    defaultUnit: 'ng/mL'
  },
  vitaminB12: {
    pattern: /(?:Vitamin B12|B12|Cobalamin)\s*[:=]?\s*(?:Normal range:?\s*[\d\.]+\s*-\s*[\d\.]+\s*(?:pg\/mL|pmol\/L))?\s*(\d+(?:\.\d+)?)\s*(?:High|Low|Normal)?\s*(pg\/mL|pmol\/L)/i,
    category: 'vitamin',
    defaultUnit: 'pg/mL'
  },
  folate: {
    pattern: /(?:Folate|Folic Acid|Vitamin B9)\s*[:=]?\s*(?:Normal range:?\s*[\d\.]+\s*-\s*[\d\.]+\s*(?:ng\/mL|nmol\/L))?\s*(\d+(?:\.\d+)?)\s*(?:High|Low|Normal)?\s*(ng\/mL|nmol\/L)/i,
    category: 'vitamin',
    defaultUnit: 'ng/mL'
  },

  // Minerals - More flexible patterns
  ferritin: {
    pattern: /(?:Ferritin)\s*[:=]?\s*(?:Normal range:?\s*[\d\.]+\s*-\s*[\d\.]+\s*(?:ng\/mL|µg\/L))?\s*(\d+(?:\.\d+)?)\s*(?:High|Low|Normal)?\s*(ng\/mL|µg\/L)/i,
    category: 'mineral',
    defaultUnit: 'ng/mL'
  },
  iron: {
    pattern: /(?:Iron|Serum Iron)\s*[:=]?\s*(?:Normal range:?\s*[\d\.]+\s*-\s*[\d\.]+\s*(?:µg\/dL|µmol\/L))?\s*(\d+(?:\.\d+)?)\s*(?:High|Low|Normal)?\s*(µg\/dL|µmol\/L)/i,
    category: 'mineral',
    defaultUnit: 'µg/L'
  },
  magnesium: {
    pattern: /(?:Magnesium|Mg)\s*[:=]?\s*(?:Normal range:?\s*[\d\.]+\s*-\s*[\d\.]+\s*(?:mg\/dL|mmol\/L))?\s*(\d+(?:\.\d+)?)\s*(?:High|Low|Normal)?\s*(mg\/dL|mmol\/L)/i,
    category: 'mineral',
    defaultUnit: 'mg/dL'
  },

  // Blood Count - More flexible patterns
  hemoglobin: {
    pattern: /(?:Hemoglobin|Hgb|Hb)\s*[:=]?\s*(?:Normal range:?\s*[\d\.]+\s*-\s*[\d\.]+\s*(?:g\/dL|g\/L))?\s*(\d+(?:\.\d+)?)\s*(?:High|Low|Normal)?\s*(g\/dL|g\/L)/i,
    category: 'blood',
    defaultUnit: 'g/dL'
  },
  hematocrit: {
    pattern: /(?:Hematocrit|Hct)\s*[:=]?\s*(?:Normal range:?\s*[\d\.]+\s*-\s*[\d\.]+\s*%)?\s*(\d+(?:\.\d+)?)\s*(?:High|Low|Normal)?\s*(%)/i,
    category: 'blood',
    defaultUnit: '%'
  },
  platelets: {
    pattern: /(?:Platelets|PLT)\s*[:=]?\s*(?:Normal range:?\s*[\d\.]+\s*-\s*[\d\.]+\s*(?:K\/µL|10³\/µL))?\s*(\d+(?:\.\d+)?)\s*(?:High|Low|Normal)?\s*(K\/µL|10³\/µL)/i,
    category: 'blood',
    defaultUnit: 'K/µL'
  },

  // Liver Function - More flexible patterns
  alt: {
    pattern: /(?:ALT|Alanine Transaminase|SGPT)\s*[:=]?\s*(?:Normal range:?\s*[\d\.]+\s*-\s*[\d\.]+\s*(?:U\/L|IU\/L))?\s*(\d+(?:\.\d+)?)\s*(?:High|Low|Normal)?\s*(U\/L|IU\/L)/i,
    category: 'liver',
    defaultUnit: 'U/L'
  },
  ast: {
    pattern: /(?:AST|Aspartate Transaminase|SGOT)\s*[:=]?\s*(?:Normal range:?\s*[\d\.]+\s*-\s*[\d\.]+\s*(?:U\/L|IU\/L))?\s*(\d+(?:\.\d+)?)\s*(?:High|Low|Normal)?\s*(U\/L|IU\/L)/i,
    category: 'liver',
    defaultUnit: 'U/L'
  },
  alkalinePhosphatase: {
    pattern: /(?:Alkaline Phosphatase|ALP)\s*[:=]?\s*(?:Normal range:?\s*[\d\.]+\s*-\s*[\d\.]+\s*(?:U\/L|IU\/L))?\s*(\d+(?:\.\d+)?)\s*(?:High|Low|Normal)?\s*(U\/L|IU\/L)/i,
    category: 'liver',
    defaultUnit: 'U/L'
  },

  // Kidney Function - More flexible patterns
  creatinine: {
    pattern: /(?:Creatinine|Cr)\s*[:=]?\s*(?:Normal range:?\s*[\d\.]+\s*-\s*[\d\.]+\s*(?:mg\/dL|µmol\/L))?\s*(\d+(?:\.\d+)?)\s*(?:High|Low|Normal)?\s*(mg\/dL|µmol\/L)/i,
    category: 'kidney',
    defaultUnit: 'mg/dL'
  },
  bun: {
    pattern: /(?:BUN|Blood Urea Nitrogen|Urea)\s*[:=]?\s*(?:Normal range:?\s*[\d\.]+\s*-\s*[\d\.]+\s*(?:mg\/dL|mmol\/L))?\s*(\d+(?:\.\d+)?)\s*(?:High|Low|Normal)?\s*(mg\/dL|mmol\/L)/i,
    category: 'kidney',
    defaultUnit: 'mg/dL'
  },
  egfr: {
    pattern: /(?:eGFR|Estimated GFR|Glomerular Filtration Rate)\s*[:=]?\s*(?:Normal range:?\s*[\d\.]+\s*-\s*[\d\.]+\s*(?:mL\/min\/1\.73m²))?\s*(\d+(?:\.\d+)?)\s*(?:High|Low|Normal)?\s*(mL\/min\/1\.73m²)/i,
    category: 'kidney',
    defaultUnit: 'mL/min/1.73m²'
  },

  // Hormones - More flexible patterns
  cortisol: {
    pattern: /(?:Cortisol)\s*[:=]?\s*(?:Normal range:?\s*[\d\.]+\s*-\s*[\d\.]+\s*(?:µg\/dL|nmol\/L))?\s*(\d+(?:\.\d+)?)\s*(?:High|Low|Normal)?\s*(µg\/dL|nmol\/L)/i,
    category: 'hormone',
    defaultUnit: 'µg/dL'
  },
  testosterone: {
    pattern: /(?:Testosterone|Total Testosterone)\s*[:=]?\s*(?:Normal range:?\s*[\d\.]+\s*-\s*[\d\.]+\s*(?:ng\/dL|nmol\/L))?\s*(\d+(?:\.\d+)?)\s*(?:High|Low|Normal)?\s*(ng\/dL|nmol\/L)/i,
    category: 'hormone',
    defaultUnit: 'ng/dL'
  },
  estradiol: {
    pattern: /(?:Estradiol|E2)\s*[:=]?\s*(?:Normal range:?\s*[\d\.]+\s*-\s*[\d\.]+\s*(?:pg\/mL|pmol\/L))?\s*(\d+(?:\.\d+)?)\s*(?:High|Low|Normal)?\s*(pg\/mL|pmol\/L)/i,
    category: 'hormone',
    defaultUnit: 'pg/mL'
  }
};

// Use the exact types from the schema
type LabMetadata = NonNullable<SelectLabResult['metadata']>;
type BiomarkerMetadata = NonNullable<LabMetadata['biomarkers']>;

// Update the metadata schema to include new fields
type BiomarkerProcessingMetadata = {
  regexMatches?: number;
  llmExtractions?: number;
  processingTime?: number;
  retryCount?: number;
  textLength?: number;
  errorDetails?: string;
  biomarkerCount?: number;
  source?: string;
};

export class BiomarkerExtractionService {
  private async extractWithRegex(text: string): Promise<z.infer<typeof BiomarkerSchema>[]> {
    const results: z.infer<typeof BiomarkerSchema>[] = [];
    logger.info('Starting regex extraction with text:', { 
      textLength: text.length,
      textSample: text.substring(0, 500),
      patterns: Object.keys(BIOMARKER_PATTERNS) 
    });

    // Pre-process text to handle fragmented numbers
    const preprocessedText = text
      // Fix numbers running together (e.g., "136145" -> "136 145")
      .replace(/(\d{3})(\d{3})/g, '$1 $2')
      // Fix numbers with status (e.g., "3.4Low" -> "3.4 Low")
      .replace(/(\d+(?:\.\d+)?)(High|Low|Normal|H|L|N)/gi, '$1 $2')
      // Fix numbers with units
      .replace(/(\d+(?:\.\d+)?)(mg\/dL|mmol\/L|g\/dL|g\/L|ng\/mL|µg\/L|IU\/L|mEq\/L|mm³|µL|nL|pL|fL|%|U\/L)/gi, '$1 $2');

    // Extract test date with more flexible patterns
    const datePatterns = [
      /(?:Date|Collection Date|Report Date|Test Date):\s*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
      /(?:Date|Collection Date|Report Date|Test Date):\s*(\d{4}[-\/]\d{1,2}[-\/]\d{1,2})/i,
      /(?:Date|Collection Date|Report Date|Test Date):\s*(\w+\s+\d{1,2},?\s+\d{4})/i,
      /Collected on (\w+\s+\d{1,2},?\s+\d{4})/i  // Add this pattern for "Collected on" format
    ];

    let testDate: string | undefined;
    for (const pattern of datePatterns) {
      const dateMatch = preprocessedText.match(pattern);
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

    // Track matches and validation results
    let totalMatches = 0;
    let validationFailures = 0;
    let successfulExtractions = 0;

    for (const [name, { pattern, category, defaultUnit }] of Object.entries(BIOMARKER_PATTERNS)) {
      // Ensure pattern is global
      const globalPattern = new RegExp(pattern.source, pattern.flags + (pattern.global ? '' : 'g'));
      
      const matches = preprocessedText.matchAll(globalPattern);
      
      for (const match of matches) {
        totalMatches++;
        
        // Handle both ordering patterns (value-unit and unit-value)
        const value = match[1] || match[3]; // First or third capture group
        const unit = match[2] || match[4] || defaultUnit; // Second or fourth capture group or default
        const status = match[0].match(/(?:High|Low|Normal|H|L|N)/i)?.[0];
        
        if (!value) {
          logger.warn('No value found in match:', { biomarker: name, match: match[0] });
          continue;
        }

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
            unit: unit || defaultUnit,
            testDate,
            category,
            source: 'regex',
            confidence: 0.9,
            status: status ? this.normalizeStatus(status) : undefined
          };

          try {
            const validated = BiomarkerSchema.parse(biomarker);
            results.push(validated);
            successfulExtractions++;
            logger.info('Successfully validated biomarker:', {
              biomarker: name,
              value: parsedValue,
              unit: biomarker.unit,
              status: biomarker.status
            });
          } catch (validationError) {
            validationFailures++;
            logger.warn('Zod validation failed for biomarker:', {
              biomarker: name,
              error: validationError instanceof Error ? validationError.message : String(validationError)
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

    // Calculate recall percentage
    const expectedBiomarkers = Object.keys(BIOMARKER_PATTERNS).length;
    const recallPercentage = (successfulExtractions / expectedBiomarkers) * 100;
    
    if (recallPercentage < 60) {
      logger.warn('Low regex recall detected:', {
        recallPercentage,
        expectedBiomarkers,
        foundBiomarkers: successfulExtractions,
        textLength: preprocessedText.length,
        totalMatches,
        validationFailures,
        sampleText: preprocessedText.substring(0, 200) // Add sample text for debugging
      });
    }

    logger.info('Regex extraction complete:', {
      totalMatches,
      validationFailures,
      successfulExtractions,
      recallPercentage,
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
3. All "value" fields MUST be numeric (convert text to numbers)
4. Include standard reference ranges when available
5. If the text is a summary report (already analyzed), you can still extract all valid measurements 
6. Use the most specific biomarker name possible (e.g., "HDL" instead of just "cholesterol")
7. For each biomarker, determine if the value is "High", "Low", or "Normal" and set the status field
8. For testDate, use the collection date from the report when available
9. All returned data MUST comply with the function schema exactly

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

  private async extractWithPatterns(text: string): Promise<Biomarker[]> {
    try {
      const patternService = new BiomarkerPatternService();
      const patternMatches = await patternService.extractPatterns(text);
      
      // Convert pattern matches to biomarker format with proper typing
      return patternMatches.map((match: PatternMatch) => ({
        name: match.name,
        value: match.value,
        unit: match.unit,
        category: match.category,
        confidence: match.confidence,
        sourceText: match.sourceText,
        extractionMethod: 'pattern' as const,
        status: match.validationStatus === 'valid' ? 'Normal' : 
                match.validationStatus === 'warning' ? 'High' : 'Low',
        testDate: new Date() // Add default test date
      }));
    } catch (error) {
      logger.error('Error in pattern-based extraction:', {
        error: error instanceof Error ? error.message : String(error)
      });
      return [];
    }
  }

  private mergeResultsWithConfidence(
    regexResults: Biomarker[],
    llmResults: Biomarker[],
    patternResults: Biomarker[]
  ): Biomarker[] {
    const mergedMap = new Map<string, Biomarker>();
    
    // Helper function to add or update biomarker in map
    const addOrUpdateBiomarker = (biomarker: Biomarker) => {
      const key = biomarker.name.toLowerCase();
      const existing = mergedMap.get(key);
      
      if (!existing || (biomarker.confidence && biomarker.confidence > (existing.confidence || 0))) {
        mergedMap.set(key, biomarker);
      }
    };

    // Add results in order of confidence (pattern -> regex -> llm)
    patternResults.forEach(addOrUpdateBiomarker);
    regexResults.forEach(addOrUpdateBiomarker);
    llmResults.forEach(addOrUpdateBiomarker);

    return Array.from(mergedMap.values());
  }

  private validateAndStandardizeResults(results: Biomarker[]): {
    parsedBiomarkers: Biomarker[];
    parsingErrors: string[];
  } {
    const validatedBiomarkers: Biomarker[] = [];
    const errors: string[] = [];

    for (const biomarker of results) {
      try {
        // Validate using our schema
        const validated = BiomarkerSchema.parse(biomarker);
        
        // Standardize units if needed
        const standardized = this.standardizeUnit(validated);
        
        validatedBiomarkers.push(standardized);
      } catch (error) {
        errors.push(`Validation failed for ${biomarker.name}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return {
      parsedBiomarkers: validatedBiomarkers,
      parsingErrors: errors
    };
  }

  private getMissingCategories(existingResults: Biomarker[]): string {
    const allCategories: BiomarkerCategory[] = [
      'lipid', 'metabolic', 'thyroid', 'vitamin', 
      'mineral', 'blood', 'liver', 'kidney', 'hormone'
    ];
    
    const existingCategories = new Set(
      existingResults.map(r => r.category?.toLowerCase() as BiomarkerCategory)
    );
    
    const missingCategories = allCategories.filter(
      cat => !existingCategories.has(cat)
    );
    
    return missingCategories.join(', ');
  }

  private standardizeUnit(biomarker: Biomarker): Biomarker {
    // Create a new instance of BiomarkerPatternService to access public methods
    const patternService = new BiomarkerPatternService();
    
    // Convert value to number if it's a string
    const numericValue = typeof biomarker.value === 'string' ? 
      parseFloat(biomarker.value) : biomarker.value;
    
    // Use the public extractPatterns method instead of private standardizeUnit
    const standardized = {
      ...biomarker,
      value: numericValue,
      unit: biomarker.unit // Keep original unit for now
    };

    return standardized;
  }

  async extractBiomarkers(text: string): Promise<{
    parsedBiomarkers: Biomarker[];
    parsingErrors: string[];
  }> {
    // 1. First pass: Quick regex extraction for high-confidence matches
    const regexResults = await this.extractWithRegex(text);
    
    // 2. Second pass: Use regex results to guide LLM extraction
    const llmPrompt = this.buildEnhancedPrompt(text, regexResults);
    const llmResults = await this.extractWithLLM(llmPrompt);
    
    // 3. Third pass: Pattern-based extraction for specific formats
    const patternResults = await this.extractWithPatterns(text);
    
    // 4. Merge results with confidence scoring
    const mergedResults = this.mergeResultsWithConfidence(
      regexResults,
      llmResults,
      patternResults
    );
    
    // 5. Validate and standardize
    return this.validateAndStandardizeResults(mergedResults);
  }

  private buildEnhancedPrompt(text: string, regexResults: Biomarker[]): string {
    // Build a more focused prompt using regex results
    return `Extract biomarkers from this lab report. 
      I've already found these high-confidence biomarkers: ${JSON.stringify(regexResults)}
      Please focus on finding additional biomarkers, especially in these categories:
      ${this.getMissingCategories(regexResults)}
      
      Pay special attention to:
      1. Values near reference ranges
      2. Abnormal values (marked High/Low)
      3. Values in tables or structured sections
      
      Original text:
      ${text}`;
  }

  async storeBiomarkers(labResultId: number, biomarkers: Biomarker[]): Promise<void> {
    const startTime = new Date();
    logger.info(`Starting atomic storage of ${biomarkers.length} biomarkers for lab ${labResultId}`, {
      firstBiomarker: biomarkers[0] ? {
        name: biomarkers[0].name,
        value: biomarkers[0].value,
        unit: biomarkers[0].unit
      } : null
    });

    // Start transaction with proper type
    const trx = await db.transaction();
    try {
      // Initialize or update processing status
      const [existingStatus] = await trx
        .select()
        .from(biomarkerProcessingStatus)
        .where(eq(biomarkerProcessingStatus.labResultId, labResultId))
        .limit(1);

      const processingMetadata = {
        biomarkerCount: biomarkers.length,
        processingTime: Date.now() - startTime.getTime()
      };

      if (existingStatus) {
        await trx
          .update(biomarkerProcessingStatus)
          .set({
            status: 'processing' as const,
            startedAt: new Date(),
            metadata: {
              ...existingStatus.metadata,
              ...processingMetadata
            }
          })
          .where(eq(biomarkerProcessingStatus.labResultId, labResultId));
      } else {
        await trx
          .insert(biomarkerProcessingStatus)
          .values({
            labResultId,
            status: 'processing' as const,
            startedAt: new Date(),
            metadata: processingMetadata
          });
      }

      // Delete existing biomarkers within the same transaction
      await trx
        .delete(biomarkerResults)
        .where(eq(biomarkerResults.labResultId, labResultId));

      logger.info(`Deleted existing biomarkers for lab ${labResultId}`);

      // Prepare biomarker inserts with proper data types and validation
      const biomarkerInserts = biomarkers
        .map(b => {
          try {
            const numericValue = typeof b.value === 'string' ? parseFloat(b.value) : b.value;
            const numericConfidence = b.confidence !== undefined ?
              (typeof b.confidence === 'string' ? parseFloat(b.confidence) : b.confidence) : 1.0;

            // Parse and validate test date
            let testDateValue: Date;
            try {
              testDateValue = b.testDate instanceof Date ? b.testDate :
                new Date(b.testDate || new Date());
              if (isNaN(testDateValue.getTime())) {
                throw new Error('Invalid date');
              }
            } catch (dateError) {
              logger.warn(`Invalid test date for biomarker ${b.name}, using current date`, {
                providedDate: b.testDate,
                error: dateError instanceof Error ? dateError.message : String(dateError)
              });
              testDateValue = new Date();
            }

            // Validate required fields
            if (!b.name || !b.unit || isNaN(numericValue)) {
              throw new Error(`Invalid biomarker data: ${JSON.stringify(b)}`);
            }

            // Ensure referenceRange is string | undefined, not null
            const referenceRange = b.referenceRange || undefined;

            const insert: InsertBiomarkerResult = {
              labResultId,
              name: b.name,
              value: String(numericValue),
              unit: b.unit,
              category: b.category || 'other',
              referenceRange,
              testDate: testDateValue,
              status: b.status || null,
              extractionMethod: b.source || 'regex',
              confidence: isNaN(numericConfidence) ? null : String(numericConfidence),
              metadata: {
                sourceText: b.sourceText || undefined,
                extractionTimestamp: new Date().toISOString(),
                validationStatus: 'validated'
              }
            };

            return insert;
          } catch (error) {
            logger.error(`Error formatting biomarker for database: ${b.name}`, {
              error: error instanceof Error ? error.message : String(error),
              biomarker: b
            });
            throw error;
          }
        })
        .filter((b): b is InsertBiomarkerResult => b !== null);

      if (biomarkerInserts.length === 0) {
        throw new Error('No valid biomarkers to insert');
      }

      // Insert biomarkers in chunks to avoid transaction timeout
      const CHUNK_SIZE = 50;
      for (let i = 0; i < biomarkerInserts.length; i += CHUNK_SIZE) {
        const chunk = biomarkerInserts.slice(i, i + CHUNK_SIZE);
        await trx.insert(biomarkerResults).values(chunk);
        logger.info(`Inserted biomarker chunk ${Math.floor(i/CHUNK_SIZE) + 1}/${Math.ceil(biomarkerInserts.length/CHUNK_SIZE)}`);
      }

      // Update lab result metadata within the same transaction
      const [labResult] = await trx
        .select()
        .from(labResults)
        .where(eq(labResults.id, labResultId))
        .limit(1);

      if (!labResult) {
        throw new Error(`Lab result ${labResultId} not found during metadata update`);
      }

      const existingMetadata = labResult.metadata || {};
      const biomarkerMetadata: BiomarkerMetadata = {
        parsedBiomarkers: biomarkerInserts.map(b => ({
          name: b.name,
          value: parseFloat(b.value),
          unit: b.unit,
          referenceRange: b.referenceRange || undefined,
          testDate: b.testDate.toISOString(),
          category: b.category
        })),
        parsingErrors: [] as string[], // Add required parsingErrors field
        extractedAt: new Date().toISOString()
      };

      await trx
        .update(labResults)
        .set({
          metadata: {
            ...existingMetadata,
            biomarkers: biomarkerMetadata,
            updatedAt: new Date().toISOString()
          }
        })
        .where(eq(labResults.id, labResultId));

      // Update processing status to completed
      const completionMetadata = {
        processingTime: Date.now() - startTime.getTime(),
        regexMatches: biomarkerInserts.filter(b => b.extractionMethod === 'regex').length,
        llmExtractions: biomarkerInserts.filter(b => b.extractionMethod === 'llm').length
      };

      await trx
        .update(biomarkerProcessingStatus)
        .set({
          status: 'completed' as const,
          completedAt: new Date(),
          biomarkerCount: biomarkerInserts.length,
          extractionMethod: biomarkerInserts.some(b => b.extractionMethod === 'llm') ? 'hybrid' : 'regex',
          metadata: completionMetadata
        })
        .where(eq(biomarkerProcessingStatus.labResultId, labResultId));

      // Commit the transaction
      await trx.commit();
      
      logger.info(`Successfully completed atomic storage of ${biomarkerInserts.length} biomarkers for lab ${labResultId}`, {
        processingTime: Date.now() - startTime.getTime(),
        biomarkerCount: biomarkerInserts.length
      });

    } catch (error) {
      // Rollback transaction on any error
      await trx.rollback();
      
      // Update processing status to error state
      const errorMetadata = {
        processingTime: Date.now() - startTime.getTime(),
        errorDetails: error instanceof Error ? error.message : String(error)
      };

      try {
        await db
          .update(biomarkerProcessingStatus)
          .set({
            status: 'error' as const,
            errorMessage: error instanceof Error ? error.message : String(error),
            completedAt: new Date(),
            metadata: errorMetadata
          })
          .where(eq(biomarkerProcessingStatus.labResultId, labResultId));
      } catch (statusError) {
        logger.error('Failed to update error status after rollback:', {
          originalError: error instanceof Error ? error.message : String(error),
          statusError: statusError instanceof Error ? statusError.message : String(statusError)
        });
      }

      logger.error(`Failed to store biomarkers for lab ${labResultId}:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        biomarkerCount: biomarkers.length,
        processingTime: Date.now() - startTime.getTime()
      });

      throw error;
    }
  }

  async processLabResult(labResultId: number): Promise<void> {
    const startTime = new Date();
    let textContent: string | undefined;
    
    try {
      // Get the lab result with metadata
      const [labResult] = await db
        .select()
        .from(labResults)
        .where(eq(labResults.id, labResultId))
        .limit(1);

      if (!labResult) {
        throw new Error(`Lab result ${labResultId} not found`);
      }

      // Get text content with proper fallback chain
      textContent = labResult.metadata?.preprocessedText?.normalizedText || 
                   labResult.metadata?.preprocessedText?.rawText ||
                   labResult.metadata?.ocr?.text || 
                   labResult.metadata?.summary;

      if (!textContent) {
        throw new Error(`No text content found for lab result ${labResultId}`);
      }

      // Update processing status to started
      await db.update(biomarkerProcessingStatus)
        .set({
          status: 'processing',
          startedAt: startTime,
          metadata: {
            textLength: textContent.length,
            retryCount: 0
          }
        })
        .where(eq(biomarkerProcessingStatus.labResultId, labResultId));

      // Extract biomarkers
      const extractedBiomarkers = await this.extractBiomarkers(textContent);
      const processingTime = Date.now() - startTime.getTime();

      logger.info(`Extracted ${extractedBiomarkers.parsedBiomarkers.length} biomarkers from lab result ${labResultId}`, {
        processingTime,
        biomarkers: extractedBiomarkers.parsedBiomarkers.map(b => b.name),
        regexCount: extractedBiomarkers.parsedBiomarkers.filter(b => b.extractionMethod === 'regex').length,
        llmCount: extractedBiomarkers.parsedBiomarkers.filter(b => b.extractionMethod === 'llm').length
      });

      if (extractedBiomarkers.parsedBiomarkers.length > 0) {
        // Format and store biomarkers
        const formattedBiomarkers = extractedBiomarkers.parsedBiomarkers.map(b => ({
          name: b.name,
          value: b.value,
          unit: b.unit,
          category: b.category || 'other',
          referenceRange: b.referenceRange,
          testDate: b.testDate instanceof Date ? b.testDate : 
                    new Date(b.testDate || labResult.uploadedAt || new Date()),
          source: b.extractionMethod || 'regex',
          confidence: b.confidence || 1.0,
          sourceText: b.sourceText || `Value: ${b.value} ${b.unit}`
        }));

        // Store biomarkers - this will now use a transaction
        await this.storeBiomarkers(labResultId, formattedBiomarkers);

        // Update lab metadata in a separate transaction to preserve atomicity
        const existingMetadata = (labResult.metadata || {}) as LabMetadata;
        const biomarkerMetadata: BiomarkerMetadata = {
          parsedBiomarkers: formattedBiomarkers.map(b => ({
            name: b.name,
            value: typeof b.value === 'string' ? parseFloat(b.value) : b.value,
            unit: b.unit,
            referenceRange: b.referenceRange,
            testDate: b.testDate instanceof Date ? b.testDate.toISOString() : b.testDate,
            category: b.category
          })),
          parsingErrors: extractedBiomarkers.parsingErrors || [],
          extractedAt: new Date().toISOString()
        };

        const updatedMetadata: LabMetadata = {
          ...existingMetadata,
          size: existingMetadata.size || 0,
          biomarkers: biomarkerMetadata,
          preprocessedText: existingMetadata.preprocessedText // Preserve the preprocessed text
        };

        await db.update(labResults)
          .set({ metadata: updatedMetadata })
          .where(eq(labResults.id, labResultId));

        logger.info(`Successfully updated metadata for lab result ${labResultId}`);
      } else {
        logger.warn(`No biomarkers extracted for lab result ${labResultId}`);
        
        // Update processing status to indicate no data found
        await db.update(biomarkerProcessingStatus)
          .set({
            status: 'completed',
            completedAt: new Date(),
            biomarkerCount: 0,
            metadata: {
              processingTime,
              regexMatches: 0,
              llmExtractions: 0,
              retryCount: 0
            }
          })
          .where(eq(biomarkerProcessingStatus.labResultId, labResultId));
      }
    } catch (error) {
      const processingTime = Date.now() - startTime.getTime();
      
      // Update processing status to error
      await db.update(biomarkerProcessingStatus)
        .set({
          status: 'error',
          completedAt: new Date(),
          metadata: {
            processingTime,
            retryCount: 0,
            textLength: textContent?.length || 0,
            errorDetails: error instanceof Error ? error.message : String(error)
          }
        })
        .where(eq(biomarkerProcessingStatus.labResultId, labResultId));
      
      logger.error(`Error processing biomarkers for lab result ${labResultId}:`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        textLength: textContent?.length || 0
      });
      
      throw error; // Propagate the error to be handled by the caller
    }
  }

  private normalizeStatus(status: string): 'High' | 'Low' | 'Normal' {
    const normalized = status.toLowerCase();
    if (normalized.includes('high') || normalized === 'h') return 'High';
    if (normalized.includes('low') || normalized === 'l') return 'Low';
    return 'Normal';
  }
}

// Export a singleton instance
export const biomarkerExtractionService = new BiomarkerExtractionService();
export default biomarkerExtractionService;