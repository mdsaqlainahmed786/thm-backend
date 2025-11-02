import { ObjectId } from 'mongodb';
import { Request, Response, NextFunction } from "express";
import { 
    httpBadRequest, 
    httpCreated, 
    httpInternalServerError, 
    httpNoContent, 
    httpNotFoundOr404, 
    httpOkExtended, 
    httpAcceptedOrUpdated 
} from "../utils/response";
import { ErrorMessage } from "../utils/response-message/error";
import Post from "../database/models/post.model";
import Like from '../database/models/like.model';
import Comment, { addCommentedByInPost, addLikesInComment } from '../database/models/comment.model';
import { parseQueryParam } from '../utils/helper/basic';
import AppNotificationController from './AppNotificationController';
import { NotificationType } from '../database/models/notification.model';
import { getBlockedByUsers } from '../database/models/user.model';


// INDEX (fetch comments for a post)
const index = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id } = request.user;
        const postID = request.params.id;
        let { pageNumber, documentLimit }: any = request.query;

        const dbQuery: any = { postID: new ObjectId(postID), isParent: true, isPublished: true };
        pageNumber = parseQueryParam(pageNumber, 1);
        documentLimit = parseQueryParam(documentLimit, 20);

        if (!id) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }

        const [likedByMe, blockedUsers] = await Promise.all([
            Like.distinct('commentID', { userID: id, commentID: { $ne: null } }),
            getBlockedByUsers(id),
        ]);

        Object.assign(dbQuery, { userID: { $nin: blockedUsers } });

        const [documents, totalDocument] = await Promise.all([
            Comment.aggregate([
                { $match: dbQuery },
                {
                    $lookup: {
                        from: 'comments',
                        let: { parentID: '$_id' },
                        pipeline: [
                            { $match: { $expr: { $eq: ['$parentID', '$$parentID'] }, isPublished: true } },
                            addCommentedByInPost().lookup,
                            addCommentedByInPost().unwindLookup,
                            addLikesInComment().lookup,
                            addLikesInComment().addLikeCount,
                            {
                                $addFields: {
                                    likedByMe: { $in: ['$_id', likedByMe] },
                                }
                            },
                            { $project: { likesRef: 0, updatedAt: 0, __v: 0 } }
                        ],
                        as: 'repliesRef'
                    }
                },
                addCommentedByInPost().lookup,
                addCommentedByInPost().unwindLookup,
                addLikesInComment().lookup,
                addLikesInComment().addLikeCount,
                { $addFields: { likedByMe: { $in: ['$_id', likedByMe] } } },
                { $sort: { createdAt: -1, id: 1 } },
                { $skip: pageNumber > 0 ? ((pageNumber - 1) * documentLimit) : 0 },
                { $limit: documentLimit },
                { $project: { likesRef: 0, updatedAt: 0, __v: 0 } }
            ]).exec(),
            Comment.find(dbQuery).countDocuments(),
        ]);

        const totalPagesCount = Math.ceil(totalDocument / documentLimit) || 1;
        return response.send(httpOkExtended(documents, 'Comments fetched.', pageNumber, totalPagesCount, totalDocument));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
};


// STORE (create comment)
const store = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id, businessProfileID } = request.user;
        const { postID, message, parentID } = request.body;

        if (!id) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }

        const post = await Post.findOne({ _id: postID });
        if (!post) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.POST_NOT_FOUND), ErrorMessage.POST_NOT_FOUND));
        }

        const newComment = new Comment({
            userID: id,
            businessProfileID,
            postID,
            message,
            isParent: !parentID,
        });

        if (parentID) {
            const parentComment = await Comment.findOne({ _id: parentID });
            if (parentComment) {
                newComment.parentID = parentComment.id;
                // notify parent commenter (reply)
                AppNotificationController.store(
                    id,
                    parentComment.userID,
                    NotificationType.REPLY,
                    { postID: post._id, userID: parentComment.userID, message }
                ).catch(console.error);
            }
        } else {
            // notify post owner (new comment)
            AppNotificationController.store(
                id,
                post.userID,
                NotificationType.COMMENT,
                { postID: post._id, userID: post.userID, message, postType: post.postType }
            ).catch(console.error);
        }

        const savedComment = await newComment.save();
        return response.send(httpNoContent(savedComment, 'Comment posted successfully'));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
};


// UPDATE (edit comment)
const update = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id } = request.user;
      const { id: commentID } = request.params;
        const { message } = request.body;

        if (!id || !commentID) {
            return response.send(httpBadRequest(ErrorMessage.invalidRequest("User ID or comment ID missing"), "Invalid request"));
        }

        const comment = await Comment.findById(commentID);
        if (!comment) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest("Comment not found"), "Comment not found"));
        }

        if (comment.userID.toString() !== id.toString()) {
            return response.send(httpBadRequest(ErrorMessage.invalidRequest("Unauthorized action"), "Not your comment"));
        }

        comment.message = message;
        await comment.save();

        return response.send(httpAcceptedOrUpdated(comment, "Comment updated successfully"));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
};


// DESTROY (delete comment)
const destroy = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id } = request.user;
        const { commentID } = request.params;

        const comment = await Comment.findById(commentID);
        if (!comment) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest("Comment not found"), "Comment not found"));
        }

        if (comment.userID.toString() !== id.toString()) {
            return response.send(httpBadRequest(ErrorMessage.invalidRequest("Unauthorized action"), "Not your comment"));
        }

        comment.isPublished = false;
        await comment.save();

        return response.send(httpNoContent(null, "Comment deleted successfully"));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
};

export default { index, store, update, destroy };
