import { ConnectionStatus, fetchUserFollowing } from './../database/models/userConnection.model';
import { ObjectId } from 'mongodb';
import { Request, Response, NextFunction } from "express";
import { httpBadRequest, httpCreated, httpInternalServerError, httpNotFoundOr404, httpOkExtended, httpNoContent, httpOk } from "../utils/response";
import { ErrorMessage } from "../utils/response-message/error";
import { AccountType, addBusinessProfileInUser, addStoriesInUser } from "../database/models/user.model";
import { storeMedia } from './MediaController';
import Media, { MediaType } from '../database/models/media.model';
import { MongoID } from '../common';
import Story, { addMediaInStory, addTaggedUsersInStory, storyTimeStamp } from '../database/models/story.model';
import { parseQueryParam } from '../utils/helper/basic';
import User from '../database/models/user.model';
import Like, { addUserInLike } from '../database/models/like.model';
import View, { addUserInView } from '../database/models/view.model.';
import S3Service from '../services/S3Service';
import { AwsS3AccessEndpoints } from '../config/constants';
import Notification, { NotificationType } from '../database/models/notification.model';
const s3Service = new S3Service();
//FIXME Remove likes and view views
const index = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id, accountType, businessProfileID } = request.user;
        let { pageNumber, documentLimit, }: any = request.query;
        if (!accountType && !id) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }

        pageNumber = parseQueryParam(pageNumber, 1);
        documentLimit = parseQueryParam(documentLimit, 20);
        //Fetch following stories 
        const myFollowingIDs = await fetchUserFollowing(id);
        const [myStories, likedByMe, userIDs, viewedStories] = await Promise.all(
            [
                Story.aggregate([
                    {
                        $match: { userID: new ObjectId(id), timeStamp: { $gte: storyTimeStamp } }
                    },
                    addMediaInStory().lookup,
                    addMediaInStory().unwindLookup,
                    addMediaInStory().replaceRootAndMergeObjects,
                    addMediaInStory().project,
                    addTaggedUsersInStory().addFieldsBeforeUnwind,
                    addTaggedUsersInStory().unwind,
                    addTaggedUsersInStory().lookup,
                    addTaggedUsersInStory().addFields,
                    addTaggedUsersInStory().group,
                    addTaggedUsersInStory().replaceRoot,
                    {
                        '$lookup': {
                            'from': 'likes',
                            'let': { 'storyID': '$_id' },
                            'pipeline': [
                                { '$match': { '$expr': { '$eq': ['$storyID', '$$storyID'] } } },
                                addUserInLike().lookup,
                                addUserInLike().unwindLookup,
                                addUserInLike().replaceRoot,
                            ],
                            'as': 'likesRef'
                        }
                    },
                    {
                        $addFields: {
                            likes: { $cond: { if: { $isArray: "$likesRef" }, then: { $size: "$likesRef" }, else: 0 } }
                        }
                    },
                    {
                        $addFields: {
                            likesRef: { $slice: ["$likesRef", 4] },
                        }
                    },
                    {
                        $lookup: {
                            from: 'views',
                            let: { storyID: '$_id' },
                            pipeline: [
                                { $match: { $expr: { $eq: ['$storyID', '$$storyID'] } } },
                                addUserInView().lookup,
                                addUserInView().unwindLookup,
                                addUserInView().replaceRoot,
                            ],
                            as: 'viewsRef'
                        }
                    },
                    {
                        $addFields: {
                            views: { $cond: { if: { $isArray: "$viewsRef" }, then: { $size: "$viewsRef" }, else: 0 } }
                        }
                    },
                    {
                        $addFields: {
                            viewsRef: { $slice: ["$viewsRef", 4] },
                        }
                    },
                    {
                        $sort: { createdAt: -1, id: 1 }
                    }
                ]).exec(),
                Like.distinct('storyID', { userID: id, }),
                Story.distinct('userID', {
                    $and: [
                        { timeStamp: { $gte: storyTimeStamp }, userID: { $in: myFollowingIDs }, },
                        { timeStamp: { $gte: storyTimeStamp }, userID: { $nin: [new ObjectId(id)] }, }
                    ]
                }),
                View.distinct('storyID', { userID: id, createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } })
            ]
        );
        const dbQuery: {} = { _id: { $in: userIDs } };
        const [documents, totalDocument] = await Promise.all(
            [
                User.aggregate(
                    [
                        {
                            $match: dbQuery
                        },
                        addBusinessProfileInUser().lookup,
                        addBusinessProfileInUser().unwindLookup,
                        addStoriesInUser(likedByMe, viewedStories).lookup,
                        {
                            $addFields: {
                                seenByMe: {
                                    $cond: {
                                        if: {
                                            $eq: [
                                                {
                                                    $size: {
                                                        $filter: {
                                                            input: "$storiesRef",
                                                            as: "story",
                                                            cond: { $eq: ["$$story.seenByMe", true] }
                                                        }
                                                    }
                                                },
                                                { $size: "$storiesRef" }
                                            ]
                                        },
                                        then: true,  // Return true if all items have seenByMe as true
                                        else: false  // Otherwise return false
                                    }
                                },
                                seenCount: {
                                    $size: {
                                        $filter: {
                                            input: "$storiesRef",
                                            as: "story",
                                            cond: { $eq: ["$$story.seenByMe", true] }
                                        }
                                    }
                                }
                            }
                        },
                        {
                            $sort: { createdAt: -1, id: 1 }
                        },
                        {
                            $sort: { seenCount: 1 } //Sort viewed stories 
                        },
                        {
                            $skip: pageNumber > 0 ? ((pageNumber - 1) * documentLimit) : 0
                        },
                        {
                            $limit: documentLimit
                        },
                        {
                            $project: {
                                "name": 1,
                                "username": 1,
                                "accountType": 1,
                                "profilePic": 1,
                                'businessProfileRef._id': 1,
                                'businessProfileRef.name': 1,
                                'businessProfileRef.username': 1,
                                'businessProfileRef.profilePic': 1,
                                'storiesRef': 1,
                                'seenByMe': 1,
                                // 'seenCount': 1
                            }
                        }
                    ]
                ).exec(),
                User.find(dbQuery).countDocuments()
            ]
        );
        const totalPagesCount = Math.ceil(totalDocument / documentLimit) || 1;
        const responseData = {
            myStories: myStories,
            stories: documents,
        }
        return response.send(httpOkExtended(responseData, 'Stories fetched.', pageNumber, totalPagesCount, totalDocument));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const store = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id, accountType, businessProfileID } = request.user;
        const { content, placeName, lat, lng, taggedUsers, feelings, locationPositionX, locationPositionY } = request.body;
        const files = request.files as { [fieldname: string]: Express.Multer.File[] };
        const images = files && files.images as Express.Multer.S3File[];
        const videos = files && files.videos as Express.Multer.S3File[];
        if (!accountType && !id) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        if (!images && !videos) {
            return response.send(httpBadRequest(ErrorMessage.invalidRequest("Media is required for creating a story"), 'Media is required for creating a story'))
        }
        /**
         * Portrait (4:5): 1080 x 1350 px
            Square (1:1): 1080 x 1080 px
            Landscape (1.91:1): 1080 x 566 px
         * Handle story media
         */
        let mediaIDs: MongoID = '';
        let duration: number = 10;
        if (videos && videos.length !== 0 || images && images.length !== 0) {
            const [videoList, imageList] = await Promise.all([
                storeMedia(videos, id, businessProfileID, AwsS3AccessEndpoints.STORY, 'STORY'),
                storeMedia(images, id, businessProfileID, AwsS3AccessEndpoints.STORY, 'STORY'),
            ])
            if (imageList && imageList.length !== 0) {
                imageList.map((image) => {
                    mediaIDs = image.id;
                });
            }
            if (videoList && videoList.length !== 0) {
                videoList.map((video) => {
                    mediaIDs = video.id;
                    duration = video.duration;
                });
            }
        }
        const newStory = new Story();
        if (accountType === AccountType.BUSINESS && businessProfileID) {
            newStory.businessProfileID = businessProfileID;
        }
        newStory.duration = duration;

        newStory.userID = id;
        newStory.mediaID = mediaIDs;
        newStory.locationPositionX = locationPositionX;
        newStory.locationPositionY = locationPositionY;

        // Set location only if all location fields are provided
        if (placeName && lat && lng) {
            newStory.location = {
                placeName,
                lat: typeof lat === 'string' ? parseFloat(lat) : lat,
                lng: typeof lng === 'string' ? parseFloat(lng) : lng
            };
        }

        // Handle multiple tagged users with their positions
        if (taggedUsers && Array.isArray(taggedUsers) && taggedUsers.length > 0) {
            newStory.taggedUsers = taggedUsers.map((tagged: any) => ({
                userTagged: tagged.userTagged || tagged.username || '',
                userTaggedId: tagged.userTaggedId || tagged.userId,
                positionX: typeof tagged.positionX === 'string' ? parseFloat(tagged.positionX) : tagged.positionX,
                positionY: typeof tagged.positionY === 'string' ? parseFloat(tagged.positionY) : tagged.positionY
            })).filter((tagged: any) => tagged.userTaggedId && tagged.userTagged); // Filter out invalid entries
        }

        const savedStory = await newStory.save();
        return response.send(httpCreated(savedStory.toObject(), 'Your story has been created successfully'));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const update = async (request: Request, response: Response, next: NextFunction) => {
    try {

    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}

const destroy = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id, accountType, businessProfileID } = request.user;
        const ID = request.params.id;
        const story = await Story.findOne({ _id: ID, userID: id });
        if (!story) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest("Story not found."), "Story not found."));
        }
        const media = await Media.findOne({ _id: story.mediaID });
        if (media && media.s3Key) {
            await Promise.all([
                s3Service.deleteS3Object(media.s3Key),
                s3Service.deleteS3Asset(media.thumbnailUrl),
                media.deleteOne(),
                Like.deleteMany({ storyID: story._id }),
                View.deleteMany({ storyID: story._id }),
                Notification.deleteMany({ type: NotificationType.LIKE_A_STORY, "metadata.storyID": story._id })
            ]);
        }
        await story.deleteOne();
        return response.send(httpNoContent(null, 'Story removed.'));
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
const storeViews = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id, accountType, businessProfileID } = request.user;
        const ID = request.params.id;
        const [story, isViewed] = await Promise.all([
            Story.findOne({ _id: ID, }),
            View.findOne({ storyID: ID, userID: id }),
        ]);
        if (!story) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest("Story not found."), "Story not found."));
        }
        if (story.userID?.toString() === id.toString()) {
            return response.send(httpBadRequest(ErrorMessage.invalidRequest("You are not allowed to increase views on your own story."), "You are not allowed to increase views on your own story."))
        }
        if (!isViewed) {
            const newView = new View();
            newView.userID = id;
            newView.storyID = story.id;
            newView.businessProfileID = businessProfileID ?? null;
            const savedView = await newView.save();
            return response.send(httpCreated(savedView, "View saved successfully"));
        }
        return response.send(httpNoContent(isViewed, 'View saved successfully'));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}

