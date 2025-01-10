import { Schema, Model, model, Types, Document, SchemaType } from 'mongoose';
import { MongoID } from '../../common';

export enum MessageType {
    TEXT = "text",
    IMAGE = "image",
    VIDEO = "video",
    PDF = "pdf",
    STORY_COMMENT = "story-comment"
}

export interface ILocation {
    lat: number,
    lng: number,
    placeName: string,
}

const LocationSchema = new Schema<ILocation>(
    {
        lat: { type: Number, default: 0 },
        lng: { type: Number, default: 0 },
        placeName: { type: String, default: "" },
    },
    {
        _id: false,
    }
)

export interface IMessage extends Document {
    userID: MongoID;//sender
    targetUserID: MongoID;//receiver
    message: string;
    isSeen: boolean;
    type: MessageType;
    contact?: string;
    link?: string;
    mediaUrl?: string;
    gift?: string;
    giftID?: MongoID;
    location?: ILocation;
    deletedByID: MongoID[];
    storyID: MongoID;
    mediaID: MongoID;
}
const MessageSchema: Schema = new Schema<IMessage>(
    {
        userID: { type: Schema.Types.ObjectId, ref: "User", required: true },
        targetUserID: { type: Schema.Types.ObjectId, ref: "User", required: true },
        message: { type: String, default: '' },
        type: { type: String, enum: MessageType },
        isSeen: {
            type: Boolean,
            default: false
        },
        deletedByID: [
            { type: Schema.Types.ObjectId, ref: "User" }
        ],
        contact: { type: String },
        link: { type: String },
        mediaUrl: { type: String },
        mediaID: { type: Schema.Types.ObjectId, ref: "Media" },
        storyID: { type: Schema.Types.ObjectId, ref: "Story" },
        location: LocationSchema
    },
    {
        timestamps: true
    }
);
MessageSchema.set('toObject', { virtuals: true });
MessageSchema.set('toJSON', { virtuals: true });

export interface IMessageModel extends Model<IMessage> {
}

const Message = model<IMessage, IMessageModel>("Message", MessageSchema);
export default Message;