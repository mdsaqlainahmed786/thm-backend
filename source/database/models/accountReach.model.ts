import { Document, Model, Schema, model, Types } from "mongoose";
import { MongoID } from "../../common";

interface IAccountReach extends Document {
    businessProfileID?: MongoID;
    reachedBy: MongoID;
}
const LikeSchema: Schema = new Schema<IAccountReach>(
    {
        reachedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
        businessProfileID: {
            type: Schema.Types.ObjectId,
            ref: "BusinessProfile"
        },
    },
    {
        timestamps: true
    }
);
LikeSchema.set('toObject', { virtuals: true });
LikeSchema.set('toJSON', { virtuals: true });

export interface IAccountReachModel extends Model<IAccountReach> {
}

const AccountReach = model<IAccountReach, IAccountReachModel>('AccountReach', LikeSchema);
export default AccountReach;
