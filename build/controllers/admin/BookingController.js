"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const response_1 = require("../../utils/response");
const error_1 = require("../../utils/response-message/error");
const basic_1 = require("../../utils/helper/basic");
const booking_model_1 = __importStar(require("../../database/models/booking.model"));
const businessProfile_model_1 = require("../../database/models/businessProfile.model");
const user_model_1 = require("../../database/models/user.model");
const common_1 = require("../../common");
const inventory_model_1 = require("../../database/models/inventory.model");
const moment_1 = __importDefault(require("moment"));
const NOT_FOUND = "Booking not found.";
const FETCHED = "Dashboard data fetched.";
const CREATED = "Amenity created.";
const UPDATED = "Amenity updated.";
const DELETED = "Amenity deleted.";
const RETRIEVED = "Booking fetched.";
const index = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { id, accountType, businessProfileID, role } = request.user;
        let { pageNumber, documentLimit, query, status } = request.query;
        let businessProfile = ((_a = request === null || request === void 0 ? void 0 : request.body) === null || _a === void 0 ? void 0 : _a.businessProfileID) || undefined;
        pageNumber = (0, basic_1.parseQueryParam)(pageNumber, 1);
        documentLimit = (0, basic_1.parseQueryParam)(documentLimit, 20);
        const dbQuery = {};
        if (query !== undefined && query !== "") {
            Object.assign(dbQuery, {
                $or: [
                    { razorPayOrderID: { $regex: new RegExp(query.toLowerCase(), "i") } },
                    { bookingID: { $regex: new RegExp(query.toLowerCase(), "i") } },
                    { "paymentDetail.transactionID": { $regex: new RegExp(query.toLowerCase(), "i") } },
                ]
            });
        }
        if (status) {
            Object.assign(dbQuery, { status: status });
        }
        //FIXME This is the next phase fixes important
        // if (accountType === AccountType.BUSINESS && businessProfileID) {
        //     Object.assign(dbQuery, { businessProfileID: businessProfileID })
        // }
        //Admin can filter booking based on hotel or business profile id.
        if (businessProfile && role === common_1.Role.ADMINISTRATOR) {
            // Object.assign(dbQuery, { businessProfileID:  businessProfile })//FIXME 
        }
        const [documents, totalDocument] = yield Promise.all([
            booking_model_1.default.aggregate([
                {
                    $match: dbQuery
                },
                {
                    $sort: { createdAt: -1, id: 1 }
                },
                {
                    $group: {
                        _id: "$businessProfileID", // Group by businessProfileID
                        totalBookings: {
                            $sum: 1,
                        },
                        // createdCount: {
                        //     $sum: { $cond: [{ $eq: ["$status", "created"] }, 1, 0] } // Count "created" status
                        // },
                        confirmedBookings: {
                            $sum: { $cond: [{ $eq: ["$status", "confirmed"] }, 1, 0] } // Count "confirmed" status
                        },
                        cancelledBookings: {
                            $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] } // Count "cancelled" status
                        },
                        pendingBookings: {
                            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } // Count "pending" status
                        }
                    }
                },
                {
                    '$lookup': {
                        'from': 'businessprofiles',
                        'let': { 'businessProfileID': '$_id' },
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
                                    _id: 1,
                                    profilePic: 1,
                                    name: 1,
                                    address: 1,
                                    rating: 1,
                                    businessTypeRef: 1,
                                    businessSubtypeRef: 1,
                                    username: 1,
                                    "userID": {
                                        '$ifNull': [{ '$ifNull': ['$usersRef._id', ''] }, '']
                                    }
                                }
                            }
                        ],
                        'as': 'businessProfileRef'
                    }
                },
                {
                    '$unwind': {
                        'path': '$businessProfileRef',
                        'preserveNullAndEmptyArrays': true //false value does not fetch relationship.
                    }
                },
                // {
                //     $replaceRoot: { newRoot: { $mergeObjects: [{ $arrayElemAt: ["$businessProfileRef", 0] }, "$$ROOT"] } }
                // },
                {
                    $skip: pageNumber > 0 ? ((pageNumber - 1) * documentLimit) : 0
                },
                {
                    $limit: documentLimit
                },
            ]),
            booking_model_1.default.aggregate([
                {
                    $match: dbQuery
                },
                {
                    $sort: { createdAt: -1, id: 1 }
                },
                {
                    $group: {
                        _id: "$businessProfileID", // Group by businessProfileID
                        totalBookings: {
                            $sum: 1,
                        },
                        // createdCount: {
                        //     $sum: { $cond: [{ $eq: ["$status", "created"] }, 1, 0] } // Count "created" status
                        // },
                        confirmedBookings: {
                            $sum: { $cond: [{ $eq: ["$status", "confirmed"] }, 1, 0] } // Count "confirmed" status
                        },
                        cancelledBookings: {
                            $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] } // Count "cancelled" status
                        },
                        pendingBookings: {
                            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } // Count "pending" status
                        }
                    }
                },
            ])
        ]);
        const totalDocumentCount = totalDocument.length || 1;
        const totalPagesCount = Math.ceil(totalDocumentCount / documentLimit) || 1;
        return response.send((0, response_1.httpOkExtended)(documents, FETCHED, pageNumber, totalPagesCount, totalDocumentCount));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_b = error.message) !== null && _b !== void 0 ? _b : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const bookingStatistical = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _c;
    try {
        const responseData = yield booking_model_1.default.aggregate([
            {
                $match: {}
            },
            {
                $sort: { createdAt: -1, id: 1 }
            },
            {
                $group: {
                    _id: null,
                    totalBookings: {
                        $sum: 1,
                    },
                    confirmedBookings: {
                        $sum: { $cond: [{ $eq: ["$status", "confirmed"] }, 1, 0] } // Count "confirmed" status
                    },
                    cancelledBookings: {
                        $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] } // Count "cancelled" status
                    },
                    pendingBookings: {
                        $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } // Count "pending" status
                    }
                }
            }
        ]);
        return response.send((0, response_1.httpOk)(responseData[0], "Booking statistical fetched"));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_c = error.message) !== null && _c !== void 0 ? _c : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const hotelDashboard = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _d;
    try {
        const { _id, businessProfileID } = request.user;
        let { duration } = request.query;
        switch (duration) {
            case "1h": break;
            case "1d": break;
            case "1w": break;
            case "1m": break;
            case "1y": break;
        }
        const today = (0, moment_1.default)().startOf('day').format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
        const tomorrow = (0, moment_1.default)().add(1, 'day').startOf('day').format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
        const newBookings = yield booking_model_1.default.find({
            status: { $in: [booking_model_1.BookingStatus.PENDING, booking_model_1.BookingStatus.CONFIRMED] },
            createdAt: {
                $gte: new Date(today),
                $lt: new Date(tomorrow)
            }
        }).countDocuments();
        const todayCheckIn = yield booking_model_1.default.find({
            status: { $in: [booking_model_1.BookingStatus.CONFIRMED] },
            checkIn: {
                $gte: new Date(today),
                $lt: new Date(tomorrow)
            }
        }).countDocuments();
        const todayCheckOut = yield booking_model_1.default.find({
            status: { $in: [booking_model_1.BookingStatus.CONFIRMED] },
            checkOut: {
                $gte: new Date(today),
                $lt: new Date(tomorrow)
            }
        }).countDocuments();
        const rooms = yield (0, inventory_model_1.checkRoomsAvailability)(businessProfileID, today, tomorrow);
        const totalRooms = rooms.reduce((sum, room) => sum + ((room === null || room === void 0 ? void 0 : room.totalRooms) || 0), 0);
        const availableRooms = rooms.reduce((sum, room) => sum + ((room === null || room === void 0 ? void 0 : room.availableRooms) || 0), 0);
        const responseData = {
            newBookings: newBookings,
            todayCheckIn: todayCheckIn,
            todayCheckOut: todayCheckOut,
            earnings: 0,
            totalRooms: totalRooms,
            availableRooms: availableRooms
        };
        return response.send((0, response_1.httpOk)(responseData, FETCHED));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_d = error.message) !== null && _d !== void 0 ? _d : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
