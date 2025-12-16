"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const LikeSchema = new mongoose_1.Schema({
    reachedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    businessProfileID: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "BusinessProfile"
    },
}, {
    timestamps: true
});
LikeSchema.set('toObject', { virtuals: true });
LikeSchema.set('toJSON', { virtuals: true });
const AccountReach = (0, mongoose_1.model)('AccountReach', LikeSchema);
exports.default = AccountReach;
