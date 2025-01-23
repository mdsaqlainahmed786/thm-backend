import { Schema, Document, model, Types } from "mongoose";
import { AddressSchema, ILocation, LocationSchema } from "./common.model";
import { addLikesInPost } from "./like.model";
import { addCommentsInPost, addSharedCountInPost } from "./comment.model";
import { MongoID } from "../../common";
import { Address } from "./common.model";

///FIXME Remove me
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

interface Customer {
    userID?: MongoID;
    businessProfileID?: MongoID;
    name: string;
    email: string;
}
interface Business {
    reviewedBusinessProfileID?: MongoID;//used as a review id
    businessName: string
    placeID: string;//used to map google business account or rating purpose
    address: Address,
}


interface IReview extends Customer, Business, Document {
    postID: { type: Schema.Types.ObjectId, ref: "Post" },
    content: string;
    isPublished: boolean;
    media: MongoID[];
    rating: number;
    reviews: ReviewQuestion[];
    createdAt: Date;
    updatedAt: Date;
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
        name: { type: String, },
        email: { type: String, lowercase: true, match: [/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/, "email is invalid."], },
        reviewedBusinessProfileID: {
            type: Schema.Types.ObjectId,
            ref: "BusinessProfile"
        },
        postID: {
            type: Schema.Types.ObjectId,
            ref: "Post"
        },
        businessName: { type: String, },
        address: AddressSchema,
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
            type: Schema.Types.ObjectId,
            ref: "Media"
        }],
        rating: {
            type: Number,
        },
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
