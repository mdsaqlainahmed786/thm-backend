import https from "http";
import ExpressApp from "./app";
import { AppConfig } from "./config/constants";
import DBOptimization from "./cron/DbOptimizationCron";
import THMFollow from "./cron/THMFollowCron";
import THMRating from "./cron/THMRatingCron";
import createSocketServer from "./socket-server";
const httpServer = https.createServer(ExpressApp);
export const SocketServer = createSocketServer(httpServer);
httpServer.listen(AppConfig.PORT, async () => {
    //Basic Details for server
    console.log(`The server is running\tPORT: ${AppConfig.PORT}\tDATED: ${new Date()}`,);
    DBOptimization.start();
    THMFollow.start();
    THMRating.start();
});
httpServer.timeout = 1200000;  // 2 Minutes