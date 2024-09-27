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
import SavedPost from '../database/models/savedPost.model';
const index = async (request: Request, response: Response, next: NextFunction) => {
    try {

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
        const [post, isSaved] = await Promise.all([
            Post.findOne({ _id: postID }),
            SavedPost.findOne({ postID: postID, userID: id }),
        ])
        if (!post) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest("Post not found"), "Post not found"));
        }
        if (!isSaved) {
            const newSavedPost = new SavedPost();
            newSavedPost.userID = id;
            newSavedPost.postID = postID;
            newSavedPost.businessProfileID = businessProfileID ?? null;
            const savedLike = await newSavedPost.save();
            return response.send(httpCreated(savedLike, "Post saved successfully"));
        }
        await isSaved.deleteOne();
        return response.send(httpNoContent(null, 'Post removed successfully'));
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
