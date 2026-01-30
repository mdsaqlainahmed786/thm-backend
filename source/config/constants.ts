import * as dotenv from "dotenv";
import { CookieOptions } from "express";
dotenv.config();
export abstract class AppConfig {
    static readonly APP_NAME: string = process.env.APP_NAME ?? "The Hotel Media";
    static readonly PORT: any = process.env.PORT ?? 3000;
    static readonly DB_CONNECTION: string = process.env.DB_CONNECTION!;
    static readonly APP_ENV: string = process.env.APP_ENV!;
    static readonly OPEN_WEATHER_API = process.env.OPEN_WEATHER_API!;
    //API Version
    static readonly API_VERSION: string = "/api/v1";

    static readonly ANDROID: {
        PACKAGE_NAME: "com.thehotelmedia.android",
    }

    //Authentication token configurations for user side 
    static readonly APP_ACCESS_TOKEN_SECRET: string = process.env.APP_ACCESS_TOKEN_SECRET!;
    static readonly APP_REFRESH_TOKEN_SECRET: string = process.env.APP_REFRESH_TOKEN_SECRET!;



    static readonly ACCESS_TOKEN_EXPIRES_IN: string = process.env.ACCESS_TOKEN_EXPIRES_IN ?? "3m";
    static readonly REFRESH_TOKEN_EXPIRES_IN: string = process.env.REFRESH_TOKEN_EXPIRES_IN ?? "10d";
    static readonly USER_AUTH_TOKEN_COOKIE_KEY = 'SessionToken';
    static readonly ADMIN_AUTH_TOKEN_COOKIE_KEY = 'AdminSessionToken';
    static readonly DEVICE_ID_COOKIE_KEY = "UserDeviceID";

    static readonly USER_AUTH_TOKEN_KEY = 'X-Access-Token';
    static readonly ADMIN_AUTH_TOKEN_KEY = 'X-Admin-Access-Token';

    /**
     * Hosts allowed to perform admin authentication flows.
     * This prevents accidentally hitting admin auth endpoints from hotels/app subdomains
     * and getting "unexpected" admin cookies/tokens.
     *
     * Comma-separated list, e.g:
     * ADMIN_ALLOWED_HOSTS=admin.thehotelmedia.com,www.admin.thehotelmedia.com,localhost,127.0.0.1
     */
    static readonly ADMIN_ALLOWED_HOSTS: string[] = (process.env.ADMIN_ALLOWED_HOSTS ?? "admin.thehotelmedia.com,www.admin.thehotelmedia.com,localhost,127.0.0.1")
        .split(",")
        .map((h) => h.trim().toLowerCase())
        .filter(Boolean);

    //Aws S3 Configurations
    static readonly AWS_BUCKET_NAME: string = process.env.AWS_BUCKET_NAME!;
    static readonly AWS_ACCESS_KEY_ID: string = process.env.AWS_ACCESS_KEY_ID!;
    static readonly AWS_SECRET_ACCESS_KEY: string = process.env.AWS_SECRET_ACCESS_KEY!;
    static readonly AWS_S3_BUCKET_ARN: string = process.env.AWS_S3_BUCKET_ARN!;
    static readonly AWS_REGION: string = process.env.AWS_REGION!;

    /**
     * Optional S3 client tuning.
     * These help avoid hanging requests when the runtime cannot reach S3 (firewall/DNS/routing issues).
     */
    static readonly AWS_S3_ENDPOINT: string | undefined = process.env.AWS_S3_ENDPOINT; // e.g. https://s3.ap-south-1.amazonaws.com or an S3-compatible endpoint
    static readonly AWS_S3_FORCE_PATH_STYLE: boolean = (process.env.AWS_S3_FORCE_PATH_STYLE ?? "false") === "true";
    static readonly AWS_S3_MAX_ATTEMPTS: number = Number(process.env.AWS_S3_MAX_ATTEMPTS ?? 2);
    static readonly AWS_S3_CONNECTION_TIMEOUT_MS: number = Number(process.env.AWS_S3_CONNECTION_TIMEOUT_MS ?? 3000);
    static readonly AWS_S3_SOCKET_TIMEOUT_MS: number = Number(process.env.AWS_S3_SOCKET_TIMEOUT_MS ?? 15000);
    static readonly AWS_S3_MAX_SOCKETS: number = Number(process.env.AWS_S3_MAX_SOCKETS ?? 50);


