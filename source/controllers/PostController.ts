
import { fetchUserFollowing } from "../database/models/userConnection.model";
import { GeoCoordinate } from './../database/models/common.model';
import { ObjectId } from 'mongodb';
import { UserRecentPostCache } from '../utils/recentPostCache';
import { Request, Response, NextFunction } from "express";
import Story from "../database/models/story.model";
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
import { FeedOrderCache } from '../utils/feedOrderCache';
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
    const mediaFiles = files && files.media as Express.Multer.S3File[] | undefined;
    const images = (mediaFiles || []).filter((file) => file.mimetype.startsWith('image/'));
    const videos = (mediaFiles || []).filter((file) => file.mimetype.startsWith('video/'));

    if (!id) {
      return response.send(httpNotFoundOr404(
        ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND),
        ErrorMessage.USER_NOT_FOUND
      ));
    }

    // Validate video file size (100 MB limit)
    const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100 MB in bytes
    if (videos && videos.length > 0) {
      const oversizedVideos = videos.filter((video) => video.size > MAX_VIDEO_SIZE);
      if (oversizedVideos.length > 0) {
        await deleteUnwantedFiles(oversizedVideos);
        await deleteUnwantedFiles(images);
        return response.send(httpBadRequest(
          ErrorMessage.invalidRequest("Video file size must not exceed 100 MB"),
          "Video file size must not exceed 100 MB"
        ));
      }
    }

    if (!content && (!mediaFiles || mediaFiles.length === 0)) {
      return response.send(httpBadRequest(
        ErrorMessage.invalidRequest("Content is required for creating a post"),
        'Content is required for creating a post'
      ));
    }

    const now = new Date();
    const midnightToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    const [
      authUser,
      haveSubscription,
      dailyContentLimit
    ] = await Promise.all([
      User.findOne({ _id: id }).lean(), // lean -> plain object, faster
      hasActiveSubscription(id),
      DailyContentLimit.findOne({ userID: id, timeStamp: midnightToday }).lean() // we use exact midnight key for upserts later
    ]);

    if (!authUser) {
      return response.send(httpNotFoundOr404(
        ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND),
        ErrorMessage.USER_NOT_FOUND
      ));
    }

    // if (authUser.accountType === AccountType.INDIVIDUAL && !haveSubscription) {
    //   if (!dailyContentLimit && content && countWords(content) > MAX_CONTENT_LENGTH) {
    //     const error = `Content must be a string and cannot exceed ${MAX_CONTENT_LENGTH} words.`;
    //     return response.send(httpBadRequest(ErrorMessage.invalidRequest(error), error));
    //   }

    //   if (!dailyContentLimit && images && images.length > MAX_IMAGE_UPLOADS) {
    //     await deleteUnwantedFiles(images);
    //     await deleteUnwantedFiles(videos);
    //     const error = `You cannot upload multiple images because your current plan does not include this feature.`;
    //     return response.send(httpBadRequest(ErrorMessage.invalidRequest(error), error));
    //   }

    //   if (!dailyContentLimit && videos && videos.length > MAX_VIDEO_UPLOADS) {
    //     await deleteUnwantedFiles(images);
    //     await deleteUnwantedFiles(videos);
    //     const error = `You cannot upload multiple videos because your current plan does not include this feature.`;
    //     return response.send(httpBadRequest(ErrorMessage.invalidRequest(error), error));
    //   }

    //   if (dailyContentLimit && dailyContentLimit.text >= MAX_CONTENT_UPLOADS && content && content !== "") {
    //     const error = `Your daily content upload limit has been exceeded. Please upgrade your account to avoid this error.`;
    //     return response.send(httpBadRequest(ErrorMessage.invalidRequest(error), error));
    //   }

    //   if (dailyContentLimit && typeof dailyContentLimit.images === 'number' && images && images.length >= dailyContentLimit.images) {
    //     await deleteUnwantedFiles(images);
    //     await deleteUnwantedFiles(videos);
    //     const error = `Your daily image upload limit has been exceeded. Please upgrade your account to avoid this error.`;
    //     return response.send(httpBadRequest(ErrorMessage.invalidRequest(error), error));
    //   }

    //   if (dailyContentLimit && typeof dailyContentLimit.videos === 'number' && videos && videos.length >= dailyContentLimit.videos) {
    //     await deleteUnwantedFiles(images);
    //     await deleteUnwantedFiles(videos);
    //     const error = `Your daily video upload limit has been exceeded. Please upgrade your account to avoid this error.`;
    //     return response.send(httpBadRequest(ErrorMessage.invalidRequest(error), error));
    //   }
    // }


    const newPost = new Post();
    if (accountType === AccountType.BUSINESS && businessProfileID) {
      newPost.businessProfileID = businessProfileID;
    }
    newPost.postType = PostType.POST;
    newPost.userID = id;
    newPost.isPublished = true;
    newPost.content = content;
    newPost.feelings = feelings ?? "";
    newPost.tagged = (tagged && isArray(tagged)) ? tagged : [];

    if (placeName && lat && lng) {
      newPost.location = { placeName, lat, lng };
    } else {
      newPost.location = null;
    }

    if (lat && lng) {
      newPost.geoCoordinate = { type: "Point", coordinates: [lng, lat] };
    } else if (authUser && (authUser as any).geoCoordinate) {
      newPost.geoCoordinate = (authUser as any).geoCoordinate;
    } else {
      newPost.geoCoordinate = { type: "Point", coordinates: lat_lng };
    }

    let mediaIDs: MongoID[] = [];
    let createdMediaList: any[] = [];
    let savedPost: any = null;

    try {
      if (mediaFiles && mediaFiles.length !== 0) {
        // storeMedia is potentially the slowest op (S3/network). Keep it sequential to avoid partial posts.
        const mediaList = await storeMedia(mediaFiles, id, businessProfileID, AwsS3AccessEndpoints.POST, 'POST');
        if (mediaList && mediaList.length !== 0) {
          createdMediaList = mediaList; // Store for cleanup if post creation fails
          mediaIDs = mediaList.map(m => m._id as any as MongoID);

          // CRITICAL: Validate that ALL media documents exist before saving the post
          // This prevents data integrity issues where posts reference non-existent media
          const existingMedia = await Media.find({ _id: { $in: mediaIDs } }).select('_id').lean();
          const existingMediaIDs = existingMedia.map(m => m._id.toString());
          const missingMediaIDs = mediaIDs.filter(id => !existingMediaIDs.includes(id.toString()));

          if (missingMediaIDs.length > 0) {
            console.error('CRITICAL: Media validation failed - some media documents do not exist:', missingMediaIDs);
            console.error('Post creation aborted to prevent data integrity issues');
            // Cleanup: Delete orphaned media if validation fails
            await Promise.all(createdMediaList.map(m => Media.findByIdAndDelete(m._id).catch(() => { })));
            return response.send(httpInternalServerError(
              ErrorMessage.invalidRequest("Failed to create media. Please try again."),
              "Media creation failed"
            ));
          }

          // Double-check: Ensure we have the same number of media IDs as created
          if (mediaIDs.length !== existingMedia.length) {
            console.error('CRITICAL: Media count mismatch. Expected:', mediaIDs.length, 'Found:', existingMedia.length);
            // Cleanup: Delete orphaned media if count mismatch
            await Promise.all(createdMediaList.map(m => Media.findByIdAndDelete(m._id).catch(() => { })));
            return response.send(httpInternalServerError(
              ErrorMessage.invalidRequest("Media validation failed. Please try again."),
              "Media validation failed"
            ));
          }
        }
      }

      newPost.media = mediaIDs;

      savedPost = await newPost.save();

      // If we get here, post was created successfully - no cleanup needed

    } catch (postError: any) {
      // CRITICAL: If post creation fails after media was created, cleanup orphaned media
      if (createdMediaList.length > 0) {
        console.error('CRITICAL: Post creation failed after media was created. Cleaning up orphaned media:', createdMediaList.map(m => m._id));
        await Promise.all(createdMediaList.map(m => Media.findByIdAndDelete(m._id).catch(() => { })));
      }
      throw postError; // Re-throw to be caught by outer try-catch
    }

    try {
      //@ts-ignore
      UserRecentPostCache.set(request.user.id, newPost._id.toString());
      FeedOrderCache.clear(request.user.id);
    } catch (cacheErr) {
      // don't block on cache errors
      console.error('Cache update error:', cacheErr);
    }

    // spawn notifications (non-blocking)
    if (savedPost && savedPost.tagged && savedPost.tagged.length !== 0) {
      savedPost.tagged.forEach((taggedUser) => {
        AppNotificationController.store(id, taggedUser, NotificationType.TAGGED, { postID: savedPost.id, userID: taggedUser })
          .catch((err) => console.error('Tag notification error:', err));
      });
    }

    if (savedPost && !haveSubscription && accountType === AccountType.INDIVIDUAL) {
      const incObj: any = {
        videos: (videos && videos.length) ? videos.length : 0,
        images: (images && images.length) ? images.length : 0,
        text: (content && content !== "") ? 1 : 0
      };
      // atomic update - creates the day's doc if missing, increments counts
      await DailyContentLimit.findOneAndUpdate(
        { userID: id, timeStamp: midnightToday },
        {
          $inc: incObj,
          $setOnInsert: {
            timeStamp: midnightToday,
            userID: id
          }
        },
        { upsert: true, new: true }
      ).exec();
    }

    return response.send(httpCreated(savedPost, 'Your post has been created successfully'));
  } catch (error: any) {
    next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
  }
};

