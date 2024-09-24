import { Request, Response, NextFunction, response } from "express";
import { httpOk, httpBadRequest, httpInternalServerError, httpNotFoundOr404, httpForbidden } from "../utils/response";
import User, { AccountType } from "../database/models/user.model";
import { ErrorMessage } from "../utils/response-message/error";
import Subscription from '../database/models/subscription.model';
import SubscriptionPlan, { SubscriptionDuration, SubscriptionLevel } from "../database/models/subscriptionPlan.model";
import BusinessType from "../database/models/businessType.model";
import BusinessSubType from "../database/models/businessSubType.model";
import BusinessProfile from "../database/models/businessProfile.model";
import moment from "moment";
/**
 * //FIXME hey bro fix me  
 * @param request 
 * @param response 
 * @param next 
 * @returns 
 */
const buySubscription = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id } = request.user;
        const { subscriptionPlanID } = request.body;
        const [user, subscriptionPlan] = await Promise.all([
            User.findOne({ _id: id }),
            SubscriptionPlan.findOne({ _id: subscriptionPlanID })
        ])
        if (!user) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        if (!subscriptionPlan) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.SUBSCRIPTION_NOT_FOUND), ErrorMessage.SUBSCRIPTION_NOT_FOUND));
        }
        const hasSubscription = await Subscription.findOne({ businessProfileID: user.businessProfileID, expirationDate: { $gt: new Date() } });
        if (!hasSubscription) {
            const newSubscription = new Subscription();
            newSubscription.businessProfileID = user.businessProfileID;
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
            return response.send(httpOk(savedSubscription, "Subscription added."));
        }
        return response.send(httpOk(hasSubscription, "Subscription added."));
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
const subscriptionCheckout = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id } = request.user;
        const { subscriptionPlanID } = request.body;
        const [user, subscriptionPlan] = await Promise.all([
            User.findOne({ _id: id }),
            SubscriptionPlan.findOne({ _id: subscriptionPlanID })
        ])

        if (!user) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        if (!subscriptionPlan) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.SUBSCRIPTION_NOT_FOUND), ErrorMessage.SUBSCRIPTION_NOT_FOUND));
        }
        const businessProfile = await BusinessProfile.findOne({ _id: user.businessProfileID });
        if (!businessProfile) {
            return response.send(httpOk(ErrorMessage.invalidRequest(ErrorMessage.BUSINESS_PROFILE_NOT_FOUND), ErrorMessage.BUSINESS_PROFILE_NOT_FOUND))
        }
        const subtotal = subscriptionPlan.price;
        const gst = (subtotal * 18) / 100;
        const total = (gst + subtotal);
        return response.send(httpOk({
            billingAddress: {
                name: businessProfile.name,
                address: businessProfile.address,
                dialCode: businessProfile.dialCode,
                phoneNumber: businessProfile.phoneNumber,
                gstn: businessProfile.gstn,
            },
            plan: {
                _id: subscriptionPlan._id,
                name: subscriptionPlan.name,
                price: subscriptionPlan.price,
                image: subscriptionPlan.image,
                duration: subscriptionPlan.duration,
            },
            payment: {
                subtotal: subtotal,
                gst: gst,
                total: total
            }
        }, "Checkout data fetched"));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}


export default { buySubscription, index, getSubscriptionPlans, subscriptionCheckout };