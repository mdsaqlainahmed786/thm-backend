import { Document, Model, Schema, model, Types } from "mongoose";
import { MongoID } from "../../common";
import { PostType } from "./post.model";
import { ContentType } from "../../common";

interface ISharedContent extends Document {
    contentType: ContentType,
    contentID: MongoID;
    userID: MongoID;
    businessProfileID?: MongoID;
}
const SharedContentSchema: Schema = new Schema<ISharedContent>(
    {
        userID: { type: Schema.Types.ObjectId, ref: "User", required: true },
        contentID: { type: Schema.Types.ObjectId, required: true },
        businessProfileID: { type: Schema.Types.ObjectId, ref: "BusinessProfile", },
        contentType: {
            type: String,
            required: true
        }
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
