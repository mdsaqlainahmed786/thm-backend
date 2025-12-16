"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const PropertyPicturesSchema = new mongoose_1.Schema({
    userID: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    mediaID: { type: mongoose_1.Schema.Types.ObjectId, ref: "Media", required: true },
    businessProfileID: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "BusinessProfile"
    },
}, {
    timestamps: true
});
PropertyPicturesSchema.set('toObject', { virtuals: true });
PropertyPicturesSchema.set('toJSON', { virtuals: true });
const PropertyPictures = (0, mongoose_1.model)('PropertyPictures', PropertyPicturesSchema);
exports.default = PropertyPictures;
