"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const BusinessQuestionSchema = new mongoose_1.Schema({
    icon: { type: String, required: true },
    question: { type: String, required: true },
    name: { type: String, required: true },
    businessSubtypeID: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "BusinessSubType"
        }
    ],
    businessTypeID: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "BusinessType"
        },
    ],
    answer: [{ type: String }],
    order: { type: Number }
}, {
    timestamps: true
});
BusinessQuestionSchema.set('toObject', { virtuals: true });
BusinessQuestionSchema.set('toJSON', { virtuals: true });
const BusinessQuestion = (0, mongoose_1.model)('BusinessQuestion', BusinessQuestionSchema);
exports.default = BusinessQuestion;
