
import { Request, Response, NextFunction } from "express";
import { httpAcceptedOrUpdated, httpBadRequest, httpCreated, httpInternalServerError, httpNoContent, httpNotFoundOr404, httpOk, httpOkExtended, httpForbidden } from "../../utils/response";
import { ErrorMessage } from "../../utils/response-message/error";
import { parseQueryParam } from "../../utils/helper/basic";
import Booking, { BookingStatus } from "../../database/models/booking.model";
import { addUserInBusinessProfile } from "../../database/models/businessProfile.model";
import { addBusinessSubTypeInBusinessProfile, addBusinessTypeInBusinessProfile } from '../../database/models/user.model';
import { Role } from "../../common";
import { checkRoomsAvailability } from "../../database/models/inventory.model";
import moment from "moment";
const NOT_FOUND = "Booking not found.";
const FETCHED = "Dashboard data fetched.";
const CREATED = "Amenity created.";
const UPDATED = "Amenity updated.";
const DELETED = "Amenity deleted.";
const RETRIEVED = "Booking fetched.";
const index = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id, accountType, businessProfileID, role } = request.user;
        let { pageNumber, documentLimit, query, status }: any = request.query;

        let businessProfile = request?.body?.businessProfileID || undefined;

        pageNumber = parseQueryParam(pageNumber, 1);
        documentLimit = parseQueryParam(documentLimit, 20);
        const dbQuery = {};
        if (query !== undefined && query !== "") {
            Object.assign(dbQuery,
                {
                    $or: [
                        { razorPayOrderID: { $regex: new RegExp(query.toLowerCase(), "i") } },
                        { bookingID: { $regex: new RegExp(query.toLowerCase(), "i") } },
                        { "paymentDetail.transactionID": { $regex: new RegExp(query.toLowerCase(), "i") } },
                    ]
                }
            )
        }
        if (status) {
            Object.assign(dbQuery, { status: status })
        }
        //FIXME This is the next phase fixes important
        // if (accountType === AccountType.BUSINESS && businessProfileID) {
        //     Object.assign(dbQuery, { businessProfileID: businessProfileID })
        // }
        //Admin can filter booking based on hotel or business profile id.
        if (businessProfile && role === Role.ADMINISTRATOR) {
            // Object.assign(dbQuery, { businessProfileID:  businessProfile })//FIXME 
        }
        const [documents, totalDocument] = await Promise.all([
            Booking.aggregate([
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
                            addBusinessTypeInBusinessProfile().lookup,
                            addBusinessTypeInBusinessProfile().unwindLookup,
                            addBusinessSubTypeInBusinessProfile().lookup,
                            addBusinessSubTypeInBusinessProfile().unwindLookup,
                            addUserInBusinessProfile().lookup,
                            addUserInBusinessProfile().unwindLookup,
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
                }
                , {
                    '$unwind': {
                        'path': '$businessProfileRef',
                        'preserveNullAndEmptyArrays': true//false value does not fetch relationship.
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

            Booking.aggregate([
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
        return response.send(httpOkExtended(documents, FETCHED, pageNumber, totalPagesCount, totalDocumentCount));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const bookingStatistical = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const responseData = await Booking.aggregate([
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
        return response.send(httpOk(responseData[0], "Booking statistical fetched"))
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}

const hotelDashboard = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { _id, businessProfileID } = request.user;
        let { duration }: any = request.query;
        switch (duration) {
            case "1h": break;
            case "1d": break;
            case "1w": break;
            case "1m": break;
            case "1y": break;
        }
        const today = moment().startOf('day').format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
        const tomorrow = moment().add(1, 'day').startOf('day').format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
        const newBookings = await Booking.find({
            status: { $in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
            createdAt: {
                $gte: new Date(today),
                $lt: new Date(tomorrow)
            }
        }).countDocuments();
        const todayCheckIn = await Booking.find({
            status: { $in: [BookingStatus.CONFIRMED] },
            checkIn: {
                $gte: new Date(today),
                $lt: new Date(tomorrow)
            }
        }).countDocuments();
        const todayCheckOut = await Booking.find({
            status: { $in: [BookingStatus.CONFIRMED] },
            checkOut: {
                $gte: new Date(today),
                $lt: new Date(tomorrow)
            }
        }).countDocuments();

        const rooms = await checkRoomsAvailability(businessProfileID, today, tomorrow)

        const totalRooms = rooms.reduce((sum, room) => sum + (room?.totalRooms || 0), 0);
        const availableRooms = rooms.reduce((sum, room) => sum + (room?.availableRooms || 0), 0);
        const responseData = {
            newBookings: newBookings,
            todayCheckIn: todayCheckIn,
            todayCheckOut: todayCheckOut,
            earnings: 0,
            totalRooms: totalRooms,
            availableRooms: availableRooms
        }
        return response.send(httpOk(responseData, FETCHED))
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}

export default { index, bookingStatistical, hotelDashboard };





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
