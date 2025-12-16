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
const mongodb_1 = require("mongodb");
const basic_1 = require("../../utils/helper/basic");
const response_1 = require("../../utils/response");
const error_1 = require("../../utils/response-message/error");
const businessReviewQuestion_model_1 = __importDefault(require("../../database/models/businessReviewQuestion.model"));
const businessSubType_model_1 = __importDefault(require("../../database/models/businessSubType.model"));
const businessType_model_1 = __importDefault(require("../../database/models/businessType.model"));
const index = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = request.user;
        let { pageNumber, documentLimit, query, businessType, businessSubtype } = request.query;
        pageNumber = (0, basic_1.parseQueryParam)(pageNumber, 1);
        documentLimit = (0, basic_1.parseQueryParam)(documentLimit, 20);
        const dbQuery = {};
        if (!id) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        if (query !== undefined && query !== "") {
            Object.assign(dbQuery, {
                $or: [
                    { question: { $regex: new RegExp(query.toLowerCase(), "i") } },
                    { description: { $regex: new RegExp(query.toLowerCase(), "i") } },
                ]
            });
        }
        if (businessType !== undefined) {
            Object.assign(dbQuery, { businessTypeID: { $in: [new mongodb_1.ObjectId(businessType)] } });
        }
        if (businessSubtype !== businessSubtype) {
            Object.assign(dbQuery, { businessSubtypeID: { $in: [new mongodb_1.ObjectId(businessSubtype)] } });
        }
        const [documents, totalDocument] = yield Promise.all([
            businessReviewQuestion_model_1.default.aggregate([
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
            businessReviewQuestion_model_1.default.find(dbQuery).countDocuments()
        ]);
        const totalPagesCount = Math.ceil(totalDocument / documentLimit) || 1;
        return response.send((0, response_1.httpOkExtended)(documents, 'Review question fetched.', pageNumber, totalPagesCount, totalDocument));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_a = error.message) !== null && _a !== void 0 ? _a : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const store = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { question, businessSubtypeID, businessTypeID } = request.body;
        const [previousOrder, businessType, businessSubType] = yield Promise.all([
            businessReviewQuestion_model_1.default.find({ businessTypeID: { $in: [businessTypeID] }, businessSubtypeID: { $in: [businessSubtypeID] } }).sort({ order: -1 }),
            businessType_model_1.default.findOne({ _id: businessTypeID }),
            businessSubType_model_1.default.findOne({ _id: businessSubtypeID }),
        ]);
        if (!businessType) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest("Business type not found"), "Business type not found"));
        }
        if (!businessSubType) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest("Business subtype not found"), "Business subtype not found"));
        }
        const newBusinessReviewQuestion = new businessReviewQuestion_model_1.default();
        newBusinessReviewQuestion.question = question;
        newBusinessReviewQuestion.order = previousOrder && previousOrder.length !== 0 ? previousOrder[0].order + 1 : 1;
        newBusinessReviewQuestion.businessTypeID = [businessTypeID];
        newBusinessReviewQuestion.businessSubtypeID = [businessSubtypeID];
        const savedSubscriptionPlan = yield newBusinessReviewQuestion.save();
        return response.send((0, response_1.httpCreated)(savedSubscriptionPlan, 'Review question created'));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_a = error.message) !== null && _a !== void 0 ? _a : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const update = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const ID = (_a = request === null || request === void 0 ? void 0 : request.params) === null || _a === void 0 ? void 0 : _a.id;
        const { question, businessSubtypeID, businessTypeID } = request.body;
        const [businessReviewQuestion, businessType, businessSubType] = yield Promise.all([
            businessReviewQuestion_model_1.default.findOne({ _id: ID }),
            businessType_model_1.default.findOne({ _id: businessTypeID }),
            businessSubType_model_1.default.findOne({ _id: businessSubtypeID }),
        ]);
        if (!businessReviewQuestion) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest("Review question not found"), "Review question not found"));
        }
        if (!businessType) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest("Business type not found"), "Business type not found"));
        }
        if (!businessSubType) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest("Business subtype not found"), "Business subtype not found"));
        }
        businessReviewQuestion.question = question !== null && question !== void 0 ? question : businessReviewQuestion.question;
        if (businessTypeID) {
            businessReviewQuestion.businessSubtypeID = [businessSubtypeID];
        }
        if (businessSubtypeID) {
            businessReviewQuestion.businessTypeID = [businessTypeID];
        }
        const savedBusinessReviewQuestion = yield businessReviewQuestion.save();
        return response.send((0, response_1.httpAcceptedOrUpdated)(savedBusinessReviewQuestion, 'Review question updated.'));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_b = error.message) !== null && _b !== void 0 ? _b : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const destroy = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const ID = (_a = request === null || request === void 0 ? void 0 : request.params) === null || _a === void 0 ? void 0 : _a.id;
        const businessReviewQuestion = yield businessReviewQuestion_model_1.default.findOne({ _id: ID });
        if (!businessReviewQuestion) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest("Review question not found"), "Review question not found"));
        }
        yield businessReviewQuestion.deleteOne();
        return response.send((0, response_1.httpNoContent)(null, 'Review question deleted'));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_b = error.message) !== null && _b !== void 0 ? _b : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
exports.default = { index, store, destroy, update };
