import express, { Router, Request, Response } from "express";
import AuthController from "../../controllers/auth/AuthController";
import ForgotPasswordController from "../../controllers/auth/ForgotPasswordController";
import { loginApiValidator, resendOTPApiValidator, signUpApiValidator, verifyEmailApiValidator, forgotPasswordApiValidator, verifyOTPApiValidator, resetPasswordApiValidator, socialLoginApiValidator } from "../../validation/rules/api-validation";
import { validateRequest } from "../../middleware/api-request-validator";
import authenticateUser from "../../middleware/authenticate";
const AuthEndpoint: Router = express.Router();
AuthEndpoint.post('/signup', signUpApiValidator, validateRequest, AuthController.signUp);
AuthEndpoint.post('/otp-login', AuthController.verifyOtpLogin);
AuthEndpoint.post('/login', loginApiValidator, validateRequest, AuthController.login);
AuthEndpoint.post("/email-verify", verifyEmailApiValidator, validateRequest, AuthController.verifyEmail);
AuthEndpoint.post("/resend-otp", resendOTPApiValidator, validateRequest, AuthController.resendOTP);
AuthEndpoint.post("/logout", AuthController.logout);
AuthEndpoint.post("/refresh-token", AuthController.refreshToken);


AuthEndpoint.post('/social/login', socialLoginApiValidator, validateRequest, AuthController.socialLogin);

//Forgot password
AuthEndpoint.post("/forgot-password", forgotPasswordApiValidator, validateRequest, ForgotPasswordController.forgotPasswordRequest);
AuthEndpoint.post("/forgot-password/verify-otp", verifyOTPApiValidator, validateRequest, ForgotPasswordController.verifyOTP);
AuthEndpoint.post("/reset-password", resetPasswordApiValidator, validateRequest, ForgotPasswordController.resetPassword);
export default AuthEndpoint;