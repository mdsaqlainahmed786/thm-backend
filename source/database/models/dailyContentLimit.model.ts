import { Schema, Document, model, Types } from "mongoose";



interface IDailyContentLimit {
    userID: Types.ObjectId | string;
    photos: number;
    videos: number;
    text: number;
}
const DailyContentLimitSchema: Schema = new Schema<IDailyContentLimit>(
    {
        userID: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        photos: {

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