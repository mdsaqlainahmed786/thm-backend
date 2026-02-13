"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketingNotifications = exports.CronSchedule = exports.GeoLocation = exports.AwsS3AccessEndpoints = exports.CookiePolicy = exports.SocketChannel = exports.AppConfig = void 0;
const dotenv = __importStar(require("dotenv"));
dotenv.config();
class AppConfig {
}
exports.AppConfig = AppConfig;
AppConfig.APP_NAME = (_a = process.env.APP_NAME) !== null && _a !== void 0 ? _a : "The Hotel Media";
AppConfig.PORT = (_b = process.env.PORT) !== null && _b !== void 0 ? _b : 3000;
AppConfig.DB_CONNECTION = process.env.DB_CONNECTION;
AppConfig.APP_ENV = process.env.APP_ENV;
AppConfig.OPEN_WEATHER_API = process.env.OPEN_WEATHER_API;
//API Version
AppConfig.API_VERSION = "/api/v1";
//Authentication token configurations for user side 
AppConfig.APP_ACCESS_TOKEN_SECRET = process.env.APP_ACCESS_TOKEN_SECRET;
AppConfig.APP_REFRESH_TOKEN_SECRET = process.env.APP_REFRESH_TOKEN_SECRET;
AppConfig.ACCESS_TOKEN_EXPIRES_IN = (_c = process.env.ACCESS_TOKEN_EXPIRES_IN) !== null && _c !== void 0 ? _c : "3m";
AppConfig.REFRESH_TOKEN_EXPIRES_IN = (_d = process.env.REFRESH_TOKEN_EXPIRES_IN) !== null && _d !== void 0 ? _d : "10d";
AppConfig.USER_AUTH_TOKEN_COOKIE_KEY = 'SessionToken';
AppConfig.ADMIN_AUTH_TOKEN_COOKIE_KEY = 'AdminSessionToken';
AppConfig.DEVICE_ID_COOKIE_KEY = "UserDeviceID";
AppConfig.USER_AUTH_TOKEN_KEY = 'X-Access-Token';
AppConfig.ADMIN_AUTH_TOKEN_KEY = 'X-Admin-Access-Token';
//Aws S3 Configurations
AppConfig.AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME;
AppConfig.AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
AppConfig.AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
AppConfig.AWS_S3_BUCKET_ARN = process.env.AWS_S3_BUCKET_ARN;
AppConfig.AWS_REGION = process.env.AWS_REGION;
/**
 * Optional S3 client tuning.
 * These help avoid hanging requests when the runtime cannot reach S3 (firewall/DNS/routing issues).
 */
