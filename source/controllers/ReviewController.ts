import S3Object, { IS3Object } from './../database/models/s3Object.model';
import { Request, Response, NextFunction } from "express";
import { httpBadRequest, httpCreated, httpForbidden, httpInternalServerError, httpNotFoundOr404 } from "../utils/response";
import { ErrorMessage } from "../utils/response-message/error";
import { AccountType } from "../database/models/user.model";
import Subscription from "../database/models/subscription.model";
import Post, { PostType } from "../database/models/post.model";
import DailyContentLimit from "../database/models/dailyContentLimit.model";
import { countWords, isArray } from "../utils/helper/basic";
import { deleteUnwantedFiles, storeMedia } from './MediaController';
import { MediaType } from '../database/models/media.model';
import { MongoID } from '../common';
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
        const { content, businessProfileID, placeID, reviews } = request.body;

        if (!accountType && !id) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        if (content === undefined || content === "") {
            return response.send(httpBadRequest(ErrorMessage.invalidRequest("Content is required field"), "Content is required field"));
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
        const savedPost = await newPost.save();
        /*** Only for individual account
         * 
         **/
        if (savedPost && !haveSubscription && accountType === AccountType.INDIVIDUAL) {
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
        return response.send(httpCreated(savedPost, 'Your post has been created successfully'));
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
