import { ObjectId } from 'mongodb';
import { Request, Response, NextFunction } from "express";
import { httpAcceptedOrUpdated, httpBadRequest, httpCreated, httpInternalServerError, httpNoContent, httpNotFoundOr404, httpOk, httpOkExtended } from "../../utils/response";
import { ErrorMessage } from "../../utils/response-message/error";
import { isArray, parseQueryParam } from "../../utils/helper/basic";
import User, { addBusinessProfileInUser } from "../../database/models/user.model";
import Post from '../../database/models/post.model';
import { ConnectionStatus } from '../../database/models/userConnection.model';
import UserConnection from '../../database/models/userConnection.model';
import SubscriptionPlan, { SubscriptionLevel } from '../../database/models/subscriptionPlan.model';
const index = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id } = request.user;
        let { pageNumber, documentLimit, query, businessTypeID, businessSubtypeID, duration }: any = request.query;
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
        if (businessTypeID && businessTypeID !== undefined) {
            Object.assign(dbQuery, { businessTypeID: { $in: [new ObjectId(businessTypeID)] } })
        }
        if (businessSubtypeID && businessSubtypeID !== undefined) {
            Object.assign(dbQuery, { businessSubtypeID: { $in: [new ObjectId(businessSubtypeID)] } })
        }
        if (duration && duration !== undefined) {
            Object.assign(dbQuery, { duration: duration })
        }
        const [documents, totalDocument] = await Promise.all([
            SubscriptionPlan.aggregate([
                {
                    $match: dbQuery
                },
                {
                    '$lookup': {
                        'from': 'businesstypes',
                        'let': { 'businessTypeID': '$businessTypeID' },
                        'pipeline': [
                            { '$match': { '$expr': { '$in': ['$_id', '$$businessTypeID'] } } },
                            {
                                '$project': {
                                    'createdAt': 0,
                                    'updatedAt': 0,
                                    '__v': 0,
                                }
                            }
                        ],
                        'as': 'businessTypeRef'
                    }
                },
                {
                    '$unwind': {
                        'path': '$businessTypeRef',
                        'preserveNullAndEmptyArrays': true//false value does not fetch relationship.
                    }
                },
                {
                    '$lookup': {
                        'from': 'businesssubtypes',
                        'let': { 'businessSubtypeID': '$businessSubtypeID' },
                        'pipeline': [
                            { '$match': { '$expr': { '$in': ['$_id', '$$businessSubtypeID'] } } },
                            {
                                '$project': {
                                    'businessTypeID': 0,
                                    'createdAt': 0,
                                    'updatedAt': 0,
                                    '__v': 0,
                                }
                            }
                        ],
                        'as': 'businessSubtypeRef'
                    }
                },
                {
                    '$unwind': {
                        'path': '$businessSubtypeRef',
                        'preserveNullAndEmptyArrays': true//false value does not fetch relationship.
                    }
                },
                {
                    $sort: { createdAt: -1, id: 1 }
                },
                {
                    $skip: pageNumber > 0 ? ((pageNumber - 1) * documentLimit) : 0
                },
                {
                    $limit: documentLimit
                },
                {
                    $project: {
                        updatedAt: 0,
                        __v: 0,
                    }
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
        const hostAddress = request.protocol + "://" + request.get("host");
        const { name, description, price, duration, type, currency, level, businessSubtypeID, businessTypeID, features } = request.body;
        const newSubscriptionPlan = new SubscriptionPlan();
        newSubscriptionPlan.name = name;
        newSubscriptionPlan.description = description;
        newSubscriptionPlan.price = price;
        newSubscriptionPlan.duration = duration;
        if (level === SubscriptionLevel.BASIC) {
            newSubscriptionPlan.image = hostAddress + '/public/files/basic-subscription-plan.png';
        }
        if (level === SubscriptionLevel.STANDARD) {
            newSubscriptionPlan.image = hostAddress + '/public/files/standard-subscription-plan.png';
        }
        if (level === SubscriptionLevel.PREMIUM) {
            newSubscriptionPlan.image = hostAddress + '/public/files/premium-subscription-plan.png';
        }
        newSubscriptionPlan.type = type;
        newSubscriptionPlan.level = level;
        newSubscriptionPlan.currency = currency;
        if (features && isArray(features)) {
            newSubscriptionPlan.features = features;
        }
        if (businessTypeID) {
            newSubscriptionPlan.businessTypeID = [businessTypeID];
        }
        if (businessSubtypeID) {
            newSubscriptionPlan.businessSubtypeID = [businessSubtypeID];
        }
        const savedSubscriptionPlan = await newSubscriptionPlan.save();
        return response.send(httpCreated(savedSubscriptionPlan, 'Subscription created'));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const update = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const ID = request?.params?.id;
        const { name, description, price, duration, type, currency, level, businessSubtypeID, businessTypeID, features } = request.body;
        const subscriptionPlan = await SubscriptionPlan.findOne({ _id: ID });
        if (!subscriptionPlan) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest("Subscription plan not found"), "Subscription plan not found"));
        }
        subscriptionPlan.name = name ?? subscriptionPlan.name;
        subscriptionPlan.description = description ?? subscriptionPlan.description;
        subscriptionPlan.price = price ?? subscriptionPlan.price;
        subscriptionPlan.duration = duration ?? subscriptionPlan.duration;
        subscriptionPlan.type = type ?? subscriptionPlan.type;
        subscriptionPlan.currency = currency ?? subscriptionPlan.currency;
        subscriptionPlan.level = level ?? subscriptionPlan.level;
        if (businessTypeID) {
            subscriptionPlan.businessSubtypeID = [businessSubtypeID];
        }
        if (businessSubtypeID) {
            subscriptionPlan.businessTypeID = [businessTypeID];
        }
        if (features && isArray(features)) {
            subscriptionPlan.features = features;
        }
        const savedSubscriptionPlan = await subscriptionPlan.save();
        return response.send(httpAcceptedOrUpdated(savedSubscriptionPlan, 'Subscription plan updated.'));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const destroy = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const ID = request?.params?.id;
        const subscriptionPlan = await SubscriptionPlan.findOne({ _id: ID });
        if (!subscriptionPlan) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest("Subscription plan not found"), "Subscription plan not found"));
        }
        await subscriptionPlan.deleteOne();
        return response.send(httpNoContent(null, 'Subscription plan deleted'));
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
