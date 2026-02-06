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
exports.lat_lng = void 0;
const response_1 = require("../utils/response");
const error_1 = require("../utils/response-message/error");
const user_model_1 = __importStar(require("../database/models/user.model"));
const post_model_1 = __importStar(require("../database/models/post.model"));
const MediaController_1 = require("./MediaController");
const media_model_1 = __importDefault(require("../database/models/media.model"));
const eventJoin_model_1 = __importDefault(require("../database/models/eventJoin.model"));
const constants_1 = require("../config/constants");
const S3Service_1 = __importDefault(require("../services/S3Service"));
const AppNotificationController_1 = __importDefault(require("./AppNotificationController"));
const notification_model_1 = require("../database/models/notification.model");
const s3Service = new S3Service_1.default();
exports.lat_lng = [20.5937, 78.9629];
const index = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_a = error.message) !== null && _a !== void 0 ? _a : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const store = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    try {
        const { id, accountType, businessProfileID } = request.user;
        const { name, type, venue, streamingLink, description, placeName, lat, lng, startDate, startTime, endDate, endTime } = request.body;
        const files = request.files;
        const images = files && files.images;
        // const videos = files && files.videos as Express.Multer.S3File[];
        const authUser = yield user_model_1.default.findOne({ _id: id });
        if (!authUser) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        /**
         * Content restrictions for business user
         */
        if (authUser.accountType !== user_model_1.AccountType.BUSINESS) {
            return response.send((0, response_1.httpForbidden)(error_1.ErrorMessage.invalidRequest("Access denied: You do not have the necessary permissions to access this API."), "Access denied: You do not have the necessary permissions to access this API."));
        }
        const newPost = new post_model_1.default();
        newPost.postType = post_model_1.PostType.EVENT;
        newPost.userID = id;
        newPost.content = description; // Description for business
        newPost.name = name;
        newPost.venue = venue;
        newPost.streamingLink = streamingLink;
        newPost.startDate = startDate;
        newPost.startTime = startTime;
        newPost.endDate = endDate;
        newPost.endTime = endTime;
        newPost.type = type;
        if (placeName && lat && lng) {
            newPost.location = { placeName, lat, lng };
        }
        else {
            newPost.location = null;
        }
        if (lat && lng) {
            newPost.geoCoordinate = { type: "Point", coordinates: [lng, lat] };
        }
        else if (authUser && authUser.geoCoordinate) {
            newPost.geoCoordinate = authUser.geoCoordinate;
        }
        else {
            newPost.geoCoordinate = { type: "Point", coordinates: exports.lat_lng };
        }
        if (accountType === user_model_1.AccountType.BUSINESS && businessProfileID) {
            newPost.businessProfileID = businessProfileID;
        }
        newPost.tagged = [];
        let mediaIDs = [];
        if (images && images.length !== 0) {
            const [imageList] = yield Promise.all([
                (0, MediaController_1.storeMedia)(images, id, businessProfileID, constants_1.AwsS3AccessEndpoints.POST, 'POST'),
            ]);
            if (imageList && imageList.length !== 0) {
                imageList.map((image) => mediaIDs.push(image.id));
            }
            // CRITICAL: Validate that ALL media documents exist before saving the post
            if (mediaIDs.length > 0) {
                const existingMedia = yield media_model_1.default.find({ _id: { $in: mediaIDs } }).select('_id').lean();
                const existingMediaIDs = existingMedia.map(m => m._id.toString());
                const missingMediaIDs = mediaIDs.filter(id => !existingMediaIDs.includes(id.toString()));
                if (missingMediaIDs.length > 0) {
                    console.error('CRITICAL: Media validation failed - some media documents do not exist:', missingMediaIDs);
                    return response.send((0, response_1.httpInternalServerError)(error_1.ErrorMessage.invalidRequest("Failed to create media. Please try again."), "Media creation failed"));
                }
                if (mediaIDs.length !== existingMedia.length) {
                    console.error('CRITICAL: Media count mismatch. Expected:', mediaIDs.length, 'Found:', existingMedia.length);
                    return response.send((0, response_1.httpInternalServerError)(error_1.ErrorMessage.invalidRequest("Media validation failed. Please try again."), "Media validation failed"));
                }
            }
        }
        newPost.media = mediaIDs;
        newPost.isPublished = true;
        const savedPost = yield newPost.save();
        return response.send((0, response_1.httpCreated)(savedPost, 'Your event is published successfully'));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_b = error.message) !== null && _b !== void 0 ? _b : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const update = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _c, _d;
    try {
        const ID = (_c = request === null || request === void 0 ? void 0 : request.params) === null || _c === void 0 ? void 0 : _c.id;
        const { id, accountType, businessProfileID } = request.user;
        const { name, type, venue, streamingLink, description, placeName, lat, lng, startDate, startTime, endDate, endTime } = request.body;
        const files = request.files;
        const images = files && files.images;
        // const videos = files && files.videos as Express.Multer.S3File[];
        if (!accountType && !id) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        /**
         * Content restrictions for business user
         */
        if (accountType !== user_model_1.AccountType.BUSINESS) {
            return response.send((0, response_1.httpForbidden)(error_1.ErrorMessage.invalidRequest("Access denied: You do not have the necessary permissions to access this API."), "Access denied: You do not have the necessary permissions to access this API."));
        }
        const post = yield post_model_1.default.findOne({ _id: ID });
        if (!post) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest("Event not found"), "Event not found"));
        }
        if (post.userID.toString() !== id) {
            return response.send((0, response_1.httpBadRequest)(error_1.ErrorMessage.invalidRequest("You can't update this post"), "You can't update this post"));
        }
        post.content = description !== null && description !== void 0 ? description : post.content;
        post.name = name !== null && name !== void 0 ? name : post.name;
        post.venue = venue !== null && venue !== void 0 ? venue : post.venue;
        post.streamingLink = streamingLink !== null && streamingLink !== void 0 ? streamingLink : post.streamingLink;
        post.startDate = startDate !== null && startDate !== void 0 ? startDate : post.startDate;
        post.startTime = startTime !== null && startTime !== void 0 ? startTime : post.startTime;
        post.endDate = endDate !== null && endDate !== void 0 ? endDate : post.endDate;
        post.endTime = endTime !== null && endTime !== void 0 ? endTime : post.endTime;
        post.type = type !== null && type !== void 0 ? type : post.type;
        if (placeName && lat && lng) {
            post.location = { placeName, lat, lng };
        }
        if (accountType === user_model_1.AccountType.BUSINESS && businessProfileID) {
            post.businessProfileID = businessProfileID;
        }
        let mediaIDs = [];
        if (images && images.length !== 0) {
            const [imageList] = yield Promise.all([
                (0, MediaController_1.storeMedia)(images, id, businessProfileID, constants_1.AwsS3AccessEndpoints.POST, 'POST'),
            ]);
            if (imageList && imageList.length !== 0) {
                imageList.map((image) => mediaIDs.push(image.id));
                //Remove old event images
                yield Promise.all(post.media.map((mediaID) => __awaiter(void 0, void 0, void 0, function* () {
                    const mediaObject = yield media_model_1.default.findOne({ _id: mediaID });
                    if (mediaObject) {
                        yield Promise.all([
                            s3Service.deleteS3Object(mediaObject.s3Key),
                            s3Service.deleteS3Asset(mediaObject.thumbnailUrl)
                        ]);
                        yield mediaObject.deleteOne();
                    }
                })));
            }
        }
        if (mediaIDs.length !== 0) {
            post.media = mediaIDs;
        }
        const savedPost = yield post.save();
        return response.send((0, response_1.httpAcceptedOrUpdated)(savedPost, 'Your event is published successfully'));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_d = error.message) !== null && _d !== void 0 ? _d : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const destroy = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _e;
    try {
        // return response.send(httpNoContent(null, 'Death code deleted.'));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_e = error.message) !== null && _e !== void 0 ? _e : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const show = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _f;
    try {
        // return response.send(httpOk(null, "Not implemented"));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_f = error.message) !== null && _f !== void 0 ? _f : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const joinEvent = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _g;
    try {
        const { id, accountType } = request.user;
        const { postID } = request.body;
        if (!id) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        const [post, joinedAllReady] = yield Promise.all([
            post_model_1.default.findOne({ _id: postID, postType: post_model_1.PostType.EVENT }),
            eventJoin_model_1.default.findOne({ postID: postID, userID: id }),
        ]);
        if (!post) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.POST_NOT_FOUND), error_1.ErrorMessage.POST_NOT_FOUND));
        }
        if (!joinedAllReady) {
            const eventJoin = new eventJoin_model_1.default();
            eventJoin.userID = id;
            eventJoin.postID = postID;
            const savedEventJoin = yield eventJoin.save();
            AppNotificationController_1.default.store(id, post.userID, notification_model_1.NotificationType.EVENT_JOIN, { postID: post.id, userID: post.userID, postType: post.postType, name: post.name }).catch((error) => console.error(error));
            return response.send((0, response_1.httpCreated)(savedEventJoin, "Your action saved successfully"));
        }
        yield joinedAllReady.deleteOne();
        AppNotificationController_1.default.destroy(id, post.userID, notification_model_1.NotificationType.EVENT_JOIN, { postID: post.id, userID: post.userID, postType: post.postType }).catch((error) => console.error(error));
        return response.send((0, response_1.httpNoContent)(null, 'Your action saved successfully'));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_g = error.message) !== null && _g !== void 0 ? _g : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
exports.default = { index, store, update, destroy, joinEvent };
