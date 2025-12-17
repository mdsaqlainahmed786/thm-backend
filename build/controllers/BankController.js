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
// import { isArray, parseQueryParam } from '../../utils/helper/basic';
const response_1 = require("../utils/response");
// import { ErrorMessage } from '../../utils/response-message/error';
// import Post, { addGoogleReviewedBusinessProfileInPost, addMediaInPost, addPostedByInPost, addReviewedBusinessProfileInPost, countPostDocument, PostType } from '../../database/models/post.model';
// import PricePreset, { PricePresetType } from '../../database/models/pricePreset.model';
const bankAccount_model_1 = __importDefault(require("../database/models/bankAccount.model"));
const bank_1 = __importDefault(require("../provider/bank"));
const error_1 = require("../utils/response-message/error");
const basic_1 = require("../utils/helper/basic");
const NOT_FOUND = "Bank account found.";
const FETCHED = "Banks fetched.";
const CREATED = "Bank account created.";
const UPDATED = "Bank account updated.";
const DELETED = "Bank account deleted.";
const RETRIEVED = "Bank account fetched.";
const banks = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const hostAddress = request.protocol + "://" + request.get("host");
        return response.send((0, response_1.httpOk)(bank_1.default.map((bank) => (Object.assign(Object.assign({}, bank), { icon: `${hostAddress}/${bank.icon}` }))), FETCHED));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_a = error.message) !== null && _a !== void 0 ? _a : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const index = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id, acco } = request.user;
        let { pageNumber, documentLimit, query, postType } = request.query;
        pageNumber = (0, basic_1.parseQueryParam)(pageNumber, 1);
        documentLimit = (0, basic_1.parseQueryParam)(documentLimit, 20);
        const dbQuery = {};
        if (!id) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        if (query !== undefined && query !== "") {
            Object.assign(dbQuery, {
                $or: [
                // { content: { $regex: new RegExp(query.toLowerCase(), "i") }, isPublished: true },
                // { name: { $regex: new RegExp(query.toLowerCase(), "i") }, isPublished: true },
                // { venue: { $regex: new RegExp(query.toLowerCase(), "i") }, isPublished: true },
                // { streamingLink: { $regex: new RegExp(query.toLowerCase(), "i") }, isPublished: true },
                // { 'location.placeName': { $regex: new RegExp(query.toLowerCase(), "i") }, isPublished: true }
                ]
            });
        }
        const [documents, totalDocument] = yield Promise.all([
            bankAccount_model_1.default.aggregate([
                {
                    $match: {}
                },
                {
                    $sort: { primaryAccount: -1 }
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
                }
            ]),
            bankAccount_model_1.default.find({}).countDocuments()
        ]);
        const totalPagesCount = Math.ceil(totalDocument / documentLimit) || 1;
        return response.send((0, response_1.httpOkExtended)(documents, FETCHED, pageNumber, totalPagesCount, totalDocument));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_a = error.message) !== null && _a !== void 0 ? _a : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const store = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const { id, AccountType, businessProfileID, role } = request.user;
        const { bankName, ifsc, accountNumber, accountHolder, type } = request.body;
        if (!id) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        if (!businessProfileID) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.BUSINESS_PROFILE_NOT_FOUND), error_1.ErrorMessage.BUSINESS_PROFILE_NOT_FOUND));
        }
        const bankAccounts = yield bankAccount_model_1.default.find({ businessProfileID: businessProfileID, userID: id });
        const bankAccount = new bankAccount_model_1.default();
        bankAccount.businessProfileID = businessProfileID;
        bankAccount.userID = id;
        bankAccount.bankName = bankName;
        const bankIcon = (_b = (_a = bank_1.default.filter((bank) => bank.name === bankName)) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.icon;
        const hostAddress = request.protocol + "://" + request.get("host");
        bankAccount.bankIcon = bankIcon ? hostAddress + "/" + bankIcon : "";
        if (bankAccounts.length === 0) {
            bankAccount.primaryAccount = true;
        }
        bankAccount.accountNumber = accountNumber;
        bankAccount.ifsc = ifsc;
        bankAccount.accountHolder = accountHolder;
        bankAccount.type = type;
        bankAccount.documents = [];
        const savedBankAccount = yield bankAccount.save();
        return response.send((0, response_1.httpCreated)(savedBankAccount, CREATED));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_c = error.message) !== null && _c !== void 0 ? _c : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const update = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    // try {
    //     const ID = request?.params?.id;
    //     const { price, weekendPrice, type, startDate, endDate, months, weeks } = request.body;
    //     const pricePreset = await PricePreset.findOne({ _id: ID });
    //     if (!pricePreset) {
    //         return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.POST_NOT_FOUND), ErrorMessage.POST_NOT_FOUND));
    //     }
    //     pricePreset.type = type ?? pricePreset.type;
    //     pricePreset.price = price ?? pricePreset.price;
    //     pricePreset.weekendPrice = weekendPrice ?? pricePreset.weekendPrice;
    //     switch (type) {
    //         case PricePresetType.CUSTOM:
    //             pricePreset.startDate = startDate;
    //             pricePreset.endDate = endDate;
    //             break;
    //         case PricePresetType.QUARTERLY:
    //             if (months && isArray(months)) {
    //                 pricePreset.months = months;
    //             }
    //             break;
    //         case PricePresetType.MONTHLY:
    //             if (months && isArray(months)) {
    //                 pricePreset.months = months;
    //             }
    //             if (weeks && isArray(weeks)) {
    //                 pricePreset.weeks = weeks;
    //             }
    //             break;
    //     }
    //     const savedPricePreset = await pricePreset.save();
    //     return response.send(httpAcceptedOrUpdated(savedPricePreset, UPDATED));
    // } catch (error: any) {
    //     next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    // }
});
const destroy = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const ID = (_a = request === null || request === void 0 ? void 0 : request.params) === null || _a === void 0 ? void 0 : _a.id;
        const bankAccount = yield bankAccount_model_1.default.findOne({ _id: ID });
        if (!bankAccount) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(NOT_FOUND), NOT_FOUND));
        }
        if (bankAccount.primaryAccount && bankAccount.primaryAccount === true) {
            const firstBankAccount = yield bankAccount_model_1.default.findOne({ businessProfileID: bankAccount.businessProfileID, userID: bankAccount.userID });
            if (firstBankAccount) {
                console.log(firstBankAccount);
                firstBankAccount.primaryAccount = true;
                yield firstBankAccount.save();
            }
        }
        yield bankAccount.deleteOne();
        return response.send((0, response_1.httpNoContent)(null, DELETED));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_b = error.message) !== null && _b !== void 0 ? _b : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const show = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    // try {
    // } catch (error: any) {
    //     next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    // }
});
const setPrimaryAccount = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { id, AccountType, businessProfileID, role } = request.user;
        const ID = (_a = request === null || request === void 0 ? void 0 : request.params) === null || _a === void 0 ? void 0 : _a.id;
        const bankAccount = yield bankAccount_model_1.default.findOne({ _id: ID, userID: id, businessProfileID: businessProfileID });
        if (!bankAccount) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(NOT_FOUND), NOT_FOUND));
        }
        bankAccount.primaryAccount = true;
        yield bankAccount.save();
        yield bankAccount_model_1.default.updateMany({ _id: { $nin: bankAccount._id } }, { primaryAccount: false });
        return response.send((0, response_1.httpNoContent)(null, "Bank account set as the primary account."));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_b = error.message) !== null && _b !== void 0 ? _b : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
exports.default = { banks, index, store, update, destroy, show, setPrimaryAccount };
