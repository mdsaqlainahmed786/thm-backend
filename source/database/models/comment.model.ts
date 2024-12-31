import { Document, Model, Schema, model, Types } from "mongoose";
import { ContentType, MongoID } from "../../common";

interface IComment extends Document {
    userID: MongoID;
    postID: MongoID;
    businessProfileID?: MongoID;
    message: string,
    isParent: boolean,
    parentID: MongoID,
}
const CommentSchema: Schema = new Schema<IComment>(
    {
        userID: { type: Schema.Types.ObjectId, ref: "User", required: true },
        postID: { type: Schema.Types.ObjectId, ref: "Post", required: true },
        businessProfileID: { type: Schema.Types.ObjectId, ref: "BusinessProfile", },
        message: { type: String, required: true },
        isParent: { type: Boolean, default: true },
        parentID: { type: Schema.Types.ObjectId, ref: "Comment", },
    },
    {
        timestamps: true
    }
);
CommentSchema.set('toObject', { virtuals: true });
CommentSchema.set('toJSON', { virtuals: true });

export interface ICommentModel extends Model<IComment> {
}

const Comment = model<IComment, ICommentModel>('Comment', CommentSchema);
export default Comment;


export function addCommentsInPost() {
    const lookup = {
        $lookup: {
            from: 'comments',
            let: { postID: '$_id' },
            pipeline: [
                { $match: { $expr: { $eq: ['$postID', '$$postID'] } } },

            ],
            as: 'commentsRef'
        }
    };
    const addCommentCount = {
        $addFields: {
            comments: { $cond: { if: { $isArray: "$commentsRef" }, then: { $size: "$commentsRef" }, else: 0 } }
        }
    };
    return { lookup, addCommentCount }
}
export function addSharedCountInPost() {
    const lookup = {
        $lookup: {
            from: 'sharedcontents',
            let: { contentID: '$_id' },
            pipeline: [
                { $match: { $expr: { $eq: ['$contentID', '$$contentID'] }, contentType: ContentType.POST } },
            ],
            as: 'sharedRef'
        }
    };
    const addSharedCount = {
        $addFields: {
            shared: { $cond: { if: { $isArray: "$sharedRef" }, then: { $size: "$sharedRef" }, else: 0 } }
        }
    };
    return { lookup, addSharedCount }
}

import { addBusinessProfileInUser } from "./user.model";
/**
 *
 * @returns 
 * Return commented by user lookup 
 */
export function addCommentedByInPost() {
    const lookup = {
        '$lookup': {
            'from': 'users',
            'let': { 'userID': '$userID' },
            'pipeline': [
                { '$match': { '$expr': { '$eq': ['$_id', '$$userID'] } } },
                addBusinessProfileInUser().lookup,
                addBusinessProfileInUser().unwindLookup,
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
            'preserveNullAndEmptyArrays': true//false value does not fetch relationship.
        }
    }
    return { lookup, unwindLookup }
}


export function addLikesInComment() {
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
    return { lookup, addLikeCount }
}