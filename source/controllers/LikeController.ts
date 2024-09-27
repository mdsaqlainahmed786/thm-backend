import { param } from 'express-validator';
import S3Object, { IS3Object } from './../database/models/s3Object.model';
import { Request, Response, NextFunction } from "express";
import { httpBadRequest, httpCreated, httpInternalServerError, httpNoContent, httpNotFoundOr404, httpOk } from "../utils/response";
import { ErrorMessage } from "../utils/response-message/error";
import { AccountType } from "../database/models/user.model";
import Subscription from "../database/models/subscription.model";
import Post, { PostType } from "../database/models/post.model";
import DailyContentLimit from "../database/models/dailyContentLimit.model";
import { countWords, isArray } from "../utils/helper/basic";
import { deleteUnwantedFiles, storeMedia } from './MediaController';
import { MediaType } from '../database/models/media.model';
import { MongoID } from '../common';
import Like from '../database/models/like.model';
import { SuccessMessage } from '../utils/response-message/success';
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

const store = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const postID = request.params.id;
        const { id, accountType, businessProfileID } = request.user;
        if (!id) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        const [post, isLiked] = await Promise.all([
            Post.findOne({ _id: postID }),
            Like.findOne({ postID: postID, userID: id }),
        ])
        if (!post) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest("Post not found"), "Post not found"));
        }
        if (!isLiked) {
            const newLike = new Like();
            newLike.userID = id;
            newLike.postID = postID;
            newLike.businessProfileID = businessProfileID ?? null;
            const savedLike = await newLike.save();
            return response.send(httpCreated(savedLike, "Post liked successfully"));
        }
        await isLiked.deleteOne();
        return response.send(httpNoContent(null, 'Post disliked successfully'));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const update = async (request: Request, response: Response, next: NextFunction) => {
    try {
        // return response.send(httpAcceptedOrUpdated({}, 'Not implemented'));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const destroy = async (request: Request, response: Response, next: NextFunction) => {
    try {
        // return response.send(httpNoContent({}, 'Not implemented'));
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
