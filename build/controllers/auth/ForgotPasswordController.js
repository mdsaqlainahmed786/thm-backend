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
const basic_1 = require("../../utils/helper/basic");
const passwordResetToken_model_1 = __importDefault(require("../../database/models/passwordResetToken.model"));
const jsonwebtoken_1 = require("jsonwebtoken");
const EmailNotificationService_1 = __importDefault(require("../../services/EmailNotificationService"));
const emailNotificationService = new EmailNotificationService_1.default();
const forgotPasswordRequest = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { email } = request.body;
        const account = yield user_model_1.default.findOne({ email: email }, '+otp');
        if (!account) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        account.otp = (0, basic_1.generateOTP)();
        emailNotificationService.sendEmailOTP(account.otp, account.email, "forgot-password");
        yield account.save();
        return response.json((0, response_1.httpOk)({ email }, `OTP sent to your email.`));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_a = error.message) !== null && _a !== void 0 ? _a : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const verifyOTP = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    try {
        const { email, otp } = request.body;
        const account = yield user_model_1.default.findOne({ email: email }, '+otp');
        if (!account) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        if (account.otp !== parseInt(otp)) {
            return response.send((0, response_1.httpUnauthorized)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.OTP_NOT_MATCH), error_1.ErrorMessage.OTP_NOT_MATCH));
        }
        account.otp = (0, basic_1.generateOTP)();
        const savedUser = yield account.save();
        const authenticateUser = { id: savedUser.id, accountType: savedUser.accountType, role: savedUser.role };
        const resetToken = yield (0, jsonwebtoken_1.sign)(authenticateUser, "BilxD9BFfd", { algorithm: "HS256" });
        const hasPasswordResetToken = yield passwordResetToken_model_1.default.findOne({ userID: savedUser._id });
        const expiresIn = new Date();
        // Add 15 minutes
        expiresIn.setMinutes(expiresIn.getMinutes() + 15);
        if (!hasPasswordResetToken) {
            const newPasswordResetToken = new passwordResetToken_model_1.default();
            newPasswordResetToken.userID = savedUser.id;
            newPasswordResetToken.token = resetToken;
            newPasswordResetToken.expiresIn = expiresIn;
            yield newPasswordResetToken.save();
            return response.json((0, response_1.httpOk)({ email: email, resetToken: resetToken }, `OTP verified successfully.`));
        }
        hasPasswordResetToken.expiresIn = expiresIn;
        hasPasswordResetToken.token = resetToken;
        yield hasPasswordResetToken.save();
        return response.json((0, response_1.httpOk)({ email: email, resetToken: resetToken }, `OTP verified successfully.`));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_b = error.message) !== null && _b !== void 0 ? _b : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const resetPassword = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let { email, password, resetToken } = request.body;
        const account = yield user_model_1.default.findOne({ email: email });
        if (!account) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        const passwordResetToken = yield passwordResetToken_model_1.default.findOne({ userID: account._id, token: resetToken });
        if (!passwordResetToken) {
            return response.send((0, response_1.httpNotFoundOr404)(null, 'Reset token not found'));
        }
        const now = new Date();
        if (passwordResetToken.expiresIn < now) {
            return response.send((0, response_1.httpBadRequest)(null, `Your reset token has expired. Please submit a new password reset request to continue.`));
        }
        account.password = password;
        yield account.save();
        yield passwordResetToken.deleteOne();
        return response.json((0, response_1.httpOk)(null, "Your password has been reset successfully."));
    }
    catch (error) {
        return response.send((0, response_1.httpInternalServerError)([error], "Some error occurred while OTP verification."));
    }
});
exports.default = { forgotPasswordRequest, verifyOTP, resetPassword };
