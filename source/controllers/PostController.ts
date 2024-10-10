import S3Object, { IS3Object } from './../database/models/s3Object.model';
import { Request, Response, NextFunction } from "express";
import { httpBadRequest, httpCreated, httpInternalServerError, httpNotFoundOr404 } from "../utils/response";
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

const MAX_CONTENT_LENGTH = 20; // Set maximum content length
const MAX_CONTENT_UPLOADS = 2;
const MAX_VIDEO_UPLOADS = 1;
const MAX_IMAGE_UPLOADS = 2;
const store = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id, accountType, businessProfileID } = request.user;
        const { content, placeName, lat, lng, tagged, feelings } = request.body;
        const files = request.files as { [fieldname: string]: Express.Multer.File[] };
        const images = files && files.images as Express.Multer.S3File[];
        const videos = files && files.videos as Express.Multer.S3File[];
        if (!accountType && !id) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        if (!content && !images && !videos) {
            return response.send(httpBadRequest(ErrorMessage.invalidRequest("Content is required for creating a post"), 'Content is required for creating a post'))
        }
        /**
         * Content restrictions for individual user
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
            if (!haveSubscription) {
                if (!dailyContentLimit && content && countWords(content) > MAX_CONTENT_LENGTH) {
                    const error = `Content must be a string and cannot exceed ${MAX_CONTENT_LENGTH} words.`;
                    return response.send(httpBadRequest(ErrorMessage.invalidRequest(error), error))
                } else if (!dailyContentLimit && images && images.length > MAX_IMAGE_UPLOADS) {

                    await deleteUnwantedFiles(images);
                    const error = `You cannot upload multiple images because your current plan does not include this feature.`;
                    return response.send(httpBadRequest(ErrorMessage.invalidRequest(error), error))

                } else if (!dailyContentLimit && videos && videos.length > MAX_VIDEO_UPLOADS) {

                    await deleteUnwantedFiles(videos);
                    const error = `You cannot upload multiple videos because your current plan does not include this feature.`;
                    return response.send(httpBadRequest(ErrorMessage.invalidRequest(error), error))

                } else if (dailyContentLimit && dailyContentLimit.text >= MAX_CONTENT_UPLOADS && content && content !== "") {

                    const error = `Your daily content upload limit has been exceeded. Please upgrade your account to avoid this error.`;
                    return response.send(httpBadRequest(ErrorMessage.invalidRequest(error), error))

                } else if (dailyContentLimit && dailyContentLimit.images !== 0 && images && images.length >= dailyContentLimit.images) {

                    await deleteUnwantedFiles(images);
                    const error = `Your daily image upload limit has been exceeded. Please upgrade your account to avoid this error.`;
                    return response.send(httpBadRequest(ErrorMessage.invalidRequest(error), error))

                } else if (dailyContentLimit && dailyContentLimit.videos !== 0 && videos && videos.length >= dailyContentLimit.videos) {

                    await deleteUnwantedFiles(videos);
                    const error = `Your daily video upload limit has been exceeded. Please upgrade your account to avoid this error.`;
                    return response.send(httpBadRequest(ErrorMessage.invalidRequest(error), error))
                }
            }
        }
        const newPost = new Post();
        if (accountType === AccountType.BUSINESS && businessProfileID) {
            newPost.businessProfileID = businessProfileID;
        }
        newPost.postType = PostType.POST;
        newPost.userID = id;
        newPost.isPublished = true;
        newPost.content = content;
        newPost.feelings = feelings ?? "";
        if (tagged && isArray(tagged)) {
            newPost.tagged = tagged;
        } else {
            newPost.tagged = [];
        }

        if (placeName && lat && lng) {
            newPost.location = { placeName, lat, lng };
        } else {
            newPost.location = null;
        }

        /**
         * Handle post media
         */
        let mediaIDs: MongoID[] = []
        if (videos && videos.length !== 0 || images && images.length !== 0) {
            const [videoList, imageList] = await Promise.all([
                storeMedia(videos, id, null, MediaType.VIDEO),
                storeMedia(images, id, null, MediaType.IMAGE),
            ])
            if (imageList && imageList.length !== 0) {
                imageList.map((image) => mediaIDs.push(image.id));
            }
            if (videoList && videoList.length !== 0) {
                videoList.map((video) => mediaIDs.push(video.id));
            }
        }
        newPost.media = mediaIDs;
        const savedPost = await newPost.save();

        /**
         * Only for individual account 
         */
        if (savedPost && !haveSubscription && accountType === AccountType.INDIVIDUAL) {
            if (!dailyContentLimit) {
                const today = new Date();
                const midnightToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
                const newDailyContentLimit = new DailyContentLimit();
                newDailyContentLimit.timeStamp = midnightToday;
                newDailyContentLimit.userID = id;
                newDailyContentLimit.videos = (videos && videos.length) ? videos.length : 0;
                newDailyContentLimit.images = (images && images.length) ? images.length : 0;
                newDailyContentLimit.text = (content && content !== "") ? 1 : 0;
                await newDailyContentLimit.save();
            } else {
                dailyContentLimit.videos = (videos && videos.length) ? dailyContentLimit.videos + videos.length : dailyContentLimit.videos;
                dailyContentLimit.images = (images && images.length) ? dailyContentLimit.images + images.length : dailyContentLimit.images;
                dailyContentLimit.text = (content && content !== "") ? dailyContentLimit.text + 1 : dailyContentLimit.text;
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

const sharedPost = async (request: Request, response: Response, next: NextFunction) => {
    try {

        let { postID, userID }: any = request.query;

        // return response.send(httpOk({}, "Not implemented"));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}

export default { index, store, update, destroy, sharedPost };
