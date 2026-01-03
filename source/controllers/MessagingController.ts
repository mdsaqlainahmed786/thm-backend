import { PUBLIC_DIR } from './../middleware/file-uploading';
import Message from "../database/models/message.model";
import User, { AccountType, addBusinessProfileInUser } from "../database/models/user.model";
import { ObjectId } from "mongodb";
import { MongoID } from "../common";
import { Request, Response, NextFunction } from "express";
import { httpInternalServerError } from "../utils/response";
import { ErrorMessage } from "../utils/response-message/error";
import { MessageType } from "../database/models/message.model";
import { httpOk, httpBadRequest, httpNotFoundOr404 } from "../utils/response";
import { PrivateIncomingMessagePayload } from "../common";
import fs from "fs";
import { v4 } from 'uuid';
import moment from 'moment';
import BusinessProfile from '../database/models/businessProfile.model';
import { addMediaInStory, storyTimeStamp } from '../database/models/story.model';
import { AwsS3AccessEndpoints } from '../config/constants';
import { MediaType } from '../database/models/media.model';
import { storeMedia } from './MediaController';
import Post from '../database/models/post.model';
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
            $sort: { createdAt: -1, id: 1 }
        },
        {
            $skip: pageNumber > 0 ? ((pageNumber - 1) * documentLimit) : 0
        },
        {
            $limit: documentLimit,
        },
        {
            $addFields: {
                "sentByMe": { $eq: ["$userID", new ObjectId(userID)] }
            }
        },
        {
            '$lookup': {
                'from': 'stories',
                'let': { 'storyID': '$storyID' },
                'pipeline': [
                    { '$match': { '$expr': { '$eq': ['$_id', '$$storyID'] }, timeStamp: { $gte: storyTimeStamp } } },
                ],
                'as': 'storiesRef'
            }
        },
        {
            '$unwind': {
                'path': '$storiesRef',
                'preserveNullAndEmptyArrays': true//false value does not fetch relationship.
            }
        },
        {
            '$lookup': {
                'from': 'media',
                'let': { 'mediaID': '$mediaID' },
                'pipeline': [
                    { '$match': { '$expr': { '$eq': ['$_id', '$$mediaID'] } } },
                    {
                        '$project': {
                            '_id': 0,
                            'mediaUrl': "$sourceUrl",
                            'thumbnailUrl': 1,
                            'mimeType': 1,
                        }
                    }
                ],
                'as': 'mediaRef'
            }
        },
        {
            '$unwind': {
                'path': '$mediaRef',
                'preserveNullAndEmptyArrays': true//false value does not fetch relationship.
            }
        },
        {
            '$replaceRoot': {
                'newRoot': {
                    '$mergeObjects': ["$$ROOT", "$mediaRef"] // Merge businessProfileRef with the user object
                }
            }
        },
        {
            $addFields: {
                isStoryAvailable: {
                    $cond: {
                        if: { $ne: [{ $ifNull: ['$storiesRef', ''] }, ''] },
                        then: true,
                        else: false
                    }
                },
            }
        },
        {
            $addFields: {
                mediaUrl: {
                    $cond: {
                        if: {
                            $and: [
                                { $eq: ['$isStoryAvailable', true] },
                                { $eq: ['$type', MessageType.STORY_COMMENT] }
                            ]
                        },
                        then: '$mediaUrl',
                        else: {
                            $cond: {
                                if: {
                                    $and: [
                                        { $eq: ['$isStoryAvailable', false] },
                                        { $eq: ['$type', MessageType.STORY_COMMENT] }
                                    ]
                                },
                                then: 'Story unavailable',
                                else: '$mediaUrl'
                            }
                        }
                    }
                },
            }
        },

        {
            $project: {
                _id: 1,
                mediaRef: 0,
                updatedAt: 0,
                targetUserID: 0,
                userID: 0,
                deletedByID: 0,
                storiesRef: 0
            }
        }
    ])
}

function fetchChatByUserID(query: { [key: string]: any; }, userID: MongoID, pageNumber: number, documentLimit: number) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/5ee1b17b-c31a-45bb-a825-3cd9c47c82b7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MessagingController.ts:146',message:'fetchChatByUserID entry',data:{userID:String(userID),pageNumber,documentLimit,query:JSON.stringify(query)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
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
        { $sort: { createdAt: -1 } },
        {
            $skip: pageNumber > 0 ? ((pageNumber - 1) * documentLimit) : 0
        },
        {
            $limit: documentLimit,
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
        { $unwind: { path: '$usersRef', preserveNullAndEmptyArrays: false } },
        {
            $replaceRoot: { // Replace the root document with the merged document and other fields
                newRoot: { $mergeObjects: ["$$ROOT", "$usersRef"] }
            }
        },
        { $sort: { createdAt: -1 } },
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
    ]).then(results => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/5ee1b17b-c31a-45bb-a825-3cd9c47c82b7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MessagingController.ts:231',message:'fetchChatByUserID results',data:{resultCount:results.length,userID:String(userID),pageNumber,documentLimit},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        return results;
    })
}