AppConfig.AWS_S3_ENDPOINT = process.env.AWS_S3_ENDPOINT; // e.g. https://s3.ap-south-1.amazonaws.com or an S3-compatible endpoint
AppConfig.AWS_S3_FORCE_PATH_STYLE = ((_e = process.env.AWS_S3_FORCE_PATH_STYLE) !== null && _e !== void 0 ? _e : "false") === "true";
AppConfig.AWS_S3_MAX_ATTEMPTS = Number((_f = process.env.AWS_S3_MAX_ATTEMPTS) !== null && _f !== void 0 ? _f : 2);
AppConfig.AWS_S3_CONNECTION_TIMEOUT_MS = Number((_g = process.env.AWS_S3_CONNECTION_TIMEOUT_MS) !== null && _g !== void 0 ? _g : 3000);
AppConfig.AWS_S3_SOCKET_TIMEOUT_MS = Number((_h = process.env.AWS_S3_SOCKET_TIMEOUT_MS) !== null && _h !== void 0 ? _h : 15000);
AppConfig.AWS_S3_MAX_SOCKETS = Number((_j = process.env.AWS_S3_MAX_SOCKETS) !== null && _j !== void 0 ? _j : 50);
AppConfig.POST_DIMENSION = {
    WIDTH: 500,
    HEIGHT: 500
};
AppConfig.STORY_DIMENSION = {
    WIDTH: 500,
    HEIGHT: 500
};
//Timezone Configurations 
AppConfig.DEFAULT_TIMEZONE = 'Asia/Kolkata';
//Firebase notification configuration
AppConfig.FIREBASE = {
    PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
    CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
};
//RazorPay
AppConfig.RAZOR_PAY = {
    KEY_ID: ((_k = process.env.RAZORPAY_KEY_ID) === null || _k === void 0 ? void 0 : _k.replace(/^["']|["']$/g, '').trim()) || '',
    KEY_SECRET: ((_l = process.env.RAZORPAY_KEY_SECRET) === null || _l === void 0 ? void 0 : _l.replace(/^["']|["']$/g, '').trim()) || '',
    MERCHANT_ID: ((_m = process.env.RAZORPAY_MERCHANT_ID) === null || _m === void 0 ? void 0 : _m.replace(/^["']|["']$/g, '').trim()) || ''
};
//SendGrid
AppConfig.SENDGRID = {
    API_KEY: process.env.SENDGRID_API_KEY,
    FROM_ADDRESS: process.env.SENDGRID_FROM_ADDRESS
};
// Amazon SES
AppConfig.SES = {
    REGION: (_o = process.env.AWS_REGION) !== null && _o !== void 0 ? _o : "ap-south-1",
    ACCESS_KEY_ID: (_p = process.env.AWS_ACCESS_KEY_ID) !== null && _p !== void 0 ? _p : "",
    SECRET_ACCESS_KEY: (_q = process.env.AWS_SECRET_ACCESS_KEY) !== null && _q !== void 0 ? _q : "",
    FROM_ADDRESS: (_r = process.env.SES_FROM_ADDRESS) !== null && _r !== void 0 ? _r : process.env.SENDGRID_FROM_ADDRESS
};
//Mailersend
AppConfig.MAILER_SEND = {
    API_KEY: process.env.MAILERSEND_API_KEY,
    FROM_ADDRESS: process.env.MAILERSEND_FROM_ADDRESS,
};
AppConfig.GOOGLE = {
    MAP_KEY: process.env.GOOGLE_MAP_KEY,
};
AppConfig.ENCRYPTION = {
    SECRET_KEY: process.env.SECRET_KEY,
    IV: process.env.IV,
    ALGORITHM: process.env.ALGORITHM,
};
AppConfig.APPLE = {
    CLIENT_ID: process.env.APPLE_CLIENT_ID,
    PRIVATE_KEY: process.env.APPLE_PRIVATE_KEY,
    TEAM_ID: process.env.APPLE_TEAM_ID,
    KEY_IDENTIFIER: process.env.APPLE_KEY_IDENTIFIER,
};
// If PUBLIC_DIR is set and points to folder
AppConfig.PUBLIC_DIR = process.env.PUBLIC_DIR || "public";
class SocketChannel {
}
exports.SocketChannel = SocketChannel;
SocketChannel.USER_CONNECTED = "user connected";
SocketChannel.USER_DISCONNECTED = "user disconnected";
SocketChannel.PRIVATE_MESSAGE = "private message";
SocketChannel.USERS = "users";
SocketChannel.SESSION = "session";
SocketChannel.CHAT_SCREEN = "chat screen";
SocketChannel.FETCH_CONVERSATIONS = "fetch conversations";
SocketChannel.FETCH_LAST_SEEN = "fetch last seen";
SocketChannel.COLLAB_INVITE = "collab_invite";
SocketChannel.COLLAB_RESPONSE = "collab_response";
SocketChannel.COLLAB_UPDATE = "collab_update";
SocketChannel.LAST_SEEN = "last seen";
SocketChannel.TYPING = "typing";
SocketChannel.STOP_TYPING = "stop typing";
SocketChannel.MESSAGE_SEEN = "message seen";
SocketChannel.IN_CHAT = "in chat";
SocketChannel.LEAVE_CHAT = "leave chat";
SocketChannel.IN_PRIVATE_CHAT = "in private chat";
SocketChannel.LEAVE_PRIVATE_CHAT = "leave private chat";
SocketChannel.EDIT_MESSAGE = "edit message";
SocketChannel.DELETE_MESSAGE = "delete message";
exports.CookiePolicy = { httpOnly: true, sameSite: "none" };
class AwsS3AccessEndpoints {
    static getEndpoint(path) {
        const environment = process.env.APP_ENV;
        if (environment === "dev") {
            return "dev-" + path;
        }
        else if (environment === "production") {
            return path;
        }
        else {
            throw new Error("Unsupported environment");
        }
    }
}
exports.AwsS3AccessEndpoints = AwsS3AccessEndpoints;
AwsS3AccessEndpoints.USERS = AwsS3AccessEndpoints.getEndpoint("users/");
AwsS3AccessEndpoints.ROOMS = AwsS3AccessEndpoints.getEndpoint("bookings/rooms");
AwsS3AccessEndpoints.BUSINESS_DOCUMENTS = AwsS3AccessEndpoints.getEndpoint("business-documents/");
AwsS3AccessEndpoints.POST = AwsS3AccessEndpoints.getEndpoint("posts/");
AwsS3AccessEndpoints.REVIEW = AwsS3AccessEndpoints.getEndpoint("reviews/");
AwsS3AccessEndpoints.STORY = AwsS3AccessEndpoints.getEndpoint("story/");
AwsS3AccessEndpoints.BUSINESS_PROPERTY = AwsS3AccessEndpoints.getEndpoint("business-property/");
AwsS3AccessEndpoints.MESSAGING = AwsS3AccessEndpoints.getEndpoint("messaging/");
class GeoLocation {
}
exports.GeoLocation = GeoLocation;
GeoLocation.EARTH_RADIUS_IN_KM = 6378;
//  # ┌────────────── second (optional)
//  # │ ┌──────────── minute
//  # │ │ ┌────────── hour
//  # │ │ │ ┌──────── day of month
//  # │ │ │ │ ┌────── month
//  # │ │ │ │ │ ┌──── day of week
//  # │ │ │ │ │ │
//  # │ │ │ │ │ │
//  # * * * * * *
class CronSchedule {
}
exports.CronSchedule = CronSchedule;
CronSchedule.EVERY_FIVE_SECOND = "*/5 * * * * *";
CronSchedule.EVERY_TEN_SECOND = "*/10 * * * * *";
CronSchedule.EVERY_MINUTE = "* * * * *";
CronSchedule.EVERY_TWO_MINUTE = "*/2 * * * *";
CronSchedule.EVERY_TWO_HOURS = "0 */2 * * *";
CronSchedule.EVERY_DAY_AT_00 = "0 0 * * *";
CronSchedule.ONLY_ON_MONDAY_AND_THURSDAY = "0 15 * * 1,4";
CronSchedule.MARKETING_NOTIFICATION_DAILY = "0 10 * * *"; // Daily at 10:00 AM
CronSchedule.MARKETING_NOTIFICATION_EVERY_6_HOURS = "0 */6 * * *"; // Every 6 hours
class MarketingNotifications {
}
exports.MarketingNotifications = MarketingNotifications;
MarketingNotifications.MESSAGES = [
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
