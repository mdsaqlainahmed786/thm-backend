import { Business, createBusinessProfile, createUserAccount, SocialAccount, } from './../../database/models/user.model';
import { Request, Response, NextFunction } from "express";
import { httpInternalServerError, httpNotFoundOr404, httpUnauthorized, httpOk, httpConflict, httpForbidden, httpBadRequest } from "../../utils/response";
import { ErrorMessage } from "../../utils/response-message/error";
import User, { AccountType } from "../../database/models/user.model";
import { SuccessMessage } from "../../utils/response-message/success";
import { generateOTP, getDefaultProfilePic } from "../../utils/helper/basic";
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
import Subscription, { hasBusinessSubscription } from '../../database/models/subscription.model';
import { generateFromEmail } from "unique-username-generator";
import EmailNotificationService from '../../services/EmailNotificationService';
import { Types } from '../../validation/rules/api-validation';
import SocialProviders from '../../services/SocialProviders';
import { v4 } from 'uuid';
import moment from "moment";
import { compare } from 'bcrypt';

const emailNotificationService = new EmailNotificationService();

const getAuthKeys = (request: Request, role?: string) => {
    const isAdminRoute = request.baseUrl.includes('/admin') || request.path.includes('/admin');
    const isAdmin = isAdminRoute || role === Role.ADMINISTRATOR;
    return {
        accessTokenKey: isAdmin ? AppConfig.ADMIN_AUTH_TOKEN_KEY : AppConfig.USER_AUTH_TOKEN_KEY,
        refreshTokenCookieKey: isAdmin ? AppConfig.ADMIN_AUTH_TOKEN_COOKIE_KEY : AppConfig.USER_AUTH_TOKEN_COOKIE_KEY
    };
};

const login = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { email, password, deviceID, notificationToken, devicePlatform, lat, lng, language } = request.body;
        const isAdminRoute = request.baseUrl.includes('/admin') || request.path.includes('/admin');
        
        // If admin route, select adminPassword field as well
        const userQuery = User.findOne({ email: email });
        if (isAdminRoute) {
            userQuery.select('+adminPassword');
        }
        const user = await userQuery;
        
        if (!user) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        
        // For admin login, check adminPassword if it exists, otherwise check regular password
        let isMatch = false;
        if (isAdminRoute && user.role === Role.ADMINISTRATOR && user.adminPassword) {
            // Compare with adminPassword
            isMatch = await compare(password, user.adminPassword);
        } else {
            // Use regular password comparison
            isMatch = await user.comparePassword(password);
        }
        
        if (!isMatch) {
            return response.status(200).send(httpForbidden(null, ErrorMessage.INVALID_OR_INCORRECT_PASSWORD));
        }
        if (lat && lng) {
            user.geoCoordinate = { type: "Point", coordinates: [lng, lat] };
        }
        if (language) {
            user.language = language;
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
        await Promise.all([
            addUserDevicesConfig(deviceID, devicePlatform, notificationToken, user.id, user.accountType),
            user.save()
        ]);
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
                    hasBusinessSubscription(user.businessProfileID)
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

            // Check if account is within 11-month grace period
            const accountAgeInMonths = moment().diff(moment(user.createdAt), 'months', true);
            const isWithinGracePeriod = accountAgeInMonths < 11;

            // Only enforce subscription checks if account is 11+ months old
            // For accounts within grace period, keep hasSubscription = true
            if (!isWithinGracePeriod) {
                if (!subscription) {
                    hasSubscription = false;
                } else {
                    const now = new Date();
                    if (subscription.expirationDate < now) {
                        hasSubscription = false;
                    }
                }
            }

            if (!isDocumentUploaded || !hasAmenities || (!isWithinGracePeriod && !hasSubscription)) {
                return response.send(httpOk({ ...user.hideSensitiveData(), businessProfileRef, isDocumentUploaded, hasAmenities, hasSubscription, accessToken, }, "Your profile is incomplete. Please take a moment to complete it."));
            }
            const now = new Date();
            if (!isWithinGracePeriod && subscription && subscription.expirationDate < now) {
                hasSubscription = false;
                return response.send(httpForbidden({ ...user.hideSensitiveData(), businessProfileRef, isDocumentUploaded, hasAmenities, hasSubscription, accessToken }, `Your subscription expired.`));
            }
        }
        if (!user.isApproved) {
            return response.status(200).send(httpForbidden({ isApproved: user.isApproved, email: user.email }, "Your account is currently under review. We will notify you once it has been verified."))
        }
        const authenticateUser: AuthenticateUser = { id: user.id, accountType: user.accountType, businessProfileID: user.businessProfileID, role: user.role };
        const accessToken = await generateAccessToken(authenticateUser);
        const refreshToken = await generateRefreshToken(authenticateUser, deviceID);
        const { accessTokenKey, refreshTokenCookieKey } = getAuthKeys(request, user.role);
        response.cookie(refreshTokenCookieKey, refreshToken, CookiePolicy);
        response.cookie(accessTokenKey, accessToken, CookiePolicy);
        return response.send(httpOk({ ...user.hideSensitiveData(), businessProfileRef, isDocumentUploaded, hasAmenities, hasSubscription, accessToken, refreshToken }, SuccessMessage.LOGIN_SUCCESS));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}

