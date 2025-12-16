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
const response_1 = require("../../utils/response");
const error_1 = require("../../utils/response-message/error");
const basic_1 = require("../../utils/helper/basic");
const reviews_model_1 = __importDefault(require("../../database/models/reviews.model"));
const user_model_1 = require("../../database/models/user.model");
const post_model_1 = __importStar(require("../../database/models/post.model"));
const post_model_2 = require("../../database/models/post.model");
const businessProfile_model_1 = require("../../database/models/businessProfile.model");
const anonymousUser_model_1 = require("../../database/models/anonymousUser.model");
const common_1 = require("../../common");
const index = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = request.user;
        let { pageNumber, documentLimit, query, postType } = request.query;
        pageNumber = (0, basic_1.parseQueryParam)(pageNumber, 1);
        documentLimit = (0, basic_1.parseQueryParam)(documentLimit, 20);
        const dbQuery = { postType: post_model_1.PostType.REVIEW };
        if (!id) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        if (query !== undefined && query !== "") {
            Object.assign(dbQuery, {
                $or: [
                    { content: { $regex: new RegExp(query.toLowerCase(), "i") }, },
                    { name: { $regex: new RegExp(query.toLowerCase(), "i") }, },
                    { email: { $regex: new RegExp(query.toLowerCase(), "i") }, },
                    { businessName: { $regex: new RegExp(query.toLowerCase(), "i") }, },
                ]
            });
        }
        // if (postType && postTypes.includes(postType)) {
        //     Object.assign(dbQuery, { postType: postType })
        // }
        const [documents, totalDocument] = yield Promise.all([
            post_model_1.default.aggregate([
                {
                    $match: dbQuery
                },
                {
                    $match: dbQuery
                },
                (0, post_model_2.addMediaInPost)().lookup,
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
                {
                    $sort: { createdAt: -1, id: 1 }
                },
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
        return response.send((0, response_1.httpOkExtended)(documents, 'Reviews fetched.', pageNumber, totalPagesCount, totalDocument));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_a = error.message) !== null && _a !== void 0 ? _a : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
//FIXME Change Review => Post
const destroy = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const ID = (_a = request === null || request === void 0 ? void 0 : request.params) === null || _a === void 0 ? void 0 : _a.id;
        const review = yield reviews_model_1.default.findOne({ _id: ID });
        if (!review) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest("Review not found"), "Review not found"));
        }
        yield review.deleteOne();
        return response.send((0, response_1.httpNoContent)(null, 'Review deleted'));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_b = error.message) !== null && _b !== void 0 ? _b : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
exports.default = { index, destroy };
