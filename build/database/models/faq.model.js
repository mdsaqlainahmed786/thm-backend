"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionType = void 0;
const mongoose_1 = require("mongoose");
var QuestionType;
(function (QuestionType) {
    QuestionType["GENERAL"] = "general";
    QuestionType["ACCOUNT"] = "account";
    QuestionType["PRIVACY"] = "privacy";
    QuestionType["CONTENT"] = "content";
})(QuestionType || (exports.QuestionType = QuestionType = {}));
const FAQSchema = new mongoose_1.Schema({
    question: { type: String, required: true },
    answer: { type: String },
    isPublished: { type: Boolean, default: false },
    type: {
        type: String,
        enum: QuestionType,
        default: QuestionType.GENERAL
    }
}, {
    timestamps: true
});
const FAQ = (0, mongoose_1.model)("FAQ", FAQSchema);
exports.default = FAQ;
