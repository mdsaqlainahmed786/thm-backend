import { Document, Model, Schema, model } from "mongoose";
import { MongoID } from "../../common";

interface IRoomImage extends Document {
    sourceUrl: string;
    thumbnailUrl: string;
    roomID: MongoID;
    isCoverImage: boolean;
}
const RoomImageSchema: Schema = new Schema<IRoomImage>(
    {
        roomID: { type: Schema.Types.ObjectId, ref: "Room", required: true },
        sourceUrl: { type: String },
        thumbnailUrl: { type: String },
        isCoverImage: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true
    }
);
RoomImageSchema.set('toObject', { virtuals: true });
RoomImageSchema.set('toJSON', { virtuals: true });

export interface IRoomImageModel extends Model<IRoomImage> {
}

const RoomImage = model<IRoomImage, IRoomImageModel>('RoomImage', RoomImageSchema);
export default RoomImage;
