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
const mongodb_1 = require("mongodb");
const response_1 = require("../../utils/response");
const error_1 = require("../../utils/response-message/error");
const basic_1 = require("../../utils/helper/basic");
const subscriptionPlan_model_1 = __importStar(require("../../database/models/subscriptionPlan.model"));
const index = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = request.user;
        let { pageNumber, documentLimit, query, businessTypeID, businessSubtypeID, duration } = request.query;
        pageNumber = (0, basic_1.parseQueryParam)(pageNumber, 1);
        documentLimit = (0, basic_1.parseQueryParam)(documentLimit, 20);
        const dbQuery = {};
        if (!id) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        if (query !== undefined && query !== "") {
            Object.assign(dbQuery, {
                $or: [
                    { name: { $regex: new RegExp(query.toLowerCase(), "i") } },
                    { description: { $regex: new RegExp(query.toLowerCase(), "i") } },
                ]
            });
        }
        if (businessTypeID && businessTypeID !== undefined) {
            Object.assign(dbQuery, { businessTypeID: { $in: [new mongodb_1.ObjectId(businessTypeID)] } });
        }
        if (businessSubtypeID && businessSubtypeID !== undefined) {
            Object.assign(dbQuery, { businessSubtypeID: { $in: [new mongodb_1.ObjectId(businessSubtypeID)] } });
        }
        if (duration && duration !== undefined) {
            Object.assign(dbQuery, { duration: duration });
        }
        const [documents, totalDocument] = yield Promise.all([
            subscriptionPlan_model_1.default.aggregate([
                {
                    $match: dbQuery
                },
                {
                    '$lookup': {
                        'from': 'businesstypes',
                        'let': { 'businessTypeID': '$businessTypeID' },
                        'pipeline': [
                            { '$match': { '$expr': { '$in': ['$_id', '$$businessTypeID'] } } },
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
                },
                {
                    '$unwind': {
                        'path': '$businessTypeRef',
                        'preserveNullAndEmptyArrays': true //false value does not fetch relationship.
                    }
                },
                {
                    '$lookup': {
                        'from': 'businesssubtypes',
                        'let': { 'businessSubtypeID': '$businessSubtypeID' },
                        'pipeline': [
                            { '$match': { '$expr': { '$in': ['$_id', '$$businessSubtypeID'] } } },
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
                },
                {
                    '$unwind': {
                        'path': '$businessSubtypeRef',
                        'preserveNullAndEmptyArrays': true //false value does not fetch relationship.
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
                    $project: {
                        updatedAt: 0,
                        __v: 0,
                    }
                },
            ]),
            subscriptionPlan_model_1.default.find(dbQuery).countDocuments()
        ]);
        const totalPagesCount = Math.ceil(totalDocument / documentLimit) || 1;
        return response.send((0, response_1.httpOkExtended)(documents, 'Subscription plan fetched.', pageNumber, totalPagesCount, totalDocument));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_a = error.message) !== null && _a !== void 0 ? _a : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const store = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    try {
        const hostAddress = request.protocol + "://" + request.get("host");
        const { name, description, price, duration, type, currency, level, businessSubtypeID, businessTypeID, features } = request.body;
        const newSubscriptionPlan = new subscriptionPlan_model_1.default();
        newSubscriptionPlan.name = name;
        newSubscriptionPlan.description = description;
        newSubscriptionPlan.price = price;
        newSubscriptionPlan.duration = duration;
        if (level === subscriptionPlan_model_1.SubscriptionLevel.BASIC) {
            newSubscriptionPlan.image = hostAddress + '/public/files/basic-subscription-plan.png';
        }
        if (level === subscriptionPlan_model_1.SubscriptionLevel.STANDARD) {
            newSubscriptionPlan.image = hostAddress + '/public/files/standard-subscription-plan.png';
        }
        if (level === subscriptionPlan_model_1.SubscriptionLevel.PREMIUM) {
            newSubscriptionPlan.image = hostAddress + '/public/files/premium-subscription-plan.png';
        }
        newSubscriptionPlan.type = type;
        newSubscriptionPlan.level = level;
        newSubscriptionPlan.currency = currency;
        if (features && (0, basic_1.isArray)(features)) {
            newSubscriptionPlan.features = features;
        }
        if (businessTypeID) {
            newSubscriptionPlan.businessTypeID = [businessTypeID];
        }
        if (businessSubtypeID) {
            newSubscriptionPlan.businessSubtypeID = [businessSubtypeID];
        }
        const savedSubscriptionPlan = yield newSubscriptionPlan.save();
        return response.send((0, response_1.httpCreated)(savedSubscriptionPlan, 'Subscription created'));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_b = error.message) !== null && _b !== void 0 ? _b : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const update = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _c, _d;
    try {
        const ID = (_c = request === null || request === void 0 ? void 0 : request.params) === null || _c === void 0 ? void 0 : _c.id;
        const { name, description, price, duration, type, currency, level, businessSubtypeID, businessTypeID, features } = request.body;
        const subscriptionPlan = yield subscriptionPlan_model_1.default.findOne({ _id: ID });
        if (!subscriptionPlan) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest("Subscription plan not found"), "Subscription plan not found"));
        }
        subscriptionPlan.name = name !== null && name !== void 0 ? name : subscriptionPlan.name;
        subscriptionPlan.description = description !== null && description !== void 0 ? description : subscriptionPlan.description;
        subscriptionPlan.price = price !== null && price !== void 0 ? price : subscriptionPlan.price;
        subscriptionPlan.duration = duration !== null && duration !== void 0 ? duration : subscriptionPlan.duration;
        subscriptionPlan.type = type !== null && type !== void 0 ? type : subscriptionPlan.type;
        subscriptionPlan.currency = currency !== null && currency !== void 0 ? currency : subscriptionPlan.currency;
        subscriptionPlan.level = level !== null && level !== void 0 ? level : subscriptionPlan.level;
        if (businessTypeID) {
            subscriptionPlan.businessSubtypeID = [businessSubtypeID];
        }
        if (businessSubtypeID) {
            subscriptionPlan.businessTypeID = [businessTypeID];
        }
        if (features && (0, basic_1.isArray)(features)) {
            subscriptionPlan.features = features;
        }
        const savedSubscriptionPlan = yield subscriptionPlan.save();
        return response.send((0, response_1.httpAcceptedOrUpdated)(savedSubscriptionPlan, 'Subscription plan updated.'));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_d = error.message) !== null && _d !== void 0 ? _d : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const destroy = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _e, _f;
    try {
        const ID = (_e = request === null || request === void 0 ? void 0 : request.params) === null || _e === void 0 ? void 0 : _e.id;
        const subscriptionPlan = yield subscriptionPlan_model_1.default.findOne({ _id: ID });
        if (!subscriptionPlan) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest("Subscription plan not found"), "Subscription plan not found"));
        }
        yield subscriptionPlan.deleteOne();
        return response.send((0, response_1.httpNoContent)(null, 'Subscription plan deleted'));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_f = error.message) !== null && _f !== void 0 ? _f : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const show = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _g;
    try {
        let { id } = request.params;
        const dbQuery = { _id: new mongodb_1.ObjectId(id) };
        const subscriptionPlan = yield subscriptionPlan_model_1.default.aggregate([
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
            {
                $sort: { createdAt: -1, id: 1 }
            },
            {
                $limit: 1
            },
        ]);
        if (subscriptionPlan.length === 0) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.SUBSCRIPTION_NOT_FOUND), error_1.ErrorMessage.SUBSCRIPTION_NOT_FOUND));
        }
        return response.send((0, response_1.httpOk)(subscriptionPlan[0], "Subscription data fetched"));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_g = error.message) !== null && _g !== void 0 ? _g : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
exports.default = { index, store, update, destroy, show };
