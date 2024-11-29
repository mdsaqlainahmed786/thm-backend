
import { Request, Response, NextFunction, response } from "express";
import { parseQueryParam } from "../../utils/helper/basic";
import { httpNotFoundOr404, httpBadRequest, httpInternalServerError, httpOkExtended } from "../../utils/response";
import Subscription from "../../database/models/subscription.model";
import { ObjectId } from "mongodb";
import { ErrorMessage } from "../../utils/response-message/error";
import { addBusinessProfileInUser } from "../../database/models/user.model";
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
            Subscription.aggregate([
                {
                    $match: dbQuery
                },
                {
                    '$lookup': {
                        'from': 'subscriptionplans',
                        'let': { 'subscriptionPlanID': '$subscriptionPlanID' },
                        'pipeline': [
                            { '$match': { '$expr': { '$eq': ['$_id', '$$subscriptionPlanID'] } } },
                            {
                                '$project': {
                                    'createdAt': 0,
                                    'updatedAt': 0,
                                    '__v': 0,
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
                    '$lookup': {
                        'from': 'users',
                        'let': { 'userID': '$userID' },
                        'pipeline': [
                            { '$match': { '$expr': { '$eq': ['$_id', '$$userID'] } } },
                            addBusinessProfileInUser().lookup,
                            addBusinessProfileInUser().unwindLookup,
                            {
                                '$project': {
                                    "name": 1,
                                    "username": 1,
                                    "accountType": 1,
                                    'profilePic': 1,
                                    'businessProfileRef._id': 1,
                                    'businessProfileRef.profilePic': 1,
                                    'businessProfileRef.username': 1,
                                    'businessProfileRef.name': 1,
                                }
                            }
                        ],
                        'as': 'usersRef'
                    }
                },
                {
                    '$unwind': {
                        'path': '$usersRef',
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
            Subscription.find(dbQuery).countDocuments()
        ]);
        const totalPagesCount = Math.ceil(totalDocument / documentLimit) || 1;
        return response.send(httpOkExtended(documents, 'Subscription plan fetched.', pageNumber, totalPagesCount, totalDocument));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}


export default { index };