import { Document, Model, Schema, model, Types } from "mongoose";
import { MongoID, } from "../../common";
import Room from "./room.model";
import { ObjectId } from "mongodb";
interface IInventory extends Document {
    bookingID: MongoID;
    businessProfileID: MongoID;
    roomID: MongoID;
    isBooked: boolean;
    priceOverride: number;
    date: Date;
}
const InventorySchema: Schema = new Schema<IInventory>(
    {
        businessProfileID: { type: Schema.Types.ObjectId, ref: "BusinessProfile", required: true },
        roomID: { type: Schema.Types.ObjectId, ref: "Room", required: true },
        bookingID: { type: Schema.Types.ObjectId, ref: "Booking", required: true },
        isBooked: {
            type: Boolean,
            default: true,
        },
        // priceOverride: {
        //     type: Number,
        //     required: true
        // },
        date: { type: Date, required: true, },
    },
    {
        timestamps: true
    }
);
InventorySchema.set('toObject', { virtuals: true });
InventorySchema.set('toJSON', { virtuals: true });

export interface IInventoryModel extends Model<IInventory> {
}

const Inventory = model<IInventory, IInventoryModel>('Inventory', InventorySchema);
export default Inventory;

export async function checkRoomsAvailability(businessProfileID: MongoID, checkIn: string, checkOut: string) {
    console.log(`[checkRoomsAvailability] businessProfileID: ${businessProfileID}, checkIn: ${checkIn}, checkOut: ${checkOut}`);
    const roomWithInventory = await Room.aggregate([
        {
            $match: {
                businessProfileID: new ObjectId(businessProfileID),
                availability: true, // Only check available rooms
            }
        },
        {
            '$lookup': {
                'from': 'inventories',
                'let': { 'roomID': '$_id' },
                'pipeline': [
                    {
                        '$match': {
                            '$expr': { '$eq': ['$roomID', '$$roomID'] },
                            isBooked: true,
                            'date': {
                                $gte: new Date(checkIn),
                                $lte: new Date(checkOut)
                            }
                        }
                    },
                    {
                        $group: {
                            _id: "$bookingID",
                            data: { $push: "$$ROOT" }
                        }
                    },
                ],
                'as': 'inventoriesRef'
            }
        },
        {
            $addFields: {
                // Flatten all booking entries from all inventoriesRef arrays
                allBookings: {
                    $reduce: {
                        input: "$inventoriesRef",
                        initialValue: [],
                        in: {
                            $concatArrays: [
                                "$$value",
                                "$$this.data"
                            ]
                        }
                    }
                }
            }
        },
        {
            $addFields: {
                // Filter only bookings within the given date range and marked as booked
                relevantBookings: {
                    $filter: {
                        input: "$allBookings",
                        as: "booking",
                        cond: {
                            $and: [
                                { $eq: ["$$booking.isBooked", true] },
                                { $gte: ["$$booking.date", new Date(checkIn)] },
                                { $lte: ["$$booking.date", new Date(checkOut)] }
                            ]
                        }
                    }
                }
            }
        },
        {
            $group: {
                _id: "$_id",
                title: { $first: "$title" },
                totalRooms: { $first: "$totalRooms" },
                bookedDates: { $push: "$relevantBookings.date" },
                bookedEntries: { $first: "$relevantBookings" }
            }
        },
        {
            // Group the bookings by room and by date to avoid overcounting
            $addFields: {
                uniqueBookedDates: {
                    $setUnion: {
                        $map: {
                            input: "$bookedEntries",
                            as: "entry",
                            in: "$$entry.date"
                        }
                    }
                }
            }
        },
        {
            // Count how many rooms are booked per unique date, then take the maximum
            $addFields: {
                bookedPerDate: {
                    $map: {
                        input: "$uniqueBookedDates",
                        as: "date",
                        in: {
                            date: "$$date",
                            count: {
                                $size: {
                                    $filter: {
                                        input: "$bookedEntries",
                                        as: "entry",
                                        cond: { $eq: ["$$entry.date", "$$date"] }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        {
            // Find max booked count across the date range (because one fully booked day blocks a room)
            $addFields: {
                maxBooked: {
                    $max: "$bookedPerDate.count"
                }
            }
        },
        {
            $addFields: {
                availableRooms: {
                    $subtract: ["$totalRooms", { $ifNull: ["$maxBooked", 0] }]
                }
            }
        },
        {
            $project: {
                _id: 1,
                title: 1,
                totalRooms: 1,
                bookedDates: 1,
                availableRooms: 1,
                bookedPerDate: 1
            }
        }
    ]);
    // const totalRooms = await Room.countDocuments({ businessProfileID: businessProfileID });
    // const bookings = await Inventory.find({
    //     businessProfileID: businessProfileID,
    //     $or: [
    //         {
    //             isBooked: true,
    //             'date': {
    //                 $gte: checkIn,
    //                 $lte: checkOut
    //             }
    //         }
    //     ]
    // });
    return roomWithInventory;
}


// async function checkAvailability(roomType, checkIn, checkOut) {
//     const rooms = await Room.findAll({ where: { roomType } });

//     for (const room of rooms) {
//         const inventories = await Inventory.findAll({
//             where: {
//                 RoomId: room.id,
//                 date: {
//                     [Op.between]: [checkIn, checkOut]
//                 },
//                 isAvailable: true
//             }
//         });

//         if (inventories.length === (new Date(checkOut) - new Date(checkIn)) / (1000 * 3600 * 24)) {
//             return room;
//         }
//     }
//     return null;
// }
