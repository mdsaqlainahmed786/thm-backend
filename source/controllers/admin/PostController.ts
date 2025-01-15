import { ObjectId } from 'mongodb';
import { Request, Response, NextFunction } from "express";
import { parseQueryParam } from '../../utils/helper/basic';
import { httpAcceptedOrUpdated, httpNotFoundOr404, httpOkExtended, httpInternalServerError } from '../../utils/response';
import { ErrorMessage } from '../../utils/response-message/error';
import Post, { addMediaInPost, addPostedByInPost, addReviewedBusinessProfileInPost, PostType } from '../../database/models/post.model';
import { addBusinessProfileInUser, profileBasicProject } from '../../database/models/user.model';
import { ContentType } from '../../common';
import Review from '../../database/models/reviews.model';
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
            Post.aggregate([
                {
                    $match: dbQuery
                },
                addMediaInPost().lookup,
                {
                    '$lookup': {
                        'from': 'businessprofiles',
                        'let': { 'reviewedBusinessProfileID': '$reviewedBusinessProfileID' },
                        'pipeline': [
                            { '$match': { '$expr': { '$eq': ['$_id', '$$reviewedBusinessProfileID'] } } },
                            {
                                '$project': {
                                    "username": 1,
                                    "profilePic": 1,
                                    "name": 1,
                                    "coverImage": 1,
                                }
                            }
                        ],
                        'as': 'reviewedBusinessProfileRef'
                    }
                },
                {
                    '$unwind': {
                        'path': '$reviewedBusinessProfileRef',
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
                            addBusinessProfileInUser().mergeObject,
                            profileBasicProject(),
                        ],
                        'as': 'postedBy'
                    }
                },
                {
                    '$unwind': {
                        'path': '$postedBy',
                        'preserveNullAndEmptyArrays': true//false value does not fetch relationship.
                    }
                },
                {
                    '$lookup': {
                        'from': 'reports',
                        'let': { 'contentID': '$_id' },
                        'pipeline': [
                            { '$match': { '$expr': { '$eq': ['$contentID', '$$contentID'] }, contentType: ContentType.POST } },
                        ],
                        'as': 'reports'
                    }
                },
                {
                    $addFields: {
                        reportCount: { $size: "$reports" }
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
                        reports: 0
                    }
                }
            ]),
            Post.find(dbQuery).countDocuments()
        ]);
        const totalPagesCount = Math.ceil(totalDocument / documentLimit) || 1;
        return response.send(httpOkExtended(documents, 'Posts fetched.', pageNumber, totalPagesCount, totalDocument));
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
        const ID = request?.params?.id;
        const { isPublished, content, name, venue, streamingLink, startDate, startTime, endDate, endTime, type, feelings, rating } = request.body;
        const post = await Post.findOne({ _id: ID });
        if (!post) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.POST_NOT_FOUND), ErrorMessage.POST_NOT_FOUND));
        }
        post.isPublished = isPublished ?? post.isPublished;
        post.content = content ?? post.content;
        if (post.postType === PostType.EVENT) {
            post.name = name ?? post.name;
            post.venue = venue ?? post.venue;
            post.streamingLink = streamingLink ?? venue.streamingLink;
            post.startDate = startDate ?? post.startDate;
            post.startTime = startTime ?? post.startTime;
            post.endDate = endDate ?? post.endDate;
            post.endTime = endTime ?? post.endTime;
            post.type = type ?? post.type;
        }
        if (post.postType === PostType.REVIEW) {
            post.rating = rating ?? post.rating;
        }
        // post.code = code ?? post.code;
        // post.priceType = priceType ?? post.priceType;
        // post.value = value ?? post.value;
        // post.cartValue = cartValue ?? post.cartValue;
        // post.redeemedCount = redeemedCount ?? post.redeemedCount;
        // post.quantity = quantity ?? post.quantity;
        // post.validFrom = validFrom ?? post.validFrom;
        // post.validTo = validTo ?? post.validTo;
        // post.maxDiscount = maxDiscount ?? post.maxDiscount;
        // post.type = type ?? post.type;
        const savedPromoCode = await post.save();
        return response.send(httpAcceptedOrUpdated(savedPromoCode, 'Post updated'));
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
