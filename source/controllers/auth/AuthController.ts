import { Business, SocialAccount, } from './../../database/models/user.model';
import { Request, Response, NextFunction } from "express";
import { httpInternalServerError, httpNotFoundOr404, httpUnauthorized, httpOk, httpConflict, httpForbidden, httpBadRequest } from "../../utils/response";
import { ErrorMessage } from "../../utils/response-message/error";
import User, { AccountType } from "../../database/models/user.model";
import { SuccessMessage } from "../../utils/response-message/success";
import { generateOTP } from "../../utils/helper/basic";
import { AppConfig } from "../../config/constants";
import { AuthenticateUser, Role } from "../../common";
import { generateAccessToken, generateRefreshToken } from "../../middleware/authenticate";
import { CookiePolicy } from "../../config/constants";
import AuthToken from "../../database/models/authToken.model";
import DevicesConfig, { addUserDevicesConfig } from "../../database/models/appDeviceConfig.model";
import { verify } from "jsonwebtoken";
import BusinessType from "../../database/models/businessType.model";
import BusinessSubType from "../../database/models/businessSubType.model";
import BusinessProfile from "../../database/models/businessProfile.model";
import { GeoCoordinate } from '../../database/models/common.model';
import BusinessDocument from '../../database/models/businessDocument.model';
import Subscription from '../../database/models/subscription.model';
import { generateFromEmail } from "unique-username-generator";
import EmailNotificationService from '../../services/EmailNotificationService';
import { Types } from '../../validation/rules/api-validation';
import SocialProviders from '../../services/SocialProviders';
import { v4 } from 'uuid';

const emailNotificationService = new EmailNotificationService();
const login = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { email, password, deviceID, notificationToken, devicePlatform } = request.body;
        const user = await User.findOne({ email: email });
        if (!user) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return response.status(200).send(httpForbidden(null, ErrorMessage.INVALID_OR_INCORRECT_PASSWORD));
        }
        if (!user.isVerified) {
            const otp = generateOTP();
            emailNotificationService.sendEmailOTP(otp, user.email, 'verify-email');
            user.otp = otp;
            await user.save();
            return response.status(200).send(httpForbidden({ ...user.hideSensitiveData() }, ErrorMessage.UNVERIFIED_ACCOUNT))
        }
        if (!user.isActivated) {
            return response.status(200).send(httpForbidden(null, ErrorMessage.INACTIVE_ACCOUNT))
        }
        if (user.isDeleted) {
            return response.status(200).send(httpForbidden(null, ErrorMessage.ACCOUNT_DISABLED))
        }
        //If this is called from admin endpoint
        if (['/api/v1/admin/auth'].includes(request.baseUrl) && user.role !== Role.ADMINISTRATOR) {
            return response.status(403).send(httpForbidden(ErrorMessage.subscriptionExpired(ErrorMessage.UNAUTHORIZED_ACCESS_ERROR), ErrorMessage.UNAUTHORIZED_ACCESS_ERROR));
        }
        await addUserDevicesConfig(deviceID, devicePlatform, notificationToken, user.id, user.accountType);
        if (deviceID) {
            response.cookie(AppConfig.DEVICE_ID_COOKIE_KEY, deviceID, CookiePolicy);
        }
        let isDocumentUploaded = true;
        let hasAmenities = true;
        let hasSubscription = true;
        let businessProfileRef = null;
        if (user.accountType === AccountType.BUSINESS && user.businessProfileID) {
            const [businessDocument, businessProfile, subscription] = await Promise.all(
                [
                    BusinessDocument.find({ businessProfileID: user.businessProfileID }),
                    BusinessProfile.findOne({ _id: user.businessProfileID }),
                    Subscription.findOne({ businessProfileID: user.businessProfileID, isCancelled: false }).sort({ createdAt: -1, id: 1 })
                ]
            )
            businessProfileRef = businessProfile;
            const authenticateUser: AuthenticateUser = { id: user.id, accountType: user.accountType, businessProfileID: user.businessProfileID, role: user.role };
            const accessToken = await generateAccessToken(authenticateUser, "15m");
            response.cookie(AppConfig.USER_AUTH_TOKEN_KEY, accessToken, CookiePolicy);
            if (!businessDocument || businessDocument.length === 0) {
                isDocumentUploaded = false;
            }
            if (!businessProfileRef || !businessProfileRef.amenities || businessProfileRef.amenities.length === 0) {
                hasAmenities = false;
            }

            if (!subscription) {
                hasSubscription = false;
            }

            if (!isDocumentUploaded || !hasAmenities || !hasSubscription) {
                return response.send(httpOk({ ...user.hideSensitiveData(), businessProfileRef, isDocumentUploaded, hasAmenities, hasSubscription, accessToken, }, "Your profile is incomplete. Please take a moment to complete it."));
            }
            const now = new Date();
            if (subscription && subscription.expirationDate < now) {
                hasSubscription = false;
                return response.send(httpForbidden({ ...user.hideSensitiveData(), businessProfileRef, isDocumentUploaded, hasAmenities, hasSubscription, accessToken, }, `Your subscription expired`));
            }
        }
        if (!user.isApproved) {
            return response.status(200).send(httpForbidden(null, "Your account is currently under review. We will notify you once it has been verified."))
        }
        const authenticateUser: AuthenticateUser = { id: user.id, accountType: user.accountType, businessProfileID: user.businessProfileID, role: user.role };
        const accessToken = await generateAccessToken(authenticateUser);
        const refreshToken = await generateRefreshToken(authenticateUser, deviceID);
        response.cookie(AppConfig.USER_AUTH_TOKEN_COOKIE_KEY, refreshToken, CookiePolicy);
        response.cookie(AppConfig.USER_AUTH_TOKEN_KEY, accessToken, CookiePolicy);
        return response.send(httpOk({ ...user.hideSensitiveData(), businessProfileRef, isDocumentUploaded, hasAmenities, hasSubscription, accessToken, refreshToken }, SuccessMessage.LOGIN_SUCCESS));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}

