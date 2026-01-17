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
const userConnection_model_1 = require("./../database/models/userConnection.model");
const mongodb_1 = require("mongodb");
const response_1 = require("../utils/response");
const error_1 = require("../utils/response-message/error");
const user_model_1 = require("../database/models/user.model");
const MediaController_1 = require("./MediaController");
const media_model_1 = __importDefault(require("../database/models/media.model"));
const story_model_1 = __importStar(require("../database/models/story.model"));
const basic_1 = require("../utils/helper/basic");
const user_model_2 = __importDefault(require("../database/models/user.model"));
const like_model_1 = __importStar(require("../database/models/like.model"));
const view_model_1 = __importStar(require("../database/models/view.model."));
const S3Service_1 = __importDefault(require("../services/S3Service"));
const constants_1 = require("../config/constants");
const notification_model_1 = __importStar(require("../database/models/notification.model"));
const s3Service = new S3Service_1.default();
//FIXME Remove likes and view views
const index = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id, accountType, businessProfileID } = request.user;
        let { pageNumber, documentLimit, } = request.query;
        if (!accountType && !id) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        pageNumber = (0, basic_1.parseQueryParam)(pageNumber, 1);
        documentLimit = (0, basic_1.parseQueryParam)(documentLimit, 20);
        //Fetch following stories 
        const myFollowingIDs = yield (0, userConnection_model_1.fetchUserFollowing)(id);
        const [myStories, likedByMe, userIDs, viewedStories] = yield Promise.all([
            story_model_1.default.aggregate([
                {
                    $match: { userID: new mongodb_1.ObjectId(id), timeStamp: { $gte: story_model_1.storyTimeStamp } }
                },
                (0, story_model_1.addMediaInStory)().lookup,
                (0, story_model_1.addMediaInStory)().unwindLookup,
                (0, story_model_1.addMediaInStory)().replaceRootAndMergeObjects,
                (0, story_model_1.addMediaInStory)().project,
                (0, story_model_1.addTaggedUsersInStory)().addFieldsBeforeUnwind,
                (0, story_model_1.addTaggedUsersInStory)().unwind,
                (0, story_model_1.addTaggedUsersInStory)().lookup,
                (0, story_model_1.addTaggedUsersInStory)().addFields,
                (0, story_model_1.addTaggedUsersInStory)().group,
                (0, story_model_1.addTaggedUsersInStory)().replaceRoot,
                {
                    '$lookup': {
                        'from': 'likes',
                        'let': { 'storyID': '$_id' },
                        'pipeline': [
                            { '$match': { '$expr': { '$eq': ['$storyID', '$$storyID'] } } },
                            (0, like_model_1.addUserInLike)().lookup,
                            (0, like_model_1.addUserInLike)().unwindLookup,
                            (0, like_model_1.addUserInLike)().replaceRoot,
                        ],
                        'as': 'likesRef'
                    }
                },
                {
                    $addFields: {
                        likes: { $cond: { if: { $isArray: "$likesRef" }, then: { $size: "$likesRef" }, else: 0 } }
                    }
                },
                {
                    $addFields: {
                        likesRef: { $slice: ["$likesRef", 4] },
                    }
                },
                {
                    $lookup: {
                        from: 'views',
                        let: { storyID: '$_id' },
                        pipeline: [
                            { $match: { $expr: { $eq: ['$storyID', '$$storyID'] } } },
                            (0, view_model_1.addUserInView)().lookup,
                            (0, view_model_1.addUserInView)().unwindLookup,
                            (0, view_model_1.addUserInView)().replaceRoot,
                        ],
                        as: 'viewsRef'
                    }
                },
                {
                    $addFields: {
                        views: { $cond: { if: { $isArray: "$viewsRef" }, then: { $size: "$viewsRef" }, else: 0 } }
                    }
                },
                {
                    $addFields: {
                        viewsRef: { $slice: ["$viewsRef", 4] },
                    }
                },
                {
                    $sort: { createdAt: -1, id: 1 }
                }
            ]).exec(),
            like_model_1.default.distinct('storyID', { userID: id, }),
            story_model_1.default.distinct('userID', {
                $and: [
                    { timeStamp: { $gte: story_model_1.storyTimeStamp }, userID: { $in: myFollowingIDs }, },
                    { timeStamp: { $gte: story_model_1.storyTimeStamp }, userID: { $nin: [new mongodb_1.ObjectId(id)] }, }
                ]
            }),
            view_model_1.default.distinct('storyID', { userID: id, createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } })
        ]);
        const dbQuery = { _id: { $in: userIDs } };
        const [documents, totalDocument] = yield Promise.all([
            user_model_2.default.aggregate([
                {
                    $match: dbQuery
                },
                (0, user_model_1.addBusinessProfileInUser)().lookup,
                (0, user_model_1.addBusinessProfileInUser)().unwindLookup,
                (0, user_model_1.addStoriesInUser)(likedByMe, viewedStories).lookup,
                {
                    $addFields: {
                        seenByMe: {
                            $cond: {
                                if: {
                                    $eq: [
                                        {
                                            $size: {
                                                $filter: {
                                                    input: "$storiesRef",
                                                    as: "story",
                                                    cond: { $eq: ["$$story.seenByMe", true] }
                                                }
                                            }
                                        },
                                        { $size: "$storiesRef" }
                                    ]
                                },
                                then: true, // Return true if all items have seenByMe as true
                                else: false // Otherwise return false
                            }
                        },
                        seenCount: {
                            $size: {
                                $filter: {
                                    input: "$storiesRef",
                                    as: "story",
                                    cond: { $eq: ["$$story.seenByMe", true] }
                                }
                            }
                        }
                    }
                },
                {
                    $sort: { createdAt: -1, id: 1 }
                },
                {
                    $sort: { seenCount: 1 } //Sort viewed stories 
                },
                {
                    $skip: pageNumber > 0 ? ((pageNumber - 1) * documentLimit) : 0
                },
                {
                    $limit: documentLimit
                },
                {
                    $project: {
                        "name": 1,
                        "username": 1,
                        "accountType": 1,
                        "profilePic": 1,
                        'businessProfileRef._id': 1,
                        'businessProfileRef.name': 1,
                        'businessProfileRef.username': 1,
                        'businessProfileRef.profilePic': 1,
                        'storiesRef': 1,
                        'seenByMe': 1,
                        // 'seenCount': 1
                    }
                }
            ]).exec(),
            user_model_2.default.find(dbQuery).countDocuments()
        ]);
        const totalPagesCount = Math.ceil(totalDocument / documentLimit) || 1;
        const responseData = {
            myStories: myStories,
            stories: documents,
        };
        return response.send((0, response_1.httpOkExtended)(responseData, 'Stories fetched.', pageNumber, totalPagesCount, totalDocument));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_a = error.message) !== null && _a !== void 0 ? _a : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const store = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    try {
        const { id, accountType, businessProfileID } = request.user;
        const { content, placeName, lat, lng, userTagged, userTaggedId, userTaggedPositionX, userTaggedPositionY, feelings, locationPositionX, locationPositionY } = request.body;
        const files = request.files;
        const images = files && files.images;
        const videos = files && files.videos;
        if (!accountType && !id) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        if (!images && !videos) {
            return response.send((0, response_1.httpBadRequest)(error_1.ErrorMessage.invalidRequest("Media is required for creating a story"), 'Media is required for creating a story'));
        }
        /**
         * Portrait (4:5): 1080 x 1350 px
            Square (1:1): 1080 x 1080 px
            Landscape (1.91:1): 1080 x 566 px
         * Handle story media
         */
        let mediaIDs = '';
        let duration = 10;
        if (videos && videos.length !== 0 || images && images.length !== 0) {
            const [videoList, imageList] = yield Promise.all([
                (0, MediaController_1.storeMedia)(videos, id, businessProfileID, constants_1.AwsS3AccessEndpoints.STORY, 'STORY'),
                (0, MediaController_1.storeMedia)(images, id, businessProfileID, constants_1.AwsS3AccessEndpoints.STORY, 'STORY'),
            ]);
            if (imageList && imageList.length !== 0) {
                imageList.map((image) => {
                    mediaIDs = image.id;
                });
            }
            if (videoList && videoList.length !== 0) {
                videoList.map((video) => {
                    mediaIDs = video.id;
                    duration = video.duration;
                });
            }
        }
        const newStory = new story_model_1.default();
        if (accountType === user_model_1.AccountType.BUSINESS && businessProfileID) {
            newStory.businessProfileID = businessProfileID;
        }
        newStory.duration = duration;
        newStory.userID = id;
        newStory.mediaID = mediaIDs;
        // Set location position coordinates if provided
        if (locationPositionX !== undefined) {
            newStory.locationPositionX = typeof locationPositionX === 'string' ? parseFloat(locationPositionX) : locationPositionX;
        }
        if (locationPositionY !== undefined) {
            newStory.locationPositionY = typeof locationPositionY === 'string' ? parseFloat(locationPositionY) : locationPositionY;
        }
        // Set location only if all location fields are provided
        if (placeName && lat && lng) {
            newStory.location = {
                placeName,
                lat: typeof lat === 'string' ? parseFloat(lat) : lat,
                lng: typeof lng === 'string' ? parseFloat(lng) : lng
            };
        }
        // Handle single user tagging with position coordinates
        if (userTaggedId) {
            newStory.userTaggedId = userTaggedId;
            if (userTagged) {
                newStory.userTagged = userTagged;
            }
            if (userTaggedPositionX !== undefined) {
                newStory.userTaggedPositionX = typeof userTaggedPositionX === 'string' ? parseFloat(userTaggedPositionX) : userTaggedPositionX;
            }
            if (userTaggedPositionY !== undefined) {
                newStory.userTaggedPositionY = typeof userTaggedPositionY === 'string' ? parseFloat(userTaggedPositionY) : userTaggedPositionY;
            }
        }
        else if (userTagged) {
            // If only username is provided without ID, still save it
            newStory.userTagged = userTagged;
            if (userTaggedPositionX !== undefined) {
                newStory.userTaggedPositionX = typeof userTaggedPositionX === 'string' ? parseFloat(userTaggedPositionX) : userTaggedPositionX;
            }
            if (userTaggedPositionY !== undefined) {
                newStory.userTaggedPositionY = typeof userTaggedPositionY === 'string' ? parseFloat(userTaggedPositionY) : userTaggedPositionY;
            }
        }
        const savedStory = yield newStory.save();
        return response.send((0, response_1.httpCreated)(savedStory.toObject(), 'Your story has been created successfully'));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_b = error.message) !== null && _b !== void 0 ? _b : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const update = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _c;
    try {
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_c = error.message) !== null && _c !== void 0 ? _c : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
/**
 * Checks if an S3 key is still referenced by other Media documents
 * This prevents deletion of shared S3 files when one Media document is deleted
 * @param s3Key - The S3 key to check
 * @param excludeMediaID - Media ID to exclude from the check (the one being deleted)
 * @returns true if the S3 key is still in use by other Media documents, false otherwise
 */
