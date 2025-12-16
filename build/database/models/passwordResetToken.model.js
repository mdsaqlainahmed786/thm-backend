"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const PasswordResetTokenSchema = new mongoose_1.Schema({
    userID: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    token: { type: String, required: true },
    expiresIn: { type: Date, required: true }
}, {
    timestamps: true
});
PasswordResetTokenSchema.set('toObject', { virtuals: true });
PasswordResetTokenSchema.set('toJSON', { virtuals: true });
const PasswordResetToken = (0, mongoose_1.model)('PasswordResetToken', PasswordResetTokenSchema);
exports.default = PasswordResetToken;
