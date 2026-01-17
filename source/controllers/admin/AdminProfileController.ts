import { Request, Response, NextFunction } from "express";
import { httpAcceptedOrUpdated, httpBadRequest, httpInternalServerError, httpNotFoundOr404, httpOk } from "../../utils/response";
import { ErrorMessage } from "../../utils/response-message/error";
import User from "../../database/models/user.model";
import EmailNotificationService from "../../services/EmailNotificationService";
import { generateOTP } from "../../utils/helper/basic";

const emailNotificationService = new EmailNotificationService();

/**
 * Initiate Email Update
 * Sends OTP to the NEW email address
 */
const initiateEmailUpdate = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id } = request.user!;
        const { newEmail } = request.body;

        if (!newEmail) {
            return response.send(httpBadRequest(ErrorMessage.missingField("newEmail"), "New email is required"));
        }

        // Check if email is already taken
        const existingUser = await User.findOne({ email: newEmail });
        if (existingUser) {
            return response.send(httpBadRequest("Email already in use", "Email already in use"));
        }

        const user = await User.findOne({ _id: id });
        if (!user) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }

        const otp = generateOTP();
        user.otp = otp;
        await user.save();

        // Send OTP to the NEW email
        await emailNotificationService.sendEmailOTP(otp, newEmail, "verify-email");

        return response.send(httpOk({ message: "OTP sent to new email" }, "OTP sent to new email"));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
};

/**
 * Verify Email Update
 * Verifies OTP and updates admin's email
 */
const verifyEmailUpdate = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id } = request.user!;
        const { newEmail, otp } = request.body;

        if (!newEmail || !otp) {
            return response.send(httpBadRequest(ErrorMessage.missingField("newEmail or otp"), "New email and OTP are required"));
        }

        // Re-check uniqueness
        const existingUser = await User.findOne({ email: newEmail });
        if (existingUser) {
            return response.send(httpBadRequest("Email already in use", "Email already in use"));
        }

        const user = await User.findOne({ _id: id }).select("+otp");
        if (!user) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }

        if (user.otp !== parseInt(otp)) {
            return response.send(httpBadRequest("Invalid OTP", "Invalid OTP"));
        }

        user.email = newEmail;
        user.otp = 0;
        await user.save();

        return response.send(httpAcceptedOrUpdated({ email: user.email }, "Email updated successfully"));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
};

/**
 * Initiate Password Update
 * Sends OTP to the EXISTING admin email
 */
const initiatePasswordUpdate = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id } = request.user!;

        const user = await User.findOne({ _id: id });
        if (!user) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }

        const otp = generateOTP();
        user.otp = otp;
        await user.save();

        // Send OTP to the EXISTING email
        await emailNotificationService.sendEmailOTP(otp, user.email, "verify-email");

        return response.send(httpOk({ message: "OTP sent to your email" }, "OTP sent to your email"));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
};

/**
 * Verify Password Update
 * Verifies OTP and updates admin's password
 */
const verifyPasswordUpdate = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id } = request.user!;
        const { newPassword, otp } = request.body;

        if (!newPassword || !otp) {
            return response.send(httpBadRequest(ErrorMessage.missingField("newPassword or otp"), "New password and OTP are required"));
        }

        const user = await User.findOne({ _id: id }).select("+otp");
        if (!user) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }

        if (user.otp !== parseInt(otp)) {
            return response.send(httpBadRequest("Invalid OTP", "Invalid OTP"));
        }

        user.password = newPassword; // Mongoose middleware will hash this
        user.otp = 0;
        await user.save();

        return response.send(httpAcceptedOrUpdated(null, "Password updated successfully"));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
};

export default {
    initiateEmailUpdate,
    verifyEmailUpdate,
    initiatePasswordUpdate,
    verifyPasswordUpdate
};
