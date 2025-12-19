"use strict";
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
const response_1 = require("../utils/response");
const error_1 = require("../utils/response-message/error");
const post_model_1 = __importDefault(require("../database/models/post.model"));
const like_model_1 = __importDefault(require("../database/models/like.model"));
const comment_model_1 = __importDefault(require("../database/models/comment.model"));
const story_model_1 = __importDefault(require("../database/models/story.model"));
const AppNotificationController_1 = __importDefault(require("../controllers/AppNotificationController"));
const notification_model_1 = require("../database/models/notification.model");
const index = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_a = error.message) !== null && _a !== void 0 ? _a : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const store = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    try {
        //Like post
        if (new RegExp("/posts/likes/").test(request.originalUrl)) {
            const postID = request.params.id;
            const { id, accountType, businessProfileID } = request.user;
            if (!id) {
                return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
            }
            const [post, isLiked] = yield Promise.all([
                post_model_1.default.findOne({ _id: postID }),
                like_model_1.default.findOne({ postID: postID, userID: id }),
            ]);
            if (!post) {
                return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.POST_NOT_FOUND), error_1.ErrorMessage.POST_NOT_FOUND));
            }
            if (!isLiked) {
                const newLike = new like_model_1.default();
                newLike.userID = id;
                newLike.postID = postID;
                newLike.businessProfileID = businessProfileID !== null && businessProfileID !== void 0 ? businessProfileID : null;
                const savedLike = yield newLike.save();
                AppNotificationController_1.default.store(id, post.userID, notification_model_1.NotificationType.LIKE_POST, { postID: post._id, userID: post.userID, postType: post.postType }).catch((error) => console.error(error));
                return response.send((0, response_1.httpCreated)(savedLike, "Post liked successfully"));
            }
            yield isLiked.deleteOne();
            AppNotificationController_1.default.destroy(id, post.userID, notification_model_1.NotificationType.LIKE_POST, { postID: post._id, userID: post.userID, postType: post.postType }).catch((error) => console.error(error));
            return response.send((0, response_1.httpNoContent)(null, 'Post disliked successfully'));
        }
        //Like comment
        if (new RegExp("/posts/comments/likes/").test(request.originalUrl)) {
            const commentID = request.params.id;
            const { id, accountType, businessProfileID } = request.user;
            if (!id) {
                return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
            }
            const [comment, isLiked] = yield Promise.all([
                comment_model_1.default.findOne({ _id: commentID }),
                like_model_1.default.findOne({ commentID: commentID, userID: id }),
            ]);
            if (!comment) {
                return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest("Comment not found"), "Comment not found"));
            }
            if (!isLiked) {
                const newLike = new like_model_1.default();
                newLike.userID = id;
                newLike.commentID = commentID;
                newLike.businessProfileID = businessProfileID !== null && businessProfileID !== void 0 ? businessProfileID : null;
                const savedLike = yield newLike.save();
                AppNotificationController_1.default.store(id, comment.userID, notification_model_1.NotificationType.LIKE_COMMENT, { postID: comment.postID, commentID: comment.id, userID: comment.userID, message: comment.message }).catch((error) => console.error(error));
                return response.send((0, response_1.httpCreated)(savedLike, "Comment liked successfully"));
            }
            yield isLiked.deleteOne();
            AppNotificationController_1.default.destroy(id, comment.userID, notification_model_1.NotificationType.LIKE_COMMENT, { postID: comment.postID, commentID: comment.id, userID: comment.userID, message: comment.message }).catch((error) => console.error(error));
            return response.send((0, response_1.httpNoContent)(null, 'Comment disliked successfully'));
        }
        //Like Story
        if (new RegExp("/story/likes/").test(request.originalUrl)) {
            const storyID = request.params.id;
            const { id, accountType, businessProfileID } = request.user;
            if (!id) {
                return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
            }
            const [story, isLiked] = yield Promise.all([
                story_model_1.default.findOne({ _id: storyID }),
                like_model_1.default.findOne({ storyID: storyID, userID: id }),
            ]);
            if (!story) {
                return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest("Story not found"), "Story not found"));
            }
            if (!isLiked) {
                const newLike = new like_model_1.default();
                newLike.userID = id;
                newLike.storyID = storyID;
                newLike.businessProfileID = businessProfileID !== null && businessProfileID !== void 0 ? businessProfileID : null;
                const savedLike = yield newLike.save();
                AppNotificationController_1.default.store(id, story.userID, notification_model_1.NotificationType.LIKE_A_STORY, { storyID: story._id, userID: story.userID }).catch((error) => console.error(error));
                return response.send((0, response_1.httpCreated)(savedLike, "Story liked successfully"));
            }
            AppNotificationController_1.default.destroy(id, story.userID, notification_model_1.NotificationType.LIKE_A_STORY, { storyID: story._id, userID: story.userID }).catch((error) => console.error(error));
            yield isLiked.deleteOne();
            return response.send((0, response_1.httpNoContent)(null, 'Story disliked successfully'));
        }
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_b = error.message) !== null && _b !== void 0 ? _b : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const update = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _c;
    try {
        // return response.send(httpAcceptedOrUpdated(null, 'Not implemented'));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_c = error.message) !== null && _c !== void 0 ? _c : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const destroy = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _d;
    try {
        // return response.send(httpNoContent(null, 'Not implemented'));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_d = error.message) !== null && _d !== void 0 ? _d : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const show = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _e;
    try {
        // return response.send(httpOk(null, "Not implemented"));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_e = error.message) !== null && _e !== void 0 ? _e : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
exports.default = { index, store, update, destroy };
