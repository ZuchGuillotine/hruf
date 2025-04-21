import cron from 'node-cron';
import { db } from '../../db';
import { supplementLogs, users, supplements } from '../../db/schema';
import { eq, and, gte, lt } from 'drizzle-orm';
import { sendSupplementFeedbackNotification } from './pushNotificationService';
import logger from '../utils/logger';

// Store cron tasks for cleanup on shutdown
const tasks: cron.ScheduledTask[] = [];

/**
 * Schedule to send notifications to users asking for feedback on supplements they've taken
 * This runs daily at a specific time (default: 7 PM)
 */
const scheduleFeedbackReminders = (hour: number = 19, minute: number = 0): cron.ScheduledTask => {
  // Format: minute hour * * * (e.g., "0 19 * * *" for 7 PM daily)
  const schedule = `${minute} ${hour} * * *`;
  
  const task = cron.schedule(schedule, async () => {
    logger.info('Running scheduled supplement feedback notifications task');
    
    try {
      // Get all users with push notifications enabled
      const usersWithNotifications = await db.select({ id: users.id })
        .from(users)
        .where(eq(users.pushNotificationsEnabled, true));
      
      // No users with notifications enabled
      if (usersWithNotifications.length === 0) {
        logger.info('No users with push notifications enabled');
        return;
      }
      
      // Get current date boundaries
      const now = new Date();
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      
      // Process each user
      for (const user of usersWithNotifications) {
        try {
          // Get supplements taken today
          const takenToday = await db.select({
            supplementId: supplementLogs.supplementId,
            takenAt: supplementLogs.takenAt
          })
          .from(supplementLogs)
          .where(
            and(
              eq(supplementLogs.userId, user.id),
              gte(supplementLogs.takenAt, startOfDay),
              lt(supplementLogs.takenAt, endOfDay)
            )
          );
          
          // Skip if no supplements taken today
          if (takenToday.length === 0) {
            logger.info('No supplements taken today for user', { userId: user.id });
            continue;
          }
          
          // Get supplement names
          const supplementIds = takenToday.map(log => log.supplementId);
          const supplementDetails = await db.select({ name: supplements.name })
            .from(supplements)
            .where(eq(supplements.userId, user.id));
            
          const supplementNames = supplementDetails.map(supp => supp.name);
          
          // Send notification
          await sendSupplementFeedbackNotification(user.id, supplementNames);
          
          logger.info('Sent supplement feedback notification', { 
            userId: user.id,
            supplementCount: supplementNames.length
          });
        } catch (userError) {
          logger.error('Error processing user for feedback notification', {
            error: userError,
            userId: user.id
          });
        }
      }
    } catch (error) {
      logger.error('Error running supplement feedback notifications task', { error });
    }
  }, {
    scheduled: false, // Don't start immediately
    timezone: 'UTC' // Use UTC for consistency
  });
  
  return task;
};

/**
 * Schedule to remind users to take their daily supplements if they haven't logged any
 * This runs daily at a specific time (default: 10 AM)
 */
const scheduleDailyReminders = (hour: number = 10, minute: number = 0): cron.ScheduledTask => {
  // Format: minute hour * * * (e.g., "0 10 * * *" for 10 AM daily)
  const schedule = `${minute} ${hour} * * *`;
  
  const task = cron.schedule(schedule, async () => {
    logger.info('Running scheduled daily supplement reminders task');
    
    try {
      // Get all users with push notifications enabled
      const usersWithNotifications = await db.select({ id: users.id })
        .from(users)
        .where(eq(users.pushNotificationsEnabled, true));
      
      // No users with notifications enabled
      if (usersWithNotifications.length === 0) {
        logger.info('No users with push notifications enabled');
        return;
      }
      
      // Get current date boundaries
      const now = new Date();
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      
      // Process each user
      for (const user of usersWithNotifications) {
        try {
          // Check if the user has taken any supplements today
          const takenToday = await db.execute(
            sql`SELECT COUNT(*) FROM ${supplementLogs} 
                WHERE ${supplementLogs.userId} = ${user.id} 
                AND ${supplementLogs.takenAt} >= ${startOfDay}`
          );
          
          // If they've already taken supplements today, skip
          if (takenToday.length > 0 && parseInt(takenToday[0].count, 10) > 0) {
            continue;
          }
          
          // Get all active supplements for the user
          const activeSupplements = await db.select({ name: supplements.name })
            .from(supplements)
            .where(
              and(
                eq(supplements.userId, user.id),
                eq(supplements.active, true)
              )
            );
          
          // Skip if no active supplements
          if (activeSupplements.length === 0) {
            continue;
          }
          
          // TODO: Implement a daily reminder notification similar to feedback notification
          // This would use a generic function like sendUserNotification
          
          logger.info('Would send daily supplement reminder', { 
            userId: user.id,
            supplementCount: activeSupplements.length
          });
        } catch (userError) {
          logger.error('Error processing user for daily reminder', {
            error: userError,
            userId: user.id
          });
        }
      }
    } catch (error) {
      logger.error('Error running daily supplement reminders task', { error });
    }
  }, {
    scheduled: false, // Don't start immediately
    timezone: 'UTC' // Use UTC for consistency
  });
  
  return task;
};

/**
 * Start all notification schedules
 */
export const startAllNotificationSchedules = (): void => {
  try {
    logger.info('Starting notification schedule tasks');
    
    // Start daily feedback reminders at 7 PM
    const feedbackTask = scheduleFeedbackReminders(19, 0);
    feedbackTask.start();
    tasks.push(feedbackTask);
    
    // Start daily supplement reminders at 10 AM
    const reminderTask = scheduleDailyReminders(10, 0);
    reminderTask.start();
    tasks.push(reminderTask);
    
    logger.info('Notification schedules started successfully');
  } catch (error) {
    logger.error('Error starting notification schedules', { error });
  }
};

/**
 * Stop all notification schedules
 */
export const stopAllNotificationSchedules = (): void => {
  try {
    logger.info('Stopping notification schedule tasks');
    
    // Stop all tasks
    tasks.forEach(task => task.stop());
    tasks.length = 0; // Clear the array
    
    logger.info('Notification schedules stopped successfully');
  } catch (error) {
    logger.error('Error stopping notification schedules', { error });
  }
};