import { Address } from './../database/models/common.model';
import { Request, Response, NextFunction, response } from "express";
import { httpOk, httpBadRequest, httpInternalServerError, httpNotFoundOr404, httpForbidden } from "../utils/response";
import User, { AccountType } from "../database/models/user.model";
import { ErrorMessage } from "../utils/response-message/error";
import Subscription, { hasActiveSubscription } from '../database/models/subscription.model';
import SubscriptionPlan, { SubscriptionDuration, SubscriptionLevel } from "../database/models/subscriptionPlan.model";
import BusinessType from "../database/models/businessType.model";
import BusinessSubType from "../database/models/businessSubType.model";
import BusinessProfile from "../database/models/businessProfile.model";
import moment from "moment";
import PromoCode, { PriceType, PromoType } from "../database/models/promoCode.model";
import Order, { generateNextOrderID, OrderStatus, fetchCreatedOrder } from "../database/models/order.model";
import RazorPayService, { BillingDetails } from "../services/RazorPayService";
import { parseFloatToFixed } from "../utils/helper/basic";
import { BillingAddress, Role } from '../common';
import UserAddress from '../database/models/user-address.model';
import EmailNotificationService from '../services/EmailNotificationService';
import { MediaType } from '../database/models/media.model';
import axios from 'axios';
import { google } from "googleapis";
import { GoogleAuthService } from '../services/GoogleAuthService';
const razorPayService = new RazorPayService();
const emailNotificationService = new EmailNotificationService();
const googleAuthService = new GoogleAuthService();
/**
 * @deprecate
 * This method is deprecated and may be removed in future versions. 
 * Please use a verifyGooglePurchase method for subscription purchase.
 * @param request 
 * @param response 
 * @param next 
 * @returns 
 */
