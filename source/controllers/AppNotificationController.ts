import { ObjectId } from 'mongodb';
import { Request, Response, NextFunction } from "express";
import { httpBadRequest, httpCreated, httpInternalServerError, httpNoContent, httpNotFoundOr404, httpOk } from "../utils/response";
import { ErrorMessage } from "../utils/response-message/error";
import User from "../database/models/user.model";
import { MongoID } from "../common";
import { NotificationType } from "../database/models/notification.model";
import { AppConfig } from "../config/constants";
import Notification from "../database/models/notification.model";
import DevicesConfig from "../database/models/appDeviceConfig.model";
import { Message } from "firebase-admin/lib/messaging/messaging-api";
import { createMessagePayload, sendNotification } from "../notification/FirebaseNotificationController";
import { parseQueryParam, truncate } from "../utils/helper/basic";
import { httpOkExtended } from "../utils/response";
import { addBusinessProfileInUser } from "../database/models/user.model";
import { v4 } from 'uuid';
import UserConnection, { ConnectionStatus } from '../database/models/userConnection.model';
const index = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id, accountType, businessProfileID } = request.user;
        let { pageNumber, documentLimit, query }: any = request.query;
        if (!accountType && !id) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        pageNumber = parseQueryParam(pageNumber, 1);
        documentLimit = parseQueryParam(documentLimit, 20);
        const dbQuery = { isDeleted: false, targetUserID: new ObjectId(id) };
        if (query !== undefined && query !== "") {
            Object.assign(dbQuery,
                // {
                //     $or: [
                //         { DTNAME: { $regex: new RegExp(query.toLowerCase(), "i") } },
                //         { DTABBR: { $regex: new RegExp(query.toLowerCase(), "i") } },
                //     ]
                // }
            )
        }
        const [isRequested, isConnected] = await Promise.all(
            [
                UserConnection.distinct('following', { follower: id, status: ConnectionStatus.PENDING }),
                UserConnection.distinct('following', { follower: id, status: ConnectionStatus.ACCEPTED })
            ]
        );
        const documents = await Notification.aggregate(
            [
                {
                    $match: dbQuery
                },
                {
                    '$lookup': {
                        'from': 'users',
                        'let': { 'userID': '$userID' },
                        'pipeline': [
                            { '$match': { '$expr': { '$eq': ['$_id', '$$userID'] } } },
                            addBusinessProfileInUser().lookup,
                            addBusinessProfileInUser().unwindLookup,
                            {
                                '$project': {
                                    "name": 1,
                                    "username": 1,
                                    "accountType": 1,
                                    'profilePic': 1,
                                    'businessProfileRef._id': 1,
                                    'businessProfileRef.profilePic': 1,
                                    'businessProfileRef.username': 1,
                                    'businessProfileRef.name': 1,
                                }
                            }
                        ],
                        'as': 'usersRef'
                    }
                },
                {
                    '$unwind': {
                        'path': '$usersRef',
                        'preserveNullAndEmptyArrays': true//false value does not fetch relationship.
                    }
                },
                {
                    $addFields: {
                        isConnected: { $in: ['$userID', isConnected] },
                        isRequested: { $in: ['$userID', isRequested] },
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
                        targetUserID: 0,
                        isDeleted: 0,
                        updatedAt: 0,
                        __v: 0,
                    }
                }
            ]
        ).exec();
        const totalDocument = await Notification.find(dbQuery).countDocuments();
        const totalPagesCount = Math.ceil(totalDocument / documentLimit) || 1;
        return response.send(httpOkExtended(documents, 'Notification fetched.', pageNumber, totalPagesCount, totalDocument));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}

