import { Request, Response, NextFunction } from "express";
import { verify, sign, SignOptions } from "jsonwebtoken";
import type { StringValue } from "ms";
import { httpForbidden, httpUnauthorized } from "../utils/response";
import { ErrorMessage } from "../utils/response-message/error";
import { AppConfig } from "../config/constants";
import User, { AccountType } from "../database/models/user.model";
import { AuthenticateUser, Role } from "../common";
import AuthToken from "../database/models/authToken.model";
import Subscription, { hasBusinessSubscription } from "../database/models/subscription.model";
import BusinessProfile from "../database/models/businessProfile.model";
import BusinessType from "../database/models/businessType.model";
import moment from "moment";
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
                hasBusinessSubscription(decoded.businessProfileID)
            ])
            if (auth_user && auth_user.isActivated && !auth_user.isDeleted) {
                console.log(request.path);
                //FIXME improve endpoint check
                const matchedEndpoints = ['/edit-profile-pic', '/edit-profile', '/business-profile/documents', '/questions/answers', '/subscription/plans', '/subscription/checkout', '/subscription', '/business-profile/property-picture', '/apple/purchases/subscriptions/verify', '/google/purchases/subscriptions/verify'];
                const now = new Date();

                // Check if account is within 11-month grace period
                const accountAgeInMonths = moment().diff(moment(auth_user.createdAt), 'months', true);
                const isWithinGracePeriod = accountAgeInMonths < 11;

                // Only enforce subscription checks if account is 11+ months old
                if (!isWithinGracePeriod && !matchedEndpoints.includes(request.path) && auth_user.accountType === AccountType.BUSINESS && !subscription) {
                    console.error("ErrorMessage.NO_SUBSCRIPTION");
                    return response.status(403).send(httpForbidden(ErrorMessage.subscriptionExpired(ErrorMessage.NO_SUBSCRIPTION), ErrorMessage.NO_SUBSCRIPTION));
                }
                if (!isWithinGracePeriod && !matchedEndpoints.includes(request.path) && auth_user.accountType === AccountType.BUSINESS && subscription && subscription.expirationDate < now) {
                    console.error("ErrorMessage.SUBSCRIPTION_EXPIRED");
                    return response.status(403).send(httpForbidden(ErrorMessage.subscriptionExpired(ErrorMessage.SUBSCRIPTION_EXPIRED), ErrorMessage.SUBSCRIPTION_EXPIRED));
                }
                // Fetch business type if it's a business account
                let businessTypeID: string | null = null;
                let businessTypeName: string | null = null;

                if (auth_user.accountType === AccountType.BUSINESS && auth_user.businessProfileID) {
                    try {
                        const businessProfile = await BusinessProfile.findOne({ _id: auth_user.businessProfileID });
                        if (businessProfile && businessProfile.businessTypeID) {
                            businessTypeID = String(businessProfile.businessTypeID);
                            const businessType = await BusinessType.findOne({ _id: businessProfile.businessTypeID });
                            if (businessType) {
                                businessTypeName = businessType.name;
                            }
                        }
                    } catch (error) {
                        console.error('Error fetching business type in authenticate:', error);
                    }
                }

                request.user = {
                    id: auth_user.id,
                    accountType: auth_user.accountType,
                    businessProfileID: auth_user.accountType === AccountType.BUSINESS ? auth_user.businessProfileID : null,
                    businessTypeID: businessTypeID,
                    businessTypeName: businessTypeName,
                    role: auth_user.role
                }
            } else {
                return response.status(401).send(httpUnauthorized(ErrorMessage.unAuthenticatedRequest(ErrorMessage.INSUFFICIENT_TO_GRANT_ACCESS), ErrorMessage.INSUFFICIENT_TO_GRANT_ACCESS));
            }
        }
    } catch (error) {
        return response.status(401).send(httpUnauthorized(ErrorMessage.unAuthenticatedRequest(ErrorMessage.TOKEN_REQUIRED), ErrorMessage.INVALID_OR_EXPIRED_TOKEN));
    }
    return next();
}
export async function isAdministrator(request: Request, response: Response, next: NextFunction) {
    const hasRole = request.user?.role;
    if (!hasRole || (hasRole && hasRole !== Role.ADMINISTRATOR)) {
        return response.status(401).send(httpUnauthorized(ErrorMessage.invalidRequest('You don\'t have the right permissions to access'), 'You don\'t have the right permissions to access'));
    }
    return next();
}

