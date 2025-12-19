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
exports.generateAccessToken = exports.generateRefreshToken = exports.isBusinessUser = exports.isAdministrator = void 0;
const jsonwebtoken_1 = require("jsonwebtoken");
const response_1 = require("../utils/response");
const error_1 = require("../utils/response-message/error");
const constants_1 = require("../config/constants");
const user_model_1 = __importStar(require("../database/models/user.model"));
const common_1 = require("../common");
const authToken_model_1 = __importDefault(require("../database/models/authToken.model"));
const subscription_model_1 = require("../database/models/subscription.model");
function authenticateUser(request, response, next) {
    return __awaiter(this, void 0, void 0, function* () {
        const cookies = request === null || request === void 0 ? void 0 : request.cookies;
        const authKey = constants_1.AppConfig.USER_AUTH_TOKEN_KEY;
        const refreshTokenInCookie = cookies[authKey];
        const refreshTokenInHeaders = request.headers[authKey.toLowerCase()];
        const token = refreshTokenInCookie || refreshTokenInHeaders;
        if (!token) {
            return response.status(401).send((0, response_1.httpUnauthorized)(error_1.ErrorMessage.unAuthenticatedRequest(error_1.ErrorMessage.TOKEN_REQUIRED), error_1.ErrorMessage.TOKEN_REQUIRED));
        }
        try {
            const decoded = (0, jsonwebtoken_1.verify)(token, constants_1.AppConfig.APP_ACCESS_TOKEN_SECRET);
            if (decoded) {
                const [auth_user, subscription] = yield Promise.all([
                    user_model_1.default.findOne({ _id: decoded.id }),
                    (0, subscription_model_1.hasBusinessSubscription)(decoded.businessProfileID)
                ]);
                if (auth_user && auth_user.isActivated && !auth_user.isDeleted) {
                    console.log(request.path);
                    //FIXME improve endpoint check
                    // COMMENTED OUT: Subscription check bypassed for testing
                    // const matchedEndpoints = ['/edit-profile-pic', '/edit-profile', '/business-profile/documents', '/questions/answers', '/subscription/plans', '/subscription/checkout', '/subscription', '/business-profile/property-picture', '/apple/purchases/subscriptions/verify', '/google/purchases/subscriptions/verify'];
                    // const now = new Date();
                    // if (!matchedEndpoints.includes(request.path) && auth_user.accountType === AccountType.BUSINESS && !subscription) {
                    //     console.error("ErrorMessage.NO_SUBSCRIPTION");
                    //     return response.status(403).send(httpForbidden(ErrorMessage.subscriptionExpired(ErrorMessage.NO_SUBSCRIPTION), ErrorMessage.NO_SUBSCRIPTION));
                    // }
                    // if (!matchedEndpoints.includes(request.path) && auth_user.accountType === AccountType.BUSINESS && subscription && subscription.expirationDate < now) {
                    //     console.error("ErrorMessage.SUBSCRIPTION_EXPIRED");
                    //     return response.status(403).send(httpForbidden(ErrorMessage.subscriptionExpired(ErrorMessage.SUBSCRIPTION_EXPIRED), ErrorMessage.SUBSCRIPTION_EXPIRED));
                    // }
                    request.user = {
                        id: auth_user.id,
                        accountType: auth_user.accountType,
                        businessProfileID: auth_user.accountType === user_model_1.AccountType.BUSINESS ? auth_user.businessProfileID : null,
                        role: auth_user.role
                    };
                }
                else {
                    return response.status(401).send((0, response_1.httpUnauthorized)(error_1.ErrorMessage.unAuthenticatedRequest(error_1.ErrorMessage.INSUFFICIENT_TO_GRANT_ACCESS), error_1.ErrorMessage.INSUFFICIENT_TO_GRANT_ACCESS));
                }
            }
        }
        catch (error) {
            return response.status(401).send((0, response_1.httpUnauthorized)(error_1.ErrorMessage.unAuthenticatedRequest(error_1.ErrorMessage.TOKEN_REQUIRED), error_1.ErrorMessage.INVALID_OR_EXPIRED_TOKEN));
        }
        return next();
    });
}
exports.default = authenticateUser;
function isAdministrator(request, response, next) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const hasRole = (_a = request.user) === null || _a === void 0 ? void 0 : _a.role;
        if (!hasRole || (hasRole && hasRole !== common_1.Role.ADMINISTRATOR)) {
            return response.status(401).send((0, response_1.httpUnauthorized)(error_1.ErrorMessage.invalidRequest('You don\'t have the right permissions to access'), 'You don\'t have the right permissions to access'));
        }
        return next();
    });
}
exports.isAdministrator = isAdministrator;
function isBusinessUser(request, response, next) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        const hasRole = ((_a = request.user) === null || _a === void 0 ? void 0 : _a.role) || undefined;
        const accountType = ((_b = request.user) === null || _b === void 0 ? void 0 : _b.accountType) || undefined;
        const businessProfileID = ((_c = request.user) === null || _c === void 0 ? void 0 : _c.businessProfileID) || undefined;
        const isBusinessUser = (accountType && businessProfileID && accountType === user_model_1.AccountType.BUSINESS);
        const isAdministrator = (hasRole && hasRole === common_1.Role.ADMINISTRATOR);
        //Admin and Business user allowed
        console.log({ isBusinessUser, isAdministrator });
        if (isAdministrator || isBusinessUser) {
            return next();
        }
        return response.status(401).send((0, response_1.httpUnauthorized)(error_1.ErrorMessage.invalidRequest('You don\'t have the right permissions to access'), 'You don\'t have the right permissions to access'));
    });
}
exports.isBusinessUser = isBusinessUser;
function generateRefreshToken(user, deviceID) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const payload = {
            id: String(user.id),
            accountType: user.accountType,
            businessProfileID: user.businessProfileID ? String(user.businessProfileID) : undefined,
            role: user.role
        };
        const options = { expiresIn: constants_1.AppConfig.REFRESH_TOKEN_EXPIRES_IN };
        const refreshToken = (0, jsonwebtoken_1.sign)(payload, constants_1.AppConfig.APP_REFRESH_TOKEN_SECRET, options);
        const sameDevice = yield authToken_model_1.default.findOne({ deviceID: deviceID });
        if (!sameDevice) {
            const storeAuthToken = new authToken_model_1.default();
            storeAuthToken.userID = user.id;
            storeAuthToken.refreshToken = refreshToken;
            storeAuthToken.accountType = (_a = user.accountType) !== null && _a !== void 0 ? _a : undefined;
            storeAuthToken.deviceID = deviceID !== null && deviceID !== void 0 ? deviceID : undefined;
            yield storeAuthToken.save().catch((error) => { console.error(`refreshTokens Error :::`, error); });
            return refreshToken;
        }
        sameDevice.refreshToken = refreshToken;
        yield (sameDevice === null || sameDevice === void 0 ? void 0 : sameDevice.save().catch((error) => { console.error(error); }));
        return refreshToken;
    });
}
exports.generateRefreshToken = generateRefreshToken;
function generateAccessToken(user, expiresIn) {
    return __awaiter(this, void 0, void 0, function* () {
        const payload = {
            id: String(user.id),
            accountType: user.accountType,
            businessProfileID: user.businessProfileID ? String(user.businessProfileID) : undefined,
            role: user.role
        };
        const options = { expiresIn: (expiresIn !== null && expiresIn !== void 0 ? expiresIn : constants_1.AppConfig.ACCESS_TOKEN_EXPIRES_IN) };
        return (0, jsonwebtoken_1.sign)(payload, constants_1.AppConfig.APP_ACCESS_TOKEN_SECRET, options);
    });
}
exports.generateAccessToken = generateAccessToken;
