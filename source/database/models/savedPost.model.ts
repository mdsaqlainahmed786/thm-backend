import { Document, Model, Schema, model, Types } from "mongoose";
import { MongoID } from "../../common";

interface ISavedPost extends Document {
    userID: MongoID;
    postID: MongoID;
    businessProfileID?: MongoID;
}
const LikeSchema: Schema = new Schema<ISavedPost>(
    {
        userID: { type: Schema.Types.ObjectId, ref: "User", required: true },
        postID: { type: Schema.Types.ObjectId, ref: "Post", required: true },
        businessProfileID: { type: Schema.Types.ObjectId, ref: "BusinessProfile", },
    },
    {
        timestamps: true
    }
);
LikeSchema.set('toObject', { virtuals: true });
LikeSchema.set('toJSON', { virtuals: true });

export interface ISavedPostModel extends Model<ISavedPost> {
}

const SavedPost = model<ISavedPost, ISavedPostModel>('SavedPost', LikeSchema);
export default SavedPost;
