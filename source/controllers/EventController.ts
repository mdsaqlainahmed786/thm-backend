import { Request, Response, NextFunction } from "express";
import { httpBadRequest, httpCreated, httpForbidden, httpInternalServerError, httpNotFoundOr404 } from "../utils/response";
import { ErrorMessage } from "../utils/response-message/error";
import { AccountType } from "../database/models/user.model";
import Post, { PostType, Review } from "../database/models/post.model";
import { storeMedia } from './MediaController';
import { MediaType } from '../database/models/media.model';
import { MongoID } from '../common';
const index = async (request: Request, response: Response, next: NextFunction) => {
    try {

    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const store = async (request: Request, response: Response, next: NextFunction) => {
    try {

        const { id, accountType } = request.user;
        const { name, date, time, type, venue, streamingLink, description } = request.body;
        const files = request.files as { [fieldname: string]: Express.Multer.File[] };
        const images = files && files.images as Express.Multer.S3File[];
        // const videos = files && files.videos as Express.Multer.S3File[];
        if (!accountType && !id) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        /**
         * Content restrictions for business user
         */
        if (accountType !== AccountType.BUSINESS) {
            return response.send(httpForbidden(ErrorMessage.invalidRequest("Access denied: You do not have the necessary permissions to access this API."), "Access denied: You do not have the necessary permissions to access this API."))
        }

        const newPost = new Post();
        newPost.postType = PostType.EVENT;
        newPost.userID = id;
        newPost.content = description;// Description for business
        newPost.name = name;
        newPost.venue = venue;
        newPost.streamingLink = streamingLink;
        newPost.time = time;
        newPost.date = date;
        newPost.type = type;
        newPost.location = null;
        newPost.tagged = [];
        let mediaIDs: MongoID[] = []
        if (images && images.length !== 0) {
            const [imageList] = await Promise.all([
                storeMedia(images, id, null, MediaType.IMAGE),
            ])
            if (imageList && imageList.length !== 0) {
                imageList.map((image) => mediaIDs.push(image.id));
            }
        }
        newPost.media = mediaIDs;
        newPost.isPublished = true;
        const savedPost = await newPost.save();
        return response.send(httpCreated(savedPost, 'Your event is published successfully'));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const update = async (request: Request, response: Response, next: NextFunction) => {
    try {

        // return response.send(httpAcceptedOrUpdated(savedDeathCode, 'Death code updated.'));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const destroy = async (request: Request, response: Response, next: NextFunction) => {
    try {

        // return response.send(httpNoContent(null, 'Death code deleted.'));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const show = async (request: Request, response: Response, next: NextFunction) => {
    try {
        // return response.send(httpOk(null, "Not implemented"));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}

export default { index, store, update, destroy };
