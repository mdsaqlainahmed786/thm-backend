"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const WebsiteRedirectionSchema = new mongoose_1.Schema({
    userID: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    businessProfileID: { type: mongoose_1.Schema.Types.ObjectId, ref: "BusinessProfile" },
}, {
    timestamps: true
});
WebsiteRedirectionSchema.set('toObject', { virtuals: true });
WebsiteRedirectionSchema.set('toJSON', { virtuals: true });
const WebsiteRedirection = (0, mongoose_1.model)("WebsiteRedirection", WebsiteRedirectionSchema);
exports.default = WebsiteRedirection;
