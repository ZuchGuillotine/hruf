export declare function getQuantitativeLogs(
  userId: string,
  days?: number
): Promise<
  {
    supplementName: string | null;
    dosage: string | null;
    takenAt: Date;
    notes: string | null;
    effects: {
      mood?: number;
      energy?: number;
      sleep?: number;
      sideEffects?: string[];
    } | null;
  }[]
>;
export declare function getQualitativeLogs(
  userId: string | number,
  fromDate?: Date
): Promise<
  {
    content: string;
    loggedAt: Date | null;
    type: string;
    metadata: Record<string, unknown> | null;
  }[]
>;
export declare function getQueryChats(
  userId: string | number,
  fromDate?: Date
): Promise<
  {
    id: number;
    userId: number | null;
    messages:
      | {
          role: string;
          content: string;
        }[]
      | null;
    createdAt: Date | null;
    updatedAt: Date | null;
    metadata: Record<string, unknown> | null;
  }[]
>;
//# sourceMappingURL=logService.d.ts.map
