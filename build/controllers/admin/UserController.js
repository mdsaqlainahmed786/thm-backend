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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_1 = require("mongodb");
const response_1 = require("../../utils/response");
const error_1 = require("../../utils/response-message/error");
const basic_1 = require("../../utils/helper/basic");
const user_model_1 = __importStar(require("../../database/models/user.model"));
const post_model_1 = require("../../database/models/post.model");
const userConnection_model_1 = require("./../../database/models/userConnection.model");
const userConnection_model_2 = __importDefault(require("../../database/models/userConnection.model"));
const businessProfile_model_1 = __importDefault(require("../../database/models/businessProfile.model"));
const common_1 = require("../../common");
const bcrypt_1 = require("bcrypt");
const index = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = request.user;
        if (!id) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        let { pageNumber, documentLimit, query, accountType, businessTypeID, businessSubTypeID, sortBy, sortOrder } = request.query;
        pageNumber = (0, basic_1.parseQueryParam)(pageNumber, 1);
        documentLimit = (0, basic_1.parseQueryParam)(documentLimit, 20);
        const matchQuery = {};
        if (accountType)
            matchQuery.accountType = accountType;
        if (query && query.trim() !== "") {
            matchQuery.$or = [
                { username: { $regex: query, $options: "i" } },
                { name: { $regex: query, $options: "i" } },
                { email: { $regex: query, $options: "i" } },
                { phoneNumber: { $regex: query, $options: "i" } }
            ];
        }
        if (accountType === user_model_1.AccountType.BUSINESS) {
            const businessQuery = {};
            if (query && query.trim() !== "") {
                businessQuery.$or = [
                    { username: { $regex: query, $options: "i" } },
                    { name: { $regex: query, $options: "i" } },
                    { email: { $regex: query, $options: "i" } },
                    { phoneNumber: { $regex: query, $options: "i" } }
                ];
            }
            if (businessTypeID)
                businessQuery.businessTypeID = new mongodb_1.ObjectId(businessTypeID);
            if (businessSubTypeID)
                businessQuery.businessSubTypeID = new mongodb_1.ObjectId(businessSubTypeID);
            const businessIDs = yield businessProfile_model_1.default.distinct("_id", businessQuery);
            matchQuery.businessProfileID = { $in: businessIDs };
        }
        // Filters
        if (sortBy === "inActive") {
            matchQuery.isActivated = false;
        }
        if (sortBy === "unVerified") {
            matchQuery.isVerified = false;
        }
        if (sortBy === "disapproved") {
            matchQuery.isApproved = false;
        }
        // Sorting
        const sortDirection = sortOrder === "asc" ? 1 : -1;
        const isSortFollowers = sortBy === "followers";
        const sortObject = isSortFollowers
            ? { followersCount: sortDirection, createdAt: -1 }
            : { createdAt: -1 };
        const now = new Date();
        if (sortBy === "created_last_1_hour") {
            matchQuery.createdAt = { $gte: new Date(now.getTime() - 1 * 60 * 60 * 1000) };
        }
        if (sortBy === "created_last_1_day") {
            matchQuery.createdAt = { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) };
        }
        if (sortBy === "created_last_1_week") {
            matchQuery.createdAt = { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
        }
        if (sortBy === "created_last_1_month") {
            matchQuery.createdAt = { $gte: new Date(now.setMonth(now.getMonth() - 1)) };
        }
        if (sortBy === "created_last_1_year") {
            matchQuery.createdAt = { $gte: new Date(now.setFullYear(now.getFullYear() - 1)) };
        }
        const pipeline = [
            { $match: matchQuery },
            (0, user_model_1.addBusinessProfileInUser)().lookup,
            {
                $unwind: {
                    path: (0, user_model_1.addBusinessProfileInUser)().unwindLookup.$unwind.path,
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "userconnections",
                    let: { userId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$following", "$$userId"] },
                                        { $eq: ["$status", "accepted"] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: "followersRef"
                }
            },
            {
                $addFields: {
                    followersCount: { $size: "$followersRef" }
                }
            },
            {
                $project: {
                    password: 0,
                    updatedAt: 0,
                    __v: 0,
                    followersRef: 0
                }
            },
            { $sort: sortObject },
            { $skip: (pageNumber - 1) * documentLimit },
            { $limit: documentLimit }
        ];
        const [documents, total] = yield Promise.all([
            user_model_1.default.aggregate(pipeline),
            user_model_1.default.countDocuments(matchQuery)
        ]);
        const totalPages = Math.ceil(total / documentLimit);
        return response.send((0, response_1.httpOkExtended)(documents, "User fetched.", pageNumber, totalPages, total));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_a = error.message) !== null && _a !== void 0 ? _a : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const store = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    try {
        // return response.send(httpNoContent(null, 'Not implemented'));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_b = error.message) !== null && _b !== void 0 ? _b : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const update = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _c;
    try {
        let { id } = request.params;
        const { name, bio, isVerified, isApproved, isActivated, isDeleted, role } = request.body;
        const user = yield user_model_1.default.findOne({ _id: id });
        if (!user) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        user.name = name !== null && name !== void 0 ? name : user.name;
        user.bio = bio !== null && bio !== void 0 ? bio : user.bio;
        user.isVerified = isVerified !== null && isVerified !== void 0 ? isVerified : user.isVerified;
        user.isApproved = isApproved !== null && isApproved !== void 0 ? isApproved : user.isApproved;
        user.isActivated = isActivated !== null && isActivated !== void 0 ? isActivated : user.isActivated;
        if (role && [common_1.Role.USER, common_1.Role.MODERATOR].includes(role)) {
            user.role = role !== null && role !== void 0 ? role : user.role;
        }
        user.isDeleted = isDeleted !== null && isDeleted !== void 0 ? isDeleted : user.isDeleted;
        const savedUser = yield user.save();
        return response.send((0, response_1.httpAcceptedOrUpdated)(savedUser, 'User updated'));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_c = error.message) !== null && _c !== void 0 ? _c : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const destroy = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _d;
    try {
        // return response.send(httpNoContent({}, 'Not implemented'));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_d = error.message) !== null && _d !== void 0 ? _d : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const show = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _e;
    try {
        let { id } = request.params;
        const dbQuery = { _id: new mongodb_1.ObjectId(id) };
        const [user, posts, follower, following] = yield Promise.all([
            user_model_1.default.aggregate([
                {
                    $match: dbQuery
                },
                {
                    $project: {
                        password: 0,
                        updatedAt: 0,
                        __v: 0,
                    }
                },
                (0, user_model_1.addBusinessProfileInUser)().lookup,
                (0, user_model_1.addBusinessProfileInUser)().unwindLookup,
                {
                    '$lookup': {
                        'from': 'businessdocuments',
                        'let': { 'businessProfileID': '$businessProfileID' },
                        'pipeline': [
                            { '$match': { '$expr': { '$eq': ['$businessProfileID', '$$businessProfileID'] } } },
                            {
                                '$project': {
                                    'createdAt': 0,
                                    'updatedAt': 0,
                                    '__v': 0,
                                }
                            }
                        ],
                        'as': 'businessDocumentsRef'
                    }
                },
                {
                    '$lookup': {
                        'from': 'reports',
                        'let': { 'contentID': '$_id' },
                        'pipeline': [
                            { '$match': { '$expr': { '$eq': ['$contentID', '$$contentID'] }, contentType: common_1.ContentType.USER } },
                        ],
                        'as': 'reportsRef'
                    }
                },
                {
                    $addFields: {
                        reportCount: { $size: "$reportsRef" }
                    }
                },
                {
                    $sort: { _id: -1 }
                },
                {
                    $limit: 1
                },
                {
                    $project: {
                        reportsRef: 0
                    }
                }
            ]),
            (0, post_model_1.getPostsCount)(id),
            userConnection_model_2.default.find({ following: id, status: userConnection_model_1.ConnectionStatus.ACCEPTED }).countDocuments(),
            userConnection_model_2.default.find({ follower: id, status: userConnection_model_1.ConnectionStatus.ACCEPTED }).countDocuments(),
        ]);
        if (user.length === 0) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        let responseData = Object.assign({ posts: posts, follower: follower, following: following }, user[0]);
        return response.send((0, response_1.httpOk)(responseData, "User data fetched"));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_e = error.message) !== null && _e !== void 0 ? _e : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const addAdmin = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _f;
    try {
        const { username, adminPassword } = request.body;
        // Find user by username
        const user = yield user_model_1.default.findOne({ username: username });
        if (!user) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        // Check if user is already an administrator
        if (user.role === common_1.Role.ADMINISTRATOR) {
            return response.send((0, response_1.httpBadRequest)(null, "User is already an administrator"));
        }
        // Update role to administrator
        user.role = common_1.Role.ADMINISTRATOR;
        // Set adminPassword if provided, otherwise set to null
        if (adminPassword && adminPassword.trim() !== "") {
            // Hash the admin password before storing
            const salt = yield (0, bcrypt_1.genSalt)(10);
            user.adminPassword = yield (0, bcrypt_1.hash)(adminPassword, salt);
        }
        else {
            user.adminPassword = null;
        }
        // Save the updated user
        const savedUser = yield user.save();
        // Remove sensitive data from response
        const userResponse = savedUser.hideSensitiveData();
        delete userResponse.adminPassword;
        return response.send((0, response_1.httpAcceptedOrUpdated)(userResponse, "User successfully promoted to administrator"));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_f = error.message) !== null && _f !== void 0 ? _f : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
exports.default = { index, store, update, destroy, show, addAdmin };
