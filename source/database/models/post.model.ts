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
            ref: "Media"
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