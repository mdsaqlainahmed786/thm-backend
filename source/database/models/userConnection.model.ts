import { Schema, Model, model, Types, Document } from 'mongoose';
import { MongoID } from '../../common';

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