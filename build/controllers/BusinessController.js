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
const response_1 = require("../utils/response");
const error_1 = require("../utils/response-message/error");
const anonymousUser_model_1 = require("../database/models/anonymousUser.model");
const common_1 = require("../common");
const mongodb_1 = require("mongodb");
const moment_1 = __importDefault(require("moment"));
const basic_1 = require("../utils/helper/basic");
const accountReach_model_1 = __importDefault(require("../database/models/accountReach.model"));
const websiteRedirection_model_1 = __importDefault(require("../database/models/websiteRedirection.model"));
const post_model_1 = __importStar(require("../database/models/post.model"));
const story_model_1 = __importStar(require("../database/models/story.model"));
const userConnection_model_1 = __importStar(require("../database/models/userConnection.model"));
const like_model_1 = __importDefault(require("../database/models/like.model"));
const view_model_1 = __importDefault(require("../database/models/view.model."));
const comment_model_1 = __importDefault(require("../database/models/comment.model"));
const message_model_1 = __importStar(require("../database/models/message.model"));
const sharedContent_model_1 = __importDefault(require("../database/models/sharedContent.model"));
const businessProfile_model_1 = __importDefault(require("../database/models/businessProfile.model"));
const businessType_model_1 = __importDefault(require("../database/models/businessType.model"));
const businessSubType_model_1 = __importDefault(require("../database/models/businessSubType.model"));
const businessQuestion_model_1 = __importDefault(require("../database/models/businessQuestion.model"));
const businessAnswer_model_1 = __importDefault(require("../database/models/businessAnswer.model"));
const user_model_1 = __importDefault(require("../database/models/user.model"));
const anonymousUser_model_2 = __importDefault(require("../database/models/anonymousUser.model"));
const businessReviewQuestion_model_1 = __importDefault(require("../database/models/businessReviewQuestion.model"));
const constants_1 = require("../config/constants");
const axios_1 = __importDefault(require("axios"));
const EncryptionService_1 = __importDefault(require("../services/EncryptionService"));
const encryptionService = new EncryptionService_1.default();
const businessTypes = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const businessTypes = yield businessType_model_1.default.find();
        return response.send((0, response_1.httpOk)(businessTypes, "Business type fetched"));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_a = error.message) !== null && _a !== void 0 ? _a : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const businessSubTypes = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    try {
        const ID = request.params.id;
        const businessTypes = yield businessSubType_model_1.default.find({ businessTypeID: ID });
        return response.send((0, response_1.httpOk)(businessTypes, "Business subtype fetched"));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_b = error.message) !== null && _b !== void 0 ? _b : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const businessQuestions = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _c;
    try {
        const { businessSubtypeID, businessTypeID } = request.body;
        const businessQuestions = yield businessQuestion_model_1.default.find({ businessTypeID: { $in: [businessTypeID] }, businessSubtypeID: { $in: [businessSubtypeID] } }, '_id question answer').sort({ order: 1 }).limit(6);
        return response.send((0, response_1.httpOk)(businessQuestions, "Business questions fetched"));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_c = error.message) !== null && _c !== void 0 ? _c : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const businessQuestionAnswer = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _d;
    try {
        const { id } = request.user;
        const body = request.body;
        let questionIDs = [];
        let answers = [];
        if ((0, basic_1.isArray)(body)) {
            const user = yield user_model_1.default.findOne({ _id: id });
            if (!user) {
                return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
            }
            if (user.accountType !== anonymousUser_model_1.AccountType.BUSINESS) {
                return response.send((0, response_1.httpForbidden)(error_1.ErrorMessage.invalidRequest("Access Denied! You don't have business account"), "Access Denied! You don't have business account"));
            }
            if (!user.businessProfileID) {
                return response.send((0, response_1.httpBadRequest)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.BUSINESS_PROFILE_NOT_FOUND), error_1.ErrorMessage.BUSINESS_PROFILE_NOT_FOUND));
            }
            const businessProfile = yield businessProfile_model_1.default.findOne({ _id: user.businessProfileID });
            if (!businessProfile) {
                return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.BUSINESS_PROFILE_NOT_FOUND), error_1.ErrorMessage.BUSINESS_PROFILE_NOT_FOUND));
            }
            body.map((answerData) => {
                if (answerData.questionID && answerData.answer && answerData.answer.toLowerCase() === "yes") {
                    questionIDs.push(answerData.questionID);
                    answers.push({
                        questionID: answerData === null || answerData === void 0 ? void 0 : answerData.questionID,
                        answer: answerData === null || answerData === void 0 ? void 0 : answerData.answer,
                        businessProfileID: businessProfile._id
                    });
                }
                else {
                    answers.push({
                        questionID: answerData === null || answerData === void 0 ? void 0 : answerData.questionID,
                        answer: answerData === null || answerData === void 0 ? void 0 : answerData.answer,
                        businessProfileID: businessProfile._id
                    });
                }
            });
            const [businessQuestionAnswerIDs, businessAnswer] = yield Promise.all([
                businessQuestion_model_1.default.distinct('_id', {
                    _id: { $in: questionIDs },
                    businessTypeID: { $in: [businessProfile.businessTypeID] }, businessSubtypeID: { $in: [businessProfile.businessSubTypeID] }
                }),
                //Remove old answer from db
                businessAnswer_model_1.default.deleteMany({ businessProfileID: businessProfile._id })
            ]);
            businessProfile.amenities = businessQuestionAnswerIDs;
            //store new answer
            const savedAnswers = yield businessAnswer_model_1.default.create(answers);
            const savedAmenity = yield businessProfile.save();
            return response.send((0, response_1.httpOk)(savedAmenity, "Business answer saved successfully"));
        }
        else {
            return response.send((0, response_1.httpBadRequest)(error_1.ErrorMessage.invalidRequest("Invalid request payload"), "Invalid request payload"));
        }
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_d = error.message) !== null && _d !== void 0 ? _d : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const insights = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _e;
    try {
        const { id, accountType, businessProfileID } = request.user;
        let parsedQuerySet = request.query;
        let { filter } = parsedQuerySet;
        if (!id) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        if (accountType !== anonymousUser_model_1.AccountType.BUSINESS) {
            return response.send((0, response_1.httpForbidden)(error_1.ErrorMessage.invalidRequest("Access denied: You do not have the necessary permissions to access this API."), "Access denied: You do not have the necessary permissions to access this API."));
        }
        const { currentDate, labels, groupFormat, labelFormat } = createChartLabels(filter);
        /**
         * Calculate Engagement Metrics = Total Interactions
         * Total Interactions = Total Likes + Total Shares + Total Comments + Total Reactions + Total Clicks + Total Views
         */
        const [totalFollowers, followerData, websiteRedirection, websiteRedirectionData, accountReached, accountReachedData, stories, posts] = yield Promise.all([
            userConnection_model_1.default.find({ following: id, status: userConnection_model_1.ConnectionStatus.ACCEPTED }).countDocuments(),
            fetchFollowerData({ following: new mongodb_1.ObjectId(id), status: userConnection_model_1.ConnectionStatus.ACCEPTED }, groupFormat, labels, labelFormat),
            websiteRedirection_model_1.default.find({ businessProfileID: businessProfileID }).countDocuments(),
            fetchWebsiteRedirectionData({ businessProfileID: new mongodb_1.ObjectId(businessProfileID) }, groupFormat, labels, labelFormat),
            accountReach_model_1.default.find({ businessProfileID: businessProfileID }).countDocuments(),
            fetchAccountReach({ businessProfileID: businessProfileID }, groupFormat, labels, labelFormat),
            story_model_1.default.aggregate([
                {
                    $match: { userID: new mongodb_1.ObjectId(id), }
                },
                (0, story_model_1.addMediaInStory)().lookup,
                (0, story_model_1.addMediaInStory)().unwindLookup,
                (0, story_model_1.addMediaInStory)().replaceRootAndMergeObjects,
                (0, story_model_1.addMediaInStory)().project,
                {
                    $sort: { createdAt: -1, id: 1 }
                },
                {
                    $limit: 10
                }
            ]).exec(),
            (0, post_model_1.fetchPosts)(Object.assign(Object.assign({}, post_model_1.getPostQuery), { userID: new mongodb_1.ObjectId(id) }), [], [], [], 1, 10)
        ]);
        const { engagementsData, engagements } = yield fetchEngagedData(businessProfileID, id, groupFormat, labels, labelFormat);
        const responseData = {
            dashboard: {
                accountReached: accountReached,
                websiteRedirection,
                totalFollowers,
                engagements: engagements,
                engaged: 0, //FIXME remove me
            },
            data: {
                accountReached: accountReachedData,
                websiteRedirection: websiteRedirectionData,
                totalFollowers: followerData,
                engagements: engagementsData,
                engaged: [], //TODO remove me
            },
            stories: stories,
            posts: posts
        };
        return response.send((0, response_1.httpOk)(responseData, 'Insights fetched'));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_e = error.message) !== null && _e !== void 0 ? _e : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const collectInsightsData = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _f;
    try {
        const { id, accountType } = request.user;
        const myBusinessProfile = request.user.businessProfileID;
        const { type, businessProfileID } = request.body;
        if (!id) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        if (myBusinessProfile && (myBusinessProfile === null || myBusinessProfile === void 0 ? void 0 : myBusinessProfile.toString()) === businessProfileID.toString()) {
            return response.send((0, response_1.httpBadRequest)(error_1.ErrorMessage.invalidRequest("The target Business Profile ID you entered matches your existing Business Profile ID. Please select a different target ID."), "The target Business Profile ID you entered matches your existing Business Profile ID. Please select a different target ID."));
        }
        const business = yield businessProfile_model_1.default.findOne({ _id: businessProfileID });
        if (!business) {
            return response.send((0, response_1.httpBadRequest)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.BUSINESS_PROFILE_NOT_FOUND), error_1.ErrorMessage.BUSINESS_PROFILE_NOT_FOUND));
        }
        switch (type) {
            case common_1.InsightType.WEBSITE_REDIRECTION:
                if (!business.website) {
                    return response.send((0, response_1.httpBadRequest)(error_1.ErrorMessage.invalidRequest("Website link not found"), "Website linkk not found"));
                }
                const newRedirection = new websiteRedirection_model_1.default();
                newRedirection.userID = id;
                newRedirection.businessProfileID = business.id;
                yield newRedirection.save();
                return response.send((0, response_1.httpOk)(newRedirection, "Data collected"));
            case common_1.InsightType.ACCOUNT_REACH:
                const isAccountReact = yield accountReach_model_1.default.findOne({ reachedBy: id, businessProfileID: businessProfileID });
                if (!isAccountReact) {
                    const newAccountReach = new accountReach_model_1.default();
                    newAccountReach.businessProfileID = businessProfileID;
                    newAccountReach.reachedBy = id;
                    const savedAccountReach = yield newAccountReach.save();
                    return response.send((0, response_1.httpOk)(savedAccountReach, "Data collected"));
                }
                return response.send((0, response_1.httpOk)(isAccountReact, 'Data collected'));
        }
        return response.send("");
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_f = error.message) !== null && _f !== void 0 ? _f : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
//Fetch business based on google place id 
const getBusinessProfileByPlaceID = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u;
    try {
        const { placeID } = request.params;
        let parsedQuerySet = request.query;
        let { businessProfileID } = parsedQuerySet;
        const dbQuery = { placeID: placeID, };
        if (businessProfileID && businessProfileID !== '') {
            Object.assign(dbQuery, { _id: businessProfileID });
        }
        let type = "business-profile";
        const businessProfileRef = yield businessProfile_model_1.default.findOne(dbQuery, '_id id name coverImage profilePic address businessTypeID businessSubTypeID');
        if (!businessProfileRef) {
            const googlePlaceApiUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeID}&key=${constants_1.AppConfig.GOOGLE.MAP_KEY}`;
            const apiResponse = yield (yield fetch(googlePlaceApiUrl)).json();
            if (apiResponse.status === "OK") {
                const data = apiResponse.result;
                const name = (_g = data === null || data === void 0 ? void 0 : data.name) !== null && _g !== void 0 ? _g : "";
                const rating = (_h = data === null || data === void 0 ? void 0 : data.rating) !== null && _h !== void 0 ? _h : 0;
                const lat = (_l = (_k = (_j = data === null || data === void 0 ? void 0 : data.geometry) === null || _j === void 0 ? void 0 : _j.location) === null || _k === void 0 ? void 0 : _k.lat) !== null && _l !== void 0 ? _l : 0;
                const lng = (_p = (_o = (_m = data === null || data === void 0 ? void 0 : data.geometry) === null || _m === void 0 ? void 0 : _m.location) === null || _o === void 0 ? void 0 : _o.lng) !== null && _p !== void 0 ? _p : 0;
                /***
                 * Review Question based on place type
                 */
                let reviewQuestions = [];
                const types = (_q = data === null || data === void 0 ? void 0 : data.types) !== null && _q !== void 0 ? _q : [];
                let businessTypeID = undefined;
                const predictedCategoryName = (0, basic_1.predictCategory)(types, name);
                if (predictedCategoryName) {
                    const businessType = yield businessType_model_1.default.findOne({ name: predictedCategoryName });
                    if (businessType) {
                        businessTypeID = businessType.id;
                        reviewQuestions = yield businessReviewQuestion_model_1.default.find({ businessTypeID: { $in: [businessTypeID] } }).limit(8);
                    }
                }
                console.log("predictedCategory", predictedCategoryName);
                const photoReference = (data === null || data === void 0 ? void 0 : data.photos) && ((_r = data === null || data === void 0 ? void 0 : data.photos) === null || _r === void 0 ? void 0 : _r.length) !== 0 ? (_t = (_s = data === null || data === void 0 ? void 0 : data.photos) === null || _s === void 0 ? void 0 : _s[0]) === null || _t === void 0 ? void 0 : _t.photo_reference : null;
                let street = "";
                let city = "";
                let state = "";
                let zipCode = "";
                let country = "";
                const address_components = data === null || data === void 0 ? void 0 : data.address_components;
                address_components.map((component) => {
                    const types = component.types;
                    if (types.includes('street_number') || types.includes('route') || types.includes("neighborhood") || types.includes("sublocality")) {
                        street = component.long_name;
                    }
                    else if (types.includes('locality')) {
                        city = component.long_name;
                    }
                    else if (types.includes('administrative_area_level_1')) {
                        state = component.short_name;
                    }
                    else if (types.includes('postal_code')) {
                        zipCode = component.long_name;
                    }
                    else if (types.includes('country')) {
                        country = component.short_name;
                    }
                });
                let coverImage = "";
                if (photoReference) {
                    coverImage = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoReference}&key=${constants_1.AppConfig.GOOGLE.MAP_KEY}`;
                    const res = yield axios_1.default.get(coverImage);
                    coverImage = res.request._redirectable._options.href;
                }
                const anonymousBusinessExits = yield anonymousUser_model_2.default.findOne({ placeID: placeID, accountType: anonymousUser_model_1.AccountType.BUSINESS });
                type = "google-business-profile";
                if (!anonymousBusinessExits) {
                    const newAnonymousBusiness = new anonymousUser_model_2.default();
                    newAnonymousBusiness.accountType = anonymousUser_model_1.AccountType.BUSINESS;
                    newAnonymousBusiness.name = name;
                    const geoCoordinate = { type: "Point", coordinates: [lng, lat] };
                    newAnonymousBusiness.address = { city, state, street, zipCode, country, geoCoordinate, lat, lng };
                    newAnonymousBusiness.profilePic = {
                        "small": coverImage,
                        "medium": coverImage,
                        "large": coverImage
                    };
                    newAnonymousBusiness.coverImage = coverImage;
                    newAnonymousBusiness.rating = rating;
                    newAnonymousBusiness.placeID = placeID;
                    if (businessTypeID) {
                        newAnonymousBusiness.businessTypeID = businessTypeID;
                    }
                    const businessProfileRef = yield newAnonymousBusiness.save();
                    return response.send((0, response_1.httpOk)({ businessProfileRef: Object.assign({}, businessProfileRef.toJSON(), { type: type }), reviewQuestions }, "Business profile fetched"));
                }
                else {
                    return response.send((0, response_1.httpOk)({ businessProfileRef: Object.assign({}, anonymousBusinessExits.toJSON(), { type: type }), reviewQuestions }, "Business profile fetched"));
                }
            }
            return response.send((0, response_1.httpInternalServerError)(null, error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
        }
        const reviewQuestions = yield businessReviewQuestion_model_1.default.find({ businessTypeID: { $in: businessProfileRef.businessTypeID }, businessSubtypeID: { $in: businessProfileRef.businessSubTypeID } }, '_id question id');
        return response.send((0, response_1.httpOk)({ businessProfileRef: Object.assign({}, businessProfileRef.toJSON(), { type: type }), reviewQuestions }, "Business profile fetched"));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_u = error.message) !== null && _u !== void 0 ? _u : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