const buySubscription = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id } = request.user;
        const { orderID, paymentID, signature } = request.body;
        const [user, order] = await Promise.all([
            User.findOne({ _id: id }),
            Order.findOne({ orderID: orderID, status: OrderStatus.CREATED })
        ]);
        if (!user) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        if (!order) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest("Order not found"), "Order not found"));
        }
        const [subscriptionPlan, isPaymentVerified, razorPayOrder, payment] = await Promise.all([
            SubscriptionPlan.findOne({ _id: order.subscriptionPlanID }),
            razorPayService.verifyPayment(order.razorPayOrderID, paymentID, signature),
            razorPayService.fetchOrder(order.razorPayOrderID),
            razorPayService.fetchPayment(paymentID),
        ]);
        if (!subscriptionPlan) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.SUBSCRIPTION_NOT_FOUND), ErrorMessage.SUBSCRIPTION_NOT_FOUND));
        }
        if (!isPaymentVerified && razorPayOrder.status !== "paid") {
            return response.send(httpBadRequest(ErrorMessage.invalidRequest("Payment not verified. please try again"), "Payment not verified. please try again"))
        }
        //FIXME remove console logs
        // console.log(isPaymentVerified);
        // console.log("\n\n\n")
        // console.log(razorPayOrder);
        // console.log("SUBSCRIPTION")
        // console.log(payment);
        // console.log("\n\n\n");
        order.status = OrderStatus.COMPLETED;
        const amount = parseInt(`${payment.amount}`) / 100;
        order.paymentDetail = {
            transactionID: payment.id,
            paymentMethod: payment.method,
            transactionAmount: parseFloatToFixed(amount, 2)
        }
        await order.save();
        const dbQuery = { userID: user.id, expirationDate: { $gt: new Date() }, isCancelled: false }
        if (user.accountType === AccountType.BUSINESS && user.businessProfileID) {
            Object.assign(dbQuery, { businessProfileID: user.businessProfileID })
        }
        const [hasSubscription, admins] = await Promise.all([
            Subscription.findOne(dbQuery),
            User.distinct('email', { role: Role.ADMINISTRATOR })
        ]);
        if (!hasSubscription) {
            const newSubscription = new Subscription();
            newSubscription.businessProfileID = user.businessProfileID;
            newSubscription.userID = user.id;
            newSubscription.subscriptionPlanID = subscriptionPlan.id;
            newSubscription.orderID = order.id;
            switch (subscriptionPlan.duration) {
                case SubscriptionDuration.YEARLY:
                    newSubscription.expirationDate = new Date(moment().add(365, 'days').toString());
                    break;
                case SubscriptionDuration.HALF_YEARLY:
                    newSubscription.expirationDate = new Date(moment().add(182, 'days').toString());
                    break;
                case SubscriptionDuration.QUARTERLY:
                    newSubscription.expirationDate = new Date(moment().add(91, 'days').toString());
                    break;
                default:
                    newSubscription.expirationDate = new Date(moment().add(30, 'days').toString());
            }
            const savedSubscription = await newSubscription.save();
            console.log(moment(order.createdAt).format('ddd DD, MMM YYYY hh:mm:ss A'))
            emailNotificationService.sendSubscriptionEmail({
                name: user.name ?? user.username,
                toAddress: user.email,
                cc: admins,
                subscriptionName: `${subscriptionPlan.name} ₹${subscriptionPlan.price}`,
                orderID: order.orderID,
                purchaseDate: moment(order.createdAt).format('ddd DD, MMM YYYY hh:mm:ss A'),
                grandTotal: order.grandTotal.toString(),
                transactionID: order.paymentDetail.transactionID,
                paymentMethod: order.paymentDetail.paymentMethod
            });
            return response.send(httpOk(savedSubscription, "Subscription added."));
        }
        hasSubscription.orderID = order.id;
        switch (subscriptionPlan.duration) {
            case SubscriptionDuration.YEARLY:
                hasSubscription.expirationDate = new Date(moment().add(365, 'days').toString());
                break;
            case SubscriptionDuration.HALF_YEARLY:
                hasSubscription.expirationDate = new Date(moment().add(182, 'days').toString());
                break;
            case SubscriptionDuration.QUARTERLY:
                hasSubscription.expirationDate = new Date(moment().add(91, 'days').toString());
                break;
            default:
                hasSubscription.expirationDate = new Date(moment().add(30, 'days').toString());
        }
        hasSubscription.subscriptionPlanID = order.subscriptionPlanID;
        const savedSubscription = await hasSubscription.save();
        console.log(moment(order.createdAt).format('ddd DD, MMM YYYY hh:mm:ss A'))
        emailNotificationService.sendSubscriptionEmail({
            name: user.name ?? user.username,
            toAddress: user.email,
            cc: admins,
            subscriptionName: `${subscriptionPlan.name} ₹${subscriptionPlan.price}`,
            orderID: order.orderID,
            purchaseDate: moment(order.createdAt).format('ddd DD, MMM YYYY hh:mm:ss A'),
            grandTotal: order.grandTotal.toString(),
            transactionID: order.paymentDetail.transactionID,
            paymentMethod: order.paymentDetail.paymentMethod
        });
        return response.send(httpOk(savedSubscription, "Subscription updated."));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}

