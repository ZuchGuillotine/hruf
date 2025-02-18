
import { db } from "@db";
import { supplementLogs, qualitativeLogs, supplements } from "@db/schema";
import { and, sql, desc, eq } from "drizzle-orm";

export async function getQuantitativeLogs(userId: string, days: number = 30) {
  return await db
    .select({
      supplementName: supplements.name,
      dosage: supplements.dosage,
      takenAt: supplementLogs.takenAt,
      notes: supplementLogs.notes,
      effects: supplementLogs.effects
    })
    .from(supplementLogs)
    .leftJoin(supplements, eq(supplements.id, supplementLogs.supplementId))
    .where(
      and(
        eq(supplementLogs.userId, parseInt(userId)),
        sql`${supplementLogs.takenAt} >= NOW() - INTERVAL '${days} days'`
      )
    )
    .orderBy(desc(supplementLogs.takenAt));
}

export async function getQualitativeLogs(userId: string, days: number = 30) {
  return await db
    .select({
      content: qualitativeLogs.content,
      loggedAt: qualitativeLogs.loggedAt,
      type: qualitativeLogs.type,
      metadata: qualitativeLogs.metadata
    })
    .from(qualitativeLogs)
    .where(
      and(
        eq(qualitativeLogs.userId, parseInt(userId)),
        sql`${qualitativeLogs.loggedAt} >= NOW() - INTERVAL '${days} days'`
      )
    )
    .orderBy(desc(qualitativeLogs.loggedAt));
}
