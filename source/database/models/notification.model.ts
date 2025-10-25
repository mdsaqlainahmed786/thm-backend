import { Schema, Model, model, Types, Document, SchemaType } from 'mongoose';
import { MongoID } from '../../common';
export enum NotificationType {
    LIKE_A_STORY = "like-a-story",
    LIKE_POST = "like-post",
    LIKE_COMMENT = "like-comment",
    FOLLOW_REQUEST = "follow-request",
    ACCEPT_FOLLOW_REQUEST = "accept-follow-request",
    COLLABORATION_INVITE = "collaboration-invite", 
    COLLABORATION_ACCEPTED = "collaboration-accepted",
    COLLABORATION_REJECTED = "collaboration-rejected",
    FOLLOWING = "following",
    COMMENT = "comment",
    REPLY = "reply",
    REVIEW = 'review',
    TAGGED = 'tagged',
    MESSAGING = 'messaging',
    EVENT_JOIN = "event-join"
}

export interface INotification extends Document {
    userID: MongoID;//represents the user who is initiating the action
    targetUserID: MongoID; //represents the user who is the subject of that action.
    senderID?: MongoID;
    postID?: MongoID;
    title: string;
    description: string;
    type: NotificationType;
    isSeen: boolean;
    isDeleted: boolean;
    metadata?: any;
}
const NotificationSchema: Schema = new Schema<INotification>(
    {
        userID: {
            type: Schema.Types.ObjectId, ref: "User", required: true
        },
        senderID: { type: Schema.Types.ObjectId, ref: "User", required: true }, // who triggered it
        postID: { type: Schema.Types.ObjectId, ref: "Post" },
        targetUserID: {
            type: Schema.Types.ObjectId, ref: "User", required: true
        },
        title: {
            type: String, required: true
        },
        description: {
            type: String, required: true
        },
        type: {
            type: String, enum: NotificationType,
        },
        metadata: {
            type: Schema.Types.Mixed
        },
        isSeen: {
            type: Boolean, default: false
        },
        isDeleted: {
            type: Boolean, default: false
        }
    },
    {
        timestamps: true
    }
);
NotificationSchema.set('toObject', { virtuals: true });
NotificationSchema.set('toJSON', { virtuals: true });

export interface INotificationModel extends Model<INotification> {
}

const Notification = model<INotification, INotificationModel>("Notification", NotificationSchema);
export default Notification;