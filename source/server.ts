import https from "http";
import ExpressApp from "./app";
import { AppConfig } from "./config/constants";
import { DBOptimization } from "./cron/DbOptimizationCron";
import createSocketServer from "./socket-server";
const httpServer = https.createServer(ExpressApp);
export const SocketServer = createSocketServer(httpServer);
import { MailerSend, EmailParams, Sender, Recipient } from "mailersend";
httpServer.listen(AppConfig.PORT, () => {
    //Basic Details for server
    console.log(`The server is running\tPORT: ${AppConfig.PORT}\tDATED: ${new Date()}`,);
    DBOptimization.start();
});
httpServer.timeout = 1200000;  // 2 Minutes