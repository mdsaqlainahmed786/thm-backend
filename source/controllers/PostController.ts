import { GeoCoordinate } from './../database/models/common.model';
import { ObjectId } from 'mongodb';
import { Request, Response, NextFunction } from "express";
import { httpBadRequest, httpCreated, httpInternalServerError, httpNotFoundOr404, httpNoContent, httpOk, httpAcceptedOrUpdated, httpForbidden } from "../utils/response";
import { ErrorMessage } from "../utils/response-message/error";
import User, { AccountType, addBusinessProfileInUser, addBusinessSubTypeInBusinessProfile } from "../database/models/user.model";
import Subscription, { hasActiveSubscription } from "../database/models/subscription.model";
import Post, { addGoogleReviewedBusinessProfileInPost, addInterestedPeopleInPost, addMediaInPost, addPostedByInPost, addReviewedBusinessProfileInPost, addTaggedPeopleInPost, fetchPosts, getSavedPost, imJoining, isLikedByMe, isSavedByMe, PostType } from "../database/models/post.model";
import DailyContentLimit from "../database/models/dailyContentLimit.model";
import { countWords, isArray } from "../utils/helper/basic";
import { deleteUnwantedFiles, storeMedia } from './MediaController';
import Media, { MediaType } from '../database/models/media.model';
import { MongoID } from '../common';
import SharedContent from '../database/models/sharedContent.model';
import Like, { addLikesInPost } from '../database/models/like.model';
import SavedPost from '../database/models/savedPost.model';
import Report from '../database/models/reportedUser.model';
import { ContentType } from '../common';
import { addCommentsInPost, addLikesInComment, addSharedCountInPost } from '../database/models/comment.model';
import EventJoin from '../database/models/eventJoin.model';
import { AwsS3AccessEndpoints } from '../config/constants';
import Comment from '../database/models/comment.model';
import Review from '../database/models/reviews.model';
import S3Service from '../services/S3Service';
import AppNotificationController from './AppNotificationController';
import Notification, { NotificationType } from '../database/models/notification.model';
import FileQueue, { QueueStatus } from '../database/models/fileProcessing.model';
import { addAnonymousUserInPost } from '../database/models/anonymousUser.model';
import { lat_lng } from './EventController';
const s3Service = new S3Service();
const index = async (request: Request, response: Response, next: NextFunction) => {
    try {

    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}

const MAX_CONTENT_LENGTH = 20; // Set maximum content length
const MAX_CONTENT_UPLOADS = 2;
const MAX_VIDEO_UPLOADS = 1;
const MAX_IMAGE_UPLOADS = 2;
const store = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id, accountType, businessProfileID } = request.user;
        const { content, placeName, lat, lng, tagged, feelings } = request.body;
        const files = request.files as { [fieldname: string]: Express.Multer.File[] };
        // const images = files && files.images as Express.Multer.S3File[];
        // const videos = files && files.videos as Express.Multer.S3File[];
        const mediaFiles = files && files.media as Express.Multer.S3File[];
        const images = mediaFiles && mediaFiles.filter((file) => file.mimetype.startsWith('image/'));
        const videos = mediaFiles && mediaFiles.filter((file) => file.mimetype.startsWith('video/'));

        const authUser = await User.findOne({ _id: id });
        if (!authUser) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        if (!content && !mediaFiles) {
            return response.send(httpBadRequest(ErrorMessage.invalidRequest("Content is required for creating a post"), 'Content is required for creating a post'))
        }
        /**
         * Content restrictions for individual user
         */
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));
        const [haveSubscription, dailyContentLimit] = await Promise.all([
            hasActiveSubscription(id),
            DailyContentLimit.findOne({
                userID: id, timeStamp: {
                    $gte: startOfDay,
                    $lt: endOfDay
                }
            })
        ]);
        if (authUser.accountType === AccountType.INDIVIDUAL) {
            if (!haveSubscription) {
                if (!dailyContentLimit && content && countWords(content) > MAX_CONTENT_LENGTH) {
                    const error = `Content must be a string and cannot exceed ${MAX_CONTENT_LENGTH} words.`;
                    return response.send(httpBadRequest(ErrorMessage.invalidRequest(error), error))
                } else if (!dailyContentLimit && images && images.length > MAX_IMAGE_UPLOADS) {

                    await deleteUnwantedFiles(images);
                    await deleteUnwantedFiles(videos);
                    const error = `You cannot upload multiple images because your current plan does not include this feature.`;
                    return response.send(httpBadRequest(ErrorMessage.invalidRequest(error), error))

                } else if (!dailyContentLimit && videos && videos.length > MAX_VIDEO_UPLOADS) {
                    await deleteUnwantedFiles(images);
                    await deleteUnwantedFiles(videos);
                    const error = `You cannot upload multiple videos because your current plan does not include this feature.`;
                    return response.send(httpBadRequest(ErrorMessage.invalidRequest(error), error))

                } else if (dailyContentLimit && dailyContentLimit.text >= MAX_CONTENT_UPLOADS && content && content !== "") {

                    const error = `Your daily content upload limit has been exceeded. Please upgrade your account to avoid this error.`;
                    return response.send(httpBadRequest(ErrorMessage.invalidRequest(error), error))

                } else if (dailyContentLimit && dailyContentLimit.images !== 0 && images && images.length >= dailyContentLimit.images) {

                    await deleteUnwantedFiles(images);
                    await deleteUnwantedFiles(videos);
                    const error = `Your daily image upload limit has been exceeded. Please upgrade your account to avoid this error.`;
                    return response.send(httpBadRequest(ErrorMessage.invalidRequest(error), error))

                } else if (dailyContentLimit && dailyContentLimit.videos !== 0 && videos && videos.length >= dailyContentLimit.videos) {
                    await deleteUnwantedFiles(images);
                    await deleteUnwantedFiles(videos);
                    const error = `Your daily video upload limit has been exceeded. Please upgrade your account to avoid this error.`;
                    return response.send(httpBadRequest(ErrorMessage.invalidRequest(error), error))
                }
            }
        }
        const newPost = new Post();
        if (accountType === AccountType.BUSINESS && businessProfileID) {
            newPost.businessProfileID = businessProfileID;
        }
        newPost.postType = PostType.POST;
        newPost.userID = id;
        newPost.isPublished = true;
        newPost.content = content;
        newPost.feelings = feelings ?? "";
        if (tagged && isArray(tagged)) {
            newPost.tagged = tagged;
        } else {
            newPost.tagged = [];
        }

        if (placeName && lat && lng) {
            newPost.location = { placeName, lat, lng };
        } else {
            newPost.location = null;
        }
        if (lat && lng) {
            newPost.geoCoordinate = { type: "Point", coordinates: [lng, lat] };
        } else if (authUser && authUser.geoCoordinate) {
            newPost.geoCoordinate = authUser.geoCoordinate;
        } else {
            newPost.geoCoordinate = { type: "Point", coordinates: lat_lng };
        }

        /**
         * Handle post media
         */
        let mediaIDs: MongoID[] = []
        // if (videos && videos.length !== 0 || images && images.length !== 0) {
        //     const [videoList, imageList] = await Promise.all([
        //         storeMedia(videos, id, businessProfileID, MediaType.VIDEO, AwsS3AccessEndpoints.POST, 'POST'),
        //         storeMedia(images, id, businessProfileID, MediaType.IMAGE, AwsS3AccessEndpoints.POST, 'POST'),
        //     ])
        //     if (imageList && imageList.length !== 0) {
        //         imageList.map((image) => mediaIDs.push(image.id));
        //     }
        //     if (videoList && videoList.length !== 0) {
        //         videoList.map((video) => mediaIDs.push(video.id));
        //     }
        // }
        if (mediaFiles && mediaFiles.length !== 0) {
            const mediaList = await storeMedia(mediaFiles, id, businessProfileID, AwsS3AccessEndpoints.POST, 'POST');
            if (mediaList && mediaList.length !== 0) {
                mediaList.map((media) => mediaIDs.push(media.id));
            }
        }
        newPost.media = mediaIDs;
        const savedPost = await newPost.save();
        if (savedPost && savedPost.tagged && savedPost.tagged.length !== 0) {
            savedPost.tagged.map((tagged) => {
                AppNotificationController.store(id, tagged, NotificationType.TAGGED, { postID: savedPost.id, userID: tagged }).catch((error) => console.error(error));
            });
        }

        /**
         * Only for individual account 
         */
        if (savedPost && !haveSubscription && accountType === AccountType.INDIVIDUAL) {
            if (!dailyContentLimit) {
                const today = new Date();
                const midnightToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
                const newDailyContentLimit = new DailyContentLimit();
                newDailyContentLimit.timeStamp = midnightToday;
                newDailyContentLimit.userID = id;
                newDailyContentLimit.videos = (videos && videos.length) ? videos.length : 0;
                newDailyContentLimit.images = (images && images.length) ? images.length : 0;
                newDailyContentLimit.text = (content && content !== "") ? 1 : 0;
                await newDailyContentLimit.save();
            } else {
                dailyContentLimit.videos = (videos && videos.length) ? dailyContentLimit.videos + videos.length : dailyContentLimit.videos;
                dailyContentLimit.images = (images && images.length) ? dailyContentLimit.images + images.length : dailyContentLimit.images;
                dailyContentLimit.text = (content && content !== "") ? dailyContentLimit.text + 1 : dailyContentLimit.text;
                await dailyContentLimit.save();
            }
        }
        return response.send(httpCreated(savedPost, 'Your post has been created successfully'));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const update = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const ID = request?.params?.id;
        const { id, accountType, businessProfileID } = request.user;
        const { content, placeName, lat, lng, tagged, feelings, deletedMedia } = request.body;
        const files = request.files as { [fieldname: string]: Express.Multer.File[] };
        // const images = files && files.images as Express.Multer.S3File[];
        // const videos = files && files.videos as Express.Multer.S3File[];
        const mediaFiles = files && files.media as Express.Multer.S3File[];
        const images = mediaFiles && mediaFiles.filter((file) => file.mimetype.startsWith('image/'));
        const videos = mediaFiles && mediaFiles.filter((file) => file.mimetype.startsWith('video/'));
        if (!accountType && !id) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        /**
         * Content restrictions for individual user
         */
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));
        const [haveSubscription, dailyContentLimit] = await Promise.all([
            hasActiveSubscription(id),
            DailyContentLimit.findOne({
                userID: id, timeStamp: {
                    $gte: startOfDay,
                    $lt: endOfDay
                }
            })
        ]);
        if (accountType === AccountType.INDIVIDUAL) {
            if (!haveSubscription) {
                if (!dailyContentLimit && content && countWords(content) > MAX_CONTENT_LENGTH) {
                    const error = `Content must be a string and cannot exceed ${MAX_CONTENT_LENGTH} words.`;
                    return response.send(httpBadRequest(ErrorMessage.invalidRequest(error), error))
                } else if (!dailyContentLimit && images && images.length > MAX_IMAGE_UPLOADS) {

                    await deleteUnwantedFiles(images);
                    await deleteUnwantedFiles(videos);
                    const error = `You cannot upload multiple images because your current plan does not include this feature.`;
                    return response.send(httpBadRequest(ErrorMessage.invalidRequest(error), error))

                } else if (!dailyContentLimit && videos && videos.length > MAX_VIDEO_UPLOADS) {
                    await deleteUnwantedFiles(images);
                    await deleteUnwantedFiles(videos);
                    const error = `You cannot upload multiple videos because your current plan does not include this feature.`;
                    return response.send(httpBadRequest(ErrorMessage.invalidRequest(error), error))

                } else if (dailyContentLimit && dailyContentLimit.text >= MAX_CONTENT_UPLOADS && content && content !== "") {

                    const error = `Your daily content upload limit has been exceeded. Please upgrade your account to avoid this error.`;
                    return response.send(httpBadRequest(ErrorMessage.invalidRequest(error), error))

                } else if (dailyContentLimit && dailyContentLimit.images !== 0 && images && images.length >= dailyContentLimit.images) {

                    await deleteUnwantedFiles(images);
                    await deleteUnwantedFiles(videos);
                    const error = `Your daily image upload limit has been exceeded. Please upgrade your account to avoid this error.`;
                    return response.send(httpBadRequest(ErrorMessage.invalidRequest(error), error))

                } else if (dailyContentLimit && dailyContentLimit.videos !== 0 && videos && videos.length >= dailyContentLimit.videos) {
                    await deleteUnwantedFiles(images);
                    await deleteUnwantedFiles(videos);
                    const error = `Your daily video upload limit has been exceeded. Please upgrade your account to avoid this error.`;
                    return response.send(httpBadRequest(ErrorMessage.invalidRequest(error), error))
                }
            }
        }
        const post = await Post.findOne({ _id: ID });
        if (!post) {
            return response.send(httpBadRequest(ErrorMessage.invalidRequest(ErrorMessage.POST_NOT_FOUND), ErrorMessage.POST_NOT_FOUND))
        }
        if (accountType === AccountType.BUSINESS && businessProfileID) {
            post.businessProfileID = businessProfileID;
        }
        if (post.userID.toString() !== id) {
            return response.send(httpBadRequest(ErrorMessage.invalidRequest("You can't update this post"), "You can't update this post"));
        }
        post.content = content ?? post.content;
        post.feelings = feelings ?? post.feelings;
        if (tagged && isArray(tagged)) {
            post.tagged = tagged;
        }
        if (placeName && lat && lng) {
            post.location = { placeName, lat, lng };
        }
        /**
         * Handle post media
         */
        let mediaIDs: MongoID[] = post.media;
        // if (videos && videos.length !== 0 || images && images.length !== 0) {
        //     const [videoList, imageList] = await Promise.all([
        //         storeMedia(videos, id, businessProfileID, MediaType.VIDEO, AwsS3AccessEndpoints.POST, 'POST'),
        //         storeMedia(images, id, businessProfileID, MediaType.IMAGE, AwsS3AccessEndpoints.POST, 'POST'),
        //     ])
        //     if (imageList && imageList.length !== 0) {
        //         imageList.map((image) => mediaIDs.push(image.id));
        //     }
        //     if (videoList && videoList.length !== 0) {
        //         videoList.map((video) => mediaIDs.push(video.id));
        //     }
        // }
        if (mediaFiles && mediaFiles.length !== 0) {
            const mediaList = await storeMedia(mediaFiles, id, businessProfileID, AwsS3AccessEndpoints.POST, 'POST');
            if (mediaList && mediaList.length !== 0) {
                mediaList.map((media) => mediaIDs.push(media.id));
            }
        }
        if (deletedMedia && deletedMedia.length && mediaIDs.length !== 0) {
            //Remove old event images
            await Promise.all(deletedMedia.map(async (media_id: string) => {
                const mediaObject = await Media.findOne({ _id: media_id });
                if (mediaObject) {
                    await Promise.all([
                        s3Service.deleteS3Object(mediaObject.s3Key),
                        s3Service.deleteS3Asset(mediaObject.thumbnailUrl)
                    ]);
                    await mediaObject.deleteOne();
                    mediaIDs = mediaIDs.filter(function (item) {
                        return item.toString() !== media_id
                    });
                    console.log(mediaIDs)
                }
            }));
        }
        post.media = mediaIDs;
        const savedPost = await post.save();
        if (savedPost && !haveSubscription && accountType === AccountType.INDIVIDUAL) {
            if (!dailyContentLimit) {
                const today = new Date();
                const midnightToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
                const newDailyContentLimit = new DailyContentLimit();
                newDailyContentLimit.timeStamp = midnightToday;
                newDailyContentLimit.userID = id;
                newDailyContentLimit.videos = (videos && videos.length) ? videos.length : 0;
                newDailyContentLimit.images = (images && images.length) ? images.length : 0;
                newDailyContentLimit.text = (content && content !== "") ? 1 : 0;
                await newDailyContentLimit.save();
            } else {
                dailyContentLimit.videos = (videos && videos.length) ? dailyContentLimit.videos + videos.length : dailyContentLimit.videos;
                dailyContentLimit.images = (images && images.length) ? dailyContentLimit.images + images.length : dailyContentLimit.images;
                await dailyContentLimit.save();
            }
        }
        return response.send(httpAcceptedOrUpdated(savedPost, 'Your post has been created successfully'));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}

