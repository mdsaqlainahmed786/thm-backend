import { Document, Model, Schema, model, Types } from "mongoose";
import { MongoID } from "../../common";
import { Address, AddressSchema, IAddress } from "./common.model";
interface INotIndexedReview extends Document {
    userID: MongoID;
    postID: MongoID;
    name: string;
    address: IAddress,
    placeID: string;
}
const NotIndexedReviewSchema: Schema = new Schema<INotIndexedReview>(
    {
        postID: { type: Schema.Types.ObjectId, ref: "Post" },
        userID: { type: Schema.Types.ObjectId, ref: "User", required: true },
        name: { type: String },
        placeID: { type: String },
        address: AddressSchema,
    },
    {
        timestamps: true
    }
);
NotIndexedReviewSchema.set('toObject', { virtuals: true });
NotIndexedReviewSchema.set('toJSON', { virtuals: true });

export interface INotIndexedReviewModel extends Model<INotIndexedReview> {
}

const NotIndexedReview = model<INotIndexedReview, INotIndexedReviewModel>('NotIndexedReview', NotIndexedReviewSchema);
export default NotIndexedReview;

