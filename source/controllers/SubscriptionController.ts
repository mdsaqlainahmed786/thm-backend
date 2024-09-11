import { Request, Response, NextFunction, response } from "express";
import { httpOk, httpBadRequest, httpInternalServerError, httpNotFoundOr404, httpForbidden } from "../utils/response";
import User, { AccountType } from "../database/models/user.model";
import { ErrorMessage } from "../utils/response-message/error";
import Subscription from '../database/models/subscription.model';

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

export default { buySubscription };