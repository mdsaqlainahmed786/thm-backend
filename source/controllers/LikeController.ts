import { Request, Response, NextFunction } from "express";
import { httpBadRequest, httpCreated, httpInternalServerError, httpNoContent, httpNotFoundOr404, httpOk } from "../utils/response";
import { ErrorMessage } from "../utils/response-message/error";
import Post from "../database/models/post.model";
import Like from '../database/models/like.model';
import Comment from '../database/models/comment.model';
import Story from "../database/models/story.model";
import AppNotificationController from "../controllers/AppNotificationController";
import Notification from "../database/models/notification.model";
import { NotificationType } from "../database/models/notification.model";
const index = async (request: Request, response: Response, next: NextFunction) => {
    try {

    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}

const store = async (request: Request, response: Response, next: NextFunction) => {
    try {
        //Like post
        if (new RegExp("/posts/likes/").test(request.originalUrl)) {
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
                AppNotificationController.store(id, post.userID, NotificationType.LIKE_POST, { postID: post.id, userID: post.userID }).catch((error) => console.error(error));
                return response.send(httpCreated(savedLike, "Post liked successfully"));
            }
            await isLiked.deleteOne();
            AppNotificationController.destroy(id, post.userID, NotificationType.LIKE_POST, { postID: post.id, userID: post.userID }).catch((error) => console.error(error));
            return response.send(httpNoContent(null, 'Post disliked successfully'));
        }
        //Like comment
        if (new RegExp("/posts/comments/likes/").test(request.originalUrl)) {
            const commentID = request.params.id;
            const { id, accountType, businessProfileID } = request.user;
            if (!id) {
                return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
            }
            const [comment, isLiked] = await Promise.all([
                Comment.findOne({ _id: commentID }),
                Like.findOne({ commentID: commentID, userID: id }),
            ])
            if (!comment) {
                return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest("Comment not found"), "Comment not found"));
            }
            if (!isLiked) {
                const newLike = new Like();
                newLike.userID = id;
                newLike.commentID = commentID;
                newLike.businessProfileID = businessProfileID ?? null;
                const savedLike = await newLike.save();
                AppNotificationController.store(id, comment.userID, NotificationType.LIKE_COMMENT, { commentID: comment.id, userID: comment.userID, message: comment.message }).catch((error) => console.error(error));
                return response.send(httpCreated(savedLike, "Comment liked successfully"));
            }
            await isLiked.deleteOne();
            AppNotificationController.destroy(id, comment.userID, NotificationType.LIKE_COMMENT, { commentID: comment.id, userID: comment.userID, message: comment.message }).catch((error) => console.error(error));
            return response.send(httpNoContent(null, 'Comment disliked successfully'));
        }
        //Like Story
        if (new RegExp("/story/likes/").test(request.originalUrl)) {
            const storyID = request.params.id;
            const { id, accountType, businessProfileID } = request.user;
            if (!id) {
                return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
            }
            const [story, isLiked] = await Promise.all([
                Story.findOne({ _id: storyID }),
                Like.findOne({ storyID: storyID, userID: id }),
            ])
            if (!story) {
                return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest("Story not found"), "Story not found"));
            }
            if (!isLiked) {
                const newLike = new Like();
                newLike.userID = id;
                newLike.storyID = storyID;
                newLike.businessProfileID = businessProfileID ?? null;
                const savedLike = await newLike.save();
                AppNotificationController.store(id, story.userID, NotificationType.LIKE_A_STORY, { storyID: story.id, userID: story.userID }).catch((error) => console.error(error));
                return response.send(httpCreated(savedLike, "Story liked successfully"));
            }
            AppNotificationController.destroy(id, story.userID, NotificationType.LIKE_A_STORY, { storyID: story.id, userID: story.userID }).catch((error) => console.error(error));
            await isLiked.deleteOne();
            return response.send(httpNoContent(null, 'Story disliked successfully'));
        }
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