const store = async (userID: MongoID, targetUserID: MongoID, type: NotificationType, metadata: { [key: string]: any; }) => {
    try {

        const [userData, targetUserData] = await Promise.all([
            User.findOne({ _id: userID }),
            User.findOne({ _id: targetUserID })
        ]);
        if (userData && targetUserData) {
            console.log(userData.name, targetUserData.name, type);
            const name = userData.name;
            const targetUserName = targetUserData.name;

            let title: string = AppConfig.APP_NAME;
            let description: string = 'Welcome to The Hotel Media';
            switch (type) {
                case NotificationType.LIKE_A_STORY:
                    title = AppConfig.APP_NAME;
                    description = `${name} liked your story.`;
                    break;
                case NotificationType.LIKE_POST:
                    title = AppConfig.APP_NAME;
                    description = `${name} liked your post.`;
                    break;
                case NotificationType.LIKE_COMMENT:
                    title = AppConfig.APP_NAME;
                    // const messageLength = 150;
                    // let truncatedComment = metadata?.message ? metadata.message : '';
                    // truncatedComment = truncatedComment.length > messageLength ? truncatedComment.slice(0, messageLength) + '...' : truncatedComment
                    description = `${name} liked your comment: '${truncate(metadata?.message)}'.`;
                    break;
                case NotificationType.FOLLOW_REQUEST:
                    title = AppConfig.APP_NAME;
                    description = `${name} requested to follow you.`;
                    break;
                case NotificationType.FOLLOWING:
                    title = AppConfig.APP_NAME;
                    description = `${name} started following you.`;
                    break;
                case NotificationType.ACCEPT_FOLLOW_REQUEST:
                    title = AppConfig.APP_NAME;
                    description = `${name} accepted your follow request.`;
                    break;
                case NotificationType.COMMENT:
                    title = AppConfig.APP_NAME
                    description = `${name} commented on your post: '${truncate(metadata?.message)}'.`;
                    break;
                case NotificationType.REPLY:
                    title = AppConfig.APP_NAME
                    description = `${name}  replied to your comment: '${truncate(metadata?.message)}'.`;
                    break;
            }
            const devicesConfigs = await DevicesConfig.find({ userID: targetUserID }, 'notificationToken');
            const newNotification = new Notification();
            newNotification.userID = userID;
            newNotification.targetUserID = targetUserID;
            newNotification.title = title;
            newNotification.description = description;
            newNotification.type = type;
            newNotification.metadata = metadata;
            try {
                if (userID.toString() !== targetUserID.toString()) {
                    console.log("No Same user no need to perform further action");
                    await Promise.all(devicesConfigs.map(async (devicesConfig) => {
                        if (devicesConfig && devicesConfig.notificationToken) {
                            const notificationID = newNotification.id ? newNotification.id : v4();
                            const message: Message = createMessagePayload(devicesConfig.notificationToken, title, description, notificationID, devicesConfig.devicePlatform, type);
                            await sendNotification(message);
                        }
                        return devicesConfig;
                    }));
                }
            } catch (error) {
                console.error("Error sending one or more notifications:", error);
            }
            return await newNotification.save();
        } else {
            return null;
        }
    } catch (error: any) {
        throw error;
    }
}
const update = async (request: Request, response: Response, next: NextFunction) => {
    try {
        // return response.send(httpAcceptedOrUpdated(null, 'Not implemented'));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const destroy = async (userID: MongoID, targetUserID: MongoID, type: NotificationType, metadata: { [key: string]: any; }) => {
    try {
        const dbQuery = { userID: userID, targetUserID: targetUserID };
        switch (type) {
            case NotificationType.LIKE_A_STORY:
                Object.assign(dbQuery, { type: type, "metadata.storyID": metadata?.storyID })
                break;
            case NotificationType.LIKE_POST:
                Object.assign(dbQuery, { type: type, "metadata.postID": metadata?.postID })
                break;
            case NotificationType.LIKE_POST:
                Object.assign(dbQuery, { type: type, "metadata.commentID": metadata?.commentID })
                break;
            case NotificationType.FOLLOW_REQUEST:
                Object.assign(dbQuery, { type: type, "metadata.connectionID": metadata?.connectionID })
                break;
        }
        const notification = await Notification.findOne(dbQuery);
        if (notification) {
            const devicesConfigs = await DevicesConfig.find({ userID: targetUserID }, 'notificationToken');
            try {
                await Promise.all(devicesConfigs.map(async (devicesConfig) => {
                    if (devicesConfig && devicesConfig.notificationToken) {
                        const notificationID = notification.id ? notification?.id : v4();
                        const message: Message = createMessagePayload(devicesConfig.notificationToken, 'New Message', 'Checking for New Messages ...', notificationID, devicesConfig.devicePlatform, 'destroy');
                        // await sendNotification(message);
                    }
                    return devicesConfig;
                }));
            } catch (error) {
                console.error("Error sending one or more notifications:", error);
            }
            await notification.deleteOne();
        }
    } catch (error: any) {
        throw error;
    }
}
const show = async (request: Request, response: Response, next: NextFunction) => {
    try {
        // return response.send(httpOk(null, "Not implemented"));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}

export default { index, store, update, destroy };
