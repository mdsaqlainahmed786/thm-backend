import { questionValidationRule, questionTypeValidationRule, answerValidationRule, descriptionValidationRule, priceValidationRule, levelValidationRule, durationValidationRule, currencyValidationRule, subscriptionTypeValidationRule } from './../common-validation';
import { ContentType } from '../../common';
import { body, param } from "express-validator";
import { accountTypeValidationRule, businessSubtypeIDValidationRule, businessTypeIDValidationRule, cityValidationRule, countryValidationRule, deviceIDValidationRule, devicePlatformValidationRule, dialCodeValidationRule, emailValidationRule, nameValidationRule, latValidationRule, lngValidationRule, notificationTokenValidationRule, otpValidationRule, passwordValidationRule, phoneNumberValidationRule, questionsIDsValidationRule, stateValidationRule, streetValidationRule, strongPasswordValidationRule, subscriptionPlanIDValidationRule, zipCodeValidationRule } from "../common-validation";
import { AccountType } from "../../database/models/user.model";

export const businessTypeValidationRule = body('businessType', 'Business type is a required field.').exists().bail().notEmpty().bail().isMongoId().withMessage('Invalid business type');
export const businessSubTypeValidationRule = body('businessSubType', 'Business sub type is a required field.').exists().bail().notEmpty().bail().isMongoId().withMessage('Invalid business subtype');

export const businessNameValidationRule = body('businessName', 'Business name is a required field.').exists().bail().notEmpty().bail();
export const businessEmailValidationRule = body("businessEmail", "Business email is a required field.").exists().bail().notEmpty().bail().isEmail().withMessage("Please enter valid email address.");
export const businessPhoneNumberValidationRule = body("businessPhoneNumber", "Business phone number is a required field.").exists().bail().notEmpty().bail().isInt().withMessage("Phone number must be an integer value.");
export const businessDialCodeValidationRule = body("businessDialCode", "Business dial code is a required field.").exists().bail().notEmpty().bail().isNumeric().withMessage("Dial code must be an integer with + sign, like +1.");
export const bioValidationRule = body('bio', 'Business description is a required field.').exists().bail().notEmpty().bail();
export const placeIDValidationRule = body('placeID', 'Place ID is a required field.').exists().bail().notEmpty().bail();


export const paramIDValidationRule = param("id", 'ID is a required field.').exists().bail().notEmpty().bail().isMongoId().withMessage('Invalid ID');
export const postIDValidationRule = body("postID", 'Post ID is required field.').exists().bail().notEmpty().bail().isMongoId().withMessage('Invalid ID');
export const messageValidationRule = body("message", "Message is required field.").exists().bail().notEmpty().bail();



const businessNameCustomValidationRule = body('accountType').custom((value, { req }) => {
    if (req.body.accountType === AccountType.BUSINESS) {
        return businessNameValidationRule.run(req);
    }
    return true;
});
const businessEmailCustomValidationRule = body('accountType').custom((value, { req }) => {
    if (req.body.accountType === AccountType.BUSINESS) {
        return businessEmailValidationRule.run(req);
    }
    return true;
});
const businessNumberCustomValidationRule = body('accountType').custom((value, { req }) => {
    if (req.body.accountType === AccountType.BUSINESS) {
        return businessPhoneNumberValidationRule.run(req);
    }
    return true;
});
const businessDialCodeCustomValidationRule = body('accountType').custom((value, { req }) => {
    if (req.body.accountType === AccountType.BUSINESS) {
        return businessDialCodeValidationRule.run(req);
    }
    return true;
});
const businessTypeCustomValidationRule = body('accountType').custom((value, { req }) => {
    if (req.body.accountType === AccountType.BUSINESS) {
        return businessTypeValidationRule.run(req);
    }
    return true;
});
const businessDescriptionCustomValidationRule = body('accountType').custom((value, { req }) => {
    if (req.body.accountType === AccountType.BUSINESS) {
        return bioValidationRule.run(req);
    }
    return true;
});
const businessSubTypeCustomValidationRule = body('accountType').custom((value, { req }) => {
    if (req.body.accountType === AccountType.BUSINESS) {
        return businessSubTypeValidationRule.run(req);
    }
    return true;
});