//FIXME  //FIXME remove media, comments , likes and notifications and reviews and many more need to be test 
const destroy = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id, accountType, businessProfileID } = request.user;
        const ID = request?.params?.id;
        const post = await Post.findOne({ _id: ID });
        if (!post) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.POST_NOT_FOUND), ErrorMessage.POST_NOT_FOUND));
        }
        if (post.userID.toString() !== id) {
            return response.send(httpForbidden(ErrorMessage.invalidRequest('This post cannot be deleted.'), 'This post cannot be deleted.'))
        }
        const mediaIDs = post.media;
        if (mediaIDs.length !== 0) {
            await Promise.all(mediaIDs && mediaIDs.map(async (mediaID) => {
                const media = await Media.findOne({ _id: mediaID });
                const fileQueues = await FileQueue.findOne({ mediaID: mediaID });
                if (media) {
                    await s3Service.deleteS3Object(media.s3Key);
                    if (media.thumbnailUrl) {
                        await s3Service.deleteS3Asset(media.thumbnailUrl);
                    }
                    await media.deleteOne();
                }
                if (fileQueues && fileQueues.status === QueueStatus.COMPLETED) {
                    await Promise.all(fileQueues.s3Location.map(async (location) => {
                        await s3Service.deleteS3Asset(location);
                        return location;
                    }));
                    await fileQueues.deleteOne();
                }
                return mediaID;
            }));
        }
        const [likes, comments, savedPosts, reportedContent, eventJoins] = await Promise.all([
            Like.deleteMany({ postID: ID }),
            Comment.deleteMany({ postID: ID }),
            SavedPost.deleteMany({ postID: ID }),
            Report.deleteMany({ contentID: ID, contentType: ContentType.POST }),
            EventJoin.deleteMany({ postID: ID }),
            Notification.deleteMany({ "metadata.postID": post._id })
        ]);
        console.log('likes', likes);
        console.log('comments', comments);
        console.log('savedPosts', savedPosts);
        console.log('reportedContent', reportedContent)
        console.log('eventJoins', eventJoins);
        await post.deleteOne();
        return response.send(httpNoContent(null, 'Post deleted'));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}


