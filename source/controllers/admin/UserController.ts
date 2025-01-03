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
import { Role } from '../../common';
const index = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id } = request.user;
        let { pageNumber, documentLimit, query, accountType, businessTypeID, businessSubTypeID }: any = request.query;
        pageNumber = parseQueryParam(pageNumber, 1);
        documentLimit = parseQueryParam(documentLimit, 20);
        const userQuery = {};
        const queryArray = [];
        if (query !== undefined && query !== "") {
            Object.assign(userQuery,
                {
                    $or: [
                        { username: { $regex: new RegExp(query.toLowerCase(), "i") } },
                        { name: { $regex: new RegExp(query.toLowerCase(), "i") } },
                        { email: { $regex: new RegExp(query.toLowerCase(), "i") } },
                        { phoneNumber: { $regex: new RegExp(query.toLowerCase(), "i") } }
                    ]
                }
            )
        }
        if (accountType === AccountType.INDIVIDUAL) {
            Object.assign(userQuery, { accountType })
            queryArray.push(userQuery);
        }

        if (accountType === AccountType.BUSINESS) {
            Object.assign(userQuery, { accountType });
            const businessQuery = {};
            if (query !== undefined && query !== "") {
                Object.assign(businessQuery,
                    {
                        $or: [
                            { username: { $regex: new RegExp(query.toLowerCase(), "i") } },
                            { name: { $regex: new RegExp(query.toLowerCase(), "i") } },
                            { email: { $regex: new RegExp(query.toLowerCase(), "i") } },
                            { phoneNumber: { $regex: new RegExp(query.toLowerCase(), "i") } }
                        ]
                    }
                )
            }
            if (businessTypeID && businessTypeID !== '') {
                Object.assign(businessQuery, { businessTypeID: { $in: [new ObjectId(businessTypeID)] } })
            }
            if (businessSubTypeID && businessSubTypeID !== '') {
                Object.assign(businessQuery, { businessSubTypeID: { $in: [new ObjectId(businessSubTypeID)] } })
            }
            const businessProfileIDs = await BusinessProfile.distinct('_id', businessQuery);
            //TODO
            Object.assign(userQuery, { businessProfileID: { $in: businessProfileIDs } })
            queryArray.push({ businessProfileID: { $in: businessProfileIDs } })
            queryArray.push(userQuery);
        }
        if (!id) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        const dbQuery = {
            $or: queryArray
        }
        console.log(dbQuery);
        const [documents, totalDocument] = await Promise.all([
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
                    $sort: { createdAt: -1, id: 1 }
                },
                {
                    $skip: pageNumber > 0 ? ((pageNumber - 1) * documentLimit) : 0
                },
                {
                    $limit: documentLimit
                },
            ]),
            User.find(dbQuery).countDocuments()
        ]);
        const totalPagesCount = Math.ceil(totalDocument / documentLimit) || 1;
        return response.send(httpOkExtended(documents, 'User fetched.', pageNumber, totalPagesCount, totalDocument));
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
        let { id } = request.params;
        const { name, bio, isVerified, isApproved, isActivated, role } = request.body;
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
                    $sort: { _id: -1 }
                },

                {
                    $limit: 1
                },
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
