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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const fileProcessing_model_1 = __importStar(require("../database/models/fileProcessing.model"));
const promises_1 = __importDefault(require("fs/promises"));
const basic_1 = require("../utils/helper/basic");
const media_model_1 = __importDefault(require("../database/models/media.model"));
const index = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        let { status } = request.query;
        if (status && status) {
            const fileQueues = yield fileProcessing_model_1.default.find({ status: status }).limit(10);
            return response.send((0, response_1.httpOk)(fileQueues, 'Processing queue fetched'));
        }
        const fileQueues = yield fileProcessing_model_1.default.find({ status: { $in: [fileProcessing_model_1.QueueStatus.CREATED] } }).limit(10);
        return response.send((0, response_1.httpOk)(fileQueues, 'File queues fetched'));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_a = error.message) !== null && _a !== void 0 ? _a : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const store = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
});
const update = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const ID = (_a = request === null || request === void 0 ? void 0 : request.params) === null || _a === void 0 ? void 0 : _a.id;
        const { status, s3Location, jobID } = request.body;
        const fileQueue = yield fileProcessing_model_1.default.findOne({ _id: ID });
        if (!fileQueue) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest("File queue not found"), "File queue not found"));
        }
        fileQueue.status = status !== null && status !== void 0 ? status : fileQueue.status;
        fileQueue.jobID = jobID !== null && jobID !== void 0 ? jobID : fileQueue.jobID;
        if (s3Location && (0, basic_1.isArray)(s3Location)) {
            fileQueue.s3Location = s3Location ? s3Location : fileQueue.s3Location;
        }
        const savedFileQueue = yield fileQueue.save();
        if (savedFileQueue && savedFileQueue.status === fileProcessing_model_1.QueueStatus.COMPLETED && savedFileQueue.s3Location && savedFileQueue.s3Location.length !== 0) {
            const media = yield media_model_1.default.findOne({ s3Key: savedFileQueue.s3Key });
            if (media) {
                const m3u8Urls = savedFileQueue.s3Location.filter((url) => url.endsWith('.m3u8'));
                const sourceUrl = media.sourceUrl;
                media.videoUrl = sourceUrl !== null && sourceUrl !== void 0 ? sourceUrl : media.sourceUrl;
                if (m3u8Urls.length !== 0) {
                    media.sourceUrl = (_b = m3u8Urls[0]) !== null && _b !== void 0 ? _b : media.sourceUrl;
                }
                yield media.save();
                //Remove public file in main server after conversion
                yield promises_1.default.unlink(savedFileQueue.filePath);
                if (m3u8Urls.length !== 0) {
                    fileQueue.filePath = m3u8Urls[0];
                }
                fileQueue.mediaID = media.id;
                yield fileQueue.save();
            }
        }
        return response.send((0, response_1.httpAcceptedOrUpdated)(savedFileQueue, 'File queue updated'));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_c = error.message) !== null && _c !== void 0 ? _c : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const destroy = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        return response.send((0, response_1.httpOk)(null, 'Not implemented'));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_a = error.message) !== null && _a !== void 0 ? _a : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
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
