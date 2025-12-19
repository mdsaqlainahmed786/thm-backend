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
const contactSupport_model_1 = __importDefault(require("../database/models/contactSupport.model"));
const index = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        let { pageNumber, documentLimit, query } = request.query;
        pageNumber = (0, basic_1.parseQueryParam)(pageNumber, 1);
        documentLimit = (0, basic_1.parseQueryParam)(documentLimit, 20);
        const dbQuery = {};
        if (query !== undefined && query !== "") {
            Object.assign(dbQuery, {
                $or: [
                    { name: { $regex: new RegExp(query.toLowerCase(), "i") }, },
                    { email: { $regex: new RegExp(query.toLowerCase(), "i") } },
                    { message: { $regex: new RegExp(query.toLowerCase(), "i") } },
                ]
            });
        }
        const documents = yield contactSupport_model_1.default.aggregate([
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
            {
                $project: {
                    updatedAt: 0,
                    __v: 0,
                }
            }
        ]).exec();
        const totalDocument = yield contactSupport_model_1.default.find(dbQuery).countDocuments();
        const totalPagesCount = Math.ceil(totalDocument / documentLimit) || 1;
        return response.send((0, response_2.httpOkExtended)(documents, 'Contacts fetched.', pageNumber, totalPagesCount, totalDocument));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_a = error.message) !== null && _a !== void 0 ? _a : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const store = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    try {
        const { email, name, message } = request.body;
        const newContact = new contactSupport_model_1.default();
        newContact.name = name;
        newContact.email = email;
        newContact.message = message;
        const savedContact = yield newContact.save();
        return response.send((0, response_1.httpCreated)(savedContact, 'Your message has been successfully submitted. We will respond shortly.'));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_b = error.message) !== null && _b !== void 0 ? _b : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const update = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _c;
    try {
        return response.send((0, response_1.httpAcceptedOrUpdated)(null, 'Not implemented'));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_c = error.message) !== null && _c !== void 0 ? _c : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const destroy = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _d, _e;
    try {
        const ID = (_d = request === null || request === void 0 ? void 0 : request.params) === null || _d === void 0 ? void 0 : _d.id;
        const contactSupport = yield contactSupport_model_1.default.findOne({ _id: ID });
        if (!contactSupport) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest("Contact not found"), "Contact not found"));
        }
        yield contactSupport.deleteOne();
        return response.send((0, response_1.httpNoContent)(null, 'Contact Deleted'));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_e = error.message) !== null && _e !== void 0 ? _e : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const show = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _f;
    try {
        return response.send((0, response_1.httpOk)(null, 'Not implemented'));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_f = error.message) !== null && _f !== void 0 ? _f : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
exports.default = { index, store, update, destroy };