const verifyGooglePurchase = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id } = request.user;
        const { token, subscriptionID, orderID } = request.body;
        const [user, order] = await Promise.all([
            User.findOne({ _id: id }),
            fetchCreatedOrder(orderID),
        ]);
        if (!user) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        if (!order) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest("Order not found"), "Order not found"));
        }
        const [subscriptionPlan, googleAuth] = await Promise.all([
            SubscriptionPlan.findOne({ _id: order.subscriptionPlanID }),
            googleAuthService.getAccessToken(),
        ]);
        if (!subscriptionPlan) {
            order.status = OrderStatus.FAILED;
            await order.save();
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.SUBSCRIPTION_NOT_FOUND), ErrorMessage.SUBSCRIPTION_NOT_FOUND));
        }
        //The token provided to the user's device when the subscription was purchased.
        //The purchased subscription ID (for example, 'monthly001').
        const { auth } = googleAuth;
        const androidpublisher = google.androidpublisher({
            version: 'v3',
            auth,
        });
        const packageName = "com.thehotelmedia.android";
        const { data } = await androidpublisher.purchases.subscriptions.get({
            packageName,
            subscriptionId: subscriptionID,
            token,
        });
        console.log("Subscription Transaction DATA::", data)
        if (data) {
            const { paymentState, priceAmountMicros, priceCurrencyCode, orderId, startTimeMillis, expiryTimeMillis, acknowledgementState } = data;

            if (acknowledgementState && acknowledgementState === 0) {
                await androidpublisher.purchases.subscriptions.acknowledge({
                    packageName,
                    subscriptionId: subscriptionID,
                    token,
                })
            }

            switch (paymentState) {
                case 0://Payment pending 
                    order.status = OrderStatus.COMPLETED;
                    break;
                case 1://Payment received
                    order.status = OrderStatus.COMPLETED;
                    break;
                case 2://Free trial
                    order.status = OrderStatus.COMPLETED;
                    break;
                case 3://Pending deferred upgrade / downgrade Not present for canceled, expired subscriptions.
                    order.status = OrderStatus.COMPLETED;
                    break;
            }

            const amount = parseInt(`${priceAmountMicros}`) / 1000000;
            order.paymentDetail = {
                transactionID: orderId ?? "google.purchases.subscriptions",
                paymentMethod: "google pay",
                transactionAmount: parseFloatToFixed(amount, 2)
            }
            await order.save();
            const dbQuery = { userID: user.id, expirationDate: { $gt: new Date() }, isCancelled: false }
            if (user.accountType === AccountType.BUSINESS && user.businessProfileID) {
                Object.assign(dbQuery, { businessProfileID: user.businessProfileID })
            }
            const [hasSubscription, admins] = await Promise.all([
                Subscription.findOne(dbQuery),
                User.distinct('email', { role: Role.ADMINISTRATOR })
            ]);
            if (!hasSubscription) {
                console.log("Does not have subscription man")
                const newSubscription = new Subscription();
                newSubscription.businessProfileID = user.businessProfileID;
                newSubscription.userID = user.id;
                newSubscription.subscriptionPlanID = subscriptionPlan.id;
                newSubscription.orderID = order.id;
                switch (subscriptionPlan.duration) {
                    case SubscriptionDuration.YEARLY:
                        newSubscription.expirationDate = new Date(moment().add(365, 'days').toString());
                        break;
                    case SubscriptionDuration.HALF_YEARLY:
                        newSubscription.expirationDate = new Date(moment().add(182, 'days').toString());
                        break;
                    case SubscriptionDuration.QUARTERLY:
                        newSubscription.expirationDate = new Date(moment().add(91, 'days').toString());
                        break;
                    default:
                        newSubscription.expirationDate = new Date(moment().add(30, 'days').toString());
                }
                const savedSubscription = await newSubscription.save();
                console.log(moment(order.createdAt).format('ddd DD, MMM YYYY hh:mm:ss A'))
                emailNotificationService.sendSubscriptionEmail({
                    name: user.name ?? user.username,
                    toAddress: user.email,
                    cc: admins,
                    subscriptionName: `${subscriptionPlan.name} ₹${subscriptionPlan.price}`,
                    orderID: order.orderID,
                    purchaseDate: moment(order.createdAt).format('ddd DD, MMM YYYY hh:mm:ss A'),
                    grandTotal: order.grandTotal.toString(),
                    transactionID: order.paymentDetail.transactionID,
                    paymentMethod: order.paymentDetail.paymentMethod
                });
                return response.send(httpOk(savedSubscription, "Subscription added."));
            }
            console.log("Have old subscription");
            hasSubscription.orderID = order.id;
            switch (subscriptionPlan.duration) {
                case SubscriptionDuration.YEARLY:
                    hasSubscription.expirationDate = new Date(moment().add(365, 'days').toString());
                    break;
                case SubscriptionDuration.HALF_YEARLY:
                    hasSubscription.expirationDate = new Date(moment().add(182, 'days').toString());
                    break;
                case SubscriptionDuration.QUARTERLY:
                    hasSubscription.expirationDate = new Date(moment().add(91, 'days').toString());
                    break;
                default:
                    hasSubscription.expirationDate = new Date(moment().add(30, 'days').toString());
            }
            hasSubscription.subscriptionPlanID = order.subscriptionPlanID;
            const savedSubscription = await hasSubscription.save();
            console.log(moment(order.createdAt).format('ddd DD, MMM YYYY hh:mm:ss A'))
            emailNotificationService.sendSubscriptionEmail({
                name: user.name ?? user.username,
                toAddress: user.email,
                cc: admins,
                subscriptionName: `${subscriptionPlan.name} ₹${subscriptionPlan.price}`,
                orderID: order.orderID,
                purchaseDate: moment(order.createdAt).format('ddd DD, MMM YYYY hh:mm:ss A'),
                grandTotal: order.grandTotal.toString(),
                transactionID: order.paymentDetail.transactionID,
                paymentMethod: order.paymentDetail.paymentMethod
            });
            return response.send(httpOk(savedSubscription, "Subscription updated."));
        }
        order.status = OrderStatus.FAILED;
        await order.save();
        return response.send(httpBadRequest(null, "Purchased failed."));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}