const socialLogin = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { socialType, token, dialCode, phoneNumber, deviceID, devicePlatform, notificationToken, name, lat, lng, language } = request.body;

        let isDocumentUploaded = true;
        let hasAmenities = true;
        let hasSubscription = true;
        let businessProfileRef = null;
        const accountType = AccountType.INDIVIDUAL;
        const password = v4();
        const isActivated = true;
        const isVerified = true;
        const hasProfilePicture = true;
        let geoCoordinate = { type: "Point", coordinates: [78.9629, 20.5937] };
        if (lat && lng) {
            geoCoordinate = { type: "Point", coordinates: [lng, lat] }
        }
        if (socialType === SocialAccount.GOOGLE) {
            try {
                const { email, name, sub, picture } = await SocialProviders.verifyGoogleToken(token);
                if (!email || !name) {
                    return response.send(httpBadRequest(null, 'Email cannot be null or empty.'))
                }
                const [username, user, isPhoneNumberExist] = await Promise.all([
                    generateUsername(email, AccountType.INDIVIDUAL),
                    User.findOne({ email: email }),
                    phoneNumber ? User.findOne({ phoneNumber: phoneNumber }) : null,
                ]);
                if (phoneNumber && isPhoneNumberExist) {
                    return response.send(httpConflict(ErrorMessage.invalidRequest(ErrorMessage.PHONE_NUMBER_IN_USE), ErrorMessage.PHONE_NUMBER_IN_USE));
                }
                if (!user) {
                    const profilePic = {
                        small: picture ?? getDefaultProfilePic(request, 'small'),
                        large: picture ?? getDefaultProfilePic(request, 'large'),
                        medium: picture ?? getDefaultProfilePic(request, 'medium')
                    }
                    const socialIDs = [{
                        socialUId: sub,
                        socialType: socialType
                    }]
                    const savedUser = await createUserAccount({
                        profilePic, username, email, name, accountType, dialCode, phoneNumber, password, isActivated, isVerified, hasProfilePicture, socialIDs, geoCoordinate, language
                    }, false);
                    const authenticateUser: AuthenticateUser = { id: savedUser.id, accountType: savedUser.accountType, businessProfileID: savedUser.businessProfileID, role: savedUser.role };
                    await addUserDevicesConfig(deviceID, devicePlatform, notificationToken, savedUser.id, savedUser.accountType);
                    const accessToken = await generateAccessToken(authenticateUser);
                    const refreshToken = await generateRefreshToken(authenticateUser, deviceID);
                    const { accessTokenKey, refreshTokenCookieKey } = getAuthKeys(request, savedUser.role);
                    response.cookie(refreshTokenCookieKey, refreshToken, CookiePolicy);
                    response.cookie(accessTokenKey, accessToken, CookiePolicy);
                    return response.send(httpOk({ ...savedUser.hideSensitiveData(), businessProfileRef, isDocumentUploaded, hasAmenities, hasSubscription, accessToken, refreshToken }, SuccessMessage.LOGIN_SUCCESS));

                }
                const isSocialIDExist = user && user.socialIDs.some((social) => social.socialType === socialType);
                //Update Social ID
                if (!isSocialIDExist) {
                    user.socialIDs.push({
                        socialUId: sub,
                        socialType: socialType
                    });
                }
                if (!user.isActivated) {
                    return response.status(200).send(httpForbidden(null, ErrorMessage.INACTIVE_ACCOUNT))
                }
                if (user.isDeleted) {
                    return response.status(200).send(httpForbidden(null, ErrorMessage.ACCOUNT_DISABLED))
                }
                user.geoCoordinate = geoCoordinate;
                if (language) {
                    user.language = language;
                }
                await Promise.all([
                    addUserDevicesConfig(deviceID, devicePlatform, notificationToken, user.id, user.accountType),
                    user.save()
                ]);
                if (deviceID) {
                    response.cookie(AppConfig.DEVICE_ID_COOKIE_KEY, deviceID, CookiePolicy);
                }

                if (user.accountType === AccountType.BUSINESS && user.businessProfileID) {
                    const [businessDocument, businessProfile, subscription] = await Promise.all(
                        [
                            BusinessDocument.find({ businessProfileID: user.businessProfileID }),
                            BusinessProfile.findOne({ _id: user.businessProfileID }),
                            hasBusinessSubscription(user.businessProfileID)
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

                    // Check if account is within 11-month grace period
                    const accountAgeInMonths = moment().diff(moment(user.createdAt), 'months', true);
                    const isWithinGracePeriod = accountAgeInMonths < 11;

                    // Only enforce subscription checks if account is 11+ months old
                    // For accounts within grace period, keep hasSubscription = true
                    if (!isWithinGracePeriod) {
                        if (!subscription) {
                            hasSubscription = false;
                        } else {
                            const now = new Date();
                            if (subscription.expirationDate < now) {
                                hasSubscription = false;
                            }
                        }
                    }

                    if (!isDocumentUploaded || !hasAmenities || (!isWithinGracePeriod && !hasSubscription)) {
                        return response.send(httpOk({ ...user.hideSensitiveData(), businessProfileRef, isDocumentUploaded, hasAmenities, hasSubscription, accessToken, }, "Your profile is incomplete. Please take a moment to complete it."));
                    }
                    const now = new Date();
                    if (!isWithinGracePeriod && subscription && subscription.expirationDate < now) {
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
                const { accessTokenKey, refreshTokenCookieKey } = getAuthKeys(request, user.role);
                response.cookie(refreshTokenCookieKey, refreshToken, CookiePolicy);
                response.cookie(accessTokenKey, accessToken, CookiePolicy);
                return response.send(httpOk({ ...user.hideSensitiveData(), businessProfileRef, isDocumentUploaded, hasAmenities, hasSubscription, accessToken, refreshToken }, SuccessMessage.LOGIN_SUCCESS));
            } catch (error: any) {
                // Handle MongoDB duplicate key error for phoneNumber
                if (error.code === 11000 && error.keyPattern && error.keyPattern.phoneNumber) {
                    return response.send(httpConflict(ErrorMessage.invalidRequest(ErrorMessage.PHONE_NUMBER_IN_USE), ErrorMessage.PHONE_NUMBER_IN_USE));
                }
                next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
            }
        }
        if (socialType === SocialAccount.APPLE) {
            try {
                const { sub, email } = await SocialProviders.verifyAppleToken(token);
                if (!email) {
                    return response.send(httpBadRequest(null, 'Email cannot be null or empty.'))
                }
                const [username, user, isPhoneNumberExist] = await Promise.all([
                    generateUsername(email, AccountType.INDIVIDUAL),
                    User.findOne({ email: email }),
                    phoneNumber ? User.findOne({ phoneNumber: phoneNumber }) : null,
                ]);
                if (phoneNumber && isPhoneNumberExist) {
                    return response.send(httpConflict(ErrorMessage.invalidRequest(ErrorMessage.PHONE_NUMBER_IN_USE), ErrorMessage.PHONE_NUMBER_IN_USE));
                }
                if (!user) {
                    const profilePic = {
                        small: getDefaultProfilePic(request, 'small'),
                        large: getDefaultProfilePic(request, 'large'),
                        medium: getDefaultProfilePic(request, 'medium')
                    }
                    const socialIDs = [{
                        socialUId: sub,
                        socialType: socialType
                    }]
                    const savedUser = await createUserAccount({
                        profilePic, username, email, name: name ?? username, accountType, dialCode, phoneNumber, password, isActivated, isVerified, hasProfilePicture, socialIDs, geoCoordinate, language
                    }, false);
                    const authenticateUser: AuthenticateUser = { id: savedUser.id, accountType: savedUser.accountType, businessProfileID: savedUser.businessProfileID, role: savedUser.role };
                    await addUserDevicesConfig(deviceID, devicePlatform, notificationToken, savedUser.id, savedUser.accountType);
                    const accessToken = await generateAccessToken(authenticateUser);
                    const refreshToken = await generateRefreshToken(authenticateUser, deviceID);
                    const { accessTokenKey, refreshTokenCookieKey } = getAuthKeys(request, savedUser.role);
                    response.cookie(refreshTokenCookieKey, refreshToken, CookiePolicy);
                    response.cookie(accessTokenKey, accessToken, CookiePolicy);
                    return response.send(httpOk({ ...savedUser.hideSensitiveData(), businessProfileRef, isDocumentUploaded, hasAmenities, hasSubscription, accessToken, refreshToken }, SuccessMessage.LOGIN_SUCCESS));
                }
                const isSocialIDExist = user && user.socialIDs.some((social) => social.socialType === socialType);
                //Update Social ID
                if (!isSocialIDExist) {
                    user.socialIDs.push({
                        socialUId: sub,
                        socialType: socialType
                    })
                }
                if (!user.isActivated) {
                    return response.status(200).send(httpForbidden(null, ErrorMessage.INACTIVE_ACCOUNT))
                }
                if (user.isDeleted) {
                    return response.status(200).send(httpForbidden(null, ErrorMessage.ACCOUNT_DISABLED))
                }
                if (language) {
                    user.language = language;
                }
                user.geoCoordinate = geoCoordinate;
                await Promise.all([
                    addUserDevicesConfig(deviceID, devicePlatform, notificationToken, user.id, user.accountType),
                    user.save()
                ])
                if (deviceID) {
                    response.cookie(AppConfig.DEVICE_ID_COOKIE_KEY, deviceID, CookiePolicy);
                }
                if (user.accountType === AccountType.BUSINESS && user.businessProfileID) {
                    const [businessDocument, businessProfile, subscription] = await Promise.all(
                        [
                            BusinessDocument.find({ businessProfileID: user.businessProfileID }),
                            BusinessProfile.findOne({ _id: user.businessProfileID }),
                            hasBusinessSubscription(user.businessProfileID)
                        ]
                    )
                    businessProfileRef = businessProfile;
                    const authenticateUser: AuthenticateUser = { id: user.id, accountType: user.accountType, businessProfileID: user.businessProfileID, role: user.role };
                    const accessToken = await generateAccessToken(authenticateUser, "15m");
                    const { accessTokenKey } = getAuthKeys(request, user.role);
                    response.cookie(accessTokenKey, accessToken, CookiePolicy);
                    if (!businessDocument || businessDocument.length === 0) {
                        isDocumentUploaded = false;
                    }
                    if (!businessProfileRef || !businessProfileRef.amenities || businessProfileRef.amenities.length === 0) {
                        hasAmenities = false;
                    }

                    // Check if account is within 11-month grace period
                    const accountAgeInMonths = moment().diff(moment(user.createdAt), 'months', true);
                    const isWithinGracePeriod = accountAgeInMonths < 11;

                    // Only enforce subscription checks if account is 11+ months old
                    // For accounts within grace period, keep hasSubscription = true
                    if (!isWithinGracePeriod) {
                        if (!subscription) {
                            hasSubscription = false;
                        } else {
                            const now = new Date();
                            if (subscription.expirationDate < now) {
                                hasSubscription = false;
                            }
                        }
                    }

                    if (!isDocumentUploaded || !hasAmenities || (!isWithinGracePeriod && !hasSubscription)) {
                        return response.send(httpOk({ ...user.hideSensitiveData(), businessProfileRef, isDocumentUploaded, hasAmenities, hasSubscription, accessToken, }, "Your profile is incomplete. Please take a moment to complete it."));
                    }
                    const now = new Date();
                    if (!isWithinGracePeriod && subscription && subscription.expirationDate < now) {
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
                const { accessTokenKey, refreshTokenCookieKey } = getAuthKeys(request, user.role);
                response.cookie(refreshTokenCookieKey, refreshToken, CookiePolicy);
                response.cookie(accessTokenKey, accessToken, CookiePolicy);
                return response.send(httpOk({ ...user.hideSensitiveData(), businessProfileRef, isDocumentUploaded, hasAmenities, hasSubscription, accessToken, refreshToken }, SuccessMessage.LOGIN_SUCCESS));
            } catch (error: any) {
                // Handle MongoDB duplicate key error for phoneNumber
                if (error.code === 11000 && error.keyPattern && error.keyPattern.phoneNumber) {
                    return response.send(httpConflict(ErrorMessage.invalidRequest(ErrorMessage.PHONE_NUMBER_IN_USE), ErrorMessage.PHONE_NUMBER_IN_USE));
                }
                next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
            }
            // return response.send(httpOk({ 'data': payload }))
        }
    } catch (error: any) {
        // Handle MongoDB duplicate key error for phoneNumber
        if (error.code === 11000 && error.keyPattern && error.keyPattern.phoneNumber) {
            return response.send(httpConflict(ErrorMessage.invalidRequest(ErrorMessage.PHONE_NUMBER_IN_USE), ErrorMessage.PHONE_NUMBER_IN_USE));
        }
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}

const signUp = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { email, name, accountType, dialCode, phoneNumber, password, businessName, businessEmail, businessPhoneNumber, businessDialCode, businessType, businessSubType, bio, businessWebsite, gstn, street, city, zipCode, country, lat, lng, state, placeID, profession, language } = request.body;
        const [username, isUserExist, isPhoneNumberExist] = await Promise.all([
            generateUsername(email, accountType),
            User.findOne({ email: email }),
            phoneNumber ? User.findOne({ phoneNumber: phoneNumber }) : null,
        ]);
        if (isUserExist) {
            return response.send(httpConflict(ErrorMessage.invalidRequest(ErrorMessage.EMAIL_IN_USE), ErrorMessage.EMAIL_IN_USE));
        }
        if (isPhoneNumberExist) {
            return response.send(httpConflict(ErrorMessage.invalidRequest(ErrorMessage.PHONE_NUMBER_IN_USE), ErrorMessage.PHONE_NUMBER_IN_USE));
        }
        let geoCoordinate = { type: "Point", coordinates: [78.9629, 20.5937] };
        if (lat && lng) {
            geoCoordinate = { type: "Point", coordinates: [lng, lat] }
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
            const isActivated = true;
            const isApproved = false;
            const privateAccount = false;
            const profilePic = {
                small: getDefaultProfilePic(request, 'small'),
                large: getDefaultProfilePic(request, 'large'),
                medium: getDefaultProfilePic(request, 'medium')
            }
            const businessTypeID = isBusinessTypeExist.id;
            const businessSubTypeID = isBusinessSubTypeExist.id

            const address = { city, state, street, zipCode, country, geoCoordinate, lat, lng };
            const username = await generateUsername(businessEmail, AccountType.BUSINESS);
            const savedBusinessProfile = await createBusinessProfile({
                profilePic, username, businessTypeID, businessSubTypeID, bio, address, gstn, placeID, privateAccount,
                name: businessName,
                email: businessEmail,
                phoneNumber: businessPhoneNumber,
                dialCode: businessDialCode,
                website: businessWebsite
            });
            const businessProfileID = savedBusinessProfile._id;
            const savedUser = await createUserAccount({
                email, username, name, accountType, dialCode, phoneNumber, password, isActivated, isApproved, privateAccount, businessProfileID, language
            }, true);
            return response.send(httpOk(savedUser.hideSensitiveData(), SuccessMessage.REGISTRATION_SUCCESSFUL))
        }
        const profilePic = {
            small: getDefaultProfilePic(request, 'small'),
            large: getDefaultProfilePic(request, 'large'),
            medium: getDefaultProfilePic(request, 'medium')
        }
        const isActivated = true;
        const savedUser = await createUserAccount({
            profilePic, profession, username, email, name, accountType, dialCode, phoneNumber, password, isActivated, geoCoordinate, language
        }, true);
        return response.send(httpOk(savedUser.hideSensitiveData(), SuccessMessage.REGISTRATION_SUCCESSFUL));
    } catch (error: any) {
        // Handle MongoDB duplicate key error for phoneNumber
        if (error.code === 11000 && error.keyPattern && error.keyPattern.phoneNumber) {
            return response.send(httpConflict(ErrorMessage.invalidRequest(ErrorMessage.PHONE_NUMBER_IN_USE), ErrorMessage.PHONE_NUMBER_IN_USE));
        }
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
            const { accessTokenKey } = getAuthKeys(request, user.role);
            response.cookie(accessTokenKey, accessToken, CookiePolicy);
            return response.send(httpOk({ ...savedUser.hideSensitiveData(), businessProfileRef, accessToken }, SuccessMessage.OTP_VERIFIED));
        } else {
            const authenticateUser: AuthenticateUser = { id: user.id, accountType: user.accountType, businessProfileID: user.businessProfileID, role: user.role };
            const accessToken = await generateAccessToken(authenticateUser);
            const refreshToken = await generateRefreshToken(authenticateUser, deviceID);
            const { accessTokenKey, refreshTokenCookieKey } = getAuthKeys(request, user.role);
            response.cookie(refreshTokenCookieKey, refreshToken, CookiePolicy);
            response.cookie(accessTokenKey, accessToken, CookiePolicy);
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


const verifyOtpLogin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {
            phoneNumber,
            dialCode,
            deviceID,
            devicePlatform,
            notificationToken,
            lat,
            lng,
            language
        } = req.body;

        // 1️⃣ Find user by phone number and dial code
        const user = await User.findOne({ phoneNumber, dialCode });
        if (!user) {
            return res.status(404).json({
                status: false,
                statusCode: 404,
                message: "User not found",
                data: null
            });
        }

        // 2️⃣ Basic account validations
        if (!user.isVerified) {
            return res.status(403).json({
                status: false,
                statusCode: 403,
                message: "Account not verified",
                data: null
            });
        }

        if (!user.isActivated) {
            return res.status(403).json({
                status: false,
                statusCode: 403,
                message: "Account not activated",
                data: null
            });
        }

        if (user.isDeleted) {
            return res.status(403).json({
                status: false,
                statusCode: 403,
                message: "Account disabled",
                data: null
            });
        }

        // 3️⃣ Update optional fields (geo + language)
        if (lat && lng) {
            user.geoCoordinate = { type: "Point", coordinates: [lng, lat] };
        }

        if (language) {
            user.language = language;
        }

        await user.save();

        // 4️⃣ Handle business accounts
        let isDocumentUploaded = true;
        let hasAmenities = true;
        let hasSubscription = true;
        let businessProfileRef = null;

        if (user.accountType === AccountType.BUSINESS && user.businessProfileID) {
            const [businessDocument, businessProfile, subscription] = await Promise.all([
                BusinessDocument.find({ businessProfileID: user.businessProfileID }),
                BusinessProfile.findOne({ _id: user.businessProfileID }),
                hasBusinessSubscription(user.businessProfileID)
            ]);

            businessProfileRef = businessProfile;

            if (!businessDocument || businessDocument.length === 0) isDocumentUploaded = false;
            if (!businessProfileRef?.amenities?.length) hasAmenities = false;
            // COMMENTED OUT: Subscription check bypassed for testing
            // if (!subscription) hasSubscription = false;

            // COMMENTED OUT: Subscription check bypassed for testing
            // const now = new Date();
            // if (subscription && subscription.expirationDate < now) {
            //     hasSubscription = false;
            //     return res.status(403).json({
            //         status: false,
            //         statusCode: 403,
            //         message: "Your subscription expired",
            //         data: null
            //     });
            // }
        }

        if (!user.isApproved) {
            return res.status(403).json({
                status: false,
                statusCode: 403,
                message: "Your account is under review",
                data: null
            });
        }

        // 5️⃣ Add device info
        await addUserDevicesConfig(deviceID, devicePlatform, notificationToken, user.id, user.accountType);

        if (deviceID) {
            res.cookie(AppConfig.DEVICE_ID_COOKIE_KEY, deviceID, CookiePolicy);
        }

        // 6️⃣ Generate tokens
        const authenticateUser = {
            id: user.id,
            accountType: user.accountType,
            businessProfileID: user.businessProfileID,
            role: user.role
        };

        const accessToken = await generateAccessToken(authenticateUser);
        const refreshToken = await generateRefreshToken(authenticateUser, deviceID);

        const { accessTokenKey, refreshTokenCookieKey } = getAuthKeys(req, user.role);
        res.cookie(refreshTokenCookieKey, refreshToken, CookiePolicy);
        res.cookie(accessTokenKey, accessToken, CookiePolicy);

        // 7️⃣ Final success response — EXACT format requested
        return res.status(200).json({
            status: true,
            statusCode: 200,
            message: "Logged-in successfully",
            data: {
                ...user.hideSensitiveData(),
                businessProfileRef,
                isDocumentUploaded,
                hasAmenities,
                hasSubscription,
                accessToken,
                refreshToken
            }
        });
    } catch (error: any) {
        console.error("Error in verifyOtpLogin:", error);
        next(error);
    }
};




const logout = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const cookies = request?.cookies;
        const refreshToken = cookies[AppConfig.USER_AUTH_TOKEN_COOKIE_KEY] || cookies[AppConfig.ADMIN_AUTH_TOKEN_COOKIE_KEY];
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
        const { accessTokenKey, refreshTokenCookieKey } = getAuthKeys(request, request.user?.role);
        response.clearCookie(refreshTokenCookieKey, CookiePolicy);
        response.clearCookie(AppConfig.DEVICE_ID_COOKIE_KEY, CookiePolicy);
        response.clearCookie(accessTokenKey, CookiePolicy);
        return response.send(httpOk(null, SuccessMessage.LOGOUT_SUCCESS))
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}


const refreshToken = async (request: Request, response: Response, next: NextFunction) => {
    const cookies = request?.cookies;
    const refreshToken = cookies[AppConfig.USER_AUTH_TOKEN_COOKIE_KEY] || cookies[AppConfig.ADMIN_AUTH_TOKEN_COOKIE_KEY];
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
                const { accessTokenKey, refreshTokenCookieKey } = getAuthKeys(request, userData.role);
                response.cookie(refreshTokenCookieKey, refreshToken, CookiePolicy);
                response.cookie(AppConfig.DEVICE_ID_COOKIE_KEY, deviceID, CookiePolicy);
                response.cookie(accessTokenKey, accessToken, CookiePolicy);
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


export default { login, resendOTP, verifyEmail, logout, refreshToken, signUp, socialLogin, verifyOtpLogin }