const countryCustomValidationRule = body('accountType').custom((value, { req }) => {
    if (req.body.accountType === AccountType.BUSINESS) {
        return countryValidationRule.run(req);
    }
    return true;
});
const zipCodeCustomValidationRule = body('accountType').custom((value, { req }) => {
    if (req.body.accountType === AccountType.BUSINESS) {
        return zipCodeValidationRule.run(req);
    }
    return true;
});
const stateCustomValidationRule = body('accountType').custom((value, { req }) => {
    if (req.body.accountType === AccountType.BUSINESS) {
        return stateValidationRule.run(req);
    }
    return true;
});
const cityCustomValidationRule = body('accountType').custom((value, { req }) => {
    if (req.body.accountType === AccountType.BUSINESS) {
        return cityValidationRule.run(req);
    }
    return true;
});
const streetCustomValidationRule = body('accountType').custom((value, { req }) => {
    if (req.body.accountType === AccountType.BUSINESS) {
        return streetValidationRule.run(req);
    }
    return true;
});
const latCustomValidationRule = body('accountType').custom((value, { req }) => {
    if (req.body.accountType === AccountType.BUSINESS) {
        return latValidationRule.run(req);
    }
    return true;
});
const lngCustomValidationRule = body('accountType').custom((value, { req }) => {
    if (req.body.accountType === AccountType.BUSINESS) {
        return lngValidationRule.run(req);
    }
    return true;
});
const placeIDCustomValidationRule = body('placeID').custom((value, { req }) => {
    if (req.body.accountType === AccountType.BUSINESS) {
        return placeIDValidationRule.run(req);
    }
    return true;
});
/** Api validation rule for Api */
export const loginApiValidator = [
    emailValidationRule,
    passwordValidationRule,
    deviceIDValidationRule,
    notificationTokenValidationRule,
    devicePlatformValidationRule
];
export const signUpApiValidator = [
    accountTypeValidationRule,
    dialCodeValidationRule,
    emailValidationRule,
    phoneNumberValidationRule,
    nameValidationRule,
    strongPasswordValidationRule,

    /** Business Profile Data */
    businessTypeCustomValidationRule,
    businessNameCustomValidationRule,
    businessEmailCustomValidationRule,
    businessNumberCustomValidationRule,
    businessDialCodeCustomValidationRule,
    businessDescriptionCustomValidationRule,
    businessSubTypeCustomValidationRule,
    /** Business Address */
    streetCustomValidationRule,
    cityCustomValidationRule,
    stateCustomValidationRule,
    zipCodeCustomValidationRule,
    countryCustomValidationRule,
    latCustomValidationRule,
    lngCustomValidationRule,

    //Place ID //TODO For what?
    placeIDCustomValidationRule
]
export const verifyEmailApiValidator = [
    emailValidationRule,
    otpValidationRule,
    deviceIDValidationRule,
    notificationTokenValidationRule,
    devicePlatformValidationRule
];

export const createLikesApiValidator = [
    paramIDValidationRule,
];
export const savedPostApiValidator = [
    paramIDValidationRule,
];

export const createCommentApiValidator = [
    postIDValidationRule,
    messageValidationRule,
]

export enum Types {
    EMAIL_VERIFICATION = "email-verification",
    FORGOT_PASSWORD = "forgot-password"
}
const TypesValue = Object.values(Types);
export const resendOTPApiValidator = [
    emailValidationRule,
    body("type", "Type is required field.").exists().bail().notEmpty().bail().isIn(TypesValue).withMessage(`Type must be in  ${TypesValue.join(' | ')}`)
];

export const forgotPasswordApiValidator = [
    emailValidationRule,
];
export const verifyOTPApiValidator = [
    emailValidationRule,
    otpValidationRule,
];
export const resetPasswordApiValidator = [
    emailValidationRule,
    strongPasswordValidationRule,
    body("resetToken", "Reset token is required field.").exists().bail().notEmpty().bail()
]
export const businessQuestionsApiValidator = [
    businessTypeIDValidationRule,
    businessSubtypeIDValidationRule
]

