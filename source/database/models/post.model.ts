import { Schema, Document, model, Types } from "mongoose";
import { ILocation, LocationSchema } from "./common.model";
import { MongoID } from "../../common";
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
    reviewedBusinessProfileID: MongoID;//used as a review id
    rating: number;
    placeID: string;//used to map google business account or rating purpose
    reviews: Review[];
}
interface IEvent {
    name: string,
    date: string,
    time: string,
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
    location: ILocation | null;
    media: MongoID[];
    tagged: MongoID[];
    feelings: string;
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
        date: { type: String, },
        time: { type: String, },
        type: { type: String, },
        streamingLink: { type: String, },
        venue: { type: String, },
    },
    {
        timestamps: true
    }
);
PostSchema.set('toObject', { virtuals: true });
PostSchema.set('toJSON', { virtuals: true });

export interface IPostModel extends IPost {
}

const Post = model<IPost>('Post', PostSchema);
export default Post;

import { addBusinessProfileInUser, addBusinessSubTypeInBusinessProfile, addBusinessTypeInBusinessProfile } from "./user.model";

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
                        "businessProfileRef.businessTypeRef": 1,
                        "businessProfileRef.businessSubtypeRef": 1,
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
    return { lookup }
}
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
                {
                    '$project': {
                        "profilePic": 1,
                        "address": 1,
                        "name": 1,
                        "coverImage": 1,
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