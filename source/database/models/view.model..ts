import { Video } from './media.model';
import { Document, Model, Schema, model, Types } from "mongoose";
import { MongoID } from "../../common";
interface StoryView {//Only for story views
    storyID: MongoID;
}
interface VideoView {//Post media views
    postID: MongoID;
    mediaID: MongoID;
}
interface IViews extends VideoView, StoryView, Document {
    userID: MongoID;
    businessProfileID?: MongoID;
    createdAt: Date;
    updatedAt: Date;
}
const ViewsSchema: Schema = new Schema<IViews>(
    {
        userID: { type: Schema.Types.ObjectId, ref: "User", required: true },
        storyID: { type: Schema.Types.ObjectId, ref: "Story", },
        businessProfileID: {
            type: Schema.Types.ObjectId,
            ref: "BusinessProfile"
        },
        postID: { type: Schema.Types.ObjectId, ref: "Post" },
        mediaID: {
            type: Schema.Types.ObjectId,
            ref: "Media"
        },
    },
    {
        timestamps: true
    }
);
ViewsSchema.set('toObject', { virtuals: true });
ViewsSchema.set('toJSON', { virtuals: true });

export interface IStoryModel extends Model<IViews> {
}

const View = model<IViews, IStoryModel>('View', ViewsSchema);
export default View;