function isS3KeyStillReferenced(s3Key, excludeMediaID) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!s3Key)
            return false;
        // Check if there are other Media documents with the same s3Key (excluding the one being deleted)
        // If other Media documents exist with the same key, the S3 file is shared and should not be deleted
        const otherMediaWithSameKey = yield media_model_1.default.findOne({
            s3Key: s3Key,
            _id: { $ne: excludeMediaID }
        });
        return !!otherMediaWithSameKey;
    });
}
const destroy = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _d;
    try {
        const { id, accountType, businessProfileID } = request.user;
        const ID = request.params.id;
        const story = yield story_model_1.default.findOne({ _id: ID, userID: id });
        if (!story) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest("Story not found."), "Story not found."));
        }
        const media = yield media_model_1.default.findOne({ _id: story.mediaID });
        if (media) {
            // Check if the S3 key is still referenced by other Media documents
            const s3KeyStillInUse = yield isS3KeyStillReferenced(media.s3Key || '', media._id);
            // Prepare deletion tasks
            const deletionTasks = [
                media.deleteOne(),
                like_model_1.default.deleteMany({ storyID: story._id }),
                view_model_1.default.deleteMany({ storyID: story._id }),
                notification_model_1.default.deleteMany({ type: notification_model_1.NotificationType.LIKE_A_STORY, "metadata.storyID": story._id })
            ];
            // Only delete S3 files if they're not still in use by other Media documents
            if (media.s3Key && !s3KeyStillInUse) {
                deletionTasks.push(s3Service.deleteS3Object(media.s3Key), s3Service.deleteS3Asset(media.thumbnailUrl));
            }
            yield Promise.all(deletionTasks);
        }
        yield story.deleteOne();
        return response.send((0, response_1.httpNoContent)(null, 'Story removed.'));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_d = error.message) !== null && _d !== void 0 ? _d : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const show = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _e;
    try {
        // return response.send(httpOk(null, "Not implemented"));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_e = error.message) !== null && _e !== void 0 ? _e : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const storeViews = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _f, _g;
    try {
        const { id, accountType, businessProfileID } = request.user;
        const ID = request.params.id;
        const [story, isViewed] = yield Promise.all([
            story_model_1.default.findOne({ _id: ID, }),
            view_model_1.default.findOne({ storyID: ID, userID: id }),
        ]);
        if (!story) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest("Story not found."), "Story not found."));
        }
        if (((_f = story.userID) === null || _f === void 0 ? void 0 : _f.toString()) === id.toString()) {
            return response.send((0, response_1.httpBadRequest)(error_1.ErrorMessage.invalidRequest("You are not allowed to increase views on your own story."), "You are not allowed to increase views on your own story."));
        }
        if (!isViewed) {
            const newView = new view_model_1.default();
            newView.userID = id;
            newView.storyID = story.id;
            newView.businessProfileID = businessProfileID !== null && businessProfileID !== void 0 ? businessProfileID : null;
            const savedView = yield newView.save();
            return response.send((0, response_1.httpCreated)(savedView, "View saved successfully"));
        }
        return response.send((0, response_1.httpNoContent)(isViewed, 'View saved successfully'));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_g = error.message) !== null && _g !== void 0 ? _g : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const storyLikes = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _h;
    try {
        const { id, accountType, businessProfileID } = request.user;
        let { pageNumber, documentLimit, } = request.query;
        const ID = request.params.id;
        pageNumber = (0, basic_1.parseQueryParam)(pageNumber, 1);
        documentLimit = (0, basic_1.parseQueryParam)(documentLimit, 20);
        if (!accountType && !id) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        const story = yield story_model_1.default.findOne({ _id: ID, userID: id });
        if (!story) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest("Story not found."), "Story not found."));
        }
        let dbQuery = { storyID: story._id };
        const [documents, totalDocument] = yield Promise.all([
            like_model_1.default.aggregate([
                {
                    $match: dbQuery
                },
                (0, like_model_1.addUserInLike)().lookup,
                (0, like_model_1.addUserInLike)().unwindLookup,
                (0, like_model_1.addUserInLike)().replaceRoot,
                {
                    $sort: { createdAt: -1, id: 1 }
                },
                {
                    $skip: pageNumber > 0 ? ((pageNumber - 1) * documentLimit) : 0
                },
                {
                    $limit: documentLimit
                },
            ]).exec(),
            like_model_1.default.find(dbQuery).countDocuments()
        ]);
        const totalPagesCount = Math.ceil(totalDocument / documentLimit) || 1;
        return response.send((0, response_1.httpOkExtended)(documents, 'Likes fetched.', pageNumber, totalPagesCount, totalDocument));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_h = error.message) !== null && _h !== void 0 ? _h : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const storyViews = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _j;
    try {
        const { id, accountType, businessProfileID } = request.user;
        let { pageNumber, documentLimit, } = request.query;
        const ID = request.params.id;
        pageNumber = (0, basic_1.parseQueryParam)(pageNumber, 1);
        documentLimit = (0, basic_1.parseQueryParam)(documentLimit, 20);
        if (!accountType && !id) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        const story = yield story_model_1.default.findOne({ _id: ID, userID: id });
        if (!story) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest("Story not found."), "Story not found."));
        }
        let dbQuery = { storyID: story._id };
        const [documents, totalDocument] = yield Promise.all([
            view_model_1.default.aggregate([
                {
                    $match: dbQuery
                },
                (0, like_model_1.addUserInLike)().lookup,
                (0, like_model_1.addUserInLike)().unwindLookup,
                (0, like_model_1.addUserInLike)().replaceRoot,
                {
                    $sort: { createdAt: -1, id: 1 }
                },
                {
                    $skip: pageNumber > 0 ? ((pageNumber - 1) * documentLimit) : 0
                },
                {
                    $limit: documentLimit
                },
            ]).exec(),
            view_model_1.default.find(dbQuery).countDocuments()
        ]);
        const totalPagesCount = Math.ceil(totalDocument / documentLimit) || 1;
        return response.send((0, response_1.httpOkExtended)(documents, 'Likes fetched.', pageNumber, totalPagesCount, totalDocument));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_j = error.message) !== null && _j !== void 0 ? _j : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
exports.default = { index, store, update, destroy, storeViews, storyLikes, storyViews };
