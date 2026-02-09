"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationType = void 0;
const mongoose_1 = require("mongoose");
var NotificationType;
(function (NotificationType) {
    NotificationType["LIKE_A_STORY"] = "like-a-story";
    NotificationType["LIKE_POST"] = "like-post";
    NotificationType["LIKE_COMMENT"] = "like-comment";
    NotificationType["FOLLOW_REQUEST"] = "follow-request";
    NotificationType["ACCEPT_FOLLOW_REQUEST"] = "accept-follow-request";
    NotificationType["COLLABORATION_INVITE"] = "collaboration-invite";
    NotificationType["COLLABORATION_ACCEPTED"] = "collaboration-accepted";
    NotificationType["COLLABORATION_REJECTED"] = "collaboration-rejected";
    NotificationType["FOLLOWING"] = "following";
    NotificationType["COMMENT"] = "comment";
    NotificationType["REPLY"] = "reply";
    NotificationType["REVIEW"] = "review";
    NotificationType["TAGGED"] = "tagged";
    NotificationType["MESSAGING"] = "messaging";
    NotificationType["EVENT_JOIN"] = "event-join";
    NotificationType["BOOKING"] = "booking";
    NotificationType["JOB"] = "job";
    NotificationType["MARKETING"] = "marketing";
    NotificationType["SHARE_POST_TO_STORY"] = "share-post-to-story";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
const NotificationSchema = new mongoose_1.Schema({
    userID: {
        type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true
    },
    senderID: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true }, // who triggered it
    postID: { type: mongoose_1.Schema.Types.ObjectId, ref: "Post" },
    targetUserID: {
        type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true
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
        type: mongoose_1.Schema.Types.Mixed
    },
    isSeen: {
        type: Boolean, default: false
    },
    isDeleted: {
        type: Boolean, default: false
    }
}, {
    timestamps: true
});
NotificationSchema.set('toObject', { virtuals: true });
NotificationSchema.set('toJSON', { virtuals: true });
const Notification = (0, mongoose_1.model)("Notification", NotificationSchema);
exports.default = Notification;