const socialLogin = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { socialType, token, dialCode, phoneNumber, deviceID, devicePlatform, notificationToken, name } = request.body;

        let isDocumentUploaded = true;
        let hasAmenities = true;
        let hasSubscription = true;
        let businessProfileRef = null;
        if (socialType === SocialAccount.GOOGLE) {
            try {
                const { email, name, sub, picture } = await SocialProviders.verifyGoogleToken(token);
                if (!email || !name) {
                    return response.send(httpBadRequest(null, 'Email cannot be null or empty.'))
                }
                const [username, user] = await Promise.all([
                    generateUsername(email, AccountType.INDIVIDUAL),
                    User.findOne({ email: email }),
                ]);
                if (!user) {
                    const newUser = new User();
                    newUser.profilePic = { small: picture ?? '', large: picture ?? '', medium: picture ?? '' };
                    newUser.username = username;
                    newUser.email = email;
                    newUser.name = name;
                    newUser.accountType = AccountType.INDIVIDUAL;
                    newUser.dialCode = dialCode;
                    newUser.phoneNumber = phoneNumber;
                    newUser.password = v4();
                    newUser.isActivated = true;
                    newUser.isVerified = true;
                    newUser.hasProfilePicture = true;
                    newUser.socialIDs = [{
                        socialUId: sub,
                        socialType: socialType
                    }];
                    const savedUser = await newUser.save();
                    const authenticateUser: AuthenticateUser = { id: savedUser.id, accountType: savedUser.accountType, businessProfileID: savedUser.businessProfileID, role: savedUser.role };
                    await addUserDevicesConfig(deviceID, devicePlatform, notificationToken, savedUser.id, savedUser.accountType);
                    const accessToken = await generateAccessToken(authenticateUser);
                    const refreshToken = await generateRefreshToken(authenticateUser, deviceID);
                    response.cookie(AppConfig.USER_AUTH_TOKEN_COOKIE_KEY, refreshToken, CookiePolicy);
                    response.cookie(AppConfig.USER_AUTH_TOKEN_KEY, accessToken, CookiePolicy);
                    return response.send(httpOk({ ...savedUser.hideSensitiveData(), businessProfileRef, isDocumentUploaded, hasAmenities, hasSubscription, accessToken, refreshToken }, SuccessMessage.LOGIN_SUCCESS));

                }
                const isSocialIDExist = user && user.socialIDs.some((social) => social.socialType === socialType);
                //Update Social ID
                if (!isSocialIDExist) {
                    user.socialIDs.push({
                        socialUId: sub,
                        socialType: socialType
                    })
                    await user.save();
                }
                if (!user.isActivated) {
                    return response.status(200).send(httpForbidden(null, ErrorMessage.INACTIVE_ACCOUNT))
                }
                if (user.isDeleted) {
                    return response.status(200).send(httpForbidden(null, ErrorMessage.ACCOUNT_DISABLED))
                }
                await addUserDevicesConfig(deviceID, devicePlatform, notificationToken, user.id, user.accountType);
                if (deviceID) {
                    response.cookie(AppConfig.DEVICE_ID_COOKIE_KEY, deviceID, CookiePolicy);
                }

                if (user.accountType === AccountType.BUSINESS && user.businessProfileID) {
                    const [businessDocument, businessProfile, subscription] = await Promise.all(
                        [
                            BusinessDocument.find({ businessProfileID: user.businessProfileID }),
                            BusinessProfile.findOne({ _id: user.businessProfileID }),
                            Subscription.findOne({ businessProfileID: user.businessProfileID, isCancelled: false }).sort({ createdAt: -1, id: 1 })
                        ]
                    )
                    businessProfileRef = businessProfile;
                    const authenticateUser: AuthenticateUser = { id: user.id, accountType: user.accountType, businessProfileID: user.businessProfileID, role: user.role };
                    const accessToken = await generateAccessToken(authenticateUser, "15m");
                    response.cookie(AppConfig.USER_AUTH_TOKEN_KEY, accessToken, CookiePolicy);
                    if (!businessDocument || businessDocument.length === 0) {
                        isDocumentUploaded = false;
                    }
                    if (!businessProfileRef || !businessProfileRef.amenities || businessProfileRef.amenities.length === 0) {
                        hasAmenities = false;
                    }

                    if (!subscription) {
                        hasSubscription = false;
                    }

                    if (!isDocumentUploaded || !hasAmenities || !hasSubscription) {
                        return response.send(httpOk({ ...user.hideSensitiveData(), businessProfileRef, isDocumentUploaded, hasAmenities, hasSubscription, accessToken, }, "Your profile is incomplete. Please take a moment to complete it."));
                    }
                    const now = new Date();
                    if (subscription && subscription.expirationDate < now) {
                        hasSubscription = false;
                        return response.send(httpForbidden({ ...user.hideSensitiveData(), businessProfileRef, isDocumentUploaded, hasAmenities, hasSubscription, accessToken, }, `Your subscription expired`));
                    }
                }
                if (!user.isApproved) {
                    return response.status(200).send(httpForbidden(null, "Your account is currently under review. We will notify you once it has been verified."))
                }
                const authenticateUser: AuthenticateUser = { id: user.id, accountType: user.accountType, businessProfileID: user.businessProfileID, role: user.role };
                const accessToken = await generateAccessToken(authenticateUser);
                const refreshToken = await generateRefreshToken(authenticateUser, deviceID);
                response.cookie(AppConfig.USER_AUTH_TOKEN_COOKIE_KEY, refreshToken, CookiePolicy);
                response.cookie(AppConfig.USER_AUTH_TOKEN_KEY, accessToken, CookiePolicy);
                return response.send(httpOk({ ...user.hideSensitiveData(), businessProfileRef, isDocumentUploaded, hasAmenities, hasSubscription, accessToken, refreshToken }, SuccessMessage.LOGIN_SUCCESS));
            } catch (error: any) {
                next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
            }
        }
        if (socialType === SocialAccount.APPLE) {
            try {
                const { sub, email } = await SocialProviders.verifyAppleToken(token);
                if (!email) {
                    return response.send(httpBadRequest(null, 'Email cannot be null or empty.'))
                }
                const [username, user] = await Promise.all([
                    generateUsername(email, AccountType.INDIVIDUAL),
                    User.findOne({ "socialIDs.socialUId": sub, email: email }),
                ]);
                if (!user) {
                    const newUser = new User();
                    newUser.profilePic = { small: '', large: '', medium: '' };
                    newUser.username = username;
                    newUser.email = email;
                    newUser.name = name ?? username;
                    newUser.accountType = AccountType.INDIVIDUAL;
                    newUser.dialCode = dialCode;
                    newUser.phoneNumber = phoneNumber;
                    newUser.password = v4();
                    newUser.isActivated = true;
                    newUser.isVerified = true;
                    // newUser.hasProfilePicture = true;
                    newUser.socialIDs = [{
                        socialUId: sub,
                        socialType: socialType
                    }];
                    const savedUser = await newUser.save();
                    const authenticateUser: AuthenticateUser = { id: savedUser.id, accountType: savedUser.accountType, businessProfileID: savedUser.businessProfileID, role: savedUser.role };
                    await addUserDevicesConfig(deviceID, devicePlatform, notificationToken, savedUser.id, savedUser.accountType);
                    const accessToken = await generateAccessToken(authenticateUser);
                    const refreshToken = await generateRefreshToken(authenticateUser, deviceID);
                    response.cookie(AppConfig.USER_AUTH_TOKEN_COOKIE_KEY, refreshToken, CookiePolicy);
                    response.cookie(AppConfig.USER_AUTH_TOKEN_KEY, accessToken, CookiePolicy);
                    return response.send(httpOk({ ...savedUser.hideSensitiveData(), businessProfileRef, isDocumentUploaded, hasAmenities, hasSubscription, accessToken, refreshToken }, SuccessMessage.LOGIN_SUCCESS));
                }
                const isSocialIDExist = user && user.socialIDs.some((social) => social.socialType === socialType);
                //Update Social ID
                if (!isSocialIDExist) {
                    user.socialIDs.push({
                        socialUId: sub,
                        socialType: socialType
                    })
                    await user.save();
                }
                if (!user.isActivated) {
                    return response.status(200).send(httpForbidden(null, ErrorMessage.INACTIVE_ACCOUNT))
                }
                if (user.isDeleted) {
                    return response.status(200).send(httpForbidden(null, ErrorMessage.ACCOUNT_DISABLED))
                }
                await addUserDevicesConfig(deviceID, devicePlatform, notificationToken, user.id, user.accountType);
                if (deviceID) {
                    response.cookie(AppConfig.DEVICE_ID_COOKIE_KEY, deviceID, CookiePolicy);
                }
                if (user.accountType === AccountType.BUSINESS && user.businessProfileID) {
                    const [businessDocument, businessProfile, subscription] = await Promise.all(
                        [
                            BusinessDocument.find({ businessProfileID: user.businessProfileID }),
                            BusinessProfile.findOne({ _id: user.businessProfileID }),
                            Subscription.findOne({ businessProfileID: user.businessProfileID, isCancelled: false }).sort({ createdAt: -1, id: 1 })
                        ]
                    )
                    businessProfileRef = businessProfile;
                    const authenticateUser: AuthenticateUser = { id: user.id, accountType: user.accountType, businessProfileID: user.businessProfileID, role: user.role };
                    const accessToken = await generateAccessToken(authenticateUser, "15m");
                    response.cookie(AppConfig.USER_AUTH_TOKEN_KEY, accessToken, CookiePolicy);
                    if (!businessDocument || businessDocument.length === 0) {
                        isDocumentUploaded = false;
                    }
                    if (!businessProfileRef || !businessProfileRef.amenities || businessProfileRef.amenities.length === 0) {
                        hasAmenities = false;
                    }

                    if (!subscription) {
                        hasSubscription = false;
                    }

                    if (!isDocumentUploaded || !hasAmenities || !hasSubscription) {
                        return response.send(httpOk({ ...user.hideSensitiveData(), businessProfileRef, isDocumentUploaded, hasAmenities, hasSubscription, accessToken, }, "Your profile is incomplete. Please take a moment to complete it."));
                    }
                    const now = new Date();
                    if (subscription && subscription.expirationDate < now) {
                        hasSubscription = false;
                        return response.send(httpForbidden({ ...user.hideSensitiveData(), businessProfileRef, isDocumentUploaded, hasAmenities, hasSubscription, accessToken, }, `Your subscription expired`));
                    }
                }
                if (!user.isApproved) {
                    return response.status(200).send(httpForbidden(null, "Your account is currently under review. We will notify you once it has been verified."))
                }
                const authenticateUser: AuthenticateUser = { id: user.id, accountType: user.accountType, businessProfileID: user.businessProfileID, role: user.role };
                const accessToken = await generateAccessToken(authenticateUser);
                const refreshToken = await generateRefreshToken(authenticateUser, deviceID);
                response.cookie(AppConfig.USER_AUTH_TOKEN_COOKIE_KEY, refreshToken, CookiePolicy);
                response.cookie(AppConfig.USER_AUTH_TOKEN_KEY, accessToken, CookiePolicy);
                return response.send(httpOk({ ...user.hideSensitiveData(), businessProfileRef, isDocumentUploaded, hasAmenities, hasSubscription, accessToken, refreshToken }, SuccessMessage.LOGIN_SUCCESS));
            } catch (error: any) {
                next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
            }



            // return response.send(httpOk({ 'data': payload }))
        }
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}

