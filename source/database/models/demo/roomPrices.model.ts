import { Document, Model, Schema, model, Types } from "mongoose";
import { MongoID } from "../../../common";

interface IRoomPrices extends Document {
    roomID: MongoID;
    pricePresetID: MongoID;
    date: string,
    pricePerNight: number,
    pricePercentage: number,
    weekendPricePercentage: number,
    days: number,
    appliedPrice: number;
    isWeekend: boolean;
    isActive: boolean;
}
const LikeSchema: Schema = new Schema<IRoomPrices>(
    {
        roomID: { type: Schema.Types.ObjectId, ref: "Room", required: true },
        pricePresetID: { type: Schema.Types.ObjectId, ref: "PricePreset", required: true },
        date: {
            type: String,
        },
        pricePerNight: {
            type: Number
        },
        pricePercentage: {
            type: Number
        },
        weekendPricePercentage: {
            type: Number
        },
        days: {
            type: Number
        },
        appliedPrice: {
            type: Number
        },
        isWeekend: {
            type: Boolean,
            default: false
        },
        isActive: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);
LikeSchema.set('toObject', { virtuals: true });
LikeSchema.set('toJSON', { virtuals: true });

export interface IRoomPricesModel extends Model<IRoomPrices> {
}

const RoomPrices = model<IRoomPrices, IRoomPricesModel>('RoomPrices', LikeSchema);
export default RoomPrices;
