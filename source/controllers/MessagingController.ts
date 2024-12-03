import Message from "../database/models/message.model";
import User, { addBusinessProfileInUser } from "../database/models/user.model";
import { ObjectId } from "mongodb";
import { MongoID } from "../common";
import { Request, Response, NextFunction } from "express";
import { httpInternalServerError } from "../utils/response";
import { ErrorMessage } from "../utils/response-message/error";
import { MessageType } from "../database/models/message.model";
import { httpOk, httpBadRequest, httpNotFoundOr404 } from "../utils/response";
import { PrivateIncomingMessagePayload } from "../common";
import { SocketServer } from "../server";
import { SocketChannel } from "../config/constants";
/**
 * 
 * @param query 
 * @param userID 
 * @param pageNumber 
 * @param documentLimit 
 * @returns Return user messages 
 */
function fetchMessagesByUserID(query: { [key: string]: any; }, userID: MongoID, pageNumber: number, documentLimit: number) {
    return Message.aggregate([
        { $match: query },
        {
            $addFields: {
                "sentByMe": { $eq: ["$userID", new ObjectId(userID)] }
            }
        },
        {
            $sort: { createdAt: -1, id: 1 }
        },
        {
            $skip: pageNumber > 0 ? ((pageNumber - 1) * documentLimit) : 0
        },
        {
            $limit: documentLimit,
        },
        {
            $project: {
                updatedAt: 0,
                targetUserID: 0,
                userID: 0,
                deletedByID: 0,
            }
        }
    ])
}

function fetchChatByUserID(query: { [key: string]: any; }, userID: MongoID, pageNumber: number, documentLimit: number) {
    return Message.aggregate([
        { $match: query },
        { $sort: { createdAt: -1, _id: 1 } },
        {
            $addFields: {
                sentByMe: { "$eq": ["$userID", new ObjectId(userID)] }
            }
        },
        {
            $addFields: {
                lookupID: { $cond: [{ $ne: ['$targetUserID', new ObjectId(userID)] }, '$targetUserID', '$userID'] },//Interchange $targetUserID when it is not equal to user id..
            }
        },
        {
            $group: {
                _id: {
                    lookupID: '$lookupID'
                },
                unseenCount: {
                    $sum: {  // Count the number of unseen messages
                        $cond: [{ $and: [{ $eq: ["$isSeen", false] }, { $eq: ["$sentByMe", false] }] }, 1, 0]
                    }
                },
                document: { $first: '$$ROOT' },
            }
        },
        {
            $replaceRoot: { // Replace the root document with the merged document and other fields
                newRoot: { $mergeObjects: ["$$ROOT", "$document"] }
            }
        },
        {
            '$lookup': {
                'from': 'users',
                'let': { 'userID': '$lookupID' },
                'pipeline': [
                    { '$match': { '$expr': { '$eq': ['$_id', '$$userID'] } } },
                    addBusinessProfileInUser().lookup,
                    addBusinessProfileInUser().unwindLookup,
                    {
                        '$replaceRoot': {
                            'newRoot': {
                                '$mergeObjects': ["$$ROOT", "$businessProfileRef"] // Merge businessProfileRef with the user object
                            }
                        }
                    },
                    {
                        $project: {
                            name: 1,
                            username: 1,
                            profilePic: 1,
                        }
                    }
                ],
                'as': 'usersRef'
            }
        },
        { $unwind: '$usersRef' },
        {
            $replaceRoot: { // Replace the root document with the merged document and other fields
                newRoot: { $mergeObjects: ["$$ROOT", "$usersRef"] }
            }
        },
        { $sort: { createdAt: -1 } },
        {
            $skip: pageNumber > 0 ? ((pageNumber - 1) * documentLimit) : 0
        },
        {
            $limit: documentLimit,
        },
        {
            $project: {
                __v: 0,
                _id: 0,
                sentByMe: 0,
                userID: 0,
                updatedAt: 0,
                targetUserID: 0,
                deletedByID: 0,
                document: 0,
                usersRef: 0,
            }
        }
    ])
}