const signUp = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { email, name, accountType, dialCode, phoneNumber, password, businessName, businessEmail, businessPhoneNumber, businessDialCode, businessType, businessSubType, bio, businessWebsite, gstn, street, city, zipCode, country, lat, lng, state, placeID } = request.body;
        const [username, isUserExist] = await Promise.all([
            generateUsername(email, accountType),
            User.findOne({ email: email }),
        ]);
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
            newBusinessProfile.profilePic = { small: '', large: '', medium: '' };
            newBusinessProfile.username = username;
            newBusinessProfile.businessTypeID = isBusinessTypeExist.id;
            newBusinessProfile.businessSubTypeID = isBusinessSubTypeExist.id;
            newBusinessProfile.name = businessName;
            newBusinessProfile.bio = bio;
            const geoCoordinate: GeoCoordinate = { type: "Point", coordinates: [lng, lat] }
            newBusinessProfile.address = { city, state, street, zipCode, country, geoCoordinate, lat, lng };
            newBusinessProfile.email = businessEmail;
            newBusinessProfile.phoneNumber = businessPhoneNumber;
            newBusinessProfile.dialCode = businessDialCode;
            newBusinessProfile.website = businessWebsite;
            newBusinessProfile.gstn = gstn;
            newBusinessProfile.placeID = placeID;
            newBusinessProfile.privateAccount = false;
            const savedBusinessProfile = await newBusinessProfile.save();

            const newUser = new User();
            newUser.email = email;
            newUser.username = username;
            newUser.name = name;
            newUser.accountType = accountType;
            newUser.dialCode = dialCode;
            newUser.phoneNumber = phoneNumber;
            newUser.password = password;
            newUser.isActivated = true;
            newUser.isApproved = false;
            newUser.privateAccount = false;//Business profile is public profile
            newUser.businessProfileID = savedBusinessProfile.id;
            const otp = generateOTP();
            emailNotificationService.sendEmailOTP(otp, newUser.email, 'verify-email');
            newUser.otp = otp;
            const savedUser = await newUser.save();
            return response.send(httpOk(savedUser.hideSensitiveData(), SuccessMessage.REGISTRATION_SUCCESSFUL))
        }
        const newUser = new User();
        newUser.profilePic = { small: '', large: '', medium: '' };
        newUser.username = username;
        newUser.email = email;
        newUser.name = name;
        newUser.accountType = accountType;
        newUser.dialCode = dialCode;
        newUser.phoneNumber = phoneNumber;
        newUser.password = password;
        newUser.isActivated = true;
        const otp = generateOTP();
        emailNotificationService.sendEmailOTP(otp, newUser.email, 'verify-email');
        newUser.otp = otp;
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
        await addUserDevicesConfig(deviceID, devicePlatform, notificationToken, user.id, user.accountType);
        if (deviceID) {
            response.cookie(AppConfig.DEVICE_ID_COOKIE_KEY, deviceID, CookiePolicy);
        }
        //Check the account and send response based on their profile 
        if (savedUser.accountType === AccountType.BUSINESS) {
            const businessProfileRef = await BusinessProfile.findOne({ _id: user.businessProfileID });
            const authenticateUser: AuthenticateUser = { id: user.id, accountType: user.accountType, businessProfileID: user.businessProfileID, role: user.role };
            const accessToken = await generateAccessToken(authenticateUser, "15m");
            response.cookie(AppConfig.USER_AUTH_TOKEN_KEY, accessToken, CookiePolicy);
            return response.send(httpOk({ ...savedUser.hideSensitiveData(), businessProfileRef, accessToken }, SuccessMessage.OTP_VERIFIED));
        } else {
            const authenticateUser: AuthenticateUser = { id: user.id, accountType: user.accountType, businessProfileID: user.businessProfileID, role: user.role };
            const accessToken = await generateAccessToken(authenticateUser);
            const refreshToken = await generateRefreshToken(authenticateUser, deviceID);
            response.cookie(AppConfig.USER_AUTH_TOKEN_COOKIE_KEY, refreshToken, CookiePolicy);
            response.cookie(AppConfig.USER_AUTH_TOKEN_KEY, accessToken, CookiePolicy);
            return response.send(httpOk({ ...user.hideSensitiveData(), accessToken, refreshToken }, SuccessMessage.LOGIN_SUCCESS));
        }
    } catch (error: any) {
        return response.send(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}


const resendOTP = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { email, type } = request.body;
        const user = await User.findOne({ email: email }).select("+otp");
        if (!user) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        const otp = generateOTP();
        if (type === Types.FORGOT_PASSWORD) {
            emailNotificationService.sendEmailOTP(otp, user.email, 'forgot-password');
        }
        if (type === Types.EMAIL_VERIFICATION) {
            emailNotificationService.sendEmailOTP(otp, user.email, 'verify-email');
        }
        user.otp = otp;
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
        const deviceID = cookies[AppConfig.DEVICE_ID_COOKIE_KEY];
        if (deviceID !== undefined && deviceID !== "") {
            Object.assign(authTokenFindQuery, { deviceID: deviceID });
        }
        const authToken = await AuthToken.findOne(authTokenFindQuery);
        if (!authToken) {
            response.clearCookie(AppConfig.USER_AUTH_TOKEN_COOKIE_KEY, CookiePolicy);
            response.clearCookie(AppConfig.DEVICE_ID_COOKIE_KEY, CookiePolicy);
            response.clearCookie(AppConfig.USER_AUTH_TOKEN_KEY, CookiePolicy);
            return response.status(401).send(httpUnauthorized(ErrorMessage.invalidRequest(ErrorMessage.TOKEN_MISMATCH), ErrorMessage.TOKEN_MISMATCH));
        }
        if (authToken?.deviceID) {
            await DevicesConfig.deleteMany({ userID: authToken.userID, deviceID: authToken.deviceID });
        }
        await authToken.deleteOne();
        response.clearCookie(AppConfig.USER_AUTH_TOKEN_COOKIE_KEY, CookiePolicy);
        response.clearCookie(AppConfig.DEVICE_ID_COOKIE_KEY, CookiePolicy);
        response.clearCookie(AppConfig.USER_AUTH_TOKEN_KEY, CookiePolicy);
        return response.send(httpOk(null, SuccessMessage.LOGOUT_SUCCESS))
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}


