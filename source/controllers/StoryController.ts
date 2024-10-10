import { ObjectId } from 'mongodb';
import S3Object, { IS3Object } from './../database/models/s3Object.model';
import { Request, Response, NextFunction } from "express";
import { httpBadRequest, httpCreated, httpInternalServerError, httpNotFoundOr404, httpOkExtended, httpNoContent, httpOk } from "../utils/response";
import { ErrorMessage } from "../utils/response-message/error";
import { AccountType, addBusinessProfileInUser, addStoriesInUser } from "../database/models/user.model";
import Subscription from "../database/models/subscription.model";
import Post, { PostType } from "../database/models/post.model";
import DailyContentLimit from "../database/models/dailyContentLimit.model";
import { countWords, isArray } from "../utils/helper/basic";
import { deleteUnwantedFiles, storeMedia } from './MediaController';
import Media, { MediaType } from '../database/models/media.model';
import { MongoID } from '../common';
import Story, { addMediaInStory } from '../database/models/story.model';
import { parseQueryParam } from '../utils/helper/basic';
import User from '../database/models/user.model';
import { deleteS3Object } from '../middleware/file-uploading';
import Like, { addUserInLike } from '../database/models/like.model';
import View from '../database/models/storyView.model.';

///TODO Pending views for stories and comments 
///TODO Fetch story based on follower and following 
const index = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id, accountType, businessProfileID } = request.user;
        let { pageNumber, documentLimit, }: any = request.query;
        if (!accountType && !id) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        const dbQuery: {} = { _id: { $nin: [new ObjectId(id)] } };
        pageNumber = parseQueryParam(pageNumber, 1);
        documentLimit = parseQueryParam(documentLimit, 20);
        //FIXME add follow and following user here

        const [myStories, likedByMe] = await Promise.all(
            [
                Story.aggregate([
                    {
                        $match: { userID: new ObjectId(id), timeStamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
                    },
                    addMediaInStory().lookup,
                    addMediaInStory().unwindLookup,
                    addMediaInStory().replaceRootAndMergeObjects,
                    addMediaInStory().project,
                    {
                        '$lookup': {
                            'from': 'likes',
                            'let': { 'storyID': '$_id' },
                            'pipeline': [
                                { '$match': { '$expr': { '$eq': ['$storyID', '$$storyID'] } } },
                                addUserInLike().lookup,
                                addUserInLike().unwindLookup,
                                addUserInLike().replaceRoot,
                                {
                                    $limit: 4,
                                }
                            ],
                            'as': 'likesRef'
                        }
                    },
                    {
                        $sort: { createdAt: -1, id: 1 }
                    },
                ]).exec(),
                Like.distinct('storyID', { userID: id, })
            ]
        );
        const [documents, totalDocument] = await Promise.all(
            [
                User.aggregate(
                    [
                        {
                            $match: dbQuery
                        },
                        addBusinessProfileInUser().lookup,
                        addBusinessProfileInUser().unwindLookup,
                        addStoriesInUser(likedByMe).lookup,
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
                                "name": 1,
                                "username": 1,
                                "accountType": 1,
                                "profilePic": 1,
                                'businessProfileRef._id': 1,
                                'businessProfileRef.name': 1,
                                'businessProfileRef.username': 1,
                                'businessProfileRef.profilePic': 1,
                                'storiesRef': 1,
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
        const { content, placeName, lat, lng, tagged, feelings } = request.body;
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
         * Handle story media
         */
        let mediaIDs: MongoID = '';
        if (videos && videos.length !== 0 || images && images.length !== 0) {
            const [videoList, imageList] = await Promise.all([
                storeMedia(videos, id, null, MediaType.VIDEO),
                storeMedia(images, id, null, MediaType.IMAGE),
            ])
            if (imageList && imageList.length !== 0) {
                imageList.map((image) => {
                    mediaIDs = image.id;
                });
            }
            if (videoList && videoList.length !== 0) {
                videoList.map((video) => {
                    mediaIDs = video.id;
                });
            }
        }
        const newStory = new Story();
        if (accountType === AccountType.BUSINESS && businessProfileID) {
            newStory.businessProfileID = businessProfileID;
        }
        newStory.userID = id;
        newStory.mediaID = mediaIDs;
        const savedStory = await newStory.save();
        return response.send(httpCreated(savedStory, 'Your story has been created successfully'));
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
            await deleteS3Object(media.s3Key);
            await media.deleteOne();
        }
        await story.deleteOne();
        return response.send(httpNoContent(null, 'Story removed.'));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const show = async (request: Request, response: Response, next: NextFunction) => {
    try {
        // return response.send(httpOk({}, "Not implemented"));
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
        ])
        if (!story) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest("Story not found."), "Story not found."));
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
