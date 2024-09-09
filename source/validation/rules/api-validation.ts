import { body } from "express-validator";
import { accountTypeValidationRule, businessSubtypeIDValidationRule, businessTypeIDValidationRule, cityValidationRule, countryValidationRule, deviceIDValidationRule, devicePlatformValidationRule, dialCodeValidationRule, emailValidationRule, fullNameValidationRule, latValidationRule, lngValidationRule, notificationTokenValidationRule, otpValidationRule, passwordValidationRule, phoneNumberValidationRule, questionsIDsValidationRule, stateValidationRule, streetValidationRule, strongPasswordValidationRule, zipCodeValidationRule } from "../common-validation";
import { AccountType } from "../../database/models/user.model";

export const businessTypeValidationRule = body('businessType', 'Business type is a required field.').exists().bail().notEmpty().bail().isMongoId().withMessage('Invalid business type');
export const businessSubTypeValidationRule = body('businessSubType', 'Business sub type is a required field.').exists().bail().notEmpty().bail().isMongoId().withMessage('Invalid business subtype');

export const businessNameValidationRule = body('businessName', 'Business name is a required field.').exists().bail().notEmpty().bail();
export const businessEmailValidationRule = body("businessEmail", "Business email is a required field.").exists().bail().notEmpty().bail().isEmail().withMessage("Please enter valid email address.");
export const businessPhoneNumberValidationRule = body("businessPhoneNumber", "Business phone number is a required field.").exists().bail().notEmpty().bail().isInt().withMessage("Phone number must be an integer value.");
export const businessDialCodeValidationRule = body("businessDialCode", "Business dial code is a required field.").exists().bail().notEmpty().bail().isNumeric().withMessage("Dial code must be an integer with + sign, like +1.");
export const businessDescriptionValidationRule = body('businessDescription', 'Business description is a required field.').exists().bail().notEmpty().bail();




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
        return businessDescriptionValidationRule.run(req);
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
    fullNameValidationRule,
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
    lngCustomValidationRule
]
export const verifyEmailApiValidator = [
    emailValidationRule,
    otpValidationRule,
    deviceIDValidationRule,
    notificationTokenValidationRule,
    devicePlatformValidationRule
];
export const resendOTPApiValidator = [
    emailValidationRule,
];

export const businessQuestionsApiValidator = [
    businessTypeIDValidationRule,
    businessSubtypeIDValidationRule
]

export const businessQuestionAnswerApiValidator = [
    questionsIDsValidationRule
]

// // import { CurrencyCode } from './../../database/models/connection-plan.model';

// import { connectionActionValidationRule, connectionIDValidationRule, lngValidationRule, passwordValidationRule, placeNameValidationRule } from './../common-validation';
// import { LogInWith, loginWithValidationRule, socialUIdValidationRule, socialTypeValidationRule, otpValidationRule, notificationTokenValidationRule, deviceIDValidationRule, devicePlatformValidationRule, latValidationRule } from "../common-validation";
// import { body, param } from "express-validator";
// import { emailValidationRule, phoneNumberValidationRule, dialCodeValidationRule } from "../common-validation";
// // import { MessageType } from '../../database/models/message.model';
// // import { QuestionType } from '../../database/models/question.model';
// // import { isArray } from '../../utils/helper/basic';
// // import { PaymentMethod } from '../../database/models/transaction.model';
// // import { SubscriptionLevel } from '../../database/models/subscription-plan.model';

// export enum UploadFor {
//     PROFILE_ONBOARDING = 'profile-on-boarding',
//     PROFILE = 'profile'
// }
// export enum QuestionPromptSetting {
//     CLOSE_THIS_TIME = "close-this-time",
//     NEVER_ASK_AGAIN = "never-ask-again"
// }

// /**
//  * Validation Rules 
//  */


