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
Object.defineProperty(exports, "__esModule", { value: true });
const response_1 = require("../utils/response");
const error_1 = require("../utils/response-message/error");
const post_model_1 = require("../database/models/post.model");
const user_model_1 = __importStar(require("../database/models/user.model"));
const basic_1 = require("../utils/helper/basic");
const response_2 = require("../utils/response");
const user_model_2 = require("../database/models/user.model");
const businessProfile_model_1 = require("../database/models/businessProfile.model");
const user_model_3 = require("../database/models/user.model");
//FIXME deleted user and disabled user check
const index = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id, accountType, businessProfileID } = request.user;
        let { pageNumber, documentLimit, query, type, businessTypeID } = request.query;
        if (!accountType && !id) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        pageNumber = (0, basic_1.parseQueryParam)(pageNumber, 1);
        documentLimit = (0, basic_1.parseQueryParam)(documentLimit, 20);
        const dbQuery = {};
        let documents = [];
        let totalDocument = 0;
        let totalPagesCount = 0;
        let businessProfileIDs = [];
        if (type === "users") {
            const { documents, totalDocument, totalPagesCount } = yield searchUsers(request);
            return response.send((0, response_2.httpOkExtended)(documents, 'Profile fetched.', pageNumber, totalPagesCount, totalDocument));
        }
        else if (type === "business") {
            const { documents, totalDocument, totalPagesCount } = yield searchBusinessUsers(request);
            return response.send((0, response_2.httpOkExtended)(documents, 'Profile fetched.', pageNumber, totalPagesCount, totalDocument));
        }
        else if (type === "posts") {
            //FIXME need to add geolocation or mach more
            Object.assign(dbQuery, Object.assign({ postType: post_model_1.PostType.POST }, post_model_1.getPostQuery));
            const userQuery = Object.assign(Object.assign({}, user_model_3.activeUserQuery), { privateAccount: false });
            businessProfileIDs = yield (0, businessProfile_model_1.fetchBusinessIDs)(query, businessTypeID);
            if (businessTypeID && businessTypeID !== '') {
                Object.assign(userQuery, { businessProfileID: { $in: businessProfileIDs } });
            }
            if (query !== undefined && query !== "") {
                Object.assign(userQuery, {
                    $or: [
                        Object.assign(Object.assign({ name: { $regex: new RegExp(query.toLowerCase(), "i") } }, user_model_3.activeUserQuery), { privateAccount: false }),
                        Object.assign(Object.assign({ username: { $regex: new RegExp(query.toLowerCase(), "i") } }, user_model_3.activeUserQuery), { privateAccount: false }),
                        Object.assign(Object.assign({ businessProfileID: { $in: businessProfileIDs } }, user_model_3.activeUserQuery), { privateAccount: false })
                    ]
                });
            }
            const userIDs = yield user_model_1.default.distinct('_id', userQuery);
            if (query !== undefined && query !== "") {
                Object.assign(dbQuery, {
                    $or: [
                        Object.assign({ content: { $regex: new RegExp(query.toLowerCase(), "i") } }, post_model_1.getPostQuery),
                        Object.assign({ "location.placeName": { $regex: new RegExp(query.toLowerCase(), "i") } }, post_model_1.getPostQuery),
                        Object.assign({ userID: { $in: userIDs } }, post_model_1.getPostQuery)
                    ]
                });
            }
            else {
                Object.assign(dbQuery, { userID: { $in: userIDs } });
            }
            [documents, totalDocument] = yield Promise.all([
                (0, post_model_1.fetchPosts)(dbQuery, [], [], [], pageNumber, documentLimit),
                (0, post_model_1.countPostDocument)(dbQuery),
            ]);
            totalPagesCount = Math.ceil(totalDocument / documentLimit) || 1;
            return response.send((0, response_2.httpOkExtended)(documents, 'Posts fetched.', pageNumber, totalPagesCount, totalDocument));
        }
        else if (type === "events") {
            Object.assign(dbQuery, Object.assign({ postType: post_model_1.PostType.EVENT }, post_model_1.getPostQuery));
            const userQuery = Object.assign(Object.assign({}, user_model_3.activeUserQuery), { privateAccount: false });
            businessProfileIDs = yield (0, businessProfile_model_1.fetchBusinessIDs)(query, businessTypeID);
            //FIXME need to add geolocation or mach more
            if (businessTypeID && businessTypeID !== '') {
                Object.assign(userQuery, { businessProfileID: { $in: businessProfileIDs } });
            }
            if (query !== undefined && query !== "") {
                Object.assign(userQuery, {
                    $or: [
                        Object.assign(Object.assign({ name: { $regex: new RegExp(query.toLowerCase(), "i") } }, user_model_3.activeUserQuery), { privateAccount: false }),
                        Object.assign(Object.assign({ username: { $regex: new RegExp(query.toLowerCase(), "i") } }, user_model_3.activeUserQuery), { privateAccount: false }),
                        Object.assign(Object.assign({ businessProfileID: { $in: businessProfileIDs } }, user_model_3.activeUserQuery), { privateAccount: false })
                    ]
                });
            }
            const userIDs = yield user_model_1.default.distinct('_id', userQuery);
            if (query !== undefined && query !== "") {
                Object.assign(dbQuery, {
                    $or: [
                        Object.assign({ content: { $regex: new RegExp(query.toLowerCase(), "i") } }, post_model_1.getPostQuery),
                        Object.assign({ name: { $regex: new RegExp(query.toLowerCase(), "i") } }, post_model_1.getPostQuery),
                        Object.assign({ venue: { $regex: new RegExp(query.toLowerCase(), "i") } }, post_model_1.getPostQuery),
                        Object.assign({ "location.placeName": { $regex: new RegExp(query.toLowerCase(), "i") } }, post_model_1.getPostQuery),
                        Object.assign({ userID: { $in: userIDs } }, post_model_1.getPostQuery)
                    ]
                });
            }
            else {
                Object.assign(dbQuery, { userID: { $in: userIDs } });
            }
            [documents, totalDocument] = yield Promise.all([
                (0, post_model_1.fetchPosts)(dbQuery, [], [], [], pageNumber, documentLimit),
                (0, post_model_1.countPostDocument)(dbQuery),
            ]);
            totalPagesCount = Math.ceil(totalDocument / documentLimit) || 1;
            return response.send((0, response_2.httpOkExtended)(documents, 'Events fetched.', pageNumber, totalPagesCount, totalDocument));
        }
        else if (type === "reviews") {
            Object.assign(dbQuery, Object.assign({ postType: post_model_1.PostType.REVIEW }, post_model_1.getPostQuery));
            const userQuery = Object.assign(Object.assign({}, user_model_3.activeUserQuery), { privateAccount: false });
            businessProfileIDs = yield (0, businessProfile_model_1.fetchBusinessIDs)(query, businessTypeID);
            //FIXME need to add geolocation or mach more
            if (businessTypeID && businessTypeID !== '') {
                Object.assign(userQuery, { businessProfileID: { $in: businessProfileIDs } });
            }
            if (query !== undefined && query !== "") {
                Object.assign(userQuery, {
                    $or: [
                        Object.assign(Object.assign({ name: { $regex: new RegExp(query.toLowerCase(), "i") } }, user_model_3.activeUserQuery), { privateAccount: false }),
                        Object.assign(Object.assign({ username: { $regex: new RegExp(query.toLowerCase(), "i") } }, user_model_3.activeUserQuery), { privateAccount: false }),
                        Object.assign(Object.assign({ businessProfileID: { $in: businessProfileIDs } }, user_model_3.activeUserQuery), { privateAccount: false })
                    ]
                });
            }
            const userIDs = yield user_model_1.default.distinct('_id', userQuery);
            if (query !== undefined && query !== "") {
                Object.assign(dbQuery, {
                    $or: [
                        Object.assign({ content: { $regex: new RegExp(query.toLowerCase(), "i") } }, post_model_1.getPostQuery),
                        Object.assign({ "location.placeName": { $regex: new RegExp(query.toLowerCase(), "i") } }, post_model_1.getPostQuery),
                        Object.assign({ userID: { $in: userIDs } }, post_model_1.getPostQuery)
                    ]
                });
            }
            else {
                Object.assign(dbQuery, { userID: { $in: userIDs } });
            }
            [documents, totalDocument] = yield Promise.all([
                (0, post_model_1.fetchPosts)(dbQuery, [], [], [], pageNumber, documentLimit),
                (0, post_model_1.countPostDocument)(dbQuery),
            ]);
            totalPagesCount = Math.ceil(totalDocument / documentLimit) || 1;
            return response.send((0, response_2.httpOkExtended)(documents, 'Reviews fetched.', pageNumber, totalPagesCount, totalDocument));
        }
        else {
            return response.send((0, response_1.httpBadRequest)(error_1.ErrorMessage.invalidRequest("Invalid type. Type must be business | users | posts | events | reviews"), "Invalid type. Type must be business | users | posts | events | reviews"));
        }
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_a = error.message) !== null && _a !== void 0 ? _a : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const store = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // return response.send(httpAcceptedOrUpdated(null, 'Not implemented'));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_a = error.message) !== null && _a !== void 0 ? _a : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const update = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // return response.send(httpAcceptedOrUpdated(null, 'Not implemented'));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_a = error.message) !== null && _a !== void 0 ? _a : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const destroy = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // return response.send(httpOk(null, "Not implemented"));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_a = error.message) !== null && _a !== void 0 ? _a : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const show = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // return response.send(httpOk(null, "Not implemented"));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_a = error.message) !== null && _a !== void 0 ? _a : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
//FIXME radius based
const searchBusinessUsers = (request) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, accountType, businessProfileID } = request.user;
    let { pageNumber, documentLimit, query, businessTypeID, lat, lng, radius } = request.query;
    pageNumber = (0, basic_1.parseQueryParam)(pageNumber, 1);
    documentLimit = (0, basic_1.parseQueryParam)(documentLimit, 20);
    const dbQuery = {};
    //Remove blocked user from search
    let [blockedUsers, businessProfileIDs] = yield Promise.all([
        (0, user_model_1.getBlockedByUsers)(id),
        (0, businessProfile_model_1.fetchBusinessIDs)(query, businessTypeID, lat, lng, radius)
    ]);
    Object.assign(dbQuery, Object.assign(Object.assign({}, user_model_3.activeUserQuery), { _id: { $nin: blockedUsers }, businessProfileID: { $in: businessProfileIDs }, accountType: user_model_1.AccountType.BUSINESS }));
    const [documents, totalDocument] = yield Promise.all([
        (0, user_model_2.getUserProfile)(dbQuery, pageNumber, documentLimit),
        user_model_1.default.find(dbQuery).countDocuments()
    ]);
    let totalPagesCount = Math.ceil(totalDocument / documentLimit) || 1;
    return { documents, totalDocument, totalPagesCount };
});
const searchUsers = (request) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, accountType, businessProfileID } = request.user;
    let { pageNumber, documentLimit, query } = request.query;
    pageNumber = (0, basic_1.parseQueryParam)(pageNumber, 1);
    documentLimit = (0, basic_1.parseQueryParam)(documentLimit, 20);
    const blockedUsers = yield (0, user_model_1.getBlockedByUsers)(id);
    const dbQuery = Object.assign(Object.assign({}, user_model_3.activeUserQuery), { _id: { $nin: blockedUsers }, accountType: user_model_1.AccountType.INDIVIDUAL });
    if (query !== undefined && query !== "") {
        Object.assign(dbQuery, {
            $or: [
                { name: { $regex: new RegExp(query.toLowerCase(), "i") }, },
                { username: { $regex: new RegExp(query.toLowerCase(), "i") }, }
            ]
        });
    }
    const [documents, totalDocument] = yield Promise.all([
        (0, user_model_2.getUserProfile)(dbQuery, pageNumber, documentLimit),
        user_model_1.default.find(dbQuery).countDocuments()
    ]);
    let totalPagesCount = Math.ceil(totalDocument / documentLimit) || 1;
    return { documents, totalDocument, totalPagesCount };
});
exports.default = { index, store, update, destroy };
