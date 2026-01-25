"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMarketingNotifications = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const constants_1 = require("../config/constants");
const appDeviceConfig_model_1 = __importDefault(require("../database/models/appDeviceConfig.model"));
const FirebaseNotificationController_1 = require("../notification/FirebaseNotificationController");
const uuid_1 = require("uuid");
const notification_model_1 = require("../database/models/notification.model");
const moment_1 = __importDefault(require("moment"));
// Lock to prevent concurrent executions
let isExecuting = false;
function getContextuallyRelevantMessages() {
    const now = (0, moment_1.default)();
    const currentDayOfWeek = now.day(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const currentMonth = now.month(); // 0 = January, 1 = February, ..., 11 = December
    const isWeekend = currentDayOfWeek === 0 || currentDayOfWeek === 6; // Sunday or Saturday
    const isWeekday = currentDayOfWeek >= 1 && currentDayOfWeek <= 5; // Monday to Friday
    return constants_1.MarketingNotifications.MESSAGES.filter((notification) => {
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
function sendMarketingNotifications() {
    return __awaiter(this, void 0, void 0, function* () {
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
            const allDevicesConfigs = yield appDeviceConfig_model_1.default.find({
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
            const now = (0, moment_1.default)();
            console.log(`[MarketingNotificationCron] Current day: ${now.format('dddd')} (${now.day()}), Month: ${now.format('MMMM')} (${now.month()})`);
            console.log(`[MarketingNotificationCron] Total available messages: ${constants_1.MarketingNotifications.MESSAGES.length}`);
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
            const title = constants_1.AppConfig.APP_NAME;
            const description = selectedMessage;
            const notificationID = (0, uuid_1.v4)();
            // Group devices by userID to send only one notification per user
            const devicesByUser = new Map();
            allDevicesConfigs.forEach((devicesConfig) => {
                var _a, _b;
                const userIDStr = devicesConfig.userID.toString();
                // Use the most recent device (by createdAt) for each user, or first one if no timestamp
                if (!devicesByUser.has(userIDStr)) {
                    devicesByUser.set(userIDStr, devicesConfig);
                }
                else {
                    const existing = devicesByUser.get(userIDStr);
                    // Prefer device with more recent updatedAt timestamp
                    const existingTime = ((_a = existing === null || existing === void 0 ? void 0 : existing.updatedAt) === null || _a === void 0 ? void 0 : _a.getTime()) || 0;
                    const currentTime = ((_b = devicesConfig === null || devicesConfig === void 0 ? void 0 : devicesConfig.updatedAt) === null || _b === void 0 ? void 0 : _b.getTime()) || 0;
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
            yield Promise.allSettled(uniqueDevices.map((devicesConfig) => __awaiter(this, void 0, void 0, function* () {
                try {
                    if (devicesConfig === null || devicesConfig === void 0 ? void 0 : devicesConfig.notificationToken) {
                        const message = (0, FirebaseNotificationController_1.createMessagePayload)(devicesConfig.notificationToken, title, description, {
                            notificationID,
                            devicePlatform: devicesConfig.devicePlatform,
                            type: notification_model_1.NotificationType.MARKETING, // Keep type as MARKETING for identification
                            route: "feed", // Explicit route to feeds page
                            image: "",
                            profileImage: ""
                        });
                        yield (0, FirebaseNotificationController_1.sendNotification)(message);
                        successCount++;
                    }
                }
                catch (error) {
                    console.error(`[MarketingNotificationCron] Error sending notification to device ${devicesConfig._id}:`, error.message);
                    failureCount++;
                }
            })));
            console.log(`[MarketingNotificationCron] ========================================`);
            console.log(`[MarketingNotificationCron] Completed. Success: ${successCount}, Failures: ${failureCount}`);
            console.log(`[MarketingNotificationCron] ========================================`);
        }
        catch (error) {
            console.error("[MarketingNotificationCron] ========================================");
            console.error("[MarketingNotificationCron] ERROR during marketing notification process:", error.message);
            console.error("[MarketingNotificationCron] Stack:", error.stack);
            console.error("[MarketingNotificationCron] ========================================");
        }
        finally {
            // Always release the lock, even if there was an error
            isExecuting = false;
        }
    });
}
exports.sendMarketingNotifications = sendMarketingNotifications;
// Production: Run every 6 hours
const MarketingNotificationCron = node_cron_1.default.schedule(constants_1.CronSchedule.MARKETING_NOTIFICATION_EVERY_6_HOURS, // Every 6 hours
sendMarketingNotifications, {
    scheduled: false // Don't start automatically - we'll start it manually in server.ts
});
exports.default = MarketingNotificationCron;