// /**
//  * body fields validation
//  */
// // const MessageTypeValues = Object.values(MessageType);
// // const QuestionPromptSettingValues = Object.values(QuestionPromptSetting);
// // const subscriptionPlanIDValidationRule = body("subscriptionPlanID", "Subscription Plan ID is required field.").exists().bail().notEmpty().bail().isMongoId().withMessage('Invalid Subscription Plan ID');
// // const subscriptionIDValidationRule = body("subscriptionID", "Subscription ID is required field.").exists().bail().notEmpty().bail().isMongoId().withMessage('Invalid Subscription ID');
// // const favoriteIDValidationRule = body("favoriteID", "Favorite ID is required field.").exists().bail().notEmpty().bail().isMongoId().withMessage('Invalid Favorite ID');
// // const oldPositionValidationRule = body("oldPosition", "Old Position is required field.").exists().bail().notEmpty().bail().isNumeric().withMessage('Old Position is integer field');
// // const newPositionValidationRule = body("newPosition", "New Position is required field.").exists().bail().notEmpty().bail().isNumeric().withMessage('New Position is integer field');
// // const messageTypeValidationRule = body("messageType", "Message type is required field.").exists().bail().notEmpty().isIn(MessageTypeValues).withMessage(`Message type must be in ${MessageTypeValues.join(' | ')}`)
// // const usernameValidationRule = body("username", "Username is required field.").exists().bail().notEmpty().bail();
// // const creditValidationRule = body("credits", "Credits is required field.").exists().bail().notEmpty().bail().isInt().withMessage('Credits is integer field.');
// // const settingValidationRule = body("setting", "Setting is required field.").exists().bail().notEmpty().isIn(QuestionPromptSettingValues).withMessage(`Message type must be in ${QuestionPromptSettingValues.join(' | ')}`)
// const socialTypeCustomValidationRule = body('socialType').custom((value, { req }) => {
//     if (req.body.loginWith === LogInWith.SOCIAL) {
//         return socialTypeValidationRule.run(req);
//     }
//     return true;
// });
// const socialUIdCustomValidationRule = body('socialUID').custom((value, { req }) => {
//     if (req.body.loginWith === LogInWith.SOCIAL) {
//         return socialUIdValidationRule.run(req);
//     }
//     return true;
// });

// export const customEmailValidationRule = body('email').custom((value, { req }) => {
//     if (req.body.loginWith === LogInWith.EMAIL) {
//         return emailValidationRule.run(req);
//     }
//     return true;
// });
// export const customDialCodeValidationRule = body('dialCode').custom((value, { req }) => {
//     if (req.body.loginWith === LogInWith.PHONE) {
//         return dialCodeValidationRule.run(req);
//     }
//     return true;
// });
// export const customPhoneNumberValidationRule = body('phoneNumber').custom((value, { req }) => {
//     if (req.body.loginWith === LogInWith.PHONE) {
//         return phoneNumberValidationRule.run(req);
//     }
//     return true;
// });
// export const customEmailForSocialValidationRule = body('email').custom((value, { req }) => {
//     if (req.body.loginWith === LogInWith.SOCIAL) {
//         return emailValidationRule.run(req);
//     }
//     return true;
// });

// const SubscriptionLevelValues = Object.values(SubscriptionLevel);
// const PaymentMethodValues = Object.values(PaymentMethod);
// const UploadForValues = Object.values(UploadFor);
// const QuestionTypeValues = Object.values(QuestionType);
// const CurrencyCodeValues = Object.values(CurrencyCode);

