"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const AuthController_1 = __importDefault(require("../../../controllers/auth/AuthController"));
const api_validation_1 = require("../../../validation/rules/api-validation");
const api_request_validator_1 = require("../../../middleware/api-request-validator");
const AuthEndpoint = express_1.default.Router();
// AuthEndpoint.post('/signup', signUpApiValidator, validateRequest, AuthController.signUp);
AuthEndpoint.post('/login', api_validation_1.loginApiValidator, api_request_validator_1.validateRequest, AuthController_1.default.login);
// AuthEndpoint.post("/email-verify", verifyEmailApiValidator, validateRequest, AuthController.verifyEmail);
// AuthEndpoint.post("/resend-otp", resendOTPApiValidator, validateRequest, AuthController.resendOTP);
// AuthEndpoint.post("/logout", AuthController.logout);
// AuthEndpoint.post("/refresh-token", AuthController.refreshToken);
//Forgot password
// AuthEndpoint.post("/forgot-password", forgotPasswordApiValidator, validateRequest, ForgotPasswordController.forgotPasswordRequest);
// AuthEndpoint.post("/forgot-password/verify-otp", verifyOTPApiValidator, validateRequest, ForgotPasswordController.verifyOTP);
// AuthEndpoint.post("/reset-password", resetPasswordApiValidator, validateRequest, ForgotPasswordController.resetPassword);
exports.default = AuthEndpoint;
