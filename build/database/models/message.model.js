"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageType = void 0;
const mongoose_1 = require("mongoose");
var MessageType;
(function (MessageType) {
    MessageType["TEXT"] = "text";
    MessageType["IMAGE"] = "image";
    MessageType["VIDEO"] = "video";
    MessageType["PDF"] = "pdf";
    MessageType["STORY_COMMENT"] = "story-comment";
})(MessageType || (exports.MessageType = MessageType = {}));
const LocationSchema = new mongoose_1.Schema({
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 },
    placeName: { type: String, default: "" },
}, {
    _id: false,
});
const MessageSchema = new mongoose_1.Schema({
    userID: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    targetUserID: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, default: '' },
    type: { type: String, enum: MessageType },
    isSeen: {
        type: Boolean,
        default: false
    },
    deletedByID: [
        { type: mongoose_1.Schema.Types.ObjectId, ref: "User" }
    ],
    contact: { type: String },
    link: { type: String },
    // mediaUrl: { type: String },
    mediaID: { type: mongoose_1.Schema.Types.ObjectId, ref: "Media" },
    storyID: { type: mongoose_1.Schema.Types.ObjectId, ref: "Story" },
    postID: { type: mongoose_1.Schema.Types.ObjectId, ref: "Post" },
    location: LocationSchema,
    isEdited: { type: Boolean, default: false },
    editedAt: { type: Date },
    clientMessageID: { type: String },
    isDeleted: { type: Boolean, default: false }
}, {
    timestamps: true
});
MessageSchema.set('toObject', { virtuals: true });
MessageSchema.set('toJSON', { virtuals: true });
// Performance indexes for message queries
MessageSchema.index({ userID: 1, createdAt: -1 });
MessageSchema.index({ targetUserID: 1, createdAt: -1 });
MessageSchema.index({ userID: 1, targetUserID: 1, createdAt: -1 });
MessageSchema.index({ targetUserID: 1, userID: 1, createdAt: -1 });
MessageSchema.index({ deletedByID: 1 });
MessageSchema.index({ mediaID: 1 });
MessageSchema.index({ storyID: 1 });
const Message = (0, mongoose_1.model)("Message", MessageSchema);
exports.default = Message;