const subscriptionNotification = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const notification = request.body;
        console.log("subscriptionNotification", notification)
        // Check for the subscription renewal event in the notification
        if (notification.subscriptionNotification) {
            const { subscriptionId, purchaseToken, eventTimeMillis, notificationType } = notification.subscriptionNotification;

            if (notificationType === 'SUBSCRIPTION_RENEWED') {
                console.log(`Subscription ${subscriptionId} renewed. Purchase token: ${purchaseToken}`);
                // Process renewal (e.g., update user status)
            } else if (notificationType === 'SUBSCRIPTION_CANCELLED') {
                console.log(`Subscription ${subscriptionId} cancelled. Purchase token: ${purchaseToken}`);
                // Process cancellation (e.g., revoke subscription features)
            }
        }
        // Respond to acknowledge receipt of the notification
        return response.status(200).send('Notification received');
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const index = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const hostAddress = request.protocol + "://" + request.get("host");
        const allBusinessCategory = await BusinessType.find({});
        const subscriptions = await SubscriptionPlan.find({});
        const subscriptionLevelValues = Object.values(SubscriptionLevel);
        if (subscriptions.length === 0) {
            //Individual subscription plans
            const newSubscriptionPlan1 = new SubscriptionPlan();
            newSubscriptionPlan1.name = 'Free Plan';
            newSubscriptionPlan1.description = "The Free Plan is aimed at users who want an enhanced experience with additional features and no advertisements. This plan is ideal for normal";
            newSubscriptionPlan1.price = 0;
            newSubscriptionPlan1.duration = SubscriptionDuration.MONTHLY;
            newSubscriptionPlan1.image = hostAddress + '/public/files/premium-subscription-plan.png';
            newSubscriptionPlan1.type = AccountType.INDIVIDUAL;
            newSubscriptionPlan1.level = SubscriptionLevel.BASIC;
            newSubscriptionPlan1.currency = 'INR';
            newSubscriptionPlan1.features = [
                'Upload 02 photos per/day',
                '15 Sec Video per/day',
                'Upload 2 post (20 words)',
                'Can follow anyone',
                'Followers limitation up to 5k',
            ];
            newSubscriptionPlan1.save();
            const newSubscriptionPlan = new SubscriptionPlan();
            newSubscriptionPlan.name = 'Premium';
            newSubscriptionPlan.description = "The Premium Plan is aimed at users who want an enhanced experience with additional features and no advertisements. This plan is ideal for frequent travelers and those who want to make the most of the app's capabilities.";
            newSubscriptionPlan.price = 149;
            newSubscriptionPlan.duration = SubscriptionDuration.MONTHLY;
            newSubscriptionPlan.image = hostAddress + '/public/files/premium-subscription-plan.png';
            newSubscriptionPlan.type = AccountType.INDIVIDUAL;
            newSubscriptionPlan.level = SubscriptionLevel.PREMIUM;
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

            const all = await Promise.all(
                allBusinessCategory.map(async (businessCategory) => {
                    const allSubCategory = await BusinessSubType.find({ businessTypeID: businessCategory._id });
                    await Promise.all(allSubCategory.map(async (businessSubCategory) => {
                        await Promise.all(
                            subscriptionLevelValues.map(async (subscriptionLevel: string) => {
                                const newSubscriptionPlan = new SubscriptionPlan();
                                newSubscriptionPlan.name = subscriptionLevel.toUpperCase();
                                newSubscriptionPlan.description = "The Premium Plan is aimed at users who want an enhanced experience with additional features and no advertisements. This plan is ideal for frequent travelers and those who want to make the most of the app's capabilities.";
                                if (subscriptionLevel === SubscriptionLevel.BASIC) {
                                    newSubscriptionPlan.price = 99;
                                    newSubscriptionPlan.duration = SubscriptionDuration.MONTHLY;
                                    newSubscriptionPlan.image = hostAddress + '/public/files/basic-subscription-plan.png';
                                }
                                if (subscriptionLevel === SubscriptionLevel.STANDARD) {
                                    newSubscriptionPlan.price = 500;
                                    newSubscriptionPlan.duration = SubscriptionDuration.QUARTERLY;
                                    newSubscriptionPlan.image = hostAddress + '/public/files/standard-subscription-plan.png';
                                }
                                if (subscriptionLevel === SubscriptionLevel.STANDARD) {
                                    newSubscriptionPlan.price = 300;
                                    newSubscriptionPlan.duration = SubscriptionDuration.HALF_YEARLY;
                                    newSubscriptionPlan.image = hostAddress + '/public/files/standard-subscription-plan.png';
                                }
                                if (subscriptionLevel === SubscriptionLevel.PREMIUM) {
                                    newSubscriptionPlan.price = 800;
                                    newSubscriptionPlan.duration = SubscriptionDuration.YEARLY;
                                    newSubscriptionPlan.image = hostAddress + '/public/files/premium-subscription-plan.png';
                                }
                                newSubscriptionPlan.type = AccountType.BUSINESS;
                                newSubscriptionPlan.businessTypeID = businessCategory.id;
                                newSubscriptionPlan.businessSubtypeID = businessSubCategory.id;
                                newSubscriptionPlan.level = subscriptionLevel as SubscriptionLevel;
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
                            }));
                        return businessSubCategory;
                    }));
                    return businessCategory;
                })
            );
        }
        return response.send(httpOk(subscriptions, "Subscription added."));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const getSubscriptionPlans = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id } = request.user;
        const [user] = await Promise.all([
            User.findOne({ _id: id }),
        ])
        if (!user) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        let findQuery = {};
        if (user.accountType === AccountType.BUSINESS && user.businessProfileID) {
            const businessProfile = await BusinessProfile.findOne({ _id: user.businessProfileID });
            if (!businessProfile) {
                return response.send(httpOk(ErrorMessage.invalidRequest(ErrorMessage.BUSINESS_PROFILE_NOT_FOUND), ErrorMessage.BUSINESS_PROFILE_NOT_FOUND))
            }
            Object.assign(findQuery,
                {
                    businessTypeID: { $in: [businessProfile.businessTypeID] },
                    businessSubtypeID: { $in: [businessProfile.businessSubTypeID] },
                    type: AccountType.BUSINESS
                }
            )
        } else {
            Object.assign(findQuery, { type: AccountType.INDIVIDUAL });
        }
        const businessQuestions = await SubscriptionPlan.find(findQuery);
        return response.send(httpOk(businessQuestions, "Business subscription plan fetched"));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const subscription = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id } = request.user;
        const [user] = await Promise.all([
            User.findOne({ _id: id }),
        ])
        if (!user) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        let findSubscriptionPlanQuery = {};
        let findSubscriptionQuery = {}
        if (user.accountType === AccountType.BUSINESS && user.businessProfileID) {
            const businessProfile = await BusinessProfile.findOne({ _id: user.businessProfileID });
            if (!businessProfile) {
                return response.send(httpOk(ErrorMessage.invalidRequest(ErrorMessage.BUSINESS_PROFILE_NOT_FOUND), ErrorMessage.BUSINESS_PROFILE_NOT_FOUND))
            }
            Object.assign(findSubscriptionPlanQuery,
                {
                    businessTypeID: { $in: [businessProfile.businessTypeID] },
                    businessSubtypeID: { $in: [businessProfile.businessSubTypeID] },
                    type: AccountType.BUSINESS
                }
            );
            Object.assign(findSubscriptionQuery, { businessProfileID: user.businessProfileID, expirationDate: { $gt: new Date() }, isCancelled: false })
        } else {
            Object.assign(findSubscriptionPlanQuery, { type: AccountType.INDIVIDUAL });
            Object.assign(findSubscriptionQuery, { userID: user._id, expirationDate: { $gt: new Date() }, isCancelled: false })
        }
        const [subscriptionPlans, subscription] = await Promise.all([
            SubscriptionPlan.find(findSubscriptionPlanQuery),
            Subscription.aggregate([
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
                        'preserveNullAndEmptyArrays': true//false value does not fetch relationship.
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
        }
        return response.send(httpOk(responseData, "Active subscription fetched"));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const cancelSubscription = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id } = request.user;
        const [user] = await Promise.all([
            User.findOne({ _id: id }),
        ])
        if (!user) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        let findSubscriptionQuery = {}
        if (user.accountType === AccountType.BUSINESS && user.businessProfileID) {
            const businessProfile = await BusinessProfile.findOne({ _id: user.businessProfileID });
            if (!businessProfile) {
                return response.send(httpOk(ErrorMessage.invalidRequest(ErrorMessage.BUSINESS_PROFILE_NOT_FOUND), ErrorMessage.BUSINESS_PROFILE_NOT_FOUND))
            }
            Object.assign(findSubscriptionQuery, { businessProfileID: user.businessProfileID, expirationDate: { $gt: new Date() }, isCancelled: false })
        } else {

            Object.assign(findSubscriptionQuery, { userID: user._id, expirationDate: { $gt: new Date() }, isCancelled: false })
        }
        const subscription = await Subscription.findOne(findSubscriptionQuery)
        if (!subscription) {
            return response.send(httpBadRequest(ErrorMessage.subscriptionExpired(ErrorMessage.NO_SUBSCRIPTION), ErrorMessage.NO_SUBSCRIPTION));
        }
        subscription.isCancelled = true;
        await subscription.save();
        return response.send(httpOk(null, "Subscription Cancelled"));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const subscriptionCheckout = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id } = request.user;
        const { subscriptionPlanID, promoCode } = request.body;
        const [user, subscriptionPlan, oldOrders] = await Promise.all([
            User.findOne({ _id: id }),
            SubscriptionPlan.findOne({ _id: subscriptionPlanID }),
            Order.deleteMany({ userID: id, status: OrderStatus.CREATED, subscriptionPlanID: subscriptionPlanID })//remove un process order 
        ])

        if (!user) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        if (!subscriptionPlan) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.SUBSCRIPTION_NOT_FOUND), ErrorMessage.SUBSCRIPTION_NOT_FOUND));
        }
        //User Billing Address 
        const billingAddress: BillingAddress = {
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
        let razorPayData: BillingDetails = {
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
        if (user.accountType === AccountType.BUSINESS) {
            const businessProfile = await BusinessProfile.findOne({ _id: user.businessProfileID });
            if (!businessProfile) {
                return response.send(httpBadRequest(ErrorMessage.invalidRequest(ErrorMessage.BUSINESS_PROFILE_NOT_FOUND), ErrorMessage.BUSINESS_PROFILE_NOT_FOUND))
            }
            Object.assign(billingAddress, {
                name: businessProfile.name,
                address: businessProfile.address,
                dialCode: businessProfile.dialCode,
                phoneNumber: businessProfile.phoneNumber,
                gstn: businessProfile.gstn,
            })
            Object.assign(razorPayData,
                { ...billingAddress, email: businessProfile.email, description: `Subscription (${subscriptionPlan.name} RS ${subscriptionPlan.price})` }
            )
        } else {
            const userAddress = await UserAddress.findOne({ userID: user._id });
            if (!userAddress) {
                return response.send(httpBadRequest(ErrorMessage.invalidRequest("Billing address not found."), "Billing address not found."))
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
            Object.assign(razorPayData, { ...billingAddress, email: user.email, description: `Subscription (${subscriptionPlan.name} RS ${subscriptionPlan.price})` })
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
        }

        const newOrder = new Order();
        newOrder.orderID = await generateNextOrderID();
        newOrder.userID = user.id;
        newOrder.billingAddress = billingAddress;
        newOrder.subscriptionPlanID = subscriptionPlan.id;
        newOrder.subTotal = subtotal;
        newOrder.grandTotal = total;
        newOrder.tax = gst;
        newOrder.status = OrderStatus.CREATED;
        if (promoCode) {
            const promocode = await PromoCode.findOne({ code: promoCode, type: PromoType.SUBSCRIPTION })
            if (!promocode) {
                return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.INVALID_PROMOCODE), ErrorMessage.INVALID_PROMOCODE));
            }
            if (promocode.cartValue > parseFloat(`${subtotal}`)) {
                return response.send(httpBadRequest(ErrorMessage.invalidRequest(`To use this coupon minimum order value should be more than ₹ ${subtotal}.`), `To use this coupon minimum order value should be more than ₹ ${subtotal}.`));
            }
            const todayDate = new Date();
            if (promocode.validTo <= todayDate) {
                return response.send(httpBadRequest(ErrorMessage.invalidRequest(ErrorMessage.EXPIRED_PROMOCODE), ErrorMessage.EXPIRED_PROMOCODE));
            }
            if (promocode.quantity !== -1) {
                console.log("Unlimited redeemed count")
                if (promocode.quantity <= promocode.redeemedCount) {
                    return response.send(httpBadRequest(ErrorMessage.invalidRequest(ErrorMessage.PROMOCODE_USAGE_LIMIT_REACHED), ErrorMessage.PROMOCODE_USAGE_LIMIT_REACHED));
                }
            }
            // promo code calculation
            if (promocode.priceType === PriceType.FIXED) {
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

                Object.assign(payment, { discount })
            } else {
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
                Object.assign(payment, { discount })
            }
            Object.assign(payment, {
                "promoCode": {
                    "code": promocode.code,
                    "priceType": promocode.priceType,
                    "value": promocode.value
                }
            })
        }
        console.log(payment.total)
        console.log(subscriptionPlan.price);
        // if (promoCode && payment.total > subscriptionPlan.price) {
        //     return response.send(httpBadRequest(ErrorMessage.invalidRequest('Coupon cannot be applied: Payment total is below subscription plan price.'), 'Coupon cannot be applied: Payment total is below subscription plan price.'))
        // }
        const razorPayOrder = await razorPayService.createOrder(Math.round(payment.total), razorPayData);
        const data = await razorPayService.fetchOrder(razorPayOrder.id);
        newOrder.razorPayOrderID = razorPayOrder.id;
        console.log(razorPayOrder, "razorPayOrder", data);
        const savedOrder = await newOrder.save();
        return response.send(httpOk({
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
    } catch (error: any) {
        if (error.error && error.statusCode) {
            // Provide specific error message based on the Razorpay error
            const errorMessage = error.error.description || 'Internal Server Error';
            next(httpInternalServerError(error.error, errorMessage));
        } else {
            next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
        }
    }
}

const subscriptionMeta = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id } = request.user;
        console.log(id);
        const hasSubscription = await hasActiveSubscription(id);
        const pdf = hasSubscription ? 5 : 2; //mega bytes 
        const video = hasSubscription ? 300 : 30;//seconds
        const responseData = {
            uploadLimit: [
                {
                    "fileType": MediaType.PDF,
                    "unit": "mb",
                    "size": pdf
                },
                {
                    "fileType": MediaType.VIDEO,
                    "unit": "second",
                    "size": video
                }
            ],
            hasSubscription: hasSubscription ? true : false
        }
        return response.send(httpOk(responseData, "Subscription meta fetched."));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}

const fetchPurchasesSubscriptions = async (request: Request, response: Response, next: NextFunction) => {
    try {

        // androidpublisher.purchases.subscriptions.cancel({
        //     packageName:packageName,
        //     subscriptionId:subscriptionID,
        //     token:token
        // })
        const packageName = 'com.thehotelmedia.android';
        const { token } = await googleAuthService.getAccessToken();
        const data = await axios.get(`https://androidpublisher.googleapis.com/androidpublisher/v3/applications/com.thehotelmedia.android/subscriptions/thm_individual_premium_199`, {
            headers: {
                Authorization: `Bearer ${token.token}`
            }
        });
        console.log(data.data);
        if (data.status === 200 && data.data) {
            return response.send(httpOk(data?.data, "Subscription fetched"));
        }
        return response.send(httpBadRequest(null, "Invalid subscription plan"))
        return response.send("Fi");
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}


export default { buySubscription, subscription, index, getSubscriptionPlans, cancelSubscription, subscriptionCheckout, subscriptionMeta, fetchPurchasesSubscriptions, verifyGooglePurchase, subscriptionNotification };