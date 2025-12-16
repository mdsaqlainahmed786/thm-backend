"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const BusinessAnswerSchema = new mongoose_1.Schema({
    businessProfileID: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "BusinessProfile"
    },
    questionID: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "BusinessQuestion"
    },
    answer: { type: String },
}, {
    timestamps: true
});
BusinessAnswerSchema.set('toObject', { virtuals: true });
BusinessAnswerSchema.set('toJSON', { virtuals: true });
const BusinessAnswer = (0, mongoose_1.model)('BusinessAnswer', BusinessAnswerSchema);
exports.default = BusinessAnswer;
