import { Schema, Document, model, Types } from "mongoose";
import { MongoID } from "../../common";
export interface IBusinessAnswer extends Document {
    businessProfileID: MongoID[];
    questionID: MongoID[];
    answer: string;
}
const BusinessAnswerSchema: Schema = new Schema<IBusinessAnswer>(
    {
        businessProfileID: {
            type: Schema.Types.ObjectId,
            ref: "BusinessProfile"
        },
        questionID:
        {
            type: Schema.Types.ObjectId,
            ref: "BusinessQuestion"
        },
        answer: { type: String },

    },
    {
        timestamps: true
    }
);
BusinessAnswerSchema.set('toObject', { virtuals: true });
BusinessAnswerSchema.set('toJSON', { virtuals: true });

export interface IBusinessAnswerModel extends IBusinessAnswer {
}

const BusinessAnswer = model<IBusinessAnswer>('BusinessAnswer', BusinessAnswerSchema);
export default BusinessAnswer;