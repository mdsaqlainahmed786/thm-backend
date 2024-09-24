import { Schema, Model, model, Types, Document } from 'mongoose';
import { MongoID } from '../../common';
interface IBusinessDocument extends Document {
    addressProof: string;
    businessRegistration: string;
    businessProfileID: MongoID;
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


