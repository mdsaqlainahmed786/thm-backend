"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const BusinessSubTypeSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    businessTypeID: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "BusinessType"
    },
}, {
    timestamps: true
});
BusinessSubTypeSchema.set('toObject', { virtuals: true });
BusinessSubTypeSchema.set('toJSON', { virtuals: true });
const BusinessSubType = (0, mongoose_1.model)('BusinessSubType', BusinessSubTypeSchema);
exports.default = BusinessSubType;