async function getChatCount(query: { [key: string]: any; }, userID: MongoID, pageNumber: number, documentLimit: number) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/5ee1b17b-c31a-45bb-a825-3cd9c47c82b7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MessagingController.ts:233',message:'getChatCount entry',data:{userID:String(userID),pageNumber,documentLimit,query:JSON.stringify(query)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    const chats: any[] = await Message.aggregate([
        { $match: query },
        { $sort: { createdAt: -1, _id: 1 } },
        {
            $addFields: {
                sentByMe: { "$eq": [new ObjectId(userID), "$userID"] }
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
        { $group: { _id: null, count: { $sum: 1 } } }
    ])
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/5ee1b17b-c31a-45bb-a825-3cd9c47c82b7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MessagingController.ts:269',message:'getChatCount result',data:{count:chats?.[0]?.count ?? 0,chatsLength:chats?.length ?? 0,userID:String(userID),pageNumber,documentLimit},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    return chats?.[0]?.count as number ?? 0;
}

const sendMediaMessage = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id, accountType, businessProfileID } = request.user;
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
        const files = request.files as { [fieldname: string]: Express.Multer.File[] };
        const mediaFiles = files && files.media as Express.Multer.S3File[] | undefined;

        if (!mediaFiles || mediaFiles.length === 0) {
            return response.send(httpBadRequest(ErrorMessage.invalidRequest("Media file is required"), "Media file is required"))
        }

        // Validate that files have the S3 key property (required for S3 operations)
        const validFiles = mediaFiles.filter((file): file is Express.Multer.S3File => {
            return file !== null && file !== undefined && typeof file === 'object' && 'key' in file && typeof file.key === 'string' && file.key.length > 0;
        });

        if (validFiles.length === 0) {
            return response.send(httpBadRequest(ErrorMessage.invalidRequest("Invalid media file format - S3 key is missing"), "Invalid media file format - S3 key is missing"))
        }

        const type = messageType as MediaType;
        const [uploadedFiles] = await Promise.all([
            //@ts-ignore
            storeMedia(validFiles, id, businessProfileID, AwsS3AccessEndpoints.MESSAGING, 'POST'),
        ])
        if (uploadedFiles && uploadedFiles.length === 0) {
            return response.send(httpBadRequest(ErrorMessage.invalidRequest(`${type.capitalize()} is required`), `${type.capitalize()} is required`))
        }
        const messageObject: PrivateIncomingMessagePayload = {
            to: username,
            message: {
                type: messageType,
                message: message ?? '',
                mediaUrl: uploadedFiles[0].sourceUrl,
                thumbnailUrl: uploadedFiles[0].thumbnailUrl,
                mediaID: uploadedFiles[0].id,
            }
        };
        return response.send(httpOk(messageObject, "Media uploaded"));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}


const sharingPostMediaMessage = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id, accountType, businessProfileID } = request.user;
        const { messageType, username, message, postID } = request.body;
        const requestedUserID = request.user?.id;

        // Validate postID is provided
        if (!postID) {
            return response.send(httpBadRequest(ErrorMessage.invalidRequest("Post ID is required"), "Post ID is required"))
        }

        const sendedBy = await User.findOne({ _id: requestedUserID });
        const sendTo = await User.findOne({ username: username });
        if (!sendedBy) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND))
        }
        if (!sendTo) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND))
        }

        // Fetch the post to validate it exists and get the owner
        const post = await Post.findOne({ _id: new ObjectId(postID), isDeleted: false, isPublished: true });
        if (!post) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.POST_NOT_FOUND), ErrorMessage.POST_NOT_FOUND))
        }

        // Fetch the post owner to get username
        const postOwner = await User.findOne({ _id: post.userID });
        if (!postOwner) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest("Post owner not found"), "Post owner not found"))
        }

        // Get the username - prefer name if available, otherwise use username
        const postOwnerUsername = postOwner.accountType === AccountType.BUSINESS && postOwner.businessProfileID
            ? (await BusinessProfile.findOne({ _id: postOwner.businessProfileID }))?.name || postOwner.name || postOwner.username
            : postOwner.name || postOwner.username;

        const files = request.files as { [fieldname: string]: Express.Multer.File[] };
        const mediaFiles = files && files.media as Express.Multer.S3File[] | undefined;

        if (!mediaFiles || mediaFiles.length === 0) {
            return response.send(httpBadRequest(ErrorMessage.invalidRequest("Media file is required"), "Media file is required"))
        }

        // Validate that files have the S3 key property (required for S3 operations)
        const validFiles = mediaFiles.filter((file): file is Express.Multer.S3File => {
            return file !== null && file !== undefined && typeof file === 'object' && 'key' in file && typeof file.key === 'string' && file.key.length > 0;
        });

        if (validFiles.length === 0) {
            return response.send(httpBadRequest(ErrorMessage.invalidRequest("Invalid media file format - S3 key is missing"), "Invalid media file format - S3 key is missing"))
        }

        const type = messageType as MediaType;
        const [uploadedFiles] = await Promise.all([
            //@ts-ignore
            storeMedia(validFiles, id, businessProfileID, AwsS3AccessEndpoints.MESSAGING, 'POST'),
        ])
        if (uploadedFiles && uploadedFiles.length === 0) {
            return response.send(httpBadRequest(ErrorMessage.invalidRequest(`${type.capitalize()} is required`), `${type.capitalize()} is required`))
        }

        const messageObject: PrivateIncomingMessagePayload = {
            to: username,
            message: {
                type: messageType,
                message: message ?? '',
                mediaUrl: uploadedFiles[0].sourceUrl,
                thumbnailUrl: uploadedFiles[0].thumbnailUrl,
                mediaID: uploadedFiles[0].id,
                postID: postID,
                postOwnerUsername: postOwnerUsername,
            }
        };
        return response.send(httpOk(messageObject, "Post shared successfully"));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}

