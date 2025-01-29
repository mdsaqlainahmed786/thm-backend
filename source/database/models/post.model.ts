import { Schema, Document, model, Types } from "mongoose";
import { addLikesInPost } from "./like.model";
import { addCommentsInPost, addSharedCountInPost } from "./comment.model";
import { MongoID } from "../../common";
import SavedPost from "./savedPost.model";
import { GeoCoordinate } from "./common.model";
import { LocationSchema, ILocation } from "./common.model";
export enum PostType {
    POST = "post",
    REVIEW = "review",
    EVENT = "event"
}
enum MediaType {
    IMAGE = "image",
    VIDEO = "video",
    // CAROUSEL = "carousel",
}

export interface Review {
    questionID: MongoID;
    rating: number;
}
export const ReviewSchema = new Schema<Review>(
    {
        questionID: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        rating: { type: Number, default: 0 },
    },
    {
        _id: false,
    }
)

interface IReview {
    publicUserID: MongoID;//open review
    reviewedBusinessProfileID: MongoID;//used as a review id
    googleReviewedBusiness: MongoID;//used as a review id for google business review
    rating: number;
    placeID: string;//used to map google business account or rating purpose
    reviews: Review[];
}
interface IEvent {
    name: string,
    startDate: string,
    startTime: string,
    endDate: string,
    endTime: string,
    type: string,
    streamingLink: string,
    venue: string,
}




interface IPost extends IReview, IEvent, Document {
    userID: MongoID;
    businessProfileID?: MongoID;
    postType: PostType;
    content: string;
    isPublished: boolean;
    isDeleted: boolean;
    location: ILocation | null;
    media: MongoID[];
    tagged: MongoID[];
    feelings: string;
    createdAt: Date;
    updatedAt: Date;
    views: number;
    geoCoordinate: GeoCoordinate;
}

const PostSchema: Schema = new Schema<IPost>(
    {
        userID: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        businessProfileID: {
            type: Schema.Types.ObjectId,
            ref: "BusinessProfile"
        },
        reviewedBusinessProfileID: {
            type: Schema.Types.ObjectId,
            ref: "BusinessProfile"
        },
        googleReviewedBusiness: {
            type: Schema.Types.ObjectId,
            ref: "AnonymousUser"
        },
        publicUserID: {
            type: Schema.Types.ObjectId,
            ref: "AnonymousUser"
        },
        content: {
            type: String,
        },
        postType: {
            type: String,
            enum: PostType,
            required: true,
        },
        isPublished: {
            type: Boolean,
            default: false
        },
        isDeleted: {
            type: Boolean,
            default: false
        },
        location: LocationSchema,
        media: [{
            type: Schema.Types.ObjectId,
            ref: "Media"
        }],
        tagged: [{
            type: Schema.Types.ObjectId,
            ref: "User"
        }],
        feelings: {
            type: String,
            default: ''
        },
        rating: {
            type: Number,
        },
        placeID: {
            type: String,
        },
        reviews: [ReviewSchema],
        name: { type: String, },
        startDate: { type: String, },
        startTime: { type: String, },
        endDate: { type: String, },
        endTime: { type: String, },
        type: { type: String, },
        streamingLink: { type: String, },
        venue: { type: String, },
        geoCoordinate: {
            type: {
                type: String,
                enum: ['Point'],  // Specify the type as "Point" for geo spatial indexing
            },
            coordinates: {
                type: [Number],
            }
        },
        views: { type: Number }
    },
    {
        timestamps: true
    }
);
PostSchema.index({ 'geoCoordinate': '2dsphere' });
PostSchema.set('toObject', { virtuals: true });
PostSchema.set('toJSON', { virtuals: true });

export interface IPostModel extends IPost {
}

const Post = model<IPostModel>('Post', PostSchema);
export default Post;

import { addBusinessProfileInUser, addBusinessSubTypeInBusinessProfile, addBusinessTypeInBusinessProfile } from "./user.model";
import { addUserInBusinessProfile } from "./businessProfile.model";
import { addAnonymousUserInPost } from "./anonymousUser.model";

/**
 *
 * @returns 
 * Return posted by user lookup 
 */
export function addPostedByInPost() {
    const lookup = {
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
    };
    const unwindLookup = {
        '$unwind': {
            'path': '$postedBy',
            'preserveNullAndEmptyArrays': true//false value does not fetch relationship.
        }
    }
    return { lookup, unwindLookup }
}
/**
 * 
 * @returns 
 * Return tagged people reference in post
 */
