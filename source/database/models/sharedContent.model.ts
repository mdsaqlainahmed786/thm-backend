import { Document, Model, Schema, model, Types } from "mongoose";
import { MongoID } from "../../common";
import { PostType } from "./post.model";

enum Content {
    STORY = 'story'
}

type ContentType = PostType | Content;

interface ISharedContent extends Document {
    contentType: ContentType,
    userID: MongoID;
    postID: MongoID;
    businessProfileID?: MongoID;
}
const SharedContentSchema: Schema = new Schema<ISharedContent>(
    {
        userID: { type: Schema.Types.ObjectId, ref: "User", required: true },
        postID: { type: Schema.Types.ObjectId, ref: "Post", required: true },
        businessProfileID: { type: Schema.Types.ObjectId, ref: "BusinessProfile", },
    },
    {
        timestamps: true
    }
);
SharedContentSchema.set('toObject', { virtuals: true });
SharedContentSchema.set('toJSON', { virtuals: true });

export interface ISharedContentModel extends Model<ISharedContent> {
}

const SharedContent = model<ISharedContent, ISharedContentModel>('SharedContent', SharedContentSchema);
export default SharedContent;
