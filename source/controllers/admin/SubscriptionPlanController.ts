import { ObjectId } from 'mongodb';
import { Request, Response, NextFunction } from "express";
import { httpBadRequest, httpCreated, httpInternalServerError, httpNoContent, httpNotFoundOr404, httpOk, httpOkExtended } from "../../utils/response";
import { ErrorMessage } from "../../utils/response-message/error";
import { parseQueryParam } from "../../utils/helper/basic";
import User, { addBusinessProfileInUser } from "../../database/models/user.model";
import Post from '../../database/models/post.model';
import { ConnectionStatus } from '../../database/models/userConnection.model';
import UserConnection from '../../database/models/userConnection.model';
import SubscriptionPlan from '../../database/models/subscriptionPlan.model';
const index = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id } = request.user;
        let { pageNumber, documentLimit, query, businessType, businessSubtype }: any = request.query;
        pageNumber = parseQueryParam(pageNumber, 1);
        documentLimit = parseQueryParam(documentLimit, 20);
        const dbQuery = {};
        if (!id) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        if (query !== undefined && query !== "") {
            Object.assign(dbQuery,
                {
                    $or: [
                        { name: { $regex: new RegExp(query.toLowerCase(), "i") } },
                        { description: { $regex: new RegExp(query.toLowerCase(), "i") } },
                    ]
                }
            )
        }
        if (businessType !== undefined) {
            Object.assign(dbQuery, { businessTypeID: { $in: [new ObjectId(businessType)] } })
        }
        if (businessSubtype !== businessSubtype) {
            Object.assign(dbQuery, { businessSubtypeID: { $in: [new ObjectId(businessSubtype)] } })
        }
        const [documents, totalDocument] = await Promise.all([
            SubscriptionPlan.aggregate([
                {
                    $match: dbQuery
                },
                {
                    $project: {
                        password: 0,
                        updatedAt: 0,
                        __v: 0,
                    }
                },
                addBusinessProfileInUser().lookup,
                addBusinessProfileInUser().unwindLookup,
                {
                    $sort: { createdAt: -1, id: 1 }
                },
                {
                    $skip: pageNumber > 0 ? ((pageNumber - 1) * documentLimit) : 0
                },
                {
                    $limit: documentLimit
                },
            ]),
            SubscriptionPlan.find(dbQuery).countDocuments()
        ]);
        const totalPagesCount = Math.ceil(totalDocument / documentLimit) || 1;
        return response.send(httpOkExtended(documents, 'Subscription plan fetched.', pageNumber, totalPagesCount, totalDocument));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}

const store = async (request: Request, response: Response, next: NextFunction) => {
    try {

        // return response.send(httpNoContent(null, 'Not implemented'));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const update = async (request: Request, response: Response, next: NextFunction) => {
    try {
        // return response.send(httpAcceptedOrUpdated({}, 'Not implemented'));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const destroy = async (request: Request, response: Response, next: NextFunction) => {
    try {
        // return response.send(httpNoContent({}, 'Not implemented'));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const show = async (request: Request, response: Response, next: NextFunction) => {
    try {
        let { id } = request.params;
        const dbQuery = { _id: new ObjectId(id) };
        const subscriptionPlan = await SubscriptionPlan.aggregate([
            {
                $match: dbQuery
            },
            {
                $project: {
                    password: 0,
                    updatedAt: 0,
                    __v: 0,
                }
            },
            {
                $sort: { createdAt: -1, id: 1 }
            },
            {
                $limit: 1
            },
        ]);
        if (subscriptionPlan.length === 0) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.SUBSCRIPTION_NOT_FOUND), ErrorMessage.SUBSCRIPTION_NOT_FOUND));
        }
        return response.send(httpOk(subscriptionPlan[0], "Subscription data fetched"));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}

export default { index, store, update, destroy, show };
