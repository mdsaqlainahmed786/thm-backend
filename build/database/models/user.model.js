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
exports.activeUserQuery = exports.AccountType = exports.SocialAccount = void 0;
exports.addBusinessProfileInUser = addBusinessProfileInUser;
exports.addAmenitiesInBusinessProfile = addAmenitiesInBusinessProfile;
exports.addBusinessTypeInBusinessProfile = addBusinessTypeInBusinessProfile;
exports.addBusinessSubTypeInBusinessProfile = addBusinessSubTypeInBusinessProfile;
exports.addStoriesInUser = addStoriesInUser;
exports.calculateProfileCompletion = calculateProfileCompletion;
exports.getUserProfile = getUserProfile;
exports.profileProject = profileProject;
exports.profileBasicProject = profileBasicProject;
exports.getBlockedUsers = getBlockedUsers;
exports.getBlockedByUsers = getBlockedByUsers;
exports.getUserPublicProfile = getUserPublicProfile;
exports.getBusinessType = getBusinessType;
exports.fetchWeatherAndAirPollutionReport = fetchWeatherAndAirPollutionReport;
exports.createUserAccount = createUserAccount;
exports.createBusinessProfile = createBusinessProfile;
const mongoose_1 = require("mongoose");
const bcrypt_1 = require("bcrypt");
const basic_1 = require("../../utils/helper/basic");
const businessProfile_model_1 = __importDefault(require("./businessProfile.model"));
const basic_2 = require("../../utils/helper/basic");
const common_model_1 = require("./common.model");
const common_1 = require("../../common");
const story_model_1 = require("./story.model");
const post_model_1 = require("./post.model");
const userConnection_model_1 = __importStar(require("./userConnection.model"));
const blockedUser_model_1 = __importDefault(require("./blockedUser.model"));
const mongodb_1 = require("mongodb");
const basic_3 = require("../../utils/helper/basic");
const EmailNotificationService_1 = __importDefault(require("../../services/EmailNotificationService"));
const businessType_model_1 = __importDefault(require("./businessType.model"));
const WeatherService_1 = __importDefault(require("../../services/WeatherService"));
const server_1 = require("../../server");
const emailNotificationService = new EmailNotificationService_1.default();
var SocialAccount;
(function (SocialAccount) {
    SocialAccount["FACEBOOK"] = "facebook";
    SocialAccount["GOOGLE"] = "google";
    SocialAccount["APPLE"] = "apple";
})(SocialAccount || (exports.SocialAccount = SocialAccount = {}));
const SocialIDSchema = new mongoose_1.Schema({
    socialUId: { type: String },
    socialType: { type: String, enum: SocialAccount, required: true },
});
var AccountType;
(function (AccountType) {
    AccountType["INDIVIDUAL"] = "individual";
    AccountType["BUSINESS"] = "business";
})(AccountType || (exports.AccountType = AccountType = {}));
const UserSchema = new mongoose_1.Schema({
    username: { type: String },
    profilePic: common_model_1.ProfileSchema,
    businessProfileID: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "BusinessProfile"
    },
    name: { type: String, required: true },
    email: { type: String, lowercase: true, index: true, required: true, unique: true, match: [/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/, "email is invalid."], },
    password: {
        type: String,
        max: 1024,
        required: true,
        select: true,
    },
    bio: { type: String, default: '' },
    mobileVerified: {
        type: Boolean,
        default: false // False by default, indicating the phone number is not verified
    },
    phoneNumber: { type: String },
    dialCode: { type: String },
    accountType: {
        type: String,
        enum: AccountType,
        default: AccountType.INDIVIDUAL
    },
    otp: {
        type: Number,
        maxlength: 5,
        default: 0,
        select: false
    },
    isVerified: {
        type: Boolean, default: false
    },
    isApproved: {
        type: Boolean, default: true,
    },
    isActivated: {
        type: Boolean, default: false
    },
    isDeleted: {
        type: Boolean, default: false,
    },
    hasProfilePicture: {
        type: Boolean, default: false,
    },
    acceptedTerms: {
        type: Boolean, default: false,
    },
    privateAccount: {
        type: Boolean, default: true,
    },
    notificationEnabled: {
        type: Boolean, default: true,
    },
    role: {
        type: String, enum: common_1.Role, default: common_1.Role.USER,
    },
    socialIDs: [SocialIDSchema],
    lastSeen: { type: Date, default: Date.now },
    profession: {
        type: String,
        default: ""
    },
    language: {
        type: String,
        default: common_1.Language.English,
        enum: common_1.Language,
        required: true
    },
    geoCoordinate: {
        type: {
            type: String,
            enum: ['Point'], // Specify the type as "Point" for geo spatial indexing
        },
        coordinates: {
            type: [Number],
        }
    },
}, {
    timestamps: true
});
UserSchema.index({ 'geoCoordinate': '2dsphere' });
UserSchema.set('toObject', { virtuals: true });
UserSchema.set('toJSON', { virtuals: true });
UserSchema.pre('save', function (_next) {
    const user = this;
    if (!user.isModified('password')) {
        return _next();
    }
    (0, bcrypt_1.genSalt)(10, (error, salt) => {
        if (error) {
            return _next(error);
        }
        (0, bcrypt_1.hash)(user.password, salt, (error, passwordHash) => {
            if (error) {
                return _next(error);
            }
            user.password = passwordHash;
            return _next();
        });
    });
});
UserSchema.methods.comparePassword = function (requestPassword) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield (0, bcrypt_1.compare)(requestPassword, this.password);
    });
};
UserSchema.methods.hidePasswordAndAddTokens = function (accessToken, refreshToken) {
    var _a;
    const user = this.toObject();
    user.accessToken = accessToken;
    user.refreshToken = refreshToken;
    user.clusterRef = user.clusterID;
    user.clusterID = (_a = user.clusterID) === null || _a === void 0 ? void 0 : _a._id;
    delete user.password;
    return user;
};
UserSchema.methods.hideSensitiveData = function () {
    const user = this.toObject();
    delete user.password;
    delete user.otp;
    return user;
};
const User = (0, mongoose_1.model)('User', UserSchema);
exports.default = User;
/**
 *
 * @returns Return user business profile along with amenities reference
 */
