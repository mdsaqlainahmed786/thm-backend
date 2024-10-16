import { Schema, Model, model, Types, Document } from 'mongoose';
import { MongoID } from '../../common';
export enum ContentType {
    POST = "post",
    ANONYMOUS = "anonymous"
}
interface IReport extends Document {
    reportedBy: MongoID;
    contentID: MongoID;
    contentType: ContentType;
    reason: string;
}

const ReportSchema: Schema = new Schema<IReport>(
    {
        reportedBy: { type: Schema.Types.ObjectId, Ref: "User" },
        contentID: { type: Schema.Types.ObjectId, },
        contentType: {
            type: String,
            enum: ContentType,
            default: ContentType.ANONYMOUS
        },
        reason: { type: String },
    },
    {
        timestamps: true
    });

export interface IReportModel extends Model<IReport> {
}

const Report = model<IReport, IReportModel>("Report", ReportSchema);
export default Report;