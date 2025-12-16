import { Document, Model, Schema, model, Types } from "mongoose";
import { MongoID, CurrencyCode, RoomType, BedType, MealPlan } from "../../common";

// List of amenities provided in the room
// ['Wi-Fi', 'Air Conditioning', 'TV', 'Minibar', 'Pool Access', 'Gym', 'Breakfast'];



interface IRoom extends Document {
    title?: string;//Hotel room number;//Title like Deluxe room
    description: string;
    bedType: string;
    adults: number; // Max adults the room can hold (e.g., 2)
    children: number;// Max children the room can hold (e.g., 2)
    maxOccupancy: number; // Maximum number of people allowed in the room
    availability: boolean;// Room availability (true means available)
    pricePerNight: number;
    currency: string;
    amenities: MongoID[];
    roomType: RoomType;
    mealPlan: string; // Indicates if a meal is included with the room
    businessProfileID: MongoID;
    totalRooms: number;
}
const RoomSchema: Schema = new Schema<IRoom>(
    {
        businessProfileID: { type: Schema.Types.ObjectId, ref: "BusinessProfile", required: true },
        title: { type: String },
        description: { type: String },
        bedType: {
            type: String,
            enum: BedType,
            default: BedType.SINGLE
        },
        adults: {
            type: Number,
            default: 0
        },
        children: {
            type: Number,
            default: 0
        },
        maxOccupancy: {
            type: Number,
            default: 4
        },
        availability: {
            type: Boolean,
            default: true,
        },
        amenities: [{
            type: Schema.Types.ObjectId,
            ref: "Amenity",
        }],
        roomType: {
            type: String,
            default: RoomType.SINGLE
        },
        pricePerNight: {
            type: Number,
            required: true
        },
        currency: { type: String, required: true, enum: CurrencyCode },
        mealPlan: {
            type: String, enum: MealPlan, required: true
        },
        totalRooms: {
            type: Number,
            required: true
        },
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


export function addRoomImagesInRoom() {
    const lookup = {
        '$lookup': {
            'from': 'roomimages',
            'let': { 'roomID': '$_id' },
            'pipeline': [
                { '$match': { '$expr': { '$eq': ['$roomID', '$$roomID'] } } },
                {
                    '$project': {
                        'sourceUrl': 1,
                        'thumbnailUrl': 1,
                        'isCoverImage': 1,
                    }
                },
            ],
            'as': 'roomImagesRef'
        }
    };
    const addRoomCoverAndThumbnailImage = {
        '$addFields': {
            'cover': {
                '$cond': {
                    'if': {
                        '$gt': [
                            {
                                '$size': {
                                    '$filter': {
                                        'input': '$roomImagesRef',
                                        'as': 'img',
                                        'cond': { '$eq': ['$$img.isCoverImage', true] }
                                    }
                                }
                            },
                            0
                        ]
                    },
                    'then': {
                        '$arrayElemAt': [
                            {
                                '$filter': {
                                    'input': '$roomImagesRef',
                                    'as': 'img',
                                    'cond': { '$eq': ['$$img.isCoverImage', true] }
                                }
                            },
                            0
                        ]
                    },
                    'else': {
                        '_id': '',
                        'sourceUrl': '',
                        'thumbnailUrl': '',
                        'isCoverImage': false,
                    }
                }
            },
        }
    }
    const unwindLookup = {
        '$unwind': {
            'path': '$businessProfileRef',
            'preserveNullAndEmptyArrays': true//false value does not fetch relationship.
        }
    }


    return { lookup, addRoomCoverAndThumbnailImage }
}

export function addAmenitiesInRoom() {

    const lookup = {
        '$lookup': {
            'from': 'amenities',
            'let': { 'amenities': '$amenities' },
            'pipeline': [
                { '$match': { '$expr': { '$in': ['$_id', '$$amenities'] } } },
                {
                    '$project': {
                        '_id': 1,
                        'name': 1,
                        'category': 1,
                    }
                },
            ],
            'as': 'amenitiesRef'
        }
    };
    return { lookup }
}