function addBusinessProfileInUser() {
    const lookup = {
        '$lookup': {
            'from': 'businessprofiles',
            'let': { 'businessProfileID': '$businessProfileID' },
            'pipeline': [
                { '$match': { '$expr': { '$eq': ['$_id', '$$businessProfileID'] } } },
                addAmenitiesInBusinessProfile().lookup,
                addBusinessTypeInBusinessProfile().lookup,
                addBusinessTypeInBusinessProfile().unwindLookup,
                addBusinessSubTypeInBusinessProfile().lookup,
                addBusinessSubTypeInBusinessProfile().unwindLookup,
                {
                    '$lookup': {
                        'from': 'businessanswers',
                        'let': { 'amenitiesIDs': '$amenities' },
                        'pipeline': [
                            { '$match': { '$expr': { '$eq': ['$businessProfileID', '$$businessProfileID'] } } },
                            {
                                '$project': {
                                    'businessProfileID': 0,
                                    'createdAt': 0,
                                    'updatedAt': 0,
                                    '__v': 0,
                                }
                            }
                        ],
                        'as': 'businessAnswerRef'
                    }
                },
                {
                    '$project': {
                        'createdAt': 0,
                        'updatedAt': 0,
                        '__v': 0,
                    }
                }
            ],
            'as': 'businessProfileRef'
        }
    };
    const unwindLookup = {
        '$unwind': {
            'path': '$businessProfileRef',
            'preserveNullAndEmptyArrays': true //false value does not fetch relationship.
        }
    };
    const mergeObject = {
        $replaceRoot: { newRoot: { $mergeObjects: [{ $arrayElemAt: ["$businessProfileRef", 0] }, "$$ROOT"] } }
    };
    return { lookup, unwindLookup, mergeObject };
}
/**
 *
 * @returns Returns business profile's amenities lookup
 */
function addAmenitiesInBusinessProfile() {
    const lookup = {
        '$lookup': {
            'from': 'businessquestions',
            'let': { 'amenitiesIDs': '$amenities' },
            'pipeline': [
                { '$match': { '$expr': { '$in': ['$_id', '$$amenitiesIDs'] } } },
                {
                    '$project': {
                        'answer': 0,
                        'question': 0,
                        'businessTypeID': 0,
                        'businessSubtypeID': 0,
                        'createdAt': 0,
                        'updatedAt': 0,
                        '__v': 0,
                    }
                }
            ],
            'as': 'amenitiesRef'
        }
    };
    return { lookup };
}
/**
 *
 * @returns Returns business type for business profile's
 */
