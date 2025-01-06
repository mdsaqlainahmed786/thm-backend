import { Request, Response, NextFunction } from "express";
import { httpBadRequest, httpCreated, httpInternalServerError, httpNoContent, httpNotFoundOr404, httpOk, httpAcceptedOrUpdated, httpOkExtended } from "../utils/response";
import { ErrorMessage } from "../utils/response-message/error";
import { addBusinessProfileInUser, getUserProfile } from "../database/models/user.model";
import User from '../database/models/user.model';
import UserConnection, { ConnectionStatus } from '../database/models/userConnection.model';
import { parseQueryParam } from '../utils/helper/basic';
import BusinessProfile from '../database/models/businessProfile.model';
import AppNotificationController from "./AppNotificationController";
import { NotificationType } from "../database/models/notification.model";
import { AccountType } from "../database/models/user.model";
import { v4 } from "uuid";
import { Role } from "../common";
const index = async (request: Request, response: Response, next: NextFunction) => {
    try {

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
        if (id === followingID) {
            return response.send(httpBadRequest(ErrorMessage.invalidRequest("Following your own account is not allowed. Please follow other users.z"), "Following your own account is not allowed. Please follow other users."))
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
            }
            const follow = await newUserConnection.save();
            if (follow.status === ConnectionStatus.ACCEPTED) {
                AppNotificationController.store(id, followingUser.id, NotificationType.FOLLOWING, { connectionID: newUserConnection.id, userID: followingUser.id }).catch((error) => console.error(error));
            } else {
                AppNotificationController.store(id, followingUser.id, NotificationType.FOLLOW_REQUEST, { connectionID: newUserConnection.id, userID: followingUser.id }).catch((error) => console.error(error));
            }
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
            //Send self notification
            AppNotificationController.store(connection.follower, id, NotificationType.FOLLOWING, { connectionID: connection.id, userID: connection.follower }).catch((error) => console.error(error));
            //Remove connection request notification from app notification
            AppNotificationController.destroy(connection.follower, connection.following, NotificationType.FOLLOW_REQUEST, { connectionID: connection.id, userID: connection.following })
            //Notify the follower 
            AppNotificationController.store(id, connection.follower, NotificationType.ACCEPT_FOLLOW_REQUEST, { connectionID: connection.id, userID: connection.follower })
            return response.send(httpAcceptedOrUpdated(connection, "Follow request accepted"));
        }
        return response.send(httpAcceptedOrUpdated(connection, "You are already following"));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}

const rejectFollow = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id } = request.user;
        const connectionID = request.params.id;
        const connection = await UserConnection.findOne({ _id: connectionID, following: id, status: ConnectionStatus.PENDING });
        if (!connection) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest("Follow request not found"), "Follow request not found"));
        }
        if (connection.status !== ConnectionStatus.ACCEPTED) {

            //Remove connection request notification from app notification
            AppNotificationController.destroy(connection.follower, connection.following, NotificationType.FOLLOW_REQUEST, { connectionID: connection.id, userID: connection.following })
            // connection.status = ConnectionStatus.REJECT;
            await connection.deleteOne();
            return response.send(httpAcceptedOrUpdated(null, "Follow request rejected"));
        }
        return response.send(httpAcceptedOrUpdated(null, "Follow request rejected"));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}


const followBack = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id } = request.user;
        const connectionID = request.params.id;
        const connection = await UserConnection.findOne({ _id: connectionID, following: id, status: ConnectionStatus.ACCEPTED });
        if (!connection) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest("Follow request not found"), "Follow request not found"));
        }
        //Send connection requestion
        const followingUser = await User.findOne({ _id: connection.follower });
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
            }
            const follow = await newUserConnection.save();
            if (follow.status === ConnectionStatus.ACCEPTED) {
                AppNotificationController.store(id, followingUser.id, NotificationType.FOLLOWING, { connectionID: newUserConnection.id, userID: followingUser.id }).catch((error) => console.error(error));
            } else {
                AppNotificationController.store(id, followingUser.id, NotificationType.FOLLOW_REQUEST, { connectionID: newUserConnection.id, userID: followingUser.id }).catch((error) => console.error(error));
            }
            return response.send(httpCreated(follow, "A follow request has already been sent"))
        } else {
            let Message = (haveConnectedBefore.status === ConnectionStatus.ACCEPTED) ? "You are already following" : "Follow request already sent!";
            return response.send(httpAcceptedOrUpdated(connection, Message))
        }
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
        return response.send(httpNoContent(null, 'Unfollowed user'));
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
        const [followersIDs, inMyFollowing] = await Promise.all([
            UserConnection.distinct('follower', { following: userID, status: ConnectionStatus.ACCEPTED }),
            UserConnection.findOne({ following: userID, follower: id, status: ConnectionStatus.ACCEPTED })
        ]);
        if (userID !== id && !inMyFollowing && user.privateAccount) {
            return response.send(httpBadRequest(ErrorMessage.invalidRequest("This account is Private. Follow this account to see their following."), "This account is Private. Follow this account to see their following."))
        }
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
            getUserProfile(dbQuery, pageNumber, documentLimit),
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
        const [followingIDs, inMyFollowing] = await Promise.all([
            UserConnection.distinct('following', { follower: userID, status: ConnectionStatus.ACCEPTED }),
            UserConnection.findOne({ following: userID, follower: id, status: ConnectionStatus.ACCEPTED })
        ]);
        if (userID !== id && !inMyFollowing && user.privateAccount) {
            return response.send(httpBadRequest(ErrorMessage.invalidRequest("This account is Private. Follow this account to see their following."), "This account is Private. Follow this account to see their following."))
        }
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
            getUserProfile(dbQuery, pageNumber, documentLimit),
            User.find(dbQuery).countDocuments()
        ]);
        const totalPagesCount = Math.ceil(totalDocument / documentLimit) || 1;
        return response.send(httpOkExtended(documents, 'Following fetched.', pageNumber, totalPagesCount, totalDocument));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}

const createDefaultProfile = async () => {
    const email = 'contact@thehotelmedia.com';
    const username = 'thehotelmedia';
    const name = 'The Hotel Media';
    const dialCode = '+91';
    const phoneNumber = '7738727020'
    const hostAddress = 'https://thehotelmedia.com';
    const isAccountExit = await User.findOne({ email: email, role: Role.OFFICIAL });
    if (!isAccountExit) {
        const newUser = new User();
        newUser.profilePic = {
            small: hostAddress + '/public/files/thm-logo-sm.png',
            large: hostAddress + '/public/files/thm-logo-md.png',
            medium: hostAddress + '/public/files/thm-logo-lg.png'
        };
        newUser.bio = 'Your go-to app 📱 for honest reviews 💬\n and trusted ratings across a wide range of categories.'
        newUser.username = username;
        newUser.email = email;
        newUser.name = name;
        newUser.accountType = AccountType.INDIVIDUAL;
        newUser.dialCode = dialCode;
        newUser.phoneNumber = phoneNumber;
        newUser.password = v4();
        newUser.isActivated = true;
        newUser.isVerified = true;
        newUser.hasProfilePicture = true;
        newUser.role = Role.OFFICIAL;
        return await newUser.save();
    }
    return isAccountExit;
}

export default { index, sendFollowRequest, acceptFollow, rejectFollow, unFollow, follower, following, followBack, createDefaultProfile };