export function addTaggedPeopleInPost() {
    const lookup = {
        '$lookup': {
            'from': 'users',
            'let': { 'taggedID': '$tagged' },
            'pipeline': [
                { '$match': { '$expr': { '$in': ['$_id', '$$taggedID'] } } },
                addBusinessProfileInUser().lookup,
                addBusinessProfileInUser().unwindLookup,
                {
                    '$project': {
                        "name": 1,
                        "profilePic": 1,
                        "accountType": 1,
                        'username': 1,
                        "businessProfileID": 1,
                        "businessProfileRef._id": 1,
                        "businessProfileRef.name": 1,
                        "businessProfileRef.profilePic": 1,
                        "businessProfileRef.businessTypeRef": 1,
                    }
                }
            ],
            'as': 'taggedRef'
        }
    };
    return { lookup }
}
/**
 * 
 * @returns 
 * Return total media reference in post
 */
export function addMediaInPost() {
    const lookup = {
        '$lookup': {
            'from': 'media',
            'let': { 'mediaIDs': '$media' },
            'pipeline': [
                { '$match': { '$expr': { '$in': ['$_id', '$$mediaIDs'] } } },
                {
                    '$project': {
                        "userID": 0,
                        "fileName": 0,
                        "width": 0,
                        "height": 0,
                        "fileSize": 0,
                        "s3Key": 0,
                        "createdAt": 0,
                        "updatedAt": 0,
                        "__v": 0
                    }
                }
            ],
            'as': 'mediaRef'
        }
    };
    const sort_media =
    {
        $addFields: {
            mediaRef: {
                $sortArray: { input: "$mediaRef", sortBy: { _id: 1 } }
            },
        }
    };

    return { lookup, sort_media }
}

/**
 * 
 * @returns 
 * Return Business Profile
 */
export function addReviewedBusinessProfileInPost() {
    const lookup = {
        '$lookup': {
            'from': 'businessprofiles',
            'let': { 'reviewedBusinessProfileID': '$reviewedBusinessProfileID' },
            'pipeline': [
                { '$match': { '$expr': { '$eq': ['$_id', '$$reviewedBusinessProfileID'] } } },
                addBusinessTypeInBusinessProfile().lookup,
                addBusinessTypeInBusinessProfile().unwindLookup,
                addBusinessSubTypeInBusinessProfile().lookup,
                addBusinessSubTypeInBusinessProfile().unwindLookup,
                addUserInBusinessProfile().lookup,
                addUserInBusinessProfile().unwindLookup,
                {
                    '$project': {
                        "userID": {
                            '$ifNull': [{ '$ifNull': ['$usersRef._id', ''] }, '']
                        },
                        "profilePic": 1,
                        "address": 1,
                        "name": 1,
                        "coverImage": 1,
                        "rating": 1,
                        "businessTypeRef": 1,
                        "businessSubtypeRef": 1,
                    }
                }
            ],
            'as': 'reviewedBusinessProfileRef'
        }
    };
    const unwindLookup = {
        '$unwind': {
            'path': '$reviewedBusinessProfileRef',
            'preserveNullAndEmptyArrays': true//false value does not fetch relationship.
        }
    }
    return { lookup, unwindLookup }
}


export function addGoogleReviewedBusinessProfileInPost() {
    const lookup = {
        '$lookup': {
            'from': 'anonymoususers',
            'let': { 'googleReviewedBusiness': '$googleReviewedBusiness' },
            'pipeline': [
                { '$match': { '$expr': { '$eq': ['$_id', '$$googleReviewedBusiness'] } } },
                addBusinessTypeInBusinessProfile().lookup,
                addBusinessTypeInBusinessProfile().unwindLookup,
                addBusinessSubTypeInBusinessProfile().lookup,
                addBusinessSubTypeInBusinessProfile().unwindLookup,
                {
                    '$project': {
                        "userID": "",
                        "profilePic": 1,
                        "address": 1,
                        "name": 1,
                        "coverImage": 1,
                        "rating": 1,
                        "businessTypeRef": 1,
                        "businessSubtypeRef": 1,
                    }
                }
            ],
            'as': 'googleReviewedBusinessRef'
        }
    };
    const unwindLookup = {
        '$unwind': {
            'path': '$googleReviewedBusinessRef',
            'preserveNullAndEmptyArrays': true//false value does not fetch relationship.
        }
    }
    return { lookup, unwindLookup }
}