function addBusinessTypeInBusinessProfile() {
    const lookup = {
        '$lookup': {
            'from': 'businesstypes',
            'let': { 'businessTypeID': '$businessTypeID' },
            'pipeline': [
                { '$match': { '$expr': { '$eq': ['$_id', '$$businessTypeID'] } } },
                {
                    '$project': {
                        'createdAt': 0,
                        'updatedAt': 0,
                        '__v': 0,
                    }
                }
            ],
            'as': 'businessTypeRef'
        }
    };
    const unwindLookup = {
        '$unwind': {
            'path': '$businessTypeRef',
            'preserveNullAndEmptyArrays': true //false value does not fetch relationship.
        }
    };
    return { lookup, unwindLookup };
}
/**
 *
 * @returns Returns business subtype for business profile's
 */
function addBusinessSubTypeInBusinessProfile() {
    const lookup = {
        '$lookup': {
            'from': 'businesssubtypes',
            'let': { 'businessSubTypeID': '$businessSubTypeID' },
            'pipeline': [
                { '$match': { '$expr': { '$eq': ['$_id', '$$businessSubTypeID'] } } },
                {
                    '$project': {
                        'businessTypeID': 0,
                        'createdAt': 0,
                        'updatedAt': 0,
                        '__v': 0,
                    }
                }
            ],
            'as': 'businessSubtypeRef'
        }
    };
    const unwindLookup = {
        '$unwind': {
            'path': '$businessSubtypeRef',
            'preserveNullAndEmptyArrays': true //false value does not fetch relationship.
        }
    };
    return { lookup, unwindLookup };
}
/**
 *
 * @param likeIDs Those IDs which are liked by the requested user will determine whether the current post was liked by them or not.
 * @returns
 */
function addStoriesInUser(likeIDs, viewedStories) {
    const lookup = {
        '$lookup': {
            'from': 'stories',
            'let': { 'userID': '$_id' },
            'pipeline': [
                { '$match': { '$expr': { '$eq': ['$userID', '$$userID'] }, timeStamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } },
                {
                    '$addFields': {
                        'likedByMe': {
                            $and: [
                                { $ne: [likeIDs, null] },
                                //FIXME Bro 
                                {
                                    $in: ['$_id', likeIDs]
                                }
                            ]
                        }
                    }
                },
                {
                    '$addFields': {
                        'seenByMe': {
                            $and: [
                                { $ne: [viewedStories, null] },
                                //FIXME Bro 
                                {
                                    $in: ['$_id', viewedStories]
                                }
                            ]
                        }
                    }
                },
                (0, story_model_1.addMediaInStory)().lookup,
                (0, story_model_1.addMediaInStory)().unwindLookup,
                (0, story_model_1.addMediaInStory)().replaceRootAndMergeObjects,
                (0, story_model_1.addMediaInStory)().project,
            ],
            'as': 'storiesRef'
        }
    };
    return { lookup };
}
function calculateProfileCompletion(userID) {
    return __awaiter(this, void 0, void 0, function* () {
        const removeField = ['profilePic.small', 'profilePic.medium', 'businessProfileID', 'otp', 'socialIDs.socialUId', 'socialIDs.socialType', 'socialIDs._id', 'password', '_id', "__v", "password", "createdAt", "updatedAt", "geoCoordinate.type", "geoCoordinate.coordinates", "lastSeen"];
        const userProfile = yield User.findOne({ _id: userID });
        if (userProfile && userProfile.accountType === AccountType.INDIVIDUAL) {
            const schemaKeys = (0, basic_1.getAllKeysFromSchema)(User.schema);
            const topLevelNestedFields = getTopLevelNestedFields(User.schema);
            // Remove top-level nested fields from the schemaKeys
            const filteredSchemaFields = schemaKeys.filter(field => !topLevelNestedFields.includes(field))
                .filter(field => !removeField.includes(field));
            const filledKeys = filteredSchemaFields.filter((key) => {
                const value = userProfile === null || userProfile === void 0 ? void 0 : userProfile.get(key);
                if ((0, basic_2.isArray)(value)) {
                    return (value === null || value === void 0 ? void 0 : value.length) !== 0;
                }
                else {
                    return value !== undefined && value !== null && value !== '';
                }
            });
            const completionPercentage = (filledKeys.length / filteredSchemaFields.length) * 100;
            const finalCompletionPercentage = completionPercentage.toFixed(2);
            return parseFloat(finalCompletionPercentage);
        }
        if (userProfile && userProfile.accountType === AccountType.BUSINESS && userProfile.businessProfileID) {
            const businessProfile = yield businessProfile_model_1.default.findOne({ _id: userProfile.businessProfileID });
            const schemaKeys = (0, basic_1.getAllKeysFromSchema)(businessProfile_model_1.default.schema);
            const topLevelNestedFields = getTopLevelNestedFields(businessProfile_model_1.default.schema);
            // Remove top-level nested fields from the schemaKeys
            const filteredSchemaFields = schemaKeys.filter(field => !topLevelNestedFields.includes(field))
                .filter(field => ![...removeField, "profession"].includes(field));
            const filledKeys = filteredSchemaFields.filter((key) => {
                const value = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.get(key);
                if ((0, basic_2.isArray)(value)) {
                    return (value === null || value === void 0 ? void 0 : value.length) !== 0;
                }
                else {
                    return value !== undefined && value !== null && value !== '';
                }
            });
            const completionPercentage = (filledKeys.length / filteredSchemaFields.length) * 100;
            const finalCompletionPercentage = completionPercentage.toFixed(2);
            return parseFloat(finalCompletionPercentage);
        }
        return 0;
    });
}
function getTopLevelNestedFields(schema) {
    return Object.keys(schema.paths)
        .filter((key) => {
        const fieldSchema = schema.paths[key];
        return fieldSchema.schema !== undefined; // Check if the field has a nested schema
    });
}
/**
 *
 * @param match  Used in an aggregation pipeline to filter documents.
 * @param likedByMe To check which post request user liked or not
 * @param savedByMe To check which post request user saved or not
 * @returns
 * User Profile with some basic data like name username business profile reference
 */
