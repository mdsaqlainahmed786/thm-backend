import { ObjectId } from 'mongodb';
import { Request, Response, NextFunction } from "express";
import { parseQueryParam } from '../../utils/helper/basic';
import { httpAcceptedOrUpdated, httpNotFoundOr404, httpOkExtended, httpInternalServerError } from '../../utils/response';
import { ErrorMessage } from '../../utils/response-message/error';
import Post, { addPostedByInPost, addReviewedBusinessProfileInPost, PostType } from '../../database/models/post.model';
import { addBusinessProfileInUser } from '../../database/models/user.model';
import { ContentType } from '../../common';
import PromoCode from '../../database/models/promoCode.model';
const postTypes = Object.values(PostType)
const index = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id } = request.user;
        let { pageNumber, documentLimit, query, postType }: any = request.query;
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
                        { content: { $regex: new RegExp(query.toLowerCase(), "i") }, isPublished: true },
                        { name: { $regex: new RegExp(query.toLowerCase(), "i") }, isPublished: true },
                        { venue: { $regex: new RegExp(query.toLowerCase(), "i") }, isPublished: true },
                        { streamingLink: { $regex: new RegExp(query.toLowerCase(), "i") }, isPublished: true },
                        { 'location.placeName': { $regex: new RegExp(query.toLowerCase(), "i") }, isPublished: true }
                    ]
                }
            )
        }
        if (postType && postTypes.includes(postType)) {
            Object.assign(dbQuery, { postType: postType })
        }
        const [documents, totalDocument] = await Promise.all([
            PromoCode.aggregate([
                {
                    $match: dbQuery
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
                        reports: 0
                    }
                }
            ]),
            PromoCode.find(dbQuery).countDocuments()
        ]);
        const totalPagesCount = Math.ceil(totalDocument / documentLimit) || 1;
        return response.send(httpOkExtended(documents, 'Promo codes fetched.', pageNumber, totalPagesCount, totalDocument));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}


const store = async (request: Request, response: Response, next: NextFunction) => {
    try {

    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const update = async (request: Request, response: Response, next: NextFunction) => {
    try {

    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const destroy = async (request: Request, response: Response, next: NextFunction) => {
    try {
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const show = async (request: Request, response: Response, next: NextFunction) => {
    try {

    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}



export default { index, store, update, destroy, show };
