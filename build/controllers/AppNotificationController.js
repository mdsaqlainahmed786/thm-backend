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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_1 = require("mongodb");
const response_1 = require("../utils/response");
const error_1 = require("../utils/response-message/error");
const user_model_1 = __importStar(require("../database/models/user.model"));
const notification_model_1 = require("../database/models/notification.model");
const constants_1 = require("../config/constants");
const notification_model_2 = __importDefault(require("../database/models/notification.model"));
const appDeviceConfig_model_1 = __importDefault(require("../database/models/appDeviceConfig.model"));
const FirebaseNotificationController_1 = require("../notification/FirebaseNotificationController");
const basic_1 = require("../utils/helper/basic");
const response_2 = require("../utils/response");
const user_model_2 = require("../database/models/user.model");
const uuid_1 = require("uuid");
const userConnection_model_1 = __importStar(require("../database/models/userConnection.model"));
const message_model_1 = __importDefault(require("../database/models/message.model"));
const businessProfile_model_1 = __importDefault(require("../database/models/businessProfile.model"));
const index = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id, accountType, businessProfileID } = request.user;
        let { pageNumber, documentLimit, query } = request.query;
        if (!accountType && !id) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        pageNumber = (0, basic_1.parseQueryParam)(pageNumber, 1);
        documentLimit = (0, basic_1.parseQueryParam)(documentLimit, 20);
        const dbQuery = { isDeleted: false, targetUserID: new mongodb_1.ObjectId(id) };
        if (query !== undefined && query !== "") {
            Object.assign(dbQuery);
        }
        const [isRequested, isConnected] = yield Promise.all([
            userConnection_model_1.default.distinct('following', { follower: id, status: userConnection_model_1.ConnectionStatus.PENDING }),
            userConnection_model_1.default.distinct('following', { follower: id, status: userConnection_model_1.ConnectionStatus.ACCEPTED })
        ]);
        yield notification_model_2.default.updateMany(dbQuery, { isSeen: true });
        const documents = yield notification_model_2.default.aggregate([
            {
                $match: dbQuery
            },
            {
                '$lookup': {
                    'from': 'users',
                    'let': { 'userID': '$userID' },
                    'pipeline': [
                        { '$match': { '$expr': { '$eq': ['$_id', '$$userID'] } } },
                        (0, user_model_2.addBusinessProfileInUser)().lookup,
                        (0, user_model_2.addBusinessProfileInUser)().unwindLookup,
                        (0, user_model_1.profileBasicProject)(),
                    ],
                    'as': 'usersRef'
                }
            },
            {
                '$unwind': {
                    'path': '$usersRef',
                    'preserveNullAndEmptyArrays': true //false value does not fetch relationship.
                }
            },
            {
                $addFields: {
                    isConnected: { $in: ['$userID', isConnected] },
                    isRequested: { $in: ['$userID', isRequested] },
                }
            },
            {
                $sort: { createdAt: -1, id: 1 }
            },
            {
                $skip: pageNumber > 0 ? ((pageNumber - 1) * documentLimit) : 0
            },
            {
                $limit: documentLimit
            },
            {
                $project: {
                    targetUserID: 0,
                    isDeleted: 0,
                    updatedAt: 0,
                    __v: 0,
                }
            }
        ]).exec();
        const totalDocument = yield notification_model_2.default.find(dbQuery).countDocuments();
        const totalPagesCount = Math.ceil(totalDocument / documentLimit) || 1;
        return response.send((0, response_2.httpOkExtended)(documents, 'Notification fetched.', pageNumber, totalPagesCount, totalDocument));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_a = error.message) !== null && _a !== void 0 ? _a : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const status = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    try {
        const { id, accountType, businessProfileID } = request.user;
        const dbQuery = { isDeleted: false, targetUserID: new mongodb_1.ObjectId(id), isSeen: false };
        const documents = yield notification_model_2.default.find(dbQuery).countDocuments();
        let findQuery = {
            $or: [
                { targetUserID: new mongodb_1.ObjectId(id), deletedByID: { $nin: [new mongodb_1.ObjectId(id)] }, isSeen: false }
            ]
        };
        const messages = yield message_model_1.default.find(findQuery).countDocuments();
        const messageObj = {
            hasUnreadMessages: messages > 0,
            count: messages
        };
        const notificationObj = {
            hasUnreadMessages: documents > 0,
            count: documents
        };
        const responseObject = {
            notifications: notificationObj,
            messages: messageObj
        };
        return response.send((0, response_1.httpOk)(responseObject, 'Notification fetched.'));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_b = error.message) !== null && _b !== void 0 ? _b : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const store = (userID, targetUserID, type, metadata) => __awaiter(void 0, void 0, void 0, function* () {
    var _c, _d, _e, _f, _g, _h, _j, _k;
    try {
        console.log("   [STORE] Start creating notification:");
        console.log("   → Type:", type);
        console.log("   → From (userID):", userID === null || userID === void 0 ? void 0 : userID.toString());
        console.log("   → To (targetUserID):", targetUserID === null || targetUserID === void 0 ? void 0 : targetUserID.toString());
        console.log("   → Metadata:", metadata);
        const [userData, targetUserData] = yield Promise.all([
            user_model_1.default.findOne({ _id: userID }),
            user_model_1.default.findOne({ _id: targetUserID }),
        ]);
        if (!userData || !targetUserData) {
            console.error(` User or target user not found. userID: ${userID}, targetUserID: ${targetUserID}`);
            return null;
        }
        let name = userData.name;
        let profileImage = ((_c = userData === null || userData === void 0 ? void 0 : userData.profilePic) === null || _c === void 0 ? void 0 : _c.small) || "";
        let postType = "post";
        let description = "Welcome to The Hotel Media";
        let image = "";
        let title = constants_1.AppConfig.APP_NAME;
        if (userData.accountType === user_model_1.AccountType.BUSINESS && userData.businessProfileID) {
            const businessData = yield businessProfile_model_1.default.findOne({
                _id: userData.businessProfileID,
            });
            if (businessData) {
                name = businessData.name;
                profileImage = (_e = (_d = businessData === null || businessData === void 0 ? void 0 : businessData.profilePic) === null || _d === void 0 ? void 0 : _d.small) !== null && _e !== void 0 ? _e : profileImage;
            }
        }
        switch (type) {
            case notification_model_1.NotificationType.LIKE_A_STORY:
                description = `${name} liked your story.`;
                break;
            case notification_model_1.NotificationType.LIKE_POST:
                postType = (_f = metadata.postType) !== null && _f !== void 0 ? _f : "post";
                description = `${name} liked your ${postType}.`;
                break;
            case notification_model_1.NotificationType.LIKE_COMMENT:
                description = `${name} liked your comment: '${(0, basic_1.truncate)(metadata === null || metadata === void 0 ? void 0 : metadata.message)}'.`;
                break;
            case notification_model_1.NotificationType.FOLLOW_REQUEST:
                description = `${name} requested to follow you.`;
                break;
            case notification_model_1.NotificationType.FOLLOWING:
                description = `${name} started following you.`;
                break;
            case notification_model_1.NotificationType.ACCEPT_FOLLOW_REQUEST:
                description = `${name} accepted your follow request.`;
                break;
            case notification_model_1.NotificationType.COMMENT:
                postType = (_g = metadata.postType) !== null && _g !== void 0 ? _g : "post";
                description = `${name} commented on your ${postType}: '${(0, basic_1.truncate)(metadata === null || metadata === void 0 ? void 0 : metadata.message)}'.`;
                break;
            case notification_model_1.NotificationType.REPLY:
                description = `${name} replied to your comment: '${(0, basic_1.truncate)(metadata === null || metadata === void 0 ? void 0 : metadata.message)}'.`;
                break;
            case notification_model_1.NotificationType.TAGGED:
                if ((metadata === null || metadata === void 0 ? void 0 : metadata.entityType) === 'story' || (metadata === null || metadata === void 0 ? void 0 : metadata.storyID)) {
                    description = `${name} tagged you in a story.`;
                }
                else {
                    description = `${name} tagged you in a post.`;
                }
                break;
            case notification_model_1.NotificationType.EVENT_JOIN:
                const eventName = (_h = metadata.name) !== null && _h !== void 0 ? _h : "";
                description = `${name} has joined the event \n${eventName}.`;
                break;
            case notification_model_1.NotificationType.COLLABORATION_INVITE:
                description = `${name} invited you to collaborate on a post.`;
                break;
            case notification_model_1.NotificationType.COLLABORATION_ACCEPTED:
                description = `${name} accepted your collaboration invite.`;
                break;
            case notification_model_1.NotificationType.COLLABORATION_REJECTED:
                description = `${name} declined your collaboration invite.`;
                break;
            case notification_model_1.NotificationType.JOB:
                const jobTitle = (_j = metadata === null || metadata === void 0 ? void 0 : metadata.title) !== null && _j !== void 0 ? _j : "a job";
                description = `${name} posted a new job: ${jobTitle}.`;
                break;
            default:
                description = `Unknown notification type: ${type}`;
        }
        console.log(" [STORE] Creating Notification object...");
        const newNotification = new notification_model_2.default({
            userID,
            senderID: userID,
            targetUserID,
            title,
            description,
            type,
            metadata,
        });
        try {
            const saved = yield newNotification.save();
            //@ts-ignore
            console.log(" [STORE] Notification saved successfully:", saved._id.toString());
        }
        catch (saveErr) {
            console.error(" [STORE] Failed to save notification:", saveErr.message);
        }
        const devicesConfigs = yield appDeviceConfig_model_1.default.find({ userID: targetUserID });
        try {
            if (userID.toString() !== targetUserID.toString()) {
                console.log("📡 Sending push notification...");
                // Optional navigation hints for clients
                const route = type === notification_model_1.NotificationType.TAGGED && ((metadata === null || metadata === void 0 ? void 0 : metadata.entityType) === 'story' || (metadata === null || metadata === void 0 ? void 0 : metadata.storyID))
                    ? 'story_detail'
                    : undefined;
                const extraData = type === notification_model_1.NotificationType.TAGGED && ((metadata === null || metadata === void 0 ? void 0 : metadata.entityType) === 'story' || (metadata === null || metadata === void 0 ? void 0 : metadata.storyID))
                    ? {
                        entityType: 'story',
                        storyID: String((_k = metadata === null || metadata === void 0 ? void 0 : metadata.storyID) !== null && _k !== void 0 ? _k : ''),
                    }
                    : undefined;
                yield Promise.all(devicesConfigs.map((devicesConfig) => __awaiter(void 0, void 0, void 0, function* () {
                    if (devicesConfig === null || devicesConfig === void 0 ? void 0 : devicesConfig.notificationToken) {
                        const notificationID = newNotification.id || (0, uuid_1.v4)();
                        const devicePlatform = devicesConfig.devicePlatform;
                        const message = (0, FirebaseNotificationController_1.createMessagePayload)(devicesConfig.notificationToken, title, description, {
                            notificationID,
                            devicePlatform,
                            type,
                            route,
                            extraData,
                            image,
                            profileImage,
                        });
                        yield (0, FirebaseNotificationController_1.sendNotification)(message);
                    }
                    return devicesConfig;
                })));
            }
        }
        catch (pushErr) {
            console.error(" [STORE] Error sending push notification:", pushErr);
        }
        return newNotification;
    }
    catch (error) {
        console.error(" [STORE] Unexpected error:", error.message);
        throw error;
    }
});
const update = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _l;
    try {
        // return response.send(httpAcceptedOrUpdated(null, 'Not implemented'));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_l = error.message) !== null && _l !== void 0 ? _l : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const destroy = (userID, targetUserID, type, metadata) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const dbQuery = { userID: userID, targetUserID: targetUserID };
        switch (type) {
            case notification_model_1.NotificationType.LIKE_A_STORY:
                Object.assign(dbQuery, { type: type, "metadata.storyID": metadata === null || metadata === void 0 ? void 0 : metadata.storyID });
                break;
            case notification_model_1.NotificationType.LIKE_POST:
                Object.assign(dbQuery, { type: type, "metadata.postID": metadata === null || metadata === void 0 ? void 0 : metadata.postID });
                break;
            case notification_model_1.NotificationType.LIKE_COMMENT:
                Object.assign(dbQuery, { type: type, "metadata.commentID": metadata === null || metadata === void 0 ? void 0 : metadata.commentID });
                break;
            case notification_model_1.NotificationType.FOLLOW_REQUEST:
                Object.assign(dbQuery, { type: type, "metadata.connectionID": metadata === null || metadata === void 0 ? void 0 : metadata.connectionID });
                break;
            case notification_model_1.NotificationType.EVENT_JOIN:
                Object.assign(dbQuery, { type: type, "metadata.postID": metadata === null || metadata === void 0 ? void 0 : metadata.postID });
                break;
        }
        const notification = yield notification_model_2.default.findOne(dbQuery);
        if (notification) {
            const devicesConfigs = yield appDeviceConfig_model_1.default.find({ userID: targetUserID });
            try {
                yield Promise.all(devicesConfigs.map((devicesConfig) => __awaiter(void 0, void 0, void 0, function* () {
                    if (devicesConfig && devicesConfig.notificationToken) {
                        const notificationID = notification.id ? notification === null || notification === void 0 ? void 0 : notification.id : (0, uuid_1.v4)();
                        const message = (0, FirebaseNotificationController_1.createMessagePayload)(devicesConfig.notificationToken, 'New Message', 'Checking for New Messages ...', {
                            notificationID: notificationID,
                            devicePlatform: devicesConfig.devicePlatform,
                            type: 'destroy',
                            image: "",
                            profileImage: ""
                        });
                        // await sendNotification(message);
                    }
                    return devicesConfig;
                })));
            }
            catch (error) {
                console.error("Error sending one or more notifications:", error);
            }
            yield notification.deleteOne();
        }
    }
    catch (error) {
        throw error;
    }
});
const show = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _m;
    try {
        // return response.send(httpOk(null, "Not implemented"));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_m = error.message) !== null && _m !== void 0 ? _m : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
exports.default = { index, status, store, update, destroy };
