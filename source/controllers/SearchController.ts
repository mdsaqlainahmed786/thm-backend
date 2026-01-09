import { businessDialCodeValidationRule } from './../validation/rules/api-validation';
import { ObjectId } from 'mongodb';
import { Request, Response, NextFunction } from "express";
import { httpBadRequest, httpCreated, httpInternalServerError, httpNoContent, httpNotFoundOr404, httpOk } from "../utils/response";
import { ErrorMessage } from "../utils/response-message/error";
import Post, { countPostDocument, fetchPosts, getPostQuery, PostType } from "../database/models/post.model";
import Like, { addUserInLike } from '../database/models/like.model';
import Comment from '../database/models/comment.model';
import Story from "../database/models/story.model";
import User, { AccountType, getBlockedByUsers, getBlockedUsers } from "../database/models/user.model";
import { MongoID } from "../common";
import { NotificationType } from "../database/models/notification.model";
import { AppConfig } from "../config/constants";
import Notification from "../database/models/notification.model";
import DevicesConfig from "../database/models/appDeviceConfig.model";
import { Message } from "firebase-admin/lib/messaging/messaging-api";
import { DevicePlatform } from "../validation/common-validation";
import { parseQueryParam, truncate } from "../utils/helper/basic";
import { httpOkExtended } from "../utils/response";
import { addBusinessProfileInUser } from "../database/models/user.model";
import { getUserProfile } from '../database/models/user.model';
import BusinessProfile, { fetchBusinessIDs } from '../database/models/businessProfile.model';
import { activeUserQuery } from '../database/models/user.model';
import BlockedUser from '../database/models/blockedUser.model';
//FIXME deleted user and disabled user check
const index = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id, accountType, businessProfileID } = request.user;
        let { pageNumber, documentLimit, query, type, businessTypeID }: any = request.query;
        if (!accountType && !id) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        pageNumber = parseQueryParam(pageNumber, 1);
        documentLimit = parseQueryParam(documentLimit, 20);
        const dbQuery = {};
        let documents = [];
        let totalDocument = 0;
        let totalPagesCount = 0;
        let businessProfileIDs = [];
        if (type === "users") {
            const { documents, totalDocument, totalPagesCount } = await searchUsers(request);
            return response.send(httpOkExtended(documents, 'Profile fetched.', pageNumber, totalPagesCount, totalDocument));
        } else if (type === "business") {
            const { documents, totalDocument, totalPagesCount } = await searchBusinessUsers(request);
            return response.send(httpOkExtended(documents, 'Profile fetched.', pageNumber, totalPagesCount, totalDocument));
        } else if (type === "posts") {
            //FIXME need to add geolocation or mach more
            Object.assign(dbQuery, { postType: PostType.POST, ...getPostQuery });
            const userQuery = { ...activeUserQuery, privateAccount: false };
            businessProfileIDs = await fetchBusinessIDs(query, businessTypeID);
            if (businessTypeID && businessTypeID !== '') {
                Object.assign(userQuery, { businessProfileID: { $in: businessProfileIDs } })
            }
            if (query !== undefined && query !== "") {
                Object.assign(userQuery, {
                    $or: [
                        { name: { $regex: new RegExp(query.toLowerCase(), "i") }, ...activeUserQuery, privateAccount: false },
                        { username: { $regex: new RegExp(query.toLowerCase(), "i") }, ...activeUserQuery, privateAccount: false },
                        { businessProfileID: { $in: businessProfileIDs }, ...activeUserQuery, privateAccount: false }
                    ]
                });
            }
            const userIDs = await User.distinct('_id', userQuery);
            if (query !== undefined && query !== "") {
                Object.assign(dbQuery,
                    {
                        $or: [
                            { content: { $regex: new RegExp(query.toLowerCase(), "i") }, ...getPostQuery },
                            { "location.placeName": { $regex: new RegExp(query.toLowerCase(), "i") }, ...getPostQuery },
                            { userID: { $in: userIDs }, ...getPostQuery }
                        ]
                    }
                )
            } else {
                Object.assign(dbQuery, { userID: { $in: userIDs } });
            }
            [documents, totalDocument] = await Promise.all([
                fetchPosts(dbQuery, [], [], [], pageNumber, documentLimit, undefined, undefined, false, undefined, id),
                countPostDocument(dbQuery),
            ])
            totalPagesCount = Math.ceil(totalDocument / documentLimit) || 1;
            return response.send(httpOkExtended(documents, 'Posts fetched.', pageNumber, totalPagesCount, totalDocument));
        } else if (type === "events") {
            Object.assign(dbQuery, { postType: PostType.EVENT, ...getPostQuery });
            const userQuery = { ...activeUserQuery, privateAccount: false };
            businessProfileIDs = await fetchBusinessIDs(query, businessTypeID);
            //FIXME need to add geolocation or mach more
            if (businessTypeID && businessTypeID !== '') {
                Object.assign(userQuery, { businessProfileID: { $in: businessProfileIDs } })
            }
            if (query !== undefined && query !== "") {
                Object.assign(userQuery, {
                    $or: [
                        { name: { $regex: new RegExp(query.toLowerCase(), "i") }, ...activeUserQuery, privateAccount: false },
                        { username: { $regex: new RegExp(query.toLowerCase(), "i") }, ...activeUserQuery, privateAccount: false },
                        { businessProfileID: { $in: businessProfileIDs }, ...activeUserQuery, privateAccount: false }
                    ]
                });
            }
            const userIDs = await User.distinct('_id', userQuery);
            if (query !== undefined && query !== "") {
                Object.assign(dbQuery,
                    {
                        $or: [
                            { content: { $regex: new RegExp(query.toLowerCase(), "i") }, ...getPostQuery },
                            { name: { $regex: new RegExp(query.toLowerCase(), "i") }, ...getPostQuery },
                            { venue: { $regex: new RegExp(query.toLowerCase(), "i") }, ...getPostQuery },
                            { "location.placeName": { $regex: new RegExp(query.toLowerCase(), "i") }, ...getPostQuery },
                            { userID: { $in: userIDs }, ...getPostQuery }
                        ]
                    }
                )
            } else {
                Object.assign(dbQuery, { userID: { $in: userIDs } });
            }
            [documents, totalDocument] = await Promise.all([
                fetchPosts(dbQuery, [], [], [], pageNumber, documentLimit, undefined, undefined, false, undefined, id),
                countPostDocument(dbQuery),
            ])
            totalPagesCount = Math.ceil(totalDocument / documentLimit) || 1;
            return response.send(httpOkExtended(documents, 'Events fetched.', pageNumber, totalPagesCount, totalDocument));
        } else if (type === "reviews") {
            Object.assign(dbQuery, { postType: PostType.REVIEW, ...getPostQuery });
            const userQuery = { ...activeUserQuery, privateAccount: false };
            businessProfileIDs = await fetchBusinessIDs(query, businessTypeID);
            //FIXME need to add geolocation or mach more
            if (businessTypeID && businessTypeID !== '') {
                Object.assign(userQuery, { businessProfileID: { $in: businessProfileIDs } })
            }
            if (query !== undefined && query !== "") {
                Object.assign(userQuery, {
                    $or: [
                        { name: { $regex: new RegExp(query.toLowerCase(), "i") }, ...activeUserQuery, privateAccount: false },
                        { username: { $regex: new RegExp(query.toLowerCase(), "i") }, ...activeUserQuery, privateAccount: false },
                        { businessProfileID: { $in: businessProfileIDs }, ...activeUserQuery, privateAccount: false }
                    ]
                });
            }
            const userIDs = await User.distinct('_id', userQuery);
            if (query !== undefined && query !== "") {
                Object.assign(dbQuery,
                    {
                        $or: [
                            { content: { $regex: new RegExp(query.toLowerCase(), "i") }, ...getPostQuery },
                            { "location.placeName": { $regex: new RegExp(query.toLowerCase(), "i") }, ...getPostQuery },
                            { userID: { $in: userIDs }, ...getPostQuery }
                        ]
                    }
                )
            } else {
                Object.assign(dbQuery, { userID: { $in: userIDs } });
            }
            [documents, totalDocument] = await Promise.all([
                fetchPosts(dbQuery, [], [], [], pageNumber, documentLimit, undefined, undefined, false, undefined, id),
                countPostDocument(dbQuery),
            ])
            totalPagesCount = Math.ceil(totalDocument / documentLimit) || 1;
            return response.send(httpOkExtended(documents, 'Reviews fetched.', pageNumber, totalPagesCount, totalDocument));
        } else {
            return response.send(httpBadRequest(ErrorMessage.invalidRequest("Invalid type. Type must be business | users | posts | events | reviews"), "Invalid type. Type must be business | users | posts | events | reviews"))

        }

    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}

