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
const file_uploading_1 = require("./../middleware/file-uploading");
const message_model_1 = __importDefault(require("../database/models/message.model"));
const user_model_1 = __importStar(require("../database/models/user.model"));
const mongodb_1 = require("mongodb");
const response_1 = require("../utils/response");
const error_1 = require("../utils/response-message/error");
const message_model_2 = require("../database/models/message.model");
const response_2 = require("../utils/response");
const fs_1 = __importDefault(require("fs"));
const uuid_1 = require("uuid");
const moment_1 = __importDefault(require("moment"));
const businessProfile_model_1 = __importDefault(require("../database/models/businessProfile.model"));
const story_model_1 = require("../database/models/story.model");
const constants_1 = require("../config/constants");
const MediaController_1 = require("./MediaController");
/**
 *
 * @param query
 * @param userID
 * @param pageNumber
 * @param documentLimit
 * @returns Return user messages
 */
function fetchMessagesByUserID(query, userID, pageNumber, documentLimit) {
    return message_model_1.default.aggregate([
        { $match: query },
        {
            $sort: { createdAt: -1, id: 1 }
        },
        {
            $skip: pageNumber > 0 ? ((pageNumber - 1) * documentLimit) : 0
        },
        {
            $limit: documentLimit,
        },
        {
            $addFields: {
                "sentByMe": { $eq: ["$userID", new mongodb_1.ObjectId(userID)] }
            }
        },
        {
            '$lookup': {
                'from': 'stories',
                'let': { 'storyID': '$storyID' },
                'pipeline': [
                    { '$match': { '$expr': { '$eq': ['$_id', '$$storyID'] }, timeStamp: { $gte: story_model_1.storyTimeStamp } } },
                ],
                'as': 'storiesRef'
            }
        },
        {
            '$unwind': {
                'path': '$storiesRef',
                'preserveNullAndEmptyArrays': true //false value does not fetch relationship.
            }
        },
        {
            '$lookup': {
                'from': 'media',
                'let': { 'mediaID': '$mediaID' },
                'pipeline': [
                    { '$match': { '$expr': { '$eq': ['$_id', '$$mediaID'] } } },
                    {
                        '$project': {
                            '_id': 0,
                            'mediaUrl': "$sourceUrl",
                            'thumbnailUrl': 1,
                            'mimeType': 1,
                        }
                    }
                ],
                'as': 'mediaRef'
            }
        },
        {
            '$unwind': {
                'path': '$mediaRef',
                'preserveNullAndEmptyArrays': true //false value does not fetch relationship.
            }
        },
        {
            '$replaceRoot': {
                'newRoot': {
                    '$mergeObjects': ["$$ROOT", "$mediaRef"] // Merge businessProfileRef with the user object
                }
            }
        },
        {
            $addFields: {
                isStoryAvailable: {
                    $cond: {
                        if: { $ne: [{ $ifNull: ['$storiesRef', ''] }, ''] },
                        then: true,
                        else: false
                    }
                },
            }
        },
        {
            $addFields: {
                mediaUrl: {
                    $cond: {
                        if: {
                            $and: [
                                { $eq: ['$isStoryAvailable', true] },
                                { $eq: ['$type', message_model_2.MessageType.STORY_COMMENT] }
                            ]
                        },
                        then: '$mediaUrl',
                        else: {
                            $cond: {
                                if: {
                                    $and: [
                                        { $eq: ['$isStoryAvailable', false] },
                                        { $eq: ['$type', message_model_2.MessageType.STORY_COMMENT] }
                                    ]
                                },
                                then: 'Story unavailable',
                                else: '$mediaUrl'
                            }
                        }
                    }
                },
            }
        },
        {
            $project: {
                mediaRef: 0,
                updatedAt: 0,
                targetUserID: 0,
                userID: 0,
                deletedByID: 0,
                storiesRef: 0
            }
        }
    ]);
}
function fetchChatByUserID(query, userID, pageNumber, documentLimit) {
    return message_model_1.default.aggregate([
        { $match: query },
        { $sort: { createdAt: -1, _id: 1 } },
        {
            $skip: pageNumber > 0 ? ((pageNumber - 1) * documentLimit) : 0
        },
        {
            $limit: documentLimit,
        },
        {
            $addFields: {
                sentByMe: { "$eq": ["$userID", new mongodb_1.ObjectId(userID)] }
            }
        },
        {
            $addFields: {
                lookupID: { $cond: [{ $ne: ['$targetUserID', new mongodb_1.ObjectId(userID)] }, '$targetUserID', '$userID'] }, //Interchange $targetUserID when it is not equal to user id..
            }
        },
        {
            $group: {
                _id: {
                    lookupID: '$lookupID'
                },
                unseenCount: {
                    $sum: {
                        $cond: [{ $and: [{ $eq: ["$isSeen", false] }, { $eq: ["$sentByMe", false] }] }, 1, 0]
                    }
                },
                document: { $first: '$$ROOT' },
            }
        },
        {
            $replaceRoot: {
                newRoot: { $mergeObjects: ["$$ROOT", "$document"] }
            }
        },
        {
            '$lookup': {
                'from': 'users',
                'let': { 'userID': '$lookupID' },
                'pipeline': [
                    { '$match': { '$expr': { '$eq': ['$_id', '$$userID'] } } },
                    (0, user_model_1.addBusinessProfileInUser)().lookup,
                    (0, user_model_1.addBusinessProfileInUser)().unwindLookup,
                    {
                        '$replaceRoot': {
                            'newRoot': {
                                '$mergeObjects': ["$$ROOT", "$businessProfileRef"] // Merge businessProfileRef with the user object
                            }
                        }
                    },
                    {
                        $project: {
                            name: 1,
                            username: 1,
                            profilePic: 1,
                        }
                    }
                ],
                'as': 'usersRef'
            }
        },
        { $unwind: '$usersRef' },
        {
            $replaceRoot: {
                newRoot: { $mergeObjects: ["$$ROOT", "$usersRef"] }
            }
        },
        { $sort: { createdAt: -1 } },
        {
            $project: {
                __v: 0,
                _id: 0,
                sentByMe: 0,
                userID: 0,
                updatedAt: 0,
                targetUserID: 0,
                deletedByID: 0,
                document: 0,
                usersRef: 0,
            }
        }
    ]);
}
function getChatCount(query, userID, pageNumber, documentLimit) {
    var _a, _b;
    const chats = message_model_1.default.aggregate([
        { $match: query },
        { $sort: { createdAt: -1, _id: 1 } },
        {
            $addFields: {
                sentByMe: { "$eq": [userID, "$userID"] }
            }
        },
        {
            $addFields: {
                lookupID: { $cond: [{ $ne: ['$targetUserID', new mongodb_1.ObjectId(userID)] }, '$targetUserID', '$userID'] }, //Interchange $targetUserID when it is not equal to user id..
            }
        },
        {
            $group: {
                _id: {
                    lookupID: '$lookupID'
                },
                unseenCount: {
                    $sum: {
                        $cond: [{ $and: [{ $eq: ["$isSeen", false] }, { $eq: ["$sentByMe", false] }] }, 1, 0]
                    }
                },
                document: { $first: '$$ROOT' },
            }
        },
        {
            $replaceRoot: {
                newRoot: { $mergeObjects: ["$$ROOT", "$document"] }
            }
        },
        { $sort: { createdAt: -1 } },
        {
            $skip: pageNumber > 0 ? ((pageNumber - 1) * documentLimit) : 0
        },
        { $group: { _id: null, count: { $sum: 1 } } }
    ]);
    return (_b = (_a = chats === null || chats === void 0 ? void 0 : chats[0]) === null || _a === void 0 ? void 0 : _a.count) !== null && _b !== void 0 ? _b : 0;
}
const sendMediaMessage = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { id, accountType, businessProfileID } = request.user;
        const { messageType, username, message } = request.body;
        const requestedUserID = (_a = request.user) === null || _a === void 0 ? void 0 : _a.id;
        const sendedBy = yield user_model_1.default.findOne({ _id: requestedUserID });
        const sendTo = yield user_model_1.default.findOne({ username: username });
        if (!sendedBy) {
            return response.send((0, response_2.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        if (!sendTo) {
            return response.send((0, response_2.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        const files = request.files;
        const mediaFiles = files && files.media;
        if (!mediaFiles || mediaFiles.length === 0) {
            return response.send((0, response_2.httpBadRequest)(error_1.ErrorMessage.invalidRequest("Media file is required"), "Media file is required"));
        }
        // Validate that files have the S3 key property (required for S3 operations)
        const validFiles = mediaFiles.filter((file) => {
            return file !== null && file !== undefined && typeof file === 'object' && 'key' in file && typeof file.key === 'string' && file.key.length > 0;
        });
        if (validFiles.length === 0) {
            return response.send((0, response_2.httpBadRequest)(error_1.ErrorMessage.invalidRequest("Invalid media file format - S3 key is missing"), "Invalid media file format - S3 key is missing"));
        }
        const type = messageType;
        const [uploadedFiles] = yield Promise.all([
            //@ts-ignore
            (0, MediaController_1.storeMedia)(validFiles, id, businessProfileID, constants_1.AwsS3AccessEndpoints.MESSAGING, 'POST'),
        ]);
        if (uploadedFiles && uploadedFiles.length === 0) {
            return response.send((0, response_2.httpBadRequest)(error_1.ErrorMessage.invalidRequest(`${type.capitalize()} is required`), `${type.capitalize()} is required`));
        }
        const messageObject = {
            to: username,
            message: {
                type: messageType,
                message: message !== null && message !== void 0 ? message : '',
                mediaUrl: uploadedFiles[0].sourceUrl,
                thumbnailUrl: uploadedFiles[0].thumbnailUrl,
                mediaID: uploadedFiles[0].id,
            }
        };
        return response.send((0, response_2.httpOk)(messageObject, "Media uploaded"));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_b = error.message) !== null && _b !== void 0 ? _b : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const deleteChat = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _c, _d;
    try {
        const requestedUserID = (_c = request.user) === null || _c === void 0 ? void 0 : _c.id;
        const userID = request.params.id;
        let findQuery = {
            $or: [
                { userID: new mongodb_1.ObjectId(requestedUserID), targetUserID: new mongodb_1.ObjectId(userID) },
                { userID: new mongodb_1.ObjectId(userID), targetUserID: new mongodb_1.ObjectId(requestedUserID) }
            ]
        };
        let updateQuery = {
            $addToSet: { "deletedByID": requestedUserID }
        };
        yield message_model_1.default.updateMany(findQuery, updateQuery);
        return response.send((0, response_2.httpOk)(null, "Chat deleted."));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_d = error.message) !== null && _d !== void 0 ? _d : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
//FIXME Deleted chat will not be exported.
const exportChat = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _e, _f;
    try {
        const requestedUserID = (_e = request.user) === null || _e === void 0 ? void 0 : _e.id;
        const userID = request.params.id;
        const user = yield user_model_1.default.findOne({ userID: userID });
        if (!user) {
            return response.send((0, response_2.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        let findQuery = {
            $or: [
                { userID: new mongodb_1.ObjectId(requestedUserID), targetUserID: new mongodb_1.ObjectId(userID), deletedByID: { $nin: [new mongodb_1.ObjectId(requestedUserID)] } },
                { userID: new mongodb_1.ObjectId(userID), targetUserID: new mongodb_1.ObjectId(requestedUserID), deletedByID: { $nin: [new mongodb_1.ObjectId(requestedUserID)] } }
            ]
        };
        const conversations = yield message_model_1.default.aggregate([
            { $match: findQuery },
            {
                $sort: { createdAt: 1, id: 1 }
            },
            {
                $project: {
                    _id: 0,
                    userID: 1,
                    message: 1,
                    type: 1,
                    link: 1,
                    gift: 1,
                    location: 1,
                    mediaUrl: 1,
                    contact: 1,
                    createdAt: 1,
                }
            }
        ]);
        if (conversations.length === 0) {
            return response.send((0, response_2.httpBadRequest)(error_1.ErrorMessage.invalidRequest("Nothing to export."), "Nothing to export."));
        }
        const hostAddress = request.protocol + "://" + request.get("host");
        let chatWith = "User";
        const data = yield Promise.all(conversations.map((chat) => __awaiter(void 0, void 0, void 0, function* () {
            var _g, _h, _j;
            let name = "User";
            const user = yield user_model_1.default.findOne({ _id: chat.userID });
            if (user && user.accountType === user_model_1.AccountType.BUSINESS && user.businessProfileID) {
                const business = yield businessProfile_model_1.default.findOne({ _id: user.businessProfileID });
                if (business) {
                    name = business.name;
                    if (user.id.toString() !== userID) {
                        chatWith = (_g = user.name) !== null && _g !== void 0 ? _g : user.username;
                    }
                }
            }
            else if (user) {
                name = (_h = user.name) !== null && _h !== void 0 ? _h : user.username;
                if (user.id.toString() !== userID) {
                    chatWith = (_j = user.name) !== null && _j !== void 0 ? _j : user.username;
                }
            }
            const file = [message_model_2.MessageType.VIDEO, message_model_2.MessageType.IMAGE, message_model_2.MessageType.PDF].includes(chat.type);
            const link = chat.mediaUrl;
            return `${(0, moment_1.default)(chat.createdAt).format('ddd DD, MMM YYYY hh:mm:ss A')} ${name}: ${chat.message} ${file ? '(file attached) link::' + link : ''} \n`;
        })));
        const filename = `${(0, uuid_1.v4)()}.txt`;
        const filePath = `${file_uploading_1.PUBLIC_DIR}/chat-exports/${filename}`;
        const chatContent = data.join("");
        fs_1.default.writeFileSync(filePath, chatContent, 'utf8');
        return response.send((0, response_2.httpOk)({
            filename: `Chat with ${chatWith}.txt`,
            filePath: `${hostAddress}/${filePath}`
        }, "Chat exported."));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_f = error.message) !== null && _f !== void 0 ? _f : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
exports.default = { fetchChatByUserID, getChatCount, fetchMessagesByUserID, sendMediaMessage, deleteChat, exportChat };
