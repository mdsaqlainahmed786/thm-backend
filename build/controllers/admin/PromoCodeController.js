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
const error_1 = require("../../utils/response-message/error");
const post_model_1 = require("../../database/models/post.model");
const promoCode_model_1 = __importDefault(require("../../database/models/promoCode.model"));
const postTypes = Object.values(post_model_1.PostType);
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
            Object.assign(dbQuery, {
                $or: [
                    { content: { $regex: new RegExp(query.toLowerCase(), "i") }, isPublished: true },
                    { name: { $regex: new RegExp(query.toLowerCase(), "i") }, isPublished: true },
                    { venue: { $regex: new RegExp(query.toLowerCase(), "i") }, isPublished: true },
                    { streamingLink: { $regex: new RegExp(query.toLowerCase(), "i") }, isPublished: true },
                    { 'location.placeName': { $regex: new RegExp(query.toLowerCase(), "i") }, isPublished: true }
                ]
            });
        }
        if (postType && postTypes.includes(postType)) {
            Object.assign(dbQuery, { postType: postType });
        }
        const [documents, totalDocument] = yield Promise.all([
            promoCode_model_1.default.aggregate([
                {
                    $match: dbQuery
                },
                {
                    $sort: { createdAt: -1, id: 1 }
                },
                {
                    $skip: pageNumber > 0 ? ((pageNumber - 1) * documentLimit) : 0
                },
                {
                    $limit: documentLimit
                }
            ]),
            promoCode_model_1.default.find(dbQuery).countDocuments()
        ]);
        const totalPagesCount = Math.ceil(totalDocument / documentLimit) || 1;
        return response.send((0, response_1.httpOkExtended)(documents, 'Promo codes fetched.', pageNumber, totalPagesCount, totalDocument));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_a = error.message) !== null && _a !== void 0 ? _a : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const store = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { name, description, code, priceType, value, cartValue, redeemedCount, quantity, validFrom, validTo, maxDiscount, type } = request.body;
        const newPromoCode = new promoCode_model_1.default();
        newPromoCode.name = name;
        newPromoCode.description = description;
        newPromoCode.code = code;
        newPromoCode.priceType = priceType;
        newPromoCode.value = value;
        newPromoCode.cartValue = cartValue;
        newPromoCode.redeemedCount = redeemedCount;
        newPromoCode.quantity = quantity;
        newPromoCode.validFrom = validFrom;
        newPromoCode.validTo = validTo;
        newPromoCode.maxDiscount = maxDiscount;
        newPromoCode.type = type;
        const savedPromoCode = yield newPromoCode.save();
        return response.send((0, response_1.httpCreated)(savedPromoCode, 'Promo code created'));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_a = error.message) !== null && _a !== void 0 ? _a : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const update = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const ID = (_a = request === null || request === void 0 ? void 0 : request.params) === null || _a === void 0 ? void 0 : _a.id;
        const { name, description, code, priceType, value, cartValue, redeemedCount, quantity, validFrom, validTo, maxDiscount, type } = request.body;
        const promoCode = yield promoCode_model_1.default.findOne({ _id: ID });
        if (!promoCode) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest("Promo code not found"), "Promo code not found"));
        }
        promoCode.name = name !== null && name !== void 0 ? name : promoCode.name;
        promoCode.description = description !== null && description !== void 0 ? description : promoCode.description;
        promoCode.code = code !== null && code !== void 0 ? code : promoCode.code;
        promoCode.priceType = priceType !== null && priceType !== void 0 ? priceType : promoCode.priceType;
        promoCode.value = value !== null && value !== void 0 ? value : promoCode.value;
        promoCode.cartValue = cartValue !== null && cartValue !== void 0 ? cartValue : promoCode.cartValue;
        promoCode.redeemedCount = redeemedCount !== null && redeemedCount !== void 0 ? redeemedCount : promoCode.redeemedCount;
        promoCode.quantity = quantity !== null && quantity !== void 0 ? quantity : promoCode.quantity;
        promoCode.validFrom = validFrom !== null && validFrom !== void 0 ? validFrom : promoCode.validFrom;
        promoCode.validTo = validTo !== null && validTo !== void 0 ? validTo : promoCode.validTo;
        promoCode.maxDiscount = maxDiscount !== null && maxDiscount !== void 0 ? maxDiscount : promoCode.maxDiscount;
        promoCode.type = type !== null && type !== void 0 ? type : promoCode.type;
        const savedPromoCode = yield promoCode.save();
        return response.send((0, response_1.httpAcceptedOrUpdated)(savedPromoCode, 'Promo code updated'));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_b = error.message) !== null && _b !== void 0 ? _b : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const destroy = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const ID = (_a = request === null || request === void 0 ? void 0 : request.params) === null || _a === void 0 ? void 0 : _a.id;
        const promoCode = yield promoCode_model_1.default.findOne({ _id: ID });
        if (!promoCode) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest("Promo code not found"), "Promo code not found"));
        }
        yield promoCode.deleteOne();
        return response.send((0, response_1.httpNoContent)(null, 'Promo code deleted'));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_b = error.message) !== null && _b !== void 0 ? _b : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const show = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_a = error.message) !== null && _a !== void 0 ? _a : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
exports.default = { index, store, update, destroy, show };
