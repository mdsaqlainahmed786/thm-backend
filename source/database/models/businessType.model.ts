import { Schema, Document, model } from "mongoose";

export interface IBusinessType extends Document {
    icon: string;
    name: string;
}
const BusinessTypeSchema: Schema = new Schema<IBusinessType>(
    {
        icon: { type: String, required: true },
        name: { type: String, required: true },
    },
    {
        timestamps: true
    }
);
BusinessTypeSchema.set('toObject', { virtuals: true });
BusinessTypeSchema.set('toJSON', { virtuals: true });

export interface IBusinessTypeModel extends IBusinessType {
}

const BusinessType = model<IBusinessType>('BusinessType', BusinessTypeSchema);
export default BusinessType;