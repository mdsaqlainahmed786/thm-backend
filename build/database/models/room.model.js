"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addRoomImagesInRoom = addRoomImagesInRoom;
exports.addAmenitiesInRoom = addAmenitiesInRoom;
const mongoose_1 = require("mongoose");
const common_1 = require("../../common");
const RoomSchema = new mongoose_1.Schema({
    businessProfileID: { type: mongoose_1.Schema.Types.ObjectId, ref: "BusinessProfile", required: true },
    title: { type: String },
    description: { type: String },
    bedType: {
        type: String,
        enum: common_1.BedType,
        default: common_1.BedType.SINGLE
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
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "Amenity",
        }],
    roomType: {
        type: String,
        default: common_1.RoomType.SINGLE
    },
    pricePerNight: {
        type: Number,
        required: true
    },
    currency: { type: String, required: true, enum: common_1.CurrencyCode },
    mealPlan: {
        type: String, enum: common_1.MealPlan, required: true
    },
    totalRooms: {
        type: Number,
        required: true
    },
}, {
    timestamps: true
});
RoomSchema.set('toObject', { virtuals: true });
RoomSchema.set('toJSON', { virtuals: true });
const Room = (0, mongoose_1.model)('Room', RoomSchema);
exports.default = Room;
function addRoomImagesInRoom() {
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
    };
    const unwindLookup = {
        '$unwind': {
            'path': '$businessProfileRef',
            'preserveNullAndEmptyArrays': true //false value does not fetch relationship.
        }
    };
    return { lookup, addRoomCoverAndThumbnailImage };
}
function addAmenitiesInRoom() {
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
    return { lookup };
}
