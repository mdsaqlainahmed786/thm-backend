import { Schema, Document, model, Types } from "mongoose";
import { ILocation, LocationSchema } from "./common.model";
import { addLikesInPost } from "./like.model";
import { addCommentsInPost, addSharedCountInPost } from "./comment.model";
import { MongoID } from "../../common";
export enum PostType {
    POST = "post",
    REVIEW = "review",
    EVENT = "event"
}
enum MediaType {
    IMAGE = "image",
    VIDEO = "video",
    // CAROUSEL = "carousel",
}

export interface ReviewQuestion {
    questionID: MongoID;
    rating: number;
}
export const ReviewQuestionSchema = new Schema<ReviewQuestion>(
    {
        questionID: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        rating: { type: Number, default: 0 },
    },
    {
        _id: false,
    }
);




interface IReview extends Document {
    postID: { type: Schema.Types.ObjectId, ref: "Post" },
    userID?: MongoID;
    businessProfileID?: MongoID;
    reviewedBusinessProfileID?: MongoID;//used as a review id
    content: string;
    isPublished: boolean;
    media: MongoID[];
    rating: number;
    // placeID: string;//used to map google business account or rating purpose
    reviews: ReviewQuestion[];
    createdAt: Date;
    updatedAt: Date;




    // name: { type: String },
    // placeID: { type: String },
    // address: AddressSchema,

}

const ReviewSchema: Schema = new Schema<IReview>(
    {
        userID: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        businessProfileID: {
            type: Schema.Types.ObjectId,
            ref: "BusinessProfile"
        },
        reviewedBusinessProfileID: {
            type: Schema.Types.ObjectId,
            ref: "BusinessProfile"
        },
        content: {
            type: String,
        },
        isPublished: {
            type: Boolean,
            default: false
        },
        media: [{
            type: Schema.Types.ObjectId,
            ref: "Media"
        }],
        rating: {
            type: Number,
        },
        // placeID: {
        //     type: String,
        // },
        reviews: [ReviewQuestionSchema]
    },
    {
        timestamps: true
    }
);
ReviewSchema.set('toObject', { virtuals: true });
ReviewSchema.set('toJSON', { virtuals: true });

export interface IReviewModel extends IReview {
}

const Review = model<IReviewModel>('Review', ReviewSchema);
export default Review;
