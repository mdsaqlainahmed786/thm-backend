import { ObjectId } from 'mongodb';
import { Request, Response, NextFunction } from "express";
import { httpAcceptedOrUpdated, httpBadRequest, httpCreated, httpInternalServerError, httpNoContent, httpNotFoundOr404, httpOk, httpOkExtended } from "../../utils/response";
import { ErrorMessage } from "../../utils/response-message/error";
import { parseQueryParam } from "../../utils/helper/basic";
import User, { AccountType, addBusinessProfileInUser } from "../../database/models/user.model";
import Post, { getPostsCount } from '../../database/models/post.model';
import { ConnectionStatus } from './../../database/models/userConnection.model';
import UserConnection from '../../database/models/userConnection.model';
import BusinessProfile from '../../database/models/businessProfile.model';
import { ContentType, Role } from '../../common';
const index = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id } = request.user;

        if (!id) {
            return response.send(
                httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), 
                ErrorMessage.USER_NOT_FOUND)
            );
        }

        let { pageNumber, documentLimit, query, accountType, businessTypeID, businessSubTypeID, sortBy, sortOrder }: any = request.query;

        pageNumber = parseQueryParam(pageNumber, 1);
        documentLimit = parseQueryParam(documentLimit, 20);

        const matchQuery: any = {};

        if (accountType) matchQuery.accountType = accountType;

        if (query && query.trim() !== "") {
            matchQuery.$or = [
                { username: { $regex: query, $options: "i" } },
                { name: { $regex: query, $options: "i" } },
                { email: { $regex: query, $options: "i" } },
                { phoneNumber: { $regex: query, $options: "i" } }
            ];
        }

       
        if (accountType === AccountType.BUSINESS) {
            const businessQuery: any = {};

            if (query && query.trim() !== "") {
                businessQuery.$or = [
                    { username: { $regex: query, $options: "i" } },
                    { name: { $regex: query, $options: "i" } },
                    { email: { $regex: query, $options: "i" } },
                    { phoneNumber: { $regex: query, $options: "i" } }
                ];
            }

            if (businessTypeID) businessQuery.businessTypeID = new ObjectId(businessTypeID);
            if (businessSubTypeID) businessQuery.businessSubTypeID = new ObjectId(businessSubTypeID);

            const businessIDs = await BusinessProfile.distinct("_id", businessQuery);
            matchQuery.businessProfileID = { $in: businessIDs };
        }

        const isSortFollowers = sortBy === "followers";
        const sortDirection = sortOrder === "asc" ? 1 : -1;

        const sortObject = isSortFollowers
            ? { followersCount: sortDirection, createdAt: -1 }
            : { createdAt: -1 };

        const pipeline: any[] = [
            { $match: matchQuery },

            
            addBusinessProfileInUser().lookup,
            {
                $unwind: {
                    path: addBusinessProfileInUser().unwindLookup.$unwind.path,
                    preserveNullAndEmptyArrays: true
                }
            },

            
            {
                $lookup: {
                    from: "userconnections",
                    let: { userId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$following", "$$userId"] },
                                        { $eq: ["$status", "accepted"] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: "followersRef"
                }
            },

            
            {
                $addFields: {
                    followersCount: { $size: "$followersRef" }
                }
            },

            
            {
                $project: {
                    password: 0,
                    updatedAt: 0,
                    __v: 0,
                    followersRef: 0
                }
            },

            
            { $sort: sortObject },

            
            { $skip: (pageNumber - 1) * documentLimit },
            { $limit: documentLimit }
        ];

            
        const [documents, total] = await Promise.all([
            User.aggregate(pipeline),
            User.countDocuments(matchQuery)
        ]);

        const totalPages = Math.ceil(total / documentLimit);

        return response.send(
            httpOkExtended(documents, "User fetched.", pageNumber, totalPages, total)
        );

    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
};


const store = async (request: Request, response: Response, next: NextFunction) => {
    try {
        // return response.send(httpNoContent(null, 'Not implemented'));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const update = async (request: Request, response: Response, next: NextFunction) => {
    try {
        let { id } = request.params;
        const { name, bio, isVerified, isApproved, isActivated, isDeleted, role } = request.body;
        const user = await User.findOne({ _id: id })
        if (!user) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        user.name = name ?? user.name;
        user.bio = bio ?? user.bio;
        user.isVerified = isVerified ?? user.isVerified;
        user.isApproved = isApproved ?? user.isApproved;
        user.isActivated = isActivated ?? user.isActivated;
        if (role && [Role.USER, Role.MODERATOR].includes(role)) {
            user.role = role ?? user.role;
        }
        user.isDeleted = isDeleted ?? user.isDeleted;
        const savedUser = await user.save();
        return response.send(httpAcceptedOrUpdated(savedUser, 'User updated'));
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
        const [user, posts, follower, following] = await Promise.all([
            User.aggregate([
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
                    '$lookup': {
                        'from': 'businessdocuments',
                        'let': { 'businessProfileID': '$businessProfileID' },
                        'pipeline': [
                            { '$match': { '$expr': { '$eq': ['$businessProfileID', '$$businessProfileID'] } } },
                            {
                                '$project': {
                                    'createdAt': 0,
                                    'updatedAt': 0,
                                    '__v': 0,
                                }
                            }
                        ],
                        'as': 'businessDocumentsRef'
                    }
                },
                {
                    '$lookup': {
                        'from': 'reports',
                        'let': { 'contentID': '$_id' },
                        'pipeline': [
                            { '$match': { '$expr': { '$eq': ['$contentID', '$$contentID'] }, contentType: ContentType.USER } },
                        ],
                        'as': 'reportsRef'
                    }
                },
                {
                    $addFields: {
                        reportCount: { $size: "$reportsRef" }
                    }
                },
                {
                    $sort: { _id: -1 }
                },
                {
                    $limit: 1
                },
                {
                    $project: {
                        reportsRef: 0
                    }
                }
            ]),
            getPostsCount(id),
            UserConnection.find({ following: id, status: ConnectionStatus.ACCEPTED }).countDocuments(),
            UserConnection.find({ follower: id, status: ConnectionStatus.ACCEPTED }).countDocuments(),
        ]);
        if (user.length === 0) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        let responseData = { posts: posts, follower: follower, following: following, ...user[0] };
        return response.send(httpOk(responseData, "User data fetched"));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}

export default { index, store, update, destroy, show };
