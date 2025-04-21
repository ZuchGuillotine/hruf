import cron from 'node-cron';
import { db } from '../../db';
import { users, supplements, supplementLogs } from '../../db/schema';
import { and, eq, gte, sql } from 'drizzle-orm';
import logger from '../utils/logger';
import { pushNotificationService } from './pushNotificationService';

// Store active cron jobs to allow stopping them
const activeJobs: { [key: string]: cron.ScheduledTask } = {};

/**
 * Schedule a daily reminder for supplement feedback
 * Default time is 8 PM (20:00)
 */
export function scheduleDailyReminder(hourOfDay: number = 20, minuteOfHour: number = 0): boolean {
  const cronExpression = `${minuteOfHour} ${hourOfDay} * * *`;
  
  try {
    // Stop existing job if it exists
    stopJob('daily-reminder');
    
    // Schedule new job
    const job = cron.schedule(cronExpression, async () => {
      logger.info('Running daily supplement feedback reminder job');
      await sendSupplementFeedbackReminders();
    });
    
    activeJobs['daily-reminder'] = job;
    logger.info(`Scheduled daily reminder job at ${hourOfDay}:${minuteOfHour}`);
    return true;
  } catch (error) {
    logger.error('Failed to schedule daily reminder job:', error);
    return false;
  }
}

/**
 * Send supplement feedback reminders to eligible users
 */
async function sendSupplementFeedbackReminders() {
  try {
    // Get all users with push notifications enabled and have taken supplements today
    // This query finds users who:
    // 1. Have push notifications enabled
    // 2. Have active supplements
    // 3. Have taken supplements today BUT have not provided qualitative feedback
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Find users with active supplements who haven't logged feedback today
    const eligibleUsers = await db.select({
      id: users.id
    })
    .from(users)
    .innerJoin(supplements, and(
      eq(supplements.userId, users.id),
      eq(supplements.active, true)
    ))
    .innerJoin(supplementLogs, and(
      eq(supplementLogs.supplementId, supplements.id),
      gte(supplementLogs.loggedAt, today)
    ))
    .where(eq(users.pushNotificationsEnabled, true))
    .groupBy(users.id);
    
    logger.info(`Found ${eligibleUsers.length} users eligible for supplement feedback reminders`);
    
    // Send reminders to each eligible user
    let sentCount = 0;
    let failedCount = 0;
    
    for (const user of eligibleUsers) {
      const result = await pushNotificationService.sendSupplementFeedbackReminder(user.id);
      if (result.success) {
        sentCount++;
      } else {
        failedCount++;
      }
    }
    
    logger.info(`Supplement feedback reminders sent: ${sentCount}, failed: ${failedCount}`);
  } catch (error) {
    logger.error('Error sending supplement feedback reminders:', error);
  }
}

/**
 * Schedule a weekly digest notification
 * Default is Sunday at 10 AM
 */
export function scheduleWeeklyDigest(dayOfWeek: number = 0, hourOfDay: number = 10): boolean {
  const cronExpression = `0 ${hourOfDay} * * ${dayOfWeek}`;
  
  try {
    // Stop existing job if it exists
    stopJob('weekly-digest');
    
    // Schedule new job
    const job = cron.schedule(cronExpression, async () => {
      logger.info('Running weekly supplement digest notification job');
      await sendWeeklyDigestNotifications();
    });
    
    activeJobs['weekly-digest'] = job;
    logger.info(`Scheduled weekly digest job on day ${dayOfWeek} at ${hourOfDay}:00`);
    return true;
  } catch (error) {
    logger.error('Failed to schedule weekly digest job:', error);
    return false;
  }
}

/**
 * Send weekly digest notifications to users
 */
async function sendWeeklyDigestNotifications() {
  try {
    // Get all users with push notifications enabled
    const enabledUsers = await db
      .select()
      .from(users)
      .where(eq(users.pushNotificationsEnabled, true));
    
    logger.info(`Found ${enabledUsers.length} users for weekly digest notifications`);
    
    // Send weekly digest notification to each user
    let sentCount = 0;
    let failedCount = 0;
    
    for (const user of enabledUsers) {
      const result = await pushNotificationService.sendNotificationToUser(
        user.id,
        'Your Weekly Supplement Report',
        'Check out your supplement activity and insights from the past week.',
        {
          tag: 'weekly-digest',
          url: '/dashboard',
          requireInteraction: false
        }
      );
      
      sentCount += result.sent;
      failedCount += result.failed;
    }
    
    logger.info(`Weekly digest notifications sent: ${sentCount}, failed: ${failedCount}`);
  } catch (error) {
    logger.error('Error sending weekly digest notifications:', error);
  }
}

/**
 * Stop a specific scheduled job
 */
export function stopJob(jobName: string): boolean {
  if (activeJobs[jobName]) {
    activeJobs[jobName].stop();
    delete activeJobs[jobName];
    logger.info(`Stopped scheduled job: ${jobName}`);
    return true;
  }
  return false;
}

/**
 * Stop all scheduled jobs
 */
export function stopAllJobs(): void {
  Object.keys(activeJobs).forEach(jobName => {
    activeJobs[jobName].stop();
    delete activeJobs[jobName];
  });
  logger.info('Stopped all scheduled notification jobs');
}

/**
 * Start all notification schedules
 */
export function startAllNotificationSchedules(): void {
  // Start daily reminder at 8 PM
  scheduleDailyReminder(20, 0);
  
  // Start weekly digest on Sunday at 10 AM
  scheduleWeeklyDigest(0, 10);
  
  logger.info('All notification schedules started');
}

/**
 * Stop all notification schedules
 */
export function stopAllNotificationSchedules(): void {
  stopAllJobs();
  logger.info('All notification schedules stopped');
}