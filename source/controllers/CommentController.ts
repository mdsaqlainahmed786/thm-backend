import { ObjectId } from 'mongodb';
import { param } from 'express-validator';
import S3Object, { IS3Object } from './../database/models/s3Object.model';
import { Request, Response, NextFunction } from "express";
import { httpBadRequest, httpCreated, httpInternalServerError, httpNoContent, httpNotFoundOr404, httpOk, httpOkExtended } from "../utils/response";
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
import Comment, { addCommentedByInPost, addLikesInComment } from '../database/models/comment.model';
import { parseQueryParam } from '../utils/helper/basic';
const index = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id } = request.user;
        const postID = request.params.id;
        let { pageNumber, documentLimit }: any = request.query;
        const dbQuery = { postID: new ObjectId(postID), isParent: true };
        pageNumber = parseQueryParam(pageNumber, 1);
        documentLimit = parseQueryParam(documentLimit, 20);
        if (!id) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        const likedByMe = await Like.distinct('commentID', { userID: id, commentID: { $ne: null } });
        const [documents, totalDocument] = await Promise.all([
            Comment.aggregate(
                [
                    {
                        $match: dbQuery
                    },
                    {
                        $lookup: {
                            from: 'comments',
                            let: { parentID: '$_id' },
                            pipeline: [
                                { $match: { $expr: { $eq: ['$parentID', '$$parentID'] } } },
                                addCommentedByInPost().lookup,
                                addCommentedByInPost().unwindLookup,
                                addLikesInComment().lookup,
                                addLikesInComment().addLikeCount,
                                {
                                    $addFields: {
                                        likedByMe: {
                                            $in: ['$_id', likedByMe]
                                        },
                                    }
                                },
                                {
                                    $project: {
                                        likesRef: 0,
                                        updatedAt: 0,
                                        __v: 0
                                    }
                                }
                            ],
                            as: 'repliesRef'
                        }
                    },
                    addCommentedByInPost().lookup,
                    addCommentedByInPost().unwindLookup,
                    addLikesInComment().lookup,
                    addLikesInComment().addLikeCount,
                    {
                        $addFields: {
                            likedByMe: {
                                $in: ['$_id', likedByMe]
                            },
                        }
                    },
                    {
                        $sort: { _id: -1 }
                    },
                    {
                        $skip: pageNumber > 0 ? ((pageNumber - 1) * documentLimit) : 0
                    },
                    {
                        $limit: documentLimit
                    },
                    {
                        $project: {
                            likesRef: 0,
                            updatedAt: 0,
                            __v: 0
                        }
                    }
                ]
            ).exec(),
            Comment.find(dbQuery).countDocuments(),
        ]);
        const totalPagesCount = Math.ceil(totalDocument / documentLimit) || 1;
        return response.send(httpOkExtended(documents, 'Comments fetched.', pageNumber, totalPagesCount, totalDocument));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}

const store = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id, accountType, businessProfileID } = request.user;
        const { postID, message, parentID } = request.body;
        if (!id) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        const post = await Post.findOne({ _id: postID });
        if (!post) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest("Post not found"), "Post not found"));
        }
        const newComment = new Comment();
        newComment.userID = id;
        newComment.businessProfileID = businessProfileID;
        newComment.postID = postID;
        newComment.message = message;
        if (parentID !== undefined && parentID !== "") {
            newComment.isParent = false;
            newComment.parentID = parentID;
        }
        const savedComment = await newComment.save();
        return response.send(httpNoContent(savedComment, 'Comment posted successfully'));
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
