"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkRoomsAvailability = void 0;
const mongoose_1 = require("mongoose");
const room_model_1 = __importDefault(require("./room.model"));
const mongodb_1 = require("mongodb");
const InventorySchema = new mongoose_1.Schema({
    businessProfileID: { type: mongoose_1.Schema.Types.ObjectId, ref: "BusinessProfile", required: true },
    roomID: { type: mongoose_1.Schema.Types.ObjectId, ref: "Room", required: true },
    bookingID: { type: mongoose_1.Schema.Types.ObjectId, ref: "Booking", required: true },
    isBooked: {
        type: Boolean,
        default: true,
    },
    // priceOverride: {
    //     type: Number,
    //     required: true
    // },
    date: { type: Date, required: true, },
}, {
    timestamps: true
});
InventorySchema.set('toObject', { virtuals: true });
InventorySchema.set('toJSON', { virtuals: true });
const Inventory = (0, mongoose_1.model)('Inventory', InventorySchema);
exports.default = Inventory;
function checkRoomsAvailability(businessProfileID, checkIn, checkOut) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`[checkRoomsAvailability] businessProfileID: ${businessProfileID}, checkIn: ${checkIn}, checkOut: ${checkOut}`);
        const roomWithInventory = yield room_model_1.default.aggregate([
            {
                $match: {
                    businessProfileID: new mongodb_1.ObjectId(businessProfileID),
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
    });
}
exports.checkRoomsAvailability = checkRoomsAvailability;
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
