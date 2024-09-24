import { Schema, Document, model, Types } from "mongoose";
import { MongoID } from "../../common";


interface IDailyContentLimit {
    userID: MongoID;
    images: number;
    videos: number;
    text: number;
    timeStamp: Date;
}
const DailyContentLimitSchema: Schema = new Schema<IDailyContentLimit>(
    {
        userID: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        timeStamp: { type: Date, required: true },
        images: {
            type: Number,
            default: 0,
        },
        videos: {
            type: Number,
            default: 0,
        },
        text: {
            type: Number,
            default: 0,
        }
    },
    {
        timestamps: true
    }
);
DailyContentLimitSchema.set('toObject', { virtuals: true });
DailyContentLimitSchema.set('toJSON', { virtuals: true });

export interface IDailyContentLimitModel extends IDailyContentLimit {
}

const DailyContentLimit = model<IDailyContentLimit>('DailyContentLimit', DailyContentLimitSchema);
export default DailyContentLimit;