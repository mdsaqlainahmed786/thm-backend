"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.generateUsername = void 0;
const user_model_1 = require("./../../database/models/user.model");
const response_1 = require("../../utils/response");
const error_1 = require("../../utils/response-message/error");
const user_model_2 = __importStar(require("../../database/models/user.model"));
const success_1 = require("../../utils/response-message/success");
const basic_1 = require("../../utils/helper/basic");
const constants_1 = require("../../config/constants");
const common_1 = require("../../common");
const authenticate_1 = require("../../middleware/authenticate");
const constants_2 = require("../../config/constants");
const authToken_model_1 = __importDefault(require("../../database/models/authToken.model"));
const appDeviceConfig_model_1 = __importStar(require("../../database/models/appDeviceConfig.model"));
const jsonwebtoken_1 = require("jsonwebtoken");
const businessType_model_1 = __importDefault(require("../../database/models/businessType.model"));
const businessSubType_model_1 = __importDefault(require("../../database/models/businessSubType.model"));
const businessProfile_model_1 = __importDefault(require("../../database/models/businessProfile.model"));
const businessDocument_model_1 = __importDefault(require("../../database/models/businessDocument.model"));
const subscription_model_1 = require("../../database/models/subscription.model");
const unique_username_generator_1 = require("unique-username-generator");
const EmailNotificationService_1 = __importDefault(require("../../services/EmailNotificationService"));
const api_validation_1 = require("../../validation/rules/api-validation");
const SocialProviders_1 = __importDefault(require("../../services/SocialProviders"));
const uuid_1 = require("uuid");
const moment_1 = __importDefault(require("moment"));
const bcrypt_1 = require("bcrypt");
const emailNotificationService = new EmailNotificationService_1.default();
const getAuthKeys = (request, role) => {
    const isAdminRoute = request.baseUrl.includes('/admin') || request.path.includes('/admin');
    const isAdmin = isAdminRoute || role === common_1.Role.ADMINISTRATOR;
    return {
        accessTokenKey: isAdmin ? constants_1.AppConfig.ADMIN_AUTH_TOKEN_KEY : constants_1.AppConfig.USER_AUTH_TOKEN_KEY,
        refreshTokenCookieKey: isAdmin ? constants_1.AppConfig.ADMIN_AUTH_TOKEN_COOKIE_KEY : constants_1.AppConfig.USER_AUTH_TOKEN_COOKIE_KEY
    };
};
const login = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { email, password, deviceID, notificationToken, devicePlatform, lat, lng, language } = request.body;
        const isAdminRoute = request.baseUrl.includes('/admin') || request.path.includes('/admin');
        // If admin route, select adminPassword field as well
        const userQuery = user_model_2.default.findOne({ email: email });
        if (isAdminRoute) {
            userQuery.select('+adminPassword');
        }
        const user = yield userQuery;
        if (!user) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        // For admin login, check adminPassword if it exists, otherwise check regular password
        let isMatch = false;
        if (isAdminRoute && user.role === common_1.Role.ADMINISTRATOR && user.adminPassword) {
            // Compare with adminPassword
            isMatch = yield (0, bcrypt_1.compare)(password, user.adminPassword);
        }
        else {
            // Use regular password comparison
            isMatch = yield user.comparePassword(password);
        }
        if (!isMatch) {
            return response.status(200).send((0, response_1.httpForbidden)(null, error_1.ErrorMessage.INVALID_OR_INCORRECT_PASSWORD));
        }
        if (lat && lng) {
            user.geoCoordinate = { type: "Point", coordinates: [lng, lat] };
        }
        if (language) {
            user.language = language;
        }
        if (!user.isVerified) {
            const otp = (0, basic_1.generateOTP)();
            emailNotificationService.sendEmailOTP(otp, user.email, 'verify-email');
            user.otp = otp;
            yield user.save();
            return response.status(200).send((0, response_1.httpForbidden)(Object.assign({}, user.hideSensitiveData()), error_1.ErrorMessage.UNVERIFIED_ACCOUNT));
        }
        if (!user.isActivated) {
            return response.status(200).send((0, response_1.httpForbidden)(null, error_1.ErrorMessage.INACTIVE_ACCOUNT));
        }
        if (user.isDeleted) {
            return response.status(200).send((0, response_1.httpForbidden)(null, error_1.ErrorMessage.ACCOUNT_DISABLED));
        }
        //If this is called from admin endpoint
        if (['/api/v1/admin/auth'].includes(request.baseUrl) && user.role !== common_1.Role.ADMINISTRATOR) {
            return response.status(403).send((0, response_1.httpForbidden)(error_1.ErrorMessage.subscriptionExpired(error_1.ErrorMessage.UNAUTHORIZED_ACCESS_ERROR), error_1.ErrorMessage.UNAUTHORIZED_ACCESS_ERROR));
        }
        yield Promise.all([
            (0, appDeviceConfig_model_1.addUserDevicesConfig)(deviceID, devicePlatform, notificationToken, user.id, user.accountType),
            user.save()
        ]);
        if (deviceID) {
            response.cookie(constants_1.AppConfig.DEVICE_ID_COOKIE_KEY, deviceID, constants_2.CookiePolicy);
        }
        let isDocumentUploaded = true;
        let hasAmenities = true;
        let hasSubscription = true;
        let businessProfileRef = null;
        if (user.accountType === user_model_2.AccountType.BUSINESS && user.businessProfileID) {
            const [businessDocument, businessProfile, subscription] = yield Promise.all([
                businessDocument_model_1.default.find({ businessProfileID: user.businessProfileID }),
                businessProfile_model_1.default.findOne({ _id: user.businessProfileID }),
                (0, subscription_model_1.hasBusinessSubscription)(user.businessProfileID)
            ]);
            businessProfileRef = businessProfile;
            const authenticateUser = { id: user.id, accountType: user.accountType, businessProfileID: user.businessProfileID, role: user.role };
            const accessToken = yield (0, authenticate_1.generateAccessToken)(authenticateUser, "15m");
            response.cookie(constants_1.AppConfig.USER_AUTH_TOKEN_KEY, accessToken, constants_2.CookiePolicy);
            if (!businessDocument || businessDocument.length === 0) {
                isDocumentUploaded = false;
            }
            if (!businessProfileRef || !businessProfileRef.amenities || businessProfileRef.amenities.length === 0) {
                hasAmenities = false;
            }
            // Check if account is within 11-month grace period
            const accountAgeInMonths = (0, moment_1.default)().diff((0, moment_1.default)(user.createdAt), 'months', true);
            const isWithinGracePeriod = accountAgeInMonths < 11;
            // Only enforce subscription checks if account is 11+ months old
            // For accounts within grace period, keep hasSubscription = true
            if (!isWithinGracePeriod) {
                if (!subscription) {
                    hasSubscription = false;
                }
                else {
                    const now = new Date();
                    if (subscription.expirationDate < now) {
                        hasSubscription = false;
                    }
                }
            }
            if (!isDocumentUploaded || !hasAmenities || (!isWithinGracePeriod && !hasSubscription)) {
                return response.send((0, response_1.httpOk)(Object.assign(Object.assign({}, user.hideSensitiveData()), { businessProfileRef, isDocumentUploaded, hasAmenities, hasSubscription, accessToken }), "Your profile is incomplete. Please take a moment to complete it."));
            }
            const now = new Date();
            if (!isWithinGracePeriod && subscription && subscription.expirationDate < now) {
                hasSubscription = false;
                return response.send((0, response_1.httpForbidden)(Object.assign(Object.assign({}, user.hideSensitiveData()), { businessProfileRef, isDocumentUploaded, hasAmenities, hasSubscription, accessToken }), `Your subscription expired.`));
            }
        }
        if (!user.isApproved) {
            return response.status(200).send((0, response_1.httpForbidden)({ isApproved: user.isApproved, email: user.email }, "Your account is currently under review. We will notify you once it has been verified."));
        }
        const authenticateUser = { id: user.id, accountType: user.accountType, businessProfileID: user.businessProfileID, role: user.role };
        const accessToken = yield (0, authenticate_1.generateAccessToken)(authenticateUser);
        const refreshToken = yield (0, authenticate_1.generateRefreshToken)(authenticateUser, deviceID);
        const { accessTokenKey, refreshTokenCookieKey } = getAuthKeys(request, user.role);
        response.cookie(refreshTokenCookieKey, refreshToken, constants_2.CookiePolicy);
        response.cookie(accessTokenKey, accessToken, constants_2.CookiePolicy);
        return response.send((0, response_1.httpOk)(Object.assign(Object.assign({}, user.hideSensitiveData()), { businessProfileRef, isDocumentUploaded, hasAmenities, hasSubscription, accessToken, refreshToken }), success_1.SuccessMessage.LOGIN_SUCCESS));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_a = error.message) !== null && _a !== void 0 ? _a : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const socialLogin = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _b, _c, _d;
    try {
        const { socialType, token, dialCode, phoneNumber, deviceID, devicePlatform, notificationToken, name, lat, lng, language } = request.body;
        let isDocumentUploaded = true;
        let hasAmenities = true;
        let hasSubscription = true;
        let businessProfileRef = null;
        const accountType = user_model_2.AccountType.INDIVIDUAL;
        const password = (0, uuid_1.v4)();
        const isActivated = true;
        const isVerified = true;
        const hasProfilePicture = true;
        let geoCoordinate = { type: "Point", coordinates: [78.9629, 20.5937] };
        if (lat && lng) {
            geoCoordinate = { type: "Point", coordinates: [lng, lat] };
        }
        if (socialType === user_model_1.SocialAccount.GOOGLE) {
            try {
                const { email, name, sub, picture } = yield SocialProviders_1.default.verifyGoogleToken(token);
                if (!email || !name) {
                    return response.send((0, response_1.httpBadRequest)(null, 'Email cannot be null or empty.'));
                }
                const [username, user, isPhoneNumberExist] = yield Promise.all([
                    generateUsername(email, user_model_2.AccountType.INDIVIDUAL),
                    user_model_2.default.findOne({ email: email }),
                    phoneNumber ? user_model_2.default.findOne({ phoneNumber: phoneNumber }) : null,
                ]);
                if (phoneNumber && isPhoneNumberExist) {
                    return response.send((0, response_1.httpConflict)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.PHONE_NUMBER_IN_USE), error_1.ErrorMessage.PHONE_NUMBER_IN_USE));
                }
                if (!user) {
                    const profilePic = {
                        small: picture !== null && picture !== void 0 ? picture : (0, basic_1.getDefaultProfilePic)(request, 'small'),
                        large: picture !== null && picture !== void 0 ? picture : (0, basic_1.getDefaultProfilePic)(request, 'large'),
                        medium: picture !== null && picture !== void 0 ? picture : (0, basic_1.getDefaultProfilePic)(request, 'medium')
                    };
                    const socialIDs = [{
                            socialUId: sub,
                            socialType: socialType
                        }];
                    const savedUser = yield (0, user_model_1.createUserAccount)({
                        profilePic, username, email, name, accountType, dialCode, phoneNumber, password, isActivated, isVerified, hasProfilePicture, socialIDs, geoCoordinate, language
                    }, false);
                    const authenticateUser = { id: savedUser.id, accountType: savedUser.accountType, businessProfileID: savedUser.businessProfileID, role: savedUser.role };
                    yield (0, appDeviceConfig_model_1.addUserDevicesConfig)(deviceID, devicePlatform, notificationToken, savedUser.id, savedUser.accountType);
                    const accessToken = yield (0, authenticate_1.generateAccessToken)(authenticateUser);
                    const refreshToken = yield (0, authenticate_1.generateRefreshToken)(authenticateUser, deviceID);
                    const { accessTokenKey, refreshTokenCookieKey } = getAuthKeys(request, savedUser.role);
                    response.cookie(refreshTokenCookieKey, refreshToken, constants_2.CookiePolicy);
                    response.cookie(accessTokenKey, accessToken, constants_2.CookiePolicy);
                    return response.send((0, response_1.httpOk)(Object.assign(Object.assign({}, savedUser.hideSensitiveData()), { businessProfileRef, isDocumentUploaded, hasAmenities, hasSubscription, accessToken, refreshToken }), success_1.SuccessMessage.LOGIN_SUCCESS));
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
                    return response.status(200).send((0, response_1.httpForbidden)(null, error_1.ErrorMessage.INACTIVE_ACCOUNT));
                }
                if (user.isDeleted) {
                    return response.status(200).send((0, response_1.httpForbidden)(null, error_1.ErrorMessage.ACCOUNT_DISABLED));
                }
                user.geoCoordinate = geoCoordinate;
                if (language) {
                    user.language = language;
                }
                yield Promise.all([
                    (0, appDeviceConfig_model_1.addUserDevicesConfig)(deviceID, devicePlatform, notificationToken, user.id, user.accountType),
                    user.save()
                ]);
                if (deviceID) {
                    response.cookie(constants_1.AppConfig.DEVICE_ID_COOKIE_KEY, deviceID, constants_2.CookiePolicy);
                }
                if (user.accountType === user_model_2.AccountType.BUSINESS && user.businessProfileID) {
                    const [businessDocument, businessProfile, subscription] = yield Promise.all([
                        businessDocument_model_1.default.find({ businessProfileID: user.businessProfileID }),
                        businessProfile_model_1.default.findOne({ _id: user.businessProfileID }),
                        (0, subscription_model_1.hasBusinessSubscription)(user.businessProfileID)
                    ]);
                    businessProfileRef = businessProfile;
                    const authenticateUser = { id: user.id, accountType: user.accountType, businessProfileID: user.businessProfileID, role: user.role };
                    const accessToken = yield (0, authenticate_1.generateAccessToken)(authenticateUser, "15m");
                    response.cookie(constants_1.AppConfig.USER_AUTH_TOKEN_KEY, accessToken, constants_2.CookiePolicy);
                    if (!businessDocument || businessDocument.length === 0) {
                        isDocumentUploaded = false;
                    }
                    if (!businessProfileRef || !businessProfileRef.amenities || businessProfileRef.amenities.length === 0) {
                        hasAmenities = false;
                    }
                    // Check if account is within 11-month grace period
                    const accountAgeInMonths = (0, moment_1.default)().diff((0, moment_1.default)(user.createdAt), 'months', true);
                    const isWithinGracePeriod = accountAgeInMonths < 11;
                    // Only enforce subscription checks if account is 11+ months old
                    // For accounts within grace period, keep hasSubscription = true
                    if (!isWithinGracePeriod) {
                        if (!subscription) {
                            hasSubscription = false;
                        }
                        else {
                            const now = new Date();
                            if (subscription.expirationDate < now) {
                                hasSubscription = false;
                            }
                        }
                    }
                    if (!isDocumentUploaded || !hasAmenities || (!isWithinGracePeriod && !hasSubscription)) {
                        return response.send((0, response_1.httpOk)(Object.assign(Object.assign({}, user.hideSensitiveData()), { businessProfileRef, isDocumentUploaded, hasAmenities, hasSubscription, accessToken }), "Your profile is incomplete. Please take a moment to complete it."));
                    }
                    const now = new Date();
                    if (!isWithinGracePeriod && subscription && subscription.expirationDate < now) {
                        hasSubscription = false;
                        return response.send((0, response_1.httpForbidden)(Object.assign(Object.assign({}, user.hideSensitiveData()), { businessProfileRef, isDocumentUploaded, hasAmenities, hasSubscription, accessToken }), `Your subscription expired`));
                    }
                }
                if (!user.isApproved) {
                    return response.status(200).send((0, response_1.httpForbidden)(null, "Your account is currently under review. We will notify you once it has been verified."));
                }
                const authenticateUser = { id: user.id, accountType: user.accountType, businessProfileID: user.businessProfileID, role: user.role };
                const accessToken = yield (0, authenticate_1.generateAccessToken)(authenticateUser);
                const refreshToken = yield (0, authenticate_1.generateRefreshToken)(authenticateUser, deviceID);
                const { accessTokenKey, refreshTokenCookieKey } = getAuthKeys(request, user.role);
                response.cookie(refreshTokenCookieKey, refreshToken, constants_2.CookiePolicy);
                response.cookie(accessTokenKey, accessToken, constants_2.CookiePolicy);
                return response.send((0, response_1.httpOk)(Object.assign(Object.assign({}, user.hideSensitiveData()), { businessProfileRef, isDocumentUploaded, hasAmenities, hasSubscription, accessToken, refreshToken }), success_1.SuccessMessage.LOGIN_SUCCESS));
            }
            catch (error) {
                // Handle MongoDB duplicate key error for phoneNumber
                if (error.code === 11000 && error.keyPattern && error.keyPattern.phoneNumber) {
                    return response.send((0, response_1.httpConflict)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.PHONE_NUMBER_IN_USE), error_1.ErrorMessage.PHONE_NUMBER_IN_USE));
                }
                next((0, response_1.httpInternalServerError)(error, (_b = error.message) !== null && _b !== void 0 ? _b : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
            }
        }
        if (socialType === user_model_1.SocialAccount.APPLE) {
            try {
                const { sub, email } = yield SocialProviders_1.default.verifyAppleToken(token);
                if (!email) {
                    return response.send((0, response_1.httpBadRequest)(null, 'Email cannot be null or empty.'));
                }
                const [username, user, isPhoneNumberExist] = yield Promise.all([
                    generateUsername(email, user_model_2.AccountType.INDIVIDUAL),
                    user_model_2.default.findOne({ email: email }),
                    phoneNumber ? user_model_2.default.findOne({ phoneNumber: phoneNumber }) : null,
                ]);
                if (phoneNumber && isPhoneNumberExist) {
                    return response.send((0, response_1.httpConflict)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.PHONE_NUMBER_IN_USE), error_1.ErrorMessage.PHONE_NUMBER_IN_USE));
                }
                if (!user) {
                    const profilePic = {
                        small: (0, basic_1.getDefaultProfilePic)(request, 'small'),
                        large: (0, basic_1.getDefaultProfilePic)(request, 'large'),
                        medium: (0, basic_1.getDefaultProfilePic)(request, 'medium')
                    };
                    const socialIDs = [{
                            socialUId: sub,
                            socialType: socialType
                        }];
                    const savedUser = yield (0, user_model_1.createUserAccount)({
                        profilePic, username, email, name: name !== null && name !== void 0 ? name : username, accountType, dialCode, phoneNumber, password, isActivated, isVerified, hasProfilePicture, socialIDs, geoCoordinate, language
                    }, false);
                    const authenticateUser = { id: savedUser.id, accountType: savedUser.accountType, businessProfileID: savedUser.businessProfileID, role: savedUser.role };
                    yield (0, appDeviceConfig_model_1.addUserDevicesConfig)(deviceID, devicePlatform, notificationToken, savedUser.id, savedUser.accountType);
                    const accessToken = yield (0, authenticate_1.generateAccessToken)(authenticateUser);
                    const refreshToken = yield (0, authenticate_1.generateRefreshToken)(authenticateUser, deviceID);
                    const { accessTokenKey, refreshTokenCookieKey } = getAuthKeys(request, savedUser.role);
                    response.cookie(refreshTokenCookieKey, refreshToken, constants_2.CookiePolicy);
                    response.cookie(accessTokenKey, accessToken, constants_2.CookiePolicy);
                    return response.send((0, response_1.httpOk)(Object.assign(Object.assign({}, savedUser.hideSensitiveData()), { businessProfileRef, isDocumentUploaded, hasAmenities, hasSubscription, accessToken, refreshToken }), success_1.SuccessMessage.LOGIN_SUCCESS));
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
                    return response.status(200).send((0, response_1.httpForbidden)(null, error_1.ErrorMessage.INACTIVE_ACCOUNT));
                }
                if (user.isDeleted) {
                    return response.status(200).send((0, response_1.httpForbidden)(null, error_1.ErrorMessage.ACCOUNT_DISABLED));
                }
                if (language) {
                    user.language = language;
                }
                user.geoCoordinate = geoCoordinate;
                yield Promise.all([
                    (0, appDeviceConfig_model_1.addUserDevicesConfig)(deviceID, devicePlatform, notificationToken, user.id, user.accountType),
                    user.save()
                ]);
                if (deviceID) {
                    response.cookie(constants_1.AppConfig.DEVICE_ID_COOKIE_KEY, deviceID, constants_2.CookiePolicy);
                }
                if (user.accountType === user_model_2.AccountType.BUSINESS && user.businessProfileID) {
                    const [businessDocument, businessProfile, subscription] = yield Promise.all([
                        businessDocument_model_1.default.find({ businessProfileID: user.businessProfileID }),
                        businessProfile_model_1.default.findOne({ _id: user.businessProfileID }),
                        (0, subscription_model_1.hasBusinessSubscription)(user.businessProfileID)
                    ]);
                    businessProfileRef = businessProfile;
                    const authenticateUser = { id: user.id, accountType: user.accountType, businessProfileID: user.businessProfileID, role: user.role };
                    const accessToken = yield (0, authenticate_1.generateAccessToken)(authenticateUser, "15m");
                    const { accessTokenKey } = getAuthKeys(request, user.role);
                    response.cookie(accessTokenKey, accessToken, constants_2.CookiePolicy);
                    if (!businessDocument || businessDocument.length === 0) {
                        isDocumentUploaded = false;
                    }
                    if (!businessProfileRef || !businessProfileRef.amenities || businessProfileRef.amenities.length === 0) {
                        hasAmenities = false;
                    }
                    // Check if account is within 11-month grace period
                    const accountAgeInMonths = (0, moment_1.default)().diff((0, moment_1.default)(user.createdAt), 'months', true);
                    const isWithinGracePeriod = accountAgeInMonths < 11;
                    // Only enforce subscription checks if account is 11+ months old
                    // For accounts within grace period, keep hasSubscription = true
                    if (!isWithinGracePeriod) {
                        if (!subscription) {
                            hasSubscription = false;
                        }
                        else {
                            const now = new Date();
                            if (subscription.expirationDate < now) {
                                hasSubscription = false;
                            }
                        }
                    }
                    if (!isDocumentUploaded || !hasAmenities || (!isWithinGracePeriod && !hasSubscription)) {
                        return response.send((0, response_1.httpOk)(Object.assign(Object.assign({}, user.hideSensitiveData()), { businessProfileRef, isDocumentUploaded, hasAmenities, hasSubscription, accessToken }), "Your profile is incomplete. Please take a moment to complete it."));
                    }
                    const now = new Date();
                    if (!isWithinGracePeriod && subscription && subscription.expirationDate < now) {
                        hasSubscription = false;
                        return response.send((0, response_1.httpForbidden)(Object.assign(Object.assign({}, user.hideSensitiveData()), { businessProfileRef, isDocumentUploaded, hasAmenities, hasSubscription, accessToken }), `Your subscription expired`));
                    }
                }
                if (!user.isApproved) {
                    return response.status(200).send((0, response_1.httpForbidden)(null, "Your account is currently under review. We will notify you once it has been verified."));
                }
                const authenticateUser = { id: user.id, accountType: user.accountType, businessProfileID: user.businessProfileID, role: user.role };
                const accessToken = yield (0, authenticate_1.generateAccessToken)(authenticateUser);
                const refreshToken = yield (0, authenticate_1.generateRefreshToken)(authenticateUser, deviceID);
                const { accessTokenKey, refreshTokenCookieKey } = getAuthKeys(request, user.role);
                response.cookie(refreshTokenCookieKey, refreshToken, constants_2.CookiePolicy);
                response.cookie(accessTokenKey, accessToken, constants_2.CookiePolicy);
                return response.send((0, response_1.httpOk)(Object.assign(Object.assign({}, user.hideSensitiveData()), { businessProfileRef, isDocumentUploaded, hasAmenities, hasSubscription, accessToken, refreshToken }), success_1.SuccessMessage.LOGIN_SUCCESS));
            }
            catch (error) {
                // Handle MongoDB duplicate key error for phoneNumber
                if (error.code === 11000 && error.keyPattern && error.keyPattern.phoneNumber) {
                    return response.send((0, response_1.httpConflict)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.PHONE_NUMBER_IN_USE), error_1.ErrorMessage.PHONE_NUMBER_IN_USE));
                }
                next((0, response_1.httpInternalServerError)(error, (_c = error.message) !== null && _c !== void 0 ? _c : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
            }
            // return response.send(httpOk({ 'data': payload }))
        }
    }
    catch (error) {
        // Handle MongoDB duplicate key error for phoneNumber
        if (error.code === 11000 && error.keyPattern && error.keyPattern.phoneNumber) {
            return response.send((0, response_1.httpConflict)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.PHONE_NUMBER_IN_USE), error_1.ErrorMessage.PHONE_NUMBER_IN_USE));
        }
        next((0, response_1.httpInternalServerError)(error, (_d = error.message) !== null && _d !== void 0 ? _d : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const signUp = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _e;
    try {
        const { email, name, accountType, dialCode, phoneNumber, password, businessName, businessEmail, businessPhoneNumber, businessDialCode, businessType, businessSubType, bio, businessWebsite, gstn, street, city, zipCode, country, lat, lng, state, placeID, profession, language } = request.body;
        const [username, isUserExist, isPhoneNumberExist] = yield Promise.all([
            generateUsername(email, accountType),
            user_model_2.default.findOne({ email: email }),
            phoneNumber ? user_model_2.default.findOne({ phoneNumber: phoneNumber }) : null,
        ]);
        if (isUserExist) {
            return response.send((0, response_1.httpConflict)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.EMAIL_IN_USE), error_1.ErrorMessage.EMAIL_IN_USE));
        }
        if (isPhoneNumberExist) {
            return response.send((0, response_1.httpConflict)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.PHONE_NUMBER_IN_USE), error_1.ErrorMessage.PHONE_NUMBER_IN_USE));
        }
        let geoCoordinate = { type: "Point", coordinates: [78.9629, 20.5937] };
        if (lat && lng) {
            geoCoordinate = { type: "Point", coordinates: [lng, lat] };
        }
        if (accountType === user_model_2.AccountType.BUSINESS) {
            const isBusinessTypeExist = yield businessType_model_1.default.findOne({ _id: businessType });
            if (!isBusinessTypeExist) {
                return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest("Business type not found"), "Business type not found"));
            }
            const isBusinessSubTypeExist = yield businessSubType_model_1.default.findOne({ businessTypeID: isBusinessTypeExist.id, _id: businessSubType });
            if (!isBusinessSubTypeExist) {
                return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest("Business subtype not found"), "Business subtype not found"));
            }
            /** Create business profile */
            const isActivated = true;
            const isApproved = false;
            const privateAccount = false;
            const profilePic = {
                small: (0, basic_1.getDefaultProfilePic)(request, 'small'),
                large: (0, basic_1.getDefaultProfilePic)(request, 'large'),
                medium: (0, basic_1.getDefaultProfilePic)(request, 'medium')
            };
            const businessTypeID = isBusinessTypeExist.id;
            const businessSubTypeID = isBusinessSubTypeExist.id;
            const address = { city, state, street, zipCode, country, geoCoordinate, lat, lng };
            const username = yield generateUsername(businessEmail, user_model_2.AccountType.BUSINESS);
            const savedBusinessProfile = yield (0, user_model_1.createBusinessProfile)({
                profilePic, username, businessTypeID, businessSubTypeID, bio, address, gstn, placeID, privateAccount,
                name: businessName,
                email: businessEmail,
                phoneNumber: businessPhoneNumber,
                dialCode: businessDialCode,
                website: businessWebsite
            });
            const businessProfileID = savedBusinessProfile._id;
            const savedUser = yield (0, user_model_1.createUserAccount)({
                email, username, name, accountType, dialCode, phoneNumber, password, isActivated, isApproved, privateAccount, businessProfileID, language
            }, true);
            return response.send((0, response_1.httpOk)(savedUser.hideSensitiveData(), success_1.SuccessMessage.REGISTRATION_SUCCESSFUL));
        }
        const profilePic = {
            small: (0, basic_1.getDefaultProfilePic)(request, 'small'),
            large: (0, basic_1.getDefaultProfilePic)(request, 'large'),
            medium: (0, basic_1.getDefaultProfilePic)(request, 'medium')
        };
        const isActivated = true;
        const savedUser = yield (0, user_model_1.createUserAccount)({
            profilePic, profession, username, email, name, accountType, dialCode, phoneNumber, password, isActivated, geoCoordinate, language
        }, true);
        return response.send((0, response_1.httpOk)(savedUser.hideSensitiveData(), success_1.SuccessMessage.REGISTRATION_SUCCESSFUL));
    }
    catch (error) {
        // Handle MongoDB duplicate key error for phoneNumber
        if (error.code === 11000 && error.keyPattern && error.keyPattern.phoneNumber) {
            return response.send((0, response_1.httpConflict)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.PHONE_NUMBER_IN_USE), error_1.ErrorMessage.PHONE_NUMBER_IN_USE));
        }
        next((0, response_1.httpInternalServerError)(error, (_e = error.message) !== null && _e !== void 0 ? _e : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const verifyEmail = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _f;
    try {
        const { email, otp, deviceID, notificationToken, devicePlatform } = request.body;
        const user = yield user_model_2.default.findOne({ email: email }).select("+otp");
        if (!user) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        if (user.otp !== parseInt(otp)) {
            return response.send((0, response_1.httpUnauthorized)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.OTP_NOT_MATCH), error_1.ErrorMessage.OTP_NOT_MATCH));
        }
        if (!user.isActivated) {
            return response.send((0, response_1.httpUnauthorized)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.INACTIVE_ACCOUNT), error_1.ErrorMessage.INACTIVE_ACCOUNT));
        }
        if (user.isDeleted) {
            return response.send((0, response_1.httpUnauthorized)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.ACCOUNT_DISABLED), error_1.ErrorMessage.ACCOUNT_DISABLED));
        }
        user.isVerified = true;
        user.otp = (0, basic_1.generateOTP)();
        const savedUser = yield user.save();
        yield (0, appDeviceConfig_model_1.addUserDevicesConfig)(deviceID, devicePlatform, notificationToken, user.id, user.accountType);
        if (deviceID) {
            response.cookie(constants_1.AppConfig.DEVICE_ID_COOKIE_KEY, deviceID, constants_2.CookiePolicy);
        }
        //Check the account and send response based on their profile 
        if (savedUser.accountType === user_model_2.AccountType.BUSINESS) {
            const businessProfileRef = yield businessProfile_model_1.default.findOne({ _id: user.businessProfileID });
            const authenticateUser = { id: user.id, accountType: user.accountType, businessProfileID: user.businessProfileID, role: user.role };
            const accessToken = yield (0, authenticate_1.generateAccessToken)(authenticateUser, "15m");
            const { accessTokenKey } = getAuthKeys(request, user.role);
            response.cookie(accessTokenKey, accessToken, constants_2.CookiePolicy);
            return response.send((0, response_1.httpOk)(Object.assign(Object.assign({}, savedUser.hideSensitiveData()), { businessProfileRef, accessToken }), success_1.SuccessMessage.OTP_VERIFIED));
        }
        else {
            const authenticateUser = { id: user.id, accountType: user.accountType, businessProfileID: user.businessProfileID, role: user.role };
            const accessToken = yield (0, authenticate_1.generateAccessToken)(authenticateUser);
            const refreshToken = yield (0, authenticate_1.generateRefreshToken)(authenticateUser, deviceID);
            const { accessTokenKey, refreshTokenCookieKey } = getAuthKeys(request, user.role);
            response.cookie(refreshTokenCookieKey, refreshToken, constants_2.CookiePolicy);
            response.cookie(accessTokenKey, accessToken, constants_2.CookiePolicy);
            return response.send((0, response_1.httpOk)(Object.assign(Object.assign({}, user.hideSensitiveData()), { accessToken, refreshToken }), success_1.SuccessMessage.LOGIN_SUCCESS));
        }
    }
    catch (error) {
        return response.send((0, response_1.httpInternalServerError)(error, (_f = error.message) !== null && _f !== void 0 ? _f : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const resendOTP = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _g;
    try {
        const { email, type } = request.body;
        const user = yield user_model_2.default.findOne({ email: email }).select("+otp");
        if (!user) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        const otp = (0, basic_1.generateOTP)();
        if (type === api_validation_1.Types.FORGOT_PASSWORD) {
            emailNotificationService.sendEmailOTP(otp, user.email, 'forgot-password');
        }
        if (type === api_validation_1.Types.EMAIL_VERIFICATION) {
            emailNotificationService.sendEmailOTP(otp, user.email, 'verify-email');
        }
        user.otp = otp;
        yield user.save();
        return response.send((0, response_1.httpOk)(null, 'Otp Sent'));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_g = error.message) !== null && _g !== void 0 ? _g : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const verifyOtpLogin = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _h;
    try {
        const { phoneNumber, dialCode, deviceID, devicePlatform, notificationToken, lat, lng, language } = req.body;
        // 1️⃣ Find user by phone number and dial code
        const user = yield user_model_2.default.findOne({ phoneNumber, dialCode });
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
        yield user.save();
        // 4️⃣ Handle business accounts
        let isDocumentUploaded = true;
        let hasAmenities = true;
        let hasSubscription = true;
        let businessProfileRef = null;
        if (user.accountType === user_model_2.AccountType.BUSINESS && user.businessProfileID) {
            const [businessDocument, businessProfile, subscription] = yield Promise.all([
                businessDocument_model_1.default.find({ businessProfileID: user.businessProfileID }),
                businessProfile_model_1.default.findOne({ _id: user.businessProfileID }),
                (0, subscription_model_1.hasBusinessSubscription)(user.businessProfileID)
            ]);
            businessProfileRef = businessProfile;
            if (!businessDocument || businessDocument.length === 0)
                isDocumentUploaded = false;
            if (!((_h = businessProfileRef === null || businessProfileRef === void 0 ? void 0 : businessProfileRef.amenities) === null || _h === void 0 ? void 0 : _h.length))
                hasAmenities = false;
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
        yield (0, appDeviceConfig_model_1.addUserDevicesConfig)(deviceID, devicePlatform, notificationToken, user.id, user.accountType);
        if (deviceID) {
            res.cookie(constants_1.AppConfig.DEVICE_ID_COOKIE_KEY, deviceID, constants_2.CookiePolicy);
        }
        // 6️⃣ Generate tokens
        const authenticateUser = {
            id: user.id,
            accountType: user.accountType,
            businessProfileID: user.businessProfileID,
            role: user.role
        };
        const accessToken = yield (0, authenticate_1.generateAccessToken)(authenticateUser);
        const refreshToken = yield (0, authenticate_1.generateRefreshToken)(authenticateUser, deviceID);
        const { accessTokenKey, refreshTokenCookieKey } = getAuthKeys(req, user.role);
        res.cookie(refreshTokenCookieKey, refreshToken, constants_2.CookiePolicy);
        res.cookie(accessTokenKey, accessToken, constants_2.CookiePolicy);
        // 7️⃣ Final success response — EXACT format requested
        return res.status(200).json({
            status: true,
            statusCode: 200,
            message: "Logged-in successfully",
            data: Object.assign(Object.assign({}, user.hideSensitiveData()), { businessProfileRef,
                isDocumentUploaded,
                hasAmenities,
                hasSubscription,
                accessToken,
                refreshToken })
        });
    }
    catch (error) {
        console.error("Error in verifyOtpLogin:", error);
        next(error);
    }
});
const logout = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _j, _k;
    try {
        const cookies = request === null || request === void 0 ? void 0 : request.cookies;
        const refreshToken = cookies[constants_1.AppConfig.USER_AUTH_TOKEN_COOKIE_KEY] || cookies[constants_1.AppConfig.ADMIN_AUTH_TOKEN_COOKIE_KEY];
        if (!refreshToken) {
            return response.status(401).send((0, response_1.httpUnauthorized)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.TOKEN_REQUIRED), error_1.ErrorMessage.TOKEN_REQUIRED));
        }
        let authTokenFindQuery = { refreshToken: refreshToken };
        const deviceID = cookies[constants_1.AppConfig.DEVICE_ID_COOKIE_KEY];
        if (deviceID !== undefined && deviceID !== "") {
            Object.assign(authTokenFindQuery, { deviceID: deviceID });
        }
        const authToken = yield authToken_model_1.default.findOne(authTokenFindQuery);
        if (!authToken) {
            response.clearCookie(constants_1.AppConfig.USER_AUTH_TOKEN_COOKIE_KEY, constants_2.CookiePolicy);
            response.clearCookie(constants_1.AppConfig.DEVICE_ID_COOKIE_KEY, constants_2.CookiePolicy);
            response.clearCookie(constants_1.AppConfig.USER_AUTH_TOKEN_KEY, constants_2.CookiePolicy);
            return response.status(401).send((0, response_1.httpUnauthorized)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.TOKEN_MISMATCH), error_1.ErrorMessage.TOKEN_MISMATCH));
        }
        if (authToken === null || authToken === void 0 ? void 0 : authToken.deviceID) {
            yield appDeviceConfig_model_1.default.deleteMany({ userID: authToken.userID, deviceID: authToken.deviceID });
        }
        yield authToken.deleteOne();
        const { accessTokenKey, refreshTokenCookieKey } = getAuthKeys(request, (_j = request.user) === null || _j === void 0 ? void 0 : _j.role);
        response.clearCookie(refreshTokenCookieKey, constants_2.CookiePolicy);
        response.clearCookie(constants_1.AppConfig.DEVICE_ID_COOKIE_KEY, constants_2.CookiePolicy);
        response.clearCookie(accessTokenKey, constants_2.CookiePolicy);
        return response.send((0, response_1.httpOk)(null, success_1.SuccessMessage.LOGOUT_SUCCESS));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_k = error.message) !== null && _k !== void 0 ? _k : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const refreshToken = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    const cookies = request === null || request === void 0 ? void 0 : request.cookies;
    const refreshToken = cookies[constants_1.AppConfig.USER_AUTH_TOKEN_COOKIE_KEY] || cookies[constants_1.AppConfig.ADMIN_AUTH_TOKEN_COOKIE_KEY];
    const deviceID = cookies[constants_1.AppConfig.DEVICE_ID_COOKIE_KEY];
    if (!refreshToken) {
        return response.status(401).send((0, response_1.httpUnauthorized)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.TOKEN_REQUIRED), error_1.ErrorMessage.TOKEN_REQUIRED));
    }
    let authTokenFindQuery = { refreshToken: refreshToken };
    if (deviceID !== undefined && deviceID !== "") {
        Object.assign(authTokenFindQuery, { deviceID: deviceID });
    }
    const authToken = yield authToken_model_1.default.findOne(authTokenFindQuery);
    if (!authToken) {
        return response.status(403).send((0, response_1.httpUnauthorized)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.TOKEN_MISMATCH), error_1.ErrorMessage.TOKEN_MISMATCH));
    }
    try {
        const decoded = (0, jsonwebtoken_1.verify)(authToken === null || authToken === void 0 ? void 0 : authToken.refreshToken, constants_1.AppConfig.APP_REFRESH_TOKEN_SECRET);
        if (decoded) {
            const userData = yield user_model_2.default.findOne({ _id: authToken.userID, });
            if (userData) {
                const userWithRole = { id: userData.id, accountType: userData.accountType, businessProfileID: userData.businessProfileID, role: userData.role };
                const accessToken = yield (0, authenticate_1.generateAccessToken)(userWithRole);
                const refreshToken = yield (0, authenticate_1.generateRefreshToken)(userWithRole, deviceID);
                const { accessTokenKey, refreshTokenCookieKey } = getAuthKeys(request, userData.role);
                response.cookie(refreshTokenCookieKey, refreshToken, constants_2.CookiePolicy);
                response.cookie(constants_1.AppConfig.DEVICE_ID_COOKIE_KEY, deviceID, constants_2.CookiePolicy);
                response.cookie(accessTokenKey, accessToken, constants_2.CookiePolicy);
                return response.status(200).send((0, response_1.httpOk)({ accessToken, refreshToken }, `Token Refreshed`));
            }
            else {
                return response.status(403).send((0, response_1.httpUnauthorized)(null, error_1.ErrorMessage.INSUFFICIENT_TO_GRANT_ACCESS));
            }
        }
    }
    catch (error) {
        return response.status(403).send((0, response_1.httpUnauthorized)(null, error_1.ErrorMessage.INVALID_OR_EXPIRED_TOKEN));
    }
});
function generateUsername(email, accountType) {
    return __awaiter(this, void 0, void 0, function* () {
        const username = (0, unique_username_generator_1.generateFromEmail)(email, 2);
        if (accountType === user_model_2.AccountType.BUSINESS) {
            const isAvailable = yield businessProfile_model_1.default.findOne({ username: username });
            if (!isAvailable) {
                return username;
            }
            else {
                return yield generateUsername(email, accountType);
            }
        }
        else {
            const isAvailable = yield user_model_2.default.findOne({ username: username });
            if (!isAvailable) {
                return username;
            }
            else {
                return yield generateUsername(email, accountType);
            }
        }
    });
}
exports.generateUsername = generateUsername;
exports.default = { login, resendOTP, verifyEmail, logout, refreshToken, signUp, socialLogin, verifyOtpLogin };
