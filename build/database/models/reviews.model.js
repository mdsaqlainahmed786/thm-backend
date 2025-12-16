"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewQuestionSchema = exports.PostType = void 0;
const mongoose_1 = require("mongoose");
const common_model_1 = require("./common.model");
///FIXME Remove me
var PostType;
(function (PostType) {
    PostType["POST"] = "post";
    PostType["REVIEW"] = "review";
    PostType["EVENT"] = "event";
})(PostType || (exports.PostType = PostType = {}));
var MediaType;
(function (MediaType) {
    MediaType["IMAGE"] = "image";
    MediaType["VIDEO"] = "video";
    // CAROUSEL = "carousel",
})(MediaType || (MediaType = {}));
exports.ReviewQuestionSchema = new mongoose_1.Schema({
    questionID: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User"
    },
    rating: { type: Number, default: 0 },
}, {
    _id: false,
});
const ReviewSchema = new mongoose_1.Schema({
    userID: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User"
    },
    businessProfileID: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "BusinessProfile"
    },
    name: { type: String, },
    email: { type: String, lowercase: true, match: [/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/, "email is invalid."], },
    reviewedBusinessProfileID: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "BusinessProfile"
    },
    postID: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Post"
    },
    businessName: { type: String, },
    address: common_model_1.AddressSchema,
    placeID: {
        type: String,
    },
    content: {
        type: String,
    },
    isPublished: {
        type: Boolean,
        default: false
    },
    media: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "Media"
        }],
    rating: {
        type: Number,
    },
    reviews: [exports.ReviewQuestionSchema]
}, {
    timestamps: true
});
ReviewSchema.set('toObject', { virtuals: true });
ReviewSchema.set('toJSON', { virtuals: true });
const Review = (0, mongoose_1.model)('Review', ReviewSchema);
exports.default = Review;
