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
const user_model_1 = require("./../database/models/user.model");
const response_1 = require("../utils/response");
const user_model_2 = __importStar(require("../database/models/user.model"));
const error_1 = require("../utils/response-message/error");
const mongodb_1 = require("mongodb");
const businessProfile_model_1 = __importDefault(require("../database/models/businessProfile.model"));
const businessDocument_model_1 = __importDefault(require("../database/models/businessDocument.model"));
const MediaController_1 = require("./MediaController");
const businessType_model_1 = __importDefault(require("../database/models/businessType.model"));
const businessSubType_model_1 = __importDefault(require("../database/models/businessSubType.model"));
const post_model_1 = __importStar(require("../database/models/post.model"));
const userConnection_model_1 = __importStar(require("../database/models/userConnection.model"));
const basic_1 = require("../utils/helper/basic");
const like_model_1 = __importDefault(require("../database/models/like.model"));
const media_model_1 = __importStar(require("../database/models/media.model"));
const common_1 = require("../common");
const MediaController_2 = require("./MediaController");
const MediaController_3 = require("./MediaController");
const propertyPicture_model_1 = __importDefault(require("../database/models/propertyPicture.model"));
const constants_1 = require("../config/constants");
const constants_2 = require("../config/constants");
const blockedUser_model_1 = __importDefault(require("../database/models/blockedUser.model"));
const eventJoin_model_1 = __importDefault(require("../database/models/eventJoin.model"));
const user_address_model_1 = __importDefault(require("../database/models/user-address.model"));
const success_1 = require("../utils/response-message/success");
const EnvironmentService_1 = __importDefault(require("../services/EnvironmentService"));
const editProfile = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { dialCode, phoneNumber, bio, acceptedTerms, website, name, gstn, email, businessTypeID, businessSubTypeID, privateAccount, notificationEnabled, profession, language, username } = request.body;
        const { id } = request.user;
        const user = yield user_model_2.default.findOne({ _id: id });
        if (!user) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        if (user.accountType === user_model_2.AccountType.BUSINESS) {
            user.acceptedTerms = acceptedTerms !== null && acceptedTerms !== void 0 ? acceptedTerms : user.acceptedTerms;
            user.privateAccount = privateAccount !== null && privateAccount !== void 0 ? privateAccount : user.privateAccount;
            user.notificationEnabled = notificationEnabled !== null && notificationEnabled !== void 0 ? notificationEnabled : user.notificationEnabled;
            user.bio = bio !== null && bio !== void 0 ? bio : user.bio;
            user.language = language !== null && language !== void 0 ? language : user.language;
            const businessProfileRef = yield businessProfile_model_1.default.findOne({ _id: user.businessProfileID });
            if (businessProfileRef) {
                // Enforce unique phone numbers across BOTH Users and BusinessProfiles
                // (excluding the current user/business profile)
                if (phoneNumber && phoneNumber !== "" && phoneNumber !== businessProfileRef.phoneNumber) {
                    const [existingUser, existingBusinessProfile] = yield Promise.all([
                        user_model_2.default.findOne({ phoneNumber: phoneNumber, _id: { $ne: user._id } }),
                        businessProfile_model_1.default.findOne({ phoneNumber: phoneNumber, _id: { $ne: businessProfileRef._id } }),
                    ]);
                    if (existingUser || existingBusinessProfile) {
                        return response.send((0, response_1.httpBadRequest)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.PHONE_NUMBER_IN_USE), error_1.ErrorMessage.PHONE_NUMBER_IN_USE));
                    }
                }
                businessProfileRef.bio = bio !== null && bio !== void 0 ? bio : businessProfileRef.bio;
                businessProfileRef.website = website !== null && website !== void 0 ? website : businessProfileRef.website;
                businessProfileRef.phoneNumber = phoneNumber !== null && phoneNumber !== void 0 ? phoneNumber : businessProfileRef.phoneNumber;
                businessProfileRef.dialCode = dialCode !== null && dialCode !== void 0 ? dialCode : businessProfileRef.dialCode;
                businessProfileRef.name = name !== null && name !== void 0 ? name : businessProfileRef.name;
                businessProfileRef.gstn = gstn !== null && gstn !== void 0 ? gstn : businessProfileRef.gstn;
                businessProfileRef.email = email !== null && email !== void 0 ? email : businessProfileRef.email;
                businessProfileRef.privateAccount = privateAccount !== null && privateAccount !== void 0 ? privateAccount : businessProfileRef.privateAccount;
                // Update username if provided and check for uniqueness
                if (username && username !== "" && username !== businessProfileRef.username) {
                    const existingBusinessProfile = yield businessProfile_model_1.default.findOne({ username: username, _id: { $ne: businessProfileRef._id } });
                    if (existingBusinessProfile) {
                        return response.send((0, response_1.httpBadRequest)(error_1.ErrorMessage.invalidRequest("Username is already taken"), "Username is already taken"));
                    }
                    businessProfileRef.username = username;
                }
                /**
                 *
                 * Ensure the business or business sub type is exits or not
                 */
                if (businessTypeID && businessTypeID !== "" && businessSubTypeID && businessSubTypeID && businessSubTypeID !== "") {
                    const [businessType, businessSubType] = yield Promise.all([
                        businessType_model_1.default.findOne({ _id: businessTypeID }),
                        businessSubType_model_1.default.findOne({ businessTypeID: businessTypeID, _id: businessSubTypeID })
                    ]);
                    if ((!businessType) || (!businessSubType)) {
                        return response.send((0, response_1.httpBadRequest)('Either business type or business subtype not found'));
                    }
                    businessProfileRef.businessTypeID = businessTypeID !== null && businessTypeID !== void 0 ? businessTypeID : businessProfileRef.businessTypeID;
                    businessProfileRef.businessSubTypeID = businessSubTypeID !== null && businessSubTypeID !== void 0 ? businessSubTypeID : businessProfileRef.businessSubTypeID;
                }
                yield businessProfileRef.save();
            }
            const savedUser = yield user.save();
            return response.send((0, response_1.httpOk)(Object.assign(Object.assign({}, savedUser.hideSensitiveData()), { businessProfileRef }), success_1.SuccessMessage.PROFILE_UPDATE));
        }
        else {
            user.profession = profession !== null && profession !== void 0 ? profession : user.profession;
            user.name = name !== null && name !== void 0 ? name : user.name;
            user.dialCode = dialCode !== null && dialCode !== void 0 ? dialCode : user.dialCode;
            // Enforce unique phone numbers across BOTH Users and BusinessProfiles
            // (excluding the current user/business profile)
            if (phoneNumber && phoneNumber !== "" && phoneNumber !== user.phoneNumber) {
                const [existingUser, existingBusinessProfile] = yield Promise.all([
                    user_model_2.default.findOne({ phoneNumber: phoneNumber, _id: { $ne: user._id } }),
                    businessProfile_model_1.default.findOne({ phoneNumber: phoneNumber }),
                ]);
                if (existingUser || existingBusinessProfile) {
                    return response.send((0, response_1.httpBadRequest)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.PHONE_NUMBER_IN_USE), error_1.ErrorMessage.PHONE_NUMBER_IN_USE));
                }
            }
            user.phoneNumber = phoneNumber !== null && phoneNumber !== void 0 ? phoneNumber : user.phoneNumber;
            user.bio = bio !== null && bio !== void 0 ? bio : user.bio;
            user.language = language !== null && language !== void 0 ? language : user.language;
            user.acceptedTerms = acceptedTerms !== null && acceptedTerms !== void 0 ? acceptedTerms : user.acceptedTerms;
            user.privateAccount = privateAccount !== null && privateAccount !== void 0 ? privateAccount : user.privateAccount;
            user.notificationEnabled = notificationEnabled !== null && notificationEnabled !== void 0 ? notificationEnabled : user.notificationEnabled;
            // Update username if provided and check for uniqueness
            if (username && username !== "" && username !== user.username) {
                const existingUser = yield user_model_2.default.findOne({ username: username, _id: { $ne: user._id } });
                if (existingUser) {
                    return response.send((0, response_1.httpBadRequest)(error_1.ErrorMessage.invalidRequest("Username is already taken"), "Username is already taken"));
                }
                user.username = username;
            }
            const savedUser = yield user.save();
            return response.send((0, response_1.httpOk)(savedUser.hideSensitiveData(), success_1.SuccessMessage.PROFILE_UPDATE));
        }
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_a = error.message) !== null && _a !== void 0 ? _a : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const profile = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _b, _c, _d, _e, _f, _g, _h, _j, _k;
    try {
        const { id, accountType } = request.user;
        const [user, profileCompleted, posts, follower, following, userAddress] = yield Promise.all([
            user_model_2.default.aggregate([
                {
                    $match: {
                        _id: new mongodb_1.ObjectId(id)
                    }
                },
                (0, user_model_1.addBusinessProfileInUser)().lookup,
                (0, user_model_1.addBusinessProfileInUser)().unwindLookup,
                {
                    $limit: 1,
                },
                {
                    $project: {
                        otp: 0,
                        password: 0,
                        createdAt: 0,
                        updatedAt: 0,
                        __v: 0,
                    }
                }
            ]),
            (0, user_model_1.calculateProfileCompletion)(id),
            (0, post_model_1.getPostsCount)(id),
            (0, userConnection_model_1.fetchFollowerCount)(id),
            (0, userConnection_model_1.fetchFollowingCount)(id),
            user_address_model_1.default.findOne({ userID: id })
        ]);
        if (user.length === 0) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        // Attach weather/AQI for business profiles (based on business location)
        try {
            const businessProfileRef = (_b = user[0]) === null || _b === void 0 ? void 0 : _b.businessProfileRef;
            const lat = Number((_d = (_c = businessProfileRef === null || businessProfileRef === void 0 ? void 0 : businessProfileRef.address) === null || _c === void 0 ? void 0 : _c.lat) !== null && _d !== void 0 ? _d : 0);
            const lng = Number((_f = (_e = businessProfileRef === null || businessProfileRef === void 0 ? void 0 : businessProfileRef.address) === null || _e === void 0 ? void 0 : _e.lng) !== null && _f !== void 0 ? _f : 0);
            if (accountType === user_model_2.AccountType.BUSINESS && businessProfileRef && lat !== 0 && lng !== 0) {
                const env = yield EnvironmentService_1.default.getForLocation({
                    cacheKey: `bp:${String((_j = (_g = businessProfileRef === null || businessProfileRef === void 0 ? void 0 : businessProfileRef._id) !== null && _g !== void 0 ? _g : (_h = user[0]) === null || _h === void 0 ? void 0 : _h.businessProfileID) !== null && _j !== void 0 ? _j : id)}`,
                    lat,
                    lng
                });
                user[0].businessProfileRef = Object.assign({}, businessProfileRef, {
                    weatherReport: env.weatherReport,
                    environment: env.summary
                });
            }
        }
        catch (_l) {
            // non-fatal
        }
        let responseData = { posts: posts, follower: follower, following: following, profileCompleted, address: userAddress };
        if (accountType === user_model_2.AccountType.BUSINESS) {
            Object.assign(responseData, Object.assign({}, user[0]));
        }
        else {
            Object.assign(responseData, Object.assign({}, user[0]));
        }
        return response.send((0, response_1.httpOk)(responseData, 'User profile fetched'));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_k = error.message) !== null && _k !== void 0 ? _k : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const publicProfile = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _m, _o, _p, _q, _r, _s, _t, _u, _v, _w;
    try {
        const { id, accountType } = request.user;
        const userID = request.params.id;
        const [user, posts, follower, following, myConnection, isBlocked] = yield (0, user_model_1.getUserPublicProfile)(userID, id);
        if (user.length === 0) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        // Attach weather/AQI for business profiles (based on business location)
        try {
            const businessProfileRef = (_m = user[0]) === null || _m === void 0 ? void 0 : _m.businessProfileRef;
            const lat = Number((_p = (_o = businessProfileRef === null || businessProfileRef === void 0 ? void 0 : businessProfileRef.address) === null || _o === void 0 ? void 0 : _o.lat) !== null && _p !== void 0 ? _p : 0);
            const lng = Number((_r = (_q = businessProfileRef === null || businessProfileRef === void 0 ? void 0 : businessProfileRef.address) === null || _q === void 0 ? void 0 : _q.lng) !== null && _r !== void 0 ? _r : 0);
            if (((_s = user[0]) === null || _s === void 0 ? void 0 : _s.accountType) === user_model_2.AccountType.BUSINESS && businessProfileRef && lat !== 0 && lng !== 0) {
                const env = yield EnvironmentService_1.default.getForLocation({
                    cacheKey: `bp:${String((_v = (_t = businessProfileRef === null || businessProfileRef === void 0 ? void 0 : businessProfileRef._id) !== null && _t !== void 0 ? _t : (_u = user[0]) === null || _u === void 0 ? void 0 : _u.businessProfileID) !== null && _v !== void 0 ? _v : userID)}`,
                    lat,
                    lng
                });
                user[0].businessProfileRef = Object.assign({}, businessProfileRef, {
                    weatherReport: env.weatherReport,
                    environment: env.summary
                });
            }
        }
        catch (_x) {
            // non-fatal
        }
        let responseData = { posts: posts, follower: follower, following: following };
        if (accountType === user_model_2.AccountType.BUSINESS) {
            Object.assign(responseData, Object.assign(Object.assign({}, user[0]), { isConnected: (myConnection === null || myConnection === void 0 ? void 0 : myConnection.status) === userConnection_model_1.ConnectionStatus.ACCEPTED ? true : false, isRequested: (myConnection === null || myConnection === void 0 ? void 0 : myConnection.status) === userConnection_model_1.ConnectionStatus.PENDING ? true : false, isBlockedByMe: isBlocked ? true : false }));
        }
        else {
            Object.assign(responseData, Object.assign(Object.assign({}, user[0]), { isConnected: (myConnection === null || myConnection === void 0 ? void 0 : myConnection.status) === userConnection_model_1.ConnectionStatus.ACCEPTED ? true : false, isRequested: (myConnection === null || myConnection === void 0 ? void 0 : myConnection.status) === userConnection_model_1.ConnectionStatus.PENDING ? true : false, isBlockedByMe: isBlocked ? true : false }));
        }
        return response.send((0, response_1.httpOk)(responseData, 'User profile fetched'));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_w = error.message) !== null && _w !== void 0 ? _w : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const changeProfilePic = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _y;
    try {
        const { id, accountType } = request.user;
        const user = yield user_model_2.default.findOne({ _id: id });
        if (!user) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        const files = request.files;
        const images = files && files.profilePic;
        if (images && images && images.length !== 0) {
            const image = images[0];
            const smallThumb = yield (0, MediaController_1.generateThumbnail)(image, "image", 200, 200);
            const mediumThumb = yield (0, MediaController_1.generateThumbnail)(image, "image", 480, 480);
            if (accountType === user_model_2.AccountType.BUSINESS && smallThumb && smallThumb.Location && mediumThumb && mediumThumb.Location && image && image.location) {
                const businessProfile = yield businessProfile_model_1.default.findOne({ _id: user.businessProfileID });
                if (!businessProfile) {
                    return response.send((0, response_1.httpOk)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.BUSINESS_PROFILE_NOT_FOUND), error_1.ErrorMessage.BUSINESS_PROFILE_NOT_FOUND));
                }
                businessProfile.profilePic = { small: smallThumb.Location, medium: mediumThumb.Location, large: image.location };
                const savedBusinessProfile = yield businessProfile.save();
                user.hasProfilePicture = true;
                const savedUser = yield user.save();
                return response.send((0, response_1.httpOk)(savedBusinessProfile, success_1.SuccessMessage.PROFILE_UPDATE));
            }
            if (smallThumb && smallThumb.Location && mediumThumb && mediumThumb.Location && image && image.location) {
                user.profilePic = { small: smallThumb.Location, medium: mediumThumb.Location, large: image.location };
                user.hasProfilePicture = true;
                const savedUser = yield user.save();
                return response.send((0, response_1.httpOk)(savedUser, success_1.SuccessMessage.PROFILE_UPDATE));
            }
            return response.send({ image, smallThumb, mediumThumb });
        }
        else {
            return response.send((0, response_1.httpBadRequest)(error_1.ErrorMessage.invalidRequest("Please upload profile image"), "Please upload profile image"));
        }
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_y = error.message) !== null && _y !== void 0 ? _y : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const businessDocumentUpload = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _z;
    try {
        const { id } = request.user;
        const { action } = request.body;
        console.log(action);
        const user = yield user_model_2.default.findOne({ _id: id });
        if (!user) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        if (user.accountType !== user_model_2.AccountType.BUSINESS) {
            return response.send((0, response_1.httpForbidden)(error_1.ErrorMessage.invalidRequest("Access Denied! You don't have business account"), "Access Denied! You don't have business account"));
        }
        if (!user.businessProfileID) {
            return response.send((0, response_1.httpBadRequest)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.BUSINESS_PROFILE_NOT_FOUND), error_1.ErrorMessage.BUSINESS_PROFILE_NOT_FOUND));
        }
        const files = request.files;
        const businessRegistration = files && files.businessRegistration;
        const addressProof = files && files.addressProof;
        if (!action && action !== "update") {
            if (!(businessRegistration && files && businessRegistration.length !== 0)) {
                return response.send((0, response_1.httpBadRequest)(error_1.ErrorMessage.invalidRequest("Please upload business registration certificate"), "Please upload business registration certificate"));
            }
            if (!(addressProof && files && addressProof.length !== 0)) {
                return response.send((0, response_1.httpBadRequest)(error_1.ErrorMessage.invalidRequest("Please upload address proof"), "Please upload address proof"));
            }
        }
        const document = yield businessDocument_model_1.default.findOne({ businessProfileID: user.businessProfileID });
        if (!document) {
            const newBusinessDocument = new businessDocument_model_1.default();
            newBusinessDocument.businessProfileID = user.businessProfileID;
            newBusinessDocument.businessRegistration = businessRegistration[0].location;
            newBusinessDocument.addressProof = addressProof[0].location;
            const savedBusinessProfile = yield newBusinessDocument.save();
            return response.send((0, response_1.httpOk)(savedBusinessProfile, 'Business document uploaded.'));
        }
        if (action && action === "update") {
            if (files && businessRegistration && businessRegistration.length !== 0) {
                document.businessRegistration = businessRegistration[0].location;
            }
            if (files && addressProof && addressProof.length !== 0) {
                document.addressProof = addressProof[0].location;
            }
        }
        const savedDocument = yield document.save();
        return response.send((0, response_1.httpOk)(savedDocument, 'Business document updated.'));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_z = error.message) !== null && _z !== void 0 ? _z : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const businessDocument = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _0;
    try {
        const { id } = request.user;
        const user = yield user_model_2.default.findOne({ _id: id });
        if (!user) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        if (user.accountType !== user_model_2.AccountType.BUSINESS) {
            return response.send((0, response_1.httpForbidden)(error_1.ErrorMessage.invalidRequest("Access Denied! You don't have business account"), "Access Denied! You don't have business account"));
        }
        if (!user.businessProfileID) {
            return response.send((0, response_1.httpBadRequest)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.BUSINESS_PROFILE_NOT_FOUND), error_1.ErrorMessage.BUSINESS_PROFILE_NOT_FOUND));
        }
        const businessDocuments = yield businessDocument_model_1.default.find({ businessProfileID: user.businessProfileID });
        return response.send((0, response_1.httpOk)(businessDocuments, 'Business document fetched.'));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_0 = error.message) !== null && _0 !== void 0 ? _0 : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const userPosts = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _1;
    try {
        const userID = request.params.id;
        const { id } = request.user;
        let { pageNumber, documentLimit, query } = request.query;
        pageNumber = (0, basic_1.parseQueryParam)(pageNumber, 1);
        documentLimit = (0, basic_1.parseQueryParam)(documentLimit, 20);
        const dbQuery = Object.assign(Object.assign({}, post_model_1.getPostQuery), { $and: [
                { postType: { $in: [post_model_1.PostType.POST, post_model_1.PostType.EVENT] } },
                {
                    $or: [
                        { userID: new mongodb_1.ObjectId(userID) }, // user's own posts
                        { collaborators: new mongodb_1.ObjectId(userID) } // collaborated posts
                    ]
                }
            ] });
        const [user, inMyFollowing, likedByMe, savedByMe, joiningEvents] = yield Promise.all([
            user_model_2.default.findOne({ _id: userID }),
            userConnection_model_1.default.findOne({ following: userID, follower: id, status: userConnection_model_1.ConnectionStatus.ACCEPTED }),
            like_model_1.default.distinct("postID", { userID: id, postID: { $ne: null } }),
            (0, post_model_1.getSavedPost)(id),
            eventJoin_model_1.default.distinct("postID", { userID: id, postID: { $ne: null } }),
        ]);
        if (!id || !user) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        if (userID !== id && !inMyFollowing && user.privateAccount) {
            return response.send((0, response_1.httpBadRequest)(error_1.ErrorMessage.invalidRequest("This account is Private. Follow this account to see their photos and videos."), "This account is Private. Follow this account to see their photos and videos."));
        }
        // Skip private account filter when user is viewing their own profile
        const skipPrivateAccountFilter = userID === id;
        // Pass followedUserIDs when viewing another user's profile and following them
        const followedUserIDs = (userID !== id && inMyFollowing) ? [userID] : undefined;
        const [documents, totalDocument] = yield Promise.all([
            (0, post_model_1.fetchPosts)(dbQuery, likedByMe, savedByMe, joiningEvents, pageNumber, documentLimit, undefined, undefined, skipPrivateAccountFilter, followedUserIDs, id),
            post_model_1.default.find(dbQuery).countDocuments(),
        ]);
        const totalPagesCount = Math.ceil(totalDocument / documentLimit) || 1;
        return response.send((0, response_1.httpOkExtended)(documents, "User feed fetched.", pageNumber, totalPagesCount, totalDocument));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_1 = error.message) !== null && _1 !== void 0 ? _1 : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const userPostMedia = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _2;
    try {
        const userID = request.params.id;
        const { id } = request.user;
        let { pageNumber, documentLimit, query } = request.query;
        pageNumber = (0, basic_1.parseQueryParam)(pageNumber, 1);
        documentLimit = (0, basic_1.parseQueryParam)(documentLimit, 20);
        const [user, inMyFollowing, mediaIDs, propertyPictures, collaboratedMediaIDs] = yield Promise.all([
            user_model_2.default.findOne({ _id: userID }),
            userConnection_model_1.default.findOne({ following: userID, follower: id, status: userConnection_model_1.ConnectionStatus.ACCEPTED }),
            // All media from user's own posts
            post_model_1.default.distinct('media', Object.assign(Object.assign({}, post_model_1.getPostQuery), { userID: new mongodb_1.ObjectId(userID), postType: { $in: [post_model_1.PostType.POST] } })),
            // Property media
            propertyPicture_model_1.default.distinct('mediaID', { userID: new mongodb_1.ObjectId(userID) }),
            // All media from posts where this user is a collaborator
            post_model_1.default.distinct('media', Object.assign(Object.assign({}, post_model_1.getPostQuery), { collaborators: new mongodb_1.ObjectId(userID), postType: { $in: [post_model_1.PostType.POST] } }))
        ]);
        if (!id || !user) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        if (userID !== id && !inMyFollowing && user.privateAccount) {
            return response.send((0, response_1.httpBadRequest)(error_1.ErrorMessage.invalidRequest("This account is Private. Follow this account to see their photos and videos."), "This account is Private. Follow this account to see their photos and videos."));
        }
        // Combine all media IDs (own + property + collaborations)
        const allMediaIDs = [...mediaIDs, ...propertyPictures, ...collaboratedMediaIDs];
        const dbQuery = { _id: { $in: allMediaIDs } };
        // Return only videos if requested by the user through the videos endpoint
        if (new RegExp("/user/videos/").test(request.originalUrl)) {
            Object.assign(dbQuery, { mediaType: media_model_1.MediaType.VIDEO });
        }
        // Return only images if requested by the user through the images endpoint
        if (new RegExp("/user/images/").test(request.originalUrl)) {
            Object.assign(dbQuery, { mediaType: media_model_1.MediaType.IMAGE });
        }
        const [documents, totalDocument] = yield Promise.all([
            media_model_1.default.aggregate([
                { $match: dbQuery },
                { $sort: { createdAt: -1, id: 1 } },
                { $skip: pageNumber > 0 ? (pageNumber - 1) * documentLimit : 0 },
                { $limit: documentLimit },
                {
                    $lookup: {
                        from: 'views',
                        let: { mediaID: '$_id' },
                        pipeline: [
                            { $match: { $expr: { $eq: ['$mediaID', '$$mediaID'] }, postID: { $ne: null } } },
                        ],
                        as: 'viewsRef'
                    }
                },
                {
                    $addFields: {
                        views: { $cond: { if: { $isArray: "$viewsRef" }, then: { $size: "$viewsRef" }, else: 0 } }
                    }
                },
                {
                    $project: {
                        _id: 1,
                        mediaType: 1,
                        mimeType: 1,
                        sourceUrl: 1,
                        thumbnailUrl: 1,
                        views: 1,
                    }
                }
            ]),
            media_model_1.default.find(dbQuery).countDocuments()
        ]);
        const totalPagesCount = Math.ceil(totalDocument / documentLimit) || 1;
        return response.send((0, response_1.httpOkExtended)(documents, 'User media fetched.', pageNumber, totalPagesCount, totalDocument));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_2 = error.message) !== null && _2 !== void 0 ? _2 : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const userReviews = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _3;
    try {
        const userID = request.params.id;
        const { id } = request.user;
        let { pageNumber, documentLimit, query } = request.query;
        pageNumber = (0, basic_1.parseQueryParam)(pageNumber, 1);
        documentLimit = (0, basic_1.parseQueryParam)(documentLimit, 20);
        const [user, inMyFollowing, likedByMe, savedByMe, joiningEvents] = yield Promise.all([
            user_model_2.default.findOne({ _id: userID }),
            userConnection_model_1.default.findOne({ following: userID, follower: id, status: userConnection_model_1.ConnectionStatus.ACCEPTED }),
            like_model_1.default.distinct('postID', { userID: id, postID: { $ne: null } }),
            (0, post_model_1.getSavedPost)(id),
            eventJoin_model_1.default.distinct('postID', { userID: id, postID: { $ne: null } }),
        ]);
        if (!id || !user) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        if (userID !== id && !inMyFollowing && user.privateAccount) {
            return response.send((0, response_1.httpBadRequest)(error_1.ErrorMessage.invalidRequest("This account is Private. Follow this account to see their photos and videos."), "This account is Private. Follow this account to see their photos and videos."));
        }
        // if (!user.businessProfileID) {
        //     return response.send(httpBadRequest(ErrorMessage.invalidRequest(ErrorMessage.BUSINESS_PROFILE_NOT_FOUND), ErrorMessage.BUSINESS_PROFILE_NOT_FOUND))
        // }
        // const dbQuery = { ...getPostQuery, reviewedBusinessProfileID: user.businessProfileID, postType: PostType.REVIEW };
        const dbQuery = Object.assign(Object.assign({}, post_model_1.getPostQuery), { postType: post_model_1.PostType.REVIEW });
        if (user.accountType === user_model_2.AccountType.BUSINESS) {
            Object.assign(dbQuery, { reviewedBusinessProfileID: user.businessProfileID });
        }
        else {
            Object.assign(dbQuery, { userID: user._id });
        }
        // Skip private account filter when user is viewing their own reviews
        const skipPrivateAccountFilter = userID === id;
        // Pass followedUserIDs when viewing another user's reviews and following them
        const followedUserIDs = (userID !== id && inMyFollowing) ? [userID] : undefined;
        const [documents, totalDocument] = yield Promise.all([
            (0, post_model_1.fetchPosts)(dbQuery, likedByMe, savedByMe, joiningEvents, pageNumber, documentLimit, undefined, undefined, skipPrivateAccountFilter, followedUserIDs, id),
            post_model_1.default.find(dbQuery).countDocuments()
        ]);
        const totalPagesCount = Math.ceil(totalDocument / documentLimit) || 1;
        return response.send((0, response_1.httpOkExtended)(documents, 'Business reviews fetched.', pageNumber, totalPagesCount, totalDocument));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_3 = error.message) !== null && _3 !== void 0 ? _3 : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const businessPropertyPictures = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _4, _5, _6;
    try {
        const { id, accountType, businessProfileID } = request.user;
        // This endpoint allows multiple property pictures. The client may sometimes resend
        // previous selections, so we defensively enforce limits here (and delete extras).
        // Multer may provide files as:
        // - Express.Multer.File[] (when using `.any()` / `.array()`)
        // - { [fieldname]: Express.Multer.File[] } (when using `.fields()`)
        const allFiles = Array.isArray(request.files)
            ? request.files
            : Object.values((_4 = request.files) !== null && _4 !== void 0 ? _4 : {})
                .flat();
        // Accept common variants from clients
        const allowedFieldNames = new Set(['images', 'images[]']);
        const unexpectedFiles = allFiles.filter((f) => !allowedFieldNames.has(f.fieldname));
        const imagesAll = allFiles.filter((f) => allowedFieldNames.has(f.fieldname));
        if (unexpectedFiles.length > 0) {
            yield (0, MediaController_3.deleteUnwantedFiles)(unexpectedFiles);
        }
        if (!imagesAll || imagesAll.length === 0) {
            // If client sent files but under a wrong field name, help debug that quickly
            const receivedFields = Array.from(new Set(allFiles.map((f) => f.fieldname))).filter(Boolean);
            return response.send((0, response_1.httpBadRequest)(error_1.ErrorMessage.invalidRequest(`Property pictures field must be 'images'. Received: ${receivedFields.join(', ') || 'none'}`), `Property pictures field must be 'images'. Received: ${receivedFields.join(', ') || 'none'}`));
        }
        // Enforce max TOTAL property pictures (not just per-request) and dedupe retries.
        // We dedupe by (fileName, fileSize, mimeType) which is stable across retries for the same file.
        const MAX_TOTAL_PROPERTY_IMAGES = 6;
        // 1) Deduplicate within this request (clients sometimes include the same file multiple times)
        const requestSeen = new Set();
        const requestDuplicates = [];
        const requestUnique = [];
        for (const f of imagesAll) {
            const sig = `${f.originalname}|${f.size}|${f.mimetype}`;
            if (requestSeen.has(sig))
                requestDuplicates.push(f);
            else {
                requestSeen.add(sig);
                requestUnique.push(f);
            }
        }
        if (requestDuplicates.length > 0) {
            yield (0, MediaController_3.deleteUnwantedFiles)(requestDuplicates);
        }
        // 2) Deduplicate against existing property pictures for this business profile
        const existingPropertyPictures = yield propertyPicture_model_1.default.find({ businessProfileID: businessProfileID }, 'mediaID').lean();
        const existingMediaIDs = existingPropertyPictures.map((p) => p.mediaID).filter(Boolean);
        const existingMedia = existingMediaIDs.length > 0
            ? yield media_model_1.default.find({ _id: { $in: existingMediaIDs } }, 'fileName fileSize mimeType').lean()
            : [];
        const existingSignatures = new Set(existingMedia.map((m) => `${m.fileName}|${m.fileSize}|${m.mimeType}`));
        const alreadyHave = [];
        const candidates = [];
        for (const f of requestUnique) {
            const sig = `${f.originalname}|${f.size}|${f.mimetype}`;
            if (existingSignatures.has(sig))
                alreadyHave.push(f);
            else
                candidates.push(f);
        }
        if (alreadyHave.length > 0) {
            // Delete re-uploaded duplicates to avoid wasting S3 storage
            yield (0, MediaController_3.deleteUnwantedFiles)(alreadyHave);
        }
        const remainingSlots = Math.max(0, MAX_TOTAL_PROPERTY_IMAGES - existingMediaIDs.length);
        if (remainingSlots === 0) {
            if (candidates.length > 0)
                yield (0, MediaController_3.deleteUnwantedFiles)(candidates);
            return response.send((0, response_1.httpBadRequest)(error_1.ErrorMessage.invalidRequest(`You can upload at most ${MAX_TOTAL_PROPERTY_IMAGES} property pictures.`), `You can upload at most ${MAX_TOTAL_PROPERTY_IMAGES} property pictures.`));
        }
        const images = candidates.slice(0, remainingSlots);
        const extraImages = candidates.slice(remainingSlots);
        if (extraImages.length > 0) {
            yield (0, MediaController_3.deleteUnwantedFiles)(extraImages);
        }
        if (!accountType && !id) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        if (accountType !== user_model_2.AccountType.BUSINESS && !businessProfileID) {
            yield (0, MediaController_3.deleteUnwantedFiles)(images);
            return response.send((0, response_1.httpForbidden)(error_1.ErrorMessage.invalidRequest("Access denied: You do not have the necessary permissions to access this API."), "Access denied: You do not have the necessary permissions to access this API."));
        }
        /**
         * Handle media
         */
        let newPropertyPictures = [];
        let coverImage = null;
        if (images && images.length !== 0) {
            const imageList = yield (0, MediaController_2.storeMedia)(images, id, businessProfileID, constants_1.AwsS3AccessEndpoints.BUSINESS_PROPERTY, 'POST');
            if (imageList && imageList.length !== 0) {
                coverImage = imageList[0].sourceUrl;
                imageList.map((image) => newPropertyPictures.push({
                    userID: id,
                    mediaID: image.id,
                    businessProfileID: businessProfileID
                }));
            }
        }
        const updates = [];
        if (newPropertyPictures.length > 0) {
            updates.push(propertyPicture_model_1.default.create(newPropertyPictures));
        }
        if (coverImage) {
            updates.push(businessProfile_model_1.default.findOneAndUpdate({ _id: businessProfileID }, { coverImage: coverImage }));
        }
        const results = updates.length > 0 ? yield Promise.all(updates) : [];
        const createdPropertyPictures = (_5 = results.find((r) => Array.isArray(r))) !== null && _5 !== void 0 ? _5 : [];
        return response.send((0, response_1.httpCreated)(createdPropertyPictures, 'Property pictures uploaded successfully'));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_6 = error.message) !== null && _6 !== void 0 ? _6 : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
