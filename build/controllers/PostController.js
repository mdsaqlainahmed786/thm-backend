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
const recentPostCache_1 = require("../utils/recentPostCache");
const story_model_1 = __importDefault(require("../database/models/story.model"));
const response_1 = require("../utils/response");
const error_1 = require("../utils/response-message/error");
const user_model_1 = __importStar(require("../database/models/user.model"));
const subscription_model_1 = require("../database/models/subscription.model");
const post_model_1 = __importStar(require("../database/models/post.model"));
const dailyContentLimit_model_1 = __importDefault(require("../database/models/dailyContentLimit.model"));
const basic_1 = require("../utils/helper/basic");
const MediaController_1 = require("./MediaController");
const media_model_1 = __importStar(require("../database/models/media.model"));
const like_model_1 = __importStar(require("../database/models/like.model"));
const savedPost_model_1 = __importDefault(require("../database/models/savedPost.model"));
const reportedUser_model_1 = __importDefault(require("../database/models/reportedUser.model"));
const common_1 = require("../common");
const comment_model_1 = require("../database/models/comment.model");
const eventJoin_model_1 = __importDefault(require("../database/models/eventJoin.model"));
const constants_1 = require("../config/constants");
const comment_model_2 = __importDefault(require("../database/models/comment.model"));
const S3Service_1 = __importDefault(require("../services/S3Service"));
const AppNotificationController_1 = __importDefault(require("./AppNotificationController"));
const notification_model_1 = __importStar(require("../database/models/notification.model"));
const fileProcessing_model_1 = __importStar(require("../database/models/fileProcessing.model"));
const anonymousUser_model_1 = require("../database/models/anonymousUser.model");
const EventController_1 = require("./EventController");
const feedOrderCache_1 = require("../utils/feedOrderCache");
const s3Service = new S3Service_1.default();
const index = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_a = error.message) !== null && _a !== void 0 ? _a : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const MAX_CONTENT_LENGTH = 20; // Set maximum content length
const MAX_CONTENT_UPLOADS = 2;
const MAX_VIDEO_UPLOADS = 1;
const MAX_IMAGE_UPLOADS = 2;
const store = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    try {
        const { id, accountType, businessProfileID } = request.user;
        const { content, placeName, lat, lng, tagged, feelings } = request.body;
        const files = request.files;
        const mediaFiles = files && files.media;
        const images = (mediaFiles || []).filter((file) => file.mimetype.startsWith('image/'));
        const videos = (mediaFiles || []).filter((file) => file.mimetype.startsWith('video/'));
        if (!id) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        // Validate video file size (100 MB limit)
        const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100 MB in bytes
        if (videos && videos.length > 0) {
            const oversizedVideos = videos.filter((video) => video.size > MAX_VIDEO_SIZE);
            if (oversizedVideos.length > 0) {
                yield (0, MediaController_1.deleteUnwantedFiles)(oversizedVideos);
                yield (0, MediaController_1.deleteUnwantedFiles)(images);
                return response.send((0, response_1.httpBadRequest)(error_1.ErrorMessage.invalidRequest("Video file size must not exceed 100 MB"), "Video file size must not exceed 100 MB"));
            }
        }
        if (!content && (!mediaFiles || mediaFiles.length === 0)) {
            return response.send((0, response_1.httpBadRequest)(error_1.ErrorMessage.invalidRequest("Content is required for creating a post"), 'Content is required for creating a post'));
        }
        const now = new Date();
        const midnightToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const [authUser, haveSubscription, dailyContentLimit] = yield Promise.all([
            user_model_1.default.findOne({ _id: id }).lean(), // lean -> plain object, faster
            (0, subscription_model_1.hasActiveSubscription)(id),
            dailyContentLimit_model_1.default.findOne({ userID: id, timeStamp: midnightToday }).lean() // we use exact midnight key for upserts later
        ]);
        if (!authUser) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        // if (authUser.accountType === AccountType.INDIVIDUAL && !haveSubscription) {
        //   if (!dailyContentLimit && content && countWords(content) > MAX_CONTENT_LENGTH) {
        //     const error = `Content must be a string and cannot exceed ${MAX_CONTENT_LENGTH} words.`;
        //     return response.send(httpBadRequest(ErrorMessage.invalidRequest(error), error));
        //   }
        //   if (!dailyContentLimit && images && images.length > MAX_IMAGE_UPLOADS) {
        //     await deleteUnwantedFiles(images);
        //     await deleteUnwantedFiles(videos);
        //     const error = `You cannot upload multiple images because your current plan does not include this feature.`;
        //     return response.send(httpBadRequest(ErrorMessage.invalidRequest(error), error));
        //   }
        //   if (!dailyContentLimit && videos && videos.length > MAX_VIDEO_UPLOADS) {
        //     await deleteUnwantedFiles(images);
        //     await deleteUnwantedFiles(videos);
        //     const error = `You cannot upload multiple videos because your current plan does not include this feature.`;
        //     return response.send(httpBadRequest(ErrorMessage.invalidRequest(error), error));
        //   }
        //   if (dailyContentLimit && dailyContentLimit.text >= MAX_CONTENT_UPLOADS && content && content !== "") {
        //     const error = `Your daily content upload limit has been exceeded. Please upgrade your account to avoid this error.`;
        //     return response.send(httpBadRequest(ErrorMessage.invalidRequest(error), error));
        //   }
        //   if (dailyContentLimit && typeof dailyContentLimit.images === 'number' && images && images.length >= dailyContentLimit.images) {
        //     await deleteUnwantedFiles(images);
        //     await deleteUnwantedFiles(videos);
        //     const error = `Your daily image upload limit has been exceeded. Please upgrade your account to avoid this error.`;
        //     return response.send(httpBadRequest(ErrorMessage.invalidRequest(error), error));
        //   }
        //   if (dailyContentLimit && typeof dailyContentLimit.videos === 'number' && videos && videos.length >= dailyContentLimit.videos) {
        //     await deleteUnwantedFiles(images);
        //     await deleteUnwantedFiles(videos);
        //     const error = `Your daily video upload limit has been exceeded. Please upgrade your account to avoid this error.`;
        //     return response.send(httpBadRequest(ErrorMessage.invalidRequest(error), error));
        //   }
        // }
        const newPost = new post_model_1.default();
        if (accountType === user_model_1.AccountType.BUSINESS && businessProfileID) {
            newPost.businessProfileID = businessProfileID;
        }
        newPost.postType = post_model_1.PostType.POST;
        newPost.userID = id;
        newPost.isPublished = true;
        newPost.content = content;
        newPost.feelings = feelings !== null && feelings !== void 0 ? feelings : "";
        newPost.tagged = (tagged && (0, basic_1.isArray)(tagged)) ? tagged : [];
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
            newPost.geoCoordinate = { type: "Point", coordinates: EventController_1.lat_lng };
        }
        let mediaIDs = [];
        let createdMediaList = [];
        let savedPost = null;
        try {
            if (mediaFiles && mediaFiles.length !== 0) {
                // storeMedia is potentially the slowest op (S3/network). Keep it sequential to avoid partial posts.
                const mediaList = yield (0, MediaController_1.storeMedia)(mediaFiles, id, businessProfileID, constants_1.AwsS3AccessEndpoints.POST, 'POST');
                if (mediaList && mediaList.length !== 0) {
                    createdMediaList = mediaList; // Store for cleanup if post creation fails
                    mediaIDs = mediaList.map(m => m._id);
                    // CRITICAL: Validate that ALL media documents exist before saving the post
                    // This prevents data integrity issues where posts reference non-existent media
                    const existingMedia = yield media_model_1.default.find({ _id: { $in: mediaIDs } }).select('_id').lean();
                    const existingMediaIDs = existingMedia.map(m => m._id.toString());
                    const missingMediaIDs = mediaIDs.filter(id => !existingMediaIDs.includes(id.toString()));
                    if (missingMediaIDs.length > 0) {
                        console.error('CRITICAL: Media validation failed - some media documents do not exist:', missingMediaIDs);
                        console.error('Post creation aborted to prevent data integrity issues');
                        // Cleanup: Delete orphaned media if validation fails
                        yield Promise.all(createdMediaList.map(m => media_model_1.default.findByIdAndDelete(m._id).catch(() => { })));
                        return response.send((0, response_1.httpInternalServerError)(error_1.ErrorMessage.invalidRequest("Failed to create media. Please try again."), "Media creation failed"));
                    }
                    // Double-check: Ensure we have the same number of media IDs as created
                    if (mediaIDs.length !== existingMedia.length) {
                        console.error('CRITICAL: Media count mismatch. Expected:', mediaIDs.length, 'Found:', existingMedia.length);
                        // Cleanup: Delete orphaned media if count mismatch
                        yield Promise.all(createdMediaList.map(m => media_model_1.default.findByIdAndDelete(m._id).catch(() => { })));
                        return response.send((0, response_1.httpInternalServerError)(error_1.ErrorMessage.invalidRequest("Media validation failed. Please try again."), "Media validation failed"));
                    }
                }
            }
            newPost.media = mediaIDs;
            savedPost = yield newPost.save();
            // If we get here, post was created successfully - no cleanup needed
        }
        catch (postError) {
            // CRITICAL: If post creation fails after media was created, cleanup orphaned media
            if (createdMediaList.length > 0) {
                console.error('CRITICAL: Post creation failed after media was created. Cleaning up orphaned media:', createdMediaList.map(m => m._id));
                yield Promise.all(createdMediaList.map(m => media_model_1.default.findByIdAndDelete(m._id).catch(() => { })));
            }
            throw postError; // Re-throw to be caught by outer try-catch
        }
        try {
            //@ts-ignore
            recentPostCache_1.UserRecentPostCache.set(request.user.id, newPost._id.toString());
            feedOrderCache_1.FeedOrderCache.clear(request.user.id);
        }
        catch (cacheErr) {
            // don't block on cache errors
            console.error('Cache update error:', cacheErr);
        }
        // spawn notifications (non-blocking)
        if (savedPost && savedPost.tagged && savedPost.tagged.length !== 0) {
            savedPost.tagged.forEach((taggedUser) => {
                AppNotificationController_1.default.store(id, taggedUser, notification_model_1.NotificationType.TAGGED, { postID: savedPost.id, userID: taggedUser })
                    .catch((err) => console.error('Tag notification error:', err));
            });
        }
        if (savedPost && !haveSubscription && accountType === user_model_1.AccountType.INDIVIDUAL) {
            const incObj = {
                videos: (videos && videos.length) ? videos.length : 0,
                images: (images && images.length) ? images.length : 0,
                text: (content && content !== "") ? 1 : 0
            };
            // atomic update - creates the day's doc if missing, increments counts
            yield dailyContentLimit_model_1.default.findOneAndUpdate({ userID: id, timeStamp: midnightToday }, {
                $inc: incObj,
                $setOnInsert: {
                    timeStamp: midnightToday,
                    userID: id
                }
            }, { upsert: true, new: true }).exec();
        }
        return response.send((0, response_1.httpCreated)(savedPost, 'Your post has been created successfully'));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_b = error.message) !== null && _b !== void 0 ? _b : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const update = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _c, _d;
    try {
        const postID = (_c = request === null || request === void 0 ? void 0 : request.params) === null || _c === void 0 ? void 0 : _c.id;
        const { id, accountType, businessProfileID } = request.user;
        const { content, placeName, lat, lng, tagged, feelings, deletedMedia } = request.body;
        const files = request.files;
        const mediaFiles = files === null || files === void 0 ? void 0 : files.media;
        const post = yield post_model_1.default.findOne({ _id: postID });
        if (!post) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.POST_NOT_FOUND), error_1.ErrorMessage.POST_NOT_FOUND));
        }
        // Only the owner can update
        if (post.userID.toString() !== id.toString()) {
            return response.send((0, response_1.httpForbidden)(error_1.ErrorMessage.invalidRequest("You can't update this post"), "You can't update this post"));
        }
        // Update simple fields
        if (content)
            post.content = content;
        if (feelings)
            post.feelings = feelings;
        if (placeName && lat && lng)
            post.location = { placeName, lat, lng };
        if (tagged && (0, basic_1.isArray)(tagged))
            post.tagged = tagged;
        // Handle uploaded media
        let mediaIDs = post.media;
        if (mediaFiles === null || mediaFiles === void 0 ? void 0 : mediaFiles.length) {
            const mediaList = yield (0, MediaController_1.storeMedia)(mediaFiles, id, businessProfileID, constants_1.AwsS3AccessEndpoints.POST, "POST");
            mediaList === null || mediaList === void 0 ? void 0 : mediaList.forEach((media) => mediaIDs.push(media._id));
        }
        // ✅ Safely parse deletedMedia (can come as string or array)
        let parsedDeletedMedia = [];
        if (deletedMedia) {
            try {
                parsedDeletedMedia = Array.isArray(deletedMedia)
                    ? deletedMedia
                    : JSON.parse(deletedMedia);
            }
            catch (err) {
                console.error("Invalid deletedMedia format:", deletedMedia);
            }
        }
        // Handle deleted media
        if ((parsedDeletedMedia === null || parsedDeletedMedia === void 0 ? void 0 : parsedDeletedMedia.length) && (mediaIDs === null || mediaIDs === void 0 ? void 0 : mediaIDs.length)) {
            yield Promise.all(parsedDeletedMedia.map((media_id) => __awaiter(void 0, void 0, void 0, function* () {
                const mediaObject = yield media_model_1.default.findById(media_id);
                if (mediaObject) {
                    yield Promise.all([
                        s3Service.deleteS3Object(mediaObject.s3Key),
                        s3Service.deleteS3Asset(mediaObject.thumbnailUrl),
                    ]);
                    yield mediaObject.deleteOne();
                    mediaIDs = mediaIDs.filter((m) => m.toString() !== media_id);
                }
            })));
        }
        post.media = mediaIDs;
        const updatedPost = yield post.save();
        return response.send((0, response_1.httpAcceptedOrUpdated)(updatedPost, "Post updated successfully"));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_d = error.message) !== null && _d !== void 0 ? _d : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
