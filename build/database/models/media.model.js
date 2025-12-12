"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Size = exports.MediaType = void 0;
const mongoose_1 = require("mongoose");
var MediaType;
(function (MediaType) {
    MediaType["IMAGE"] = "image";
    MediaType["VIDEO"] = "video";
    MediaType["PDF"] = "pdf";
})(MediaType || (exports.MediaType = MediaType = {}));
var Size;
(function (Size) {
    Size["THUMBNAIL"] = "thumbnail";
    Size["MEDIUM"] = "medium";
})(Size || (exports.Size = Size = {}));
const MediaSchema = new mongoose_1.Schema({
    businessProfileID: { type: mongoose_1.Schema.Types.ObjectId, ref: "BusinessProfile", },
    userID: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    fileName: { type: String, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    fileSize: { type: Number, required: true },
    mediaType: { type: String, required: true, enum: MediaType },
    mimeType: { type: String, required: true },
    sourceUrl: { type: String, required: true },
    videoUrl: { type: String },
    thumbnailUrl: { type: String, required: true },
    s3Key: { type: String, required: false },
    duration: { type: Number },
}, {
    timestamps: true
});
MediaSchema.set('toObject', { virtuals: true });
MediaSchema.set('toJSON', { virtuals: true });
const Media = (0, mongoose_1.model)('Media', MediaSchema);
exports.default = Media;
