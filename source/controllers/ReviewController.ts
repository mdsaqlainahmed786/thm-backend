import { ObjectId } from 'mongodb';
import S3Object, { IS3Object } from './../database/models/s3Object.model';
import { Request, Response, NextFunction } from "express";
import { httpBadRequest, httpCreated, httpForbidden, httpInternalServerError, httpNotFoundOr404 } from "../utils/response";
import { ErrorMessage } from "../utils/response-message/error";
import { AccountType } from "../database/models/user.model";
import Subscription from "../database/models/subscription.model";
import Post, { PostType, Review } from "../database/models/post.model";
import DailyContentLimit from "../database/models/dailyContentLimit.model";
import { countWords, isArray } from "../utils/helper/basic";
import { deleteUnwantedFiles, storeMedia } from './MediaController';
import { MediaType } from '../database/models/media.model';
import { MongoID } from '../common';
import BusinessReviewQuestion from '../database/models/businessReviewQuestion.model';
import NotIndexedReview from '../database/models/notIndexedReview.model';
const index = async (request: Request, response: Response, next: NextFunction) => {
    try {
        // let { pageNumber, documentLimit, query }: any = request.query;
        // const dbQuery = {};
        // pageNumber = parseQueryParam(pageNumber, 1);
        // documentLimit = parseQueryParam(documentLimit, 20);
        // if (query !== undefined && query !== "") {
        //     Object.assign(dbQuery,
        //         {
        //             $or: [
        //                 { DTNAME: { $regex: new RegExp(query.toLowerCase(), "i") } },
        //                 { DTABBR: { $regex: new RegExp(query.toLowerCase(), "i") } },
        //             ]
        //         }
        //     )
        // }
        // const documents = await DeathCode.aggregate(
        //     [
        //         {
        //             $match: dbQuery
        //         },
        //         {
        //             $sort: { _id: -1 }
        //         },
        //         {
        //             $skip: pageNumber > 0 ? ((pageNumber - 1) * documentLimit) : 0
        //         },
        //         {
        //             $limit: documentLimit
        //         },
        //     ]
        // ).exec();
        // const totalDocument = await DeathCode.find(dbQuery).countDocuments();
        // const totalPagesCount = Math.ceil(totalDocument / documentLimit) || 1;
        // return response.send(httpOkExtended(documents, 'Death code fetched.', pageNumber, totalPagesCount, totalDocument));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}

const MAXIMUM_REVIEWS_PER_DAY = 3;
const store = async (request: Request, response: Response, next: NextFunction) => {
    try {

        const { id, accountType } = request.user;
        const { content, businessProfileID, placeID, reviews, city, state, zipCode, country, lat, lng, name, street } = request.body;

        if (!accountType && !id) {
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
            if (name === undefined || name === "") {
                return response.send(httpBadRequest(ErrorMessage.invalidRequest("Business Name is required field"), "Name is required field"));
            }
            if (city === undefined || city === "") {
                return response.send(httpBadRequest(ErrorMessage.invalidRequest("City is required field"), "City is required field"));
            }
            if (state === undefined || state === "") {
                return response.send(httpBadRequest(ErrorMessage.invalidRequest("State is required field"), "State is required field"));
            }
            if (zipCode === undefined || zipCode === "") {
                return response.send(httpBadRequest(ErrorMessage.invalidRequest("Zip code is required field"), "Zip code is required field"));
            }
            if (country === undefined || country === "") {
                return response.send(httpBadRequest(ErrorMessage.invalidRequest("Country is required field"), "Country is required field"));
            }
            if (lat === undefined || lat === "") {
                return response.send(httpBadRequest(ErrorMessage.invalidRequest("Lat is required field"), "Lat is required field"));
            }
            if (lng === undefined || lng === "") {
                return response.send(httpBadRequest(ErrorMessage.invalidRequest("Lng is required field"), "Lng is required field"));
            }
        }
        /**
         * Content restrictions for business user
         */
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));
        const [haveSubscription, dailyContentLimit] = await Promise.all([
            Subscription.findOne({ userID: id, expirationDate: { $gte: new Date() } }),
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
        await Promise.all(JSON.parse(reviews).map(async (review: Review) => {
            if (review.questionID !== "not-indexed") {
                const question = await BusinessReviewQuestion.findOne({ _id: review?.questionID })
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

        const newPost = new Post();
        newPost.postType = PostType.REVIEW;
        newPost.userID = id;
        newPost.content = content;// Review for business
        if (businessProfileID !== undefined && businessProfileID !== "") {
            newPost.reviewedBusinessProfileID = businessProfileID;
            newPost.isPublished = true;
        }
        newPost.location = null;
        newPost.tagged = [];
        newPost.media = [];
        newPost.placeID = placeID ?? "";
        newPost.reviews = validateReviewJSON;
        newPost.rating = Number.isNaN(rating) ? 0 : parseInt(`${rating}`);
        const savedPost = await newPost.save();
        /*** Only for individual account
         * 
         **/
        if (savedPost && !haveSubscription && accountType === AccountType.INDIVIDUAL) {
            if (!businessProfileID && hasNotIndexed) {
                //This is not indexed review
                const newNotIndexedReview = new NotIndexedReview();
                newNotIndexedReview.postID = savedPost.id;
                newNotIndexedReview.userID = id;
                newNotIndexedReview.name = name;
                newNotIndexedReview.address = { street, city, state, zipCode, country, lat: lat ?? 0, lng: lng ?? 0, }
                await newNotIndexedReview.save();
            }
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
        // const ID = request?.params?.id;
        // const { DTCODE, DTNAME, DTABBR } = request.body;
        // const deathCode = await DeathCode.findOne({ _id: ID });
        // if (!deathCode) {
        //     return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest("Death code not found."), "Death code not found."));
        // }
        // deathCode.DTCODE = DTCODE ?? deathCode.DTCODE;
        // deathCode.DTNAME = DTNAME ?? deathCode.DTNAME;
        // deathCode.DTABBR = DTABBR ?? deathCode.DTABBR;
        // const savedDeathCode = await deathCode.save();
        // return response.send(httpAcceptedOrUpdated(savedDeathCode, 'Death code updated.'));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const destroy = async (request: Request, response: Response, next: NextFunction) => {
    try {
        // const ID = request?.params?.id;
        // const deathCode = await DeathCode.findOne({ _id: ID });
        // if (!deathCode) {
        //     return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest("Death code not found."), "Death code not found."));
        // }
        // await deathCode.deleteOne();
        // return response.send(httpNoContent({}, 'Death code deleted.'));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const show = async (request: Request, response: Response, next: NextFunction) => {
    try {
        // return response.send(httpOk({}, "Not implemented"));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}

export default { index, store, update, destroy };
