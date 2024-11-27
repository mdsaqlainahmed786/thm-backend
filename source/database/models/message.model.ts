import { Schema, Model, model, Types, Document, SchemaType } from 'mongoose';

export enum MessageType {
    TEXT = "text",
    IMAGE = "image",
    VIDEO = "video",
    PDF = "pdf",
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
    userID: string | Types.ObjectId;//sender
    targetUserID: string | Types.ObjectId; //receiver
    message: string;
    isSeen: boolean;
    type: MessageType;
    contact?: string;
    link?: string;
    mediaUrl?: string;
    gift?: string;
    giftID?: string | Types.ObjectId;
    location?: ILocation;
    deletedByID: (string | Types.ObjectId)[];
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
        gift: { type: String },
        giftID: { type: Schema.Types.ObjectId, ref: "Gift" },
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