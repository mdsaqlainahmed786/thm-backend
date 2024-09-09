import { Schema, Model, model, Types, Document } from 'mongoose';
interface IBusinessDocument extends Document {
    addressProof: string;
    businessRegistration: string;
    businessProfileID: Types.ObjectId | string;
}

const AuthTokenSchema: Schema = new Schema<IBusinessDocument>(
    {
        addressProof: { type: String, required: true },
        businessRegistration: { type: String, required: true },
        businessProfileID: {
            type: Schema.Types.ObjectId,
            ref: "BusinessProfile"
        },
    },
    {
        timestamps: true
    });

export interface IBusinessDocumentModel extends Model<IBusinessDocument> {
}

const BusinessDocument = model<IBusinessDocument, IBusinessDocumentModel>("BusinessDocument", AuthTokenSchema);
export default BusinessDocument;


