import { Document, Model, Schema, model, Types } from "mongoose";
import { MongoID } from "../../common";
export enum MediaType {
    IMAGE = 'image',
    VIDEO = 'video'
}
export enum Size {
    THUMBNAIL = "thumbnail",
    MEDIUM = "medium",
}
export interface MediaFile {
    fileName: string,
    width: number,
    height: number,
    fileSize: number,
    mimeType: string;
    sourceUrl: string;
    s3Key: string;
}

export interface ThumbnailMediaFile extends MediaFile {
    size: Size,
}

interface IMedia extends Document, MediaFile {
    userID: MongoID;
    mediaType: string,
    sizes?: ThumbnailMediaFile[],
    isHighlighted: boolean,
    isProfilePic: boolean,
    s3Key: string;
}
const MediaSizeSchema: Schema = new Schema<ThumbnailMediaFile>(
    {
        fileName: { type: String, required: true },
        width: { type: Number, required: true },
        height: { type: Number, required: true },
        fileSize: { type: Number, required: true },
        mimeType: { type: String, required: true },
        sourceUrl: { type: String, required: true },
        s3Key: { type: String, required: false },
        size: { type: String, enum: Size }
    },
    {
        _id: false
    }
);

const MediaSchema: Schema = new Schema<IMedia>(
    {
        userID: { type: Schema.Types.ObjectId, ref: "User", required: true },
        fileName: { type: String, required: true },
        width: { type: Number, required: true },
        height: { type: Number, required: true },
        fileSize: { type: Number, required: true },
        mediaType: { type: String, required: true, enum: MediaType },
        mimeType: { type: String, required: true },
        sourceUrl: { type: String, required: true },
        s3Key: { type: String, required: false },
        // isHighlighted: { type: Boolean, default: false },
        // isProfilePic: { type: Boolean, default: false },
        // sizes: [MediaSizeSchema],
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