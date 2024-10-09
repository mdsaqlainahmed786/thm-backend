import { Request, Response, NextFunction } from "express";
import { httpBadRequest, httpCreated, httpInternalServerError, httpNoContent, httpNotFoundOr404, httpOk, httpAcceptedOrUpdated, httpOkExtended } from "../utils/response";
import { ErrorMessage } from "../utils/response-message/error";
import { addBusinessProfileInUser } from "../database/models/user.model";
import User from '../database/models/user.model';
import UserConnection, { ConnectionStatus } from '../database/models/userConnection.model';
import { parseQueryParam } from '../utils/helper/basic';
import BusinessProfile from '../database/models/businessProfile.model';

const index = async (request: Request, response: Response, next: NextFunction) => {
    try {
        // let { pageNumber, documentLimit, query }: any = request.query;
        // const dbQuery = {};
        // pageNumber = parseQueryParam(pageNumber, 1);
        // documentLimit = parseQueryParam(documentLimit, 20);
        // if (query !== undefined && query !== "") {
        //     Object.assign(dbQuery,
        //         {
        //             $or: [
        //                 { DTNAME: { $regex: new RegExp(query.toLowerCase(), "i") } },
        //                 { DTABBR: { $regex: new RegExp(query.toLowerCase(), "i") } },
        //             ]
        //         }
        //     )
        // }
        // const documents = await DeathCode.aggregate(
        //     [
        //         {
        //             $match: dbQuery
        //         },
        //         {
        //             $sort: { _id: -1 }
        //         },
        //         {
        //             $skip: pageNumber > 0 ? ((pageNumber - 1) * documentLimit) : 0
        //         },
        //         {
        //             $limit: documentLimit
        //         },
        //     ]
        // ).exec();
        // const totalDocument = await DeathCode.find(dbQuery).countDocuments();
        // const totalPagesCount = Math.ceil(totalDocument / documentLimit) || 1;
        // return response.send(httpOkExtended(documents, 'Death code fetched.', pageNumber, totalPagesCount, totalDocument));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}

const sendFollowRequest = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const followingID = request.params.id;
        const { id } = request.user;
        const followingUser = await User.findOne({ _id: followingID });
        if (!id || !followingUser) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        const haveConnectedBefore = await UserConnection.findOne({
            $or: [
                // { follower: followingUser.id, following: id, status: { $in: [ConnectionStatus.PENDING, ConnectionStatus.ACCEPTED] } },
                { follower: id, following: followingUser.id, status: { $in: [ConnectionStatus.PENDING, ConnectionStatus.ACCEPTED] } },
            ]
        });
        if (!haveConnectedBefore) {
            const newUserConnection = new UserConnection();
            newUserConnection.follower = id;
            newUserConnection.following = followingUser.id;
            if (!followingUser.privateAccount) {
                newUserConnection.status = ConnectionStatus.ACCEPTED;
                //TODO notification here //Sakshi Reddy Started following you. 10min send connection id in notification
            }
            const follow = await newUserConnection.save();
            return response.send(httpCreated(follow, "A follow request has already been sent"))
        } else {
            let Message = (haveConnectedBefore.status === ConnectionStatus.ACCEPTED) ? "You are already following" : "Follow request already sent!";
            return response.send(httpAcceptedOrUpdated(null, Message))
        }
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}

const acceptFollow = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id } = request.user;
        const connectionID = request.params.id;
        const connection = await UserConnection.findOne({ _id: connectionID, following: id, status: ConnectionStatus.PENDING });
        if (!connection) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest("Follow request not found"), "Follow request not found"));
        }
        if (connection.status !== ConnectionStatus.ACCEPTED) {
            connection.status = ConnectionStatus.ACCEPTED;
            await connection.save();
            return response.send(httpAcceptedOrUpdated({}, "Follow request accepted"));
        }
        return response.send(httpAcceptedOrUpdated({}, "You are already following"));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const unFollow = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const followingID = request.params.id;
        const { id } = request.user;
        const followingUser = await User.findOne({ _id: followingID });
        if (!id || !followingUser) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        const connection = await UserConnection.findOne({ follower: id, following: followingUser.id });
        if (!connection) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest("Following not found"), "Following not found"));
        }
        await connection.deleteOne();
        return response.send(httpNoContent({}, 'Unfollowed user'));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const follower = async (request: Request, response: Response, next: NextFunction) => {
    try {


        const { id } = request.user;
        const userID = request.params.id;
        let { pageNumber, documentLimit, query }: any = request.query;
        pageNumber = parseQueryParam(pageNumber, 1);
        documentLimit = parseQueryParam(documentLimit, 30);
        const user = await User.findOne({ _id: userID });
        if (!id || !user) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }

        const followersIDs = await UserConnection.distinct('follower', { following: userID, status: ConnectionStatus.ACCEPTED });
        const dbQuery = { _id: { $in: followersIDs } };
        if (query !== undefined && query !== "") {
            //Search business profile
            const businessProfileIDs = await BusinessProfile.distinct('_id', {
                $or: [
                    { name: { $regex: new RegExp(query.toLowerCase(), "i") } },
                    { username: { $regex: new RegExp(query.toLowerCase(), "i") } },
                ]
            });
            Object.assign(dbQuery,
                {
                    $or: [
                        { name: { $regex: new RegExp(query.toLowerCase(), "i") } },
                        { username: { $regex: new RegExp(query.toLowerCase(), "i") } },
                        { businessProfileID: { $in: businessProfileIDs } }
                    ]
                }
            )
        }
        const [documents, totalDocument] = await Promise.all([
            User.aggregate(
                [
                    {
                        $match: dbQuery
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
                    {
                        $project: {
                            _id: 1,
                            name: 1,
                            accountType: 1,
                            username: 1,
                            "businessProfileRef.name": 1,
                            "businessProfileRef.profilePic": 1,
                            "businessProfileRef.businessTypeRef": 1,
                            "businessProfileRef.address": 1,
                        }
                    }
                ]
            ).exec(),
            User.find(dbQuery).countDocuments()
        ]);
        const totalPagesCount = Math.ceil(totalDocument / documentLimit) || 1;
        return response.send(httpOkExtended(documents, 'Follower fetched.', pageNumber, totalPagesCount, totalDocument));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const following = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id } = request.user;
        const userID = request.params.id;
        let { pageNumber, documentLimit, query }: any = request.query;
        pageNumber = parseQueryParam(pageNumber, 1);
        documentLimit = parseQueryParam(documentLimit, 30);
        const user = await User.findOne({ _id: userID });
        if (!id || !user) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        const followingIDs = await UserConnection.distinct('following', { follower: userID, status: ConnectionStatus.ACCEPTED });
        const dbQuery = { _id: { $in: followingIDs } };
        if (query !== undefined && query !== "") {
            //Search business profile
            const businessProfileIDs = await BusinessProfile.distinct('_id', {
                $or: [
                    { name: { $regex: new RegExp(query.toLowerCase(), "i") } },
                    { username: { $regex: new RegExp(query.toLowerCase(), "i") } },
                ]
            });
            Object.assign(dbQuery,
                {
                    $or: [
                        { name: { $regex: new RegExp(query.toLowerCase(), "i") } },
                        { username: { $regex: new RegExp(query.toLowerCase(), "i") } },
                        { businessProfileID: { $in: businessProfileIDs } }
                    ]
                }
            )
        }
        const [documents, totalDocument] = await Promise.all([
            User.aggregate(
                [
                    {
                        $match: dbQuery
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
                    {
                        $project: {
                            _id: 1,
                            name: 1,
                            accountType: 1,
                            username: 1,
                            "businessProfileRef.name": 1,
                            "businessProfileRef.profilePic": 1,
                            "businessProfileRef.businessTypeRef": 1,
                            "businessProfileRef.address": 1,
                        }
                    }
                ]
            ).exec(),
            User.find(dbQuery).countDocuments()
        ]);
        const totalPagesCount = Math.ceil(totalDocument / documentLimit) || 1;
        return response.send(httpOkExtended(documents, 'Following fetched.', pageNumber, totalPagesCount, totalDocument));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}


export default { index, sendFollowRequest, acceptFollow, unFollow, follower, following };
