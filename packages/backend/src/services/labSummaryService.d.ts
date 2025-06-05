declare class LabSummaryService {
  private SUMMARY_MODEL;
  private MAX_TOKEN_LIMIT;
  private MAX_LABS_PER_REQUEST;
  private LAB_SUMMARY_PROMPT;
  summarizeLabResult(labResultId: number): Promise<string | null>;
  getUserLabSummaries(userId: number, limit?: number): Promise<any[]>;
  findRelevantLabResults(userId: number, query: string, limit?: number): Promise<any[]>;
}
export declare const labSummaryService: LabSummaryService;
export default labSummaryService;
//# sourceMappingURL=labSummaryService.d.ts.map