    static readonly POST_DIMENSION = {
        WIDTH: 500,
        HEIGHT: 500
    }
    static readonly STORY_DIMENSION = {
        WIDTH: 500,
        HEIGHT: 500
    }
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
    // Amazon SES
    static readonly SES = {
        REGION: process.env.AWS_REGION ?? "ap-south-1",
        ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ?? "",
        SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY ?? "",
        FROM_ADDRESS: process.env.SES_FROM_ADDRESS ?? process.env.SENDGRID_FROM_ADDRESS!
    };



    //Mailersend
    static readonly MAILER_SEND = {
        API_KEY: process.env.MAILERSEND_API_KEY!,
        FROM_ADDRESS: process.env.MAILERSEND_FROM_ADDRESS!,
    }
    static readonly GOOGLE = {
        MAP_KEY: process.env.GOOGLE_MAP_KEY!,
    }
    static readonly ENCRYPTION = {
        SECRET_KEY: process.env.SECRET_KEY!,
        IV: process.env.IV!,
        ALGORITHM: process.env.ALGORITHM!,
    }
    static readonly APPLE = {
        CLIENT_ID: process.env.APPLE_CLIENT_ID!,
        PRIVATE_KEY: process.env.APPLE_PRIVATE_KEY!,
        TEAM_ID: process.env.APPLE_TEAM_ID!,
        KEY_IDENTIFIER: process.env.APPLE_KEY_IDENTIFIER!,
    }
    // If PUBLIC_DIR is set and points to folder
    static readonly PUBLIC_DIR: string = process.env.PUBLIC_DIR || "public";
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
    static readonly COLLAB_INVITE = "collab_invite";
    static readonly COLLAB_RESPONSE = "collab_response";
    static readonly COLLAB_UPDATE = "collab_update";
    static readonly LAST_SEEN = "last seen";
    static readonly TYPING = "typing";
    static readonly STOP_TYPING = "stop typing";
    static readonly MESSAGE_SEEN = "message seen";
    static readonly IN_CHAT = "in chat";
    static readonly LEAVE_CHAT = "leave chat";
    static readonly IN_PRIVATE_CHAT = "in private chat";
    static readonly LEAVE_PRIVATE_CHAT = "leave private chat";
    static readonly EDIT_MESSAGE = "edit message";
    static readonly DELETE_MESSAGE = "delete message";
}



/**
 * Default cookie flags used across auth flows.
 *
 * Notes:
 * - Modern browsers require `Secure` when `SameSite=None`.
 * - In local dev over http, we fall back to `SameSite=Lax` and `Secure=false`.
 */
export const CookiePolicy: CookieOptions = {
    httpOnly: true,
    path: "/",
    sameSite: (process.env.APP_ENV === "production" ? "none" : "lax"),
    secure: process.env.APP_ENV === "production",
};

export abstract class AwsS3AccessEndpoints {
    static readonly USERS: string = AwsS3AccessEndpoints.getEndpoint("users/");
    static readonly ROOMS: string = AwsS3AccessEndpoints.getEndpoint("bookings/rooms")
    static readonly BUSINESS_DOCUMENTS: string = AwsS3AccessEndpoints.getEndpoint("business-documents/");
    static readonly POST: string = AwsS3AccessEndpoints.getEndpoint("posts/");
    static readonly REVIEW: string = AwsS3AccessEndpoints.getEndpoint("reviews/");
    static readonly STORY: string = AwsS3AccessEndpoints.getEndpoint("story/");
    static readonly BUSINESS_PROPERTY: string = AwsS3AccessEndpoints.getEndpoint("business-property/");
    static readonly MESSAGING: string = AwsS3AccessEndpoints.getEndpoint("messaging/");
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
    static readonly ONLY_ON_MONDAY_AND_THURSDAY = "0 15 * * 1,4";
    static readonly MARKETING_NOTIFICATION_DAILY = "0 10 * * *"; // Daily at 10:00 AM
    static readonly MARKETING_NOTIFICATION_EVERY_6_HOURS = "0 */6 * * *"; // Every 6 hours
}

