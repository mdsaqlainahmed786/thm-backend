import { Schema, Model, model, Types, Document } from 'mongoose';
import { MongoID } from '../../common';


export interface IWebsiteRedirection extends Document {
    userID: MongoID;
    businessProfileID?: MongoID;
}
const WebsiteRedirectionSchema: Schema = new Schema<IWebsiteRedirection>(
    {
        userID: { type: Schema.Types.ObjectId, ref: "User", required: true },
        businessProfileID: { type: Schema.Types.ObjectId, ref: "BusinessProfile" },
    },
    {
        timestamps: true
    }
);
WebsiteRedirectionSchema.set('toObject', { virtuals: true });
WebsiteRedirectionSchema.set('toJSON', { virtuals: true });

export interface IWebsiteRedirectionModel extends Model<IWebsiteRedirection> {
}

const WebsiteRedirection = model<IWebsiteRedirection, IWebsiteRedirectionModel>("WebsiteRedirection", WebsiteRedirectionSchema);
export default WebsiteRedirection;
