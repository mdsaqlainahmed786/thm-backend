export class ErrorMessage {
    static readonly BAD_REQUEST = "Bad Request";
    static readonly NOT_FOUND = 'Not found';
    static readonly INTERNAL_SERVER_ERROR = 'Internal server error';
    static readonly USER_NOT_FOUND = "Unable to find this user, please try again";
    static readonly BUSINESS_PROFILE_NOT_FOUND = "Unable to find business profile, please try again";
    static readonly INVALID_OR_INCORRECT_PASSWORD = 'Invalid or incorrect password. Please try again';
    static readonly UNVERIFIED_ACCOUNT = "Sorry! Your account is not verified. Please try again";
    static readonly INACTIVE_ACCOUNT = "Sorry! Your account is inactive. Please contact support";
    static readonly ACCOUNT_DISABLED = "We regret to inform you that your account has been disabled. Please contact support.";
    static readonly EMAIL_IN_USE = "An account with this email address already exists. Please use a different email address or reset your password.";
    static readonly OTP_NOT_MATCH = "Sorry! The OTP didn\'t match. Please try again";

    static readonly TOKEN_REQUIRED = 'Access denied! A token is required for authentication.';
    static readonly INVALID_OR_EXPIRED_TOKEN = "Access denied! Invalid or expired session, please try again";
    static readonly INSUFFICIENT_TO_GRANT_ACCESS = "Session token is insufficient to grant access, please try again"
    static readonly TOKEN_MISMATCH = 'Invalid token, please try again';
    static invalidRequest(message: string, errors?: any) {
        return {
            "errors": errors ?? null,
            "name": "InvalidRequest",
            "message": message
        } as Object
    }
    static unAuthenticatedRequest(message: string, errors?: any) {
        return {
            "errors": errors ?? null,
            "name": "UnauthenticatedRequest",
            "message": message
        } as Object
    }
};