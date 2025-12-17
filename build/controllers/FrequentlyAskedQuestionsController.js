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
const response_1 = require("../utils/response");
const error_1 = require("../utils/response-message/error");
const basic_1 = require("../utils/helper/basic");
const response_2 = require("../utils/response");
const faq_model_1 = __importDefault(require("../database/models/faq.model"));
const index = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        let { pageNumber, documentLimit, query, type, project } = request.query;
        pageNumber = (0, basic_1.parseQueryParam)(pageNumber, 1);
        documentLimit = (0, basic_1.parseQueryParam)(documentLimit, 20);
        const dbQuery = { isPublished: true };
        if (type !== undefined && type !== "") {
            Object.assign(dbQuery, { type });
        }
        if (query !== undefined && query !== "") {
            Object.assign(dbQuery, {
                $or: [
                    { question: { $regex: new RegExp(query.toLowerCase(), "i") }, isPublished: true },
                    { answer: { $regex: new RegExp(query.toLowerCase(), "i") }, isPublished: true },
                ]
            });
        }
        const faqPipelineStage = [
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
            },
        ];
        if (project && project === "full") {
            faqPipelineStage.push({
                $project: {
                    updatedAt: 0,
                    __v: 0,
                }
            });
        }
        else {
            faqPipelineStage.push({
                $project: {
                    isPublished: 0,
                    type: 0,
                    createdAt: 0,
                    updatedAt: 0,
                    __v: 0,
                }
            });
        }
        const documents = yield faq_model_1.default.aggregate(faqPipelineStage).exec();
        const totalDocument = yield faq_model_1.default.find(dbQuery).countDocuments();
        const totalPagesCount = Math.ceil(totalDocument / documentLimit) || 1;
        return response.send((0, response_2.httpOkExtended)(documents, 'FAQ fetched.', pageNumber, totalPagesCount, totalDocument));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_a = error.message) !== null && _a !== void 0 ? _a : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const store = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { question, answer, type } = request.body;
        const newFAQ = new faq_model_1.default();
        newFAQ.question = question;
        newFAQ.answer = answer;
        newFAQ.type = type;
        newFAQ.isPublished = true;
        const savedFAQ = yield newFAQ.save();
        return response.send((0, response_1.httpCreated)(savedFAQ, 'FAQ created'));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_a = error.message) !== null && _a !== void 0 ? _a : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const update = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const ID = (_a = request === null || request === void 0 ? void 0 : request.params) === null || _a === void 0 ? void 0 : _a.id;
        const { question, answer, type, isPublished } = request.body;
        const faq = yield faq_model_1.default.findOne({ _id: ID });
        if (!faq) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest("FAQ not found"), "FAQ not found"));
        }
        faq.question = question !== null && question !== void 0 ? question : faq.question;
        faq.answer = answer !== null && answer !== void 0 ? answer : faq.answer;
        faq.type = type !== null && type !== void 0 ? type : faq.type;
        faq.isPublished = isPublished !== null && isPublished !== void 0 ? isPublished : faq.isPublished;
        const savedFAQ = yield faq.save();
        return response.send((0, response_1.httpAcceptedOrUpdated)(savedFAQ, 'FAQ updated.'));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_b = error.message) !== null && _b !== void 0 ? _b : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const destroy = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const ID = (_a = request === null || request === void 0 ? void 0 : request.params) === null || _a === void 0 ? void 0 : _a.id;
        const faq = yield faq_model_1.default.findOne({ _id: ID });
        if (!faq) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest("FAQ not found"), "FAQ not found"));
        }
        yield faq.deleteOne();
        return response.send((0, response_1.httpNoContent)(null, 'FAQ Deleted'));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_b = error.message) !== null && _b !== void 0 ? _b : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const show = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        return response.send((0, response_1.httpOk)(null, 'Not implemented'));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_a = error.message) !== null && _a !== void 0 ? _a : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
exports.default = { index, store, update, destroy };
