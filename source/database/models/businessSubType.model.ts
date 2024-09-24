import { Schema, Document, model, Types } from "mongoose";
import { MongoID } from "../../common";
export interface IBusinessSubType extends Document {
    name: string;
    businessTypeID: MongoID;
}
const BusinessSubTypeSchema: Schema = new Schema<IBusinessSubType>(
    {
        name: { type: String, required: true },
        businessTypeID: {
            type: Schema.Types.ObjectId,
            ref: "BusinessType"
        },
    },
    {
        timestamps: true
    }
);
BusinessSubTypeSchema.set('toObject', { virtuals: true });
BusinessSubTypeSchema.set('toJSON', { virtuals: true });

export interface IBusinessSubTypeModel extends IBusinessSubType {
}

const BusinessSubType = model<IBusinessSubType>('BusinessSubType', BusinessSubTypeSchema);
export default BusinessSubType;