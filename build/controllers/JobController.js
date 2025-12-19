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
const mongodb_1 = require("mongodb");
const response_1 = require("../utils/response");
const error_1 = require("../utils/response-message/error");
const user_model_1 = __importStar(require("../database/models/user.model"));
const anonymousUser_model_1 = require("../database/models/anonymousUser.model");
const job_model_1 = __importDefault(require("../database/models/job.model"));
const index = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_a = error.message) !== null && _a !== void 0 ? _a : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const store = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    try {
        const { id } = request.user;
        const { title, designation, description, jobType, salary, joiningDate, numberOfVacancies, experience } = request.body;
        const user = yield user_model_1.default.findOne({ _id: id });
        if (!user) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        if (user.accountType !== anonymousUser_model_1.AccountType.BUSINESS) {
            return response.send((0, response_1.httpForbidden)(error_1.ErrorMessage.invalidRequest("Access Denied! You don't have business account"), "Access Denied! You don't have business account"));
        }
        const newJob = new job_model_1.default();
        newJob.userID = id;
        newJob.businessProfileID = user.businessProfileID;
        newJob.title = title;
        newJob.designation = designation;
        newJob.description = description;
        newJob.jobType = jobType;
        newJob.salary = salary;
        newJob.joiningDate = joiningDate;
        newJob.numberOfVacancies = numberOfVacancies;
        newJob.experience = experience;
        const savedJob = yield newJob.save();
        // Note: Job notifications should be sent to followers or target users
        // For now, this is commented out. Uncomment and specify targetUserID when implementing follower notifications
        // AppNotificationController.store(id, targetUserID, NotificationType.JOB, { jobID: savedJob.id, title: savedJob.title }).catch((error: any) => console.error(error))
        return response.send((0, response_1.httpCreated)(savedJob, "Job posted successfully"));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_b = error.message) !== null && _b !== void 0 ? _b : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const update = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _c;
    try {
        // return response.send(httpAcceptedOrUpdated(null, 'Not implemented'));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_c = error.message) !== null && _c !== void 0 ? _c : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const destroy = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _d;
    try {
        // return response.send(httpNoContent(null, 'Not implemented'));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_d = error.message) !== null && _d !== void 0 ? _d : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const show = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _e;
    try {
        let { id } = request.params;
        const dbQuery = { _id: new mongodb_1.ObjectId(id) };
        const job = yield job_model_1.default.aggregate([
            {
                $match: dbQuery
            },
            {
                '$lookup': {
                    'from': 'users',
                    'let': { 'userID': '$userID' },
                    'pipeline': [
                        { '$match': { '$expr': { '$eq': ['$_id', '$$userID'] } } },
                        (0, user_model_1.addBusinessProfileInUser)().lookup,
                        (0, user_model_1.addBusinessProfileInUser)().unwindLookup,
                        {
                            '$project': {
                                "name": 1,
                                'username': 1,
                                "profilePic": 1,
                                "accountType": 1,
                                "businessProfileID": 1,
                                "businessProfileRef._id": 1,
                                "businessProfileRef.name": 1,
                                "businessProfileRef.profilePic": 1,
                                'businessProfileRef.username': 1
                            }
                        }
                    ],
                    'as': 'postedBy'
                }
            },
            {
                '$unwind': {
                    'path': '$postedBy',
                    'preserveNullAndEmptyArrays': true //false value does not fetch relationship.
                }
            },
        ]);
        if (job.length === 0) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        return response.send((0, response_1.httpOk)(job[0], "Job data fetched"));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_e = error.message) !== null && _e !== void 0 ? _e : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
exports.default = { index, store, update, destroy, show };
