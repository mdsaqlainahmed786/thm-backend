"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicReviewApiValidator = exports.createPromoCodeApiValidator = exports.createRoomApiValidator = exports.bookBanquetApiValidator = exports.bookTableApiValidator = exports.confirmCheckoutApiValidator = exports.checkoutApiValidator = exports.createPricePresetApiValidator = exports.checkInApiValidator = exports.createAmenityApiValidator = exports.createSubscriptionPlanApiValidator = exports.joinEventApiValidator = exports.createQuestionApiValidator = exports.createContactApiValidator = exports.collectInsightsDataApiValidator = exports.buySubscriptionApiValidator = exports.subscriptionCheckoutApiValidator = exports.createAddressApiValidator = exports.createEventApiValidator = exports.EventType = exports.businessQuestionAnswerApiValidator = exports.mediaMessageApiValidator = exports.createReviewQuestionApiValidator = exports.businessQuestionsApiValidator = exports.resetPasswordApiValidator = exports.verifyOTPApiValidator = exports.mobileVerifyOTPApiValidator = exports.mobileRequestOTPApiValidator = exports.forgotPasswordApiValidator = exports.resendOTPApiValidator = exports.Types = exports.createCommentApiValidator = exports.savedPostApiValidator = exports.createLikesApiValidator = exports.verifyEmailApiValidator = exports.signUpApiValidator = exports.loginApiValidator = exports.messageValidationRule = exports.mediaIDValidationRule = exports.postIDValidationRule = exports.bookingStatusValidationRule = exports.paramIDValidationRule = exports.placeIDValidationRule = exports.bioValidationRule = exports.businessDialCodeValidationRule = exports.businessPhoneNumberValidationRule = exports.businessEmailValidationRule = exports.businessNameValidationRule = exports.businessSubTypeValidationRule = exports.businessTypeValidationRule = void 0;
exports.createJobApiValidator = exports.createMediaViewsApiValidator = exports.socialLoginApiValidator = void 0;
const common_validation_1 = require("./../common-validation");
const common_1 = require("../../common");
const booking_model_1 = require("../../database/models/booking.model");
const express_validator_1 = require("express-validator");
const user_model_1 = require("../../database/models/user.model");
const pricePreset_model_1 = require("../../database/models/pricePreset.model");
exports.businessTypeValidationRule = (0, express_validator_1.body)('businessType', 'Business type is a required field.').exists().bail().notEmpty().bail().isMongoId().withMessage('Invalid business type');
exports.businessSubTypeValidationRule = (0, express_validator_1.body)('businessSubType', 'Business sub type is a required field.').exists().bail().notEmpty().bail().isMongoId().withMessage('Invalid business subtype');
exports.businessNameValidationRule = (0, express_validator_1.body)('businessName', 'Business name is a required field.').exists().bail().notEmpty().bail();
exports.businessEmailValidationRule = (0, express_validator_1.body)("businessEmail", "Business email is a required field.").exists().bail().notEmpty().bail().isEmail().withMessage("Please enter valid email address.");
exports.businessPhoneNumberValidationRule = (0, express_validator_1.body)("businessPhoneNumber", "Business phone number is a required field.").exists().bail().notEmpty().bail().isInt().withMessage("Phone number must be an integer value.");
exports.businessDialCodeValidationRule = (0, express_validator_1.body)("businessDialCode", "Business dial code is a required field.").exists().bail().notEmpty().bail().isNumeric().withMessage("Dial code must be an integer with + sign, like +1.");
exports.bioValidationRule = (0, express_validator_1.body)('bio', 'Business description is a required field.').exists().bail().notEmpty().bail();
exports.placeIDValidationRule = (0, express_validator_1.body)('placeID', 'Place ID is a required field.').exists().bail().notEmpty().bail();
exports.paramIDValidationRule = (0, express_validator_1.param)("id", 'ID is a required field.').exists().bail().notEmpty().bail().isMongoId().withMessage('Invalid ID');
const BookingStatusValue = Object.values(booking_model_1.BookingStatus);
exports.bookingStatusValidationRule = (0, express_validator_1.body)("status", 'Status is a required field.').exists().bail().notEmpty().bail().isIn(BookingStatusValue).withMessage(`Status must be in ${BookingStatusValue.join(' | ')}`);
exports.postIDValidationRule = (0, express_validator_1.body)("postID", 'Post ID is required field.').exists().bail().notEmpty().bail().isMongoId().withMessage('Invalid ID');
exports.mediaIDValidationRule = (0, express_validator_1.body)("mediaID", 'Media ID is required field.').exists().bail().notEmpty().bail().isMongoId().withMessage('Invalid ID');
exports.messageValidationRule = (0, express_validator_1.body)("message", "Message is required field.").exists().bail().notEmpty().bail();
const businessNameCustomValidationRule = (0, express_validator_1.body)('accountType').custom((value, { req }) => {
    if (req.body.accountType === user_model_1.AccountType.BUSINESS) {
        return exports.businessNameValidationRule.run(req);
    }
    return true;
});
const businessEmailCustomValidationRule = (0, express_validator_1.body)('accountType').custom((value, { req }) => {
    if (req.body.accountType === user_model_1.AccountType.BUSINESS) {
        return exports.businessEmailValidationRule.run(req);
    }
    return true;
});
const businessNumberCustomValidationRule = (0, express_validator_1.body)('accountType').custom((value, { req }) => {
    if (req.body.accountType === user_model_1.AccountType.BUSINESS) {
        return exports.businessPhoneNumberValidationRule.run(req);
    }
    return true;
});
const businessDialCodeCustomValidationRule = (0, express_validator_1.body)('accountType').custom((value, { req }) => {
    if (req.body.accountType === user_model_1.AccountType.BUSINESS) {
        return exports.businessDialCodeValidationRule.run(req);
    }
    return true;
});
const businessTypeCustomValidationRule = (0, express_validator_1.body)('accountType').custom((value, { req }) => {
    if (req.body.accountType === user_model_1.AccountType.BUSINESS) {
        return exports.businessTypeValidationRule.run(req);
    }
    return true;
});
const businessDescriptionCustomValidationRule = (0, express_validator_1.body)('accountType').custom((value, { req }) => {
    if (req.body.accountType === user_model_1.AccountType.BUSINESS) {
        return exports.bioValidationRule.run(req);
    }
    return true;
});
const businessSubTypeCustomValidationRule = (0, express_validator_1.body)('accountType').custom((value, { req }) => {
    if (req.body.accountType === user_model_1.AccountType.BUSINESS) {
        return exports.businessSubTypeValidationRule.run(req);
    }
    return true;
});
const countryCustomValidationRule = (0, express_validator_1.body)('accountType').custom((value, { req }) => {
    if (req.body.accountType === user_model_1.AccountType.BUSINESS) {
        return common_validation_1.countryValidationRule.run(req);
    }
    return true;
});
const zipCodeCustomValidationRule = (0, express_validator_1.body)('accountType').custom((value, { req }) => {
    if (req.body.accountType === user_model_1.AccountType.BUSINESS) {
        return common_validation_1.zipCodeValidationRule.run(req);
    }
    return true;
});
const stateCustomValidationRule = (0, express_validator_1.body)('accountType').custom((value, { req }) => {
    if (req.body.accountType === user_model_1.AccountType.BUSINESS) {
        return common_validation_1.stateValidationRule.run(req);
    }
    return true;
});
const cityCustomValidationRule = (0, express_validator_1.body)('accountType').custom((value, { req }) => {
    if (req.body.accountType === user_model_1.AccountType.BUSINESS) {
        return common_validation_1.cityValidationRule.run(req);
    }
    return true;
});
const streetCustomValidationRule = (0, express_validator_1.body)('accountType').custom((value, { req }) => {
    if (req.body.accountType === user_model_1.AccountType.BUSINESS) {
        return common_validation_1.streetValidationRule.run(req);
    }
    return true;
});
const latCustomValidationRule = (0, express_validator_1.body)('accountType').custom((value, { req }) => {
    if (req.body.accountType === user_model_1.AccountType.BUSINESS) {
        return common_validation_1.latValidationRule.run(req);
    }
    return true;
});
const lngCustomValidationRule = (0, express_validator_1.body)('accountType').custom((value, { req }) => {
    if (req.body.accountType === user_model_1.AccountType.BUSINESS) {
        return common_validation_1.lngValidationRule.run(req);
    }
    return true;
});
const placeIDCustomValidationRule = (0, express_validator_1.body)('placeID').custom((value, { req }) => {
    if (req.body.accountType === user_model_1.AccountType.BUSINESS) {
        return exports.placeIDValidationRule.run(req);
    }
    return true;
});
/** Api validation rule for Api */
exports.loginApiValidator = [
    common_validation_1.emailValidationRule,
    common_validation_1.passwordValidationRule,
    common_validation_1.deviceIDValidationRule,
    common_validation_1.notificationTokenValidationRule,
    common_validation_1.devicePlatformValidationRule
];
exports.signUpApiValidator = [
    common_validation_1.accountTypeValidationRule,
    common_validation_1.dialCodeValidationRule,
    common_validation_1.emailValidationRule,
    common_validation_1.phoneNumberValidationRule,
    common_validation_1.nameValidationRule,
    common_validation_1.strongPasswordValidationRule,
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
];
exports.verifyEmailApiValidator = [
    common_validation_1.emailValidationRule,
    common_validation_1.otpValidationRule,
    common_validation_1.deviceIDValidationRule,
    common_validation_1.notificationTokenValidationRule,
    common_validation_1.devicePlatformValidationRule
];
exports.createLikesApiValidator = [
    exports.paramIDValidationRule,
];
exports.savedPostApiValidator = [
    exports.paramIDValidationRule,
];
exports.createCommentApiValidator = [
    exports.postIDValidationRule,
    exports.messageValidationRule,
];
var Types;
(function (Types) {
    Types["EMAIL_VERIFICATION"] = "email-verification";
    Types["FORGOT_PASSWORD"] = "forgot-password";
})(Types || (exports.Types = Types = {}));
const TypesValue = Object.values(Types);
exports.resendOTPApiValidator = [
    common_validation_1.emailValidationRule,
    (0, express_validator_1.body)("type", "Type is required field.").exists().bail().notEmpty().bail().isIn(TypesValue).withMessage(`Type must be in ${TypesValue.join(' | ')}`)
];
exports.forgotPasswordApiValidator = [
    common_validation_1.emailValidationRule,
];
exports.mobileRequestOTPApiValidator = [
    common_validation_1.dialCodeValidationRule,
    common_validation_1.phoneNumberValidationRule,
];
exports.mobileVerifyOTPApiValidator = [
    common_validation_1.dialCodeValidationRule,
    common_validation_1.phoneNumberValidationRule,
    common_validation_1.otpValidationRule,
];
exports.verifyOTPApiValidator = [
    common_validation_1.emailValidationRule,
    common_validation_1.otpValidationRule,
];
exports.resetPasswordApiValidator = [
    common_validation_1.emailValidationRule,
    common_validation_1.strongPasswordValidationRule,
    (0, express_validator_1.body)("resetToken", "Reset token is required field.").exists().bail().notEmpty().bail()
];
exports.businessQuestionsApiValidator = [
    common_validation_1.businessTypeIDValidationRule,
    common_validation_1.businessSubtypeIDValidationRule
];
exports.createReviewQuestionApiValidator = [
    common_validation_1.questionValidationRule,
    common_validation_1.businessTypeIDValidationRule,
    common_validation_1.businessSubtypeIDValidationRule
];
exports.mediaMessageApiValidator = [
    common_validation_1.usernameValidationRule,
    common_validation_1.messageTypeValidationRule
];
exports.businessQuestionAnswerApiValidator = [
    common_validation_1.questionsIDsValidationRule
];
var EventType;
(function (EventType) {
    EventType["ONLINE"] = "online";
    EventType["OFFLINE"] = "offline";
})(EventType || (exports.EventType = EventType = {}));
const EventTypeValue = Object.values(EventType);
exports.createEventApiValidator = [
    common_validation_1.nameValidationRule,
    common_validation_1.descriptionValidationRule,
    (0, express_validator_1.body)("startDate", "Start date is required field.").exists().bail().notEmpty().bail().isDate({
        format: 'YYYY-MM-DD',
        delimiters: ['-'],
    }).withMessage("Invalid date. Please use YYYY-MM-DD format"),
    (0, express_validator_1.body)("endDate", "End date is required field.").exists().bail().notEmpty().bail().isDate({
        format: 'YYYY-MM-DD',
        delimiters: ['-'],
    }).withMessage("Invalid date. Please use YYYY-MM-DD format"),
    (0, express_validator_1.body)("startTime", "Start time is required field.").exists().bail().notEmpty().bail().isTime({
        hourFormat: 'hour24',
    }).withMessage("Invalid time. Please use HH:MM:SS format"),
    (0, express_validator_1.body)("endTime", "End time is required field.").exists().bail().notEmpty().bail().isTime({
        hourFormat: 'hour24',
    }).withMessage("Invalid time. Please use HH:MM:SS format"),
    (0, express_validator_1.body)("type", "Type is required field.").exists().bail().notEmpty().bail().isIn(EventTypeValue).withMessage(`Type must be in ${EventTypeValue.join(' | ')}`),
    (0, express_validator_1.body)('type').custom((value, { req }) => {
        if (value === EventType.OFFLINE) {
            return (0, express_validator_1.body)("venue", "Event venue is required field.").exists().bail().notEmpty().bail().run(req);
        }
        if (value === EventType.ONLINE) {
            return (0, express_validator_1.body)("streamingLink", "Streaming link is required field.").exists().bail().notEmpty().bail().run(req);
        }
        return true;
    }),
];
exports.createAddressApiValidator = [
    common_validation_1.streetValidationRule,
    common_validation_1.cityValidationRule,
    common_validation_1.stateValidationRule,
    common_validation_1.zipCodeValidationRule,
    common_validation_1.countryValidationRule,
    common_validation_1.latValidationRule,
    common_validation_1.lngValidationRule
];
// export const subscriptionPlansApiValidator = [
//     businessTypeIDValidationRule,
//     businessSubtypeIDValidationRule
// ]
exports.subscriptionCheckoutApiValidator = [
    common_validation_1.subscriptionPlanIDValidationRule
];
exports.buySubscriptionApiValidator = [
    (0, express_validator_1.body)("orderID", "Order ID is required field.").exists().bail().notEmpty().bail(),
    (0, express_validator_1.body)("paymentID", "Payment ID is required field.").exists().bail().notEmpty().bail(),
    (0, express_validator_1.body)("signature", "Payment Signature is required field.").exists().bail().notEmpty().bail(),
];
const TypeValue = Object.values(common_1.InsightType);
exports.collectInsightsDataApiValidator = [
    (0, express_validator_1.body)("type", "Type is required field.").exists().bail().notEmpty().bail().isIn(TypeValue).withMessage(`Type must be in ${TypeValue.join(' | ')}`),
    (0, express_validator_1.body)('type').custom((value, { req }) => {
        if (value === common_1.InsightType.WEBSITE_REDIRECTION) {
            return (0, express_validator_1.body)("businessProfileID", "Business profile is required for website redirection.").exists().bail().notEmpty().bail().run(req);
        }
        return true;
    }),
];
exports.createContactApiValidator = [
    common_validation_1.nameValidationRule,
    common_validation_1.emailValidationRule,
    exports.messageValidationRule,
];
exports.createQuestionApiValidator = [
    common_validation_1.questionValidationRule,
    common_validation_1.questionTypeValidationRule,
    common_validation_1.answerValidationRule
];
exports.joinEventApiValidator = [
    exports.postIDValidationRule
];
exports.createSubscriptionPlanApiValidator = [
    common_validation_1.nameValidationRule,
    common_validation_1.descriptionValidationRule,
    common_validation_1.priceValidationRule,
    common_validation_1.levelValidationRule,
    common_validation_1.durationValidationRule,
    common_validation_1.currencyValidationRule,
    common_validation_1.subscriptionTypeValidationRule,
];
exports.createAmenityApiValidator = [
    common_validation_1.nameValidationRule,
];
exports.checkInApiValidator = [
    common_validation_1.businessProfileIDValidationRule
];
const PricePresetTypeValue = Object.values(pricePreset_model_1.PricePresetType);
exports.createPricePresetApiValidator = [
    (0, express_validator_1.body)('type', 'Price preset type is required field').exists().bail().notEmpty().bail().isIn(PricePresetTypeValue).withMessage(`Type must be in ${PricePresetTypeValue.join(' | ')}`),
    (0, express_validator_1.body)('price', 'Price percentage is required field').exists().bail().notEmpty().bail().isDecimal({ decimal_digits: '2', force_decimal: true, }).withMessage('Price percentage is integer field.'),
    (0, express_validator_1.body)('weekendPrice', 'Weekend price percentage is required field').exists().bail().notEmpty().bail().isDecimal({ decimal_digits: '2', force_decimal: true }).withMessage('Price percentage is integer field.'),
    (0, express_validator_1.body)('type').custom((value, { req }) => {
        if (req.body.type === pricePreset_model_1.PricePresetType.QUARTERLY || value === pricePreset_model_1.PricePresetType.MONTHLY) {
            return (0, express_validator_1.body)("months", "Start Month is required field.").isArray({ min: 1 }) // Must be an array with at least one item
                .withMessage('Tags must be an array with at least one item');
            // .exists().bail().notEmpty().bail().isInt({ min: 0, max: 11 }).withMessage('Month value should be between 1 and 12.').run(req)
        }
        // if (req.body.type === PricePresetType.CUSTOM) {
        //     return body("startDate", "Start date is required field.").exists().bail().notEmpty().bail()
        //         .isDate({ format: 'YYYY/MM/DD' }).withMessage("Start date must be in 'YYYY/MM/DD' format.").run(req)
        // }
        // if (req.body.type === PricePresetType.CUSTOM) {
        //     return body("endDate", "End date is required field.").exists().bail().notEmpty().bail()
        //         .isDate({ format: 'YYYY/MM/DD' }).withMessage("End date must be in 'YYYY/MM/DD' format.").run(req)
        // }
        // if (req.body.type === PricePresetType.QUARTERLY || value === PricePresetType.MONTHLY) {
        //     return body("endMonth", "End Month is required field.").exists().bail().notEmpty().bail().isInt({ min: 0, max: 11 }).withMessage('Month value should be between 1 and 12.').run(req)
        // }
        return true;
    }),
];
const BookedForValues = Object.values(common_1.BookedFor);
exports.checkoutApiValidator = [
    common_validation_1.roomIDValidationRule,
    common_validation_1.bookingIDValidationRule,
    (0, express_validator_1.body)('bookedFor', 'Booking for is required field').exists().bail().notEmpty().bail().isIn(BookedForValues).withMessage(`Type must be in ${BookedForValues.join(' | ')}`),
    common_validation_1.quantityValidationRule,
];
exports.confirmCheckoutApiValidator = [
    common_validation_1.bookingIDValidationRule,
    (0, express_validator_1.body)("paymentID", "Payment ID is required field.").exists().bail().notEmpty().bail(),
    (0, express_validator_1.body)("signature", "Payment Signature is required field.").exists().bail().notEmpty().bail(),
];
exports.bookTableApiValidator = [
    common_validation_1.businessProfileIDValidationRule,
    common_validation_1.numberOfGuestsValidationRule,
    (0, express_validator_1.body)("date", "Booking date is required field.").exists().bail().notEmpty().bail().isDate({
        format: 'YYYY-MM-DD',
        delimiters: ['-'],
    }).withMessage("Invalid date. Please use YYYY-MM-DD format"),
    (0, express_validator_1.body)("time", "Time is required field.").exists().bail().notEmpty().bail().isTime({
        hourFormat: 'hour24',
    }).withMessage("Invalid time. Please use HH:MM:SS format"),
];
exports.bookBanquetApiValidator = [
    common_validation_1.businessProfileIDValidationRule,
    common_validation_1.numberOfGuestsValidationRule,
    (0, express_validator_1.body)("checkIn", "Check In date is a required field.").exists().bail().notEmpty().bail().isDate({ format: 'YYYY/MM/DD' }).withMessage("Check In date must be in 'YYYY/MM/DD' format."),
    (0, express_validator_1.body)("checkOut", "Check In date is a required field.").exists().bail().notEmpty().bail().isDate({ format: 'YYYY/MM/DD' }).withMessage("Check In date must be in 'YYYY/MM/DD' format."),
    (0, express_validator_1.body)("typeOfEvent", "Type of Event is required field.").exists().bail().notEmpty().bail(),
];
exports.createRoomApiValidator = [
    common_validation_1.priceValidationRule,
    common_validation_1.currencyValidationRule,
    common_validation_1.childrenValidationRule,
    common_validation_1.adultsValidationRule,
    common_validation_1.bedTypeValidationRule,
    common_validation_1.roomTypeValidationRule,
    common_validation_1.mealPlanValidationRule,
    common_validation_1.totalRoomsValidationRule
];
exports.createPromoCodeApiValidator = [
    common_validation_1.nameValidationRule,
    common_validation_1.descriptionValidationRule,
    common_validation_1.codeValidationRule,
    common_validation_1.cartValueValidationRule,
    common_validation_1.valueValidationRule,
    common_validation_1.typeValidationRule,
    common_validation_1.priceTypeValidationRule,
    common_validation_1.validToValidationRule,
    common_validation_1.validFromValidationRule,
    common_validation_1.quantityValidationRule,
    common_validation_1.maxDiscountValidationRule,
    common_validation_1.redeemedCountValidationRule
];
exports.publicReviewApiValidator = [
    common_validation_1.nameValidationRule,
    common_validation_1.emailValidationRule,
    (0, express_validator_1.body)("content", "Review is required field.").exists().bail().notEmpty().bail(),
    (0, express_validator_1.body)("id", "Business ID is required field.").exists().bail().notEmpty().bail(),
];
exports.socialLoginApiValidator = [
    common_validation_1.socialTypeValidationRule,
    common_validation_1.deviceIDValidationRule,
    common_validation_1.notificationTokenValidationRule,
    common_validation_1.devicePlatformValidationRule
];
exports.createMediaViewsApiValidator = [
    exports.postIDValidationRule,
    exports.mediaIDValidationRule,
];
exports.createJobApiValidator = [
    common_validation_1.titleValidationRule,
    common_validation_1.descriptionValidationRule,
    common_validation_1.designationValidationRule,
    common_validation_1.jobTypeValidationRule,
    common_validation_1.salaryValidationRule,
    common_validation_1.joiningDateValidationRule,
    common_validation_1.numberOfVacanciesValidationRule,
    common_validation_1.experienceValidationRule,
];