/**
 * 
 * @returns 
 * Return interested people count which is interested to join event
 */
export function addInterestedPeopleInPost() {
    const lookup = {
        $lookup: {
            from: 'eventjoins',
            let: { postID: '$_id' },
            pipeline: [
                { $match: { $expr: { $eq: ['$postID', '$$postID'] } } },
                {
                    '$lookup': {
                        'from': 'users',
                        'let': { 'userID': '$userID' },
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
                                '$project': {
                                    "_id": 0,
                                    "profilePic": 1,
                                }
                            }
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
                    '$replaceRoot': {
                        'newRoot': {
                            '$mergeObjects': ["$$ROOT", "$usersRef"] // Merge businessProfileRef with the user object
                        }
                    }
                },
                {
                    '$project': {
                        "_id": 0,
                        "userID": 1,
                        "profilePic": 1,
                    }
                }
            ],
            as: 'eventJoinsRef'
        },
    };
    const addInterestedCount = {
        $addFields: {
            interestedPeople: { $cond: { if: { $isArray: "$eventJoinsRef" }, then: { $size: "$eventJoinsRef" }, else: 0 } }
        }
    };
    return { lookup, addInterestedCount }
}

export function isLikedByMe(likedByMe: MongoID[]) {
    return {
        $addFields: {
            likedByMe: {
                $in: ['$_id', likedByMe]
            },
        }
    };
}
export function isSavedByMe(savedByMe: MongoID[]) {
    return {
        $addFields: {
            savedByMe: {
                $in: ['$_id', savedByMe]
            },
        }
    };
}
export function imJoining(joiningEvents: MongoID[]) {
    return {
        $addFields: {
            imJoining: {
                $in: ['$_id', joiningEvents]
            },
        }
    };
}

/**
 * 
 * @param match  Used in an aggregation pipeline to filter documents.
 * @param likedByMe To check which post request user liked or not
 * @param savedByMe To check which post request user saved or not
 * @param pageNumber Page number 
 * @param documentLimit Return document limit
 * @returns 
 * 
 * This will return post with like and comment count and also determine post saved or liked by requested user
 */
export function fetchPosts(match: { [key: string]: any; }, likedByMe: MongoID[], savedByMe: MongoID[], joiningEvents: MongoID[], pageNumber: number, documentLimit: number, lat?: number | string | undefined, lng?: number | string | undefined) {
    return Post.aggregate(
        [
            {
                $geoNear: {
                    near: { type: "Point", coordinates: [lng ? parseFloat(lng.toString()) : 0, lat ? parseFloat(lat.toString()) : 0] },
                    spherical: true,
                    query: match,
                    distanceField: "distance"
                }
            },
            {
                $addFields: {
                    distance: { $toInt: "$distance" },
                    sortDate: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$createdAt"
                        }
                    }
                }
            },
            {
                $skip: pageNumber > 0 ? ((pageNumber - 1) * documentLimit) : 0
            },
            {
                $limit: documentLimit
            },
            {
                $sort: {
                    sortDate: -1, distance: 1,
                }
            },
            addMediaInPost().lookup,
            addMediaInPost().sort_media,
            addTaggedPeopleInPost().lookup,
            addPostedByInPost().lookup,
            addPostedByInPost().unwindLookup,
            addAnonymousUserInPost().lookup,
            addAnonymousUserInPost().unwindLookup,
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
            addInterestedPeopleInPost().lookup,
            addInterestedPeopleInPost().addInterestedCount,
            isLikedByMe(likedByMe),
            isSavedByMe(savedByMe),
            imJoining(joiningEvents),
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
                $unset: [
                    // "distance",//Need to 
                    // "sortDate",
                    "publicPostedBy",
                    "googleReviewedBusinessRef",
                    "eventJoinsRef",
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
    ).exec();
}
export const getPostQuery = { isPublished: true, isDeleted: false };
export async function getPostsCount(userID: MongoID) {
    return Post.find({ userID: userID, ...getPostQuery }).countDocuments()
}

export async function getSavedPost(userID: MongoID) {
    return SavedPost.distinct('postID', { userID: userID, postID: { $ne: null } });
}