const storyLikes = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id, accountType, businessProfileID } = request.user;
        let { pageNumber, documentLimit, }: any = request.query;
        const ID = request.params.id;
        pageNumber = parseQueryParam(pageNumber, 1);
        documentLimit = parseQueryParam(documentLimit, 20);
        if (!accountType && !id) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        const story = await Story.findOne({ _id: ID, userID: id });
        if (!story) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest("Story not found."), "Story not found."));
        }
        let dbQuery = { storyID: story._id };
        const [documents, totalDocument] = await Promise.all(
            [
                Like.aggregate(
                    [
                        {
                            $match: dbQuery
                        },
                        addUserInLike().lookup,
                        addUserInLike().unwindLookup,
                        addUserInLike().replaceRoot,
                        {
                            $sort: { createdAt: -1, id: 1 }
                        },
                        {
                            $skip: pageNumber > 0 ? ((pageNumber - 1) * documentLimit) : 0
                        },
                        {
                            $limit: documentLimit
                        },
                    ]
                ).exec(),
                Like.find(dbQuery).countDocuments()
            ]
        );
        const totalPagesCount = Math.ceil(totalDocument / documentLimit) || 1;
        return response.send(httpOkExtended(documents, 'Likes fetched.', pageNumber, totalPagesCount, totalDocument));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const storyViews = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id, accountType, businessProfileID } = request.user;
        let { pageNumber, documentLimit, }: any = request.query;
        const ID = request.params.id;
        pageNumber = parseQueryParam(pageNumber, 1);
        documentLimit = parseQueryParam(documentLimit, 20);
        if (!accountType && !id) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        const story = await Story.findOne({ _id: ID, userID: id });
        if (!story) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest("Story not found."), "Story not found."));
        }
        let dbQuery = { storyID: story._id };
        const [documents, totalDocument] = await Promise.all(
            [
                View.aggregate(
                    [
                        {
                            $match: dbQuery
                        },
                        addUserInLike().lookup,
                        addUserInLike().unwindLookup,
                        addUserInLike().replaceRoot,
                        {
                            $sort: { createdAt: -1, id: 1 }
                        },
                        {
                            $skip: pageNumber > 0 ? ((pageNumber - 1) * documentLimit) : 0
                        },
                        {
                            $limit: documentLimit
                        },
                    ]
                ).exec(),
                View.find(dbQuery).countDocuments()
            ]
        );
        const totalPagesCount = Math.ceil(totalDocument / documentLimit) || 1;
        return response.send(httpOkExtended(documents, 'Likes fetched.', pageNumber, totalPagesCount, totalDocument));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
export default { index, store, update, destroy, storeViews, storyLikes, storyViews };
