import { Request, Response, NextFunction } from "express"
import { httpBadRequest, httpNotFoundOr404, httpInternalServerError, httpOk, httpUnauthorized } from "../../utils/response";
import { ErrorMessage } from "../../utils/response-message/error";
import User from "../../database/models/user.model";
import { generateOTP } from "../../utils/helper/basic";
import { AuthenticateUser } from "../../common";
import PasswordResetToken from "../../database/models/passwordResetToken.model";
import { sign } from "jsonwebtoken";
const forgotPasswordRequest = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { email } = request.body;
        const account = await User.findOne({ email: email }, '+otp')
        if (!account) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        account.otp = generateOTP();
        await account.save();
        return response.json(httpOk({ email }, `OTP sent to your email.`));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}

const verifyOTP = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { email, otp } = request.body;
        const account = await User.findOne({ email: email }, '+otp')
        if (!account) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        if (account.otp !== parseInt(otp)) {
            return response.send(httpUnauthorized(ErrorMessage.invalidRequest(ErrorMessage.OTP_NOT_MATCH), ErrorMessage.OTP_NOT_MATCH));
        }
        account.otp = generateOTP();
        const savedUser = await account.save();
        const authenticateUser: AuthenticateUser = { id: savedUser.id, accountType: savedUser.accountType };
        const resetToken = await sign(authenticateUser, "BilxD9BFfd", { algorithm: "HS256" });
        const hasPasswordResetToken = await PasswordResetToken.findOne({ userID: savedUser._id });

        const expiresIn = new Date();
        // Add 15 minutes
        expiresIn.setMinutes(expiresIn.getMinutes() + 15);
        if (!hasPasswordResetToken) {
            const newPasswordResetToken = new PasswordResetToken();
            newPasswordResetToken.userID = savedUser.id;
            newPasswordResetToken.token = resetToken;
            newPasswordResetToken.expiresIn = expiresIn;
            await newPasswordResetToken.save();
            return response.json(httpOk({ email: email, resetToken: resetToken }, `OTP verified successfully.`));
        }
        hasPasswordResetToken.expiresIn = expiresIn;
        hasPasswordResetToken.token = resetToken;
        await hasPasswordResetToken.save();
        return response.json(httpOk({ email: email, resetToken: resetToken }, `OTP verified successfully.`));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const resetPassword = async (request: Request, response: Response, next: NextFunction) => {
    try {
        let { email, password, resetToken } = request.body;
        const account = await User.findOne({ email: email })
        if (!account) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        const passwordResetToken = await PasswordResetToken.findOne({ userID: account._id, token: resetToken });
        if (!passwordResetToken) {
            return response.send(httpNotFoundOr404(null, 'Reset token not found'));
        }
        const now = new Date();
        if (passwordResetToken.expiresIn < now) {
            return response.send(httpBadRequest(null, `Your reset token has expired. Please submit a new password reset request to continue.`))
        }
        account.password = password;
        await account.save();
        await passwordResetToken.deleteOne();
        return response.json(httpOk(null, "Your password has been reset successfully."));
    } catch (error: any) {
        return response.send(httpInternalServerError([error], "Some error occurred while OTP verification."));
    }
}

export default { forgotPasswordRequest, verifyOTP, resetPassword }