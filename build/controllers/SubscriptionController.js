"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const response_1 = require("../utils/response");
const user_model_1 = __importStar(require("../database/models/user.model"));
const error_1 = require("../utils/response-message/error");
const subscription_model_1 = __importStar(require("../database/models/subscription.model"));
const subscriptionPlan_model_1 = __importStar(require("../database/models/subscriptionPlan.model"));
const businessType_model_1 = __importDefault(require("../database/models/businessType.model"));
const businessSubType_model_1 = __importDefault(require("../database/models/businessSubType.model"));
const businessProfile_model_1 = __importDefault(require("../database/models/businessProfile.model"));
const moment_1 = __importDefault(require("moment"));
const promoCode_model_1 = __importStar(require("../database/models/promoCode.model"));
const order_model_1 = __importStar(require("../database/models/order.model"));
const RazorPayService_1 = __importDefault(require("../services/RazorPayService"));
const basic_1 = require("../utils/helper/basic");
const common_1 = require("../common");
const user_address_model_1 = __importDefault(require("../database/models/user-address.model"));
const EmailNotificationService_1 = __importDefault(require("../services/EmailNotificationService"));
const media_model_1 = require("../database/models/media.model");
const axios_1 = __importDefault(require("axios"));
const googleapis_1 = require("googleapis");
const GoogleAuthService_1 = require("../services/GoogleAuthService");
const razorPayService = new RazorPayService_1.default();
const emailNotificationService = new EmailNotificationService_1.default();
const googleAuthService = new GoogleAuthService_1.GoogleAuthService();
/**
 * @deprecate
 * This method is deprecated and may be removed in future versions.
 * Please use a verifyGooglePurchase method for subscription purchase.
 * @param request
 * @param response
 * @param next
 * @returns
 */
