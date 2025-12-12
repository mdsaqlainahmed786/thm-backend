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
const basic_1 = require("../../utils/helper/basic");
const response_1 = require("../../utils/response");
const subscription_model_1 = __importDefault(require("../../database/models/subscription.model"));
const mongodb_1 = require("mongodb");
const error_1 = require("../../utils/response-message/error");
const user_model_1 = require("../../database/models/user.model");
const order_model_1 = __importDefault(require("../../database/models/order.model"));
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
            const orders = yield order_model_1.default.distinct('_id', {
                $or: [
                    { orderID: { $regex: new RegExp(query.toLowerCase(), "i") } },
                    { razorPayOrderID: { $regex: new RegExp(query.toLowerCase(), "i") } },
                    { "paymentDetail.transactionID": { $regex: new RegExp(query.toLowerCase(), "i") } }
                ]
            });
            Object.assign(dbQuery, { orderID: { $in: orders } });
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
            subscription_model_1.default.aggregate([
                {
                    $match: dbQuery
                },
                {
                    '$lookup': {
                        'from': 'subscriptionplans',
                        'let': { 'subscriptionPlanID': '$subscriptionPlanID' },
                        'pipeline': [
                            { '$match': { '$expr': { '$eq': ['$_id', '$$subscriptionPlanID'] } } },
                            {
                                '$project': {
                                    'createdAt': 0,
                                    'updatedAt': 0,
                                    '__v': 0,
                                }
                            }
                        ],
                        'as': 'subscriptionPlansRef'
                    }
                },
                {
                    '$unwind': {
                        'path': '$subscriptionPlansRef',
                        'preserveNullAndEmptyArrays': true //false value does not fetch relationship.
                    }
                },
                {
                    '$lookup': {
                        'from': 'orders',
                        'let': { 'orderID': '$orderID' },
                        'pipeline': [
                            { '$match': { '$expr': { '$eq': ['$_id', '$$orderID'] } } },
                            {
                                '$project': {
                                    'createdAt': 0,
                                    'updatedAt': 0,
                                    '__v': 0,
                                }
                            }
                        ],
                        'as': 'ordersRef'
                    }
                },
                {
                    '$unwind': {
                        'path': '$ordersRef',
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
                            (0, user_model_1.profileBasicProject)()
                        ],
                        'as': 'usersRef'
                    }
                },
                {
                    '$unwind': {
                        'path': '$usersRef',
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
                        'subscriptionPlansRef.level': 0,
                        'subscriptionPlansRef.description': 0,
                        'subscriptionPlansRef.businessTypeID': 0,
                        'subscriptionPlansRef.businessSubtypeID': 0,
                        'subscriptionPlansRef.features': 0,
                        updatedAt: 0,
                        __v: 0,
                    }
                },
            ]),
            subscription_model_1.default.find(dbQuery).countDocuments()
        ]);
        const totalPagesCount = Math.ceil(totalDocument / documentLimit) || 1;
        return response.send((0, response_1.httpOkExtended)(documents, 'Subscriptions fetched.', pageNumber, totalPagesCount, totalDocument));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_a = error.message) !== null && _a !== void 0 ? _a : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
exports.default = { index };
