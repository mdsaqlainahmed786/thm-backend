import { ObjectId } from 'mongodb';
import S3Object, { IS3Object } from './../database/models/s3Object.model';
import { Request, Response, NextFunction } from "express";
import { httpBadRequest, httpCreated, httpInternalServerError, httpNotFoundOr404, httpNoContent, httpOk } from "../utils/response";
import { ErrorMessage } from "../utils/response-message/error";
import { AccountType } from "../database/models/user.model";
import Subscription from "../database/models/subscription.model";
import Post, { addMediaInPost, addPostedByInPost, addReviewedBusinessProfileInPost, addTaggedPeopleInPost, fetchPosts, PostType } from "../database/models/post.model";
import DailyContentLimit from "../database/models/dailyContentLimit.model";
import { countWords, isArray } from "../utils/helper/basic";
import { deleteUnwantedFiles, storeMedia } from './MediaController';
import { MediaType } from '../database/models/media.model';
import { MongoID } from '../common';
import SharedContent from '../database/models/sharedContent.model';
import Like, { addLikesInPost } from '../database/models/like.model';
import SavedPost from '../database/models/savedPost.model';
import Report, { ContentType } from '../database/models/reportedUser.model';
import { addCommentsInPost, addLikesInComment, addSharedCountInPost } from '../database/models/comment.model';
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
            Subscription.findOne({ userID: id, expirationDate: { $gte: new Date() } }),
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
                    const error = `You cannot upload multiple images because your current plan does not include this feature.`;
                    return response.send(httpBadRequest(ErrorMessage.invalidRequest(error), error))

                } else if (!dailyContentLimit && videos && videos.length > MAX_VIDEO_UPLOADS) {

                    await deleteUnwantedFiles(videos);
                    const error = `You cannot upload multiple videos because your current plan does not include this feature.`;
                    return response.send(httpBadRequest(ErrorMessage.invalidRequest(error), error))

                } else if (dailyContentLimit && dailyContentLimit.text >= MAX_CONTENT_UPLOADS && content && content !== "") {

                    const error = `Your daily content upload limit has been exceeded. Please upgrade your account to avoid this error.`;
                    return response.send(httpBadRequest(ErrorMessage.invalidRequest(error), error))

                } else if (dailyContentLimit && dailyContentLimit.images !== 0 && images && images.length >= dailyContentLimit.images) {

                    await deleteUnwantedFiles(images);
                    const error = `Your daily image upload limit has been exceeded. Please upgrade your account to avoid this error.`;
                    return response.send(httpBadRequest(ErrorMessage.invalidRequest(error), error))

                } else if (dailyContentLimit && dailyContentLimit.videos !== 0 && videos && videos.length >= dailyContentLimit.videos) {

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
                storeMedia(videos, id, businessProfileID, MediaType.VIDEO),
                storeMedia(images, id, businessProfileID, MediaType.IMAGE),
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
        // const ID = request?.params?.id;
        // const { DTCODE, DTNAME, DTABBR } = request.body;
        // const deathCode = await DeathCode.findOne({ _id: ID });
        // if (!deathCode) {
        //     return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest("Death code not found."), "Death code not found."));
        // }
        // deathCode.DTCODE = DTCODE ?? deathCode.DTCODE;
        // deathCode.DTNAME = DTNAME ?? deathCode.DTNAME;
        // deathCode.DTABBR = DTABBR ?? deathCode.DTABBR;
        // const savedDeathCode = await deathCode.save();
        // return response.send(httpAcceptedOrUpdated(savedDeathCode, 'Death code updated.'));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const destroy = async (request: Request, response: Response, next: NextFunction) => {
    try {
        // const ID = request?.params?.id;
        // const deathCode = await DeathCode.findOne({ _id: ID });
        // if (!deathCode) {
        //     return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest("Death code not found."), "Death code not found."));
        // }
        // await deathCode.deleteOne();
        // return response.send(httpNoContent(null, 'Death code deleted.'));
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
        const [likedByMe, savedByMe] = await Promise.all([
            Like.distinct('postID', { userID: id, postID: { $ne: null } }),
            SavedPost.distinct('postID', { userID: id, postID: { $ne: null } })
        ]);
        const post = await Post.aggregate(
            [
                {
                    $match: { _id: new ObjectId(postID) }
                },
                addMediaInPost().lookup,
                addTaggedPeopleInPost().lookup,
                addPostedByInPost().lookup,
                addPostedByInPost().unwindLookup,
                addLikesInPost().lookup,
                addLikesInPost().addLikeCount,
                addCommentsInPost().lookup,
                addCommentsInPost().addCommentCount,
                addSharedCountInPost().lookup,
                addSharedCountInPost().addSharedCount,
                addReviewedBusinessProfileInPost().lookup,
                addReviewedBusinessProfileInPost().unwindLookup,
                {
                    $addFields: {
                        likedByMe: {
                            $in: ['$_id', likedByMe]
                        },
                    }
                },
                {
                    $addFields: {
                        savedByMe: {
                            $in: ['$_id', savedByMe]
                        },
                    }
                },
                {
                    $sort: { createdAt: -1, id: 1 }
                },
                {
                    $limit: 1,
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
        return response.send(httpOk(post, "Post Fetched"));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}

const sharedPost = async (request: Request, response: Response, next: NextFunction) => {
    try {
        let { postID, userID }: any = request.query;
        const { id, accountType, businessProfileID } = request.user;
        if (!id) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        const [likedByMe, savedByMe] = await Promise.all([
            Like.distinct('postID', { userID: id, postID: { $ne: null } }),
            SavedPost.distinct('postID', { userID: id, postID: { $ne: null } })
        ]);
        const [post, isSharedBefore,] = await Promise.all([
            fetchPosts({ _id: new ObjectId(postID) }, likedByMe, savedByMe, 1, 1),
            SharedContent.findOne({ postID: postID, userID: userID }),
        ])
        if (!post || post?.length === 0) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest("Post not found"), "Post not found"));
        }
        if (!isSharedBefore) {
            const newSharedContent = new SharedContent();
            newSharedContent.userID = userID;
            newSharedContent.postID = postID;
            newSharedContent.businessProfileID = businessProfileID ?? null;
            await newSharedContent.save();
            return response.send(httpCreated(post, "Content shared successfully"));
        }
        return response.send(httpNoContent(post, 'Content shared successfully'));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}

const reportContent = async (request: Request, response: Response, next: NextFunction) => {
    try {
        let { contentType, contentID } = request.body;
        const { id, accountType, businessProfileID } = request.user;
        if (!id) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        const [totalReports, isReportedBefore,] = await Promise.all([
            Report.find({ contentID: contentID, contentType: contentType }),
            Report.findOne({ contentID: contentID, contentType: contentType, reportedBy: id }),
        ])
        if (contentType === ContentType.POST) {
            const post = await Post.findOne({ _id: contentID });
            if (!post) {
                return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest("Content not found"), "Content not found"))
            }
            if (totalReports && totalReports.length >= 5) {//If some post is reported more then 5 time then remove from feed
                post.isPublished = false;
                await post.save();
            }
        }
        if (!isReportedBefore) {
            const newReport = new Report();
            newReport.reportedBy = id;
            newReport.contentID = contentID;
            newReport.contentType = contentType;
            const report = await newReport.save();
            return response.send(httpCreated(report, "Content reported successfully"));
        }
        return response.send(httpNoContent(isReportedBefore, 'Content already reported'));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}

export default { index, store, update, destroy, sharedPost, reportContent, show };
