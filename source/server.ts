import https from "http";
import ExpressApp from "./app";
import { AppConfig } from "./config/constants";
import DBOptimization from "./cron/DbOptimizationCron";
import THMFollow from "./cron/THMFollowCron";
import THMRating from "./cron/THMRatingCron";
import MarketingNotificationCron from "./cron/MarketingNotificationCron";
import createSocketServer from "./socket-server";
import { createClient } from "redis";
const httpServer = https.createServer(ExpressApp);
export const SocketServer = createSocketServer(httpServer);
httpServer.listen(AppConfig.PORT, async () => {
    //Basic Details for server
    console.log(`The server is running\tPORT: ${AppConfig.PORT}\tDATED: ${new Date()}`,);
    DBOptimization.start();
    THMFollow.start();
    THMRating.start();
    MarketingNotificationCron.start();
});
httpServer.timeout = 1200000;  // 2 Minutes


/**
 * RedisClient
 */
const RedisClient = createClient();
RedisClient.on('error', (err) => {
    console.error('Redis Error:', err);
});
RedisClient.connect();
export { RedisClient };