//FIXME add blocked users 
const tagPeople = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _7;
    try {
        const { id } = request.user;
        let { pageNumber, documentLimit, query } = request.query;
        pageNumber = (0, basic_1.parseQueryParam)(pageNumber, 1);
        documentLimit = (0, basic_1.parseQueryParam)(documentLimit, 20);
        const [inMyFollower, blockedUsers] = yield Promise.all([
            (0, userConnection_model_1.fetchUserFollowing)(id),
            (0, user_model_1.getBlockedByUsers)(id),
        ]);
        if (!id) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        const dbQuery = [];
        if (query !== undefined && query !== "") {
            const businessProfileIDs = yield businessProfile_model_1.default.distinct('_id', {
                $or: [
                    { name: { $regex: new RegExp(query.toLowerCase(), "i") } },
                    { username: { $regex: new RegExp(query.toLowerCase(), "i") } },
                ]
            });
            dbQuery.push({
                $or: [
                    Object.assign({ _id: { $in: inMyFollower, $nin: blockedUsers }, name: { $regex: new RegExp(query.toLowerCase(), "i") } }, user_model_1.activeUserQuery),
                    Object.assign({ _id: { $in: inMyFollower, $nin: blockedUsers }, username: { $regex: new RegExp(query.toLowerCase(), "i") } }, user_model_1.activeUserQuery),
                    Object.assign({ _id: { $in: inMyFollower, $nin: blockedUsers }, businessProfileID: { $in: businessProfileIDs } }, user_model_1.activeUserQuery)
                ]
            });
        }
        else {
            dbQuery.push(Object.assign({ _id: { $in: inMyFollower, $nin: blockedUsers } }, user_model_1.activeUserQuery));
        }
        const [documents, totalDocument] = yield Promise.all([
            (0, user_model_1.getUserProfile)({
                $or: dbQuery
            }, pageNumber, documentLimit),
            user_model_2.default.find({
                $or: dbQuery
            }).countDocuments()
        ]);
        const totalPagesCount = Math.ceil(totalDocument / documentLimit) || 1;
        return response.send((0, response_1.httpOkExtended)(documents, 'Tagged fetched.', pageNumber, totalPagesCount, totalDocument));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_7 = error.message) !== null && _7 !== void 0 ? _7 : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const deactivateAccount = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _8, _9;
    try {
        const { id } = request.user;
        const user = yield user_model_2.default.findOne({ _id: id });
        if (!user) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        user.isActivated = false;
        yield user.save();
        const isAdminRoute = request.baseUrl.includes('/admin') || request.path.includes('/admin');
        const isAdmin = isAdminRoute || ((_8 = request.user) === null || _8 === void 0 ? void 0 : _8.role) === common_1.Role.ADMINISTRATOR;
        const refreshTokenCookieKey = isAdmin ? constants_1.AppConfig.ADMIN_AUTH_TOKEN_COOKIE_KEY : constants_1.AppConfig.USER_AUTH_TOKEN_COOKIE_KEY;
        const accessTokenKey = isAdmin ? constants_1.AppConfig.ADMIN_AUTH_TOKEN_KEY : constants_1.AppConfig.USER_AUTH_TOKEN_KEY;
        response.clearCookie(refreshTokenCookieKey, constants_2.CookiePolicy);
        response.clearCookie(constants_1.AppConfig.DEVICE_ID_COOKIE_KEY, constants_2.CookiePolicy);
        response.clearCookie(accessTokenKey, constants_2.CookiePolicy);
        return response.send((0, response_1.httpNoContent)(null, 'Your account has been successfully deactivated. We\'re sorry to see you go!'));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_9 = error.message) !== null && _9 !== void 0 ? _9 : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const deleteAccount = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _10, _11;
    try {
        const { id } = request.user;
        const user = yield user_model_2.default.findOne({ _id: id });
        if (!user) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        user.isDeleted = true;
        yield user.save();
        const isAdminRoute = request.baseUrl.includes('/admin') || request.path.includes('/admin');
        const isAdmin = isAdminRoute || ((_10 = request.user) === null || _10 === void 0 ? void 0 : _10.role) === common_1.Role.ADMINISTRATOR;
        const refreshTokenCookieKey = isAdmin ? constants_1.AppConfig.ADMIN_AUTH_TOKEN_COOKIE_KEY : constants_1.AppConfig.USER_AUTH_TOKEN_COOKIE_KEY;
        const accessTokenKey = isAdmin ? constants_1.AppConfig.ADMIN_AUTH_TOKEN_KEY : constants_1.AppConfig.USER_AUTH_TOKEN_KEY;
        response.clearCookie(refreshTokenCookieKey, constants_2.CookiePolicy);
        response.clearCookie(constants_1.AppConfig.DEVICE_ID_COOKIE_KEY, constants_2.CookiePolicy);
        response.clearCookie(accessTokenKey, constants_2.CookiePolicy);
        return response.send((0, response_1.httpNoContent)(null, 'Your account will be permanently deleted in 30 days. You can reactivate it within this period if you change your mind.'));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_11 = error.message) !== null && _11 !== void 0 ? _11 : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const blockUser = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _12;
    try {
        const ID = request.params.id;
        const { id, accountType, businessProfileID } = request.user;
        if (!id) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        const [user, isBlocked, inMyFollowing] = yield Promise.all([
            user_model_2.default.findOne({ _id: ID }),
            blockedUser_model_1.default.findOne({ blockedUserID: ID, userID: id }),
            userConnection_model_1.default.findOne({ following: ID, follower: id, status: userConnection_model_1.ConnectionStatus.ACCEPTED }),
        ]);
        if (!user) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        if (!isBlocked) {
            const newBlockedUser = new blockedUser_model_1.default();
            newBlockedUser.userID = id;
            newBlockedUser.blockedUserID = ID;
            newBlockedUser.businessProfileID = businessProfileID !== null && businessProfileID !== void 0 ? businessProfileID : null;
            if (inMyFollowing) {
                yield inMyFollowing.deleteOne();
            }
            const savedLike = yield newBlockedUser.save();
            return response.send((0, response_1.httpCreated)(savedLike, "User blocked successfully"));
        }
        yield isBlocked.deleteOne();
        return response.send((0, response_1.httpNoContent)(null, 'User unblocked successfully'));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_12 = error.message) !== null && _12 !== void 0 ? _12 : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
