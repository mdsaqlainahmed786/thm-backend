import { Request, Response, NextFunction, response } from "express";
import { httpOk, httpBadRequest, httpInternalServerError, httpNotFoundOr404, httpForbidden } from "../utils/response";
import User, { AccountType } from "../database/models/user.model";
import { ErrorMessage } from "../utils/response-message/error";
import Subscription from '../database/models/subscription.model';
import SubscriptionPlan, { SubscriptionLevel } from "../database/models/subscriptionPlan.model";
import BusinessType from "../database/models/businessType.model";

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
        const user = await User.findOne({ _id: id });
        if (!user) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        const hasSubscription = await Subscription.findOne({ businessProfileID: user.businessProfileID });
        if (!hasSubscription) {
            const newSubscription = new Subscription();
            newSubscription.businessProfileID = user.businessProfileID;
            const savedSubscription = await newSubscription.save();
            return response.send(httpOk(savedSubscription, "Subscription added."));
        }
        return response.send(httpOk(hasSubscription, "Subscription added."));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const subscription = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const allBusinessCategory = await BusinessType.find({});
        const subscriptions = await SubscriptionPlan.find({});
        const subscriptionLevelValues = Object.values(SubscriptionLevel);
        allBusinessCategory.map(async (businessCategory) => {
            subscriptionLevelValues.map(async (subscription: string) => {
                const newSubscriptionPlan = new SubscriptionPlan();
                newSubscriptionPlan.name = subscription.toLowerCase();
                newSubscriptionPlan.description = "The Premium Plan is aimed at users who want an enhanced experience with additional features and no advertisements. This plan is ideal for frequent travelers and those who want to make the most of the app's capabilities.";
                if (subscription === "basic") {
                    newSubscriptionPlan.price = 0;
                }
                if (subscription === "standard") {
                    newSubscriptionPlan.price = 500;
                }
                if (subscription === "premium") {
                    newSubscriptionPlan.price = 800;
                }
                newSubscriptionPlan.businessSubtypeID = businessCategory.id;
                newSubscriptionPlan.duration = 30;
                newSubscriptionPlan.level = subscription as SubscriptionLevel;
                newSubscriptionPlan.currency = 'INR';
                newSubscriptionPlan.features = [];
                newSubscriptionPlan.image = '/';
                newSubscriptionPlan.save();
            });
        });


        return response.send(httpOk(subscriptions, "Subscription added."));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}

export default { buySubscription, subscription };