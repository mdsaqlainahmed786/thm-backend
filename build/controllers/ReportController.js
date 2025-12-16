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
const reportedUser_model_1 = __importStar(require("../database/models/reportedUser.model"));
const error_1 = require("../utils/response-message/error");
const common_1 = require("../common");
const post_model_1 = __importDefault(require("../database/models/post.model"));
const user_model_1 = __importDefault(require("../database/models/user.model"));
const basic_1 = require("../utils/helper/basic");
const comment_model_1 = __importDefault(require("../database/models/comment.model"));
const index = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = request.user;
        let { pageNumber, documentLimit, contentType } = request.query;
        pageNumber = (0, basic_1.parseQueryParam)(pageNumber, 1);
        documentLimit = (0, basic_1.parseQueryParam)(documentLimit, 20);
        const dbQuery = {};
        if (!id) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        if (contentType === common_1.ContentType.POST) {
            Object.assign(dbQuery, { contentType: common_1.ContentType.POST });
        }
        if (contentType === common_1.ContentType.USER) {
            Object.assign(dbQuery, { contentType: common_1.ContentType.USER });
        }
        const [documents, totalDocument] = yield Promise.all([
            reportedUser_model_1.default.aggregate([
                {
                    $match: dbQuery
                },
                (0, reportedUser_model_1.addPostInReport)().lookup,
                (0, reportedUser_model_1.addPostInReport)().unwindLookup,
                (0, reportedUser_model_1.addReportedByInReport)().lookup,
                (0, reportedUser_model_1.addReportedByInReport)().unwindLookup,
                (0, reportedUser_model_1.addUserInReport)().lookup,
                (0, reportedUser_model_1.addUserInReport)().unwindLookup,
                (0, reportedUser_model_1.addCommentInReport)().lookup,
                (0, reportedUser_model_1.addCommentInReport)().unwindLookup,
                {
                    $sort: { createdAt: -1, id: 1 }
                },
                {
                    $skip: pageNumber > 0 ? ((pageNumber - 1) * documentLimit) : 0
                },
                {
                    $limit: documentLimit
                },
            ]),
            reportedUser_model_1.default.find(dbQuery).countDocuments()
        ]);
        const totalPagesCount = Math.ceil(totalDocument / documentLimit) || 1;
        return response.send((0, response_1.httpOkExtended)(documents, 'Reported content fetched.', pageNumber, totalPagesCount, totalDocument));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_a = error.message) !== null && _a !== void 0 ? _a : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const reportContent = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        let contentID = request.params.id;
        const { id, accountType, businessProfileID, role } = request.user;
        const { reason } = request.body;
        if (!id) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        const [totalReports, isReportedBefore,] = yield Promise.all([
            reportedUser_model_1.default.find({ contentID: contentID, contentType: common_1.ContentType.POST }),
            reportedUser_model_1.default.findOne({ contentID: contentID, contentType: common_1.ContentType.POST, reportedBy: id }),
        ]);
        const post = yield post_model_1.default.findOne({ _id: contentID });
        if (!post) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest("Content not found"), "Content not found"));
        }
        if (totalReports && totalReports.length >= 5) { //If some post is reported more then 5 time then remove from feed
            post.isPublished = false;
            yield post.save();
        }
        if (role && role === common_1.Role.MODERATOR) {
            post.isPublished = false;
            yield post.save();
        }
        if (!isReportedBefore) {
            const newReport = new reportedUser_model_1.default();
            newReport.reportedBy = id;
            newReport.contentID = contentID;
            newReport.reason = reason !== null && reason !== void 0 ? reason : '';
            newReport.contentType = common_1.ContentType.POST;
            const report = yield newReport.save();
            return response.send((0, response_1.httpCreated)(report, "Content reported successfully"));
        }
        isReportedBefore.reason = reason !== null && reason !== void 0 ? reason : isReportedBefore.reason;
        yield isReportedBefore.save();
        return response.send((0, response_1.httpNoContent)(isReportedBefore, 'Content already reported'));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_a = error.message) !== null && _a !== void 0 ? _a : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const reportUser = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id, accountType, businessProfileID } = request.user;
        let contentID = request.params.id;
        const { reason } = request.body;
        if (!id) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        const [totalReports, isReportedBefore,] = yield Promise.all([
            reportedUser_model_1.default.find({ contentID: contentID, contentType: common_1.ContentType.USER }),
            reportedUser_model_1.default.findOne({ contentID: contentID, contentType: common_1.ContentType.USER, reportedBy: id }),
        ]);
        const user = yield user_model_1.default.findOne({ _id: contentID });
        if (!user) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest("Content not found"), "Content not found"));
        }
        if (totalReports && totalReports.length >= 5) { //If some user is reported more then 5 time then deactivate their account
            user.isActivated = false;
            yield user.save();
        }
        if (!isReportedBefore) {
            const newReport = new reportedUser_model_1.default();
            newReport.reason = reason !== null && reason !== void 0 ? reason : '';
            newReport.reportedBy = id;
            newReport.contentID = contentID;
            newReport.contentType = common_1.ContentType.USER;
            const report = yield newReport.save();
            return response.send((0, response_1.httpCreated)(report, "User reported successfully"));
        }
        isReportedBefore.reason = reason !== null && reason !== void 0 ? reason : isReportedBefore.reason;
        yield isReportedBefore.save();
        return response.send((0, response_1.httpNoContent)(isReportedBefore, 'User already reported'));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_a = error.message) !== null && _a !== void 0 ? _a : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const reportComment = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id, accountType, businessProfileID, role } = request.user;
        let contentID = request.params.id;
        const { reason } = request.body;
        if (!id) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        const [totalReports, isReportedBefore,] = yield Promise.all([
            reportedUser_model_1.default.find({ contentID: contentID, contentType: common_1.ContentType.COMMENT }),
            reportedUser_model_1.default.findOne({ contentID: contentID, contentType: common_1.ContentType.COMMENT, reportedBy: id }),
        ]);
        const comment = yield comment_model_1.default.findOne({ _id: contentID });
        if (!comment) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest("Content not found"), "Content not found"));
        }
        if (totalReports && totalReports.length >= 5 || role && role === common_1.Role.MODERATOR) { //If some user is reported more then 5 time then deactivate their account
            comment.isPublished = false;
            //Unpublish the reply as well
            const queries = [
                comment.save()
            ];
            if (comment.isParent) {
                queries.push(comment_model_1.default.updateMany({ parentID: comment._id }, { isPublished: false }));
            }
            yield Promise.all(queries);
        }
        if (!isReportedBefore) {
            const newReport = new reportedUser_model_1.default();
            newReport.reason = reason !== null && reason !== void 0 ? reason : '';
            newReport.reportedBy = id;
            newReport.contentID = contentID;
            newReport.contentType = common_1.ContentType.COMMENT;
            const report = yield newReport.save();
            return response.send((0, response_1.httpCreated)(report, "Comment reported successfully"));
        }
        isReportedBefore.reason = reason !== null && reason !== void 0 ? reason : isReportedBefore.reason;
        yield isReportedBefore.save();
        return response.send((0, response_1.httpNoContent)(isReportedBefore, 'Comment already reported'));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_a = error.message) !== null && _a !== void 0 ? _a : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const destroy = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const ID = (_a = request === null || request === void 0 ? void 0 : request.params) === null || _a === void 0 ? void 0 : _a.id;
        const report = yield reportedUser_model_1.default.findOne({ _id: ID });
        if (!report) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest("Record not found"), "Record not found"));
        }
        yield report.deleteOne();
        return response.send((0, response_1.httpNoContent)(null, 'Report deleted'));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_b = error.message) !== null && _b !== void 0 ? _b : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
exports.default = { index, destroy, reportContent, reportUser, reportComment };
