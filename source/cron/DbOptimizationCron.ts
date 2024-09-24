import cron from 'node-cron';
import { CronSchedule } from '../config/constants';
import { removeObsoleteFCMTokens } from '../notification/FirebaseNotificationController';
import S3Object from '../database/models/s3Object.model';
import { deleteS3Object } from '../middleware/file-uploading';
/**
 * Cron job for remove the mobile device notification token which is no longer produced or used.
 * Run every data at 00:00
 */
async function DBOptimizerCron() {
    const files = await S3Object.find({ delete: true });
    await Promise.all(files.map(async (media) => {
        console.log(media)
        await deleteS3Object(media.key);
        console.log(media.key)
        await S3Object.deleteOne({ _id: media.id });
    }));
    await removeObsoleteFCMTokens();
}

export const DBOptimization: cron.ScheduledTask = cron.schedule(CronSchedule.EVERY_DAY_AT_00, DBOptimizerCron);