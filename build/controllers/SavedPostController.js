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
const response_1 = require("../utils/response");
const error_1 = require("../utils/response-message/error");
const post_model_1 = __importStar(require("../database/models/post.model"));
const savedPost_model_1 = __importDefault(require("../database/models/savedPost.model"));
const basic_1 = require("../utils/helper/basic");
const like_model_1 = __importDefault(require("../database/models/like.model"));
const post_model_2 = require("../database/models/post.model");
const eventJoin_model_1 = __importDefault(require("../database/models/eventJoin.model"));
const index = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = request.user;
        let { pageNumber, documentLimit, query } = request.query;
        pageNumber = (0, basic_1.parseQueryParam)(pageNumber, 1);
        documentLimit = (0, basic_1.parseQueryParam)(documentLimit, 20);
        const [likedByMe, savedByMe, joiningEvents] = yield Promise.all([
            like_model_1.default.distinct('postID', { userID: id, postID: { $ne: null } }),
            (0, post_model_1.getSavedPost)(id),
            eventJoin_model_1.default.distinct('postID', { userID: id, postID: { $ne: null } }),
        ]);
        if (!id) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        const dbQuery = Object.assign(Object.assign({}, post_model_2.getPostQuery), { _id: { $in: savedByMe } });
        const [documents, totalDocument] = yield Promise.all([
            (0, post_model_2.fetchPosts)(dbQuery, likedByMe, savedByMe, joiningEvents, pageNumber, documentLimit),
            (0, post_model_1.countPostDocument)(dbQuery),
        ]);
        const totalPagesCount = Math.ceil(totalDocument / documentLimit) || 1;
        return response.send((0, response_1.httpOkExtended)(documents, 'User feed fetched.', pageNumber, totalPagesCount, totalDocument));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_a = error.message) !== null && _a !== void 0 ? _a : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const store = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const postID = request.params.id;
        const { id, accountType, businessProfileID } = request.user;
        if (!id) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        const [post, isSaved] = yield Promise.all([
            post_model_1.default.findOne({ _id: postID }),
            savedPost_model_1.default.findOne({ postID: postID, userID: id }),
        ]);
        if (!post) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.POST_NOT_FOUND), error_1.ErrorMessage.POST_NOT_FOUND));
        }
        if (!isSaved) {
            const newSavedPost = new savedPost_model_1.default();
            newSavedPost.userID = id;
            newSavedPost.postID = postID;
            newSavedPost.businessProfileID = businessProfileID !== null && businessProfileID !== void 0 ? businessProfileID : null;
            const savedLike = yield newSavedPost.save();
            return response.send((0, response_1.httpCreated)(savedLike, "Post saved successfully"));
        }
        yield isSaved.deleteOne();
        return response.send((0, response_1.httpNoContent)(null, 'Post removed successfully'));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_a = error.message) !== null && _a !== void 0 ? _a : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const update = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // return response.send(httpAcceptedOrUpdated({}, 'Not implemented'));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_a = error.message) !== null && _a !== void 0 ? _a : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const destroy = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // return response.send(httpNoContent({}, 'Not implemented'));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_a = error.message) !== null && _a !== void 0 ? _a : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const show = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // return response.send(httpOk({}, "Not implemented"));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_a = error.message) !== null && _a !== void 0 ? _a : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
exports.default = { index, store, update, destroy };