const update = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const postID = request?.params?.id;
    const { id, accountType, businessProfileID } = request.user;
    const { content, placeName, lat, lng, tagged, feelings, deletedMedia } = request.body;
    const files = request.files as { [fieldname: string]: Express.Multer.File[] };
    const mediaFiles = files?.media as Express.Multer.S3File[];

    const post = await Post.findOne({ _id: postID });
    if (!post) {
      return response.send(
        httpNotFoundOr404(
          ErrorMessage.invalidRequest(ErrorMessage.POST_NOT_FOUND),
          ErrorMessage.POST_NOT_FOUND
        )
      );
    }

    // Only the owner can update
    if (post.userID.toString() !== id.toString()) {
      return response.send(
        httpForbidden(
          ErrorMessage.invalidRequest("You can't update this post"),
          "You can't update this post"
        )
      );
    }

    // Update simple fields
    if (content) post.content = content;
    if (feelings) post.feelings = feelings;
    if (placeName && lat && lng) post.location = { placeName, lat, lng };
    if (tagged && isArray(tagged)) post.tagged = tagged;

    // Handle uploaded media
    let mediaIDs: MongoID[] = post.media;
    if (mediaFiles?.length) {
      const mediaList = await storeMedia(
        mediaFiles,
        id,
        businessProfileID,
        AwsS3AccessEndpoints.POST,
        "POST"
      );
      mediaList?.forEach((media) => mediaIDs.push(media._id as any as MongoID));
    }

    // ✅ Safely parse deletedMedia (can come as string or array)
    let parsedDeletedMedia: string[] = [];
    if (deletedMedia) {
      try {
        parsedDeletedMedia = Array.isArray(deletedMedia)
          ? deletedMedia
          : JSON.parse(deletedMedia);
      } catch (err) {
        console.error("Invalid deletedMedia format:", deletedMedia);
      }
    }

    // Handle deleted media
    if (parsedDeletedMedia?.length && mediaIDs?.length) {
      await Promise.all(
        parsedDeletedMedia.map(async (media_id: string) => {
          const mediaObject = await Media.findById(media_id);
          if (mediaObject) {
            await Promise.all([
              s3Service.deleteS3Object(mediaObject.s3Key),
              s3Service.deleteS3Asset(mediaObject.thumbnailUrl),
            ]);
            await mediaObject.deleteOne();
            mediaIDs = mediaIDs.filter((m) => m.toString() !== media_id);
          }
        })
      );
    }

    post.media = mediaIDs;
    const updatedPost = await post.save();

    return response.send(httpAcceptedOrUpdated(updatedPost, "Post updated successfully"));
  } catch (error: any) {
    next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
  }
};


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
    const { id } = request.user;
    const postID = request?.params?.id;

    const post = await Post.findById(postID);
    if (!post) {
      return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.POST_NOT_FOUND), ErrorMessage.POST_NOT_FOUND));
    }

    if (post.userID.toString() !== id.toString()) {
      return response.send(httpForbidden(ErrorMessage.invalidRequest("This post cannot be deleted."), "This post cannot be deleted."));
    }

    post.isDeleted = true;
    await Promise.all([
      post.save(),
      Notification.updateMany({ "metadata.postID": post._id }, { isDeleted: true }),
    ]);

    return response.send(httpNoContent(null, "Post deleted successfully (soft delete)"));
  } catch (error: any) {
    next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
  }
};



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
        addMediaInPost().sort_media,
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

