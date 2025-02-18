
import { db } from "@db";
import { supplementLogs, qualitativeLogs } from "@db/schema";
import { and, sql, desc } from "drizzle-orm";

export async function getQuantitativeLogs(userId: string) {
  return await db
    .select({
      supplementName: supplementLogs.supplementId,
      takenAt: supplementLogs.takenAt,
      notes: supplementLogs.notes,
      effects: supplementLogs.effects
    })
    .from(supplementLogs)
    .where(
      and(
        sql`${supplementLogs.userId} = ${userId}`,
        sql`${supplementLogs.takenAt} >= NOW() - INTERVAL '30 days'`
      )
    )
    .orderBy(desc(supplementLogs.takenAt));
}

export async function getQualitativeLogs(userId: string) {
  return await db
    .select({
      content: qualitativeLogs.content,
      loggedAt: qualitativeLogs.loggedAt,
      type: qualitativeLogs.type
    })
    .from(qualitativeLogs)
    .where(
      and(
        sql`${qualitativeLogs.userId} = ${userId}`,
        sql`${qualitativeLogs.loggedAt} >= NOW() - INTERVAL '30 days'`
      )
    )
    .orderBy(desc(qualitativeLogs.loggedAt));
}
