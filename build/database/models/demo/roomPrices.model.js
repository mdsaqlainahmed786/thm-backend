"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const LikeSchema = new mongoose_1.Schema({
    roomID: { type: mongoose_1.Schema.Types.ObjectId, ref: "Room", required: true },
    pricePresetID: { type: mongoose_1.Schema.Types.ObjectId, ref: "PricePreset", required: true },
    date: {
        type: String,
    },
    pricePerNight: {
        type: Number
    },
    pricePercentage: {
        type: Number
    },
    weekendPricePercentage: {
        type: Number
    },
    days: {
        type: Number
    },
    appliedPrice: {
        type: Number
    },
    isWeekend: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});
LikeSchema.set('toObject', { virtuals: true });
LikeSchema.set('toJSON', { virtuals: true });
const RoomPrices = (0, mongoose_1.model)('RoomPrices', LikeSchema);
exports.default = RoomPrices;
