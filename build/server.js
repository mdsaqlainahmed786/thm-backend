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
exports.RedisClient = exports.SocketServer = void 0;
const http_1 = __importDefault(require("http"));
const app_1 = __importDefault(require("./app"));
const constants_1 = require("./config/constants");
const DbOptimizationCron_1 = __importDefault(require("./cron/DbOptimizationCron"));
const THMFollowCron_1 = __importDefault(require("./cron/THMFollowCron"));
const THMRatingCron_1 = __importDefault(require("./cron/THMRatingCron"));
const MarketingNotificationCron_1 = __importDefault(require("./cron/MarketingNotificationCron"));
const socket_server_1 = __importDefault(require("./socket-server"));
const redis_1 = require("redis");
const httpServer = http_1.default.createServer(app_1.default);
exports.SocketServer = (0, socket_server_1.default)(httpServer);
httpServer.listen(constants_1.AppConfig.PORT, () => __awaiter(void 0, void 0, void 0, function* () {
    //Basic Details for server
    console.log(`The server is running\tPORT: ${constants_1.AppConfig.PORT}\tDATED: ${new Date()}`);
    DbOptimizationCron_1.default.start();
    THMFollowCron_1.default.start();
    THMRatingCron_1.default.start();
    // Start marketing notification cron (runs every 6 hours)
    MarketingNotificationCron_1.default.start();
    console.log(`[Server] MarketingNotificationCron started - will run every 6 hours`);
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
}));
httpServer.timeout = 1200000; // 2 Minutes
/**
 * RedisClient
 */
const RedisClient = (0, redis_1.createClient)();
exports.RedisClient = RedisClient;
RedisClient.on('error', (err) => {
    console.error('Redis Error:', err);
});
RedisClient.connect();
