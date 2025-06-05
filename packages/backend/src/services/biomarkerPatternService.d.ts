import type { BiomarkerCategory } from './biomarkerExtractionService';
export type PatternTier = 'high' | 'medium' | 'low';
interface PatternConfig {
  pattern: RegExp;
  category: BiomarkerCategory;
  tier: PatternTier;
  confidence: number;
  unitMap?: Record<string, string>;
  valueTransform?: (value: string) => number;
  validationRules?: {
    minValue?: number;
    maxValue?: number;
    allowedUnits?: string[];
  };
}
export declare const BIOMARKER_PATTERNS: Record<string, PatternConfig>;
export interface PatternMatch {
  name: string;
  value: number;
  unit: string;
  category: BiomarkerCategory;
  confidence: number;
  tier: PatternTier;
  sourceText: string;
  validationStatus: 'valid' | 'invalid' | 'warning';
  validationMessage?: string;
}
export declare class BiomarkerPatternService {
  private validateMatch;
  private standardizeUnit;
  extractPatterns(text: string): Promise<PatternMatch[]>;
}
export declare const biomarkerPatternService: BiomarkerPatternService;
export {};
//# sourceMappingURL=biomarkerPatternService.d.ts.map
