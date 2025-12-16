"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const RoomImageSchema = new mongoose_1.Schema({
    roomID: { type: mongoose_1.Schema.Types.ObjectId, ref: "Room", required: true },
    sourceUrl: { type: String },
    thumbnailUrl: { type: String },
    isCoverImage: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true
});
RoomImageSchema.set('toObject', { virtuals: true });
RoomImageSchema.set('toJSON', { virtuals: true });
const RoomImage = (0, mongoose_1.model)('RoomImage', RoomImageSchema);
exports.default = RoomImage;
