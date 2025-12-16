"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorMessage = void 0;
class ErrorMessage {
    static invalidRequest(message, errors) {
        return {
            "errors": errors !== null && errors !== void 0 ? errors : null,
            "name": "InvalidRequest",
            "message": message
        };
    }
    static unAuthenticatedRequest(message, errors) {
        return {
            "errors": errors !== null && errors !== void 0 ? errors : null,
            "name": "UnauthenticatedRequest",
            "message": message
        };
    }
    static subscriptionExpired(message, errors) {
        return {
            "errors": errors !== null && errors !== void 0 ? errors : null,
            "name": "SubscriptionExpired",
            "message": message
        };
    }
}
exports.ErrorMessage = ErrorMessage;
ErrorMessage.BAD_REQUEST = "Bad Request";
ErrorMessage.NOT_FOUND = 'Not found';
ErrorMessage.INTERNAL_SERVER_ERROR = 'Internal server error';
ErrorMessage.USER_NOT_FOUND = "Unable to find this user, please try again";
ErrorMessage.POST_NOT_FOUND = "Unable to find this post, please try again";
ErrorMessage.SUBSCRIPTION_NOT_FOUND = "Subscription plan not found";
ErrorMessage.BUSINESS_PROFILE_NOT_FOUND = "Unable to find business profile, please try again";
ErrorMessage.INVALID_OR_INCORRECT_PASSWORD = 'Invalid or incorrect password. Please try again';
ErrorMessage.UNVERIFIED_ACCOUNT = "Sorry! Your account is not verified. Please try again";
ErrorMessage.INACTIVE_ACCOUNT = "Sorry! Your account is inactive. Please contact support";
ErrorMessage.ACCOUNT_DISABLED = "Account Not Found! This account has been deleted and cannot be accessed. If you need assistance, please reach out to support.";
ErrorMessage.EMAIL_IN_USE = "An account with this email address already exists. Please use a different email address or reset your password.";
ErrorMessage.PHONE_NUMBER_IN_USE = "An account with this phone number already exists. Please use a different phone number.";
ErrorMessage.OTP_NOT_MATCH = "Sorry! The OTP didn\'t match. Please try again";
ErrorMessage.TOKEN_REQUIRED = 'Access denied! A token is required for authentication.';
ErrorMessage.INVALID_OR_EXPIRED_TOKEN = "Access denied! Invalid or expired session, please try again";
ErrorMessage.INSUFFICIENT_TO_GRANT_ACCESS = "Session token is insufficient to grant access, please try again";
ErrorMessage.TOKEN_MISMATCH = 'Invalid token, please try again';
ErrorMessage.INVALID_PROMOCODE = "Invalid promo code, please try again";
ErrorMessage.EXPIRED_PROMOCODE = "Expired promo code, please try again";
ErrorMessage.PROMOCODE_USAGE_LIMIT_REACHED = "The maximum number of uses for this promo code has already been reached";
ErrorMessage.SUBSCRIPTION_EXPIRED = "Your subscription has expired. Please renew your subscription to access this resource.";
ErrorMessage.NO_SUBSCRIPTION = "You do not have an active subscription. Please subscribe to access this resource.";
ErrorMessage.UNAUTHORIZED_ACCESS_ERROR = 'You do not have permission to access this resource.';
;
