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
exports.addPromoCodeInBooking = exports.addBusinessProfileInBooking = exports.addUserInBooking = exports.addRoomInBooking = exports.generateNextBookingID = exports.BookedRoomSchema = exports.GuestDetailsSchema = exports.BookingType = exports.BookingStatus = void 0;
const mongoose_1 = require("mongoose");
const common_1 = require("../../common");
const moment_1 = __importDefault(require("moment"));
const order_model_1 = require("./order.model");
const user_model_1 = require("./user.model");
const room_model_1 = require("./room.model");
const businessProfile_model_1 = require("./businessProfile.model");
var BookingStatus;
(function (BookingStatus) {
    BookingStatus["CREATED"] = "created";
    BookingStatus["PENDING"] = "pending";
    BookingStatus["CONFIRMED"] = "confirmed";
    BookingStatus["CHECKED_IN"] = "checked in";
    BookingStatus["COMPLETED"] = "completed";
    BookingStatus["CANCELED"] = "canceled";
    BookingStatus["NO_SHOW"] = "no show";
    BookingStatus["CANCELED_BY_BUSINESS"] = "canceled by business";
})(BookingStatus || (exports.BookingStatus = BookingStatus = {}));
var BookingType;
(function (BookingType) {
    BookingType["BOOKING"] = "booking";
    BookingType["BOOK_TABLE"] = "book-table";
    BookingType["BOOK_BANQUET"] = "book-banquet";
})(BookingType || (exports.BookingType = BookingType = {}));
exports.GuestDetailsSchema = new mongoose_1.Schema({
    title: {
        type: String,
        enum: [
            "Mr",
            "Mrs",
            "Ms"
        ]
    },
    fullName: { type: String, default: "" },
    email: { type: String, lowercase: true, match: [/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/, "email is invalid."], },
    mobileNumber: { type: String, default: "" },
}, {
    _id: false,
});
exports.BookedRoomSchema = new mongoose_1.Schema({
    roomID: { type: mongoose_1.Schema.Types.ObjectId, ref: "Room", },
    price: { type: Number, default: 0 },
    quantity: { type: Number, default: 0 },
    nights: {
        type: Number,
        required: true
    },
}, {
    _id: false,
});
const BookingSchema = new mongoose_1.Schema({
    metadata: {
        type: mongoose_1.Schema.Types.Mixed
    },
    bookingID: { type: String, required: true, unique: true },
    userID: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    businessProfileID: { type: mongoose_1.Schema.Types.ObjectId, ref: "BusinessProfile", required: true },
    checkIn: { type: Date, default: Date.now },
    checkOut: { type: Date, default: Date.now },
    status: { type: String, default: BookingStatus.CREATED },
    adults: { type: Number, default: 0 },
    children: { type: Number, default: 0 },
    childrenAge: [{ type: Number }],
    bookedRoom: exports.BookedRoomSchema,
    isTravellingWithPet: { type: Boolean, default: false },
    guestDetails: [exports.GuestDetailsSchema],
    razorPayOrderID: { type: String },
    bookedFor: { type: String, enum: common_1.BookedFor, default: common_1.BookedFor.FOR_MYSELF },
    paymentDetail: order_model_1.PaymentDetailSchema,
    subTotal: {
        type: Number,
        default: 0,
    },
    discount: {
        type: Number,
        default: 0,
    },
    tax: {
        type: Number,
        default: 0,
    },
    convinceCharge: {
        type: Number,
        default: 0,
    },
    grandTotal: {
        type: Number,
        default: 0,
    },
    promoCode: {
        type: String,
    },
    promoCodeID: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Coupon"
    },
    type: {
        type: String,
        enum: BookingType,
        default: BookingType.BOOKING
    }
}, {
    timestamps: true
});
const Booking = (0, mongoose_1.model)("Booking", BookingSchema);
exports.default = Booking;
function generateNextBookingID() {
    return __awaiter(this, void 0, void 0, function* () {
        let year = (0, moment_1.default)().get('year');
        let month = (0, moment_1.default)().get('month');
        let date = (0, moment_1.default)().get('date');
        let hour = (0, moment_1.default)().get('hour');
        let minute = (0, moment_1.default)().get('minute');
        let second = (0, moment_1.default)().get('second');
        let millisecond = (0, moment_1.default)().get('millisecond');
        let bookingID = `THM-${millisecond}${year}${date}${month}${minute}${second}${hour}`;
        const isAvailable = yield Booking.findOne({ bookingID: bookingID });
        if (!isAvailable) {
            return bookingID;
        }
        else {
            return yield generateNextBookingID();
        }
    });
}
exports.generateNextBookingID = generateNextBookingID;
function addRoomInBooking(fullProject) {
    let Project = {
        '$project': {
            'title': 1,
            'roomType': 1,
            'bedType': 1,
        }
    };
    if (fullProject) {
        Project = {
            '$project': {
                'title': 1,
                'roomType': 1,
                'bedType': 1,
                "description": 1,
                "amenitiesRef": 1,
                "roomImagesRef": 1,
            }
        };
    }
    const lookup = {
        '$lookup': {
            'from': 'rooms',
            'let': { 'roomID': '$bookedRoom.roomID' },
            'pipeline': [
                { '$match': { '$expr': { '$eq': ['$_id', '$$roomID'] } } },
                (0, room_model_1.addAmenitiesInRoom)().lookup,
                (0, room_model_1.addRoomImagesInRoom)().lookup,
                Project,
            ],
            'as': 'roomsRef'
        }
    };
    const unwindLookup = {
        '$unwind': {
            'path': '$roomsRef',
            'preserveNullAndEmptyArrays': true //false value does not fetch relationship.
        }
    };
    return { lookup, unwindLookup };
}
exports.addRoomInBooking = addRoomInBooking;
function addUserInBooking() {
    const lookup = {
        '$lookup': {
            'from': 'users',
            'let': { 'userID': '$userID' },
            'pipeline': [
                { '$match': { '$expr': { '$eq': ['$_id', '$$userID'] } } },
                {
                    '$lookup': {
                        'from': 'useraddresses',
                        'let': { 'userID': '$_id' },
                        'pipeline': [
                            { '$match': { '$expr': { '$eq': ['$userID', '$$userID'] } } },
                            {
                                '$project': {
                                    createdAt: 0,
                                    updatedAt: 0,
                                    __v: 0
                                }
                            }
                        ],
                        'as': 'userAddressesRef'
                    }
                },
                {
                    '$unwind': {
                        'path': '$userAddressesRef',
                        'preserveNullAndEmptyArrays': true //false value does not fetch relationship.
                    }
                },
                {
                    "$project": {
                        "name": 1,
                        "email": 1,
                        "username": 1,
                        "accountType": 1,
                        'profilePic': 1,
                        "dialCode": 1,
                        "phoneNumber": 1,
                        "userAddressesRef": 1,
                    }
                }
            ],
            'as': 'usersRef'
        }
    };
    const unwindLookup = {
        '$unwind': {
            'path': '$usersRef',
            'preserveNullAndEmptyArrays': true //false value does not fetch relationship.
        }
    };
    return { lookup, unwindLookup };
}
exports.addUserInBooking = addUserInBooking;
function addBusinessProfileInBooking() {
    const lookup = {
        '$lookup': {
            'from': 'businessprofiles',
            'let': { 'businessProfileID': '$businessProfileID' },
            'pipeline': [
                { '$match': { '$expr': { '$eq': ['$_id', '$$businessProfileID'] } } },
                (0, user_model_1.addBusinessTypeInBusinessProfile)().lookup,
                (0, user_model_1.addBusinessTypeInBusinessProfile)().unwindLookup,
                (0, user_model_1.addBusinessSubTypeInBusinessProfile)().lookup,
                (0, user_model_1.addBusinessSubTypeInBusinessProfile)().unwindLookup,
                (0, businessProfile_model_1.addUserInBusinessProfile)().lookup,
                (0, businessProfile_model_1.addUserInBusinessProfile)().unwindLookup,
                {
                    '$project': {
                        "userID": {
                            '$ifNull': [{ '$ifNull': ['$usersRef._id', ''] }, '']
                        },
                        "profilePic": 1,
                        "address": 1,
                        "name": 1,
                        "coverImage": 1,
                        "rating": 1,
                        "businessTypeRef": 1,
                        "businessSubtypeRef": 1,
                    }
                }
            ],
            'as': 'businessProfileRef'
        }
    };
    const unwindLookup = {
        '$unwind': {
            'path': '$businessProfileRef',
            'preserveNullAndEmptyArrays': true //false value does not fetch relationship.
        }
    };
    const mergeObject = {
        $replaceRoot: { newRoot: { $mergeObjects: [{ $arrayElemAt: ["$businessProfileRef", 0] }, "$$ROOT"] } }
    };
    return { lookup, unwindLookup, mergeObject };
}
exports.addBusinessProfileInBooking = addBusinessProfileInBooking;
function addPromoCodeInBooking() {
    const lookup = {
        '$lookup': {
            'from': 'promocodes',
            'let': { 'promoCodeID': '$promoCodeID' },
            'pipeline': [
                { '$match': { '$expr': { '$eq': ['$_id', '$$promoCodeID'] } } },
                {
                    '$project': {
                        "name": 1,
                        "description": 1
                    }
                }
            ],
            'as': 'promoCodesRef'
        }
    };
    const unwindLookup = {
        '$unwind': {
            'path': '$promoCodesRef',
            'preserveNullAndEmptyArrays': true //false value does not fetch relationship.
        }
    };
    return { lookup, unwindLookup };
}
exports.addPromoCodeInBooking = addPromoCodeInBooking;
