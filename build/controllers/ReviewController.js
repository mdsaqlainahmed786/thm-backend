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
const response_1 = require("../utils/response");
const error_1 = require("../utils/response-message/error");
const user_model_1 = require("../database/models/user.model");
const subscription_model_1 = require("../database/models/subscription.model");
const post_model_1 = __importStar(require("../database/models/post.model"));
const dailyContentLimit_model_1 = __importDefault(require("../database/models/dailyContentLimit.model"));
const businessReviewQuestion_model_1 = __importDefault(require("../database/models/businessReviewQuestion.model"));
const user_model_2 = __importDefault(require("../database/models/user.model"));
const businessProfile_model_1 = __importDefault(require("../database/models/businessProfile.model"));
const EncryptionService_1 = __importDefault(require("../services/EncryptionService"));
const appDeviceConfig_model_1 = __importDefault(require("../database/models/appDeviceConfig.model"));
const uuid_1 = require("uuid");
const FirebaseNotificationController_1 = require("../notification/FirebaseNotificationController");
const notification_model_1 = require("../database/models/notification.model");
const MediaController_1 = require("./MediaController");
const constants_1 = require("../config/constants");
const anonymousUser_model_1 = __importDefault(require("../database/models/anonymousUser.model"));
const AuthController_1 = require("./auth/AuthController");
const basic_1 = require("../utils/helper/basic");
const EventController_1 = require("./EventController");
const encryptionService = new EncryptionService_1.default();
const index = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_a = error.message) !== null && _a !== void 0 ? _a : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const MAXIMUM_REVIEWS_PER_DAY = 1;
const store = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    try {
        const { id, accountType } = request.user;
        const { content, businessProfileID, placeID, reviews, anonymousUserID } = request.body;
        const authUser = yield user_model_2.default.findOne({ _id: id });
        if (!authUser) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        if (content === undefined || content === "") {
            return response.send((0, response_1.httpBadRequest)(error_1.ErrorMessage.invalidRequest("Content is required field"), "Content is required field"));
        }
        if (reviews === undefined || reviews === "") {
            return response.send((0, response_1.httpBadRequest)(error_1.ErrorMessage.invalidRequest("Reviews is required field"), "Reviews is required field"));
        }
        if (placeID === undefined || placeID === "") {
            return response.send((0, response_1.httpBadRequest)(error_1.ErrorMessage.invalidRequest("PlaceID is required field"), "PlaceID is required field"));
        }
        if (!businessProfileID) {
            if (anonymousUserID === undefined || anonymousUserID === "") {
                return response.send((0, response_1.httpBadRequest)(error_1.ErrorMessage.invalidRequest("Business profile id is required field"), "Business profile id is required field"));
            }
        }
        /**
         * Content restrictions for business user
         */
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));
        const [haveSubscription, dailyContentLimit] = yield Promise.all([
            (0, subscription_model_1.hasActiveSubscription)(id),
            dailyContentLimit_model_1.default.findOne({
                userID: id, timeStamp: {
                    $gte: startOfDay,
                    $lt: endOfDay
                }
            })
        ]);
        if (authUser.accountType === user_model_1.AccountType.INDIVIDUAL) {
            // if (!haveSubscription) {
            if (dailyContentLimit && dailyContentLimit.reviews >= MAXIMUM_REVIEWS_PER_DAY && content && content !== "") {
                const error = `You cannot post more reviews today. You've reached your daily limit.`;
                return response.send((0, response_1.httpBadRequest)(error_1.ErrorMessage.invalidRequest(error), error));
            }
            // }
        }
        else {
            return response.send((0, response_1.httpForbidden)(error_1.ErrorMessage.invalidRequest("Access denied: You do not have the necessary permissions to access this API."), "Access denied: You do not have the necessary permissions to access this API."));
        }
        let validateReviewJSON = [];
        yield Promise.all(reviews.map((reviewString) => __awaiter(void 0, void 0, void 0, function* () {
            const review = JSON.parse(reviewString);
            if (review.questionID !== "not-indexed") {
                const question = yield businessReviewQuestion_model_1.default.findOne({ _id: review.questionID });
                if (question && (review === null || review === void 0 ? void 0 : review.questionID) !== undefined && (review === null || review === void 0 ? void 0 : review.rating) !== undefined) {
                    validateReviewJSON.push({ questionID: review.questionID, rating: review.rating });
                }
            }
            else {
                if ((review === null || review === void 0 ? void 0 : review.questionID) !== undefined && (review === null || review === void 0 ? void 0 : review.rating) !== undefined) {
                    validateReviewJSON.push({ questionID: review.questionID, rating: review.rating });
                }
            }
            return review;
        })));
        const totalRating = validateReviewJSON.reduce((total, item) => total + item.rating, 0);
        const rating = totalRating / validateReviewJSON.length;
        //remove reviews 
        const hasNotIndexed = validateReviewJSON.some(item => item.questionID === "not-indexed");
        if (hasNotIndexed) {
            validateReviewJSON = [];
        }
        /**
        * Handle review media
        */
        const files = request.files;
        const images = files && files.images;
        const videos = files && files.videos;
        let mediaIDs = [];
        if (videos && videos.length !== 0 || images && images.length !== 0) {
            const [videoList, imageList] = yield Promise.all([
                (0, MediaController_1.storeMedia)(videos, id, businessProfileID ? businessProfileID : null, constants_1.AwsS3AccessEndpoints.REVIEW, 'POST'),
                (0, MediaController_1.storeMedia)(images, id, businessProfileID ? businessProfileID : null, constants_1.AwsS3AccessEndpoints.REVIEW, 'POST'),
            ]);
            if (imageList && imageList.length !== 0) {
                imageList.map((image) => mediaIDs.push(image.id));
            }
            if (videoList && videoList.length !== 0) {
                videoList.map((video) => mediaIDs.push(video.id));
            }
        }
        //IF business profile id is 
        const finalRating = Number.isNaN(rating) ? 0 : parseInt(`${rating}`);
        const newPost = new post_model_1.default();
        newPost.postType = post_model_1.PostType.REVIEW;
        newPost.userID = id;
        newPost.content = content; // Review for business
        if (businessProfileID !== undefined && businessProfileID !== "") {
            newPost.reviewedBusinessProfileID = businessProfileID;
            sendReviewNotification(businessProfileID, authUser.name, finalRating, content);
        }
        else {
            newPost.googleReviewedBusiness = anonymousUserID;
        }
        newPost.isPublished = true;
        newPost.location = null;
        if (authUser && authUser.geoCoordinate) {
            newPost.geoCoordinate = authUser.geoCoordinate;
        }
        else {
            newPost.geoCoordinate = { type: "Point", coordinates: EventController_1.lat_lng };
        }
        newPost.tagged = [];
        newPost.media = mediaIDs;
        newPost.placeID = placeID !== null && placeID !== void 0 ? placeID : "";
        newPost.reviews = validateReviewJSON;
        newPost.rating = finalRating;
        const savedPost = yield newPost.save();
        if (!haveSubscription && accountType === user_model_1.AccountType.INDIVIDUAL) {
            if (!dailyContentLimit) {
                const today = new Date();
                const midnightToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
                const newDailyContentLimit = new dailyContentLimit_model_1.default();
                newDailyContentLimit.timeStamp = midnightToday;
                newDailyContentLimit.userID = id;
                newDailyContentLimit.videos = 0;
                newDailyContentLimit.images = 0;
                newDailyContentLimit.text = 0;
                newDailyContentLimit.reviews = 1;
                yield newDailyContentLimit.save();
            }
            else {
                dailyContentLimit.reviews = dailyContentLimit.reviews + 1;
                yield dailyContentLimit.save();
            }
        }
        return response.send((0, response_1.httpCreated)(savedPost, 'Your review is published successfully'));
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
const destroy = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _d;
    try {
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_d = error.message) !== null && _d !== void 0 ? _d : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const show = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _e;
    try {
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_e = error.message) !== null && _e !== void 0 ? _e : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
//FIXME one review for one email
const publicReview = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _f;
    try {
        const { name, email, content, id, placeID, reviews } = request.body;
        if (reviews === undefined || reviews === "") {
            return response.send((0, response_1.httpBadRequest)(error_1.ErrorMessage.invalidRequest("Reviews is required field"), "Reviews is required field"));
        }
        const user = yield user_model_2.default.findOne({ email: email, accountType: user_model_1.AccountType.INDIVIDUAL });
        const businessProfileID = encryptionService.decrypt(id);
        const businessProfile = yield businessProfile_model_1.default.findOne({ _id: businessProfileID });
        if (!businessProfile) {
            return response.send((0, response_1.httpBadRequest)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.BUSINESS_PROFILE_NOT_FOUND), error_1.ErrorMessage.BUSINESS_PROFILE_NOT_FOUND));
        }
        let validateReviewJSON = [];
        validateReviewJSON = yield cleanAndValidateReview(reviews, validateReviewJSON);
        const totalRating = validateReviewJSON.reduce((total, item) => total + item.rating, 0);
        const rating = totalRating / validateReviewJSON.length;
        //remove reviews 
        const hasNotIndexed = validateReviewJSON.some(item => item.questionID === "not-indexed");
        if (hasNotIndexed) {
            validateReviewJSON = [];
        }
        // const newReview = new ReviewModel();
        //IF user is register with us then create a post with review 
        const finalRating = Number.isNaN(rating) ? 0 : parseInt(`${rating}`);
        const newPost = new post_model_1.default();
        newPost.postType = post_model_1.PostType.REVIEW;
        let userID;
        if (user && user.accountType === user_model_1.AccountType.INDIVIDUAL) {
            userID = user.id;
            newPost.userID = userID;
        }
        else {
            const isAnonymousUserExist = yield anonymousUser_model_1.default.findOne({ email: email, accountType: user_model_1.AccountType.INDIVIDUAL });
            if (!isAnonymousUserExist) {
                const username = yield (0, AuthController_1.generateUsername)(email, user_model_1.AccountType.INDIVIDUAL);
                const newAnonymousUser = new anonymousUser_model_1.default();
                newAnonymousUser.username = username;
                newAnonymousUser.accountType = user_model_1.AccountType.INDIVIDUAL;
                newAnonymousUser.name = name;
                newAnonymousUser.profilePic = {
                    "small": (0, basic_1.getDefaultProfilePic)(request, 'small'),
                    "medium": (0, basic_1.getDefaultProfilePic)(request, 'medium'),
                    "large": (0, basic_1.getDefaultProfilePic)(request, 'large')
                };
                const savedAnonymousUser = yield newAnonymousUser.save();
                userID = savedAnonymousUser.id;
                newPost.publicUserID = savedAnonymousUser.id;
            }
            else {
                userID = isAnonymousUserExist.id;
                newPost.publicUserID = isAnonymousUserExist.id;
            }
        }
        /**
         * Handle review media
         */
        const files = request.files;
        const images = files && files.images;
        const videos = files && files.videos;
        let mediaIDs = [];
        if (videos && videos.length !== 0 || images && images.length !== 0) {
            const [videoList, imageList] = yield Promise.all([
                (0, MediaController_1.storeMedia)(videos, userID, businessProfileID ? businessProfileID : null, constants_1.AwsS3AccessEndpoints.REVIEW, 'POST'),
                (0, MediaController_1.storeMedia)(images, userID, businessProfileID ? businessProfileID : null, constants_1.AwsS3AccessEndpoints.REVIEW, 'POST'),
            ]);
            if (imageList && imageList.length !== 0) {
                imageList.map((image) => mediaIDs.push(image.id));
            }
            if (videoList && videoList.length !== 0) {
                videoList.map((video) => mediaIDs.push(video.id));
            }
        }
        newPost.content = content; // Review for business
        newPost.reviewedBusinessProfileID = businessProfile.id;
        newPost.isPublished = true;
        newPost.location = null;
        newPost.geoCoordinate = { type: "Point", coordinates: EventController_1.lat_lng };
        newPost.tagged = [];
        newPost.media = mediaIDs;
        newPost.placeID = placeID !== null && placeID !== void 0 ? placeID : "";
        newPost.reviews = validateReviewJSON;
        newPost.rating = finalRating;
        const savedPost = yield newPost.save();
        //Map post id in review collection
        // newReview.postID = savedPost.id;
        // }
        if (user) {
            // newReview.userID = user.id;
            sendReviewNotification(businessProfileID, user.name, finalRating, content);
        }
        else {
            // newReview.email = email;
            // newReview.name = name;
            sendReviewNotification(businessProfileID, name, finalRating, content);
        }
        // newReview.content = content;// Review for business
        // newReview.reviewedBusinessProfileID = businessProfile.id;
        // if (newReview.postID) {
        //     newReview.isPublished = true;
        // }
        // newReview.media = [];
        // newReview.placeID = placeID ?? "";
        // newReview.reviews = validateReviewJSON;
        // newReview.rating = finalRating;
        // const savedReview = await newReview.save();
        return response.send((0, response_1.httpOk)(null, "Thanks for your review"));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_f = error.message) !== null && _f !== void 0 ? _f : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
