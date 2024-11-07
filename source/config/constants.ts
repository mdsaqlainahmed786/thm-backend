import * as dotenv from "dotenv";
import { CookieOptions } from "express";
dotenv.config();
export abstract class AppConfig {
    static readonly APP_NAME: string = process.env.APP_NAME ?? "The Hotel Media";
    static readonly PORT: any = process.env.PORT ?? 3000;
    static readonly DB_CONNECTION: string = process.env.DB_CONNECTION!;
    static readonly APP_ENV: string = process.env.APP_ENV!;
    //API Version
    static readonly API_VERSION: string = "/api/v1";

    //Authentication token configurations for user side 
    static readonly APP_ACCESS_TOKEN_SECRET: string = process.env.APP_ACCESS_TOKEN_SECRET!;
    static readonly APP_REFRESH_TOKEN_SECRET: string = process.env.APP_REFRESH_TOKEN_SECRET!;



    static readonly ACCESS_TOKEN_EXPIRES_IN: string = process.env.ACCESS_TOKEN_EXPIRES_IN ?? "3m";
    static readonly REFRESH_TOKEN_EXPIRES_IN: string = process.env.REFRESH_TOKEN_EXPIRES_IN ?? "10d";
    static readonly USER_AUTH_TOKEN_COOKIE_KEY = 'SessionToken';
    static readonly DEVICE_ID_COOKIE_KEY = "UserDeviceID";

    static readonly USER_AUTH_TOKEN_KEY = 'X-Access-Token';

    //Aws S3 Configurations
    static readonly AWS_BUCKET_NAME: string = process.env.AWS_BUCKET_NAME!;
    static readonly AWS_ACCESS_KEY: string = process.env.AWS_ACCESS_KEY!;
    static readonly AWS_SECRET_KEY: string = process.env.AWS_SECRET_KEY!;
    static readonly AWS_S3_BUCKET_ARN: string = process.env.AWS_S3_BUCKET_ARN!;
    static readonly AWS_REGION: string = process.env.AWS_REGION!;


    //Timezone Configurations 
    static readonly DEFAULT_TIMEZONE: string = 'Asia/Kolkata';

    //Firebase notification configuration
    static readonly FIREBASE = {
        PROJECT_ID: process.env.FIREBASE_PROJECT_ID!,
        PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY!,
        CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL!,
    }
    //RazorPay
    static readonly RAZOR_PAY = {
        KEY_ID: process.env.RAZORPAY_KEY_ID!,
        KEY_SECRET: process.env.RAZORPAY_KEY_SECRET!,
        MERCHANT_ID: process.env.RAZORPAY_MERCHANT_ID!
    }
    //SendGrid
    static readonly SENDGRID = {
        API_KEY: process.env.SENDGRID_API_KEY!,
        FROM_ADDRESS: process.env.SENDGRID_FROM_ADDRESS!
    }
    //SendGrid
    static readonly GOOGLE = {
        MAP_KEY: process.env.GOOGLE_MAP_KEY!,
    }
}

export abstract class SocketChannel {
    static readonly USER_CONNECTED = "user connected";
    static readonly USER_DISCONNECTED = "user disconnected";
    static readonly PRIVATE_MESSAGE = "private message";
    static readonly USERS = "users";
    static readonly SESSION = "session";
    static readonly CHAT_SCREEN = "chat screen";
    static readonly FETCH_CONVERSATIONS = "fetch conversations";
    static readonly FETCH_LAST_SEEN = "fetch last seen";
    static readonly LAST_SEEN = "last seen"
    static readonly TYPING = "typing";
    static readonly STOP_TYPING = "stop typing";
    static readonly MESSAGE_SEEN = "message seen";
    static readonly IN_CHAT = "in chat";
    static readonly LEAVE_CHAT = "leave chat";
}



export const CookiePolicy: CookieOptions = { httpOnly: true, sameSite: "none" };

export abstract class AwsS3AccessEndpoints {
    static readonly USERS: string = AwsS3AccessEndpoints.getEndpoint("users/");
    static readonly BUSINESS_DOCUMENTS: string = AwsS3AccessEndpoints.getEndpoint("business-documents/");
    static readonly POST: string = AwsS3AccessEndpoints.getEndpoint("posts/");
    static readonly STORY: string = AwsS3AccessEndpoints.getEndpoint("story/");
    static readonly BUSINESS_PROPERTY: string = AwsS3AccessEndpoints.getEndpoint("business-property/");
    private static getEndpoint(path: string): string {
        const environment = process.env.APP_ENV;
        if (environment === "dev") {
            return "dev-" + path;
        } else if (environment === "production") {
            return path;
        } else {
            throw new Error("Unsupported environment");
        }
    }
}

export abstract class GeoLocation {
    static readonly EARTH_RADIUS_IN_KM: number = 6378;
    // static readonly
}

//  # ┌────────────── second (optional)
//  # │ ┌──────────── minute
//  # │ │ ┌────────── hour
//  # │ │ │ ┌──────── day of month
//  # │ │ │ │ ┌────── month
//  # │ │ │ │ │ ┌──── day of week
//  # │ │ │ │ │ │
//  # │ │ │ │ │ │
//  # * * * * * *
export abstract class CronSchedule {
    static readonly EVERY_FIVE_SECOND: string = "*/5 * * * * *";
    static readonly EVERY_TEN_SECOND: string = "*/10 * * * * *";
    static readonly EVERY_MINUTE: string = "* * * * *";
    static readonly EVERY_TWO_MINUTE: string = "*/2 * * * *";
    static readonly EVERY_TWO_HOURS: string = "0 */2 * * *";
    static readonly EVERY_DAY_AT_00 = "0 0 * * *";
}