import { Schema, Model, model, Types, Document } from 'mongoose';
import { MongoID } from '../../common';
interface IEventJoin extends Document {
    userID: MongoID;
    postID: MongoID;
}

const AuthTokenSchema: Schema = new Schema<IEventJoin>(
    {
        postID: {
            type: Schema.Types.ObjectId,
            ref: "Post",
            required: true,
        },
        userID: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true
    });

export interface IEventJoinModel extends Model<IEventJoin> {
}

const EventJoin = model<IEventJoin, IEventJoinModel>("EventJoin", AuthTokenSchema);
export default EventJoin;


