import { Request, Response, NextFunction } from "express";
import { httpBadRequest, httpCreated, httpForbidden, httpInternalServerError, httpNoContent, httpNotFoundOr404 } from "../utils/response";
import { ErrorMessage } from "../utils/response-message/error";
import { AccountType } from "../database/models/user.model";
import Post, { PostType, Review } from "../database/models/post.model";
import { storeMedia } from './MediaController';
import { MediaType } from '../database/models/media.model';
import { MongoID } from '../common';
import EventJoin from "../database/models/eventJoin.model";
import { AwsS3AccessEndpoints } from "../config/constants";
const index = async (request: Request, response: Response, next: NextFunction) => {
    try {

    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const store = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id, accountType, businessProfileID } = request.user;
        const { name, type, venue, streamingLink, description, placeName, lat, lng, startDate, startTime, endDate, endTime } = request.body;
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
        newPost.startDate = startDate;
        newPost.startTime = startTime;
        newPost.endDate = endDate;
        newPost.endTime = endTime;
        newPost.type = type;
        if (placeName && lat && lng) {
            newPost.location = { placeName, lat, lng };
        } else {
            newPost.location = null;
        }
        if (accountType === AccountType.BUSINESS && businessProfileID) {
            newPost.businessProfileID = businessProfileID;
        }
        newPost.tagged = [];
        let mediaIDs: MongoID[] = []
        if (images && images.length !== 0) {
            const [imageList] = await Promise.all([
                storeMedia(images, id, null, MediaType.IMAGE, AwsS3AccessEndpoints.POST, 'POST'),
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

const joinEvent = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id, accountType } = request.user;
        const { postID } = request.body;
        if (!id) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        const [post, joinedAllReady] = await Promise.all([
            Post.findOne({ _id: postID, postType: PostType.EVENT }),
            EventJoin.findOne({ postID: postID, userID: id }),
        ])
        if (!post) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest("Post not found"), "Post not found"));
        }
        if (!joinedAllReady) {
            const eventJoin = new EventJoin();
            eventJoin.userID = id;
            eventJoin.postID = postID;
            const savedEventJoin = await eventJoin.save();
            return response.send(httpCreated(savedEventJoin, "Your action saved successfully"));
        }
        await joinedAllReady.deleteOne();
        return response.send(httpNoContent(null, 'Your action saved successfully'));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}

export default { index, store, update, destroy, joinEvent };
