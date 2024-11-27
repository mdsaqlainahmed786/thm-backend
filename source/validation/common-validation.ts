
import { body } from "express-validator";
import { AccountType } from "../database/models/user.model";
import { QuestionType } from "../database/models/faq.model";
import { SubscriptionDuration, SubscriptionLevel } from "../database/models/subscriptionPlan.model";
import { CurrencyCode } from "../database/models/subscriptionPlan.model";
import { ContentType } from "../common";
import { MessageType } from "../database/models/message.model";
export enum LogInWith {
    EMAIL = "email",
    PHONE = "phone",
    SOCIAL = "social"
}
export enum SocialAccount {
    FACEBOOK = "facebook",
    GOOGLE = "google",
    APPLE = "apple",
}

export enum DevicePlatform {
    IOS = 'ios',
    ANDROID = 'android',
    WEB = 'web',
}
const SubscriptionLevelValues = Object.values(SubscriptionLevel);
const AccountTypeValues = Object.values(AccountType);
const DevicePlatformValues = Object.values(DevicePlatform);
const SubscriptionDurationValues = Object.values(SubscriptionDuration);
const CurrencyCodeValues = Object.values(CurrencyCode);
export const accountTypeValidationRule = body("accountType", "Account type is required field.").exists().bail().notEmpty().bail().isIn(AccountTypeValues).withMessage(`Account type must be in  ${AccountTypeValues.join(' | ')}`);
export const emailValidationRule = body("email", "Email is a required field.").exists().bail().notEmpty().bail().isEmail().withMessage("Please enter valid email address.");
export const phoneNumberValidationRule = body("phoneNumber", "Phone number is a required field.").exists().bail().notEmpty().bail().isInt().withMessage("Phone number must be an integer value.");
export const dialCodeValidationRule = body("dialCode", "Dial code is a required field.").exists().bail().notEmpty().bail().isNumeric().withMessage("Dial code must be an integer with + sign, like +1.");
export const nameValidationRule = body("name", "Name is a required field.").exists().bail().notEmpty().bail();
export const descriptionValidationRule = body("description", "Description is required field.").exists().bail().notEmpty().bail();
export const priceValidationRule = body("price", "Price is required field.").exists().bail().notEmpty().bail().isDecimal({ decimal_digits: '2', force_decimal: true }).withMessage('Price must be a decimal number with two decimal digits');
export const levelValidationRule = body("level", "Subscription type is required field.").exists().bail().notEmpty().bail().isIn(SubscriptionLevelValues).withMessage(`Subscription type must be in ${SubscriptionLevelValues.join(' | ')}`);
export const durationValidationRule = body("duration", "Duration is required field.").exists().bail().notEmpty().bail().isIn(SubscriptionDurationValues).withMessage(`Subscription type must be in ${SubscriptionDurationValues.join(' | ')}`);;
export const currencyValidationRule = body("currency", "Currency is required field.").exists().bail().notEmpty().bail().isIn(CurrencyCodeValues).withMessage(`Currency must be in ${CurrencyCodeValues.join(' | ')}`);
const ContentTypeValue = Object.values(ContentType);
export const contentTypeValidationRule = body("contentType", "Content Type is required field.").exists().bail().notEmpty().bail().isIn(ContentTypeValue).withMessage(`Content Type must be in  ${ContentTypeValue.join(' | ')}`);

const isStrongPassword = (value: string) => {
    // Implement your password strength criteria using a regular expression
    // Example: Require at least 8 characters, at least one uppercase letter, one lowercase letter, one digit, and one special symbol

    // const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[a-zA-Z\d!@#$%^&*]{8,}$/;
    const passwordRegex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{8,}$/;
    return passwordRegex.test(value);
};
export const passwordValidationRule = body('password', 'Password is a required field.').exists().bail().notEmpty().bail();
export const strongPasswordValidationRule = body('password', 'Password is a required field.').exists().bail().notEmpty().bail().custom(isStrongPassword).withMessage('Require at least 8 characters, one uppercase, one lowercase letter, and symbol and one digit.')
export const otpValidationRule = body("otp", "OTP is a required field.").exists().bail().notEmpty().bail().withMessage("OTP must be a an integer value.").bail();

