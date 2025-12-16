"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrencyCode = exports.SubscriptionDuration = exports.SubscriptionLevel = void 0;
const mongoose_1 = require("mongoose");
const user_model_1 = require("./user.model");
var SubscriptionLevel;
(function (SubscriptionLevel) {
    SubscriptionLevel["BASIC"] = "basic";
    SubscriptionLevel["STANDARD"] = "standard";
    SubscriptionLevel["PREMIUM"] = "premium";
})(SubscriptionLevel || (exports.SubscriptionLevel = SubscriptionLevel = {}));
var SubscriptionDuration;
(function (SubscriptionDuration) {
    SubscriptionDuration["MONTHLY"] = "monthly";
    SubscriptionDuration["QUARTERLY"] = "quarterly";
    SubscriptionDuration["YEARLY"] = "yearly";
    SubscriptionDuration["HALF_YEARLY"] = "half-yearly";
})(SubscriptionDuration || (exports.SubscriptionDuration = SubscriptionDuration = {}));
var CurrencyCode;
(function (CurrencyCode) {
    CurrencyCode["INR"] = "INR";
})(CurrencyCode || (exports.CurrencyCode = CurrencyCode = {}));
//FIXME add google purchase id or apple purchase id;
const SubscriptionPlanSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    currency: { type: String, required: true, enum: CurrencyCode },
    duration: { type: String, required: true }, // Duration in months, for example
    features: [{ type: String, required: true }],
    // isPopular: { type: Boolean, default: false },
    level: {
        type: String,
        enum: SubscriptionLevel, //is premium or not
        required: true,
    },
    image: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: user_model_1.AccountType,
        required: true,
    },
    businessSubtypeID: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "BusinessSubType"
        }
    ],
    businessTypeID: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "BusinessType"
        },
    ],
    googleSubscriptionID: { type: String, default: "" },
    appleSubscriptionID: { type: String, default: "" },
}, {
    timestamps: true
});
SubscriptionPlanSchema.set('toObject', { virtuals: true });
SubscriptionPlanSchema.set('toJSON', { virtuals: true });
const SubscriptionPlan = (0, mongoose_1.model)('SubscriptionPlan', SubscriptionPlanSchema);
exports.default = SubscriptionPlan;
