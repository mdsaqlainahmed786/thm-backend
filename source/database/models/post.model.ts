import { Schema, Document, model, Types } from "mongoose";

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
    userID: Types.ObjectId | string;
    businessProfileID?: Types.ObjectId | string;
    postType: PostType;
    content: string;
    isPublished: boolean;
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