const refreshToken = async (request: Request, response: Response, next: NextFunction) => {
    const cookies = request?.cookies;
    const refreshToken = cookies[AppConfig.USER_AUTH_TOKEN_COOKIE_KEY];
    const deviceID = cookies[AppConfig.DEVICE_ID_COOKIE_KEY];
    if (!refreshToken) {
        return response.status(401).send(httpUnauthorized(ErrorMessage.invalidRequest(ErrorMessage.TOKEN_REQUIRED), ErrorMessage.TOKEN_REQUIRED));
    }
    let authTokenFindQuery = { refreshToken: refreshToken }
    if (deviceID !== undefined && deviceID !== "") {
        Object.assign(authTokenFindQuery, { deviceID: deviceID });
    }
    const authToken = await AuthToken.findOne(authTokenFindQuery);
    if (!authToken) {
        return response.status(403).send(httpUnauthorized(ErrorMessage.invalidRequest(ErrorMessage.TOKEN_MISMATCH), ErrorMessage.TOKEN_MISMATCH));
    }
    try {
        const decoded = verify(authToken?.refreshToken, AppConfig.APP_REFRESH_TOKEN_SECRET);
        if (decoded) {
            const userData = await User.findOne({ _id: authToken.userID, })
            if (userData) {
                const userWithRole: AuthenticateUser = { id: userData.id, accountType: userData.accountType, businessProfileID: userData.businessProfileID, role: userData.role }
                const accessToken = await generateAccessToken(userWithRole);
                const refreshToken = await generateRefreshToken(userWithRole, deviceID);
                response.cookie(AppConfig.USER_AUTH_TOKEN_COOKIE_KEY, refreshToken, CookiePolicy);
                response.cookie(AppConfig.DEVICE_ID_COOKIE_KEY, deviceID, CookiePolicy);
                response.cookie(AppConfig.USER_AUTH_TOKEN_KEY, accessToken, CookiePolicy);
                return response.status(200).send(httpOk({ accessToken, refreshToken }, `Token Refreshed`));
            } else {
                return response.status(403).send(httpUnauthorized(null, ErrorMessage.INSUFFICIENT_TO_GRANT_ACCESS));
            }
        }
    } catch (error: any) {
        return response.status(403).send(httpUnauthorized(null, ErrorMessage.INVALID_OR_EXPIRED_TOKEN));
    }
}


export async function generateUsername(email: string, accountType: AccountType): Promise<string> {
    const username = generateFromEmail(email, 2);
    if (accountType === AccountType.BUSINESS) {
        const isAvailable = await BusinessProfile.findOne({ username: username });
        if (!isAvailable) {
            return username;
        } else {
            return await generateUsername(email, accountType);
        }
    } else {
        const isAvailable = await User.findOne({ username: username });
        if (!isAvailable) {
            return username;
        } else {
            return await generateUsername(email, accountType);
        }
    }
}


export default { login, resendOTP, verifyEmail, logout, refreshToken, signUp, socialLogin }