//TODO remove deleted and disabled user
const blockedUsers = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _13;
    try {
        const { id } = request.user;
        let { pageNumber, documentLimit, query } = request.query;
        pageNumber = (0, basic_1.parseQueryParam)(pageNumber, 1);
        documentLimit = (0, basic_1.parseQueryParam)(documentLimit, 20);
        if (!id) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        const userIDs = yield (0, user_model_1.getBlockedUsers)(id);
        const dbQuery = { _id: { $in: userIDs } };
        const [documents, totalDocument] = yield Promise.all([
            (0, user_model_1.getUserProfile)(dbQuery, pageNumber, documentLimit),
            user_model_2.default.find(dbQuery).countDocuments()
        ]);
        const totalPagesCount = Math.ceil(totalDocument / documentLimit) || 1;
        return response.send((0, response_1.httpOkExtended)(documents, 'Blocked list fetched.', pageNumber, totalPagesCount, totalDocument));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_13 = error.message) !== null && _13 !== void 0 ? _13 : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const address = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _14;
    try {
        const { id, accountType, businessProfileID } = request.user;
        const { street, city, state, zipCode, country, phoneNumber, dialCode, lat, lng } = request.body;
        if (!id) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        if (accountType === user_model_2.AccountType.BUSINESS) {
            return response.send((0, response_1.httpForbidden)(error_1.ErrorMessage.invalidRequest("Access denied: You can't update your billing address. Please contact admin support."), "Access denied: You can't update your billing address. Please contact admin support."));
        }
        const address = yield user_address_model_1.default.findOne({ userID: id });
        if (address) {
            address.street = street;
            address.city = city;
            address.state = state;
            address.zipCode = zipCode;
            address.country = country;
            address.phoneNumber = phoneNumber;
            address.dialCode = dialCode;
            address.userID = id;
            address.geoCoordinate = { type: "Point", coordinates: [lng, lat] };
            address.lat = lat;
            address.lng = lng;
            const savedUserAddress = yield address.save();
            return response.send((0, response_1.httpAcceptedOrUpdated)(savedUserAddress, 'Billing address updated successfully.'));
        }
        const newUserAddress = new user_address_model_1.default();
        newUserAddress.street = street;
        newUserAddress.city = city;
        newUserAddress.state = state;
        newUserAddress.zipCode = zipCode;
        newUserAddress.country = country;
        newUserAddress.phoneNumber = phoneNumber;
        newUserAddress.dialCode = dialCode;
        newUserAddress.userID = id;
        newUserAddress.geoCoordinate = { type: "Point", coordinates: [lng, lat] };
        newUserAddress.lat = lat;
        newUserAddress.lng = lng;
        const savedUserAddress = yield newUserAddress.save();
        return response.send((0, response_1.httpCreated)(savedUserAddress, 'Billing address added successfully.'));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_14 = error.message) !== null && _14 !== void 0 ? _14 : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
exports.default = { editProfile, profile, publicProfile, changeProfilePic, businessDocumentUpload, businessDocument, userPosts, userPostMedia, userReviews, businessPropertyPictures, tagPeople, deactivateAccount, deleteAccount, blockUser, blockedUsers, address };
