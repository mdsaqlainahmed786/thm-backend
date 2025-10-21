import { Schema, Model, model, Types, Document, ObjectId } from 'mongoose';
import { MongoID } from '../../common';

export enum QueueStatus {
    CREATED = 'created',
    PROCESSING = 'processing',
    COMPLETED = 'completed',
    ERROR = 'error'
}

interface FileQueue extends Document {
    filePath: string;
    s3Key: string;
    s3Location: string[];
    status: string;
    mediaID: MongoID;
    jobID: string;
}

const FileQueueSchema: Schema = new Schema<FileQueue>(
    {
        filePath: { type: String, required: false },
        status: { type: String, enum: QueueStatus, default: QueueStatus.CREATED, required: true },
        s3Key: { type: String, required: true },
        s3Location: [{ type: String }],
        jobID: { type: String },
        mediaID: {
            type: Schema.Types.ObjectId,
            ref: "Media"
        },
    },
    {
        timestamps: true
    }
);

export interface FileQueueModel extends Model<FileQueue> {
}


const FileQueue = model<FileQueue, FileQueueModel>("FileQueue", FileQueueSchema);
export default FileQueue;