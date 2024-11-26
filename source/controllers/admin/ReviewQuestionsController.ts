import { ObjectId } from 'mongodb';
import { Request, Response, NextFunction } from "express";
import { isArray, parseFloatToFixed, parseQueryParam } from '../../utils/helper/basic';
import { AccountType } from '../../database/models/user.model';
import { httpAcceptedOrUpdated, httpNotFoundOr404, httpOkExtended, httpInternalServerError, httpOk, httpCreated, httpNoContent } from '../../utils/response';
import { ErrorMessage } from '../../utils/response-message/error';
import User from '../../database/models/user.model';
import Post from '../../database/models/post.model';
import Report from '../../database/models/reportedUser.model';
import BusinessReviewQuestion from '../../database/models/businessReviewQuestion.model';
import BusinessSubType from '../../database/models/businessSubType.model';
import BusinessType from '../../database/models/businessType.model';
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
                        { question: { $regex: new RegExp(query.toLowerCase(), "i") } },
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
            BusinessReviewQuestion.aggregate([
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
            BusinessReviewQuestion.find(dbQuery).countDocuments()
        ]);
        const totalPagesCount = Math.ceil(totalDocument / documentLimit) || 1;
        return response.send(httpOkExtended(documents, 'Review question fetched.', pageNumber, totalPagesCount, totalDocument));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}

const store = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { question, businessSubtypeID, businessTypeID } = request.body;

        const [previousOrder, businessType, businessSubType] = await Promise.all([
            BusinessReviewQuestion.find({ businessTypeID: { $in: [businessTypeID] }, businessSubtypeID: { $in: [businessSubtypeID] } }).sort({ order: -1 }),
            BusinessType.findOne({ _id: businessTypeID }),
            BusinessSubType.findOne({ _id: businessSubtypeID }),
        ]);
        if (!businessType) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest("Business type not found"), "Business type not found"));
        }
        if (!businessSubType) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest("Business subtype not found"), "Business subtype not found"));
        }
        const newBusinessReviewQuestion = new BusinessReviewQuestion();
        newBusinessReviewQuestion.question = question;
        newBusinessReviewQuestion.order = previousOrder && previousOrder.length !== 0 ? previousOrder[0].order + 1 : 1;
        newBusinessReviewQuestion.businessTypeID = [businessTypeID];
        newBusinessReviewQuestion.businessSubtypeID = [businessSubtypeID];
        const savedSubscriptionPlan = await newBusinessReviewQuestion.save();
        return response.send(httpCreated(savedSubscriptionPlan, 'Review question created'));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const update = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const ID = request?.params?.id;
        const { question, businessSubtypeID, businessTypeID } = request.body;
        const [businessReviewQuestion, businessType, businessSubType] = await Promise.all([
            BusinessReviewQuestion.findOne({ _id: ID }),
            BusinessType.findOne({ _id: businessTypeID }),
            BusinessSubType.findOne({ _id: businessSubtypeID }),
        ]);
        if (!businessReviewQuestion) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest("Review question not found"), "Review question not found"));
        }
        if (!businessType) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest("Business type not found"), "Business type not found"));
        }
        if (!businessSubType) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest("Business subtype not found"), "Business subtype not found"));
        }

        businessReviewQuestion.question = question ?? businessReviewQuestion.question;
        if (businessTypeID) {
            businessReviewQuestion.businessSubtypeID = [businessSubtypeID];
        }
        if (businessSubtypeID) {
            businessReviewQuestion.businessTypeID = [businessTypeID];
        }
        const savedBusinessReviewQuestion = await businessReviewQuestion.save();
        return response.send(httpAcceptedOrUpdated(savedBusinessReviewQuestion, 'Review question updated.'));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const destroy = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const ID = request?.params?.id;
        const businessReviewQuestion = await BusinessReviewQuestion.findOne({ _id: ID });
        if (!businessReviewQuestion) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest("Review question not found"), "Review question not found"));
        }
        await businessReviewQuestion.deleteOne();
        return response.send(httpNoContent(null, 'Review question deleted'));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
export default { index, store, destroy, update }