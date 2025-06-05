interface Biomarker {
  name: string;
  value: number | string;
  unit: string;
  category: string;
  referenceRange?: string;
  testDate?: Date | string;
  source?: string;
  extractionMethod?: string;
  status?: string;
  confidence?: number | string;
  sourceText?: string | null;
}
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
export declare class BiomarkerExtractionService {
  private extractWithRegex;
  private extractWithLLM;
  private extractWithPatterns;
  private mergeResultsWithConfidence;
  private validateAndStandardizeResults;
  private getMissingCategories;
  private standardizeUnit;
  extractBiomarkers(text: string): Promise<{
    parsedBiomarkers: Biomarker[];
    parsingErrors: string[];
  }>;
  private buildEnhancedPrompt;
  storeBiomarkers(labResultId: number, biomarkers: Biomarker[]): Promise<void>;
  processLabResult(labResultId: number): Promise<void>;
  private normalizeStatus;
}
export declare const biomarkerExtractionService: BiomarkerExtractionService;
export default biomarkerExtractionService;
//# sourceMappingURL=biomarkerExtractionService.d.ts.map