//FIXME  //FIXME remove media, comments , likes and notifications and reviews and many more need to be test
const destroy = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _e, _f;
    try {
        const { id, accountType, businessProfileID } = request.user;
        const ID = (_e = request === null || request === void 0 ? void 0 : request.params) === null || _e === void 0 ? void 0 : _e.id;
        const post = yield post_model_1.default.findOne({ _id: ID });
        if (!post) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.POST_NOT_FOUND), error_1.ErrorMessage.POST_NOT_FOUND));
        }
        if (post.userID.toString() !== id) {
            return response.send((0, response_1.httpForbidden)(error_1.ErrorMessage.invalidRequest('This post cannot be deleted.'), 'This post cannot be deleted.'));
        }
        const mediaIDs = post.media;
        if (mediaIDs.length !== 0) {
            yield Promise.all(mediaIDs && mediaIDs.map((mediaID) => __awaiter(void 0, void 0, void 0, function* () {
                const media = yield media_model_1.default.findOne({ _id: mediaID });
                const fileQueues = yield fileProcessing_model_1.default.findOne({ mediaID: mediaID });
                if (media) {
                    yield s3Service.deleteS3Object(media.s3Key);
                    if (media.thumbnailUrl) {
                        yield s3Service.deleteS3Asset(media.thumbnailUrl);
                    }
                    yield media.deleteOne();
                }
                if (fileQueues && fileQueues.status === fileProcessing_model_1.QueueStatus.COMPLETED) {
                    yield Promise.all(fileQueues.s3Location.map((location) => __awaiter(void 0, void 0, void 0, function* () {
                        yield s3Service.deleteS3Asset(location);
                        return location;
                    })));
                    yield fileQueues.deleteOne();
                }
                return mediaID;
            })));
        }
        const [likes, comments, savedPosts, reportedContent, eventJoins] = yield Promise.all([
            like_model_1.default.deleteMany({ postID: ID }),
            comment_model_2.default.deleteMany({ postID: ID }),
            savedPost_model_1.default.deleteMany({ postID: ID }),
            reportedUser_model_1.default.deleteMany({ contentID: ID, contentType: common_1.ContentType.POST }),
            eventJoin_model_1.default.deleteMany({ postID: ID }),
            notification_model_1.default.deleteMany({ "metadata.postID": post._id })
        ]);
        console.log('likes', likes);
        console.log('comments', comments);
        console.log('savedPosts', savedPosts);
        console.log('reportedContent', reportedContent);
        console.log('eventJoins', eventJoins);
        yield post.deleteOne();
        return response.send((0, response_1.httpNoContent)(null, 'Post deleted'));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_f = error.message) !== null && _f !== void 0 ? _f : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const deletePost = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _g, _h;
    try {
        const { id } = request.user;
        const postID = (_g = request === null || request === void 0 ? void 0 : request.params) === null || _g === void 0 ? void 0 : _g.id;
        const post = yield post_model_1.default.findById(postID);
        if (!post) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.POST_NOT_FOUND), error_1.ErrorMessage.POST_NOT_FOUND));
        }
        if (post.userID.toString() !== id.toString()) {
            return response.send((0, response_1.httpForbidden)(error_1.ErrorMessage.invalidRequest("This post cannot be deleted."), "This post cannot be deleted."));
        }
        post.isDeleted = true;
        yield Promise.all([
            post.save(),
            notification_model_1.default.updateMany({ "metadata.postID": post._id }, { isDeleted: true }),
        ]);
        return response.send((0, response_1.httpNoContent)(null, "Post deleted successfully (soft delete)"));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_h = error.message) !== null && _h !== void 0 ? _h : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const show = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _j, _k;
    try {
        const postID = (_j = request === null || request === void 0 ? void 0 : request.params) === null || _j === void 0 ? void 0 : _j.id;
        const { id } = request.user;
        if (!id) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        const [likedByMe, savedByMe, joiningEvents] = yield Promise.all([
            like_model_1.default.distinct('postID', { userID: id, postID: { $ne: null } }),
            (0, post_model_1.getSavedPost)(id),
            eventJoin_model_1.default.distinct('postID', { userID: id, postID: { $ne: null } }),
        ]);
        const post = yield post_model_1.default.aggregate([
            {
                $match: { _id: new mongodb_1.ObjectId(postID) }
            },
            (0, post_model_1.addMediaInPost)().lookup,
            (0, post_model_1.addMediaInPost)().sort_media,
            (0, post_model_1.addTaggedPeopleInPost)().lookup,
            {
                '$lookup': {
                    'from': 'users',
                    'let': { 'userID': '$userID' },
                    'pipeline': [
                        { '$match': { '$expr': { '$eq': ['$_id', '$$userID'] } } },
                        (0, user_model_1.addBusinessProfileInUser)().lookup,
                        (0, user_model_1.addBusinessProfileInUser)().unwindLookup,
                        (0, user_model_1.addBusinessSubTypeInBusinessProfile)().lookup,
                        (0, user_model_1.addBusinessSubTypeInBusinessProfile)().unwindLookup,
                        {
                            '$project': {
                                "name": 1,
                                "profilePic": 1,
                                "accountType": 1,
                                "businessProfileID": 1,
                                "businessProfileRef._id": 1,
                                "businessProfileRef.name": 1,
                                "businessProfileRef.profilePic": 1,
                                "businessProfileRef.rating": 1,
                                "businessProfileRef.businessTypeRef": 1,
                                "businessProfileRef.businessSubtypeRef": 1,
                                "businessProfileRef.address": 1,
                            }
                        }
                    ],
                    'as': 'postedBy'
                }
            },
            {
                '$unwind': {
                    'path': '$postedBy',
                    'preserveNullAndEmptyArrays': true //false value does not fetch relationship.
                }
            },
            (0, anonymousUser_model_1.addAnonymousUserInPost)().lookup,
            (0, anonymousUser_model_1.addAnonymousUserInPost)().unwindLookup,
            (0, post_model_1.addPostedByInPost)().unwindLookup,
            (0, like_model_1.addLikesInPost)().lookup,
            (0, like_model_1.addLikesInPost)().addLikeCount,
            (0, comment_model_1.addCommentsInPost)().lookup,
            (0, comment_model_1.addCommentsInPost)().addCommentCount,
            (0, comment_model_1.addSharedCountInPost)().lookup,
            (0, comment_model_1.addSharedCountInPost)().addSharedCount,
            (0, post_model_1.addReviewedBusinessProfileInPost)().lookup,
            (0, post_model_1.addReviewedBusinessProfileInPost)().unwindLookup,
            (0, post_model_1.addGoogleReviewedBusinessProfileInPost)().lookup,
            (0, post_model_1.addGoogleReviewedBusinessProfileInPost)().unwindLookup,
            (0, post_model_1.isLikedByMe)(likedByMe),
            (0, post_model_1.isSavedByMe)(savedByMe),
            (0, post_model_1.imJoining)(joiningEvents),
            (0, post_model_1.addInterestedPeopleInPost)().lookup,
            (0, post_model_1.addInterestedPeopleInPost)().addInterestedCount,
            {
                $addFields: {
                    reviewedBusinessProfileRef: {
                        $cond: {
                            if: { $eq: [{ $ifNull: ["$reviewedBusinessProfileRef", null] }, null] }, // Check if field is null or doesn't exist
                            then: "$googleReviewedBusinessRef", // Replace with googleReviewedBusinessRef
                            else: "$reviewedBusinessProfileRef" // Keep the existing value if it exists
                        }
                    },
                    postedBy: {
                        $cond: {
                            if: { $eq: [{ $ifNull: ["$postedBy", null] }, null] }, // Check if field is null or doesn't exist
                            then: "$publicPostedBy", // Replace with publicPostedBy
                            else: "$postedBy" // Keep the existing value if it exists
                        }
                    }
                }
            },
            {
                $sort: { createdAt: -1, id: 1 }
            },
            {
                $limit: 1,
            },
            {
                $addFields: {
                    eventJoinsRef: { $slice: ["$eventJoinsRef", 7] },
                }
            },
            {
                $unset: [
                    "geoCoordinate",
                    "publicPostedBy",
                    "googleReviewedBusinessRef",
                    "reviews",
                    "isPublished",
                    "sharedRef",
                    "commentsRef",
                    "likesRef",
                    "tagged",
                    "media",
                    "updatedAt",
                    "__v"
                ]
            }
        ]).exec();
        if (post.length === 0) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.POST_NOT_FOUND), error_1.ErrorMessage.POST_NOT_FOUND));
        }
        return response.send((0, response_1.httpOk)(post[0], "Post Fetched"));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_k = error.message) !== null && _k !== void 0 ? _k : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const storeViews = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _l;
    try {
        const { postIDs } = request.body;
        if (postIDs && (0, basic_1.isArray)(postIDs)) {
            yield Promise.all(postIDs && postIDs.map((postID) => __awaiter(void 0, void 0, void 0, function* () {
                const post = yield post_model_1.default.findOne({ _id: postID });
                if (post) {
                    post.views = post.views ? post.views + 1 : 1;
                    yield post.save();
                }
                return postID;
            })));
            return response.send((0, response_1.httpOk)(null, "Post views saved successfully."));
        }
        else {
            return response.send((0, response_1.httpBadRequest)(error_1.ErrorMessage.invalidRequest("Invalid post id array."), "Invalid post id array."));
        }
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_l = error.message) !== null && _l !== void 0 ? _l : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const publishPostAsStory = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _m;
    try {
        const { id, accountType, businessProfileID } = request.user;
        const { id: postID } = request.params;
        if (!id) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        const post = yield post_model_1.default.findOne({ _id: new mongodb_1.ObjectId(postID) });
        if (!post) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.POST_NOT_FOUND), error_1.ErrorMessage.POST_NOT_FOUND));
        }
        if (post.userID.toString() === id.toString()) {
            return response.send((0, response_1.httpBadRequest)(error_1.ErrorMessage.invalidRequest("You cannot share your own post as a story."), "You cannot share your own post as a story."));
        }
        // const myFollowingIDs = await fetchUserFollowing(id); // returns IDs I follow
        // const isFollowing = myFollowingIDs.some(f => f.toString() === post.userID.toString());
        // if (!isFollowing) {
        //   return response.send(
        //     httpForbidden(
        //       ErrorMessage.invalidRequest("You can only share media from users you follow."),
        //       "You can only share media from users you follow."
        //     )
        //   );
        // }
        if (!post.media || post.media.length === 0) {
            return response.send((0, response_1.httpBadRequest)(error_1.ErrorMessage.invalidRequest("This post has no media to publish as a story."), "This post has no media to publish as a story."));
        }
        // Fetch all media to filter by type (images and videos only)
        const allMedia = yield media_model_1.default.find({
            _id: { $in: post.media },
            mediaType: { $in: [media_model_1.MediaType.IMAGE, media_model_1.MediaType.VIDEO] }
        });
        if (allMedia.length === 0) {
            return response.send((0, response_1.httpBadRequest)(error_1.ErrorMessage.invalidRequest("This post has no images or videos to publish as a story."), "This post has no images or videos to publish as a story."));
        }
        const mediaIDs = allMedia.map(m => m._id);
        const existingStories = yield story_model_1.default.find({
            userID: id,
            mediaID: { $in: mediaIDs },
            timeStamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });
        const existingMediaIDs = new Set(existingStories.map(s => s.mediaID.toString()));
        const newMedia = allMedia.filter((media) => !existingMediaIDs.has(media._id.toString()));
        if (newMedia.length === 0) {
            return response.send((0, response_1.httpBadRequest)(error_1.ErrorMessage.invalidRequest("This post has already been shared as a story."), "This post has already been shared as a story."));
        }
        const storyPromises = newMedia.map((media) => __awaiter(void 0, void 0, void 0, function* () {
            const newStory = new story_model_1.default();
            newStory.userID = id;
            newStory.mediaID = media._id;
            newStory.duration = media.duration || 10;
            newStory.postID = post._id; // optional, helps trace which post story came from (cast to any to satisfy TS)
            if (accountType === user_model_1.AccountType.BUSINESS && businessProfileID) {
                newStory.businessProfileID = businessProfileID;
            }
            return newStory.save();
        }));
        const createdStories = (yield Promise.all(storyPromises)).filter(Boolean);
        if (createdStories.length === 0) {
            return response.send((0, response_1.httpBadRequest)(error_1.ErrorMessage.invalidRequest("No valid new media found to publish as story."), "No valid new media found to publish as story."));
        }
        return response.send((0, response_1.httpCreated)(createdStories, "Post published as story successfully."));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_m = error.message) !== null && _m !== void 0 ? _m : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
exports.default = { index, store, update, destroy, deletePost, show, storeViews, publishPostAsStory };
