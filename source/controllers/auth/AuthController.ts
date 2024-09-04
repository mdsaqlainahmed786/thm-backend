import { Request, Response, NextFunction } from "express";
import { httpInternalServerError, httpNotFoundOr404, httpUnauthorized, httpOk, httpConflict, httpForbidden } from "../../utils/response";
import { ErrorMessage } from "../../utils/response-message/error";
import User, { AccountType } from "../../database/models/user.model";
import { SuccessMessage } from "../../utils/response-message/success";
import { generateOTP } from "../../utils/helper/basic";
import { AppConfig } from "../../config/constants";
import { AuthenticateUser } from "../../common";
import { generateAccessToken, generateRefreshToken } from "../../middleware/authenticate";
import { CookiePolicy } from "../../config/constants";
import AuthToken from "../../database/models/authToken.model";
import DevicesConfig, { addUserDevicesConfig } from "../../database/models/appDeviceConfig.model";
import { verify } from "jsonwebtoken";
import BusinessType from "../../database/models/businessType.model";
import BusinessSubType from "../../database/models/businessSubType.model";
import BusinessProfile, { GeoCoordinate } from "../../database/models/businessProfile.model";

const login = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { email, password, deviceID, notificationToken, devicePlatform } = request.body;
        const user = await User.findOne({ email: email });
        if (!user) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return response.status(200).send(httpUnauthorized(null, ErrorMessage.INVALID_OR_INCORRECT_PASSWORD));
        }
        if (!user.isVerified) {
            return response.status(200).send(httpForbidden(null, ErrorMessage.UNVERIFIED_ACCOUNT))
        }
        if (!user.isActivated) {
            return response.status(200).send(httpForbidden(null, ErrorMessage.INACTIVE_ACCOUNT))
        }
        if (user.isDeleted) {
            return response.status(200).send(httpForbidden(null, ErrorMessage.ACCOUNT_DISABLED))
        }
        const authenticateUser: AuthenticateUser = { id: user.id, accountType: user.accountType };
        const accessToken = await generateAccessToken(authenticateUser);
        const refreshToken = await generateRefreshToken(authenticateUser, deviceID);
        response.cookie(AppConfig.USER_AUTH_TOKEN_COOKIE_KEY, refreshToken, CookiePolicy);
        response.cookie(AppConfig.USER_AUTH_TOKEN_KEY, accessToken, CookiePolicy);
        await addUserDevicesConfig(deviceID, devicePlatform, notificationToken, user.id, user.accountType);
        if (deviceID) {
            response.cookie(AppConfig.ADMIN_DEVICE_ID_COOKIE_KEY, deviceID, CookiePolicy);
        }
        return response.send(httpOk({ ...user.hideSensitiveData(), accessToken, refreshToken }, SuccessMessage.LOGIN_SUCCESS));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const signUp = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { email, fullName, accountType, dialCode, phoneNumber, password, businessName, businessEmail, businessPhoneNumber, businessDialCode, businessType, businessSubType, businessDescription, businessWebsite, gstn, street, city, zipCode, country, lat, lng, state } = request.body;
        const isUserExist = await User.findOne({ email: email });
        if (isUserExist) {
            return response.send(httpConflict(ErrorMessage.invalidRequest(ErrorMessage.EMAIL_IN_USE), ErrorMessage.EMAIL_IN_USE));
        }
        if (accountType === AccountType.BUSINESS) {
            const isBusinessTypeExist = await BusinessType.findOne({ _id: businessType });
            if (!isBusinessTypeExist) {
                return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest("Business type not found"), "Business type not found"))
            }
            const isBusinessSubTypeExist = await BusinessSubType.findOne({ businessTypeID: isBusinessTypeExist.id, _id: businessSubType });
            if (!isBusinessSubTypeExist) {
                return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest("Business subtype not found"), "Business subtype not found"))
            }

            /** Create business profile */
            const newBusinessProfile = new BusinessProfile();
            newBusinessProfile.businessTypeID = isBusinessTypeExist.id;
            newBusinessProfile.businessSubTypeID = isBusinessSubTypeExist.id;
            newBusinessProfile.name = businessName;
            const geoCoordinate: GeoCoordinate = { type: "Point", coordinates: [lng, lat] }
            newBusinessProfile.address = { city, state, street, zipCode, country, geoCoordinate, lat, lng };
            newBusinessProfile.email = businessEmail;
            newBusinessProfile.phoneNumber = businessPhoneNumber;
            newBusinessProfile.dialCode = businessDialCode;
            newBusinessProfile.website = businessWebsite;
            newBusinessProfile.gstn = gstn;
            newBusinessProfile.profilePic = { small: '', large: '', medium: '' };
            const savedBusinessProfile = await newBusinessProfile.save();

            const newUser = new User();
            newUser.email = email;
            newUser.fullName = fullName;
            newUser.accountType = accountType;
            newUser.dialCode = dialCode;
            newUser.phoneNumber = phoneNumber;
            newUser.password = password;
            newUser.isActivated = true;
            newUser.businessProfileID = savedBusinessProfile.id;
            newUser.otp = generateOTP();
            const savedUser = await newUser.save();
            return response.send(httpOk(savedUser.hideSensitiveData(), SuccessMessage.REGISTRATION_SUCCESSFUL))
        }
        const newUser = new User();
        newUser.email = email;
        newUser.fullName = fullName;
        newUser.accountType = accountType;
        newUser.dialCode = dialCode;
        newUser.phoneNumber = phoneNumber;
        newUser.password = password;
        newUser.isActivated = true;
        newUser.profilePic = { small: '', large: '', medium: '' };
        newUser.otp = generateOTP();
        const savedUser = await newUser.save();
        return response.send(httpOk(savedUser.hideSensitiveData(), SuccessMessage.REGISTRATION_SUCCESSFUL));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const verifyEmail = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { email, otp, deviceID, notificationToken, devicePlatform } = request.body;
        const user = await User.findOne({ email: email }).select("+otp");
        if (!user) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        if (user.otp !== parseInt(otp)) {
            return response.send(httpUnauthorized(ErrorMessage.invalidRequest(ErrorMessage.OTP_NOT_MATCH), ErrorMessage.OTP_NOT_MATCH));
        }
        if (!user.isActivated) {
            return response.send(httpUnauthorized(ErrorMessage.invalidRequest(ErrorMessage.INACTIVE_ACCOUNT), ErrorMessage.INACTIVE_ACCOUNT));
        }
        if (user.isDeleted) {
            return response.send(httpUnauthorized(ErrorMessage.invalidRequest(ErrorMessage.ACCOUNT_DISABLED), ErrorMessage.ACCOUNT_DISABLED));
        }
        user.isVerified = true;
        user.otp = generateOTP();
        const savedUser = await user.save();
        const authenticateUser: AuthenticateUser = { id: user.id, accountType: user.accountType };
        const accessToken = await generateAccessToken(authenticateUser);
        const refreshToken = await generateRefreshToken(authenticateUser, deviceID);
        response.cookie(AppConfig.USER_AUTH_TOKEN_COOKIE_KEY, refreshToken, CookiePolicy);
        response.cookie(AppConfig.USER_AUTH_TOKEN_KEY, accessToken, CookiePolicy);
        await addUserDevicesConfig(deviceID, devicePlatform, notificationToken, user.id, user.accountType);
        if (deviceID) {
            response.cookie(AppConfig.ADMIN_DEVICE_ID_COOKIE_KEY, deviceID, CookiePolicy);
        }
        return response.send(httpOk({ ...savedUser.hideSensitiveData(), accessToken, refreshToken }, SuccessMessage.OTP_VERIFIED));
    } catch (error: any) {
        return response.send(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}

const resendOTP = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { email } = request.body;
        const user = await User.findOne({ email: email }).select("+otp");
        if (!user) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        user.otp = generateOTP();
        await user.save();
        return response.send(httpOk(null, 'Otp Sent'));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}


