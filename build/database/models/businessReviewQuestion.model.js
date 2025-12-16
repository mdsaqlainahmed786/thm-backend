"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const BusinessReviewQuestionSchema = new mongoose_1.Schema({
    question: { type: String, required: true },
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
    order: { type: Number }
}, {
    timestamps: true
});
BusinessReviewQuestionSchema.set('toObject', { virtuals: true });
BusinessReviewQuestionSchema.set('toJSON', { virtuals: true });
const BusinessReviewQuestion = (0, mongoose_1.model)('BusinessReviewQuestion', BusinessReviewQuestionSchema);
exports.default = BusinessReviewQuestion;