const buySubscription = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const { id } = request.user;
        const { orderID, paymentID, signature } = request.body;
        const [user, order] = yield Promise.all([
            user_model_1.default.findOne({ _id: id }),
            order_model_1.default.findOne({ orderID: orderID, status: order_model_1.OrderStatus.CREATED })
        ]);
        if (!user) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        if (!order) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest("Order not found"), "Order not found"));
        }
        const [subscriptionPlan, isPaymentVerified, razorPayOrder, payment] = yield Promise.all([
            subscriptionPlan_model_1.default.findOne({ _id: order.subscriptionPlanID }),
            razorPayService.verifyPayment(order.razorPayOrderID, paymentID, signature),
            razorPayService.fetchOrder(order.razorPayOrderID),
            razorPayService.fetchPayment(paymentID),
        ]);
        if (!subscriptionPlan) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.SUBSCRIPTION_NOT_FOUND), error_1.ErrorMessage.SUBSCRIPTION_NOT_FOUND));
        }
        if (!isPaymentVerified && razorPayOrder.status !== "paid") {
            return response.send((0, response_1.httpBadRequest)(error_1.ErrorMessage.invalidRequest("Payment not verified. please try again"), "Payment not verified. please try again"));
        }
        //FIXME remove console logs
        // console.log(isPaymentVerified);
        // console.log("\n\n\n")
        // console.log(razorPayOrder);
        // console.log("SUBSCRIPTION")
        // console.log(payment);
        // console.log("\n\n\n");
        order.status = order_model_1.OrderStatus.COMPLETED;
        const amount = parseInt(`${payment.amount}`) / 100;
        order.paymentDetail = {
            transactionID: payment.id,
            paymentMethod: payment.method,
            transactionAmount: (0, basic_1.parseFloatToFixed)(amount, 2)
        };
        yield order.save();
        const dbQuery = { userID: user.id, expirationDate: { $gt: new Date() }, isCancelled: false };
        if (user.accountType === user_model_1.AccountType.BUSINESS && user.businessProfileID) {
            Object.assign(dbQuery, { businessProfileID: user.businessProfileID });
        }
        const [hasSubscription, admins] = yield Promise.all([
            subscription_model_1.default.findOne(dbQuery),
            user_model_1.default.distinct('email', { role: common_1.Role.ADMINISTRATOR })
        ]);
        if (!hasSubscription) {
            const newSubscription = new subscription_model_1.default();
            newSubscription.businessProfileID = user.businessProfileID;
            newSubscription.userID = user.id;
            newSubscription.subscriptionPlanID = subscriptionPlan.id;
            newSubscription.orderID = order.id;
            switch (subscriptionPlan.duration) {
                case subscriptionPlan_model_1.SubscriptionDuration.YEARLY:
                    newSubscription.expirationDate = new Date((0, moment_1.default)().add(365, 'days').toString());
                    break;
                case subscriptionPlan_model_1.SubscriptionDuration.HALF_YEARLY:
                    newSubscription.expirationDate = new Date((0, moment_1.default)().add(182, 'days').toString());
                    break;
                case subscriptionPlan_model_1.SubscriptionDuration.QUARTERLY:
                    newSubscription.expirationDate = new Date((0, moment_1.default)().add(91, 'days').toString());
                    break;
                default:
                    newSubscription.expirationDate = new Date((0, moment_1.default)().add(30, 'days').toString());
            }
            const savedSubscription = yield newSubscription.save();
            console.log((0, moment_1.default)(order.createdAt).format('ddd DD, MMM YYYY hh:mm:ss A'));
            emailNotificationService.sendSubscriptionEmail({
                name: (_a = user.name) !== null && _a !== void 0 ? _a : user.username,
                toAddress: user.email,
                cc: admins,
                subscriptionName: `${subscriptionPlan.name} ₹${subscriptionPlan.price}`,
                orderID: order.orderID,
                purchaseDate: (0, moment_1.default)(order.createdAt).format('ddd DD, MMM YYYY hh:mm:ss A'),
                grandTotal: order.grandTotal.toString(),
                transactionID: order.paymentDetail.transactionID,
                paymentMethod: order.paymentDetail.paymentMethod
            });
            return response.send((0, response_1.httpOk)(savedSubscription, "Subscription added."));
        }
        hasSubscription.orderID = order.id;
        switch (subscriptionPlan.duration) {
            case subscriptionPlan_model_1.SubscriptionDuration.YEARLY:
                hasSubscription.expirationDate = new Date((0, moment_1.default)().add(365, 'days').toString());
                break;
            case subscriptionPlan_model_1.SubscriptionDuration.HALF_YEARLY:
                hasSubscription.expirationDate = new Date((0, moment_1.default)().add(182, 'days').toString());
                break;
            case subscriptionPlan_model_1.SubscriptionDuration.QUARTERLY:
                hasSubscription.expirationDate = new Date((0, moment_1.default)().add(91, 'days').toString());
                break;
            default:
                hasSubscription.expirationDate = new Date((0, moment_1.default)().add(30, 'days').toString());
        }
        hasSubscription.subscriptionPlanID = order.subscriptionPlanID;
        const savedSubscription = yield hasSubscription.save();
        console.log((0, moment_1.default)(order.createdAt).format('ddd DD, MMM YYYY hh:mm:ss A'));
        emailNotificationService.sendSubscriptionEmail({
            name: (_b = user.name) !== null && _b !== void 0 ? _b : user.username,
            toAddress: user.email,
            cc: admins,
            subscriptionName: `${subscriptionPlan.name} ₹${subscriptionPlan.price}`,
            orderID: order.orderID,
            purchaseDate: (0, moment_1.default)(order.createdAt).format('ddd DD, MMM YYYY hh:mm:ss A'),
            grandTotal: order.grandTotal.toString(),
            transactionID: order.paymentDetail.transactionID,
            paymentMethod: order.paymentDetail.paymentMethod
        });
        return response.send((0, response_1.httpOk)(savedSubscription, "Subscription updated."));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_c = error.message) !== null && _c !== void 0 ? _c : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const verifyGooglePurchase = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _d, _e, _f;
    try {
        const { id } = request.user;
        const { token, subscriptionID, orderID } = request.body;
        const [user, order] = yield Promise.all([
            user_model_1.default.findOne({ _id: id }),
            (0, order_model_1.fetchCreatedOrder)(orderID),
        ]);
        if (!user) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        if (!order) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest("Order not found"), "Order not found"));
        }
        const [subscriptionPlan, googleAuth] = yield Promise.all([
            subscriptionPlan_model_1.default.findOne({ _id: order.subscriptionPlanID }),
            googleAuthService.getAccessToken(),
        ]);
        if (!subscriptionPlan) {
            order.status = order_model_1.OrderStatus.FAILED;
            yield order.save();
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.SUBSCRIPTION_NOT_FOUND), error_1.ErrorMessage.SUBSCRIPTION_NOT_FOUND));
        }
        //The token provided to the user's device when the subscription was purchased.
        //The purchased subscription ID (for example, 'monthly001').
        const { auth } = googleAuth;
        const androidpublisher = googleapis_1.google.androidpublisher({
            version: 'v3',
            auth,
        });
        const packageName = "com.thehotelmedia.android";
        const { data } = yield androidpublisher.purchases.subscriptions.get({
            packageName,
            subscriptionId: subscriptionID,
            token,
        });
        console.log("Subscription Transaction DATA::", data);
        if (data) {
            const { paymentState, priceAmountMicros, priceCurrencyCode, orderId, startTimeMillis, expiryTimeMillis, acknowledgementState } = data;
            if (acknowledgementState && acknowledgementState === 0) {
                yield androidpublisher.purchases.subscriptions.acknowledge({
                    packageName,
                    subscriptionId: subscriptionID,
                    token,
                });
            }
            switch (paymentState) {
                case 0: //Payment pending 
                    order.status = order_model_1.OrderStatus.COMPLETED;
                    break;
                case 1: //Payment received
                    order.status = order_model_1.OrderStatus.COMPLETED;
                    break;
                case 2: //Free trial
                    order.status = order_model_1.OrderStatus.COMPLETED;
                    break;
                case 3: //Pending deferred upgrade / downgrade Not present for canceled, expired subscriptions.
                    order.status = order_model_1.OrderStatus.COMPLETED;
                    break;
            }
            const amount = parseInt(`${priceAmountMicros}`) / 1000000;
            order.paymentDetail = {
                transactionID: orderId !== null && orderId !== void 0 ? orderId : "google.purchases.subscriptions",
                paymentMethod: "google pay",
                transactionAmount: (0, basic_1.parseFloatToFixed)(amount, 2)
            };
            yield order.save();
            const dbQuery = { userID: user.id, expirationDate: { $gt: new Date() }, isCancelled: false };
            if (user.accountType === user_model_1.AccountType.BUSINESS && user.businessProfileID) {
                Object.assign(dbQuery, { businessProfileID: user.businessProfileID });
            }
            const [hasSubscription, admins] = yield Promise.all([
                subscription_model_1.default.findOne(dbQuery),
                user_model_1.default.distinct('email', { role: common_1.Role.ADMINISTRATOR })
            ]);
            if (!hasSubscription) {
                console.log("Does not have subscription man");
                const newSubscription = new subscription_model_1.default();
                newSubscription.businessProfileID = user.businessProfileID;
                newSubscription.userID = user.id;
                newSubscription.subscriptionPlanID = subscriptionPlan.id;
                newSubscription.orderID = order.id;
                switch (subscriptionPlan.duration) {
                    case subscriptionPlan_model_1.SubscriptionDuration.YEARLY:
                        newSubscription.expirationDate = new Date((0, moment_1.default)().add(365, 'days').toString());
                        break;
                    case subscriptionPlan_model_1.SubscriptionDuration.HALF_YEARLY:
                        newSubscription.expirationDate = new Date((0, moment_1.default)().add(182, 'days').toString());
                        break;
                    case subscriptionPlan_model_1.SubscriptionDuration.QUARTERLY:
                        newSubscription.expirationDate = new Date((0, moment_1.default)().add(91, 'days').toString());
                        break;
                    default:
                        newSubscription.expirationDate = new Date((0, moment_1.default)().add(30, 'days').toString());
                }
                const savedSubscription = yield newSubscription.save();
                console.log((0, moment_1.default)(order.createdAt).format('ddd DD, MMM YYYY hh:mm:ss A'));
                emailNotificationService.sendSubscriptionEmail({
                    name: (_d = user.name) !== null && _d !== void 0 ? _d : user.username,
                    toAddress: user.email,
                    cc: admins,
                    subscriptionName: `${subscriptionPlan.name} ₹${subscriptionPlan.price}`,
                    orderID: order.orderID,
                    purchaseDate: (0, moment_1.default)(order.createdAt).format('ddd DD, MMM YYYY hh:mm:ss A'),
                    grandTotal: order.grandTotal.toString(),
                    transactionID: order.paymentDetail.transactionID,
                    paymentMethod: order.paymentDetail.paymentMethod
                });
                return response.send((0, response_1.httpOk)(savedSubscription, "Subscription added."));
            }
            console.log("Have old subscription");
            hasSubscription.orderID = order.id;
            switch (subscriptionPlan.duration) {
                case subscriptionPlan_model_1.SubscriptionDuration.YEARLY:
                    hasSubscription.expirationDate = new Date((0, moment_1.default)().add(365, 'days').toString());
                    break;
                case subscriptionPlan_model_1.SubscriptionDuration.HALF_YEARLY:
                    hasSubscription.expirationDate = new Date((0, moment_1.default)().add(182, 'days').toString());
                    break;
                case subscriptionPlan_model_1.SubscriptionDuration.QUARTERLY:
                    hasSubscription.expirationDate = new Date((0, moment_1.default)().add(91, 'days').toString());
                    break;
                default:
                    hasSubscription.expirationDate = new Date((0, moment_1.default)().add(30, 'days').toString());
            }
            hasSubscription.subscriptionPlanID = order.subscriptionPlanID;
            const savedSubscription = yield hasSubscription.save();
            console.log((0, moment_1.default)(order.createdAt).format('ddd DD, MMM YYYY hh:mm:ss A'));
            emailNotificationService.sendSubscriptionEmail({
                name: (_e = user.name) !== null && _e !== void 0 ? _e : user.username,
                toAddress: user.email,
                cc: admins,
                subscriptionName: `${subscriptionPlan.name} ₹${subscriptionPlan.price}`,
                orderID: order.orderID,
                purchaseDate: (0, moment_1.default)(order.createdAt).format('ddd DD, MMM YYYY hh:mm:ss A'),
                grandTotal: order.grandTotal.toString(),
                transactionID: order.paymentDetail.transactionID,
                paymentMethod: order.paymentDetail.paymentMethod
            });
            return response.send((0, response_1.httpOk)(savedSubscription, "Subscription updated."));
        }
        order.status = order_model_1.OrderStatus.FAILED;
        yield order.save();
        return response.send((0, response_1.httpBadRequest)(null, "Purchased failed."));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_f = error.message) !== null && _f !== void 0 ? _f : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const subscriptionNotification = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _g;
    try {
        const notification = request.body;
        console.log("subscriptionNotification", notification);
        // Check for the subscription renewal event in the notification
        if (notification.subscriptionNotification) {
            const { subscriptionId, purchaseToken, eventTimeMillis, notificationType } = notification.subscriptionNotification;
            if (notificationType === 'SUBSCRIPTION_RENEWED') {
                console.log(`Subscription ${subscriptionId} renewed. Purchase token: ${purchaseToken}`);
                // Process renewal (e.g., update user status)
            }
            else if (notificationType === 'SUBSCRIPTION_CANCELLED') {
                console.log(`Subscription ${subscriptionId} cancelled. Purchase token: ${purchaseToken}`);
                // Process cancellation (e.g., revoke subscription features)
            }
        }
        // Respond to acknowledge receipt of the notification
        return response.status(200).send('Notification received');
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_g = error.message) !== null && _g !== void 0 ? _g : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const index = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _h;
    try {
        const hostAddress = request.protocol + "://" + request.get("host");
        const allBusinessCategory = yield businessType_model_1.default.find({});
        const subscriptions = yield subscriptionPlan_model_1.default.find({});
        const subscriptionLevelValues = Object.values(subscriptionPlan_model_1.SubscriptionLevel);
        if (subscriptions.length === 0) {
            //Individual subscription plans
            const newSubscriptionPlan1 = new subscriptionPlan_model_1.default();
            newSubscriptionPlan1.name = 'Free Plan';
            newSubscriptionPlan1.description = "The Free Plan is aimed at users who want an enhanced experience with additional features and no advertisements. This plan is ideal for normal";
            newSubscriptionPlan1.price = 0;
            newSubscriptionPlan1.duration = subscriptionPlan_model_1.SubscriptionDuration.MONTHLY;
            newSubscriptionPlan1.image = hostAddress + '/public/files/premium-subscription-plan.png';
            newSubscriptionPlan1.type = user_model_1.AccountType.INDIVIDUAL;
            newSubscriptionPlan1.level = subscriptionPlan_model_1.SubscriptionLevel.BASIC;
            newSubscriptionPlan1.currency = 'INR';
            newSubscriptionPlan1.features = [
                'Upload 02 photos per/day',
                '15 Sec Video per/day',
                'Upload 2 post (20 words)',
                'Can follow anyone',
                'Followers limitation up to 5k',
            ];
            newSubscriptionPlan1.save();
            const newSubscriptionPlan = new subscriptionPlan_model_1.default();
            newSubscriptionPlan.name = 'Premium';
            newSubscriptionPlan.description = "The Premium Plan is aimed at users who want an enhanced experience with additional features and no advertisements. This plan is ideal for frequent travelers and those who want to make the most of the app's capabilities.";
            newSubscriptionPlan.price = 149;
            newSubscriptionPlan.duration = subscriptionPlan_model_1.SubscriptionDuration.MONTHLY;
            newSubscriptionPlan.image = hostAddress + '/public/files/premium-subscription-plan.png';
            newSubscriptionPlan.type = user_model_1.AccountType.INDIVIDUAL;
            newSubscriptionPlan.level = subscriptionPlan_model_1.SubscriptionLevel.PREMIUM;
            newSubscriptionPlan.currency = 'INR';
            newSubscriptionPlan.features = [
                'Upload unlimited photos',
                'Unlimited video upload (05 min video)',
                'Unlimited posts',
                'Can follow anyone',
                'Unlimited followers',
                '* Rs 99+ gst after 10k followers'
            ];
            newSubscriptionPlan.save();
            const all = yield Promise.all(allBusinessCategory.map((businessCategory) => __awaiter(void 0, void 0, void 0, function* () {
                const allSubCategory = yield businessSubType_model_1.default.find({ businessTypeID: businessCategory._id });
                yield Promise.all(allSubCategory.map((businessSubCategory) => __awaiter(void 0, void 0, void 0, function* () {
                    yield Promise.all(subscriptionLevelValues.map((subscriptionLevel) => __awaiter(void 0, void 0, void 0, function* () {
                        const newSubscriptionPlan = new subscriptionPlan_model_1.default();
                        newSubscriptionPlan.name = subscriptionLevel.toUpperCase();
                        newSubscriptionPlan.description = "The Premium Plan is aimed at users who want an enhanced experience with additional features and no advertisements. This plan is ideal for frequent travelers and those who want to make the most of the app's capabilities.";
                        if (subscriptionLevel === subscriptionPlan_model_1.SubscriptionLevel.BASIC) {
                            newSubscriptionPlan.price = 99;
                            newSubscriptionPlan.duration = subscriptionPlan_model_1.SubscriptionDuration.MONTHLY;
                            newSubscriptionPlan.image = hostAddress + '/public/files/basic-subscription-plan.png';
                        }
                        if (subscriptionLevel === subscriptionPlan_model_1.SubscriptionLevel.STANDARD) {
                            newSubscriptionPlan.price = 500;
                            newSubscriptionPlan.duration = subscriptionPlan_model_1.SubscriptionDuration.QUARTERLY;
                            newSubscriptionPlan.image = hostAddress + '/public/files/standard-subscription-plan.png';
                        }
                        if (subscriptionLevel === subscriptionPlan_model_1.SubscriptionLevel.STANDARD) {
                            newSubscriptionPlan.price = 300;
                            newSubscriptionPlan.duration = subscriptionPlan_model_1.SubscriptionDuration.HALF_YEARLY;
                            newSubscriptionPlan.image = hostAddress + '/public/files/standard-subscription-plan.png';
                        }
                        if (subscriptionLevel === subscriptionPlan_model_1.SubscriptionLevel.PREMIUM) {
                            newSubscriptionPlan.price = 800;
                            newSubscriptionPlan.duration = subscriptionPlan_model_1.SubscriptionDuration.YEARLY;
                            newSubscriptionPlan.image = hostAddress + '/public/files/premium-subscription-plan.png';
                        }
                        newSubscriptionPlan.type = user_model_1.AccountType.BUSINESS;
                        newSubscriptionPlan.businessTypeID = businessCategory.id;
                        newSubscriptionPlan.businessSubtypeID = businessSubCategory.id;
                        newSubscriptionPlan.level = subscriptionLevel;
                        newSubscriptionPlan.currency = 'INR';
                        newSubscriptionPlan.features = [
                            'Users can browse the app without any advertisements.',
                            'Ability to upload an unlimited number of photos and videos with reviews.',
                            'Enhanced search options to find hotels based on detailed criteria such as price range, amenities, and location.',
                            'Users can save their favorite hotels and reviews for easy access.',
                            'Detailed insights and analytics on user reviews and interactions.'
                        ];
                        newSubscriptionPlan.save();
                        return subscriptionLevel;
                    })));
                    return businessSubCategory;
                })));
                return businessCategory;
            })));
        }
        return response.send((0, response_1.httpOk)(subscriptions, "Subscription added."));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_h = error.message) !== null && _h !== void 0 ? _h : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const getSubscriptionPlans = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _j;
    try {
        const { id } = request.user;
        const [user] = yield Promise.all([
            user_model_1.default.findOne({ _id: id }),
        ]);
        if (!user) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        let findQuery = {};
        if (user.accountType === user_model_1.AccountType.BUSINESS && user.businessProfileID) {
            const businessProfile = yield businessProfile_model_1.default.findOne({ _id: user.businessProfileID });
            if (!businessProfile) {
                return response.send((0, response_1.httpOk)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.BUSINESS_PROFILE_NOT_FOUND), error_1.ErrorMessage.BUSINESS_PROFILE_NOT_FOUND));
            }
            Object.assign(findQuery, {
                businessTypeID: { $in: [businessProfile.businessTypeID] },
                businessSubtypeID: { $in: [businessProfile.businessSubTypeID] },
                type: user_model_1.AccountType.BUSINESS
            });
        }
        else {
            Object.assign(findQuery, { type: user_model_1.AccountType.INDIVIDUAL });
        }
        const businessQuestions = yield subscriptionPlan_model_1.default.find(findQuery);
        return response.send((0, response_1.httpOk)(businessQuestions, "Business subscription plan fetched"));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_j = error.message) !== null && _j !== void 0 ? _j : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const subscription = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _k;
    try {
        const { id } = request.user;
        const [user] = yield Promise.all([
            user_model_1.default.findOne({ _id: id }),
        ]);
        if (!user) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        let findSubscriptionPlanQuery = {};
        let findSubscriptionQuery = {};
        if (user.accountType === user_model_1.AccountType.BUSINESS && user.businessProfileID) {
            const businessProfile = yield businessProfile_model_1.default.findOne({ _id: user.businessProfileID });
            if (!businessProfile) {
                return response.send((0, response_1.httpOk)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.BUSINESS_PROFILE_NOT_FOUND), error_1.ErrorMessage.BUSINESS_PROFILE_NOT_FOUND));
            }
            Object.assign(findSubscriptionPlanQuery, {
                businessTypeID: { $in: [businessProfile.businessTypeID] },
                businessSubtypeID: { $in: [businessProfile.businessSubTypeID] },
                type: user_model_1.AccountType.BUSINESS
            });
            Object.assign(findSubscriptionQuery, { businessProfileID: user.businessProfileID, expirationDate: { $gt: new Date() }, isCancelled: false });
        }
        else {
            Object.assign(findSubscriptionPlanQuery, { type: user_model_1.AccountType.INDIVIDUAL });
            Object.assign(findSubscriptionQuery, { userID: user._id, expirationDate: { $gt: new Date() }, isCancelled: false });
        }
        const [subscriptionPlans, subscription] = yield Promise.all([
            subscriptionPlan_model_1.default.find(findSubscriptionPlanQuery),
            subscription_model_1.default.aggregate([
                {
                    $match: findSubscriptionQuery
                },
                {
                    '$lookup': {
                        'from': 'subscriptionplans',
                        'let': { 'subscriptionPlanID': '$subscriptionPlanID' },
                        'pipeline': [
                            { '$match': { '$expr': { '$eq': ['$_id', '$$subscriptionPlanID'] } } },
                            {
                                '$project': {
                                    '_id': 0,
                                    'name': 1,
                                    'image': 1,
                                }
                            }
                        ],
                        'as': 'subscriptionPlansRef'
                    }
                },
                {
                    '$unwind': {
                        'path': '$subscriptionPlansRef',
                        'preserveNullAndEmptyArrays': true //false value does not fetch relationship.
                    }
                },
                {
                    '$replaceRoot': {
                        'newRoot': {
                            '$mergeObjects': ["$$ROOT", "$subscriptionPlansRef"] // Merge subscriptionPlansRef with the main object
                        }
                    }
                },
                {
                    "$addFields": {
                        "remainingDays": {
                            '$toInt': {
                                "$divide": [
                                    {
                                        "$subtract": [
                                            "$expirationDate",
                                            new Date()
                                        ]
                                    },
                                    24 * 60 * 60 * 1000 // Milliseconds in a day
                                ]
                            }
                        }
                    }
                },
                {
                    '$project': {
                        'subscriptionPlansRef': 0,
                        '__v': 0,
                    }
                },
                {
                    '$limit': 1,
                }
            ])
        ]);
        const responseData = {
            subscription: subscription.length !== 0 ? subscription[0] : null,
            plans: subscriptionPlans,
        };
        return response.send((0, response_1.httpOk)(responseData, "Active subscription fetched"));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_k = error.message) !== null && _k !== void 0 ? _k : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const cancelSubscription = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _l;
    try {
        const { id } = request.user;
        const [user] = yield Promise.all([
            user_model_1.default.findOne({ _id: id }),
        ]);
        if (!user) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        let findSubscriptionQuery = {};
        if (user.accountType === user_model_1.AccountType.BUSINESS && user.businessProfileID) {
            const businessProfile = yield businessProfile_model_1.default.findOne({ _id: user.businessProfileID });
            if (!businessProfile) {
                return response.send((0, response_1.httpOk)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.BUSINESS_PROFILE_NOT_FOUND), error_1.ErrorMessage.BUSINESS_PROFILE_NOT_FOUND));
            }
            Object.assign(findSubscriptionQuery, { businessProfileID: user.businessProfileID, expirationDate: { $gt: new Date() }, isCancelled: false });
        }
        else {
            Object.assign(findSubscriptionQuery, { userID: user._id, expirationDate: { $gt: new Date() }, isCancelled: false });
        }
        const subscription = yield subscription_model_1.default.findOne(findSubscriptionQuery);
        if (!subscription) {
            return response.send((0, response_1.httpBadRequest)(error_1.ErrorMessage.subscriptionExpired(error_1.ErrorMessage.NO_SUBSCRIPTION), error_1.ErrorMessage.NO_SUBSCRIPTION));
        }
        subscription.isCancelled = true;
        yield subscription.save();
        return response.send((0, response_1.httpOk)(null, "Subscription Cancelled"));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_l = error.message) !== null && _l !== void 0 ? _l : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const subscriptionCheckout = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _m;
    try {
        const { id } = request.user;
        const { subscriptionPlanID, promoCode } = request.body;
        const [user, subscriptionPlan, oldOrders] = yield Promise.all([
            user_model_1.default.findOne({ _id: id }),
            subscriptionPlan_model_1.default.findOne({ _id: subscriptionPlanID }),
            order_model_1.default.deleteMany({ userID: id, status: order_model_1.OrderStatus.CREATED, subscriptionPlanID: subscriptionPlanID }) //remove un process order 
        ]);
        if (!user) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        if (!subscriptionPlan) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.SUBSCRIPTION_NOT_FOUND), error_1.ErrorMessage.SUBSCRIPTION_NOT_FOUND));
        }
        //User Billing Address 
        const billingAddress = {
            name: '',
            address: {
                street: "",
                city: "",
                state: "",
                zipCode: "",
                country: "",
                lat: 0,
                lng: 0,
            },
            dialCode: '',
            phoneNumber: '',
            gstn: '',
        };
        let razorPayData = {
            description: '',
            email: '',
            name: '',
            address: {
                street: "",
                city: "",
                state: "",
                zipCode: "",
                country: "",
                lat: 0,
                lng: 0,
            },
            dialCode: '',
            phoneNumber: '',
            gstn: '',
        };
        if (user.accountType === user_model_1.AccountType.BUSINESS) {
            const businessProfile = yield businessProfile_model_1.default.findOne({ _id: user.businessProfileID });
            if (!businessProfile) {
                return response.send((0, response_1.httpBadRequest)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.BUSINESS_PROFILE_NOT_FOUND), error_1.ErrorMessage.BUSINESS_PROFILE_NOT_FOUND));
            }
            Object.assign(billingAddress, {
                name: businessProfile.name,
                address: businessProfile.address,
                dialCode: businessProfile.dialCode,
                phoneNumber: businessProfile.phoneNumber,
                gstn: businessProfile.gstn,
            });
            Object.assign(razorPayData, Object.assign(Object.assign({}, billingAddress), { email: businessProfile.email, description: `Subscription (${subscriptionPlan.name} RS ${subscriptionPlan.price})` }));
        }
        else {
            const userAddress = yield user_address_model_1.default.findOne({ userID: user._id });
            if (!userAddress) {
                return response.send((0, response_1.httpBadRequest)(error_1.ErrorMessage.invalidRequest("Billing address not found."), "Billing address not found."));
            }
            Object.assign(billingAddress, {
                name: user.name,
                address: {
                    geoCoordinate: userAddress.geoCoordinate,
                    street: userAddress.street,
                    city: userAddress.city,
                    state: userAddress.state,
                    zipCode: userAddress.zipCode,
                    country: userAddress.country,
                    lat: userAddress.lat,
                    lng: userAddress.lng
                },
                dialCode: user.dialCode,
                phoneNumber: user.phoneNumber,
                gstn: '',
            });
            Object.assign(razorPayData, Object.assign(Object.assign({}, billingAddress), { email: user.email, description: `Subscription (${subscriptionPlan.name} RS ${subscriptionPlan.price})` }));
        }
        //Price related calculations
        let subtotal = subscriptionPlan.price;
        let gstRate = 18;
        let gst = (subtotal * gstRate) / 100;
        let total = (gst + subtotal);
        const payment = {
            subtotal: subtotal,
            gst: gst,
            gstRate: gstRate,
            total: total
        };
        const newOrder = new order_model_1.default();
        newOrder.orderID = yield (0, order_model_1.generateNextOrderID)();
        newOrder.userID = user.id;
        newOrder.billingAddress = billingAddress;
        newOrder.subscriptionPlanID = subscriptionPlan.id;
        newOrder.subTotal = subtotal;
        newOrder.grandTotal = total;
        newOrder.tax = gst;
        newOrder.status = order_model_1.OrderStatus.CREATED;
        if (promoCode) {
            const promocode = yield promoCode_model_1.default.findOne({ code: promoCode, type: promoCode_model_1.PromoType.SUBSCRIPTION });
            if (!promocode) {
                return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.INVALID_PROMOCODE), error_1.ErrorMessage.INVALID_PROMOCODE));
            }
            if (promocode.cartValue > parseFloat(`${subtotal}`)) {
                return response.send((0, response_1.httpBadRequest)(error_1.ErrorMessage.invalidRequest(`To use this coupon minimum order value should be more than ₹ ${subtotal}.`), `To use this coupon minimum order value should be more than ₹ ${subtotal}.`));
            }
            const todayDate = new Date();
            if (promocode.validTo <= todayDate) {
                return response.send((0, response_1.httpBadRequest)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.EXPIRED_PROMOCODE), error_1.ErrorMessage.EXPIRED_PROMOCODE));
            }
            if (promocode.quantity !== -1) {
                console.log("Unlimited redeemed count");
                if (promocode.quantity <= promocode.redeemedCount) {
                    return response.send((0, response_1.httpBadRequest)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.PROMOCODE_USAGE_LIMIT_REACHED), error_1.ErrorMessage.PROMOCODE_USAGE_LIMIT_REACHED));
                }
            }
            // promo code calculation
            if (promocode.priceType === promoCode_model_1.PriceType.FIXED) {
                let discount = promocode.value;
                console.log("calculated discount", discount, `${promocode.value}%`, promocode.maxDiscount);
                if (discount > promocode.maxDiscount) {
                    discount = promocode.maxDiscount;
                    console.log("Maximum discount");
                }
                subtotal = (subtotal - discount);
                gst = (subtotal * 18) / 100;
                total = (gst + subtotal);
                payment.gst = gst;
                payment.total = total;
                //Update  discount and total and tax
                newOrder.promoCode = promocode.code;
                newOrder.promoCodeID = promocode.id;
                newOrder.discount = discount;
                newOrder.grandTotal = total;
                newOrder.tax = gst;
                Object.assign(payment, { discount });
            }
            else {
                let discount = (subtotal * promocode.value) / 100;
                console.log("calculated discount", discount, `${promocode.value}%`, promocode.maxDiscount);
                if (discount > promocode.maxDiscount) {
                    discount = promocode.maxDiscount;
                    console.log("Maximum discount");
                }
                subtotal = (subtotal - discount);
                console.log(subtotal);
                gst = (subtotal * 18) / 100;
                total = (gst + subtotal);
                payment.gst = gst;
                payment.total = total;
                //Update  discount and total and tax
                newOrder.promoCode = promocode.code;
                newOrder.promoCodeID = promocode.id;
                newOrder.discount = discount;
                newOrder.grandTotal = total;
                newOrder.tax = gst;
                Object.assign(payment, { discount });
            }
            Object.assign(payment, {
                "promoCode": {
                    "code": promocode.code,
                    "priceType": promocode.priceType,
                    "value": promocode.value
                }
            });
        }
        console.log(payment.total);
        console.log(subscriptionPlan.price);
        // if (promoCode && payment.total > subscriptionPlan.price) {
        //     return response.send(httpBadRequest(ErrorMessage.invalidRequest('Coupon cannot be applied: Payment total is below subscription plan price.'), 'Coupon cannot be applied: Payment total is below subscription plan price.'))
        // }
        const razorPayOrder = yield razorPayService.createOrder(Math.round(payment.total), razorPayData);
        const data = yield razorPayService.fetchOrder(razorPayOrder.id);
        newOrder.razorPayOrderID = razorPayOrder.id;
        console.log(razorPayOrder, "razorPayOrder", data);
        const savedOrder = yield newOrder.save();
        return response.send((0, response_1.httpOk)({
            orderID: savedOrder.orderID,
            razorPayOrder: razorPayOrder,
            billingAddress: billingAddress,
            plan: {
                _id: subscriptionPlan._id,
                name: subscriptionPlan.name,
                price: subscriptionPlan.price,
                image: subscriptionPlan.image,
                duration: subscriptionPlan.duration,
                googleSubscriptionID: subscriptionPlan.googleSubscriptionID,
                appleSubscriptionID: subscriptionPlan.appleSubscriptionID,
            },
            payment: payment
        }, "Checkout data fetched"));
    }
    catch (error) {
        if (error.error && error.statusCode) {
            // Provide specific error message based on the Razorpay error
            const errorMessage = error.error.description || 'Internal Server Error';
            next((0, response_1.httpInternalServerError)(error.error, errorMessage));
        }
        else {
            next((0, response_1.httpInternalServerError)(error, (_m = error.message) !== null && _m !== void 0 ? _m : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
        }
    }
});
const subscriptionMeta = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _o;
    try {
        const { id } = request.user;
        console.log(id);
        const hasSubscription = yield (0, subscription_model_1.hasActiveSubscription)(id);
        const pdf = hasSubscription ? 5 : 2; //mega bytes 
        const video = hasSubscription ? 300 : 30; //seconds
        const responseData = {
            uploadLimit: [
                {
                    "fileType": media_model_1.MediaType.PDF,
                    "unit": "mb",
                    "size": pdf
                },
                {
                    "fileType": media_model_1.MediaType.VIDEO,
                    "unit": "second",
                    "size": video
                }
            ],
            hasSubscription: hasSubscription ? true : false
        };
        return response.send((0, response_1.httpOk)(responseData, "Subscription meta fetched."));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_o = error.message) !== null && _o !== void 0 ? _o : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const fetchPurchasesSubscriptions = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _p;
    try {
        // androidpublisher.purchases.subscriptions.cancel({
        //     packageName:packageName,
        //     subscriptionId:subscriptionID,
        //     token:token
        // })
        const packageName = 'com.thehotelmedia.android';
        const { token } = yield googleAuthService.getAccessToken();
        const data = yield axios_1.default.get(`https://androidpublisher.googleapis.com/androidpublisher/v3/applications/com.thehotelmedia.android/subscriptions/thm_individual_premium_199`, {
            headers: {
                Authorization: `Bearer ${token.token}`
            }
        });
        console.log(data.data);
        if (data.status === 200 && data.data) {
            return response.send((0, response_1.httpOk)(data === null || data === void 0 ? void 0 : data.data, "Subscription fetched"));
        }
        return response.send((0, response_1.httpBadRequest)(null, "Invalid subscription plan"));
        return response.send("Fi");
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_p = error.message) !== null && _p !== void 0 ? _p : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
exports.default = { buySubscription, subscription, index, getSubscriptionPlans, cancelSubscription, subscriptionCheckout, subscriptionMeta, fetchPurchasesSubscriptions, verifyGooglePurchase, subscriptionNotification };