// const paymentIDValidationRule = body("paymentID", "Payment ID is required field.").exists().bail().notEmpty().bail();
// const paymentMethodValidationRule = body("paymentMethod", "Payment method is required field.").exists().bail().notEmpty().bail().isIn(PaymentMethodValues).withMessage(`Payment method must be in ${PaymentMethodValues.join(' | ')}`);
// const titleValidationRule = body("title", "Title is required field.").exists().bail().notEmpty().bail();
// const amountValidationRule = body("amount", "Amount is required field.").exists().bail().notEmpty().bail().isDecimal({ decimal_digits: '2', force_decimal: true }).withMessage('Amount must be a decimal number with two decimal digits');
// const priceValidationRule = body("price", "Price is required field.").exists().bail().notEmpty().bail().isDecimal({ decimal_digits: '2', force_decimal: true }).withMessage('Price must be a decimal number with two decimal digits');
// const levelValidationRule = body("level", "Subscription type is required field.").exists().bail().notEmpty().bail().isIn(SubscriptionLevelValues).withMessage(`Subscription type must be in ${SubscriptionLevelValues.join(' | ')}`);
// const currencyValidationRule = body("currency", "Currency is required field.").exists().bail().notEmpty().bail().isIn(CurrencyCodeValues).withMessage(`Currency must be in ${CurrencyCodeValues.join(' | ')}`);
// const descriptionValidationRule = body("description", "Description type is required field.").exists().bail().notEmpty()
// const durationValidationRule = body("duration", "Duration is required field.").exists().bail().notEmpty().bail().isInt().withMessage('Duration is integer field like 30 or 356.');
// const uploadForValidationRule = body("uploadFor", "Upload For is required field.").exists().bail().notEmpty().bail().isIn(UploadForValues).withMessage(`Upload For must be in ${UploadForValues.join(' | ')}`);
// const highlightMediaValidationRule = body("highlightMedia", "Highlight Media is required field").isBoolean().withMessage("Highlight Media is a boolean (true | false) field.");

// const questionValidationRule = body("question", "Question is required field.").exists().bail().notEmpty().bail();
// const questionTypeValidationRule = body("type", "Question Type is required field.").exists().bail().notEmpty().bail().isIn(QuestionTypeValues).withMessage(`Question Type must be in ${QuestionTypeValues.join(' | ')}`);
// const questionTypeCustomValidationRule = questionTypeValidationRule.custom((value, { req }) => {
//     if (value === QuestionType.SINGLE_CHOICE) {
//         const isRequestHaveOptions = req.body.options;
//         const isRequestHaveAnswerTemplate = req.body.answerTemplate;
//         if (!isRequestHaveOptions) {
//             throw new Error(`If question type is '${value}' then Options is required field.`);
//         }
//         if (!isArray(isRequestHaveOptions)) {
//             throw new Error(`Options is Array field.`);
//         }
//         if (isArray(isRequestHaveOptions) && isRequestHaveOptions.length > 2) {
//             throw new Error(`Only two option is allowed.`);
//         }
//         if (!isRequestHaveAnswerTemplate) {
//             throw new Error(`If question type is '${value}' then Answer Template is required field.`);
//         }
//         const option1 = isRequestHaveOptions[0]?.toLowerCase();
//         const option2 = isRequestHaveOptions[1]?.toLowerCase();
//         const answer = isRequestHaveAnswerTemplate?.toLowerCase();
//         if (answer?.indexOf(option2) === -1) {
//             throw new Error(`Answer Template does not have required options.`);
//         }
//         if (answer?.indexOf(option1) === -1) {
//             throw new Error(`Answer Template does not have required options.`);
//         }
//         req.body.answerTemplate = answer?.replace(option1, '[option1]')?.replace(option2, '[option2]');
//     }
//     if (value === QuestionType.YES_NO) {
//         const isRequestYesTemplate = req.body.yesTemplate;
//         const isRequestNoTemplate = req.body.noTemplate;
//         if (!isRequestYesTemplate) {
//             throw new Error(`If question type is '${value}' then provide Yes answer template.`);
//         }
//         if (!isRequestNoTemplate) {
//             throw new Error(`If question type is '${value}' then provide No answer template.`);
//         }
//     }
//     return true;
// });
// export const questionIDValidationRule = body('questionID').isMongoId().withMessage('Invalid ID');
// export const answerValidationRule = body("answer", "Answer is required field.").exists().bail().notEmpty().bail().custom((value, { req }) => {
//     if (value === QuestionType.SINGLE_CHOICE) {
//         const isRequestHaveOptions = req.body.options;
//         if (!isRequestHaveOptions) {
//             // throw new Error(`If question type is '${value}' then Options is required field.`);
//         }
//         if (!isArray(isRequestHaveOptions)) {
//             // throw new Error(`Options is Array field.`);
//         }
//     }
//     if (value === QuestionType.YES_NO) {
//         const isRequestYesTemplate = req.body.yesTemplate;
//         const isRequestNoTemplate = req.body.noTemplate;
//         if (!isRequestYesTemplate) {
//             // throw new Error(`If question type is '${value}' then provide Yes answer template.`);
//         }
//         if (!isRequestNoTemplate) {
//             // throw new Error(`If question type is '${value}' then provide No answer template.`);
//         }
//     }
//     return true;
// });
// export const userIDValidationRule = body('userID', 'User ID is required field.').exists().bail().notEmpty().bail().isMongoId().withMessage('Invalid User ID');
// /**
//  * param fields validation
//  */
// export const paramUserIDValidationRule = param('userID').isMongoId().withMessage('Invalid User ID');
// export const paramIDValidationRule = param('id').isMongoId().withMessage('Invalid ID');
// /**
//  * api validation
//  */


