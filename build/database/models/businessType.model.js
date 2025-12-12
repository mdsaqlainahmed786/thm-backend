"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const BusinessTypeSchema = new mongoose_1.Schema({
    icon: { type: String, required: true },
    name: { type: String, required: true },
}, {
    timestamps: true
});
BusinessTypeSchema.set('toObject', { virtuals: true });
BusinessTypeSchema.set('toJSON', { virtuals: true });
const BusinessType = (0, mongoose_1.model)('BusinessType', BusinessTypeSchema);
exports.default = BusinessType;