const logout = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const cookies = request?.cookies;
        const refreshToken = cookies[AppConfig.USER_AUTH_TOKEN_COOKIE_KEY];
        if (!refreshToken) {
            return response.status(401).send(httpUnauthorized(ErrorMessage.invalidRequest(ErrorMessage.TOKEN_REQUIRED), ErrorMessage.TOKEN_REQUIRED));
        }
        let authTokenFindQuery = { refreshToken: refreshToken }
        const deviceID = cookies[AppConfig.USER_DEVICE_ID_COOKIE_KEY];
        if (deviceID !== undefined && deviceID !== "") {
            Object.assign(authTokenFindQuery, { deviceID: deviceID });
        }
        const authToken = await AuthToken.findOne(authTokenFindQuery);
        if (!authToken) {
            response.clearCookie(AppConfig.USER_AUTH_TOKEN_COOKIE_KEY, CookiePolicy);
            response.clearCookie(AppConfig.USER_DEVICE_ID_COOKIE_KEY, CookiePolicy);
            response.clearCookie(AppConfig.USER_AUTH_TOKEN_KEY, CookiePolicy);
            return response.status(401).send(httpUnauthorized(ErrorMessage.invalidRequest(ErrorMessage.TOKEN_MISMATCH), ErrorMessage.TOKEN_MISMATCH));
        }
        if (authToken?.deviceID) {
            await DevicesConfig.deleteMany({ userID: authToken.userID, deviceID: authToken.deviceID });
        }
        await authToken.deleteOne();
        response.clearCookie(AppConfig.USER_AUTH_TOKEN_COOKIE_KEY, CookiePolicy);
        response.clearCookie(AppConfig.USER_DEVICE_ID_COOKIE_KEY, CookiePolicy);
        response.clearCookie(AppConfig.USER_AUTH_TOKEN_KEY, CookiePolicy);
        return response.send(httpOk(null, SuccessMessage.LOGOUT_SUCCESS))
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const refreshToken = async (request: Request, response: Response, next: NextFunction) => {
    const cookies = request?.cookies;
    const refreshToken = cookies[AppConfig.USER_AUTH_TOKEN_COOKIE_KEY];
    const deviceID = cookies[AppConfig.USER_DEVICE_ID_COOKIE_KEY];
    if (!refreshToken) {
        return response.status(401).send(httpUnauthorized(ErrorMessage.invalidRequest(ErrorMessage.TOKEN_REQUIRED), ErrorMessage.TOKEN_REQUIRED));
    }
    const authToken = await AuthToken.findOne({ refreshToken: refreshToken });
    if (!authToken) {
        return response.status(403).send(httpUnauthorized(ErrorMessage.invalidRequest(ErrorMessage.TOKEN_MISMATCH), ErrorMessage.TOKEN_MISMATCH));
    }
    try {
        const decoded = verify(authToken?.refreshToken, AppConfig.APP_REFRESH_TOKEN_SECRET);
        if (decoded) {
            const userData = await User.findOne({ _id: authToken.userID, })
            if (userData) {
                const userWithRole: AuthenticateUser = { id: userData?.id, accountType: authToken?.accountType }
                const accessToken = await generateAccessToken(userWithRole);
                const refreshToken = await generateRefreshToken(userWithRole, deviceID);
                await authToken.deleteOne();
                response.cookie(AppConfig.USER_AUTH_TOKEN_COOKIE_KEY, refreshToken, CookiePolicy);
                response.cookie(AppConfig.USER_DEVICE_ID_COOKIE_KEY, deviceID, CookiePolicy);
                response.cookie(AppConfig.USER_AUTH_TOKEN_KEY, accessToken, CookiePolicy);
                return response.status(200).send(httpOk({ accessToken, refreshToken }, `Token Refreshed`));
            } else {
                return response.status(403).send(httpUnauthorized({}, ErrorMessage.INSUFFICIENT_TO_GRANT_ACCESS));
            }
        }
    } catch (error: any) {
        return response.status(403).send(httpUnauthorized({}, ErrorMessage.INVALID_OR_EXPIRED_TOKEN));
    }
}


export default { login, resendOTP, verifyEmail, logout, refreshToken, signUp };