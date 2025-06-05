import { db } from '@core/db';
import { users } from '@core/db';
import { summarizeOldChats } from '/llmSummaryService';

export async function runChatSummarization() {
  const allUsers = await db.query.users.findMany();

  for (const user of allUsers) {
    try {
      await summarizeOldChats(user.id);
    } catch (error) {
      console.error(`Failed to summarize chats for user ${user.id}:`, error);
    }
  }
}
