
import { db } from '../db';
import { users } from '../db/schema';

async function verifyUserData() {
  try {
    const allUsers = await db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      subscriptionStatus: users.subscriptionStatus,
      subscriptionId: users.subscriptionId,
      createdAt: users.createdAt,
      trialEndsAt: users.trialEndsAt,
      isAdmin: users.isAdmin
    }).from(users);

    console.log('\nUser Data Verification Results:');
    console.log('================================');
    
    allUsers.forEach(user => {
      console.log(`\nUser ID: ${user.id}`);
      console.log(`Email: ${user.email}`);
      console.log(`Name: ${user.name || 'Not set'}`);
      console.log(`Subscription Status: ${user.subscriptionStatus || 'Not set'}`);
      console.log(`Subscription ID: ${user.subscriptionId || 'Not set'}`);
      console.log(`Created At: ${user.createdAt?.toISOString() || 'Not set'}`);
      console.log(`Trial Ends At: ${user.trialEndsAt?.toISOString() || 'Not set'}`);
      console.log(`Is Admin: ${user.isAdmin}`);
      console.log('--------------------------------');
    });

    // Print summary
    const summary = {
      total: allUsers.length,
      withName: allUsers.filter(u => u.name).length,
      withSubscriptionStatus: allUsers.filter(u => u.subscriptionStatus).length,
      withTrialDate: allUsers.filter(u => u.trialEndsAt).length
    };

    console.log('\nSummary:');
    console.log(`Total users: ${summary.total}`);
    console.log(`Users with names: ${summary.withName}`);
    console.log(`Users with subscription status: ${summary.withSubscriptionStatus}`);
    console.log(`Users with trial end dates: ${summary.withTrialDate}`);

  } catch (error) {
    console.error('Error verifying user data:', error);
  }
}

verifyUserData();
