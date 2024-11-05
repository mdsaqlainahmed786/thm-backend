import { Schema, Model, model, Types, Document, ObjectId } from 'mongoose';

export enum QuestionType {
    GENERAL = "general",
    ACCOUNT = "account",
    PRIVACY = "privacy",
    CONTENT = "content"
}

interface IFAQ extends Document {
    question: string;
    answer: string;
    isPublished: boolean;
    type: string;
}

const FAQSchema: Schema = new Schema<IFAQ>(
    {
        question: { type: String, required: true },
        answer: { type: String },
        isPublished: { type: Boolean, default: false },
        type: {
            type: String,
            enum: QuestionType,
            default: QuestionType.GENERAL
        }
    },
    {
        timestamps: true
    }
);

export interface IFAQModel extends Model<IFAQ> {
}


const FAQ = model<IFAQ, IFAQModel>("FAQ", FAQSchema);
export default FAQ;