const store = async (request: Request, response: Response, next: NextFunction) => {
    try {
        // return response.send(httpAcceptedOrUpdated(null, 'Not implemented'));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const update = async (request: Request, response: Response, next: NextFunction) => {
    try {
        // return response.send(httpAcceptedOrUpdated(null, 'Not implemented'));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const destroy = async (request: Request, response: Response, next: NextFunction) => {
    try {
        // return response.send(httpOk(null, "Not implemented"));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const show = async (request: Request, response: Response, next: NextFunction) => {
    try {
        // return response.send(httpOk(null, "Not implemented"));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}

//FIXME radius based
const searchBusinessUsers = async (request: Request,) => {
    const { id, accountType, businessProfileID } = request.user;
    let { pageNumber, documentLimit, query, businessTypeID, lat, lng, radius }: any = request.query;
    pageNumber = parseQueryParam(pageNumber, 1);
    documentLimit = parseQueryParam(documentLimit, 20);
    const dbQuery = {};
    //Remove blocked user from search
    let [blockedUsers, businessProfileIDs] = await Promise.all([
        getBlockedByUsers(id),
        fetchBusinessIDs(query, businessTypeID, lat, lng, radius)
    ]);
    Object.assign(dbQuery, {
        ...activeUserQuery, _id: { $nin: blockedUsers },
        businessProfileID: { $in: businessProfileIDs },
        accountType: AccountType.BUSINESS,
    });
    const [documents, totalDocument] = await Promise.all([
        getUserProfile(dbQuery, pageNumber, documentLimit),
        User.find(dbQuery).countDocuments()
    ])
    let totalPagesCount = Math.ceil(totalDocument / documentLimit) || 1;
    return { documents, totalDocument, totalPagesCount }
}

const searchUsers = async (request: Request,) => {
    const { id, accountType, businessProfileID } = request.user;
    let { pageNumber, documentLimit, query }: any = request.query;
    pageNumber = parseQueryParam(pageNumber, 1);
    documentLimit = parseQueryParam(documentLimit, 20);
    const blockedUsers = await getBlockedByUsers(id);
    const dbQuery = { ...activeUserQuery, _id: { $nin: blockedUsers }, accountType: AccountType.INDIVIDUAL };
    if (query !== undefined && query !== "") {
        Object.assign(dbQuery,
            {
                $or: [
                    { name: { $regex: new RegExp(query.toLowerCase(), "i") }, },
                    { username: { $regex: new RegExp(query.toLowerCase(), "i") }, }
                ]
            }
        )
    }
    const [documents, totalDocument] = await Promise.all([
        getUserProfile(dbQuery, pageNumber, documentLimit),
        User.find(dbQuery).countDocuments()
    ])
    let totalPagesCount = Math.ceil(totalDocument / documentLimit) || 1;
    return { documents, totalDocument, totalPagesCount }
}



export default { index, store, update, destroy };