function getChatCount(query: { [key: string]: any; }, userID: MongoID, pageNumber: number, documentLimit: number) {
    const chats: any = Message.aggregate([
        { $match: query },
        { $sort: { createdAt: -1, _id: 1 } },
        {
            $addFields: {
                sentByMe: { "$eq": [userID, "$userID"] }
            }
        },
        {
            $addFields: {
                lookupID: { $cond: [{ $ne: ['$targetUserID', new ObjectId(userID)] }, '$targetUserID', '$userID'] },//Interchange $targetUserID when it is not equal to user id..
            }
        },
        {
            $group: {
                _id: {
                    lookupID: '$lookupID'
                },
                unseenCount: {
                    $sum: {  // Count the number of unseen messages
                        $cond: [{ $and: [{ $eq: ["$isSeen", false] }, { $eq: ["$sentByMe", false] }] }, 1, 0]
                    }
                },
                document: { $first: '$$ROOT' },
            }
        },
        {
            $replaceRoot: { // Replace the root document with the merged document and other fields
                newRoot: { $mergeObjects: ["$$ROOT", "$document"] }
            }
        },
        { $sort: { createdAt: -1 } },
        {
            $skip: pageNumber > 0 ? ((pageNumber - 1) * documentLimit) : 0
        },
        { $group: { _id: null, count: { $sum: 1 } } }
    ])

    return chats?.[0]?.count as number ?? 0;
}

const sendMediaMessage = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { messageType, username, message } = request.body;
        const requestedUserID = request.user?.id;
        const sendedBy = await User.findOne({ _id: requestedUserID });
        const sendTo = await User.findOne({ username: username });
        if (!sendedBy) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND))
        }
        if (!sendTo) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND))
        }
        const messageObject: PrivateIncomingMessagePayload = {
            to: username,
            message: {
                type: MessageType.IMAGE,
                message: message ?? '',
                mediaUrl: ''
            }
        };
        const files = request.files as { [fieldname: string]: Express.Multer.File[] };
        const singleFile = files.media?.[0] as Express.Multer.S3File;
        switch (messageType) {
            case MessageType.IMAGE:
                if (files && singleFile) {
                    Object.assign(messageObject, {
                        message: {
                            type: MessageType.IMAGE,
                            message: message ?? '',
                            mediaUrl: singleFile.location,
                        }
                    });
                    //   SocketServer.to(username).to(sendedBy.username).emit(SocketChannel.PRIVATE_MESSAGE, messageObject);
                    return response.send(httpOk(messageObject, "Media sent"));
                } else {
                    return response.send(httpBadRequest(ErrorMessage.invalidRequest("Image is required"), "Image is required"))
                }
                break;
            case MessageType.VIDEO:
                if (files && singleFile) {
                    Object.assign(messageObject, {
                        message: {
                            type: MessageType.VIDEO,
                            message: message ?? '',
                            mediaUrl: singleFile.location,
                        }
                    });
                    //SocketServer.to(username).to(sendedBy.username).emit(SocketChannel.PRIVATE_MESSAGE, messageObject);
                    return response.send(httpOk(messageObject, "Media sent"));
                } else {
                    return response.send(httpBadRequest(ErrorMessage.invalidRequest("Video is required"), "Video is required"))
                }
                break;
            case MessageType.PDF:
                if (files && singleFile) {
                    Object.assign(messageObject, {
                        message: {
                            type: MessageType.PDF,
                            message: message ?? '',
                            mediaUrl: singleFile.location,
                        }
                    });
                    // SocketServer.to(username).to(sendedBy.username).emit(SocketChannel.PRIVATE_MESSAGE, messageObject);
                    return response.send(httpOk(messageObject, "Media sent"));
                } else {
                    return response.send(httpBadRequest(ErrorMessage.invalidRequest("Document is required"), "Document is required"))
                }
                break;
        }
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}



export default { fetchChatByUserID, getChatCount, fetchMessagesByUserID, sendMediaMessage }