function getUserProfile(match, pageNumber, documentLimit) {
    return User.aggregate([
        {
            $match: match
        },
        addBusinessProfileInUser().lookup,
        addBusinessProfileInUser().unwindLookup,
        {
            $sort: { createdAt: -1, id: 1 }
        },
        {
            $skip: pageNumber > 0 ? ((pageNumber - 1) * documentLimit) : 0
        },
        {
            $limit: documentLimit
        },
        profileProject(),
    ]).exec();
}
function profileProject() {
    return {
        "$project": {
            "_id": 1,
            "name": 1,
            "profilePic": 1,
            "role": 1,
            "accountType": 1,
            "username": 1,
            "businessProfileRef.name": 1,
            "businessProfileRef.profilePic": 1,
            "businessProfileRef.businessTypeRef": 1,
            "businessProfileRef.address": 1,
        }
    };
}
function profileBasicProject() {
    return {
        "$project": {
            "name": 1,
            "username": 1,
            "accountType": 1,
            'profilePic': 1,
            'businessProfileRef._id': 1,
            'businessProfileRef.profilePic': 1,
            'businessProfileRef.username': 1,
            'businessProfileRef.name': 1,
        }
    };
}
function getBlockedUsers(userID) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield blockedUser_model_1.default.distinct('blockedUserID', { userID: userID });
    });
}
function getBlockedByUsers(userID) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield blockedUser_model_1.default.distinct('userID', { blockedUserID: userID });
    });
}
function getUserPublicProfile(userID, id) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield Promise.all([
            User.aggregate([
                {
                    $match: {
                        _id: new mongodb_1.ObjectId(userID)
                    }
                },
                addBusinessProfileInUser().lookup,
                addBusinessProfileInUser().unwindLookup,
                {
                    $limit: 1,
                },
                {
                    $project: {
                        "businessProfileRef.businessAnswerRef": 0,
                        isVerified: 0,
                        isApproved: 0,
                        isActivated: 0,
                        isDeleted: 0,
                        hasProfilePicture: 0,
                        acceptedTerms: 0,
                        profileCompleted: 0,
                        email: 0,
                        dialCode: 0,
                        phoneNumber: 0,
                        otp: 0,
                        password: 0,
                        createdAt: 0,
                        updatedAt: 0,
                        __v: 0,
                    }
                }
            ]),
            (0, post_model_1.getPostsCount)(userID),
            (0, userConnection_model_1.fetchFollowerCount)(userID),
            (0, userConnection_model_1.fetchFollowingCount)(userID),
            userConnection_model_1.default.findOne({ following: userID, follower: id, }),
            blockedUser_model_1.default.findOne({ blockedUserID: userID, userID: id })
        ]);
    });
}
function getBusinessType(businessProfileID) {
    return __awaiter(this, void 0, void 0, function* () {
        const businessProfile = yield businessProfile_model_1.default.findOne({ _id: businessProfileID });
        if (businessProfile) {
            const businessType = yield businessType_model_1.default.findOne({ _id: businessProfile.businessTypeID });
            if (businessType) {
                return businessType.name;
            }
        }
        return null;
    });
}
function fetchWeatherAndAirPollutionReport(businessProfileID) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        const businessProfile = yield businessProfile_model_1.default.findOne({ _id: businessProfileID });
        if (businessProfile) {
            const lat = Number((_b = (_a = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.address) === null || _a === void 0 ? void 0 : _a.lat) !== null && _b !== void 0 ? _b : 0);
            const lng = Number((_d = (_c = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.address) === null || _c === void 0 ? void 0 : _c.lng) !== null && _d !== void 0 ? _d : 0);
            try {
                const weatherReportKey = `weather::${businessProfileID}`;
                const weatherReport = yield server_1.RedisClient.get(weatherReportKey);
                if (weatherReport) {
                    console.log("no api call return cache");
                    return JSON.parse(weatherReport);
                }
                console.log("api call");
                const [airPollution, weather] = yield Promise.all([
                    WeatherService_1.default.airPollution(lat, lng),
                    WeatherService_1.default.weather(lat, lng)
                ]);
                const data = Object.assign(Object.assign({}, weather), { airPollution: airPollution });
                yield server_1.RedisClient.set(weatherReportKey, JSON.stringify(data), {
                    EX: (60 * 60 * 24 * 15) //second * minutes * hour * day = seconds 
                });
                return data;
            }
            catch (_e) {
                return null;
            }
        }
        return null;
    });
}
exports.activeUserQuery = { isVerified: true, isApproved: true, isActivated: true, isDeleted: false, };
/**
 *
 * @param data
 * @param sendOTP
 * @returns
 * Return new user account
 */
