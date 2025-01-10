
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