export const businessQuestionAnswerApiValidator = [
    questionsIDsValidationRule
]
export enum EventType {
    ONLINE = 'online',
    OFFLINE = 'offline',
}
const EventTypeValue = Object.values(EventType);
export const createEventApiValidator = [
    nameValidationRule,
    descriptionValidationRule,
    body("startDate", "Start date is required field.").exists().bail().notEmpty().bail().isDate({
        format: 'YYYY-MM-DD',
        delimiters: ['-'],
    }).withMessage("Invalid date. Please use YYYY-MM-DD format"),
    body("endDate", "End date is required field.").exists().bail().notEmpty().bail().isDate({
        format: 'YYYY-MM-DD',
        delimiters: ['-'],
    }).withMessage("Invalid date. Please use YYYY-MM-DD format"),
    body("startTime", "Start time is required field.").exists().bail().notEmpty().bail().isTime({
        hourFormat: 'hour24',
    }).withMessage("Invalid time. Please use HH:MM:SS format"),
    body("endTime", "End time is required field.").exists().bail().notEmpty().bail().isTime({
        hourFormat: 'hour24',
    }).withMessage("Invalid time. Please use HH:MM:SS format"),
    body("type", "Type is required field.").exists().bail().notEmpty().bail().isIn(EventTypeValue).withMessage(`Type must be in  ${EventTypeValue.join(' | ')}`),
    body('type').custom((value, { req }) => {
        if (value === EventType.OFFLINE) {
            return body("venue", "Event venue is required field.").exists().bail().notEmpty().bail().run(req);
        }
        if (value === EventType.ONLINE) {
            return body("streamingLink", "Streaming link is required field.").exists().bail().notEmpty().bail().run(req);
        }
        return true;
    }),

]

// export const subscriptionPlansApiValidator = [
//     businessTypeIDValidationRule,
//     businessSubtypeIDValidationRule
// ]

export const subscriptionCheckoutApiValidator = [
    subscriptionPlanIDValidationRule
]
export const buySubscriptionApiValidator = [
    body("orderID", "Order ID is required field.").exists().bail().notEmpty().bail(),
    body("paymentID", "Payment ID is required field.").exists().bail().notEmpty().bail(),
    body("signature", "Payment Signature is required field.").exists().bail().notEmpty().bail(),
]


export enum Type {
    WEBSITE_REDIRECTION = 'website-redirection',
    ACCOUNT_REACH = "account-reach"
}
const TypeValue = Object.values(Type);
export const collectDataApiValidator = [

    body("type", "Type is required field.").exists().bail().notEmpty().bail().isIn(TypeValue).withMessage(`Type must be in  ${TypeValue.join(' | ')}`),
    body('type').custom((value, { req }) => {
        if (value === Type.WEBSITE_REDIRECTION) {
            return body("businessProfileID", "Business profile is required for website redirection.").exists().bail().notEmpty().bail().run(req);
        }
        return true;
    }),
]
const ContentTypeValue = Object.values(ContentType);
export const reportContentApiValidator = [
    body("contentType", "Content Type is required field.").exists().bail().notEmpty().bail().isIn(ContentTypeValue).withMessage(`Content Type must be in  ${ContentTypeValue.join(' | ')}`),
    body("contentID", "Content ID is required field.").exists().bail().notEmpty().bail().isMongoId().withMessage('Invalid ID'),
]

export const createContactApiValidator = [
    nameValidationRule,
    emailValidationRule,
    messageValidationRule,
];

export const createQuestionApiValidator = [
    questionValidationRule,
    questionTypeValidationRule,
    answerValidationRule
]
export const joinEventApiValidator = [
    postIDValidationRule
]

export const createSubscriptionPlanApiValidator = [
    nameValidationRule,
    descriptionValidationRule,
    priceValidationRule,
    levelValidationRule,
    durationValidationRule,
    currencyValidationRule,
    subscriptionTypeValidationRule,


]