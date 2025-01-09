import { Schema, Model, model, Types, Document } from 'mongoose';
import { MongoID } from '../../common';
import User, { activeUserQuery } from './user.model';

export enum ConnectionStatus {
    PENDING = "pending",
    ACCEPTED = "accepted",
    REJECT = "reject"
}

export interface IUserConnection extends Document {
    follower: MongoID;//represents the user who is initiating the action
    following: MongoID; //represents the user who is the subject of that action.
    status: string;
}
const UserConnectionSchema: Schema = new Schema<IUserConnection>(
    {
        follower: { type: Schema.Types.ObjectId, ref: "User", required: true },
        following: { type: Schema.Types.ObjectId, ref: "User", required: true },
        status: {
            type: String,
            enum: ConnectionStatus,
            default: ConnectionStatus.PENDING,
        },
    },
    {
        timestamps: true
    }
);
UserConnectionSchema.set('toObject', { virtuals: true });
UserConnectionSchema.set('toJSON', { virtuals: true });

export interface IUserConnectionModel extends Model<IUserConnection> {
}

const UserConnection = model<IUserConnection, IUserConnectionModel>("UserConnection", UserConnectionSchema);
export default UserConnection;

export async function fetchUserFollowing(userID: MongoID) {
    return await UserConnection.distinct('following', { follower: userID, status: ConnectionStatus.ACCEPTED });
}
export async function fetchUserFollower(userID: MongoID) {
    return await UserConnection.distinct('follower', { following: userID, status: ConnectionStatus.ACCEPTED })
}

export async function fetchFollowingCount(userID: MongoID) {
    const followerIDs = await fetchUserFollowing(userID);
    return await User.find({ _id: { $in: followerIDs }, ...activeUserQuery }).countDocuments();
}
export async function fetchFollowerCount(userID: MongoID) {
    const followingIDs = await fetchUserFollower(userID);
    return await User.find({ _id: { $in: followingIDs }, ...activeUserQuery }).countDocuments();
}