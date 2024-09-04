import https from "http";
import ExpressApp from "./app";
import { AppConfig } from "./config/constants";

const httpServer = https.createServer(ExpressApp);
httpServer.listen(AppConfig.PORT, () => {
    //Basic Details for server
    console.log(`The server is running.\n`, AppConfig.PORT)
});
httpServer.timeout = 1200000;  // 2 Minutes