// export const adminLoginApiValidator = [
//     emailValidationRule,
//     passwordValidationRule
// ];



// export const uploadMediaApiValidator = [
//     uploadForValidationRule,
// ];
// export const destroyUserMediaApiValidator = [
//     paramIDValidationRule
// ];
// export const highlightUserMediaApiValidator = [
//     paramIDValidationRule,
//     highlightMediaValidationRule
// ];
// export const homeApiValidator = [

// ]
// export const userInteractionApiValidator = [
//     paramUserIDValidationRule
// ];
// export const connectionActionApiValidator = [
//     connectionIDValidationRule,
//     connectionActionValidationRule
// ];
// export const reorderFavoriteApiValidator = [
//     favoriteIDValidationRule,
//     oldPositionValidationRule,
//     newPositionValidationRule
// ];
// export const mediaMessageApiValidator = [
//     messageTypeValidationRule,
//     usernameValidationRule
// ];
// export const createConnectionPlanApiValidator = [
//     titleValidationRule,
//     creditValidationRule,
//     amountValidationRule
// ];
// export const createGiftApiValidator = [
//     creditValidationRule,
// ];
// export const updateConnectionPlanApiValidator = [...createConnectionPlanApiValidator, paramIDValidationRule];
// export const createQuestionApiValidator = [
//     questionValidationRule,
//     questionTypeCustomValidationRule
// ];
// export const promptQuestionSettingApiValidator = [
//     settingValidationRule
// ]
// export const answerQuestionApiValidator = [
//     questionIDValidationRule,
//     answerValidationRule

// ];
// export const buySubscriptionApiValidation = [
//     subscriptionPlanIDValidationRule,
//     paymentIDValidationRule,
//     paymentMethodValidationRule,

// ];
// export const cancelSubscriptionApiValidation = [
//     subscriptionIDValidationRule,
// ]

// export const blockUserApiValidator = [
//     body('blockedUserID', "User ID is required").exists().bail().notEmpty().bail().isMongoId().withMessage('Invalid User ID')
// ];
// export const reportUserApiValidator = [
//     body('reportedUserID', "User ID is required").exists().bail().notEmpty().bail().isMongoId().withMessage('Invalid User ID'),
//     body('reason', 'Report reason is required')
// ];

// export const createSubscriptionApiValidation = [
//     titleValidationRule,
//     levelValidationRule,
//     priceValidationRule,
//     descriptionValidationRule,
//     currencyValidationRule,
//     durationValidationRule
// ]