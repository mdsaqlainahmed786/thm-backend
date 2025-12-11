

import { Types } from "mongoose";
import { Socket } from "socket.io";
import { AccountType } from "../database/models/user.model";
import { MessageType } from "../database/models/message.model";
import { Address } from "../database/models/common.model";
export enum Role {
    USER = 'user',
    ADMINISTRATOR = 'administrator',
    OFFICIAL = 'official',//Only use as official The hotel Media Account
    MODERATOR = "moderator" //Moderators have the ability to manage comments and prevent spam or inappropriate content post but do not have full access to account settings or posting.
}
export interface AuthenticateUser {
    id: string | Types.ObjectId;
    accountType?: AccountType | undefined;
    businessProfileID?: string | Types.ObjectId;
    role: Role,
}

export type MongoID = Types.ObjectId | string;


export interface SocketUser {
    sessionID: string;
    username: string;
    userID: string | Types.ObjectId;
    chatWith?: string | undefined;
    inChatScreen: boolean;
}


export interface AppSocketUser extends Socket, SocketUser {
}


export interface PrivateIncomingMessagePayload {
    message: Message;
    to: string;
}
/*** Private message */
export interface Message {
    type: MessageType;
    message: string;
    mediaUrl?: string;
    thumbnailUrl?: string;
    storyID?: string;
    mediaID?: string;
}

export interface Messages {
    messages: any;
    pageNo: number;
    totalPages: number;
    totalMessages: number;
}

export enum ContentType {
    POST = "post",
    STORY = 'story',
    ANONYMOUS = "anonymous",
    USER = "user",
    COMMENT = "comment"
}
export interface BillingAddress {
    name: string;
    address: Address;
    dialCode: string;
    phoneNumber: string;
    gstn: string;
}

// enum Content {
//     STORY = 'story'
// }

// type ContentType = PostType | Content;


export type AppleSignInCredentials = {
    privateKey: string;
    teamId: string;
    keyId: string;
    clientId: string;
}



export enum InsightType {
    WEBSITE_REDIRECTION = 'website-redirection',
    ACCOUNT_REACH = "account-reach"
}

export enum Language {
    English = 'en',
    Hindi = 'hi',
    Gujarati = 'gu',
    Kannada = "kn",
    Marathi = "mr",
    Telugu = "te"
}

export enum CurrencyCode {
    INR = "INR"
}


export enum RoomType {
    SINGLE = 'single',
    DOUBLE = 'double',
    SUITE = 'suite',
    FAMILY = 'family',
    SUPER_DELUXE = 'super-deluxe',
    DELUXE = 'deluxe'
}
export enum MealPlan {
    BREAKFAST = "breakfast",  //breakfast is provided.
    LUNCH = "lunch",//lunch is included.
    DINNER = "dinner",//dinner is included.
    FULL_BOARD = "full board",// breakfast, lunch, and dinner.
    BREAKFAST_OR_LUNCH = "breakfast or lunch",
    LUNCH_OR_DINNER = "lunch or dinner",
    BREAKFAST_OR_DINNER = "breakfast or dinner",
    NOT_INCLUDED = "not included", // In case there's no meal included
    ALL_INCLUSIVE = "all inclusive",//Everything is included (meals, snacks, drinks, etc.).
}

export enum BedType {
    'KING' = 'king',
    'QUEEN' = 'queen',
    'SINGLE' = 'single',
    'DOUBLE' = 'double'
}

// Cloud Pub/Sub Message
export interface CloudPubSubPublishMessage {
    subscription: string;
    message: Schema$PubsubMessage;
}
interface Schema$PubsubMessage {
    data: string
    messageId: string
    message_id: string
    publishTime: string
    publish_time: string
}


// Developer Notification
export interface DeveloperNotification {
    version: string;
    packageName: string;
    eventTimeMillis: number;
    oneTimeProductNotification: OneTimeProductNotification;
    subscriptionNotification: SubscriptionNotification;
    testNotification: TestNotification;
}


// One-Time Product Notification
enum OneTimeProductNotification$NotificationType {
    ONE_TIME_PRODUCT_PURCHASED = 1,  // (1) One-time product purchased
    ONE_TIME_PRODUCT_CANCELED = 2,   // (2) One-time product canceled
}

interface OneTimeProductNotification {
    version: string;
    notificationType: OneTimeProductNotification$NotificationType;
    purchaseToken: string;
    sku: string;
}

// Subscription Notification
enum SubscriptionNotification$NotificationType {
    SUBSCRIPTION_RECOVERED = 1, // (1) Subscription recovered from account hold
    SUBSCRIPTION_RENEWED = 2, // (2) Subscription renewed
    SUBSCRIPTION_CANCELED = 3, // (3) Subscription canceled
    SUBSCRIPTION_PURCHASED = 4, // (4) New subscription purchased
    SUBSCRIPTION_ON_HOLD = 5, // (5) Subscription on hold
    SUBSCRIPTION_IN_GRACE_PERIOD = 6, // (6) Subscription in grace period
    SUBSCRIPTION_RESTARTED = 7, // (7) Subscription restarted
    SUBSCRIPTION_PRICE_CHANGE_CONFIRMED = 8, // (8) Subscription price change confirmed
    SUBSCRIPTION_DEFERRED = 9, // (9) Subscription deferred
    SUBSCRIPTION_PAUSED = 10, // (10) Subscription paused
    SUBSCRIPTION_PAUSE_SCHEDULE_CHANGED = 11, // (11) Subscription pause schedule changed
    SUBSCRIPTION_REVOKED = 12, // (12) Subscription revoked
    SUBSCRIPTION_EXPIRED = 13, // (13) Subscription expired
}

interface SubscriptionNotification {
    version: string;
    notificationType: SubscriptionNotification$NotificationType;
    purchaseToken: string;
    subscriptionId: string;
}

// Test Notification (you can customize this based on your testing needs)
interface TestNotification {
    // Add relevant fields for testing if available
    // Example: test type, test reason, etc.
}

export enum Environment {
    DEVELOPMENT = "development",
    PRODUCTION = "production",
}

export enum BookedFor {
    FOR_MYSELF = "myself",
    FOR_SOMEONE_ELSE = "someone-else"
}

export interface FileObject {
    filename: string,
    filepath: string,
    type: string,
}


export enum Profession {
    BUSINESS_PERSON_MAN = "Business Person/ Man",
    GOVERNMENT_SECTOR_EMPLOYEE = "Government Sector/ Employee",
    SELF_EMPLOYEE_PRIVATE_JOB = "Self Employee/ Private Job",
    BELONGS_TO_HOTEL_INDUSTRY = "Belongs To Hotel Industry",
    OTHERS = "Others",
}
