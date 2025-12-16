"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_1 = require("mongodb");
const response_1 = require("../utils/response");
const error_1 = require("../utils/response-message/error");
const post_model_1 = __importDefault(require("../database/models/post.model"));
const like_model_1 = __importDefault(require("../database/models/like.model"));
const comment_model_1 = __importStar(require("../database/models/comment.model"));
const basic_1 = require("../utils/helper/basic");
const AppNotificationController_1 = __importDefault(require("./AppNotificationController"));
const notification_model_1 = require("../database/models/notification.model");
const user_model_1 = require("../database/models/user.model");
// INDEX (fetch comments for a post)
const index = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = request.user;
        const postID = request.params.id;
        let { pageNumber, documentLimit } = request.query;
        const dbQuery = { postID: new mongodb_1.ObjectId(postID), isParent: true, isPublished: true };
        pageNumber = (0, basic_1.parseQueryParam)(pageNumber, 1);
        documentLimit = (0, basic_1.parseQueryParam)(documentLimit, 20);
        if (!id) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        const [likedByMe, blockedUsers] = yield Promise.all([
            like_model_1.default.distinct('commentID', { userID: id, commentID: { $ne: null } }),
            (0, user_model_1.getBlockedByUsers)(id),
        ]);
        Object.assign(dbQuery, { userID: { $nin: blockedUsers } });
        const [documents, totalDocument] = yield Promise.all([
            comment_model_1.default.aggregate([
                { $match: dbQuery },
                {
                    $lookup: {
                        from: 'comments',
                        let: { parentID: '$_id' },
                        pipeline: [
                            { $match: { $expr: { $eq: ['$parentID', '$$parentID'] }, isPublished: true } },
                            (0, comment_model_1.addCommentedByInPost)().lookup,
                            (0, comment_model_1.addCommentedByInPost)().unwindLookup,
                            (0, comment_model_1.addLikesInComment)().lookup,
                            (0, comment_model_1.addLikesInComment)().addLikeCount,
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
                (0, comment_model_1.addCommentedByInPost)().lookup,
                (0, comment_model_1.addCommentedByInPost)().unwindLookup,
                (0, comment_model_1.addLikesInComment)().lookup,
                (0, comment_model_1.addLikesInComment)().addLikeCount,
                { $addFields: { likedByMe: { $in: ['$_id', likedByMe] } } },
                { $sort: { createdAt: -1, id: 1 } },
                { $skip: pageNumber > 0 ? ((pageNumber - 1) * documentLimit) : 0 },
                { $limit: documentLimit },
                { $project: { likesRef: 0, updatedAt: 0, __v: 0 } }
            ]).exec(),
            comment_model_1.default.find(dbQuery).countDocuments(),
        ]);
        const totalPagesCount = Math.ceil(totalDocument / documentLimit) || 1;
        return response.send((0, response_1.httpOkExtended)(documents, 'Comments fetched.', pageNumber, totalPagesCount, totalDocument));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_a = error.message) !== null && _a !== void 0 ? _a : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
// STORE (create comment)
const store = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id, businessProfileID } = request.user;
        const { postID, message, parentID } = request.body;
        if (!id) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        const post = yield post_model_1.default.findOne({ _id: postID });
        if (!post) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.POST_NOT_FOUND), error_1.ErrorMessage.POST_NOT_FOUND));
        }
        const newComment = new comment_model_1.default({
            userID: id,
            businessProfileID,
            postID,
            message,
            isParent: !parentID,
        });
        if (parentID) {
            const parentComment = yield comment_model_1.default.findOne({ _id: parentID });
            if (parentComment) {
                newComment.parentID = parentComment.id;
                // notify parent commenter (reply)
                AppNotificationController_1.default.store(id, parentComment.userID, notification_model_1.NotificationType.REPLY, { postID: post._id, userID: parentComment.userID, message }).catch(console.error);
            }
        }
        else {
            // notify post owner (new comment)
            AppNotificationController_1.default.store(id, post.userID, notification_model_1.NotificationType.COMMENT, { postID: post._id, userID: post.userID, message, postType: post.postType }).catch(console.error);
        }
        const savedComment = yield newComment.save();
        return response.send((0, response_1.httpNoContent)(savedComment, 'Comment posted successfully'));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_a = error.message) !== null && _a !== void 0 ? _a : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
// UPDATE (edit comment)
const update = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = request.user;
        const { id: commentID } = request.params;
        const { message } = request.body;
        if (!id || !commentID) {
            return response.send((0, response_1.httpBadRequest)(error_1.ErrorMessage.invalidRequest("User ID or comment ID missing"), "Invalid request"));
        }
        const comment = yield comment_model_1.default.findById(commentID);
        if (!comment) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest("Comment not found"), "Comment not found"));
        }
        if (comment.userID.toString() !== id.toString()) {
            return response.send((0, response_1.httpBadRequest)(error_1.ErrorMessage.invalidRequest("Unauthorized action"), "Not your comment"));
        }
        comment.message = message;
        yield comment.save();
        return response.send((0, response_1.httpAcceptedOrUpdated)(comment, "Comment updated successfully"));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_a = error.message) !== null && _a !== void 0 ? _a : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
// DESTROY (delete comment)
const destroy = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = request.user;
        const { id: commentID } = request.params;
        const comment = yield comment_model_1.default.findById(commentID);
        if (!comment) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest("Comment not found"), "Comment not found"));
        }
        if (comment.userID.toString() !== id.toString()) {
            return response.send((0, response_1.httpBadRequest)(error_1.ErrorMessage.invalidRequest("Unauthorized action"), "Not your comment"));
        }
        comment.isPublished = false;
        yield comment.save();
        return response.send((0, response_1.httpNoContent)(null, "Comment deleted successfully"));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_a = error.message) !== null && _a !== void 0 ? _a : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
exports.default = { index, store, update, destroy };
