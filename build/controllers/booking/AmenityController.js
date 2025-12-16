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
const response_1 = require("../../utils/response");
const error_1 = require("../../utils/response-message/error");
const basic_1 = require("../../utils/helper/basic");
const amenity_model_1 = __importStar(require("../../database/models/amenity.model"));
const NOT_FOUND = "Amenity not found.";
const FETCHED = "Amenity fetched.";
const CREATED = "Amenity created.";
const UPDATED = "Amenity updated.";
const DELETED = "Amenity deleted.";
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
                    { name: { $regex: new RegExp(query.toLowerCase(), "i") } },
                ]
            });
        }
        const [documents, totalDocument] = yield Promise.all([
            amenity_model_1.default.aggregate([
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
                        __v: 0,
                    }
                },
            ]),
            amenity_model_1.default.find(dbQuery).countDocuments()
        ]);
        if (documents.length === 0) {
            yield Promise.all(amenity_model_1.defaultAmenity.map((amenity) => __awaiter(void 0, void 0, void 0, function* () {
                const isExits = yield amenity_model_1.default.findOne({ name: amenity.name });
                if (!isExits) {
                    yield amenity_model_1.default.create(amenity);
                }
            })));
        }
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
        const { name } = request.body;
        const newAmenity = new amenity_model_1.default();
        newAmenity.name = name;
        const savedAmenity = yield newAmenity.save();
        return response.send((0, response_1.httpCreated)(savedAmenity, CREATED));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_b = error.message) !== null && _b !== void 0 ? _b : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const update = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _c, _d;
    try {
        const ID = (_c = request === null || request === void 0 ? void 0 : request.params) === null || _c === void 0 ? void 0 : _c.id;
        const { name, isPublished } = request.body;
        const amenity = yield amenity_model_1.default.findOne({ _id: ID });
        if (!amenity) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(NOT_FOUND), NOT_FOUND));
        }
        amenity.name = name !== null && name !== void 0 ? name : amenity.name;
        amenity.isPublished = isPublished !== null && isPublished !== void 0 ? isPublished : amenity.isPublished;
        const savedAmenity = yield amenity.save();
        return response.send((0, response_1.httpAcceptedOrUpdated)(savedAmenity, UPDATED));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_d = error.message) !== null && _d !== void 0 ? _d : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const destroy = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _e, _f;
    try {
        const ID = (_e = request === null || request === void 0 ? void 0 : request.params) === null || _e === void 0 ? void 0 : _e.id;
        const amenity = yield amenity_model_1.default.findOne({ _id: ID });
        if (!amenity) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(NOT_FOUND), NOT_FOUND));
        }
        yield amenity.deleteOne();
        return response.send((0, response_1.httpNoContent)(null, DELETED));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_f = error.message) !== null && _f !== void 0 ? _f : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const categories = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _g;
    try {
        let { query } = request.query;
        const data = Object.values(amenity_model_1.AmenityCategory).filter((amenity) => amenity.toLowerCase().includes(query));
        return response.send((0, response_1.httpOk)(data, "Amenity category fetched."));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_g = error.message) !== null && _g !== void 0 ? _g : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
exports.default = { index, store, update, destroy, categories };
