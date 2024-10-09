import { Document, Model, Schema, model, Types } from "mongoose";
import { MongoID } from "../../common";
import { addBusinessProfileInUser } from "./user.model";

interface ILike extends Document {
    userID: MongoID;
    postID: MongoID;
    businessProfileID?: MongoID;
    commentID: MongoID;
    storyID: MongoID;
}
const LikeSchema: Schema = new Schema<ILike>(
    {
        userID: { type: Schema.Types.ObjectId, ref: "User", required: true },
        postID: { type: Schema.Types.ObjectId, ref: "Post" },
        commentID: { type: Schema.Types.ObjectId, ref: "Comment" },
        storyID: { type: Schema.Types.ObjectId, ref: "Story" },
        businessProfileID: { type: Schema.Types.ObjectId, ref: "BusinessProfile", },
    },
    {
        timestamps: true
    }
);
LikeSchema.set('toObject', { virtuals: true });
LikeSchema.set('toJSON', { virtuals: true });

export interface ILikeModel extends Model<ILike> {
}

const Like = model<ILike, ILikeModel>('Like', LikeSchema);
export default Like;


export function addLikesInPost() {
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
    return { lookup, addLikeCount }
}
export function addUserInLike() {
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
                        "username": 1,
                        "accountType": 1,
                        'profilePic': 1,
                        'businessProfileRef._id': 1,
                        'businessProfileRef.profilePic': 1,
                        'businessProfileRef.username': 1,
                        'businessProfileRef.name': 1,
                    }
                }
            ],
            'as': 'likedByRef'
        }
    };
    const unwindLookup = {
        '$unwind': {
            'path': '$likedByRef',
            'preserveNullAndEmptyArrays': true//false value does not fetch relationship.
        }
    }
    const replaceRoot = {
        "$replaceRoot": {
            "newRoot": {
                "$mergeObjects": ["$likedByRef"]
            }
        }
    }
    return { lookup, unwindLookup, replaceRoot }
}