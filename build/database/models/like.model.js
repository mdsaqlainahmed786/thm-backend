"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addLikesInPost = addLikesInPost;
exports.addUserInLike = addUserInLike;
const mongoose_1 = require("mongoose");
const user_model_1 = require("./user.model");
const LikeSchema = new mongoose_1.Schema({
    userID: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    postID: { type: mongoose_1.Schema.Types.ObjectId, ref: "Post" },
    commentID: { type: mongoose_1.Schema.Types.ObjectId, ref: "Comment" },
    storyID: { type: mongoose_1.Schema.Types.ObjectId, ref: "Story" },
    businessProfileID: { type: mongoose_1.Schema.Types.ObjectId, ref: "BusinessProfile", },
}, {
    timestamps: true
});
LikeSchema.set('toObject', { virtuals: true });
LikeSchema.set('toJSON', { virtuals: true });
const Like = (0, mongoose_1.model)('Like', LikeSchema);
exports.default = Like;
function addLikesInPost() {
    const lookup = {
        $lookup: {
            from: 'likes',
            let: { postID: '$_id' },
            pipeline: [
                { $match: { $expr: { $eq: ['$postID', '$$postID'] } } },
            ],
            as: 'likesRef'
        }
    };
    const addLikeCount = {
        $addFields: {
            likes: { $cond: { if: { $isArray: "$likesRef" }, then: { $size: "$likesRef" }, else: 0 } }
        }
    };
    return { lookup, addLikeCount };
}
function addUserInLike() {
    const lookup = {
        '$lookup': {
            'from': 'users',
            'let': { 'userID': '$userID' },
            'pipeline': [
                { '$match': { '$expr': { '$eq': ['$_id', '$$userID'] } } },
                (0, user_model_1.addBusinessProfileInUser)().lookup,
                (0, user_model_1.addBusinessProfileInUser)().unwindLookup,
                (0, user_model_1.profileBasicProject)()
            ],
            'as': 'likedByRef'
        }
    };
    const unwindLookup = {
        '$unwind': {
            'path': '$likedByRef',
            'preserveNullAndEmptyArrays': true //false value does not fetch relationship.
        }
    };
    const replaceRoot = {
        "$replaceRoot": {
            "newRoot": {
                "$mergeObjects": ["$likedByRef"]
            }
        }
    };
    return { lookup, unwindLookup, replaceRoot };
}