//Fetch business profile by encrypted business profile id
const getBusinessProfileByID = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _v;
    try {
        const { encryptedID } = request.params;
        const decryptedBusinessProfileID = encryptionService.decrypt(encryptedID);
        const businessProfileRef = yield businessProfile_model_1.default.findOne({ _id: decryptedBusinessProfileID }, '_id id name coverImage profilePic address businessTypeID businessSubTypeID');
        if (!businessProfileRef) {
            return response.send((0, response_1.httpBadRequest)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.BUSINESS_PROFILE_NOT_FOUND), error_1.ErrorMessage.BUSINESS_PROFILE_NOT_FOUND));
        }
        const reviewQuestions = yield businessReviewQuestion_model_1.default.find({ businessTypeID: { $in: businessProfileRef.businessTypeID }, businessSubtypeID: { $in: businessProfileRef.businessSubTypeID } }, '_id question id');
        return response.send((0, response_1.httpOk)({
            businessProfileRef,
            reviewQuestions
        }, "Business profile fetched"));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_v = error.message) !== null && _v !== void 0 ? _v : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
//Fetch business profile by direct business profile id (not encrypted)
const getBusinessProfileByDirectID = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _w;
    try {
        const { id } = request.params;
        const businessProfileRef = yield businessProfile_model_1.default.findOne({ _id: id }, '_id id name coverImage profilePic address businessTypeID businessSubTypeID');
        if (!businessProfileRef) {
            return response.send((0, response_1.httpBadRequest)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.BUSINESS_PROFILE_NOT_FOUND), error_1.ErrorMessage.BUSINESS_PROFILE_NOT_FOUND));
        }
        const reviewQuestions = yield businessReviewQuestion_model_1.default.find({ businessTypeID: { $in: businessProfileRef.businessTypeID }, businessSubtypeID: { $in: businessProfileRef.businessSubTypeID } }, '_id question id');
        return response.send((0, response_1.httpOk)({
            businessProfileRef,
            reviewQuestions
        }, "Business profile fetched"));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_w = error.message) !== null && _w !== void 0 ? _w : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
