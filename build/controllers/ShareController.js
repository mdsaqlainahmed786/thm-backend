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
const like_model_1 = __importDefault(require("../database/models/like.model"));
const eventJoin_model_1 = __importDefault(require("../database/models/eventJoin.model"));
const post_model_1 = require("../database/models/post.model");
const user_model_1 = __importDefault(require("../database/models/user.model"));
const sharedContent_model_1 = __importDefault(require("../database/models/sharedContent.model"));
const mongodb_1 = require("mongodb");
const common_1 = require("../common");
const userConnection_model_1 = require("../database/models/userConnection.model");
const user_model_2 = require("../database/models/user.model");
const user_model_3 = require("../database/models/user.model");
const EncryptionService_1 = __importDefault(require("../services/EncryptionService"));
const encryptionService = new EncryptionService_1.default();
const posts = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const id = (_a = request.user) === null || _a === void 0 ? void 0 : _a.id;
        const { postID, userID, metadata } = request.query;
        if (!postID || !userID) {
            return response.send((0, response_1.httpNotFoundOr404)({}));
        }
        const decryptedPostID = encryptionService.decrypt(postID);
        const decryptedUserID = encryptionService.decrypt(userID);
        const [likedByMe, savedByMe, joiningEvents, user] = yield Promise.all([
            like_model_1.default.distinct('postID', { userID: id, postID: { $ne: null } }),
            (0, post_model_1.getSavedPost)(id),
            eventJoin_model_1.default.distinct('postID', { userID: id, postID: { $ne: null } }),
            user_model_1.default.findOne({ _id: decryptedUserID }),
        ]);
        const [post, isSharedBefore,] = yield Promise.all([
            (0, post_model_1.fetchPosts)(Object.assign({ _id: new mongodb_1.ObjectId(decryptedPostID) }, post_model_1.getPostQuery), likedByMe, savedByMe, joiningEvents, 1, 1),
            sharedContent_model_1.default.findOne({ contentID: decryptedPostID, userID: decryptedUserID, contentType: common_1.ContentType.POST }),
        ]);
        if (!post || (post === null || post === void 0 ? void 0 : post.length) === 0) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.POST_NOT_FOUND), error_1.ErrorMessage.POST_NOT_FOUND));
        }
        if (!user) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        if (metadata) {
            return response.send((0, response_1.httpOk)(post[0], 'Content shared successfully'));
        }
        if (isSharedBefore) {
            return response.send((0, response_1.httpOk)(post[0], 'Content shared successfully'));
        }
        else {
            const newSharedContent = new sharedContent_model_1.default();
            newSharedContent.contentID = decryptedPostID;
            newSharedContent.contentType = common_1.ContentType.POST;
            newSharedContent.userID = user.id; //Shared By
            newSharedContent.businessProfileID = (_b = user.businessProfileID) !== null && _b !== void 0 ? _b : null;
            yield newSharedContent.save();
            return response.send((0, response_1.httpOk)(post[0], "Content shared successfully"));
        }
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_c = error.message) !== null && _c !== void 0 ? _c : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const users = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const requestedUserID = (_a = request.user) === null || _a === void 0 ? void 0 : _a.id;
        const accountType = (_b = request.user) === null || _b === void 0 ? void 0 : _b.accountType;
        const { id, userID } = request.query;
        if (!id || !userID) {
            return response.send((0, response_1.httpNotFoundOr404)({}));
        }
        const decryptedID = encryptionService.decrypt(id);
        const decryptedUserID = encryptionService.decrypt(userID);
        const [user, posts, follower, following, myConnection, isBlocked] = yield (0, user_model_2.getUserPublicProfile)(decryptedID, requestedUserID);
        const [sharedBy, isSharedBefore] = yield Promise.all([
            user_model_1.default.findOne({ _id: decryptedUserID }),
            sharedContent_model_1.default.findOne({ contentID: decryptedID, userID: decryptedUserID, contentType: common_1.ContentType.USER }),
        ]);
        if (!sharedBy) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        if (user.length === 0) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        let responseData = { posts: posts, follower: follower, following: following };
        if (accountType === user_model_3.AccountType.BUSINESS) {
            Object.assign(responseData, Object.assign(Object.assign({}, user[0]), { isConnected: (myConnection === null || myConnection === void 0 ? void 0 : myConnection.status) === userConnection_model_1.ConnectionStatus.ACCEPTED ? true : false, isRequested: (myConnection === null || myConnection === void 0 ? void 0 : myConnection.status) === userConnection_model_1.ConnectionStatus.PENDING ? true : false, isBlockedByMe: isBlocked ? true : false }));
        }
        else {
            Object.assign(responseData, Object.assign(Object.assign({}, user[0]), { isConnected: (myConnection === null || myConnection === void 0 ? void 0 : myConnection.status) === userConnection_model_1.ConnectionStatus.ACCEPTED ? true : false, isRequested: (myConnection === null || myConnection === void 0 ? void 0 : myConnection.status) === userConnection_model_1.ConnectionStatus.PENDING ? true : false, isBlockedByMe: isBlocked ? true : false }));
        }
        if (!isSharedBefore) {
            const newSharedContent = new sharedContent_model_1.default();
            newSharedContent.contentID = decryptedID;
            newSharedContent.contentType = common_1.ContentType.USER;
            newSharedContent.userID = sharedBy.id; //Shared By
            newSharedContent.businessProfileID = (_c = sharedBy.businessProfileID) !== null && _c !== void 0 ? _c : null;
            yield newSharedContent.save();
            return response.send((0, response_1.httpOk)(responseData, "Content shared successfully"));
        }
        return response.send((0, response_1.httpOk)(responseData, 'Content shared successfully'));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_d = error.message) !== null && _d !== void 0 ? _d : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const tester = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    const userAgent = request.headers['user-agent'];
    return response.send({
        userAgent,
    });
});
exports.default = { posts, tester, users };
