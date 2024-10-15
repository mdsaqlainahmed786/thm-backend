import { Document, Model, Schema, model, Types } from "mongoose";
import { MongoID } from "../../common";
import { addBusinessProfileInUser } from "./user.model";

interface IBlockedUser extends Document {
    userID: MongoID;
    blockedUserID: MongoID;
    businessProfileID?: MongoID;
}
const BlockedUserSchema: Schema = new Schema<IBlockedUser>(
    {
        userID: { type: Schema.Types.ObjectId, ref: "User", required: true },
        blockedUserID: { type: Schema.Types.ObjectId, ref: "User" },
        businessProfileID: { type: Schema.Types.ObjectId, ref: "BusinessProfile" },
    },
    {
        timestamps: true
    }
);
BlockedUserSchema.set('toObject', { virtuals: true });
BlockedUserSchema.set('toJSON', { virtuals: true });

export interface IBlockedUserModel extends Model<IBlockedUser> {
}

const BlockedUser = model<IBlockedUser, IBlockedUserModel>('BlockedUser', BlockedUserSchema);
export default BlockedUser;
