"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const BlockedUserSchema = new mongoose_1.Schema({
    userID: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    blockedUserID: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
    businessProfileID: { type: mongoose_1.Schema.Types.ObjectId, ref: "BusinessProfile" },
}, {
    timestamps: true
});
BlockedUserSchema.set('toObject', { virtuals: true });
BlockedUserSchema.set('toJSON', { virtuals: true });
const BlockedUser = (0, mongoose_1.model)('BlockedUser', BlockedUserSchema);
exports.default = BlockedUser;
