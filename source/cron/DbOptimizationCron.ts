import cron from 'node-cron';
import { CronSchedule } from '../config/constants';
import { removeObsoleteFCMTokens } from '../notification/FirebaseNotificationController';
/**
 * Cron job for remove the mobile device notification token which is no longer produced or used.
 * Run every data at 00:00
 */
async function DBOptimizerCron() {
    await removeObsoleteFCMTokens();
}

export const DBOptimization: cron.ScheduledTask = cron.schedule(CronSchedule.EVERY_DAY_AT_00, DBOptimizerCron);