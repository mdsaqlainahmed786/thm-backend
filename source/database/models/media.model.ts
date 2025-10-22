import { Document, Model, Schema, model, Types } from "mongoose";
import { MongoID } from "../../common";
export enum MediaType {
    IMAGE = 'image',
    VIDEO = 'video',
    PDF = 'pdf'
}
export enum Size {
    THUMBNAIL = "thumbnail",
    MEDIUM = "medium",
}

export interface BaseMedia {
    fileName: string,
    width: number,
    height: number,
    fileSize: number,
    mimeType: string;
    sourceUrl: string;
    thumbnailUrl: string,
    s3Key: string;
}

export interface Video extends BaseMedia {
    duration: number;
    videoUrl: string;
}

interface IMedia extends Document, Video {
    businessProfileID?: MongoID;
    userID: MongoID;
    mediaType: string,
}
const MediaSchema: Schema = new Schema<IMedia>(
    {
        businessProfileID: { type: Schema.Types.ObjectId, ref: "BusinessProfile", },
        userID: { type: Schema.Types.ObjectId, ref: "User", required: true },
        fileName: { type: String, required: true },
        width: { type: Number, required: true },
        height: { type: Number, required: true },
        fileSize: { type: Number, required: true },
        mediaType: { type: String, required: true, enum: MediaType },
        mimeType: { type: String, required: true },
        sourceUrl: { type: String, required: true },
        videoUrl: { type: String },
        thumbnailUrl: { type: String, required: false },
        s3Key: { type: String, required: false },
        duration: { type: Number },
    },
    {
        timestamps: true
    }
);
MediaSchema.set('toObject', { virtuals: true });
MediaSchema.set('toJSON', { virtuals: true });


export interface IMediaModel extends Model<IMedia> {
}


const Media = model<IMedia, IMediaModel>('Media', MediaSchema);
export default Media;