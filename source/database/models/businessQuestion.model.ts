import { Schema, Document, model, Types } from "mongoose";

export interface IBusinessQuestion extends Document {
    icon: string;
    name: string;
    question: string;
    businessTypeID: (Types.ObjectId | string)[];
    businessSubtypeID: (Types.ObjectId | string)[];
}
const BusinessQuestionSchema: Schema = new Schema<IBusinessQuestion>(
    {
        icon: { type: String, required: true },
        question: { type: String, required: true },
        name: { type: String, required: true },
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
        ]
    },
    {
        timestamps: true
    }
);
BusinessQuestionSchema.set('toObject', { virtuals: true });
BusinessQuestionSchema.set('toJSON', { virtuals: true });

export interface IBusinessQuestionModel extends IBusinessQuestion {
}

const BusinessQuestion = model<IBusinessQuestion>('BusinessQuestion', BusinessQuestionSchema);
export default BusinessQuestion;