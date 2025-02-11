import { Document, Model, Schema, model, Types } from "mongoose";
import { MongoID } from "../../common";
enum RoomType {
    'SINGLE' = 'single',
    'DOUBLE' = 'double',
    'SUITE' = 'suite',
    'FAMILY' = 'family'
}
enum BedType {
    'KING' = 'king',
    'QUEEN' = 'queen',
    'SINGLE' = 'single',
    'DOUBLE' = 'double'
}
// List of amenities provided in the room
// ['Wi-Fi', 'Air Conditioning', 'TV', 'Minibar', 'Pool Access', 'Gym', 'Breakfast'];

interface IRoom extends Document {
    businessProfileID: MongoID;
    roomNumber?: string;//Hotel room number;
    description: string;
    roomImages: string[];
    bedType: string;
    maxOccupancy: number; // Maximum number of people allowed in the room
    availability: boolean;// Room availability (true means available)
    pricePerNight: number;
    amenities: string[];
    roomType: RoomType;
}
const RoomSchema: Schema = new Schema<IRoom>(
    {
        businessProfileID: { type: Schema.Types.ObjectId, ref: "BusinessProfile", required: true },
        roomNumber: { type: String },
        description: { type: String },
        roomImages: [{ types: String }],
        bedType: {
            type: String,
            enum: BedType,
            default: BedType.SINGLE
        },
        maxOccupancy: {
            type: Number,
            default: 4
        },
        availability: {
            type: Boolean,
            default: true,
        },
        pricePerNight: {
            type: Number,
            required: true
        },
        amenities: [{
            type: String,

        }],
        roomType: {
            type: String,
            default: RoomType.SINGLE
        }
    },
    {
        timestamps: true
    }
);
RoomSchema.set('toObject', { virtuals: true });
RoomSchema.set('toJSON', { virtuals: true });

export interface IRoomModel extends Model<IRoom> {
}

const Room = model<IRoom, IRoomModel>('Room', RoomSchema);
export default Room;
