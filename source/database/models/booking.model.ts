import { Schema, Model, model, Types, Document } from 'mongoose';
import { MongoID, BookedFor } from '../../common';
import moment from "moment";
import { PaymentDetail, PaymentDetailSchema } from './order.model';
import { addBusinessSubTypeInBusinessProfile, addBusinessTypeInBusinessProfile, profileBasicProject } from './user.model';
import { addAmenitiesInRoom, addRoomImagesInRoom } from './room.model';
import { addUserInBusinessProfile } from './businessProfile.model';
export enum BookingStatus {
    CREATED = "created",
    PENDING = "pending",       // Booking is created but not yet confirmed
    CONFIRMED = "confirmed",   // Booking is confirmed
    CHECKED_IN = "checked in", // Customer has checked into the hotel
    COMPLETED = "completed",   // Stay has been completed and booking is finished
    CANCELED = "canceled",     // Booking has been canceled
    NO_SHOW = "no show",    // Customer did not show up for the booking
    CANCELED_BY_BUSINESS = "canceled by business", // Booking was canceled by the business
}
export enum BookingType {
    BOOKING = "booking",
    BOOK_TABLE = "book-table",
    BOOK_BANQUET = "book-banquet"
}

interface IBooking extends Document {
    bookingID: string;
    userID: MongoID;
    businessProfileID: MongoID;
    checkIn: Date | string;
    checkOut: Date | string;
    status: string;
    adults: number;
    children: number;
    childrenAge: number[];
    bookedRoom: IBookedRoom,
    isTravellingWithPet: boolean;
    guestDetails: IGuestDetails[];
    razorPayOrderID: string;
    bookedFor: string;
    paymentDetail: PaymentDetail;
    discount: number;
    tax: number;
    subTotal: number;
    grandTotal: number;
    convinceCharge: number;
    promoCode?: string;
    promoCodeID?: string;
    createdAt: string;
    updatedAt: string;
    type: string;
    metadata: Schema.Types.Mixed;
}

export interface IBookedRoom {
    roomID: MongoID,
    price: number,
    quantity: number,
    nights: number,
}
export interface IGuestDetails {
    title: string; //Mr//Mrs//Ms
    fullName: string;
    email: string;
    mobileNumber: string;
}

export const GuestDetailsSchema = new Schema<IGuestDetails>(
    {
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

    },
    {
        _id: false,
    }
)
export const BookedRoomSchema = new Schema<IBookedRoom>(
    {
        roomID: { type: Schema.Types.ObjectId, ref: "Room", },
        price: { type: Number, default: 0 },
        quantity: { type: Number, default: 0 },
        nights: {
            type: Number,
            required: true
        },
    },
    {
        _id: false,
    }
)


const BookingSchema: Schema = new Schema<IBooking>(
    {
        metadata: {
            type: Schema.Types.Mixed
        },
        bookingID: { type: String, required: true, unique: true },
        userID: { type: Schema.Types.ObjectId, ref: "User", required: true },
        businessProfileID: { type: Schema.Types.ObjectId, ref: "BusinessProfile", required: true },
        checkIn: { type: Date, default: Date.now },
        checkOut: { type: Date, default: Date.now },
        status: { type: String, default: BookingStatus.CREATED },
        adults: { type: Number, default: 0 },
        children: { type: Number, default: 0 },
        childrenAge: [{ type: Number }],
        bookedRoom: BookedRoomSchema,
        isTravellingWithPet: { type: Boolean, default: false },
        guestDetails: [GuestDetailsSchema],
        razorPayOrderID: { type: String },
        bookedFor: { type: String, enum: BookedFor, default: BookedFor.FOR_MYSELF },
        paymentDetail: PaymentDetailSchema,
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
            type: Schema.Types.ObjectId,
            ref: "Coupon"
        },
        type: {
            type: String,
            enum: BookingType,
            default: BookingType.BOOKING
        }
    },
    {
        timestamps: true
    });

export interface IBookingModel extends Model<IBooking> {
}

const Booking = model<IBooking, IBookingModel>("Booking", BookingSchema);
export default Booking;




export async function generateNextBookingID(): Promise<string> {
    let year = moment().get('year');
    let month = moment().get('month');
    let date = moment().get('date');
    let hour = moment().get('hour');
    let minute = moment().get('minute');
    let second = moment().get('second');
    let millisecond = moment().get('millisecond');
    let bookingID = `THM-${millisecond}${year}${date}${month}${minute}${second}${hour}`;
    const isAvailable = await Booking.findOne({ bookingID: bookingID });
    if (!isAvailable) {
        return bookingID;
    } else {
        return await generateNextBookingID();
    }
}


export function addRoomInBooking(fullProject?: boolean) {
    let Project:
        {
            $project: {
                title: number;
                roomType: number;
                bedType: number;
                description?: number;
                amenitiesRef?: number;
                roomImagesRef?: number;
            };
        } = {
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
        }
    }
    const lookup = {
        '$lookup': {
            'from': 'rooms',
            'let': { 'roomID': '$bookedRoom.roomID' },
            'pipeline': [
                { '$match': { '$expr': { '$eq': ['$_id', '$$roomID'] } } },
                addAmenitiesInRoom().lookup,
                addRoomImagesInRoom().lookup,
                Project,
            ],
            'as': 'roomsRef'
        }
    };
    const unwindLookup = {
        '$unwind': {
            'path': '$roomsRef',
            'preserveNullAndEmptyArrays': true//false value does not fetch relationship.
        }
    }
    return { lookup, unwindLookup }
}
export function addUserInBooking() {
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
                        'preserveNullAndEmptyArrays': true//false value does not fetch relationship.
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
            'preserveNullAndEmptyArrays': true//false value does not fetch relationship.
        }
    }
    return { lookup, unwindLookup }
}

export function addBusinessProfileInBooking() {
    const lookup = {
        '$lookup': {
            'from': 'businessprofiles',
            'let': { 'businessProfileID': '$businessProfileID' },
            'pipeline': [
                { '$match': { '$expr': { '$eq': ['$_id', '$$businessProfileID'] } } },
                addBusinessTypeInBusinessProfile().lookup,
                addBusinessTypeInBusinessProfile().unwindLookup,
                addBusinessSubTypeInBusinessProfile().lookup,
                addBusinessSubTypeInBusinessProfile().unwindLookup,
                addUserInBusinessProfile().lookup,
                addUserInBusinessProfile().unwindLookup,
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
            'preserveNullAndEmptyArrays': true//false value does not fetch relationship.
        }
    }
    const mergeObject = {
        $replaceRoot: { newRoot: { $mergeObjects: [{ $arrayElemAt: ["$businessProfileRef", 0] }, "$$ROOT"] } }
    }

    return { lookup, unwindLookup, mergeObject }

}

export function addPromoCodeInBooking() {
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
            'preserveNullAndEmptyArrays': true//false value does not fetch relationship.
        }
    }
    return { lookup, unwindLookup }
}