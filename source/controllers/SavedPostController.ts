import { Request, Response, NextFunction } from "express";
import { httpBadRequest, httpCreated, httpInternalServerError, httpNoContent, httpNotFoundOr404, httpOk, httpOkExtended } from "../utils/response";
import { ErrorMessage } from "../utils/response-message/error";
import Post, { countPostDocument, getSavedPost } from "../database/models/post.model";
import SavedPost from '../database/models/savedPost.model';
import { parseQueryParam } from "../utils/helper/basic";
import Like from "../database/models/like.model";
import { fetchPosts, getPostQuery } from "../database/models/post.model";
import EventJoin from "../database/models/eventJoin.model";
const index = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id } = request.user;
        let { pageNumber, documentLimit, query }: any = request.query;
        pageNumber = parseQueryParam(pageNumber, 1);
        documentLimit = parseQueryParam(documentLimit, 20);
        const [likedByMe, savedByMe, joiningEvents] = await Promise.all(
            [
                Like.distinct('postID', { userID: id, postID: { $ne: null } }),
                getSavedPost(id),
                EventJoin.distinct('postID', { userID: id, postID: { $ne: null } }),
            ]
        );

        if (!id) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        const dbQuery = { ...getPostQuery, _id: { $in: savedByMe } };
        const [documents, totalDocument] = await Promise.all([
            fetchPosts(dbQuery, likedByMe, savedByMe, joiningEvents, pageNumber, documentLimit, undefined, undefined, false, undefined, id),
            countPostDocument(dbQuery),
        ]);
        const totalPagesCount = Math.ceil(totalDocument / documentLimit) || 1;
        return response.send(httpOkExtended(documents, 'User feed fetched.', pageNumber, totalPagesCount, totalDocument));
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
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.POST_NOT_FOUND), ErrorMessage.POST_NOT_FOUND));
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
