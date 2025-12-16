"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const AuthController_1 = __importDefault(require("../../controllers/auth/AuthController"));
const ForgotPasswordController_1 = __importDefault(require("../../controllers/auth/ForgotPasswordController"));
const api_validation_1 = require("../../validation/rules/api-validation");
const api_request_validator_1 = require("../../middleware/api-request-validator");
const AuthEndpoint = express_1.default.Router();
AuthEndpoint.post('/signup', api_validation_1.signUpApiValidator, api_request_validator_1.validateRequest, AuthController_1.default.signUp);
AuthEndpoint.post('/otp-login', AuthController_1.default.verifyOtpLogin);
AuthEndpoint.post('/login', api_validation_1.loginApiValidator, api_request_validator_1.validateRequest, AuthController_1.default.login);
AuthEndpoint.post("/email-verify", api_validation_1.verifyEmailApiValidator, api_request_validator_1.validateRequest, AuthController_1.default.verifyEmail);
AuthEndpoint.post("/resend-otp", api_validation_1.resendOTPApiValidator, api_request_validator_1.validateRequest, AuthController_1.default.resendOTP);
AuthEndpoint.post("/logout", AuthController_1.default.logout);
AuthEndpoint.post("/refresh-token", AuthController_1.default.refreshToken);
AuthEndpoint.post('/social/login', api_validation_1.socialLoginApiValidator, api_request_validator_1.validateRequest, AuthController_1.default.socialLogin);
//Forgot password
AuthEndpoint.post("/forgot-password", api_validation_1.forgotPasswordApiValidator, api_request_validator_1.validateRequest, ForgotPasswordController_1.default.forgotPasswordRequest);
AuthEndpoint.post("/forgot-password/verify-otp", api_validation_1.verifyOTPApiValidator, api_request_validator_1.validateRequest, ForgotPasswordController_1.default.verifyOTP);
AuthEndpoint.post("/reset-password", api_validation_1.resetPasswordApiValidator, api_request_validator_1.validateRequest, ForgotPasswordController_1.default.resetPassword);
exports.default = AuthEndpoint;
