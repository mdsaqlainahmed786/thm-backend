import https from "http";
import ExpressApp from "./app";
import { AppConfig } from "./config/constants";
import DBOptimization from "./cron/DbOptimizationCron";
import THMFollow from "./cron/THMFollowCron";
import THMRating from "./cron/THMRatingCron";
import MarketingNotificationCron from "./cron/MarketingNotificationCron";
import createSocketServer from "./socket-server";
import { initRedis, RedisClient } from "./services/RedisClient";
const httpServer = https.createServer(ExpressApp);
export const SocketServer = createSocketServer(httpServer);
httpServer.listen(AppConfig.PORT, async () => {
    //Basic Details for server
    console.log(`The server is running\tPORT: ${AppConfig.PORT}\tDATED: ${new Date()}`,);
    
    // Log Razorpay configuration on startup
    AppConfig.logRazorpayConfig();
    
    DBOptimization.start();
    THMFollow.start();
    THMRating.start();

    // Start marketing notification cron (runs every 6 hours)
    // Only start if not already running to prevent duplicates
    if (!MarketingNotificationCron.running) {
        MarketingNotificationCron.start();
        console.log(`[Server] MarketingNotificationCron started - will run every 6 hours`);
    } else {
        console.log(`[Server] MarketingNotificationCron is already running - skipping start`);
    }

    // Trigger notification immediately on server start
    // console.log(`[Server] Triggering marketing notification immediately in 2 seconds...`);
    // setTimeout(async () => {
    //     try {
    //         const { sendMarketingNotifications } = await import('./cron/MarketingNotificationCron');
    //         await sendMarketingNotifications();
    //         console.log(`[Server] Immediate notification completed`);
    //     } catch (error: any) {
    //         console.error(`[Server] Error triggering immediate notification:`, error.message);
    //     }
    // }, 2000); // Wait 2 seconds after server starts
});
httpServer.timeout = 1200000;  // 2 Minutes


// Initialize shared Redis connection (non-fatal if unavailable)
initRedis();
export { RedisClient };