function createUserAccount(data, sendOTP) {
    return __awaiter(this, void 0, void 0, function* () {
        const { name, password, profession, username, email, accountType, dialCode, phoneNumber, profilePic, isActivated, businessProfileID, isApproved, privateAccount, geoCoordinate, isVerified, hasProfilePicture, socialIDs, language } = data;
        const newUser = new User();
        newUser.profilePic = profilePic;
        newUser.profession = profession;
        newUser.username = username;
        newUser.email = email;
        newUser.name = name;
        newUser.accountType = accountType;
        newUser.dialCode = dialCode;
        newUser.phoneNumber = phoneNumber;
        newUser.password = password;
        newUser.isActivated = isActivated;
        if (geoCoordinate) {
            newUser.geoCoordinate = geoCoordinate;
        }
        if (language) {
            newUser.language = language;
        }
        if (businessProfileID) {
            newUser.businessProfileID = businessProfileID;
        }
        if (isVerified !== undefined && isVerified !== null && isVerified === true) {
            newUser.isVerified = isVerified;
        }
        if (hasProfilePicture !== undefined && hasProfilePicture !== null && hasProfilePicture === true) {
            newUser.hasProfilePicture = hasProfilePicture;
        }
        if (isApproved !== undefined && isApproved !== null && isApproved === false) {
            newUser.isApproved = isApproved; //The business account needs to be approved by the admin; the default value of 'isApproved' is true.
        }
        if (privateAccount !== undefined && privateAccount !== null && privateAccount === false) {
            newUser.privateAccount = privateAccount; // All business account is public account 
        }
        if (socialIDs && (0, basic_2.isArray)(socialIDs)) {
            newUser.socialIDs = socialIDs;
        }
        const otp = (0, basic_3.generateOTP)();
        if (sendOTP) {
            emailNotificationService.sendEmailOTP(otp, newUser.email, 'verify-email');
        }
        newUser.otp = otp;
        return yield newUser.save();
    });
}
/**
 *
 * @param data
 * @returns
 * Return new business profile
 */
function createBusinessProfile(data) {
    return __awaiter(this, void 0, void 0, function* () {
        const { profilePic, username, businessTypeID, businessSubTypeID, name, bio, email, phoneNumber, dialCode, website, gstn, address, placeID, privateAccount } = data;
        const newBusinessProfile = new businessProfile_model_1.default();
        newBusinessProfile.profilePic = profilePic;
        newBusinessProfile.username = username;
        newBusinessProfile.businessTypeID = businessTypeID;
        newBusinessProfile.businessSubTypeID = businessSubTypeID;
        newBusinessProfile.name = name;
        newBusinessProfile.bio = bio;
        newBusinessProfile.address = address;
        newBusinessProfile.email = email;
        newBusinessProfile.phoneNumber = phoneNumber;
        newBusinessProfile.dialCode = dialCode;
        newBusinessProfile.website = website;
        newBusinessProfile.gstn = gstn;
        newBusinessProfile.placeID = placeID;
        newBusinessProfile.privateAccount = privateAccount;
        return yield newBusinessProfile.save();
    });
}
