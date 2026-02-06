import cron from 'node-cron';
import { CronSchedule, MarketingNotifications, MarketingNotificationMessage, AppConfig } from '../config/constants';
import DevicesConfig from '../database/models/appDeviceConfig.model';
import { createMessagePayload, sendNotification } from '../notification/FirebaseNotificationController';
import { Message } from 'firebase-admin/lib/messaging/messaging-api';
import { v4 } from 'uuid';
import { NotificationType } from '../database/models/notification.model';
import moment from 'moment';
import { ObjectId } from 'mongodb';

// Lock to prevent concurrent executions
let isExecuting = false;

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
    // Prevent concurrent executions
    if (isExecuting) {
        console.log(`[MarketingNotificationCron] ========================================`);
        console.log(`[MarketingNotificationCron] WARNING: Previous execution still in progress. Skipping this run to prevent duplicates.`);
        console.log(`[MarketingNotificationCron] ========================================`);
        return;
    }

    isExecuting = true;
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

        // Group devices by userID to send only one notification per user
        const devicesByUser = new Map<string, typeof allDevicesConfigs[0]>();
        allDevicesConfigs.forEach((devicesConfig) => {
            const userIDStr = devicesConfig.userID.toString();
            // Use the most recent device (by createdAt) for each user, or first one if no timestamp
            if (!devicesByUser.has(userIDStr)) {
                devicesByUser.set(userIDStr, devicesConfig);
            } else {
                const existing = devicesByUser.get(userIDStr);
                // Prefer device with more recent updatedAt timestamp
                const existingTime = existing?.updatedAt?.getTime() || 0;
                const currentTime = devicesConfig?.updatedAt?.getTime() || 0;
                if (currentTime > existingTime) {
                    devicesByUser.set(userIDStr, devicesConfig);
                }
            }
        });

        const uniqueDevices = Array.from(devicesByUser.values());
        console.log(`[MarketingNotificationCron] Sending to ${uniqueDevices.length} unique users (one notification per user)`);

        // Send notifications - one per user
        let successCount = 0;
        let failureCount = 0;

        await Promise.allSettled(
            uniqueDevices.map(async (devicesConfig) => {
                try {
                    if (devicesConfig?.notificationToken) {
                        const message: Message = createMessagePayload(
                            devicesConfig.notificationToken,
                            title,
                            description,
                            {
                                notificationID,
                                devicePlatform: devicesConfig.devicePlatform,
                                type: NotificationType.MARKETING, // Keep type as MARKETING for identification
                                route: "feed", // Explicit route to feeds page
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
    } finally {
        // Always release the lock, even if there was an error
        isExecuting = false;
    }
}

// Production: Run every 6 hours
const MarketingNotificationCron: cron.ScheduledTask = cron.schedule(
    CronSchedule.MARKETING_NOTIFICATION_EVERY_6_HOURS, // Every 6 hours
    sendMarketingNotifications,
    {
        scheduled: false // Don't start automatically - we'll start it manually in server.ts
    }
);

// Export the function for manual triggering
export { sendMarketingNotifications };
export default MarketingNotificationCron;

