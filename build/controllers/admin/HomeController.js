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
const index_1 = require("./../../common/index");
const basic_1 = require("../../utils/helper/basic");
const user_model_1 = require("../../database/models/user.model");
const response_1 = require("../../utils/response");
const error_1 = require("../../utils/response-message/error");
const user_model_2 = __importDefault(require("../../database/models/user.model"));
const post_model_1 = __importDefault(require("../../database/models/post.model"));
const reportedUser_model_1 = __importStar(require("../../database/models/reportedUser.model"));
const businessProfile_model_1 = __importDefault(require("../../database/models/businessProfile.model"));
const EncryptionService_1 = __importDefault(require("../../services/EncryptionService"));
const qrcode_1 = __importDefault(require("qrcode"));
const encryptionService = new EncryptionService_1.default();
const contentTypes = Object.values(index_1.ContentType);
const index = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const currentMonth = new Date();
        const startOfCurrentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const endOfCurrentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
        const startOfLastMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
        const endOfLastMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0);
        const [users, businessProfiles, posts, reports, currentMonthUserCount, lastMonthUserCount, currentMonthPostCount, lastMonthPostCount, currentMonthBusinessCount, lastMonthBusinessCount, currentMonthReportsCount, lastMonthReportsCount] = yield Promise.all([
            user_model_2.default.countDocuments(),
            user_model_2.default.find({ accountType: user_model_1.AccountType.BUSINESS }).countDocuments(),
            post_model_1.default.countDocuments(),
            reportedUser_model_1.default.countDocuments(),
            user_model_2.default.find({
                createdAt: {
                    $gte: startOfCurrentMonth,
                    $lt: endOfCurrentMonth
                }
            }).countDocuments(),
            user_model_2.default.find({
                createdAt: {
                    $gte: startOfLastMonth,
                    $lt: endOfLastMonth
                }
            }).countDocuments(),
            post_model_1.default.find({
                createdAt: {
                    $gte: startOfCurrentMonth,
                    $lt: endOfCurrentMonth
                }
            }).countDocuments(),
            post_model_1.default.find({
                createdAt: {
                    $gte: startOfLastMonth,
                    $lt: endOfLastMonth
                }
            }).countDocuments(),
            user_model_2.default.find({
                accountType: user_model_1.AccountType.BUSINESS,
                createdAt: {
                    $gte: startOfCurrentMonth,
                    $lt: endOfCurrentMonth
                }
            }).countDocuments(),
            user_model_2.default.find({
                accountType: user_model_1.AccountType.BUSINESS,
                createdAt: {
                    $gte: startOfLastMonth,
                    $lt: endOfLastMonth
                }
            }).countDocuments(),
            reportedUser_model_1.default.find({
                createdAt: {
                    $gte: startOfCurrentMonth,
                    $lt: endOfCurrentMonth
                }
            }).countDocuments(),
            reportedUser_model_1.default.find({
                createdAt: {
                    $gte: startOfLastMonth,
                    $lt: endOfLastMonth
                }
            }).countDocuments(),
        ]);
        let userPercentage = 0;
        let businessPercentage = 0;
        let postPercentage = 0;
        let reportPercentage = 0;
        if (lastMonthUserCount > 0 && currentMonthUserCount > 0) {
            userPercentage = ((currentMonthUserCount - lastMonthUserCount) / currentMonthUserCount) * 100;
        }
        if (lastMonthBusinessCount > 0 && currentMonthBusinessCount > 0) {
            businessPercentage = ((currentMonthBusinessCount - lastMonthBusinessCount) / currentMonthBusinessCount) * 100;
        }
        if (lastMonthPostCount > 0 && currentMonthPostCount > 0) {
            postPercentage = ((currentMonthPostCount - lastMonthPostCount) / currentMonthPostCount) * 100;
        }
        if (lastMonthReportsCount > 0 && currentMonthReportsCount > 0) {
            reportPercentage = ((currentMonthReportsCount - lastMonthReportsCount) / currentMonthReportsCount) * 100;
        }
        const responseData = {
            statistics: {
                users: {
                    count: users,
                    percentage: (0, basic_1.parseFloatToFixed)(userPercentage, 2)
                },
                posts: {
                    count: posts,
                    percentage: (0, basic_1.parseFloatToFixed)(postPercentage, 2)
                },
                businessProfiles: {
                    count: businessProfiles,
                    percentage: (0, basic_1.parseFloatToFixed)(businessPercentage, 2)
                },
                reports: {
                    count: reports,
                    percentage: (0, basic_1.parseFloatToFixed)(reportPercentage, 2)
                }
            }
        };
        return response.send((0, response_1.httpOk)(responseData, 'Dashboard data fetched.'));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_a = error.message) !== null && _a !== void 0 ? _a : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const topReportedContent = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    try {
        const { id } = request.user;
        let { documentLimit, contentType, overview } = request.query;
        documentLimit = (0, basic_1.parseQueryParam)(documentLimit, 10);
        const dbQuery = {};
        if (!id) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        if (contentType && contentTypes.includes(contentType)) {
            Object.assign(dbQuery, { contentType: contentType });
        }
        const currentDate = new Date();
        const dbQuery2 = {};
        if (overview && overview === "monthly") {
            const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1); // 1st day of current month
            const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0); // Last day of current month
            Object.assign(dbQuery2, { createdAt: { $gte: firstDayOfMonth, $lte: lastDayOfMonth } });
        }
        if (overview && overview === "yearly") {
            const firstDayOfYear = new Date(currentDate.getFullYear(), 0, 1); // January 1st of current year
            const lastDayOfYear = new Date(currentDate.getFullYear(), 11, 31); // December 31st of current year
            Object.assign(dbQuery2, { createdAt: { $gte: firstDayOfYear, $lte: lastDayOfYear } });
        }
        const [reports, documents] = yield Promise.all([
            reportedUser_model_1.default.aggregate([
                {
                    $match: dbQuery2
                },
                {
                    $group: {
                        _id: "$contentType", // Group by contentType
                        totalReports: { $sum: 1 } // Sum report counts for each content
                    }
                },
                {
                    $project: {
                        labelName: '$_id',
                        totalReports: 1,
                        _id: 0,
                    }
                }
            ]),
            reportedUser_model_1.default.aggregate([
                {
                    $match: dbQuery
                },
                (0, reportedUser_model_1.addPostInReport)().lookup,
                (0, reportedUser_model_1.addPostInReport)().unwindLookup,
                (0, reportedUser_model_1.addUserInReport)().lookup,
                (0, reportedUser_model_1.addUserInReport)().unwindLookup,
                (0, reportedUser_model_1.addCommentInReport)().lookup,
                (0, reportedUser_model_1.addCommentInReport)().unwindLookup,
                {
                    $group: {
                        _id: "$contentID", // Group by content ID
                        contentType: { '$first': "$contentType" },
                        usersRef: { '$first': "$usersRef" },
                        postsRef: { '$first': "$postsRef" },
                        commentsRef: { '$first': "$commentsRef" },
                        createdAt: { '$last': '$createdAt' },
                        totalReports: { $sum: 1 } // Sum report counts for each content
                    }
                },
                { $sort: { totalReports: -1 } },
                {
                    $limit: documentLimit
                },
            ])
        ]);
        return response.send((0, response_1.httpOk)({
            reports,
            documents,
        }, 'Top reports fetched.'));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_b = error.message) !== null && _b !== void 0 ? _b : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const generateReviewQRCode = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _c, _d;
    try {
        const ID = (_c = request === null || request === void 0 ? void 0 : request.params) === null || _c === void 0 ? void 0 : _c.id;
        const businessProfile = yield businessProfile_model_1.default.findOne({ _id: ID });
        if (!businessProfile) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.BUSINESS_PROFILE_NOT_FOUND), error_1.ErrorMessage.BUSINESS_PROFILE_NOT_FOUND));
        }
        const businessID = encryptionService.encrypt(businessProfile.id);
        const reviewLink = `https://thehotelmedia.com/review?id=${businessID}&placeID=${businessProfile.placeID}`;
        const svg = yield qrcode_1.default.toString(reviewLink, { type: "svg" });
        response.writeHead(200, {
            'Content-Type': 'image/svg',
            'Content-Length': Buffer.byteLength(svg),
        });
        response.write(svg);
        return response.end();
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_d = error.message) !== null && _d !== void 0 ? _d : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
exports.default = { index, topReportedContent, generateReviewQRCode };