exports.default = { index, bookingStatistical, hotelDashboard };
/*
GET /checkout/summary

Description: Retrieve a summary of the booking details before finalizing the checkout.
Parameters: User ID, booking ID, payment details (optional).
Response: A detailed summary of the booking (room type, dates, total cost, etc.).
POST /checkout/payment

Description: Process the payment for the booking.
Parameters:
Payment details (e.g., credit card information, payment method).
Booking ID.
Billing address, if needed.
Response: Confirmation of payment or an error message if the payment fails.
POST /checkout/confirm

Description: Final confirmation of the booking after payment is successful.
Parameters: Booking ID, payment status, user details.
Response: A confirmation of the booking, including a unique booking ID and additional booking details (check-in/check-out dates, room number, etc.).
GET /checkout/status/{booking_id}

Description: Check the status of the booking, such as whether it was successfully processed, confirmed, or any issues with payment.
Parameters: Booking ID.
Response: Booking status (e.g., pending, confirmed, payment failed).
POST /checkout/cancel

Description: Cancel a booking after it has been confirmed.
Parameters: Booking ID, cancellation reason (optional).
Response: A response confirming the cancellation or a failure message.
GET /checkout/invoice/{booking_id}

Description: Retrieve the invoice or receipt for the completed booking.
Parameters: Booking ID.
Response: Invoice data (total cost, payment method, etc.).
GET /checkout/discounts

Description: Retrieve available discounts or promotional codes to apply during checkout.
Parameters: User ID, location, stay dates.
Response: A list of available discounts that the user can apply.
POST /checkout/update

Description: Update booking details such as room preferences, additional services, or guest details.
Parameters: Booking ID, updated guest details, room preferences, etc.
Response: A response confirming the updates. */
