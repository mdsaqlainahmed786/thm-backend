import { Schema, Document, model, Types } from "mongoose";
import { ILocation, LocationSchema } from "./common.model";
import { MongoID } from "../../common";
export enum PostType {
    POST = "post",
    REVIEW = "review"
}
enum MediaType {
    IMAGE = "image",
    VIDEO = "video",
    // CAROUSEL = "carousel",
}



interface IPost {
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

// user_tags
const PostSchema: Schema = new Schema<IPost>(
    {
        userID: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        businessProfileID: {
            type: Schema.Types.ObjectId,
            ref: "User"
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
        }
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

import { addBusinessProfileInUser } from "./user.model";

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