export async function isBusinessUser(request: Request, response: Response, next: NextFunction) {
    const hasRole = request.user?.role || undefined;
    const accountType = request.user?.accountType || undefined;
    const businessProfileID = request.user?.businessProfileID || undefined;

    const isBusinessUser = (accountType && businessProfileID && accountType === AccountType.BUSINESS);
    const isAdministrator = (hasRole && hasRole === Role.ADMINISTRATOR);
    //Admin and Business user allowed
    console.log({ isBusinessUser, isAdministrator })
    if (isAdministrator || isBusinessUser) {
        return next();
    }
    return response.status(401).send(httpUnauthorized(ErrorMessage.invalidRequest('You don\'t have the right permissions to access'), 'You don\'t have the right permissions to access'));

}

export async function generateRefreshToken(user: AuthenticateUser, deviceID: string) {
    // Fetch business type information if businessProfileID exists
    let businessTypeID: string | undefined = undefined;
    let businessTypeName: string | undefined = undefined;

    if (user.businessProfileID && user.accountType === AccountType.BUSINESS) {
        // Use provided businessTypeID if available, otherwise fetch from database
        if (user.businessTypeID) {
            businessTypeID = String(user.businessTypeID);
            businessTypeName = user.businessTypeName;
        } else {
            try {
                const businessProfile = await BusinessProfile.findOne({ _id: user.businessProfileID });
                if (businessProfile && businessProfile.businessTypeID) {
                    businessTypeID = String(businessProfile.businessTypeID);
                    const businessType = await BusinessType.findOne({ _id: businessProfile.businessTypeID });
                    if (businessType) {
                        businessTypeName = businessType.name;
                    }
                }
            } catch (error) {
                console.error('Error fetching business type for token:', error);
            }
        }
    }

    const payload = {
        id: String(user.id),
        accountType: user.accountType,
        businessProfileID: user.businessProfileID ? String(user.businessProfileID) : undefined,
        businessTypeID: businessTypeID,
        businessTypeName: businessTypeName,
        role: user.role
    };
    const options: SignOptions = { expiresIn: AppConfig.REFRESH_TOKEN_EXPIRES_IN as StringValue };
    const refreshToken = sign(payload, AppConfig.APP_REFRESH_TOKEN_SECRET, options);
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
    // Fetch business type information if businessProfileID exists
    let businessTypeID: string | undefined = undefined;
    let businessTypeName: string | undefined = undefined;

    if (user.businessProfileID && user.accountType === AccountType.BUSINESS) {
        // Use provided businessTypeID if available, otherwise fetch from database
        if (user.businessTypeID) {
            businessTypeID = String(user.businessTypeID);
            businessTypeName = user.businessTypeName;
        } else {
            try {
                const businessProfile = await BusinessProfile.findOne({ _id: user.businessProfileID });
                if (businessProfile && businessProfile.businessTypeID) {
                    businessTypeID = String(businessProfile.businessTypeID);
                    const businessType = await BusinessType.findOne({ _id: businessProfile.businessTypeID });
                    if (businessType) {
                        businessTypeName = businessType.name;
                    }
                }
            } catch (error) {
                console.error('Error fetching business type for token:', error);
            }
        }
    }

    const payload = {
        id: String(user.id),
        accountType: user.accountType,
        businessProfileID: user.businessProfileID ? String(user.businessProfileID) : undefined,
        businessTypeID: businessTypeID,
        businessTypeName: businessTypeName,
        role: user.role
    };
    const options: SignOptions = { expiresIn: (expiresIn ?? AppConfig.ACCESS_TOKEN_EXPIRES_IN) as StringValue };
    return sign(payload, AppConfig.APP_ACCESS_TOKEN_SECRET, options);
}