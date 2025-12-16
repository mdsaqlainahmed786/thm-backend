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
const basic_1 = require("../../utils/helper/basic");
const response_1 = require("../../utils/response");
const error_1 = require("../../utils/response-message/error");
const pricePreset_model_1 = __importStar(require("../../database/models/pricePreset.model"));
const roomPrices_model_1 = __importDefault(require("../../database/models/demo/roomPrices.model"));
const NOT_FOUND = "Price preset found.";
const FETCHED = "Price preset fetched.";
const CREATED = "Price preset created.";
const UPDATED = "Price preset updated.";
const DELETED = "Price preset deleted.";
const RETRIEVED = "Price preset fetched.";
const index = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = request.user;
        let { pageNumber, documentLimit, query, postType } = request.query;
        pageNumber = (0, basic_1.parseQueryParam)(pageNumber, 1);
        documentLimit = (0, basic_1.parseQueryParam)(documentLimit, 20);
        const dbQuery = {};
        if (!id) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        if (query !== undefined && query !== "") {
            // Object.assign(dbQuery,
            //     {
            //         $or: [
            //             // { content: { $regex: new RegExp(query.toLowerCase(), "i") }, isPublished: true },
            //             // { name: { $regex: new RegExp(query.toLowerCase(), "i") }, isPublished: true },
            //             // { venue: { $regex: new RegExp(query.toLowerCase(), "i") }, isPublished: true },
            //             // { streamingLink: { $regex: new RegExp(query.toLowerCase(), "i") }, isPublished: true },
            //             // { 'location.placeName': { $regex: new RegExp(query.toLowerCase(), "i") }, isPublished: true }
            //         ]
            //     }
            // )
        }
        const [documents, totalDocument] = yield Promise.all([
            pricePreset_model_1.default.aggregate([
                {
                    $match: {}
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
                }
            ]),
            pricePreset_model_1.default.find({}).countDocuments()
        ]);
        const totalPagesCount = Math.ceil(totalDocument / documentLimit) || 1;
        return response.send((0, response_1.httpOkExtended)(documents, FETCHED, pageNumber, totalPagesCount, totalDocument));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_a = error.message) !== null && _a !== void 0 ? _a : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const store = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    try {
        const { id, AccountType, businessProfileID, role } = request.user;
        const { price, weekendPrice, type, startDate, endDate, months, weeks } = request.body;
        console.log(request.body);
        if (!id) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        if (!businessProfileID) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.BUSINESS_PROFILE_NOT_FOUND), error_1.ErrorMessage.BUSINESS_PROFILE_NOT_FOUND));
        }
        if (!(price > 0 || weekendPrice > 0)) {
            return response.send((0, response_1.httpBadRequest)(error_1.ErrorMessage.invalidRequest('Either price or weekend price must be greater than zero.'), 'Either price or weekend price must be greater than zero.'));
        }
        const newPricePreset = new pricePreset_model_1.default();
        newPricePreset.businessProfileID = businessProfileID;
        newPricePreset.type = type;
        newPricePreset.price = price;
        newPricePreset.weekendPrice = weekendPrice;
        switch (type) {
            case pricePreset_model_1.PricePresetType.CUSTOM:
                newPricePreset.startDate = startDate;
                newPricePreset.endDate = endDate;
                break;
            case pricePreset_model_1.PricePresetType.QUARTERLY:
                if (months && (0, basic_1.isArray)(months)) {
                    newPricePreset.months = months;
                }
                break;
            case pricePreset_model_1.PricePresetType.MONTHLY:
                if (months && (0, basic_1.isArray)(months)) {
                    newPricePreset.months = months;
                }
                if (weeks && (0, basic_1.isArray)(weeks)) {
                    newPricePreset.weeks = weeks;
                }
                break;
        }
        const savedPricePreset = yield newPricePreset.save();
        yield (0, pricePreset_model_1.generatePricePresetForRoom)(savedPricePreset.id);
        return response.send((0, response_1.httpCreated)(savedPricePreset, CREATED));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_b = error.message) !== null && _b !== void 0 ? _b : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const update = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _c, _d;
    try {
        const ID = (_c = request === null || request === void 0 ? void 0 : request.params) === null || _c === void 0 ? void 0 : _c.id;
        const { price, weekendPrice, type, startDate, endDate, months, weeks, isActive, method } = request.body;
        const pricePreset = yield pricePreset_model_1.default.findOne({ _id: ID });
        if (!pricePreset) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.POST_NOT_FOUND), error_1.ErrorMessage.POST_NOT_FOUND));
        }
        if (method && method !== 'PUT' && !(price > 0 || weekendPrice > 0)) {
            return response.send((0, response_1.httpBadRequest)(error_1.ErrorMessage.invalidRequest('Either price or weekend price must be greater than zero.'), 'Either price or weekend price must be greater than zero.'));
        }
        pricePreset.type = type !== null && type !== void 0 ? type : pricePreset.type;
        pricePreset.price = price !== null && price !== void 0 ? price : pricePreset.price;
        pricePreset.weekendPrice = weekendPrice !== null && weekendPrice !== void 0 ? weekendPrice : pricePreset.weekendPrice;
        pricePreset.isActive = isActive !== null && isActive !== void 0 ? isActive : pricePreset.isActive;
        const pricePresetIDs = yield pricePreset_model_1.default.distinct("_id", { businessProfileID: pricePreset.businessProfileID });
        yield Promise.all([
            pricePreset_model_1.default.updateMany({ _id: { $in: pricePresetIDs } }, { isActive: false }),
            roomPrices_model_1.default.updateMany({ pricePresetID: { $in: pricePresetIDs } }, { isActive: false }),
        ]);
        if (isActive) {
            console.log(isActive);
            yield roomPrices_model_1.default.updateMany({ pricePresetID: { $in: pricePreset._id } }, { isActive: true });
        }
        switch (type) {
            case pricePreset_model_1.PricePresetType.CUSTOM:
                pricePreset.startDate = startDate;
                pricePreset.endDate = endDate;
                break;
            case pricePreset_model_1.PricePresetType.QUARTERLY:
                if (months && (0, basic_1.isArray)(months)) {
                    pricePreset.months = months;
                }
                break;
            case pricePreset_model_1.PricePresetType.MONTHLY:
                if (months && (0, basic_1.isArray)(months)) {
                    pricePreset.months = months;
                }
                if (weeks && (0, basic_1.isArray)(weeks)) {
                    pricePreset.weeks = weeks;
                }
                break;
        }
        const savedPricePreset = yield pricePreset.save();
        if (method && method === 'PUT') {
            yield Promise.all([
                roomPrices_model_1.default.deleteMany({ pricePresetID: savedPricePreset.id }),
                (0, pricePreset_model_1.generatePricePresetForRoom)(savedPricePreset.id)
            ]);
        }
        return response.send((0, response_1.httpAcceptedOrUpdated)(savedPricePreset, UPDATED));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_d = error.message) !== null && _d !== void 0 ? _d : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const destroy = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _e, _f;
    try {
        const ID = (_e = request === null || request === void 0 ? void 0 : request.params) === null || _e === void 0 ? void 0 : _e.id;
        const pricePreset = yield pricePreset_model_1.default.findOne({ _id: ID });
        if (!pricePreset) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(NOT_FOUND), NOT_FOUND));
        }
        yield pricePreset.deleteOne();
        yield roomPrices_model_1.default.deleteMany({ pricePresetID: ID });
        return response.send((0, response_1.httpNoContent)(null, DELETED));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_f = error.message) !== null && _f !== void 0 ? _f : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const show = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _g;
    try {
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_g = error.message) !== null && _g !== void 0 ? _g : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
exports.default = { index, store, update, destroy, show };
