import { Request, Response, NextFunction } from "express";
import { httpBadRequest, httpCreated, httpForbidden, httpInternalServerError, httpNotFoundOr404, httpOk } from "../utils/response";
import { ErrorMessage } from "../utils/response-message/error";
import { AccountType } from "../database/models/user.model";
import Subscription, { hasActiveSubscription } from "../database/models/subscription.model";
import Post, { PostType, Review } from "../database/models/post.model";
import DailyContentLimit from "../database/models/dailyContentLimit.model";
import BusinessReviewQuestion from '../database/models/businessReviewQuestion.model';
import User from "../database/models/user.model";
import ReviewModel from "../database/models/reviews.model";
import BusinessProfile from "../database/models/businessProfile.model";
import EncryptionService from "../services/EncryptionService";
import { MongoID } from "../common";
import DevicesConfig from "../database/models/appDeviceConfig.model";
import { v4 } from "uuid";
import { Message } from "firebase-admin/lib/messaging/messaging-api";
import { createMessagePayload, sendNotification } from "../notification/FirebaseNotificationController";
import { NotificationType } from "../database/models/notification.model";
import { storeMedia } from "./MediaController";
import { MediaType } from "../database/models/media.model";
import { AwsS3AccessEndpoints } from "../config/constants";
import AnonymousUser from "../database/models/anonymousUser.model";
import { generateUsername } from "./auth/AuthController";
import { getDefaultProfilePic } from "../utils/helper/basic";
const encryptionService = new EncryptionService();
const index = async (request: Request, response: Response, next: NextFunction) => {
    try {
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}

const MAXIMUM_REVIEWS_PER_DAY = 3;
const store = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id, accountType } = request.user;
        const { content, businessProfileID, placeID, reviews, anonymousUserID } = request.body;
        const userdata = await User.findOne({ _id: id });
        if (!userdata) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        if (content === undefined || content === "") {
            return response.send(httpBadRequest(ErrorMessage.invalidRequest("Content is required field"), "Content is required field"));
        }
        if (reviews === undefined || reviews === "") {
            return response.send(httpBadRequest(ErrorMessage.invalidRequest("Reviews is required field"), "Reviews is required field"));
        }
        if (placeID === undefined || placeID === "") {
            return response.send(httpBadRequest(ErrorMessage.invalidRequest("PlaceID is required field"), "PlaceID is required field"));
        }
        if (!businessProfileID) {
            if (anonymousUserID === undefined || anonymousUserID === "") {
                return response.send(httpBadRequest(ErrorMessage.invalidRequest("Business profile id is required field"), "Business profile id is required field"));
            }
        }
        /**
         * Content restrictions for business user
         */
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));
        const [haveSubscription, dailyContentLimit] = await Promise.all([
            hasActiveSubscription(id),
            DailyContentLimit.findOne({
                userID: id, timeStamp: {
                    $gte: startOfDay,
                    $lt: endOfDay
                }
            })
        ]);
        if (accountType === AccountType.INDIVIDUAL) {
            // if (!haveSubscription) {
            if (dailyContentLimit && dailyContentLimit.reviews >= MAXIMUM_REVIEWS_PER_DAY && content && content !== "") {
                const error = `You cannot post more reviews today. You've reached your daily limit.`;
                return response.send(httpBadRequest(ErrorMessage.invalidRequest(error), error))
            }
            // }
        } else {
            return response.send(httpForbidden(ErrorMessage.invalidRequest("Access denied: You do not have the necessary permissions to access this API."), "Access denied: You do not have the necessary permissions to access this API."))
        }
        let validateReviewJSON: Review[] = [];
        await Promise.all(reviews.map(async (reviewString: string) => {
            const review: Review = JSON.parse(reviewString);
            if (review.questionID !== "not-indexed") {
                const question = await BusinessReviewQuestion.findOne({ _id: review.questionID });
                if (question && review?.questionID !== undefined && review?.rating !== undefined) {
                    validateReviewJSON.push({ questionID: review.questionID, rating: review.rating });
                }
            } else {
                if (review?.questionID !== undefined && review?.rating !== undefined) {
                    validateReviewJSON.push({ questionID: review.questionID, rating: review.rating });
                }
            }
            return review;
        }));


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
        const files = request.files as { [fieldname: string]: Express.Multer.File[] };
        const images = files && files.images as Express.Multer.S3File[];
        const videos = files && files.videos as Express.Multer.S3File[];
        let mediaIDs: MongoID[] = []
        if (videos && videos.length !== 0 || images && images.length !== 0) {
            const [videoList, imageList] = await Promise.all([
                storeMedia(videos, id, businessProfileID ? businessProfileID : null, AwsS3AccessEndpoints.REVIEW, 'POST'),
                storeMedia(images, id, businessProfileID ? businessProfileID : null, AwsS3AccessEndpoints.REVIEW, 'POST'),
            ])
            if (imageList && imageList.length !== 0) {
                imageList.map((image) => mediaIDs.push(image.id));
            }
            if (videoList && videoList.length !== 0) {
                videoList.map((video) => mediaIDs.push(video.id));
            }
        }
        //IF business profile id is 
        // let postID = null;
        const finalRating = Number.isNaN(rating) ? 0 : parseInt(`${rating}`);

        const newPost = new Post();
        newPost.postType = PostType.REVIEW;
        newPost.userID = id;
        newPost.content = content;// Review for business
        if (businessProfileID !== undefined && businessProfileID !== "") {
            newPost.reviewedBusinessProfileID = businessProfileID;
        } else {
            newPost.googleReviewedBusiness = anonymousUserID;
        }
        newPost.isPublished = true;
        newPost.location = null;
        newPost.tagged = [];
        newPost.media = mediaIDs;
        newPost.placeID = placeID ?? "";
        newPost.reviews = validateReviewJSON;
        newPost.rating = finalRating;
        const savedPost = await newPost.save();
        // }
        /*** 
         * Only for individual account
         * 
         **/
        // const newReview = new ReviewModel();
        // newReview.postID = postID;
        // newReview.userID = id;
        // newReview.content = content;// Review for business
        // if (businessProfileID !== undefined && businessProfileID !== "") {
        //     newReview.reviewedBusinessProfileID = businessProfileID;
        //     newReview.isPublished = true;
        //     sendReviewNotification(businessProfileID, userdata.name, finalRating, content);
        // } else {
        //     newReview.businessName = name;
        //     newReview.address = { street, city, state, zipCode, country, lat: lat ?? 0, lng: lng ?? 0, };
        // }
        // newReview.media = mediaIDs;
        // newReview.placeID = placeID ?? "";
        // newReview.reviews = validateReviewJSON;
        // newReview.rating = finalRating;
        // const savedReview = await newReview.save();
        if (!haveSubscription && accountType === AccountType.INDIVIDUAL) {
            if (!dailyContentLimit) {
                const today = new Date();
                const midnightToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
                const newDailyContentLimit = new DailyContentLimit();
                newDailyContentLimit.timeStamp = midnightToday;
                newDailyContentLimit.userID = id;
                newDailyContentLimit.videos = 0;
                newDailyContentLimit.images = 0;
                newDailyContentLimit.text = 0;
                newDailyContentLimit.reviews = 1;
                await newDailyContentLimit.save();
            } else {
                dailyContentLimit.reviews = dailyContentLimit.reviews + 1;
                await dailyContentLimit.save();
            }
        }
        return response.send(httpCreated(savedPost, 'Your review is published successfully'));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const update = async (request: Request, response: Response, next: NextFunction) => {
    try {
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const destroy = async (request: Request, response: Response, next: NextFunction) => {
    try {
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const show = async (request: Request, response: Response, next: NextFunction) => {
    try {
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
//FIXME one review for one email
const publicReview = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { name, email, content, id, placeID, reviews } = request.body;
        if (reviews === undefined || reviews === "") {
            return response.send(httpBadRequest(ErrorMessage.invalidRequest("Reviews is required field"), "Reviews is required field"));
        }
        const user = await User.findOne({ email: email, accountType: AccountType.INDIVIDUAL });
        const businessProfileID = encryptionService.decrypt(id as string);
        const businessProfile = await BusinessProfile.findOne({ _id: businessProfileID });
        if (!businessProfile) {
            return response.send(httpBadRequest(ErrorMessage.invalidRequest(ErrorMessage.BUSINESS_PROFILE_NOT_FOUND), ErrorMessage.BUSINESS_PROFILE_NOT_FOUND))
        }
        let validateReviewJSON: Review[] = [];
        validateReviewJSON = await cleanAndValidateReview(reviews, validateReviewJSON)
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
        const newPost = new Post();
        newPost.postType = PostType.REVIEW;

        let userID: string;
        if (user && user.accountType === AccountType.INDIVIDUAL) {
            userID = user.id
            newPost.userID = userID;
        } else {
            const isAnonymousUserExist = await AnonymousUser.findOne({ email: email, accountType: AccountType.INDIVIDUAL });
            if (!isAnonymousUserExist) {
                const username = await generateUsername(email, AccountType.INDIVIDUAL);
                const newAnonymousUser = new AnonymousUser();
                newAnonymousUser.username = username;
                newAnonymousUser.accountType = AccountType.INDIVIDUAL;
                newAnonymousUser.name = name;
                newAnonymousUser.profilePic = {
                    "small": getDefaultProfilePic(request, name.substring(0, 1), 'small'),
                    "medium": getDefaultProfilePic(request, name.substring(0, 1), 'small'),
                    "large": getDefaultProfilePic(request, name.substring(0, 1), 'small')
                };
                const savedAnonymousUser = await newAnonymousUser.save();
                userID = savedAnonymousUser.id;
                newPost.publicUserID = savedAnonymousUser.id;
            } else {
                userID = isAnonymousUserExist.id;
                newPost.publicUserID = isAnonymousUserExist.id;
            }
        }
        /**
         * Handle review media
         */
        const files = request.files as { [fieldname: string]: Express.Multer.File[] };
        const images = files && files.images as Express.Multer.S3File[];
        const videos = files && files.videos as Express.Multer.S3File[];
        let mediaIDs: MongoID[] = []
        if (videos && videos.length !== 0 || images && images.length !== 0) {
            const [videoList, imageList] = await Promise.all([
                storeMedia(videos, userID, businessProfileID ? businessProfileID : null, AwsS3AccessEndpoints.REVIEW, 'POST'),
                storeMedia(images, userID, businessProfileID ? businessProfileID : null, AwsS3AccessEndpoints.REVIEW, 'POST'),
            ])
            if (imageList && imageList.length !== 0) {
                imageList.map((image) => mediaIDs.push(image.id));
            }
            if (videoList && videoList.length !== 0) {
                videoList.map((video) => mediaIDs.push(video.id));
            }
        }
        newPost.content = content;// Review for business
        newPost.reviewedBusinessProfileID = businessProfile.id;
        newPost.isPublished = true;
        newPost.location = null;
        newPost.tagged = [];
        newPost.media = mediaIDs;
        newPost.placeID = placeID ?? "";
        newPost.reviews = validateReviewJSON;
        newPost.rating = finalRating;
        const savedPost = await newPost.save();
        //Map post id in review collection
        // newReview.postID = savedPost.id;
        // }
        if (user) {
            // newReview.userID = user.id;
            sendReviewNotification(businessProfileID, user.name, finalRating, content);
        } else {
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
        return response.send(httpOk(null, "Thanks for your review"));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
/* FIXME here need to be change App Notification model 
**  because this is not flexible
*/
const sendReviewNotification = async (businessProfileID: MongoID, name: string, rating: number, review: string) => {
    try {
        const userIDs = await User.distinct('_id', { businessProfileID: businessProfileID });
        const devicesConfigs = await DevicesConfig.find({ userID: { $in: userIDs } });
        await Promise.all(devicesConfigs.map(async (devicesConfig) => {
            if (devicesConfig && devicesConfig.notificationToken) {
                const notificationID = v4();
                let title = 'Congratulations 🎉 You’ve received a new rating!';
                let description = `You’ve got a new rating! **${name}** rated you ${rating} stars.\nFeedback: '${review}'`;
                if (rating <= 3) {
                    title = '⚠️ You’ve received a new rating!';
                    description = `📢❗🚨 You’ve got a new rating! **${name}** rated you ${rating} stars.\nFeedback: '${review}'`;
                }
                const type = NotificationType.REVIEW;
                const message: Message = createMessagePayload(devicesConfig.notificationToken, title, description, {
                    notificationID: notificationID,
                    devicePlatform: devicesConfig.devicePlatform,
                    type: type,
                    image: "",
                    profileImage: ""
                });
                await sendNotification(message);
            }
            return devicesConfig;
        }));
    } catch (error) {
        console.error("Error sending one or more notifications:", error);
    }
}

async function cleanAndValidateReview(reviews: any, validateReviewJSON: Review[]) {
    return await Promise.all(reviews.map(async (reviewString: string) => {
        const review: Review = JSON.parse(reviewString);
        if (review.questionID !== "not-indexed") {
            const question = await BusinessReviewQuestion.findOne({ _id: review.questionID });
            if (question && review?.questionID !== undefined && review?.rating !== undefined) {
                validateReviewJSON.push({ questionID: review.questionID, rating: review.rating });
            }
        } else {
            if (review?.questionID !== undefined && review?.rating !== undefined) {
                validateReviewJSON.push({ questionID: review.questionID, rating: review.rating });
            }
        }
        return review;
    }));
}

export default { index, store, update, destroy, publicReview };
