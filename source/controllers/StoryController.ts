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
import AppNotificationController from './AppNotificationController';
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
        const {
            content,
            placeName,
            lat,
            lng,
            userTagged,
            userTaggedId,
            userTaggedPositionX,
            userTaggedPositionY,
            feelings,
            locationPositionX,
            locationPositionY
        } = request.body;
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

        // Set location position coordinates if provided
        if (locationPositionX !== undefined) {
            newStory.locationPositionX = typeof locationPositionX === 'string' ? parseFloat(locationPositionX) : locationPositionX;
        }
        if (locationPositionY !== undefined) {
            newStory.locationPositionY = typeof locationPositionY === 'string' ? parseFloat(locationPositionY) : locationPositionY;
        }

        // Set location only if all location fields are provided
        if (placeName && lat && lng) {
            newStory.location = {
                placeName,
                lat: typeof lat === 'string' ? parseFloat(lat) : lat,
                lng: typeof lng === 'string' ? parseFloat(lng) : lng
            };
        }

        // Handle single user tagging with position coordinates
        if (userTaggedId) {
            newStory.userTaggedId = userTaggedId;
            if (userTagged) {
                newStory.userTagged = userTagged;
            }
            if (userTaggedPositionX !== undefined) {
                newStory.userTaggedPositionX = typeof userTaggedPositionX === 'string' ? parseFloat(userTaggedPositionX) : userTaggedPositionX;
            }
            if (userTaggedPositionY !== undefined) {
                newStory.userTaggedPositionY = typeof userTaggedPositionY === 'string' ? parseFloat(userTaggedPositionY) : userTaggedPositionY;
            }
        } else if (userTagged) {
            // If only username is provided without ID, still save it
            newStory.userTagged = userTagged;
            if (userTaggedPositionX !== undefined) {
                newStory.userTaggedPositionX = typeof userTaggedPositionX === 'string' ? parseFloat(userTaggedPositionX) : userTaggedPositionX;
            }
            if (userTaggedPositionY !== undefined) {
                newStory.userTaggedPositionY = typeof userTaggedPositionY === 'string' ? parseFloat(userTaggedPositionY) : userTaggedPositionY;
            }
        }

        const savedStory = await newStory.save();

        // spawn notification (non-blocking) when a user is tagged in a story
        if (savedStory && userTaggedId) {
            AppNotificationController
                .store(id, userTaggedId, NotificationType.TAGGED, {
                    entityType: 'story',
                    storyID: savedStory._id,
                    userID: userTaggedId,
                    userTagged: userTagged ?? "",
                })
                .catch((err: any) => console.error('Story tag notification error:', err));
        }
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

/**
 * Checks if an S3 key is still referenced by other Media documents
 * This prevents deletion of shared S3 files when one Media document is deleted
 * @param s3Key - The S3 key to check
 * @param excludeMediaID - Media ID to exclude from the check (the one being deleted)
 * @returns true if the S3 key is still in use by other Media documents, false otherwise
 */
async function isS3KeyStillReferenced(s3Key: string, excludeMediaID: MongoID): Promise<boolean> {
    if (!s3Key) return false;

    // Check if there are other Media documents with the same s3Key (excluding the one being deleted)
    // If other Media documents exist with the same key, the S3 file is shared and should not be deleted
    const otherMediaWithSameKey = await Media.findOne({
        s3Key: s3Key,
        _id: { $ne: excludeMediaID }
    });

    return !!otherMediaWithSameKey;
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
        if (media) {
            // Check if the S3 key is still referenced by other Media documents
            const s3KeyStillInUse = await isS3KeyStillReferenced(media.s3Key || '', media._id as MongoID);

            // Prepare deletion tasks
            const deletionTasks: Promise<any>[] = [
                media.deleteOne(),
                Like.deleteMany({ storyID: story._id }),
                View.deleteMany({ storyID: story._id }),
                Notification.deleteMany({ type: NotificationType.LIKE_A_STORY, "metadata.storyID": story._id })
            ];

            // Only delete S3 files if they're not still in use by other Media documents
            if (media.s3Key && !s3KeyStillInUse) {
                deletionTasks.push(
                    s3Service.deleteS3Object(media.s3Key),
                    s3Service.deleteS3Asset(media.thumbnailUrl)
                );
            }

            await Promise.all(deletionTasks);
        }
        await story.deleteOne();
        return response.send(httpNoContent(null, 'Story removed.'));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const show = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id, accountType } = request.user;
        const storyID = request.params.id;
        if (!accountType && !id) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }

        // fetch story with same enrichments as the feed (media + tagged users + likes/views refs)
        const [storyAgg] = await Story.aggregate([
            {
                $match: {
                    _id: new ObjectId(storyID),
                    timeStamp: { $gte: storyTimeStamp }
                }
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
        ]).exec();

        // if story is expired (older than 24h) or TTL-deleted, return the requested message
        if (!storyAgg) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest("Story no longer available"), "Story no longer available"));
        }

        const [isLiked, isViewed] = await Promise.all([
            Like.findOne({ storyID: storyAgg._id, userID: id }),
            View.findOne({ storyID: storyAgg._id, userID: id, createdAt: { $gte: storyTimeStamp } }),
        ]);

        const story = {
            ...storyAgg,
            likedByMe: !!isLiked,
            seenByMe: !!isViewed,
        };

        return response.send(httpOk(story, "Story fetched."));
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
export default { index, store, update, destroy, show, storeViews, storyLikes, storyViews };