/* FIXME here need to be change App Notification model
**  because this is not flexible
*/
const sendReviewNotification = (businessProfileID, name, rating, review) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userIDs = yield user_model_2.default.distinct('_id', { businessProfileID: businessProfileID });
        const devicesConfigs = yield appDeviceConfig_model_1.default.find({ userID: { $in: userIDs } });
        yield Promise.all(devicesConfigs.map((devicesConfig) => __awaiter(void 0, void 0, void 0, function* () {
            if (devicesConfig && devicesConfig.notificationToken) {
                const notificationID = (0, uuid_1.v4)();
                let title = 'Congratulations 🎉 You’ve received a new rating!';
                let description = `You’ve got a new rating! **${name}** rated you ${rating} stars.\nFeedback: '${review}'`;
                if (rating <= 3) {
                    title = '⚠️ You’ve received a new rating!';
                    description = `📢❗🚨 You’ve got a new rating! **${name}** rated you ${rating} stars.\nFeedback: '${review}'`;
                }
                const type = notification_model_1.NotificationType.REVIEW;
                const message = (0, FirebaseNotificationController_1.createMessagePayload)(devicesConfig.notificationToken, title, description, {
                    notificationID: notificationID,
                    devicePlatform: devicesConfig.devicePlatform,
                    type: type,
                    image: "",
                    profileImage: ""
                });
                yield (0, FirebaseNotificationController_1.sendNotification)(message);
            }
            return devicesConfig;
        })));
    }
    catch (error) {
        console.error("Error sending one or more notifications:", error);
    }
});
function cleanAndValidateReview(reviews, validateReviewJSON) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield Promise.all(reviews.map((reviewString) => __awaiter(this, void 0, void 0, function* () {
            const review = JSON.parse(reviewString);
            if (review.questionID !== "not-indexed") {
                const question = yield businessReviewQuestion_model_1.default.findOne({ _id: review.questionID });
                if (question && (review === null || review === void 0 ? void 0 : review.questionID) !== undefined && (review === null || review === void 0 ? void 0 : review.rating) !== undefined) {
                    validateReviewJSON.push({ questionID: review.questionID, rating: review.rating });
                }
            }
            else {
                if ((review === null || review === void 0 ? void 0 : review.questionID) !== undefined && (review === null || review === void 0 ? void 0 : review.rating) !== undefined) {
                    validateReviewJSON.push({ questionID: review.questionID, rating: review.rating });
                }
            }
            return review;
        })));
    });
}
exports.default = { index, store, update, destroy, publicReview };
