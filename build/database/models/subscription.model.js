"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasBusinessSubscription = exports.hasActiveSubscription = void 0;
const mongoose_1 = require("mongoose");
const SubscriptionSchema = new mongoose_1.Schema({
    isCancelled: {
        type: Boolean,
        default: false,
    },
    orderID: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Order",
        required: true,
    },
    userID: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    businessProfileID: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "BusinessProfile",
    },
    subscriptionPlanID: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "SubscriptionPlan",
        required: true,
    },
    expirationDate: {
        type: Date,
        required: true
    },
}, {
    timestamps: true
});
SubscriptionSchema.set('toObject', { virtuals: true });
SubscriptionSchema.set('toJSON', { virtuals: true });
const Subscription = (0, mongoose_1.model)('Subscription', SubscriptionSchema);
exports.default = Subscription;
//Return Active Subscription based on user type
function hasActiveSubscription(userID) {
    return __awaiter(this, void 0, void 0, function* () {
        return Subscription.findOne({ userID: userID, expirationDate: { $gte: new Date() }, isCancelled: false });
    });
}
exports.hasActiveSubscription = hasActiveSubscription;
function hasBusinessSubscription(businessProfileID) {
    return __awaiter(this, void 0, void 0, function* () {
        return Subscription.findOne({ businessProfileID: businessProfileID, isCancelled: false }).sort({ createdAt: -1, id: 1 });
    });
}
exports.hasBusinessSubscription = hasBusinessSubscription;
