
import { db } from '../../db';
import { users } from '../../db/schema';
import { stripeService } from '../services/stripe';
import { eq } from 'drizzle-orm';

export async function updateTrialStatuses() {
  const now = new Date();
  
  // Get all users who are on trial or have expired trials
  const trialUsers = await db.query.users.findMany({
    where: eq(users.subscriptionId, null)
  });

  // Update status for each user
  for (const user of trialUsers) {
    await stripeService.updateTrialStatus(user.id);
  }
}
