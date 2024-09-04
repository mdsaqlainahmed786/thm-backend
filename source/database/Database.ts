import { AppConfig } from "../config/constants";
import mongoose from "mongoose";
export let database: mongoose.Connection;

/** Create connection with Mongodb database */
export const connectDB = async () => {
    if (database) {
        return;
    }
    const CONNECTION_URI: string = AppConfig.DB_CONNECTION;
    const options: Object = {
        // useNewUrlParser: true,
        // useUnifiedTopology: true,
        //  autoIndex: true, //Modified later for achieving universal search.
        connectTimeoutMS: 5000,
        socketTimeoutMS: 5000,
    };
    try {
        mongoose.set('strictQuery', true);
        await mongoose.connect(CONNECTION_URI, options);
        console.log("\nConnected to database");
    } catch (error: any) {
        console.log("\nDB Error1 :::", error);
        process.exit(1);
    }
    database = mongoose.connection;
};
export const disconnectDB = () => {
    if (!database) {
        return;
    }
    mongoose.disconnect();
    console.log("\nDisconnected to database");
};


