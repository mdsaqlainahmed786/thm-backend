import cron from 'node-cron';
import { CronSchedule, MarketingNotifications, MarketingNotificationMessage, AppConfig } from '../config/constants';
import DevicesConfig from '../database/models/appDeviceConfig.model';
import { createMessagePayload, sendNotification } from '../notification/FirebaseNotificationController';
import { Message } from 'firebase-admin/lib/messaging/messaging-api';
import { v4 } from 'uuid';
import { NotificationType } from '../database/models/notification.model';
import moment from 'moment';

function getContextuallyRelevantMessages(): MarketingNotificationMessage[] {
    const now = moment();
    const currentDayOfWeek = now.day(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const currentMonth = now.month(); // 0 = January, 1 = February, ..., 11 = December
    const isWeekend = currentDayOfWeek === 0 || currentDayOfWeek === 6; // Sunday or Saturday
    const isWeekday = currentDayOfWeek >= 1 && currentDayOfWeek <= 5; // Monday to Friday

    return MarketingNotifications.MESSAGES.filter((notification) => {
        // Check day of week constraint
        if (notification.daysOfWeek && notification.daysOfWeek.length > 0) {
            if (!notification.daysOfWeek.includes(currentDayOfWeek)) {
                return false;
            }
        }

        // Check month constraint (for seasons)
        if (notification.months && notification.months.length > 0) {
            if (!notification.months.includes(currentMonth)) {
                return false;
            }
        }

        // Check weekend constraint
        if (notification.isWeekend !== undefined) {
            // If notification requires weekend but it's not weekend, skip it
            if (notification.isWeekend === true && !isWeekend) {
                return false;
            }
            // If notification requires weekday (isWeekend === false) but it's weekend, skip it
            if (notification.isWeekend === false && isWeekend) {
                return false;
            }
        }

        // Check weekday constraint
        if (notification.isWeekday !== undefined) {
            // If notification requires weekday but it's not weekday, skip it
            if (notification.isWeekday === true && !isWeekday) {
                return false;
            }
            // If notification requires weekend (isWeekday === false) but it's weekday, skip it
            if (notification.isWeekday === false && isWeekday) {
                return false;
            }
        }

        return true;
    });
}

async function sendMarketingNotifications() {
    try {
        console.log(`[MarketingNotificationCron] ========================================`);
        console.log(`[MarketingNotificationCron] Starting marketing notification job at ${new Date().toISOString()}`);

        // TESTING MODE: Only send to specific user ID
        // const TEST_USER_ID = "68fda5ef31578f13fcb87ee7";

        // Fetch all devices with valid notification tokens (all users)
        const allDevicesConfigs = await DevicesConfig.find({
            notificationToken: { $exists: true, $ne: "" }
        });

        console.log(`[MarketingNotificationCron] Found ${allDevicesConfigs.length} device(s) across all users`);

        if (allDevicesConfigs.length === 0) {
            console.log("[MarketingNotificationCron] No users with device tokens found.");
            return;
        }

        // Get unique user count for logging
        const uniqueUserIDs = [...new Set(allDevicesConfigs.map(config => config.userID.toString()))];
        console.log(`[MarketingNotificationCron] Sending to ${uniqueUserIDs.length} unique users`);

        // Get contextually relevant messages based on current date/time
        const relevantMessages = getContextuallyRelevantMessages();

        const now = moment();
        console.log(`[MarketingNotificationCron] Current day: ${now.format('dddd')} (${now.day()}), Month: ${now.format('MMMM')} (${now.month()})`);
        console.log(`[MarketingNotificationCron] Total available messages: ${MarketingNotifications.MESSAGES.length}`);
        console.log(`[MarketingNotificationCron] Contextually relevant messages: ${relevantMessages.length}`);

        if (relevantMessages.length === 0) {
            console.log("[MarketingNotificationCron] WARNING: No contextually relevant messages found for today. Skipping notification.");
            console.log("[MarketingNotificationCron] This might happen if all messages have constraints that don't match today.");
            return;
        }

        // Randomly select from contextually relevant messages
        const randomIndex = Math.floor(Math.random() * relevantMessages.length);
        const selectedNotification = relevantMessages[randomIndex];
        const selectedMessage = selectedNotification.message;

        console.log(`[MarketingNotificationCron] Selected message (${randomIndex + 1}/${relevantMessages.length}): ${selectedMessage}`);

        const title = AppConfig.APP_NAME;
        const description = selectedMessage;
        const notificationID = v4();

        // Send notifications to all devices
        let successCount = 0;
        let failureCount = 0;

        await Promise.allSettled(
            allDevicesConfigs.map(async (devicesConfig) => {
                try {
                    if (devicesConfig?.notificationToken) {
                        const message: Message = createMessagePayload(
                            devicesConfig.notificationToken,
                            title,
                            description,
                            {
                                notificationID,
                                devicePlatform: devicesConfig.devicePlatform,
                                type: NotificationType.MARKETING,
                                image: "",
                                profileImage: ""
                            }
                        );
                        await sendNotification(message);
                        successCount++;
                    }
                } catch (error: any) {
                    console.error(`[MarketingNotificationCron] Error sending notification to device ${devicesConfig._id}:`, error.message);
                    failureCount++;
                }
            })
        );

        console.log(`[MarketingNotificationCron] ========================================`);
        console.log(`[MarketingNotificationCron] Completed. Success: ${successCount}, Failures: ${failureCount}`);
        console.log(`[MarketingNotificationCron] ========================================`);
    } catch (error: any) {
        console.error("[MarketingNotificationCron] ========================================");
        console.error("[MarketingNotificationCron] ERROR during marketing notification process:", error.message);
        console.error("[MarketingNotificationCron] Stack:", error.stack);
        console.error("[MarketingNotificationCron] ========================================");
    }
}

// Production: Run every 6 hours
const MarketingNotificationCron: cron.ScheduledTask = cron.schedule(
    CronSchedule.MARKETING_NOTIFICATION_EVERY_6_HOURS, // Every 6 hours
    sendMarketingNotifications
);

// Export the function for manual triggering
export { sendMarketingNotifications };
export default MarketingNotificationCron;

