import { Document, Model, Schema, model, Types } from "mongoose";
import { MongoID } from "../../common";
interface IViews extends Document {
    userID: MongoID;
    businessProfileID?: MongoID;
    storyID: MongoID;
}
const ViewsSchema: Schema = new Schema<IViews>(
    {
        userID: { type: Schema.Types.ObjectId, ref: "User", required: true },
        storyID: { type: Schema.Types.ObjectId, ref: "Story", required: true },
        businessProfileID: {
            type: Schema.Types.ObjectId,
            ref: "BusinessProfile"
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