const deleteChat = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const requestedUserID = request.user?.id;
        const userID = request.params.id;
        let findQuery = {
            $or: [
                { userID: new ObjectId(requestedUserID), targetUserID: new ObjectId(userID) },
                { userID: new ObjectId(userID), targetUserID: new ObjectId(requestedUserID) }
            ]
        }
        let updateQuery = {
            $addToSet: { "deletedByID": requestedUserID }
        };
        await Message.updateMany(findQuery, updateQuery);
        return response.send(httpOk(null, "Chat deleted."));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}

//FIXME Deleted chat will not be exported.
const exportChat = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const requestedUserID = request.user?.id;
        const userID = request.params.id;
        const user = await User.findOne({ userID: userID });
        if (!user) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        let findQuery = {
            $or: [
                { userID: new ObjectId(requestedUserID), targetUserID: new ObjectId(userID), deletedByID: { $nin: [new ObjectId(requestedUserID)] } },
                { userID: new ObjectId(userID), targetUserID: new ObjectId(requestedUserID), deletedByID: { $nin: [new ObjectId(requestedUserID)] } }
            ]
        }
        const conversations = await Message.aggregate([
            { $match: findQuery },
            {
                $sort: { createdAt: 1, id: 1 }
            },
            {
                $project: {
                    _id: 0,
                    userID: 1,
                    message: 1,
                    type: 1,
                    link: 1,
                    gift: 1,
                    location: 1,
                    mediaUrl: 1,
                    contact: 1,
                    createdAt: 1,
                }
            }
        ]);
        if (conversations.length === 0) {
            return response.send(httpBadRequest(ErrorMessage.invalidRequest("Nothing to export."), "Nothing to export."))
        }
        const hostAddress = request.protocol + "://" + request.get("host");
        let chatWith = "User"
        const data = await Promise.all(conversations.map(async (chat) => {
            let name = "User";
            const user = await User.findOne({ _id: chat.userID });
            if (user && user.accountType === AccountType.BUSINESS && user.businessProfileID) {
                const business = await BusinessProfile.findOne({ _id: user.businessProfileID });
                if (business) {
                    name = business.name;
                    if (user.id.toString() !== userID) {
                        chatWith = user.name ?? user.username;
                    }
                }
            } else if (user) {
                name = user.name ?? user.username;
                if (user.id.toString() !== userID) {
                    chatWith = user.name ?? user.username;
                }
            }
            const file = [MessageType.VIDEO, MessageType.IMAGE, MessageType.PDF].includes(chat.type);
            const link = chat.mediaUrl;
            return `${moment(chat.createdAt).format('ddd DD, MMM YYYY hh:mm:ss A')} ${name}: ${chat.message} ${file ? '(file attached) link::' + link : ''} \n`;
        }));
        const filename = `${v4()}.txt`;
        const filePath = `${PUBLIC_DIR}/chat-exports/${filename}`;
        const chatContent = data.join("")
        fs.writeFileSync(filePath, chatContent, 'utf8');
        return response.send(httpOk({
            filename: `Chat with ${chatWith}.txt`,
            filePath: `${hostAddress}/${filePath}`
        }, "Chat exported."));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}


export default { fetchChatByUserID, getChatCount, fetchMessagesByUserID, sendMediaMessage, sharingPostMediaMessage, deleteChat, exportChat }