function createChartLabels(filter) {
    const currentDate = (0, moment_1.default)();
    let startDate;
    let endDate;
    let days;
    let lastMonthStartDate;
    let lastMonthEndDate;
    let labelFormat;
    let labels;
    let groupFormat; //group sale order to weekly, monthly and yearly
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    switch (filter) {
        case "yearly":
            startDate = new Date(currentDate.startOf('year').toISOString());
            endDate = new Date(currentDate.endOf('year').toISOString());
            lastMonthStartDate = new Date(currentDate.clone().subtract(1, 'year').startOf('year').toISOString());
            lastMonthEndDate = new Date(currentDate.clone().subtract(1, 'year').endOf('year').toISOString());
            groupFormat = "%Y-%m"; //Month and year only 
            labelFormat = '%m';
            labels = monthNames;
            // days = calculateTotalDays(startDate, endDate);
            break;
        case "monthly":
            startDate = new Date(currentDate.startOf('month').toISOString());
            endDate = new Date(currentDate.endOf('month').toISOString());
            lastMonthStartDate = new Date(currentDate.clone().subtract(1, 'month').startOf('month').toISOString());
            lastMonthEndDate = new Date(currentDate.clone().subtract(1, 'month').endOf('month').toISOString());
            labelFormat = '%d';
            groupFormat = "%Y-%m-%d";
            labels = [`${1} ${currentDate.format('MMM')}`, `${2} ${currentDate.format('MMM')}`, `${3} ${currentDate.format('MMM')}`, `${4} ${currentDate.format('MMM')}`, `${5} ${currentDate.format('MMM')}`, `${6} ${currentDate.format('MMM')}`, `${7} ${currentDate.format('MMM')}`, `${8} ${currentDate.format('MMM')}`, `${9} ${currentDate.format('MMM')}`, `${10} ${currentDate.format('MMM')}`, `${11} ${currentDate.format('MMM')}`, `${12} ${currentDate.format('MMM')}`, `${13} ${currentDate.format('MMM')}`, `${14} ${currentDate.format('MMM')}`, `${15} ${currentDate.format('MMM')}`, `${16} ${currentDate.format('MMM')}`, `${17} ${currentDate.format('MMM')}`, `${18} ${currentDate.format('MMM')}`, `${19} ${currentDate.format('MMM')}`, `${20} ${currentDate.format('MMM')}`, `${21} ${currentDate.format('MMM')}`, `${22} ${currentDate.format('MMM')}`, `${23} ${currentDate.format('MMM')}`, `${24} ${currentDate.format('MMM')}`, `${25} ${currentDate.format('MMM')}`, `${26} ${currentDate.format('MMM')}`, `${27} ${currentDate.format('MMM')}`, `${28} ${currentDate.format('MMM')}`, `${29} ${currentDate.format('MMM')}`, `${30} ${currentDate.format('MMM')}`, `${31} ${currentDate.format('MMM')}`];
            // days = calculateTotalDays(startDate, endDate);
            break;
        default:
            startDate = new Date(currentDate.startOf('week').toISOString());
            endDate = new Date(currentDate.endOf('week').toISOString());
            lastMonthStartDate = new Date(currentDate.clone().subtract(1, 'week').startOf('week').toISOString());
            lastMonthEndDate = new Date(currentDate.clone().subtract(1, 'week').endOf('week').toISOString());
            labelFormat = "%u";
            labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
            groupFormat = "%Y-%m-%d";
            // days = calculateTotalDays(startDate, endDate);
            break;
    }
    return {
        currentDate,
        labelFormat,
        groupFormat,
        labels,
        startDate,
        endDate,
        lastMonthStartDate,
        lastMonthEndDate
    };
}
function fetchWebsiteRedirectionData(query, groupFormat, labels, labelFormat) {
    return websiteRedirection_model_1.default.aggregate([
        {
            $match: query
        },
        {
            $group: {
                _id: { $dateToString: { format: groupFormat, date: "$createdAt" } },
                createdAt: { '$first': "$createdAt" },
                redirection: { $sum: 1 }, // Optional: Count the number of sales per day
            },
        },
        {
            $project: {
                _id: 0,
                redirection: 1,
                labelName: {
                    $let: {
                        vars: {
                            labelNames: labels //Label array base on global filter 
                        },
                        in: {
                            $arrayElemAt: [
                                "$$labelNames", //Create label name based on global filter and dateString
                                {
                                    $subtract: [{ $toInt: { $dateToString: { format: labelFormat, date: "$createdAt" } } }, 1]
                                }
                            ]
                        }
                    }
                }
            }
        },
        {
            $group: {
                _id: null,
                data: { $push: "$$ROOT" }
            }
        },
        {
            $project: {
                _id: 0,
                data: {
                    $map: {
                        input: labels,
                        as: "labelName",
                        in: {
                            $let: {
                                vars: {
                                    matchedData: {
                                        $filter: {
                                            input: "$data",
                                            as: "item",
                                            cond: { $eq: ["$$item.labelName", "$$labelName"] }
                                        }
                                    }
                                },
                                in: {
                                    $cond: {
                                        if: { $eq: [{ $size: "$$matchedData" }, 0] },
                                        then: {
                                            redirection: 0,
                                            labelName: "$$labelName"
                                        },
                                        else: { $arrayElemAt: ["$$matchedData", 0] }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        {
            $unwind: "$data"
        },
        {
            $replaceRoot: { newRoot: "$data" }
        },
    ]).exec();
}
function fetchFollowerData(query, groupFormat, labels, labelFormat) {
    return userConnection_model_1.default.aggregate([
        {
            $match: query
        },
        {
            $group: {
                _id: { $dateToString: { format: groupFormat, date: "$createdAt" } },
                createdAt: { '$first': "$createdAt" },
                followers: { $sum: 1 }, // Optional: Count the number of sales per day
            },
        },
        {
            $project: {
                _id: 0,
                followers: 1,
                labelName: {
                    $let: {
                        vars: {
                            labelNames: labels //Label array base on global filter 
                        },
                        in: {
                            $arrayElemAt: [
                                "$$labelNames", //Create label name based on global filter and dateString
                                {
                                    $subtract: [{ $toInt: { $dateToString: { format: labelFormat, date: "$createdAt" } } }, 1]
                                }
                            ]
                        }
                    }
                }
            }
        },
        {
            $group: {
                _id: null,
                data: { $push: "$$ROOT" }
            }
        },
        {
            $project: {
                _id: 0,
                data: {
                    $map: {
                        input: labels,
                        as: "labelName",
                        in: {
                            $let: {
                                vars: {
                                    matchedData: {
                                        $filter: {
                                            input: "$data",
                                            as: "item",
                                            cond: { $eq: ["$$item.labelName", "$$labelName"] }
                                        }
                                    }
                                },
                                in: {
                                    $cond: {
                                        if: { $eq: [{ $size: "$$matchedData" }, 0] },
                                        then: {
                                            followers: 0,
                                            labelName: "$$labelName"
                                        },
                                        else: { $arrayElemAt: ["$$matchedData", 0] }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        {
            $unwind: "$data"
        },
        {
            $replaceRoot: { newRoot: "$data" }
        },
    ]);
}
function fetchAccountReach(query, groupFormat, labels, labelFormat) {
    return accountReach_model_1.default.aggregate([
        {
            $match: query
        },
        {
            $group: {
                _id: { $dateToString: { format: groupFormat, date: "$createdAt" } },
                createdAt: { '$first': "$createdAt" },
                accountReach: { $sum: 1 }, // Optional: Count the number of sales per day
            },
        },
        {
            $project: {
                _id: 0,
                accountReach: 1,
                labelName: {
                    $let: {
                        vars: {
                            labelNames: labels //Label array base on global filter 
                        },
                        in: {
                            $arrayElemAt: [
                                "$$labelNames", //Create label name based on global filter and dateString
                                {
                                    $subtract: [{ $toInt: { $dateToString: { format: labelFormat, date: "$createdAt" } } }, 1]
                                }
                            ]
                        }
                    }
                }
            }
        },
        {
            $group: {
                _id: null,
                data: { $push: "$$ROOT" }
            }
        },
        {
            $project: {
                _id: 0,
                data: {
                    $map: {
                        input: labels,
                        as: "labelName",
                        in: {
                            $let: {
                                vars: {
                                    matchedData: {
                                        $filter: {
                                            input: "$data",
                                            as: "item",
                                            cond: { $eq: ["$$item.labelName", "$$labelName"] }
                                        }
                                    }
                                },
                                in: {
                                    $cond: {
                                        if: { $eq: [{ $size: "$$matchedData" }, 0] },
                                        then: {
                                            accountReach: 0,
                                            labelName: "$$labelName"
                                        },
                                        else: { $arrayElemAt: ["$$matchedData", 0] }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        {
            $unwind: "$data"
        },
        {
            $replaceRoot: { newRoot: "$data" }
        },
    ]);
}
function engagementAggregatePipeline(groupFormat, labels, labelFormat) {
    const pipeline = [
        {
            $group: {
                _id: { $dateToString: { format: groupFormat, date: "$createdAt" } },
                createdAt: { '$first': "$createdAt" },
                engagement: { $sum: 1 }, // Optional: Count the number of sales per day
            },
        },
        {
            $project: {
                _id: 0,
                engagement: 1,
                labelName: {
                    $let: {
                        vars: {
                            labelNames: labels //Label array base on global filter 
                        },
                        in: {
                            $arrayElemAt: [
                                "$$labelNames", //Create label name based on global filter and dateString
                                {
                                    $subtract: [{ $toInt: { $dateToString: { format: labelFormat, date: "$createdAt" } } }, 1]
                                }
                            ]
                        }
                    }
                }
            }
        },
        {
            $group: {
                _id: null,
                data: { $push: "$$ROOT" }
            }
        },
        {
            $project: {
                _id: 0,
                data: {
                    $map: {
                        input: labels,
                        as: "labelName",
                        in: {
                            $let: {
                                vars: {
                                    matchedData: {
                                        $filter: {
                                            input: "$data",
                                            as: "item",
                                            cond: { $eq: ["$$item.labelName", "$$labelName"] }
                                        }
                                    }
                                },
                                in: {
                                    $cond: {
                                        if: { $eq: [{ $size: "$$matchedData" }, 0] },
                                        then: {
                                            engagement: 0,
                                            labelName: "$$labelName"
                                        },
                                        else: { $arrayElemAt: ["$$matchedData", 0] }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        {
            $unwind: "$data"
        },
        {
            $replaceRoot: { newRoot: "$data" }
        },
    ];
    return { pipeline };
}
function fetchEngagedData(businessProfileID, userID, groupFormat, labels, labelFormat) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(businessProfileID, userID, "businessProfileID");
        //analyzing posts && stories
        const [posts, stories] = yield Promise.all([
            post_model_1.default.distinct('_id', { businessProfileID: new mongodb_1.ObjectId(businessProfileID) }),
            story_model_1.default.distinct('_id', { $match: { userID: new mongodb_1.ObjectId(userID), timeStamp: { $gte: story_model_1.storyTimeStamp } } })
        ]);
        console.log(posts);
        console.log(stories);
        const [likesData, commentsData, sharedContentData, storyLikesData, storyCommentsData, storyViewsData, likes, comments, sharedContent, storyLikes, storyComments, storyViews] = yield Promise.all([
            like_model_1.default.aggregate([
                {
                    $match: { postID: { $in: posts } }
                },
                ...engagementAggregatePipeline(groupFormat, labels, labelFormat).pipeline
            ]),
            comment_model_1.default.aggregate([
                {
                    $match: { postID: { $in: posts } }
                },
                ...engagementAggregatePipeline(groupFormat, labels, labelFormat).pipeline
            ]),
            sharedContent_model_1.default.aggregate([
                {
                    $match: { contentID: { $in: posts }, contentType: common_1.ContentType.POST }
                },
                ...engagementAggregatePipeline(groupFormat, labels, labelFormat).pipeline
            ]),
            like_model_1.default.aggregate([
                {
                    $match: { storyID: { $in: stories } }
                },
                ...engagementAggregatePipeline(groupFormat, labels, labelFormat).pipeline
            ]),
            message_model_1.default.aggregate([
                {
                    $match: { storyID: { $in: stories }, type: message_model_1.MessageType.STORY_COMMENT }
                },
                ...engagementAggregatePipeline(groupFormat, labels, labelFormat).pipeline
            ]),
            view_model_1.default.aggregate([
                {
                    $match: { storyID: { $in: stories } }
                },
                ...engagementAggregatePipeline(groupFormat, labels, labelFormat).pipeline
            ]),
            like_model_1.default.countDocuments({ postID: { $in: posts } }),
            comment_model_1.default.countDocuments({ postID: { $in: posts } }),
            sharedContent_model_1.default.countDocuments({ contentID: { $in: posts }, contentType: common_1.ContentType.POST }),
            like_model_1.default.countDocuments({ storyID: { $in: stories } }),
            message_model_1.default.countDocuments({ storyID: { $in: stories }, type: message_model_1.MessageType.STORY_COMMENT }),
            view_model_1.default.countDocuments({ storyID: { $in: stories } })
        ]);
        console.log(storyLikes);
        console.log(storyComments);
        console.log(storyViews);
        console.log(likes);
        console.log(comments);
        console.log(sharedContent);
        const allEngagements = [...likesData, ...commentsData, ...sharedContentData, ...storyLikesData, ...storyCommentsData, ...storyViewsData,];
        // Group by `labelName` and sum the engagements
        const engagementsData = allEngagements.reduce((acc, { labelName, engagement }) => {
            // Find the existing entry for the current `labelName`
            const existing = acc.find((item) => item.labelName === labelName);
            if (existing) {
                // If entry exists, add the engagement to it
                existing.engagement += engagement;
            }
            else {
                // If no entry exists, create a new one
                acc.push({ labelName, engagement });
            }
            return acc;
        }, []);
        const engagements = likes + comments + sharedContent + storyLikes + storyComments + storyViews;
        console.log(allEngagements);
        console.log(engagements);
        return { engagementsData, engagements };
    });
}
exports.default = { insights, collectInsightsData, businessTypes, businessSubTypes, businessQuestions, businessQuestionAnswer, getBusinessProfileByPlaceID, getBusinessProfileByID, getBusinessProfileByDirectID };
