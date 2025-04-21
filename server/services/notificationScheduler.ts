import cron from 'node-cron';
import { db } from '../../db';
import { users, supplements } from '../../db/schema';
import { eq, and, ne, isNotNull } from 'drizzle-orm';
import { sendSupplementFeedbackNotification } from './pushNotificationService';
import { logger } from '../utils/logger';

// Notification scheduling task references
let schedules: { [key: string]: cron.ScheduledTask } = {};

/**
 * Schedule daily supplement feedback notifications
 * Will send at 8 PM local time
 */
export function scheduleDailyFeedbackNotifications() {
  // Schedule daily at 8 PM
  const task = cron.schedule('0 20 * * *', async () => {
    try {
      logger.info('Running scheduled supplement feedback notifications', {
        timestamp: new Date().toISOString()
      });

      // Find users with active supplements who have enabled push notifications
      const usersWithSupplements = await db
        .select({ userId: supplements.userId })
        .from(supplements)
        .where(
          and(
            eq(supplements.active, true),
            isNotNull(supplements.userId)
          )
        )
        .groupBy(supplements.userId);

      const userIds = usersWithSupplements
        .map(u => u.userId!)
        .filter(id => id !== null);

      // Get users who have enabled push notifications
      const eligibleUsers = await db
        .select({ id: users.id })
        .from(users)
        .where(
          and(
            eq(users.pushNotificationsEnabled, true),
            ne(users.id, 0)
          )
        );

      const eligibleUserIds = eligibleUsers.map(u => u.id);
      
      // Get intersection of users with supplements and those who enabled notifications
      const targetUserIds = userIds.filter(id => eligibleUserIds.includes(id));

      if (targetUserIds.length === 0) {
        logger.info('No eligible users found for supplement feedback notifications', {
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Send notifications
      const result = await sendSupplementFeedbackNotification(targetUserIds);

      logger.info('Supplement feedback notification results', {
        sent: result.success,
        failed: result.failed,
        total: targetUserIds.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error sending scheduled supplement feedback notifications:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
    }
  }, {
    scheduled: false, // Don't start automatically
    timezone: "America/New_York" // Default to Eastern Time
  });

  // Store the task
  schedules['dailyFeedback'] = task;

  return task;
}

/**
 * Schedule weekly supplement feedback notifications
 * Will send on Sunday at 6 PM local time
 */
export function scheduleWeeklyFeedbackNotifications() {
  // Schedule weekly on Sunday at 6 PM
  const task = cron.schedule('0 18 * * 0', async () => {
    try {
      logger.info('Running scheduled weekly supplement feedback notifications', {
        timestamp: new Date().toISOString()
      });

      // Find users with active supplements who have enabled push notifications
      const usersWithSupplements = await db
        .select({ userId: supplements.userId })
        .from(supplements)
        .where(
          and(
            eq(supplements.active, true),
            isNotNull(supplements.userId)
          )
        )
        .groupBy(supplements.userId);

      const userIds = usersWithSupplements
        .map(u => u.userId!)
        .filter(id => id !== null);

      // Get users who have enabled push notifications
      const eligibleUsers = await db
        .select({ id: users.id })
        .from(users)
        .where(
          and(
            eq(users.pushNotificationsEnabled, true),
            ne(users.id, 0)
          )
        );

      const eligibleUserIds = eligibleUsers.map(u => u.id);
      
      // Get intersection of users with supplements and those who enabled notifications
      const targetUserIds = userIds.filter(id => eligibleUserIds.includes(id));

      if (targetUserIds.length === 0) {
        logger.info('No eligible users found for weekly supplement feedback notifications', {
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Send notifications with a different message for weekly review
      for (const userId of targetUserIds) {
        try {
          await sendSupplementFeedbackNotification([userId]);
        } catch (error) {
          logger.error(`Error sending weekly notification to user ${userId}:`, {
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
          });
        }
      }

      logger.info('Weekly supplement feedback notifications completed', {
        totalSent: targetUserIds.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error sending scheduled weekly supplement feedback notifications:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
    }
  }, {
    scheduled: false, // Don't start automatically
    timezone: "America/New_York" // Default to Eastern Time
  });

  // Store the task
  schedules['weeklyFeedback'] = task;

  return task;
}

/**
 * Start all notification schedules
 */
export function startAllNotificationSchedules() {
  // Don't run scheduled tasks in development mode
  if (process.env.NODE_ENV === 'development') {
    logger.info('Notification schedules not started in development mode', {
      timestamp: new Date().toISOString()
    });
    return;
  }

  const dailyTask = scheduleDailyFeedbackNotifications();
  const weeklyTask = scheduleWeeklyFeedbackNotifications();

  // Start the tasks
  dailyTask.start();
  weeklyTask.start();

  logger.info('All notification schedules started', {
    schedules: Object.keys(schedules),
    timestamp: new Date().toISOString()
  });
}

/**
 * Stop all notification schedules
 */
export function stopAllNotificationSchedules() {
  Object.values(schedules).forEach(task => task.stop());
  logger.info('All notification schedules stopped', {
    timestamp: new Date().toISOString()
  });
}

/**
 * Stop a specific notification schedule
 */
export function stopNotificationSchedule(name: string) {
  if (schedules[name]) {
    schedules[name].stop();
    logger.info(`Notification schedule '${name}' stopped`, {
      timestamp: new Date().toISOString()
    });
    return true;
  }
  return false;
}

/**
 * Start a specific notification schedule
 */
export function startNotificationSchedule(name: string) {
  if (schedules[name]) {
    schedules[name].start();
    logger.info(`Notification schedule '${name}' started`, {
      timestamp: new Date().toISOString()
    });
    return true;
  }
  return false;
}