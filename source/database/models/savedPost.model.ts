import { Document, Model, Schema, model, Types } from "mongoose";
import { MongoID } from "../../common";

interface ISavedPost extends Document {
    userID: MongoID;
    postID: MongoID;
    businessProfileID?: MongoID;
}
const SavedPosSchema: Schema = new Schema<ISavedPost>(
    {
        userID: { type: Schema.Types.ObjectId, ref: "User", required: true },
        postID: { type: Schema.Types.ObjectId, ref: "Post", required: true },
        businessProfileID: { type: Schema.Types.ObjectId, ref: "BusinessProfile", },
    },
    {
        timestamps: true
    }
);
SavedPosSchema.set('toObject', { virtuals: true });
SavedPosSchema.set('toJSON', { virtuals: true });

export interface ISavedPostModel extends Model<ISavedPost> {
}

const SavedPost = model<ISavedPost, ISavedPostModel>('SavedPost', SavedPosSchema);
export default SavedPost;
