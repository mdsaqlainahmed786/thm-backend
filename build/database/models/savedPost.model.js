"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const SavedPostSchema = new mongoose_1.Schema({
    userID: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    postID: { type: mongoose_1.Schema.Types.ObjectId, ref: "Post", required: true },
    businessProfileID: { type: mongoose_1.Schema.Types.ObjectId, ref: "BusinessProfile", },
}, {
    timestamps: true
});
SavedPostSchema.set('toObject', { virtuals: true });
SavedPostSchema.set('toJSON', { virtuals: true });
const SavedPost = (0, mongoose_1.model)('SavedPost', SavedPostSchema);
exports.default = SavedPost;
