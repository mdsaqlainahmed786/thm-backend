import { Document, Model, Schema, model, Types } from "mongoose";
import { MongoID } from "../../common";

interface ILike extends Document {
    userID: MongoID;
    postID: MongoID;
    businessProfileID?: MongoID;
    commentID: MongoID;
}
const LikeSchema: Schema = new Schema<ILike>(
    {
        userID: { type: Schema.Types.ObjectId, ref: "User", required: true },
        postID: { type: Schema.Types.ObjectId, ref: "Post" },
        commentID: { type: Schema.Types.ObjectId, ref: "Comment" },
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