export interface MarketingNotificationMessage {
    message: string;
    daysOfWeek?: number[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    months?: number[]; // 0 = January, 1 = February, ..., 11 = December
    isWeekend?: boolean; // true = Saturday or Sunday
    isWeekday?: boolean; // true = Monday to Friday
}

export abstract class MarketingNotifications {
    static readonly MESSAGES: MarketingNotificationMessage[] = [
        // Booking & Hotel Reservations - Anytime
        { message: "🏨 Struggling to book hotels and reservations? We've got you covered! ✨" },
        { message: "✈️ Your next adventure is just a tap away! Book hotels, rooms & stays instantly 🎯" },
        { message: "🌟 Weekend plans? Discover amazing hotels and home stays near you 🏖️", isWeekend: true },
        { message: "📞 No more calling hotels! Book rooms directly from your phone 📱" },
        { message: "🔍 Planning a trip? Browse verified hotels with real guest reviews ⭐" },
        { message: "⚡ Last-minute stay? Find available rooms in minutes, not hours! 🚀" },
        { message: "🎒 Travel made simple. Book, review, and share your hotel experiences 🌍" },
        // Social & Community Features - Anytime
        { message: "👥 Join thousands sharing their travel stories! Your journey matters 📸" },
        { message: "🔔 See what's happening in the hotel world. Follow travelers like you! ✈️" },
        { message: "💬 Share your stay experience. Help others discover amazing places 🌟" },
        { message: "🤝 Connect with fellow travelers. Share tips, reviews, and memories 📝" },
        { message: "✨ Your travel story could inspire someone's next adventure! 🌈" },
        // Events & Activities
        { message: "🎉 Exciting events happening near you! Don't miss out on the fun 🎊" },
        { message: "🏖️ Weekend getaway? Check out trending events and hotel deals! 💰", isWeekend: true },
        { message: "🗓️ Discover local events and book your stay in one place! 🎯" },
        // Reviews & Recommendations - Anytime
        { message: "⭐ Real reviews from real guests. Make informed booking decisions! 💯" },
        { message: "📝 Your honest review helps others find their perfect stay 🏨" },
        { message: "👀 See what guests are saying. Trusted reviews for every property ⭐⭐⭐" },
        // App Benefits & Features - Anytime
        { message: "🎯 One app for everything travel! Book, share, connect, and explore 🌐" },
        { message: "🚀 From booking to sharing. Your complete travel companion! ✈️" },
        { message: "🎁 Why use 5 apps when one does it all? Book, review, and socialize! 💪" },
        // { message: "👑 Premium features unlocked! Post unlimited, go ad-free 🚫📢" },
        { message: "🌐 Your travel social network. Where bookings meet community! 🤝" },
        // Time-based & Contextual
        { message: "🎉 Friday vibes! Time to plan that weekend getaway! 🏖️", daysOfWeek: [5] }, // Friday only
        { message: "🌅 New week, new adventures! Explore trending hotels 🏨", daysOfWeek: [1] }, // Monday only
        { message: "☀️ Summer is here! Book your perfect vacation stay 🏖️", months: [5, 6, 7] }, // June, July, August
        { message: "🎄 Holiday season approaching! Secure your bookings early ⏰", months: [10, 11] }, // November, December
        // Engagement & Retention - Anytime
        { message: "💔 We miss you! Come back and discover what's new ✨" },
        { message: "📱 Your feed is waiting! See the latest from hotels you follow 🔔" },
        { message: "🆕 New hotels added daily! Be the first to discover them 🌟" },
        { message: "🎁 Special deals just for you! Check out exclusive offers 💰" },
        // Business Features - Anytime
        { message: "🏢 Hotel owners: Showcase your property to thousands of travelers! 📈" },
        { message: "💼 Grow your business! Connect with guests and boost bookings 📊" }
    ];
}