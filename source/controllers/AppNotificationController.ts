import { ObjectId } from 'mongodb';
import { Request, Response, NextFunction } from "express";
import { httpBadRequest, httpCreated, httpInternalServerError, httpNoContent, httpNotFoundOr404, httpOk } from "../utils/response";
import { ErrorMessage } from "../utils/response-message/error";
import User, { AccountType, profileBasicProject } from "../database/models/user.model";
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
import ChatMessage from '../database/models/message.model';
import BusinessProfile from '../database/models/businessProfile.model';

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
    await Notification.updateMany(dbQuery, { isSeen: true });
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
              profileBasicProject(),
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

const status = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const { id, accountType, businessProfileID } = request.user;
    const dbQuery = { isDeleted: false, targetUserID: new ObjectId(id), isSeen: false };
    const documents = await Notification.find(dbQuery).countDocuments();
    let findQuery = {
      $or: [
        { targetUserID: new ObjectId(id), deletedByID: { $nin: [new ObjectId(id)] }, isSeen: false }
      ]
    }
    const messages = await ChatMessage.find(findQuery).countDocuments();
    const messageObj = {
      hasUnreadMessages: messages > 0,
      count: messages
    }
    const notificationObj = {
      hasUnreadMessages: documents > 0,
      count: documents
    }
    const responseObject = {
      notifications: notificationObj,
      messages: messageObj
    }
    return response.send(httpOk(responseObject, 'Notification fetched.'));
  } catch (error: any) {
    next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
  }
}

const store = async (
  userID: MongoID,
  targetUserID: MongoID,
  type: NotificationType,
  metadata: { [key: string]: any }
) => {
  try {
    console.log("   [STORE] Start creating notification:");
    console.log("   → Type:", type);
    console.log("   → From (userID):", userID?.toString());
    console.log("   → To (targetUserID):", targetUserID?.toString());
    console.log("   → Metadata:", metadata);

    const [userData, targetUserData] = await Promise.all([
      User.findOne({ _id: userID }),
      User.findOne({ _id: targetUserID }),
    ]);

    if (!userData || !targetUserData) {
      console.error(
        ` User or target user not found. userID: ${userID}, targetUserID: ${targetUserID}`
      );
      return null;
    }

    let name = userData.name;
    let profileImage = userData?.profilePic?.small || "";
    let postType = "post";
    let description = "Welcome to The Hotel Media";
    let image = "";
    let title = AppConfig.APP_NAME;

    if (userData.accountType === AccountType.BUSINESS && userData.businessProfileID) {
      const businessData = await BusinessProfile.findOne({
        _id: userData.businessProfileID,
      });
      if (businessData) {
        name = businessData.name;
        profileImage = businessData?.profilePic?.small ?? profileImage;
      }
    }

    switch (type) {
      case NotificationType.LIKE_A_STORY:
        description = `${name} liked your story.`;
        break;
      case NotificationType.LIKE_POST:
        postType = metadata.postType ?? "post";
        description = `${name} liked your ${postType}.`;
        break;
      case NotificationType.LIKE_COMMENT:
        description = `${name} liked your comment: '${truncate(metadata?.message)}'.`;
        break;
      case NotificationType.FOLLOW_REQUEST:
        description = `${name} requested to follow you.`;
        break;
      case NotificationType.FOLLOWING:
        description = `${name} started following you.`;
        break;
      case NotificationType.ACCEPT_FOLLOW_REQUEST:
        description = `${name} accepted your follow request.`;
        break;
      case NotificationType.COMMENT:
        postType = metadata.postType ?? "post";
        description = `${name} commented on your ${postType}: '${truncate(metadata?.message)}'.`;
        break;
      case NotificationType.REPLY:
        description = `${name} replied to your comment: '${truncate(metadata?.message)}'.`;
        break;
      case NotificationType.TAGGED:
        description = `${name} tagged you in a post.`;
        break;
      case NotificationType.EVENT_JOIN:
        const eventName = metadata.name ?? "";
        description = `${name} has joined the event \n${eventName}.`;
        break;
      case NotificationType.COLLABORATION_INVITE:
        description = `${name} invited you to collaborate on a post.`;
        break;
      case NotificationType.COLLABORATION_ACCEPTED:
        description = `${name} accepted your collaboration invite.`;
        break;
      case NotificationType.COLLABORATION_REJECTED:
        description = `${name} declined your collaboration invite.`;
        break;
      case NotificationType.JOB:
        const jobTitle = metadata?.title ?? "a job";
        description = `${name} posted a new job: ${jobTitle}.`;
        break;
      default:
        description = `Unknown notification type: ${type}`;
    }

    console.log(" [STORE] Creating Notification object...");
    const newNotification = new Notification({
      userID,
      senderID: userID,
      targetUserID,
      title,
      description,
      type,
      metadata,
    });

    try {
      const saved = await newNotification.save();
      //@ts-ignore
      console.log(" [STORE] Notification saved successfully:", saved._id.toString());
    } catch (saveErr: any) {
      console.error(" [STORE] Failed to save notification:", saveErr.message);
    }

    const devicesConfigs = await DevicesConfig.find({ userID: targetUserID });

    try {
      if (userID.toString() !== targetUserID.toString()) {
        console.log("📡 Sending push notification...");
        await Promise.all(
          devicesConfigs.map(async (devicesConfig) => {
            if (devicesConfig?.notificationToken) {
              const notificationID = newNotification.id || v4();
              const devicePlatform = devicesConfig.devicePlatform;
              const message: Message = createMessagePayload(
                devicesConfig.notificationToken,
                title,
                description,
                {
                  notificationID,
                  devicePlatform,
                  type,
                  image,
                  profileImage,
                }
              );
              await sendNotification(message);
            }
            return devicesConfig;
          })
        );
      }
    } catch (pushErr) {
      console.error(" [STORE] Error sending push notification:", pushErr);
    }

    return newNotification;
  } catch (error: any) {
    console.error(" [STORE] Unexpected error:", error.message);
    throw error;
  }
};


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
      case NotificationType.LIKE_COMMENT:
        Object.assign(dbQuery, { type: type, "metadata.commentID": metadata?.commentID })
        break;
      case NotificationType.FOLLOW_REQUEST:
        Object.assign(dbQuery, { type: type, "metadata.connectionID": metadata?.connectionID })
        break;
      case NotificationType.EVENT_JOIN:
        Object.assign(dbQuery, { type: type, "metadata.postID": metadata?.postID })
        break;
    }
    const notification = await Notification.findOne(dbQuery);
    if (notification) {
      const devicesConfigs = await DevicesConfig.find({ userID: targetUserID });
      try {
        await Promise.all(devicesConfigs.map(async (devicesConfig) => {
          if (devicesConfig && devicesConfig.notificationToken) {
            const notificationID = notification.id ? notification?.id : v4();
            const message: Message = createMessagePayload(devicesConfig.notificationToken, 'New Message', 'Checking for New Messages ...',
              {
                notificationID: notificationID,
                devicePlatform: devicesConfig.devicePlatform,
                type: 'destroy',
                image: "",
                profileImage: ""
              });
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

export default { index, status, store, update, destroy };
