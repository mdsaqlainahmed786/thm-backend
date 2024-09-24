import { Schema, Document, model, Types } from "mongoose";

export interface IS3Object {
    key: string,
    location: string;
    delete: boolean;
    fieldname: string,
    originalname: string,
    encoding: string,
    mimetype: string,
}

const S3ObjectSchema: Schema = new Schema<IS3Object>(
    {
        key: { type: String },
        location: { type: String },
        delete: { type: Boolean },
        fieldname: { type: String },
        originalname: { type: String },
        encoding: { type: String },
        mimetype: { type: String },
    },
    {
        timestamps: true
    }
);
S3ObjectSchema.set('toObject', { virtuals: true });
S3ObjectSchema.set('toJSON', { virtuals: true });

export interface IS3ObjectModel extends IS3Object {
}

const S3Object = model<IS3Object>('S3Object', S3ObjectSchema);
export default S3Object;