const deletePost = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id, accountType, businessProfileID } = request.user;
        const ID = request?.params?.id;
        const post = await Post.findOne({ _id: ID });
        if (!post) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.POST_NOT_FOUND), ErrorMessage.POST_NOT_FOUND));
        }
        if (post.userID.toString() !== id) {
            return response.send(httpForbidden(ErrorMessage.invalidRequest('This post cannot be deleted.'), 'This post cannot be deleted.'))
        }
        post.isDeleted = true;
        await Promise.all([
            post.save(),
            Notification.updateMany({ "metadata.postID": post._id }, { isDeleted: true }),//Remove notification as well
        ]);
        return response.send(httpNoContent(null, 'Post deleted'));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}


const show = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const postID = request?.params?.id;
        const { id } = request.user;
        if (!id) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        const [likedByMe, savedByMe, joiningEvents] = await Promise.all([
            Like.distinct('postID', { userID: id, postID: { $ne: null } }),
            getSavedPost(id),
            EventJoin.distinct('postID', { userID: id, postID: { $ne: null } }),
        ]);
        const post = await Post.aggregate(
            [
                {
                    $match: { _id: new ObjectId(postID) }
                },
                addMediaInPost().lookup,
                addTaggedPeopleInPost().lookup,
                {
                    '$lookup': {
                        'from': 'users',
                        'let': { 'userID': '$userID' },
                        'pipeline': [
                            { '$match': { '$expr': { '$eq': ['$_id', '$$userID'] } } },
                            addBusinessProfileInUser().lookup,
                            addBusinessProfileInUser().unwindLookup,
                            addBusinessSubTypeInBusinessProfile().lookup,
                            addBusinessSubTypeInBusinessProfile().unwindLookup,
                            {
                                '$project': {
                                    "name": 1,
                                    "profilePic": 1,
                                    "accountType": 1,
                                    "businessProfileID": 1,
                                    "businessProfileRef._id": 1,
                                    "businessProfileRef.name": 1,
                                    "businessProfileRef.profilePic": 1,
                                    "businessProfileRef.rating": 1,
                                    "businessProfileRef.businessTypeRef": 1,
                                    "businessProfileRef.businessSubtypeRef": 1,
                                    "businessProfileRef.address": 1,
                                }
                            }
                        ],
                        'as': 'postedBy'
                    }
                },
                {
                    '$unwind': {
                        'path': '$postedBy',
                        'preserveNullAndEmptyArrays': true//false value does not fetch relationship.
                    }
                },
                addAnonymousUserInPost().lookup,
                addAnonymousUserInPost().unwindLookup,
                addPostedByInPost().unwindLookup,
                addLikesInPost().lookup,
                addLikesInPost().addLikeCount,
                addCommentsInPost().lookup,
                addCommentsInPost().addCommentCount,
                addSharedCountInPost().lookup,
                addSharedCountInPost().addSharedCount,
                addReviewedBusinessProfileInPost().lookup,
                addReviewedBusinessProfileInPost().unwindLookup,
                addGoogleReviewedBusinessProfileInPost().lookup,
                addGoogleReviewedBusinessProfileInPost().unwindLookup,
                isLikedByMe(likedByMe),
                isSavedByMe(savedByMe),
                imJoining(joiningEvents),
                addInterestedPeopleInPost().lookup,
                addInterestedPeopleInPost().addInterestedCount,
                {
                    $addFields: {
                        reviewedBusinessProfileRef: {
                            $cond: {
                                if: { $eq: [{ $ifNull: ["$reviewedBusinessProfileRef", null] }, null] }, // Check if field is null or doesn't exist
                                then: "$googleReviewedBusinessRef", // Replace with googleReviewedBusinessRef
                                else: "$reviewedBusinessProfileRef" // Keep the existing value if it exists
                            }
                        },
                        postedBy: {
                            $cond: {
                                if: { $eq: [{ $ifNull: ["$postedBy", null] }, null] }, // Check if field is null or doesn't exist
                                then: "$publicPostedBy", // Replace with publicPostedBy
                                else: "$postedBy" // Keep the existing value if it exists
                            }
                        }
                    }
                },
                {
                    $sort: { createdAt: -1, id: 1 }
                },
                {
                    $limit: 1,
                },
                {
                    $addFields: {
                        eventJoinsRef: { $slice: ["$eventJoinsRef", 7] },
                    }
                },
                {
                    $unset: [
                        "geoCoordinate",
                        "publicPostedBy",
                        "googleReviewedBusinessRef",
                        "reviews",
                        "isPublished",
                        "sharedRef",
                        "commentsRef",
                        "likesRef",
                        "tagged",
                        "media",
                        "updatedAt",
                        "__v"
                    ]
                }
            ]
        ).exec()
        if (post.length === 0) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.POST_NOT_FOUND), ErrorMessage.POST_NOT_FOUND));
        }
        return response.send(httpOk(post[0], "Post Fetched"));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}


const storeViews = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { postIDs } = request.body;
        if (postIDs && isArray(postIDs)) {
            await Promise.all(postIDs && postIDs.map(async (postID: string) => {
                const post = await Post.findOne({ _id: postID });
                if (post) {
                    post.views = post.views ? post.views + 1 : 1;
                    await post.save();
                }
                return postID;
            }));
            return response.send(httpOk(null, "Post views saved successfully."))
        } else {
            return response.send(httpBadRequest(ErrorMessage.invalidRequest("Invalid post id array."), "Invalid post id array."))
        }
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}

export default { index, store, update, destroy, deletePost, show, storeViews };