export const deviceIDValidationRule = body("deviceID", `Device ID is a required field.`).exists().bail().notEmpty().bail();
export const devicePlatformValidationRule = body("devicePlatform", `Device Platform is a required field.`).exists().bail().notEmpty().bail().isIn(DevicePlatformValues).withMessage(`Social Type must ${DevicePlatformValues.join(' | ')}.`);
export const notificationTokenValidationRule = body("notificationToken", `Notification Token is a required field.`).exists().bail().notEmpty().bail();


export const loginWithValidationRule = body("loginWith", "Login With is required field.").exists().bail().notEmpty().bail().isIn([LogInWith.EMAIL, LogInWith.PHONE, LogInWith.SOCIAL]).withMessage(`Login With must be in type of ${LogInWith.EMAIL} | ${LogInWith.PHONE} | ${LogInWith.SOCIAL}`);
export const socialUIdValidationRule = body("socialUID", `Social UID is a required field.`).exists().bail().notEmpty().bail();
export const socialTypeValidationRule = body("socialType", "Social Type is required field.").exists().bail().notEmpty().bail().isIn([SocialAccount.APPLE, SocialAccount.FACEBOOK, SocialAccount.GOOGLE]).withMessage(`Social Type must '${SocialAccount.APPLE}' | '${SocialAccount.FACEBOOK}' | '${SocialAccount.GOOGLE}'.`);

/**
 * Address Validation Rules for API's
 */
export const streetValidationRule = body("street", "Street is a required field.").exists().bail().notEmpty().bail();
export const cityValidationRule = body("city", "City is a required field.").exists().bail().notEmpty().bail();
export const stateValidationRule = body("state", "State is a required field.").exists().bail().notEmpty().bail();
export const zipCodeValidationRule = body("zipCode", "Postal Code is a required field.").exists().bail().notEmpty().bail();
export const countryValidationRule = body("country", "Country is a required field.").exists().bail().notEmpty().bail();
export const latValidationRule = body("lat", `Location data (lat) is a required field.`).exists().bail().notEmpty().bail();
export const lngValidationRule = body("lng", `Location data (lng) is a required field.`).exists().bail().notEmpty().bail();


export const businessSubtypeIDValidationRule = body("businessSubtypeID", `Business Subtype ID is a required field.`).exists().bail().notEmpty().bail().isMongoId().withMessage('Invalid Business Subtype ID');
export const businessTypeIDValidationRule = body("businessTypeID", `Business Type ID is a required field.`).exists().bail().notEmpty().bail().isMongoId().withMessage('Invalid Business Type ID');


export const questionsIDsValidationRule = body("questionsIDs", `Question id's is a required field.`).exists().bail().notEmpty().bail().isArray().withMessage('Question id\'s is a array field like ["66d8543e96535f73da1498de","66d8543e96535f73da1498de"]');

export const subscriptionPlanIDValidationRule = body("subscriptionPlanID", `Subscription Plan ID is a required field.`).exists().bail().notEmpty().bail().isMongoId().withMessage('Invalid Business Type ID');


const QuestionTypeValues = Object.values(QuestionType);
const SubscriptionTypeValues = Object.values(AccountType);
export const questionValidationRule = body("question", "Question is a required field.").exists().bail().notEmpty().bail();
export const answerValidationRule = body("answer", "Answer is a required field.").exists().bail().notEmpty().bail();
export const questionTypeValidationRule = body("type", "Type is a required field.").exists().bail().notEmpty().bail().isIn(QuestionTypeValues).withMessage(`Social Type must ${QuestionTypeValues.join(' | ')}.`);

export const subscriptionTypeValidationRule = body("type", "Type is a required field.").exists().bail().notEmpty().bail().isIn(SubscriptionTypeValues).withMessage(`Type must ${SubscriptionTypeValues.join(' | ')}.`);


const MessageTypeValues = Object.values(MessageType)
export const messageTypeValidationRule = body("messageType", "Message type is required field.").exists().bail().notEmpty().isIn(MessageTypeValues).withMessage(`Message type must be in ${MessageTypeValues.join(' | ')}`)
export const usernameValidationRule = body("username", "Username is required field.").exists().bail().notEmpty().bail();
