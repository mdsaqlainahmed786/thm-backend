import { ObjectId } from 'mongodb';
import S3Object, { IS3Object } from './../database/models/s3Object.model';
import { Request, Response, NextFunction } from "express";
import { httpBadRequest, httpCreated, httpInternalServerError, httpNotFoundOr404, httpNoContent, httpOk } from "../utils/response";
import { ErrorMessage } from "../utils/response-message/error";
import User, { AccountType, addBusinessProfileInUser, addBusinessSubTypeInBusinessProfile } from "../database/models/user.model";
import Subscription from "../database/models/subscription.model";
import Post, { addInterestedPeopleInPost, addMediaInPost, addPostedByInPost, addReviewedBusinessProfileInPost, addTaggedPeopleInPost, fetchPosts, imJoining, isLikedByMe, isSavedByMe, PostType } from "../database/models/post.model";
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
        const images = files && files.images as Express.Multer.S3File[];
        const videos = files && files.videos as Express.Multer.S3File[];
        if (!accountType && !id) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        if (!content && !images && !videos) {
            return response.send(httpBadRequest(ErrorMessage.invalidRequest("Content is required for creating a post"), 'Content is required for creating a post'))
        }
        /**
         * Content restrictions for individual user
         */
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));
        const [haveSubscription, dailyContentLimit] = await Promise.all([
            Subscription.findOne({ userID: id, expirationDate: { $gte: new Date() }, isCancelled: false }),
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

        /**
         * Handle post media
         */
        let mediaIDs: MongoID[] = []
        if (videos && videos.length !== 0 || images && images.length !== 0) {
            const [videoList, imageList] = await Promise.all([
                storeMedia(videos, id, businessProfileID, MediaType.VIDEO, AwsS3AccessEndpoints.POST, 'POST'),
                storeMedia(images, id, businessProfileID, MediaType.IMAGE, AwsS3AccessEndpoints.POST, 'POST'),
            ])
            if (imageList && imageList.length !== 0) {
                imageList.map((image) => mediaIDs.push(image.id));
            }
            if (videoList && videoList.length !== 0) {
                videoList.map((video) => mediaIDs.push(video.id));
            }
        }
        newPost.media = mediaIDs;
        const savedPost = await newPost.save();

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
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest("Post not found"), "Post not found"));
        }
        if (post.userID.toString() !== id) {
            return response.send(httpBadRequest(httpBadRequest('This post cannot be deleted.'), 'This post cannot be deleted.'))
        }
        const mediaIDs = post.media;
        if (mediaIDs.length !== 0) {
            await Promise.all(mediaIDs && mediaIDs.map(async (mediaID) => {
                const media = await Media.findOne({ _id: mediaID });
                if (media) {
                    await s3Service.deleteS3Object(media.s3Key);
                    if (media.thumbnailUrl) {
                        await s3Service.deleteS3Asset(media.thumbnailUrl);
                    }
                    await media.deleteOne();
                }
                return mediaID;
            }));
        }
        const [likes, comments, savedPosts, reviews, reportedContent, eventJoins] = await Promise.all([
            Like.deleteMany({ postID: ID }),
            Comment.deleteMany({ postID: ID }),
            SavedPost.deleteMany({ postID: ID }),
            Review.deleteMany({ postID: ID }),
            Report.deleteMany({ contentID: ID, contentType: ContentType.POST }),
            EventJoin.deleteMany({ postID: ID }),
        ]);
        console.log('likes', likes);
        console.log('comments', comments);
        console.log('savedPosts', savedPosts);
        console.log('reviews', reviews);
        console.log('reportedContent', reportedContent)
        console.log('eventJoins', eventJoins);
        await post.deleteOne();
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
            SavedPost.distinct('postID', { userID: id, postID: { $ne: null } }),
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
                addPostedByInPost().unwindLookup,
                addLikesInPost().lookup,
                addLikesInPost().addLikeCount,
                addCommentsInPost().lookup,
                addCommentsInPost().addCommentCount,
                addSharedCountInPost().lookup,
                addSharedCountInPost().addSharedCount,
                addReviewedBusinessProfileInPost().lookup,
                addReviewedBusinessProfileInPost().unwindLookup,
                isLikedByMe(likedByMe),
                isSavedByMe(savedByMe),
                imJoining(joiningEvents),
                addInterestedPeopleInPost().lookup,
                addInterestedPeopleInPost().addInterestedCount,
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
                    $project: {
                        reviews: 0,
                        isPublished: 0,
                        sharedRef: 0,
                        commentsRef: 0,
                        likesRef: 0,
                        tagged: 0,
                        media: 0,
                        updatedAt: 0,
                        __v: 0,
                    }
                }
            ]
        ).exec()
        if (post.length === 0) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest("Post not found"), "Post not found"));
        }
        return response.send(httpOk(post[0], "Post Fetched"));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}



export default { index, store, update, destroy, show };
