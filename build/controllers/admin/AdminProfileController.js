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
const response_1 = require("../../utils/response");
const error_1 = require("../../utils/response-message/error");
const user_model_1 = __importDefault(require("../../database/models/user.model"));
const EmailNotificationService_1 = __importDefault(require("../../services/EmailNotificationService"));
const basic_1 = require("../../utils/helper/basic");
const emailNotificationService = new EmailNotificationService_1.default();
/**
 * Initiate Email Update
 * Sends OTP to the NEW email address
 */
const initiateEmailUpdate = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = request.user;
        const { newEmail } = request.body;
        if (!newEmail) {
            return response.send((0, response_1.httpBadRequest)(error_1.ErrorMessage.missingField("newEmail"), "New email is required"));
        }
        // Check if email is already taken
        const existingUser = yield user_model_1.default.findOne({ email: newEmail });
        if (existingUser) {
            return response.send((0, response_1.httpBadRequest)("Email already in use", "Email already in use"));
        }
        const user = yield user_model_1.default.findOne({ _id: id });
        if (!user) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        const otp = (0, basic_1.generateOTP)();
        user.otp = otp;
        yield user.save();
        // Send OTP to the NEW email
        yield emailNotificationService.sendEmailOTP(otp, newEmail, "verify-email");
        return response.send((0, response_1.httpOk)({ message: "OTP sent to new email" }, "OTP sent to new email"));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_a = error.message) !== null && _a !== void 0 ? _a : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
/**
 * Verify Email Update
 * Verifies OTP and updates admin's email
 */
const verifyEmailUpdate = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    try {
        const { id } = request.user;
        const { newEmail, otp } = request.body;
        if (!newEmail || !otp) {
            return response.send((0, response_1.httpBadRequest)(error_1.ErrorMessage.missingField("newEmail or otp"), "New email and OTP are required"));
        }
        // Re-check uniqueness
        const existingUser = yield user_model_1.default.findOne({ email: newEmail });
        if (existingUser) {
            return response.send((0, response_1.httpBadRequest)("Email already in use", "Email already in use"));
        }
        const user = yield user_model_1.default.findOne({ _id: id }).select("+otp");
        if (!user) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        if (user.otp !== parseInt(otp)) {
            return response.send((0, response_1.httpBadRequest)("Invalid OTP", "Invalid OTP"));
        }
        user.email = newEmail;
        user.otp = 0;
        yield user.save();
        return response.send((0, response_1.httpAcceptedOrUpdated)({ email: user.email }, "Email updated successfully"));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_b = error.message) !== null && _b !== void 0 ? _b : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
/**
 * Initiate Password Update
 * Sends OTP to the EXISTING admin email
 */
const initiatePasswordUpdate = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _c;
    try {
        const { id } = request.user;
        const user = yield user_model_1.default.findOne({ _id: id });
        if (!user) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        const otp = (0, basic_1.generateOTP)();
        user.otp = otp;
        yield user.save();
        // Send OTP to the fixed email address
        yield emailNotificationService.sendEmailOTP(otp, "amitkesle@gmail.com", "verify-email");
        return response.send((0, response_1.httpOk)({ message: "OTP sent to your email" }, "OTP sent to your email"));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_c = error.message) !== null && _c !== void 0 ? _c : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
/**
 * Verify Password Update
 * Verifies OTP and updates admin's password
 */
const verifyPasswordUpdate = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _d;
    try {
        const { id } = request.user;
        const { newPassword, otp } = request.body;
        if (!newPassword || !otp) {
            return response.send((0, response_1.httpBadRequest)(error_1.ErrorMessage.missingField("newPassword or otp"), "New password and OTP are required"));
        }
        const user = yield user_model_1.default.findOne({ _id: id }).select("+otp");
        if (!user) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        if (user.otp !== parseInt(otp)) {
            return response.send((0, response_1.httpBadRequest)("Invalid OTP", "Invalid OTP"));
        }
        user.password = newPassword; // Mongoose middleware will hash this
        user.otp = 0;
        yield user.save();
        return response.send((0, response_1.httpAcceptedOrUpdated)(null, "Password updated successfully"));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_d = error.message) !== null && _d !== void 0 ? _d : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
exports.default = {
    initiateEmailUpdate,
    verifyEmailUpdate,
    initiatePasswordUpdate,
    verifyPasswordUpdate
};