async function cloneMediaForStory(
  media: any,
  newOwnerID: MongoID,
  businessProfileID?: MongoID | null
) {
  const clonedMedia = new Media({
    businessProfileID: businessProfileID ?? null,
    userID: newOwnerID,

    fileName: media.fileName,
    fileSize: media.fileSize,
    mediaType: media.mediaType,
    mimeType: media.mimeType,

    width: media.width,
    height: media.height,
    duration: media.duration,

    sourceUrl: media.sourceUrl,
    thumbnailUrl: media.thumbnailUrl,
    s3Key: media.s3Key,
    parentMediaID: media._id, // traceability
    usedIn: "STORY",
  });

  return clonedMedia.save();
}


const publishPostAsStory = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const { id, accountType, businessProfileID } = request.user;
    const { id: postID } = request.params;

    if (!id) {
      return response.send(
        httpNotFoundOr404(
          ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND),
          ErrorMessage.USER_NOT_FOUND
        )
      );
    }

    const post = await Post.findOne({ _id: new ObjectId(postID) });
    if (!post) {
      return response.send(
        httpNotFoundOr404(
          ErrorMessage.invalidRequest(ErrorMessage.POST_NOT_FOUND),
          ErrorMessage.POST_NOT_FOUND
        )
      );
    }


    if (post.userID.toString() === id.toString()) {
      return response.send(
        httpBadRequest(
          ErrorMessage.invalidRequest("You cannot share your own post as a story."),
          "You cannot share your own post as a story."
        )
      );
    }

    // const myFollowingIDs = await fetchUserFollowing(id); // returns IDs I follow
    // const isFollowing = myFollowingIDs.some(f => f.toString() === post.userID.toString());

    // if (!isFollowing) {
    //   return response.send(
    //     httpForbidden(
    //       ErrorMessage.invalidRequest("You can only share media from users you follow."),
    //       "You can only share media from users you follow."
    //     )
    //   );
    // }


    if (!post.media || post.media.length === 0) {
      return response.send(
        httpBadRequest(
          ErrorMessage.invalidRequest("This post has no media to publish as a story."),
          "This post has no media to publish as a story."
        )
      );
    }

    // Fetch all media to filter by type (images and videos only)
    const allMedia = await Media.find({
      _id: { $in: post.media },
      mediaType: { $in: [MediaType.IMAGE, MediaType.VIDEO] }
    });

    if (allMedia.length === 0) {
      return response.send(
        httpBadRequest(
          ErrorMessage.invalidRequest("This post has no images or videos to publish as a story."),
          "This post has no images or videos to publish as a story."
        )
      );
    }

    const mediaIDs = allMedia.map(m => m._id);

    const existingStories = await Story.find({
      userID: id,
      mediaID: { $in: mediaIDs },
      timeStamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    const existingMediaIDs = new Set(existingStories.map(s => s.mediaID.toString()));

    const newMedia = allMedia.filter(
      (media) => !existingMediaIDs.has(media._id.toString())
    );

    if (newMedia.length === 0) {
      return response.send(
        httpBadRequest(
          ErrorMessage.invalidRequest("This post has already been shared as a story."),
          "This post has already been shared as a story."
        )
      );
    }


    const storyPromises = newMedia.map(async (media) => {
      const newStory = new Story();
      newStory.userID = id;
      const clonedMedia = await cloneMediaForStory(
        media,
        id,
        businessProfileID
      );
      newStory.mediaID = clonedMedia._id as MongoID;      
      newStory.duration = media.duration || 10;
      (newStory as any).postID = post._id; // optional, helps trace which post story came from (cast to any to satisfy TS)

      if (accountType === AccountType.BUSINESS && businessProfileID) {
        newStory.businessProfileID = businessProfileID;
      }

      return newStory.save();
    });

    const createdStories = (await Promise.all(storyPromises)).filter(Boolean);

    if (createdStories.length === 0) {
      return response.send(
        httpBadRequest(
          ErrorMessage.invalidRequest("No valid new media found to publish as story."),
          "No valid new media found to publish as story."
        )
      );
    }

    return response.send(httpCreated(createdStories, "Post published as story successfully."));
  } catch (error: any) {
    next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
  }
};






export default { index, store, update, destroy, deletePost, show, storeViews, publishPostAsStory };
