


import { Schema, Document, model, Types } from "mongoose";
import { MongoID } from "../../common";
export interface IBusinessReviewQuestion extends Document {
    icon: string;
    name: string;
    question: string;
    businessTypeID: MongoID[];
    businessSubtypeID: MongoID[];
    answer: string[];
    order: number;
}
const BusinessReviewQuestionSchema: Schema = new Schema<IBusinessReviewQuestion>(
    {
        question: { type: String, required: true },
        businessSubtypeID: [
            {
                type: Schema.Types.ObjectId,
                ref: "BusinessSubType"
            }
        ],
        businessTypeID: [
            {
                type: Schema.Types.ObjectId,
                ref: "BusinessType"
            },
        ],
        order: { type: Number }
    },
    {
        timestamps: true
    }
);
BusinessReviewQuestionSchema.set('toObject', { virtuals: true });
BusinessReviewQuestionSchema.set('toJSON', { virtuals: true });

export interface IBusinessReviewQuestionModel extends IBusinessReviewQuestion {
}

const BusinessReviewQuestion = model<IBusinessReviewQuestion>('BusinessReviewQuestion', BusinessReviewQuestionSchema);
export default BusinessReviewQuestion;