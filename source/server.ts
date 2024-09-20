import https from "http";
import ExpressApp from "./app";
import { AppConfig } from "./config/constants";
import { DBOptimization } from "./cron/DbOptimizationCron";

const httpServer = https.createServer(ExpressApp);
httpServer.listen(AppConfig.PORT, () => {
    //Basic Details for server
    console.log(`The server is running.\n`, AppConfig.PORT);
    DBOptimization.start();
});
httpServer.timeout = 1200000;  // 2 Minutes