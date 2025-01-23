import { Request, Response, NextFunction } from "express";
import { httpInternalServerError, httpNotFoundOr404, httpOkExtended, httpNoContent } from "../../utils/response";
import { ErrorMessage } from "../../utils/response-message/error";
import { parseQueryParam } from "../../utils/helper/basic";
import Review from "../../database/models/reviews.model";
import { addBusinessProfileInUser, profileBasicProject } from "../../database/models/user.model";
import Post, { PostType } from "../../database/models/post.model";
import { addMediaInPost } from "../../database/models/post.model";
import { addUserInBusinessProfile } from "../../database/models/businessProfile.model";
import { addAnonymousUserInPost } from "../../database/models/anonymousUser.model";
import { ContentType } from "../../common";
const index = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id } = request.user;
        let { pageNumber, documentLimit, query, postType }: any = request.query;
        pageNumber = parseQueryParam(pageNumber, 1);
        documentLimit = parseQueryParam(documentLimit, 20);
        const dbQuery = { postType: PostType.REVIEW };
        if (!id) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        if (query !== undefined && query !== "") {
            Object.assign(dbQuery,
                {
                    $or: [
                        { content: { $regex: new RegExp(query.toLowerCase(), "i") }, },
                        { name: { $regex: new RegExp(query.toLowerCase(), "i") }, },
                        { email: { $regex: new RegExp(query.toLowerCase(), "i") }, },
                        { businessName: { $regex: new RegExp(query.toLowerCase(), "i") }, },
                    ]
                }
            )
        }
        // if (postType && postTypes.includes(postType)) {
        //     Object.assign(dbQuery, { postType: postType })
        // }
        const [documents, totalDocument] = await Promise.all([
            Post.aggregate([
                {
                    $match: dbQuery
                },
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
                        googleReviewedBusinessRef: 0,
                        publicPostedBy: 0,
                        reports: 0
                    }
                }
            ]),
            Post.find(dbQuery).countDocuments()
        ]);
        const totalPagesCount = Math.ceil(totalDocument / documentLimit) || 1;
        return response.send(httpOkExtended(documents, 'Reviews fetched.', pageNumber, totalPagesCount, totalDocument));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}


const destroy = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const ID = request?.params?.id;
        const review = await Review.findOne({ _id: ID });
        if (!review) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest("Review not found"), "Review not found"));
        }
        await review.deleteOne();
        return response.send(httpNoContent(null, 'Review deleted'));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
export default { index, destroy };
