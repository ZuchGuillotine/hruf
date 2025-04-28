
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

async function fixAdminSubscriptions() {
  try {
    // Get all admin users
    const adminUsers = await db
      .select()
      .from(users)
      .where(eq(users.isAdmin, true));

    console.log(`Found ${adminUsers.length} admin users`);

    // Update each admin user to have pro status
    for (const user of adminUsers) {
      await db.update(users)
        .set({ 
          isPro: true,
          subscriptionStatus: 'active'
        })
        .where(eq(users.id, user.id));
      
      console.log(`Updated admin user ${user.id} to pro status`);
    }

    console.log('Finished updating admin subscriptions');
  } catch (error) {
    console.error('Error fixing admin subscriptions:', error);
  }
}

fixAdminSubscriptions();
