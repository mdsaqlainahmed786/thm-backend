import { ObjectId } from 'mongodb';
import { Request, Response, NextFunction } from "express";
import { parseQueryParam } from '../../utils/helper/basic';
import { httpAcceptedOrUpdated, httpNotFoundOr404, httpOkExtended, httpInternalServerError } from '../../utils/response';
import { ErrorMessage } from '../../utils/response-message/error';
import Post, { addGoogleReviewedBusinessProfileInPost, addMediaInPost, addPostedByInPost, addReviewedBusinessProfileInPost, countPostDocument, PostType } from '../../database/models/post.model';
import { addBusinessProfileInUser, addBusinessSubTypeInBusinessProfile, addBusinessTypeInBusinessProfile, profileBasicProject } from '../../database/models/user.model';
import { ContentType } from '../../common';
import { addAnonymousUserInPost } from '../../database/models/anonymousUser.model';
import { addUserInBusinessProfile } from '../../database/models/businessProfile.model';
const postTypes = Object.values(PostType)
const index = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id } = request.user;
        let { pageNumber, documentLimit, query, postType, sortBy, sortOrder }: any = request.query;
        pageNumber = parseQueryParam(pageNumber, 1);
        documentLimit = parseQueryParam(documentLimit, 20);
        const sortDirection = (sortOrder === "asc" ? 1 : -1) as 1 | -1;
        const sortObject: Record<string, 1 | -1> =
        sortBy === "views" ? { views: sortDirection } :
        sortBy === "likes" ? { likeCount: sortDirection } :
        sortBy === "reportCount" ? { reportCount: sortDirection } :
        { createdAt: -1 };
        const dbQuery: any = {};
        
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
                            addUserInBusinessProfile().lookup,
                            addUserInBusinessProfile().unwindLookup,
                            {
                                '$project': {
                                    "_id": {
                                        '$ifNull': [{ '$ifNull': ['$usersRef._id', ''] }, '']
                                    },
                                    "accountType": {
                                        '$ifNull': [{ '$ifNull': ['$usersRef.accountType', ''] }, '']
                                    },
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
                    '$lookup': {
                      from: "likes",
                      localField: "_id",
                        'foreignField': 'postID',
                        'as': 'likes'
                    }
                },
                {
                    '$addFields': {
                        'likeCount': { '$size': '$likes' }
                    }
                },
                {
                    '$unwind': {
                        'path': '$postedBy',
                        'preserveNullAndEmptyArrays': true//false value does not fetch relationship.
                    }
                },
                addAnonymousUserInPost().lookup,
                addAnonymousUserInPost().unwindLookup,
                {
                    '$lookup': {
                        'from': 'anonymoususers',
                        'let': { 'googleReviewedBusiness': '$googleReviewedBusiness' },
                        'pipeline': [
                            { '$match': { '$expr': { '$eq': ['$_id', '$$googleReviewedBusiness'] } } },
                            {
                                '$project': {
                                    "accountType": 1,
                                    "username": 1,
                                    "profilePic": 1,
                                    "name": 1,
                                    "coverImage": 1,
                                }
                            }
                        ],
                        'as': 'googleReviewedBusinessRef'
                    }
                },
                {
                    '$unwind': {
                        'path': '$googleReviewedBusinessRef',
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
                        reviewedBusinessProfileRef: {
                            $cond: {
                                if: { $eq: [{ $ifNull: ["$reviewedBusinessProfileRef", null] }, null] }, // Check if field is null or doesn't exist
                                then: "$googleReviewedBusinessRef", // Replace with googleReviewedBusinessRef
                                else: "$reviewedBusinessProfileRef" // Keep the existing value if it exists
                            }
                        },
                        postedBy: {
                            $cond: {
                                if: { $eq: [{ $ifNull: ["$postedBy", null] }, null] }, // Check if field is null or doesn't exist
                                then: "$publicPostedBy", // Replace with publicPostedBy
                                else: "$postedBy" // Keep the existing value if it exists
                            }
                        }
                    }
                },
                {
                    $addFields: {
                        reportCount: { $size: "$reports" }
                    }
                },
                { $sort: sortObject },
                {
                    $skip: pageNumber > 0 ? ((pageNumber - 1) * documentLimit) : 0
                },
                {
                    $limit: documentLimit
                },
                {
                    $unset: [
                        "publicPostedBy",
                        "googleReviewedBusinessRef",
                        "reports",
                        "__v"
                    ]
                }
            ]),
            countPostDocument(dbQuery),
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
