"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const DailyContentLimitSchema = new mongoose_1.Schema({
    userID: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    timeStamp: { type: Date, required: true },
    images: {
        type: Number,
        default: 0,
    },
    videos: {
        type: Number,
        default: 0,
    },
    text: {
        type: Number,
        default: 0,
    },
    reviews: {
        type: Number,
        default: 0,
    }
}, {
    timestamps: true
});
DailyContentLimitSchema.set('toObject', { virtuals: true });
DailyContentLimitSchema.set('toJSON', { virtuals: true });
const DailyContentLimit = (0, mongoose_1.model)('DailyContentLimit', DailyContentLimitSchema);
exports.default = DailyContentLimit;
