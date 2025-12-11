import { BedType, RoomType, MealPlan } from './../common/index';
import { SocialAccount } from './../database/models/user.model';

import { body } from "express-validator";
import { AccountType } from "../database/models/user.model";
import { QuestionType } from "../database/models/faq.model";
import { SubscriptionDuration, SubscriptionLevel } from "../database/models/subscriptionPlan.model";
import { ContentType, CurrencyCode } from "../common";
import { MessageType } from "../database/models/message.model";
import { PriceType, PromoType } from "../database/models/promoCode.model";
import { JobType } from '../database/models/job.model';
export enum LogInWith {
    EMAIL = "email",
    PHONE = "phone",
    SOCIAL = "social"
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
const SocialAccountValues = Object.values(SocialAccount);
export const accountTypeValidationRule = body("accountType", "Account type is required field.").exists().bail().notEmpty().bail().isIn(AccountTypeValues).withMessage(`Account type must be in ${AccountTypeValues.join(' | ')}`);
export const emailValidationRule = body("email", "Email is a required field.").exists().bail().notEmpty().bail().isEmail().withMessage("Please enter valid email address.");
export const phoneNumberValidationRule = body("phoneNumber", "Phone number is a required field.").exists().bail().notEmpty().bail().isInt().withMessage("Phone number must be an integer value.");
export const dialCodeValidationRule = body("dialCode", "Dial code is a required field.").exists().bail().notEmpty().bail().isNumeric().withMessage("Dial code must be an integer with + sign, like +1.");
export const nameValidationRule = body("name", "Name is a required field.").exists().bail().notEmpty().bail();
export const descriptionValidationRule = body("description", "Description is required field.").exists().bail().notEmpty().bail();
export const priceValidationRule = body("price", "Price is required field.").exists().bail().notEmpty().bail().isDecimal({ decimal_digits: '2', force_decimal: true }).withMessage('Price must be a decimal number with two decimal digits');
export const levelValidationRule = body("level", "Subscription type is required field.").exists().bail().notEmpty().bail().isIn(SubscriptionLevelValues).withMessage(`Subscription type must be in ${SubscriptionLevelValues.join(' | ')}`);
export const durationValidationRule = body("duration", "Duration is required field.").exists().bail().notEmpty().bail().isIn(SubscriptionDurationValues).withMessage(`Subscription type must be in ${SubscriptionDurationValues.join(' | ')}`);;
export const currencyValidationRule = body("currency", "Currency is required field.").exists().bail().notEmpty().bail().isIn(CurrencyCodeValues).withMessage(`Currency must be in ${CurrencyCodeValues.join(' | ')}`);
export const totalRoomsValidationRule = body("totalRooms", "Total rooms is required field.").exists().bail().notEmpty().bail().isInt().withMessage('Total rooms must be a integer value');

const ContentTypeValue = Object.values(ContentType);
export const contentTypeValidationRule = body("contentType", "Content Type is required field.").exists().bail().notEmpty().bail().isIn(ContentTypeValue).withMessage(`Content Type must be in ${ContentTypeValue.join(' | ')}`);

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
export const socialTypeValidationRule = body("socialType", "Social Type is required field.").exists().bail().notEmpty().bail().isIn(SocialAccountValues).withMessage(`Social Type must ${SocialAccountValues.join(' | ')}.`);

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
export const businessProfileIDValidationRule = body('businessProfileID', 'Business ID is a required field.').exists().bail().notEmpty().bail().isMongoId().withMessage('Invalid Business ID');

export const businessSubtypeIDValidationRule = body("businessSubtypeID", `Business Subtype ID is a required field.`).exists().bail().notEmpty().bail().isMongoId().withMessage('Invalid Business Subtype ID');
export const businessTypeIDValidationRule = body("businessTypeID", `Business Type ID is a required field.`).exists().bail().notEmpty().bail().isMongoId().withMessage('Invalid Business Type ID');


export const questionsIDsValidationRule = body("questionsIDs", `Question id's is a required field.`).exists().bail().notEmpty().bail().isArray().withMessage('Question id\'s is a array field like ["66d8543e96535f73da1498de","66d8543e96535f73da1498de"]');

export const subscriptionPlanIDValidationRule = body("subscriptionPlanID", `Subscription Plan ID is a required field.`).exists().bail().notEmpty().bail().isMongoId().withMessage('Invalid Business Type ID');


const QuestionTypeValues = Object.values(QuestionType);
const SubscriptionTypeValues = Object.values(AccountType);
export const questionValidationRule = body("question", "Question is a required field.").exists().bail().notEmpty().bail();
export const answerValidationRule = body("answer", "Answer is a required field.").exists().bail().notEmpty().bail();
export const questionTypeValidationRule = body("type", "Type is a required field.").exists().bail().notEmpty().bail().isIn(QuestionTypeValues).withMessage(`Question type must ${QuestionTypeValues.join(' | ')}.`);

export const subscriptionTypeValidationRule = body("type", "Type is a required field.").exists().bail().notEmpty().bail().isIn(SubscriptionTypeValues).withMessage(`Type must ${SubscriptionTypeValues.join(' | ')}.`);


const MessageTypeValues = Object.values(MessageType)
export const messageTypeValidationRule = body("messageType", "Message type is required field.").exists().bail().notEmpty().isIn(MessageTypeValues).withMessage(`Message type must be in ${MessageTypeValues.join(' | ')}`)
export const usernameValidationRule = body("username", "Username is required field.").exists().bail().notEmpty().bail();

const typeValues = Object.values(PromoType);
const priceTypeValues = Object.values(PriceType);
const bedTypeValues = Object.values(BedType);
const roomTypeValues = Object.values(RoomType);
const mealPlanValues = Object.values(MealPlan);
const jobTypeValues = Object.values(JobType);
export const codeValidationRule = body("code", "Coupon code is a required field.").exists().bail().notEmpty().bail();
export const typeValidationRule = body("type", "Type is a required field.").exists().bail().notEmpty().bail().isIn(typeValues).withMessage(`Type must be in ${typeValues.join(' | ')}.}`);
export const priceTypeValidationRule = body("priceType", "Price Type is a required field.").exists().bail().notEmpty().bail().isIn(priceTypeValues).withMessage(`Price Type must be in ${priceTypeValues.join(' | ')}`);
export const valueValidationRule = body("value", "Discount value is a required field.").exists().bail().notEmpty().bail().isNumeric().withMessage("Discount value must be integer or float value.");
export const cartValueValidationRule = body("cartValue", "Cart Value is a required field.").exists().bail().notEmpty().bail().isNumeric().withMessage("Cart Value must be integer value.");
export const validToValidationRule = body("validTo", "Valid to is a required field.").exists().bail().notEmpty().bail().isDate({ format: 'YYYY/MM/DD' }).withMessage("Valid to must be in 'YYYY/MM/DD' format.");
export const validFromValidationRule = body("validFrom", "Valid from is a required field.").exists().bail().notEmpty().bail().isDate({ format: 'YYYY/MM/DD' }).withMessage("Valid from must be in 'YYYY/MM/DD' format.");
export const quantityValidationRule = body("quantity", "Quantity is a required field.").exists().bail().notEmpty().bail().isInt().withMessage("Quantity must be integer value.");
export const maxDiscountValidationRule = body("maxDiscount", "Max discount is a required field.").exists().bail().notEmpty().bail().isInt().withMessage("Max discount must be integer value.");
export const redeemedCountValidationRule = body("redeemedCount", "Redeemed count is a required field.").exists().bail().notEmpty().bail().isInt().withMessage("Redeemed count must be integer value.");
export const adultsValidationRule = body("adults", "Adults capacity is a required field.").isInt({ min: 1, max: 4 }).withMessage("Adults capacity must be integer value between 1 - 4.");
export const childrenValidationRule = body("children", "Max occupancy is a required field.").isInt({ min: 0, max: 2 }).withMessage("Max occupancy must be integer value between 1 - 2.");
export const bedTypeValidationRule = body("bedType", "Bed type is a required field.").isIn(bedTypeValues).optional({ nullable: false }).withMessage(`Bed type must be in ${bedTypeValues.join(' | ')}.}`);
export const roomTypeValidationRule = body("roomType", "Room type is a required field.").isIn(roomTypeValues).optional({ nullable: false }).withMessage(`Room type must be in ${roomTypeValues.join(' | ')}.}`);
export const mealPlanValidationRule = body("mealType", "Meal type is a required field.").isIn(mealPlanValues).optional({ nullable: false }).withMessage(`Meal type must be in ${mealPlanValues.join(' | ')}.}`);
export const roomIDValidationRule = body("roomID", "Room ID is a required field.").isMongoId().withMessage(`Invalid Room ID.`);
export const bookingIDValidationRule = body('bookingID', 'Booking ID is required field').exists().bail().notEmpty().bail().withMessage('Invalid Booking ID');
export const numberOfGuestsValidationRule = body("numberOfGuests", "Number of Guests is required field.").exists().bail().notEmpty().bail().isInt().withMessage("Number of Guests must be an integer value.");
export const titleValidationRule = body("title", "Title is required field.").exists().bail().notEmpty().bail();
export const designationValidationRule = body("designation", "Designation is required field.").exists().bail().notEmpty().bail();
export const jobTypeValidationRule = body("jobType", "Job Type is required field.").exists().bail().notEmpty().bail().isIn(jobTypeValues).withMessage(`Type must ${jobTypeValues.join(' | ')}.`);
export const salaryValidationRule = body("salary", "Salary is required field.").exists().bail().notEmpty().bail();
export const joiningDateValidationRule = body("joiningDate", "Joining date is required field.").exists().bail().notEmpty().bail().isDate({
    format: 'YYYY-MM-DD',
    delimiters: ['-'],
}).withMessage("Invalid date. Please use YYYY-MM-DD format");
export const numberOfVacanciesValidationRule = body("numberOfVacancies", "Joining date is required field.").exists().bail().notEmpty().bail();
export const experienceValidationRule = body("experience", "Experience is required field.").exists().bail().notEmpty().bail();