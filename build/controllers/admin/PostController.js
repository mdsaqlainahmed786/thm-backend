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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const basic_1 = require("../../utils/helper/basic");
const response_1 = require("../../utils/response");
const error_1 = require("../../utils/response-message/error");
const post_model_1 = __importStar(require("../../database/models/post.model"));
const user_model_1 = require("../../database/models/user.model");
const common_1 = require("../../common");
const anonymousUser_model_1 = require("../../database/models/anonymousUser.model");
const businessProfile_model_1 = require("../../database/models/businessProfile.model");
const postTypes = Object.values(post_model_1.PostType);
const index = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = request.user;
        let { pageNumber, documentLimit, query, postType, sortBy, sortOrder } = request.query;
        pageNumber = (0, basic_1.parseQueryParam)(pageNumber, 1);
        documentLimit = (0, basic_1.parseQueryParam)(documentLimit, 20);
        const sortDirection = (sortOrder === "asc" ? 1 : -1);
        const sortObject = sortBy === "views" ? { views: sortDirection } :
            sortBy === "likes" ? { likeCount: sortDirection } :
                sortBy === "reportCount" ? { reportCount: sortDirection } :
                    { createdAt: -1 };
        const dbQuery = {};
        if (postType && postTypes.includes(postType)) {
            Object.assign(dbQuery, { postType: postType });
        }
        const [documents, totalDocument] = yield Promise.all([
            post_model_1.default.aggregate([
                {
                    $match: dbQuery
                },
                (0, post_model_1.addMediaInPost)().lookup,
                {
                    '$lookup': {
                        'from': 'businessprofiles',
                        'let': { 'reviewedBusinessProfileID': '$reviewedBusinessProfileID' },
                        'pipeline': [
                            { '$match': { '$expr': { '$eq': ['$_id', '$$reviewedBusinessProfileID'] } } },
                            (0, businessProfile_model_1.addUserInBusinessProfile)().lookup,
                            (0, businessProfile_model_1.addUserInBusinessProfile)().unwindLookup,
                            {
                                '$project': {
                                    "_id": {
                                        '$ifNull': [{ '$ifNull': ['$usersRef._id', ''] }, '']
                                    },
                                    "accountType": {
                                        '$ifNull': [{ '$ifNull': ['$usersRef.accountType', ''] }, '']
                                    },
                                    "username": 1,
                                    "profilePic": 1,
                                    "name": 1,
                                    "coverImage": 1,
                                }
                            }
                        ],
                        'as': 'reviewedBusinessProfileRef'
                    }
                },
                {
                    '$unwind': {
                        'path': '$reviewedBusinessProfileRef',
                        'preserveNullAndEmptyArrays': true //false value does not fetch relationship.
                    }
                },
                {
                    '$lookup': {
                        'from': 'users',
                        'let': { 'userID': '$userID' },
                        'pipeline': [
                            { '$match': { '$expr': { '$eq': ['$_id', '$$userID'] } } },
                            (0, user_model_1.addBusinessProfileInUser)().lookup,
                            (0, user_model_1.addBusinessProfileInUser)().mergeObject,
                            (0, user_model_1.profileBasicProject)(),
                        ],
                        'as': 'postedBy'
                    }
                },
                {
                    '$lookup': {
                        from: "likes",
                        localField: "_id",
                        'foreignField': 'postID',
                        'as': 'likes'
                    }
                },
                {
                    '$addFields': {
                        'likeCount': { '$size': '$likes' }
                    }
                },
                {
                    '$unwind': {
                        'path': '$postedBy',
                        'preserveNullAndEmptyArrays': true //false value does not fetch relationship.
                    }
                },
                (0, anonymousUser_model_1.addAnonymousUserInPost)().lookup,
                (0, anonymousUser_model_1.addAnonymousUserInPost)().unwindLookup,
                {
                    '$lookup': {
                        'from': 'anonymoususers',
                        'let': { 'googleReviewedBusiness': '$googleReviewedBusiness' },
                        'pipeline': [
                            { '$match': { '$expr': { '$eq': ['$_id', '$$googleReviewedBusiness'] } } },
                            {
                                '$project': {
                                    "accountType": 1,
                                    "username": 1,
                                    "profilePic": 1,
                                    "name": 1,
                                    "coverImage": 1,
                                }
                            }
                        ],
                        'as': 'googleReviewedBusinessRef'
                    }
                },
                {
                    '$unwind': {
                        'path': '$googleReviewedBusinessRef',
                        'preserveNullAndEmptyArrays': true //false value does not fetch relationship.
                    }
                },
                {
                    '$lookup': {
                        'from': 'reports',
                        'let': { 'contentID': '$_id' },
                        'pipeline': [
                            { '$match': { '$expr': { '$eq': ['$contentID', '$$contentID'] }, contentType: common_1.ContentType.POST } },
                        ],
                        'as': 'reports'
                    }
                },
                {
                    $addFields: {
                        reviewedBusinessProfileRef: {
                            $cond: {
                                if: { $eq: [{ $ifNull: ["$reviewedBusinessProfileRef", null] }, null] }, // Check if field is null or doesn't exist
                                then: "$googleReviewedBusinessRef", // Replace with googleReviewedBusinessRef
                                else: "$reviewedBusinessProfileRef" // Keep the existing value if it exists
                            }
                        },
                        postedBy: {
                            $cond: {
                                if: { $eq: [{ $ifNull: ["$postedBy", null] }, null] }, // Check if field is null or doesn't exist
                                then: "$publicPostedBy", // Replace with publicPostedBy
                                else: "$postedBy" // Keep the existing value if it exists
                            }
                        }
                    }
                },
                {
                    $addFields: {
                        reportCount: { $size: "$reports" }
                    }
                },
                { $sort: sortObject },
                {
                    $skip: pageNumber > 0 ? ((pageNumber - 1) * documentLimit) : 0
                },
                {
                    $limit: documentLimit
                },
                {
                    $unset: [
                        "publicPostedBy",
                        "googleReviewedBusinessRef",
                        "reports",
                        "__v"
                    ]
                }
            ]),
            (0, post_model_1.countPostDocument)(dbQuery),
        ]);
        const totalPagesCount = Math.ceil(totalDocument / documentLimit) || 1;
        return response.send((0, response_1.httpOkExtended)(documents, 'Posts fetched.', pageNumber, totalPagesCount, totalDocument));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_a = error.message) !== null && _a !== void 0 ? _a : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const store = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    try {
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_b = error.message) !== null && _b !== void 0 ? _b : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const update = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _c, _d;
    try {
        const ID = (_c = request === null || request === void 0 ? void 0 : request.params) === null || _c === void 0 ? void 0 : _c.id;
        const { isPublished, content, name, venue, streamingLink, startDate, startTime, endDate, endTime, type, feelings, rating } = request.body;
        const post = yield post_model_1.default.findOne({ _id: ID });
        if (!post) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.POST_NOT_FOUND), error_1.ErrorMessage.POST_NOT_FOUND));
        }
        post.isPublished = isPublished !== null && isPublished !== void 0 ? isPublished : post.isPublished;
        post.content = content !== null && content !== void 0 ? content : post.content;
        if (post.postType === post_model_1.PostType.EVENT) {
            post.name = name !== null && name !== void 0 ? name : post.name;
            post.venue = venue !== null && venue !== void 0 ? venue : post.venue;
            post.streamingLink = streamingLink !== null && streamingLink !== void 0 ? streamingLink : venue.streamingLink;
            post.startDate = startDate !== null && startDate !== void 0 ? startDate : post.startDate;
            post.startTime = startTime !== null && startTime !== void 0 ? startTime : post.startTime;
            post.endDate = endDate !== null && endDate !== void 0 ? endDate : post.endDate;
            post.endTime = endTime !== null && endTime !== void 0 ? endTime : post.endTime;
            post.type = type !== null && type !== void 0 ? type : post.type;
        }
        if (post.postType === post_model_1.PostType.REVIEW) {
            post.rating = rating !== null && rating !== void 0 ? rating : post.rating;
        }
        // post.code = code ?? post.code;
        // post.priceType = priceType ?? post.priceType;
        // post.value = value ?? post.value;
        // post.cartValue = cartValue ?? post.cartValue;
        // post.redeemedCount = redeemedCount ?? post.redeemedCount;
        // post.quantity = quantity ?? post.quantity;
        // post.validFrom = validFrom ?? post.validFrom;
        // post.validTo = validTo ?? post.validTo;
        // post.maxDiscount = maxDiscount ?? post.maxDiscount;
        // post.type = type ?? post.type;
        const savedPromoCode = yield post.save();
        return response.send((0, response_1.httpAcceptedOrUpdated)(savedPromoCode, 'Post updated'));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_d = error.message) !== null && _d !== void 0 ? _d : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const destroy = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _e;
    try {
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_e = error.message) !== null && _e !== void 0 ? _e : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const show = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _f;
    try {
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_f = error.message) !== null && _f !== void 0 ? _f : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
exports.default = { index, store, update, destroy, show };
