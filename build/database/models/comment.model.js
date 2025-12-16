"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addCommentsInPost = addCommentsInPost;
exports.addSharedCountInPost = addSharedCountInPost;
exports.addCommentedByInPost = addCommentedByInPost;
exports.addLikesInComment = addLikesInComment;
const mongoose_1 = require("mongoose");
const common_1 = require("../../common");
const CommentSchema = new mongoose_1.Schema({
    userID: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    postID: { type: mongoose_1.Schema.Types.ObjectId, ref: "Post", required: true },
    businessProfileID: { type: mongoose_1.Schema.Types.ObjectId, ref: "BusinessProfile", },
    message: { type: String, required: true },
    isParent: { type: Boolean, default: true },
    parentID: { type: mongoose_1.Schema.Types.ObjectId, ref: "Comment", },
    isPublished: { type: Boolean, default: true },
}, {
    timestamps: true
});
CommentSchema.set('toObject', { virtuals: true });
CommentSchema.set('toJSON', { virtuals: true });
const Comment = (0, mongoose_1.model)('Comment', CommentSchema);
exports.default = Comment;
function addCommentsInPost() {
    const lookup = {
        $lookup: {
            from: 'comments',
            let: { postID: '$_id' },
            pipeline: [
                { $match: { $expr: { $eq: ['$postID', '$$postID'] }, isPublished: true } },
            ],
            as: 'commentsRef'
        }
    };
    const addCommentCount = {
        $addFields: {
            comments: { $cond: { if: { $isArray: "$commentsRef" }, then: { $size: "$commentsRef" }, else: 0 } }
        }
    };
    return { lookup, addCommentCount };
}
function addSharedCountInPost() {
    const lookup = {
        $lookup: {
            from: 'sharedcontents',
            let: { contentID: '$_id' },
            pipeline: [
                { $match: { $expr: { $eq: ['$contentID', '$$contentID'] }, contentType: common_1.ContentType.POST } },
            ],
            as: 'sharedRef'
        }
    };
    const addSharedCount = {
        $addFields: {
            shared: { $cond: { if: { $isArray: "$sharedRef" }, then: { $size: "$sharedRef" }, else: 0 } }
        }
    };
    return { lookup, addSharedCount };
}
const user_model_1 = require("./user.model");
/**
 *
 * @returns
 * Return commented by user lookup
 */
function addCommentedByInPost() {
    const lookup = {
        '$lookup': {
            'from': 'users',
            'let': { 'userID': '$userID' },
            'pipeline': [
                { '$match': { '$expr': { '$eq': ['$_id', '$$userID'] } } },
                (0, user_model_1.addBusinessProfileInUser)().lookup,
                (0, user_model_1.addBusinessProfileInUser)().unwindLookup,
                {
                    '$project': {
                        "name": 1,
                        "profilePic": 1,
                        "accountType": 1,
                        "businessProfileID": 1,
                        "businessProfileRef._id": 1,
                        "businessProfileRef.name": 1,
                        "businessProfileRef.profilePic": 1,
                        "businessProfileRef.businessTypeRef": 1,
                    }
                }
            ],
            'as': 'commentedBy'
        }
    };
    const unwindLookup = {
        '$unwind': {
            'path': '$commentedBy',
            'preserveNullAndEmptyArrays': true //false value does not fetch relationship.
        }
    };
    return { lookup, unwindLookup };
}
function addLikesInComment() {
    const lookup = {
        $lookup: {
            from: 'likes',
            let: { commentID: '$_id' },
            pipeline: [
                { $match: { $expr: { $eq: ['$commentID', '$$commentID'] } } },
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
