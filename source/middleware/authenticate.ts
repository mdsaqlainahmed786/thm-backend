import { Request, Response, NextFunction } from "express";
import { verify, sign, } from "jsonwebtoken";
import { httpUnauthorized } from "../utils/response";
import { ErrorMessage } from "../utils/response-message/error";
import { AppConfig } from "../config/constants";
import User, { AccountType } from "../database/models/user.model";
import { AuthenticateUser } from "../common";
import AuthToken from "../database/models/authToken.model";
import Subscription from "../database/models/subscription.model";
export default async function authenticateUser(request: Request, response: Response, next: NextFunction) {
    const cookies = request?.cookies;
    const authKey = AppConfig.USER_AUTH_TOKEN_KEY;
    const refreshTokenInCookie = cookies[authKey];
    const refreshTokenInHeaders = request.headers[authKey.toLowerCase()];
    const token = refreshTokenInCookie || refreshTokenInHeaders;
    if (!token) {
        return response.status(401).send(httpUnauthorized(ErrorMessage.unAuthenticatedRequest(ErrorMessage.TOKEN_REQUIRED), ErrorMessage.TOKEN_REQUIRED));
    }
    try {
        const decoded: any = verify(token, AppConfig.APP_ACCESS_TOKEN_SECRET);
        if (decoded) {
            const [auth_user, subscription] = await Promise.all([
                User.findOne({ _id: decoded.id }),
                Subscription.findOne({ businessProfileID: decoded.businessProfileID }).sort({ createdAt: -1, id: 1 })
            ])
            if (auth_user) {
                const matchedEndpoints = ['/edit-profile-pic', '/edit-profile', '/business-profile/documents', '/business-questions/answers', '/business-profile/subscription/plans', '/business-profile/subscription/checkout', '/business-profile/subscription', '/business-profile/property-picture'];
                const now = new Date();
                if (!matchedEndpoints.includes(request.path) && auth_user.accountType === AccountType.BUSINESS && !subscription) {
                    console.error("ErrorMessage.NO_SUBSCRIPTION");
                    return response.status(403).send(httpUnauthorized(ErrorMessage.subscriptionExpired(ErrorMessage.NO_SUBSCRIPTION), ErrorMessage.NO_SUBSCRIPTION));
                }
                if (!matchedEndpoints.includes(request.path) && auth_user.accountType === AccountType.BUSINESS && subscription && subscription.expirationDate < now) {
                    console.error("ErrorMessage.SUBSCRIPTION_EXPIRED");
                    return response.status(403).send(httpUnauthorized(ErrorMessage.subscriptionExpired(ErrorMessage.SUBSCRIPTION_EXPIRED), ErrorMessage.SUBSCRIPTION_EXPIRED));
                }
                request.user = {
                    id: auth_user.id,
                    accountType: auth_user.accountType,
                    businessProfileID: auth_user.accountType === AccountType.BUSINESS ? auth_user.businessProfileID : null,
                }
            } else {
                return response.status(403).send(httpUnauthorized(ErrorMessage.unAuthenticatedRequest(ErrorMessage.INSUFFICIENT_TO_GRANT_ACCESS), ErrorMessage.INSUFFICIENT_TO_GRANT_ACCESS));
            }
        }
    } catch (error) {
        return response.status(401).send(httpUnauthorized(ErrorMessage.unAuthenticatedRequest(ErrorMessage.TOKEN_REQUIRED), ErrorMessage.INVALID_OR_EXPIRED_TOKEN));
    }
    return next();
}


export async function generateRefreshToken(user: AuthenticateUser, deviceID: string) {
    const refreshToken = sign(user, AppConfig.APP_REFRESH_TOKEN_SECRET, { expiresIn: AppConfig.REFRESH_TOKEN_EXPIRES_IN });
    const sameDevice = await AuthToken.findOne({ deviceID: deviceID });
    if (!sameDevice) {
        const storeAuthToken = new AuthToken();
        storeAuthToken.userID = user.id;
        storeAuthToken.refreshToken = refreshToken;
        storeAuthToken.accountType = user.accountType ?? undefined;
        storeAuthToken.deviceID = deviceID ?? undefined;
        await storeAuthToken.save().catch((error: any) => { console.error(`refreshTokens Error :::`, error); });
        return refreshToken;
    }
    sameDevice.refreshToken = refreshToken;
    await sameDevice?.save().catch((error) => { console.error(error) });
    return refreshToken;
}


export async function generateAccessToken(user: AuthenticateUser, expiresIn?: string) {
    return sign(user, AppConfig.APP_ACCESS_TOKEN_SECRET, { expiresIn: expiresIn ?? AppConfig.ACCESS_TOKEN_EXPIRES_IN });
}