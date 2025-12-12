"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const SharedContentSchema = new mongoose_1.Schema({
    userID: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    contentID: { type: mongoose_1.Schema.Types.ObjectId, required: true },
    businessProfileID: { type: mongoose_1.Schema.Types.ObjectId, ref: "BusinessProfile", },
    contentType: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});
SharedContentSchema.set('toObject', { virtuals: true });
SharedContentSchema.set('toJSON', { virtuals: true });
const SharedContent = (0, mongoose_1.model)('SharedContent', SharedContentSchema);
exports.default = SharedContent;
