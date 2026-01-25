import { HomeStays } from './../../database/seeders/BusinessSubtypeSeeder';
import { Request, Response, NextFunction } from "express";
import { httpAcceptedOrUpdated, httpBadRequest, httpCreated, httpInternalServerError, httpNoContent, httpNotFoundOr404, httpOk, httpOkExtended, httpForbidden } from "../../utils/response";
import { ErrorMessage } from "../../utils/response-message/error";
import { isArray, isString, parseFloatToFixed, parseQueryParam } from "../../utils/helper/basic";
import Booking, { addBusinessProfileInBooking, addPromoCodeInBooking, addRoomInBooking, addUserInBooking, BookingStatus, BookingType, generateNextBookingID } from "../../database/models/booking.model";
import BusinessProfile, { addUserInBusinessProfile } from "../../database/models/businessProfile.model";
import BusinessType from "../../database/models/businessType.model";
import { BusinessType as BusinessTypeEnum } from "../../database/seeders/BusinessTypeSeeder";
import Room, { addAmenitiesInRoom, addRoomImagesInRoom } from "../../database/models/room.model";
import { ObjectId } from 'mongodb';
import { calculateNights, combineDateTime } from '../../utils/helper/date';
import RazorPayService from '../../services/RazorPayService';
import User, { addBusinessSubTypeInBusinessProfile, addBusinessTypeInBusinessProfile, getBusinessType } from '../../database/models/user.model';
import { AccountType } from '../../database/models/anonymousUser.model';
import { FileObject, Role } from "../../common";
import PromoCode, { PriceType, PromoType } from "../../database/models/promoCode.model";
import moment from "moment";
import PDF from "pdfkit";
import path from "path";
import fs, { stat } from "fs";
import { PUBLIC_DIR } from "../../middleware/file-uploading";
import Inventory, { checkRoomsAvailability } from "../../database/models/inventory.model";
import EmailNotificationService from "../../services/EmailNotificationService";
import AppNotificationController from '../AppNotificationController';
import Notification, { NotificationType } from '../../database/models/notification.model';

const razorPayService = new RazorPayService();
const NOT_FOUND = "Booking not found.";
const FETCHED = "Bookings fetched.";
const CREATED = "Amenity created.";
const UPDATED = "Amenity updated.";
const DELETED = "Amenity deleted.";
const RETRIEVED = "Booking fetched.";
export const GST_PERCENTAGE = 18;

//FIXME for  (businessType === BusinessTypeEnum.HOTEL || businessType === BusinessTypeEnum.HOME_STAYS)
const checkIn = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id, accountType } = request.user;
        const { checkIn, checkOut, adults, children, businessProfileID, childrenAge, isTravellingWithPet } = request.body;

        const [maxOccupancy, maxAdults, maxChildren, businessTypeID, user, availability] = await Promise.all([
            Room.find({ businessProfileID: businessProfileID, availability: true }).distinct("maxOccupancy"),
            Room.find({ businessProfileID: businessProfileID, availability: true }).distinct("adults"),
            Room.find({ businessProfileID: businessProfileID, availability: true }).distinct("children"),
            BusinessType.distinct("_id", { name: { $in: [BusinessTypeEnum.HOTEL, BusinessTypeEnum.HOME_STAYS] } }),
            User.findOne({ _id: id }),
            checkRoomsAvailability(businessProfileID, checkIn, checkOut)
        ]);
        if (!user) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        if (user && user.accountType === AccountType.BUSINESS) {
            return response.send(httpForbidden(ErrorMessage.invalidRequest(ErrorMessage.UNAUTHORIZED_ACCESS_ERROR), ErrorMessage.UNAUTHORIZED_ACCESS_ERROR));
        }
        const totalAdults = parseInt(adults);
        const totalChildren = parseInt(children);
        const totalPeople = parseInt(adults) + parseInt(children); // Calculate the total number of people
        if (maxOccupancy.length === 0) {
            return response.send(httpBadRequest(ErrorMessage.invalidRequest("Hotel is not available for booking"), "Hotel is not available for booking"))
        }
        const maxOccupancyPerRoom = maxOccupancy.reduce((prev, curr) => {
            return Math.abs(curr - totalPeople) < Math.abs(prev - totalPeople) ? curr : prev;
        });
        const maxAdultsPerRoom = maxAdults.reduce((prev, curr) => {
            return Math.abs(curr - totalAdults) < Math.abs(prev - totalAdults) ? curr : prev;
        });
        const maxChildrenPerRoom = maxAdults.reduce((prev, curr) => {
            return Math.abs(curr - totalChildren) < Math.abs(prev - totalChildren) ? curr : prev;
        });
        const roomsRequired = Math.ceil(totalAdults / maxAdultsPerRoom);  // Divide by max occupancy per room
        //Check room is available or not
        const availableRoomIDs = await availability.filter((data) => data?.availableRooms >= roomsRequired).map((data) => data._id);
        console.log("totalPeople", totalPeople);
        console.log("maxOccupancy", maxOccupancy);
        console.log("maxOccupancyPerRoom", maxOccupancyPerRoom);
        console.log("maxAdultsPerRoom", maxAdultsPerRoom);
        console.log("maxChildrenPerRoom", maxChildrenPerRoom);
        console.log("roomsRequired", roomsRequired);


        console.log(availableRoomIDs);

        const [booking, businessProfileRef, availableRooms] = await Promise.all([
            Booking.findOne({ checkIn: { $lte: checkOut }, checkOut: { $gte: checkIn }, status: BookingStatus.CREATED }),
            BusinessProfile.findOne({ _id: businessProfileID, businessTypeID: { $in: businessTypeID } }),

            Room.aggregate([
                {
                    $match: {
                        _id: { $in: availableRoomIDs },
                        businessProfileID: new ObjectId(businessProfileID),
                        // maxOccupancy: { $gte: maxOccupancyPerRoom },
                        adults: { $gte: maxAdultsPerRoom },
                        children: { $gte: maxChildrenPerRoom }
                    }
                },
                addRoomImagesInRoom().lookup,
                addRoomImagesInRoom().addRoomCoverAndThumbnailImage,
                addAmenitiesInRoom().lookup,
                {
                    '$lookup': {
                        'from': 'roomprices',
                        'let': { 'roomID': '$_id' },
                        'pipeline': [
                            {
                                '$match': {
                                    '$expr': { '$eq': ['$roomID', '$$roomID'] },
                                    'date': {
                                        $gte: checkIn,
                                        $lte: checkOut
                                    },
                                    'isActive': true,
                                }
                            },
                            {
                                '$sort': {
                                    'days': 1  // 1 for ascending, -1 for descending
                                }
                            },
                            {
                                '$project': {
                                    'updatedAt': 0,
                                    '__v': 0,
                                }
                            },
                        ],
                        'as': 'roomPricesRef'
                    }
                },
                {
                    $addFields: {
                        pricePerNight: {
                            $cond: {
                                if: { $gt: [{ $size: { $ifNull: ["$roomPricesRef", []] } }, 0] },
                                then: { $arrayElemAt: ["$roomPricesRef.appliedPrice", 0] },
                                else: "$pricePerNight"
                            }
                        }
                    }
                },
                {
                    $project: {
                        roomPricesRef: 0,
                        amenities: 0,
                        roomType: 0,
                        mealPlan: 0,
                        availability: 0,
                        businessProfileID: 0,
                        roomImagesRef: 0,
                        createdAt: 0,
                        updatedAt: 0,
                        __v: 0
                    }
                }
            ]),
        ]);
        if (!businessProfileRef) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.BUSINESS_PROFILE_NOT_FOUND), ErrorMessage.BUSINESS_PROFILE_NOT_FOUND))
        }

        if (!booking) {
            const newBooking = new Booking();
            newBooking.bookingID = await generateNextBookingID();
            const businessProfileAny = businessProfileRef as any;
            newBooking.checkIn = combineDateTime(checkIn, businessProfileAny?.checkIn ?? '11:00').toString();
            newBooking.checkOut = combineDateTime(checkOut, businessProfileAny?.checkOut ?? '02:00').toString();
            newBooking.userID = id;
            newBooking.children = children;
            newBooking.adults = adults;
            newBooking.businessProfileID = businessProfileID;
            newBooking.isTravellingWithPet = isTravellingWithPet;
            if (childrenAge && isArray(childrenAge) && (childrenAge?.length === parseInt(children))) {
                newBooking.childrenAge = childrenAge;
            }
            const savedBooking = await newBooking.save();
            const responseData = {
                booking: savedBooking,
                roomsRequired,
                availableRooms
            }
            return response.send(httpOk(responseData, "CREATED"));
        }
        const businessProfileAny = businessProfileRef as any;
        booking.checkIn = combineDateTime(checkIn, businessProfileAny?.checkIn ?? '11:00').toString() ?? booking.checkIn;
        booking.checkOut = combineDateTime(checkOut, businessProfileAny?.checkOut ?? '02:00').toString() ?? booking.checkIn;
        booking.children = children ?? booking.children;
        booking.adults = adults ?? booking.adults;
        booking.isTravellingWithPet = isTravellingWithPet ?? booking.isTravellingWithPet;
        if (childrenAge && isArray(childrenAge) && (childrenAge?.length === parseInt(children))) {
            booking.childrenAge = childrenAge;
        }
        const savedBooking = await booking.save();
        const responseData = {
            availability: availability,
            booking: savedBooking,
            roomsRequired,
            availableRooms,
            user: {
                email: user ? user.email : "",
                name: user ? user.name : "",
                dialCode: user ? user.dialCode : "",
                phoneNumber: user ? user.phoneNumber : "",
                mobileVerified: user ? user.mobileVerified : false
            },
        }
        return response.send(httpOk(responseData, "CREATED"));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const orderPayment = async (request: Request, response: Response, next: NextFunction) => {
    return response.sendFile(path.join(__dirname, 'order-payment.html'));
}
//FIXME Add price check here 
const checkout = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id } = request.user;
        const { bookingID, roomID, quantity, bookedFor, guestDetails, promoCode, price } = request.body;
        const [booking, room, businessTypeHotel, businessTypeIDs, user] = await Promise.all([
            Booking.findOne({ bookingID: bookingID, status: BookingStatus.CREATED }),
            Room.findOne({ _id: roomID }),
            BusinessType.findOne({ name: BusinessTypeEnum.HOTEL }),
            BusinessType.distinct("_id", { name: { $in: [BusinessTypeEnum.HOTEL, BusinessTypeEnum.HOME_STAYS] } }),
            User.findOne({ _id: id })
        ]);

        if (!user) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        if (!booking) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest("Booking not found"), "Booking not found"));
        }
        if (!room) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest("Room not found"), "Room not found"));
        }
        const businessProfile = await BusinessProfile.findOne({ _id: room.businessProfileID });
        const hotelTypeId = businessTypeHotel ? String((businessTypeHotel as any)._id) : null;
        const isHotel = businessProfile && hotelTypeId && businessProfile.businessTypeID.toString() === hotelTypeId;

        // Check if room is available
        if (!room.availability) {
            return response.send(httpBadRequest(ErrorMessage.invalidRequest("This room is currently not available for booking."), "This room is currently not available for booking."));
        }

        const availability = await checkRoomsAvailability(booking.businessProfileID, booking.checkIn.toString(), booking.checkOut.toString());
        const isRoomAvailable = await availability.filter((data) => data?.availableRooms >= quantity && data?._id?.toString() === roomID);

        console.log(`[Checkout] Availability check for room ${roomID}:`, {
            availabilityResults: availability.length,
            roomInResults: availability.some(r => r._id.toString() === roomID),
            requestedQuantity: quantity,
            roomAvailableRooms: availability.find(r => r._id.toString() === roomID)?.availableRooms,
            isRoomAvailable: isRoomAvailable.length > 0
        });
        console.log(`[Checkout] Full availability:`, availability);
        console.log(`[Checkout] Filtered isRoomAvailable:`, isRoomAvailable);

        if (isRoomAvailable && isRoomAvailable.length === 0) {
            // Check if room exists in availability results but doesn't have enough rooms
            const roomInAvailability = availability.find((data) => data?._id?.toString() === roomID);
            if (roomInAvailability) {
                return response.send(httpBadRequest(
                    ErrorMessage.invalidRequest(`Only ${roomInAvailability.availableRooms} room(s) available, but ${quantity} requested.`),
                    `Only ${roomInAvailability.availableRooms} room(s) available, but ${quantity} requested.`
                ));
            } else {
                // Room not found in availability results - might be unavailable or not exist
                return response.send(httpBadRequest(
                    ErrorMessage.invalidRequest("Oops! That room isn't available for the dates you picked. Try different dates or choose another room."),
                    "Oops! That room isn't available for the dates you picked. Try different dates or choose another room."
                ));
            }
        }
        const nights = calculateNights(booking.checkIn.toString(), booking.checkOut.toString());
        booking.bookedRoom = {
            roomID,
            quantity,
            nights,
            price: price ?? room.pricePerNight
        };
        booking.bookedFor = bookedFor ?? booking.bookedFor;

        /*** Calculate price for checkout */

        let subtotal = booking.bookedRoom.price * booking.bookedRoom.quantity * nights;
        let convinceCharges = subtotal * 0.02;
        let gstRate = GST_PERCENTAGE;
        let gst = ((subtotal + convinceCharges) * gstRate) / 100;
        let total = (gst + subtotal + convinceCharges);
        let discount = 0;
        const payment = {
            subtotal,
            convinceCharges,
            gst,
            gstRate,
            total
        }

        /**** PromoCode and price calculation  */
        if (promoCode) {
            const promocode = await PromoCode.findOne({ code: promoCode, type: PromoType.BOOKING })
            if (!promocode) {
                return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.INVALID_PROMOCODE), ErrorMessage.INVALID_PROMOCODE));
            }
            if (promocode.cartValue > parseFloat(`${subtotal} `)) {
                return response.send(httpBadRequest(ErrorMessage.invalidRequest(`To use this coupon minimum order value should be more than ₹ ${subtotal}.`), `To use this coupon minimum order value should be more than ₹ ${subtotal}.`));
            }
            const todayDate = new Date();
            if (promocode.validTo <= todayDate) {
                return response.send(httpBadRequest(ErrorMessage.invalidRequest(ErrorMessage.EXPIRED_PROMOCODE), ErrorMessage.EXPIRED_PROMOCODE));
            }
            if (promocode.quantity !== -1) {
                console.log("Unlimited redeemed count")
                if (promocode.quantity <= promocode.redeemedCount) {
                    return response.send(httpBadRequest(ErrorMessage.invalidRequest(ErrorMessage.PROMOCODE_USAGE_LIMIT_REACHED), ErrorMessage.PROMOCODE_USAGE_LIMIT_REACHED));
                }
            }

            const promoCodeData = {
                name: promocode.name,
                description: promocode.description
            }


            if (promocode.priceType === PriceType.FIXED) {
                discount = promocode.value;
                console.log("Calculated discount fixed", discount, `${promocode.value} `, promocode.maxDiscount);
                if (discount >= promocode.maxDiscount) {
                    discount = promocode.maxDiscount;
                    console.log("Maximum discount applied", discount);
                }
                subtotal = (subtotal - discount);
                gst = ((subtotal + convinceCharges) * GST_PERCENTAGE) / 100;
                total = (gst + subtotal + convinceCharges);
                Object.assign(payment, { discount, gst, total, promocode: promoCodeData });
                booking.promoCode = promocode.code;
                booking.promoCodeID = promocode.id;
            } else {
                discount = (subtotal * promocode.value) / 100;
                console.log("Calculated discount percentage", discount, `${promocode.value}% `, promocode.maxDiscount);
                if (discount >= promocode.maxDiscount) {
                    discount = promocode.maxDiscount;
                    console.log("Maximum discount applied", discount);
                }
                subtotal = (subtotal - discount);
                gst = ((subtotal + convinceCharges) * GST_PERCENTAGE) / 100;
                total = (gst + subtotal + convinceCharges);
                Object.assign(payment, { discount, gst, total, promocode: promoCodeData });
                booking.promoCode = promocode.code;
                booking.promoCodeID = promocode.id;
            }
        }
        const razorpayData = {
            description: room.title ? `Room Booking '${room.title}' - Booking ID: ${booking.bookingID} ` : `Room Booking - Booking ID: ${booking.bookingID} `,
            email: "",
            name: "",
            address: {
                street: "",
                city: "",
                state: "",
                zipCode: "",
                country: "",
            },
            dialCode: "",
            phoneNumber: "",
            gstn: '',
        }
        let razorPayOrder = null;
        razorPayOrder = await razorPayService.createOrder(Math.round(payment.total), razorpayData);
        booking.razorPayOrderID = razorPayOrder.id;

        if (guestDetails && isArray(guestDetails)) {
            const data = `[${guestDetails.join(",")}]`;
            booking.guestDetails = JSON.parse(data);
        }
        if (guestDetails && isString(guestDetails)) {
            booking.guestDetails = [JSON.parse(guestDetails)];
        }
        booking.subTotal = subtotal + convinceCharges;
        booking.tax = gst;
        booking.convinceCharge = convinceCharges;
        booking.grandTotal = total;
        booking.discount = discount;
        const [savedBooking, businessProfileRef] = await Promise.all([
            booking.save(),
            BusinessProfile.aggregate([
                {
                    $match: { _id: room.businessProfileID, businessTypeID: { $in: businessTypeIDs } }
                },
                addBusinessTypeInBusinessProfile().lookup,
                addBusinessTypeInBusinessProfile().unwindLookup,
                addBusinessSubTypeInBusinessProfile().lookup,
                addBusinessSubTypeInBusinessProfile().unwindLookup,
                addUserInBusinessProfile().lookup,
                addUserInBusinessProfile().unwindLookup,
                {
                    $project: {
                        _id: 1,
                        profilePic: 1,
                        name: 1,
                        address: 1,
                        rating: 1,
                        businessTypeRef: 1,
                        businessSubtypeRef: 1,
                        userID: {
                            '$ifNull': [{ '$ifNull': ['$usersRef._id', ''] }, '']
                        },
                    }
                },
            ])
        ]);
        if (businessProfileRef.length === 0) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.BUSINESS_PROFILE_NOT_FOUND), ErrorMessage.BUSINESS_PROFILE_NOT_FOUND))
        }
        const responseData = {
            ...savedBooking.toJSON(),
            user: {
                email: user ? user.email : "",
                name: user ? user.name : "",
                dialCode: user ? user.dialCode : "",
                phoneNumber: user ? user.phoneNumber : "",
                mobileVerified: user ? user.mobileVerified : false
            },
            razorPayOrder,
            businessProfileRef: businessProfileRef[0],
            payment,
            room: {
                title: room.title || "",
                bedType: room.bedType || "",
            },
        }
        return response.send(httpOk(responseData, "Checkout summary"));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const confirmCheckout = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id } = request.user;
        const { bookingID, paymentID, signature, guestDetails, bookedFor } = request.body;
        const [booking] = await Promise.all([
            Booking.findOne({ bookingID: bookingID, status: BookingStatus.CREATED }),
        ]);
        if (!booking) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest("Booking not found"), "Booking not found"));
        }
        const [isPaymentVerified, razorPayOrder, payment, promoCode, customer, hotelManager, businessProfile, roomDetails] = await Promise.all([
            razorPayService.verifyPayment(booking.razorPayOrderID, paymentID, signature),
            razorPayService.fetchOrder(booking.razorPayOrderID),
            razorPayService.fetchPayment(paymentID),
            PromoCode.findOne({ code: booking.promoCode, type: PromoType.BOOKING }),
            User.findOne({ _id: booking.userID }),
            User.findOne({ businessProfileID: booking.businessProfileID }),
            BusinessProfile.findOne({ _id: booking.businessProfileID }),
            Room.findOne({ _id: booking.bookedRoom.roomID }),
        ]);
        if (guestDetails && isArray(guestDetails)) {
            const data = `[${guestDetails.join(",")}]`;
            booking.guestDetails = JSON.parse(data);
        }
        if (guestDetails && isString(guestDetails)) {
            booking.guestDetails = [JSON.parse(guestDetails)];
        }
        if (!isPaymentVerified || razorPayOrder.status !== "paid") {
            await booking.save();
            return response.send(httpBadRequest(ErrorMessage.invalidRequest("Payment not verified. please try again"), "Payment not verified. please try again"))
        }

        booking.bookedFor = bookedFor ?? booking.bookedFor;
        booking.status = BookingStatus.PENDING;
        const amount = parseInt(`${payment.amount} `) / 100;
        booking.paymentDetail = {
            transactionID: payment.id,
            paymentMethod: payment.method,
            transactionAmount: parseFloatToFixed(amount, 2)
        }
        const [savedBooking, businessType] = await Promise.all([
            booking.save(),
            getBusinessType(booking.businessProfileID)
        ]);

        if (promoCode) {
            promoCode.redeemedCount = promoCode.redeemedCount + 1;
            await promoCode.save();
        }
        const nights = booking.bookedRoom.nights;
        const roomID = booking.bookedRoom.roomID;
        const businessProfileID = booking.businessProfileID;
        const quantity = booking.bookedRoom.quantity;
        for (let i = 0; i < nights; i++) {
            const date = moment(booking.checkIn).startOf('day').add(i, 'days').format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
            for (let q = 0; q < quantity; q++) {
                const bookingInventory = new Inventory({
                    bookingID: booking._id,
                    roomID: new ObjectId(roomID),
                    date,
                    businessProfileID: new ObjectId(businessProfileID),
                    isBooked: true,
                });
                await bookingInventory.save();
            }
        }
        const responseData = {
            ...savedBooking.toJSON(),
        }
        new EmailNotificationService().sendBookingEmail({
            type: savedBooking.type,
            toAddress: hotelManager?.email ?? "",
            cc: [customer?.email ?? "", businessProfile?.email ?? ""],
            businessName: businessProfile?.name ?? "",
            businessType: businessType ?? BusinessTypeEnum.HOTEL.toString(),
            customerName: customer?.name ?? "",
            customerEmail: customer?.email ?? "",
            customerPhone: customer?.phoneNumber ?? "",
            checkIn: savedBooking.checkIn,
            checkOut: savedBooking.checkOut,
            nights: savedBooking.bookedRoom.nights,
            roomType: roomDetails?.roomType ?? "",
            bookingID: savedBooking.bookingID,
            adults: savedBooking.adults,
            children: savedBooking.children,
            transactionAmount: savedBooking.paymentDetail.transactionAmount,
            transactionID: savedBooking.paymentDetail.transactionID,
            paymentMethod: savedBooking.paymentDetail.paymentMethod,
            transactionDate: moment().format('ddd DD, MMM YYYY hh:mm:ss A'),
            metadata: savedBooking.metadata,
        });
        return response.send(httpOk(responseData, "Your booking has been placed successfully. Our team will confirm your reservation shortly."));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}

const index = async (request: Request, response: Response, next: NextFunction) => {
    try {
        console.log(request.url);
        console.log(request.path);
        const { id, accountType, businessProfileID, role } = request.user;
        let { pageNumber, documentLimit, query, status }: any = request.query;
        let businessProfile = request?.query?.businessProfileID as string;
        let requestRole = request?.query?.role as string;

        pageNumber = parseQueryParam(pageNumber, 1);
        documentLimit = parseQueryParam(documentLimit, 20);
        const dbQuery = { status: { $in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.CANCELED, BookingStatus.COMPLETED, BookingStatus.CANCELED_BY_BUSINESS, BookingStatus.CANCELED_BY_USER] } };
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
        if (status && status === 'all') {
            Object.assign(dbQuery, {
                status: {
                    $in: [BookingStatus.CREATED, BookingStatus.PENDING,
                    BookingStatus.CONFIRMED, BookingStatus.CANCELED, BookingStatus.COMPLETED, BookingStatus.CANCELED_BY_BUSINESS, BookingStatus.CANCELED_BY_USER]
                }
            })
        }
        if (businessProfile && role === Role.ADMINISTRATOR && requestRole === Role.ADMINISTRATOR) {
            Object.assign(dbQuery, { businessProfileID: new ObjectId(businessProfile) })
        }
        //Business user can only see their hotel booking
        if (accountType === AccountType.BUSINESS && businessProfileID) {
            Object.assign(dbQuery, { businessProfileID: new ObjectId(businessProfileID) })
        }
        if (accountType === AccountType.INDIVIDUAL && !requestRole) {
            Object.assign(dbQuery, { userID: new ObjectId(id) })
        }
        console.log(dbQuery);
        const [documents, totalDocument] = await Promise.all([
            Booking.aggregate([
                {
                    $match: dbQuery
                },
                {
                    $sort: { createdAt: -1, id: 1 }
                },
                {
                    $skip: pageNumber > 0 ? ((pageNumber - 1) * documentLimit) : 0
                },
                {
                    $limit: documentLimit
                },
                addRoomInBooking(true).lookup,
                addRoomInBooking(true).unwindLookup,
                addUserInBooking().lookup,
                addUserInBooking().unwindLookup,
                addBusinessProfileInBooking().lookup,
                addBusinessProfileInBooking().unwindLookup,
                {
                    $project: {
                        __v: 0,
                    }
                }
            ]),
            Booking.find(dbQuery).countDocuments()
        ]);
        const totalPagesCount = Math.ceil(totalDocument / documentLimit) || 1;
        return response.send(httpOkExtended(documents, FETCHED, pageNumber, totalPagesCount, totalDocument));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const show = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const ID = request?.params?.id;
        const booking = await Booking.aggregate([
            {
                $match: { _id: new ObjectId(ID) }
            },
            addRoomInBooking(true).lookup,
            addRoomInBooking(true).unwindLookup,
            addUserInBooking().lookup,
            addUserInBooking().unwindLookup,
            addBusinessProfileInBooking().lookup,
            addBusinessProfileInBooking().unwindLookup,
            addPromoCodeInBooking().lookup,
            addPromoCodeInBooking().unwindLookup,
            {

                $addFields: {
                    freeCancelBy: {
                        $dateSubtract: {
                            startDate: "$checkIn",
                            unit: "day",
                            amount: 5
                        }
                    },
                    todayDate: { $toDate: new Date() },
                }
            },
            {
                $addFields: {
                    freeCancel: {
                        $cond: {
                            if: {
                                $and: [
                                    { $gt: ["$freeCancelBy", "$todayDate"] },
                                    { $lt: ["$freeCancelBy", "$checkIn"] }
                                ]
                            },
                            then: true,
                            else: false
                        }
                    }
                }
            },
            {

                $addFields: {
                    gstRate: GST_PERCENTAGE
                }
            },
            {
                $project: {
                    __v: 0,
                    todayDate: 0,
                }
            },
            {
                $sort: { createdAt: -1, id: 1 }
            },
            {
                $limit: 1
            },
        ])
        if (booking.length === 0) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(NOT_FOUND), NOT_FOUND));
        }
        return response.send(httpOk(booking[0], RETRIEVED));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const cancelBooking = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const ID = request?.params?.id;
        const { id, accountType } = request.user;
        const booking = await Booking.findOne({ _id: ID, userID: id });
        if (!booking) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(NOT_FOUND), NOT_FOUND));
        }
        const checkIn = booking.checkIn;
        const freeCancelBy = moment();
        const freeCancel = moment(checkIn).subtract(5, 'days');

        const isFreeCancelValid = freeCancel.isAfter(freeCancelBy) && freeCancel.isBefore(checkIn);
        if (!isFreeCancelValid) {
            return response.send(httpBadRequest(ErrorMessage.invalidRequest("Cancellation deadline has passed. You cannot cancel the booking."), "Cancellation deadline has passed. You cannot cancel the booking."))
        }
        console.log(isFreeCancelValid);
        if ([BookingStatus.CREATED.toString(), BookingStatus.PENDING.toString(), BookingStatus.CONFIRMED.toString()].includes(booking.status)) {
            booking.status = BookingStatus.CANCELED;
            await booking.save();
            return response.send(httpNoContent(null, "Your booking has been canceled successfully."));
        }
        const message = `The order has already been ${booking.status} and cannot be canceled.`;
        return response.send(httpBadRequest(ErrorMessage.invalidRequest(message), message));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }

}

const changeBookingStatus = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const ID = request?.params?.id;
        const { id, accountType, businessProfileID } = request.user;
        const { status } = request.body;
        const nextStatus = [BookingStatus.CANCELED_BY_BUSINESS.toString(), BookingStatus.CONFIRMED.toString()];
        const [booking] = await Promise.all([
            Booking.findOne({
                _id: ID,
                businessProfileID: businessProfileID,
                status: { $in: [BookingStatus.PENDING, BookingStatus.CREATED] }
            })
        ]);
        if (!booking) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(NOT_FOUND), NOT_FOUND));
        }
        if (!nextStatus.includes(status)) {
            return response.send(httpBadRequest(ErrorMessage.invalidRequest(`Invalid status. Possible statuses are: ${nextStatus.join(" | ")}`), `Invalid status. Possible statuses are: ${nextStatus.join(" | ")}`));
        }

        booking.status = status ?? booking.status;
        const [savedBooking, businessType, deleteResult, user, businessProfile, customer, roomDetails] = await Promise.all([
            booking.save(),
            getBusinessType(booking.businessProfileID),
            Notification.deleteMany({ type: NotificationType.BOOKING, "metadata.bookingID": booking._id }),  //Remove request notification fot book a table or book a banquet hall
            User.findOne({ businessProfileID: booking.businessProfileID }),
            BusinessProfile.findOne({ _id: booking.businessProfileID }),
            User.findOne({ _id: booking.userID }),
            Room.findOne({ _id: booking?.bookedRoom?.roomID }),
        ]);
        if (businessType && [BusinessTypeEnum.HOTEL.toString(), BusinessTypeEnum.HOME_STAYS.toString()].includes(businessType)) {
            if (status === BookingStatus.CONFIRMED) {
                new EmailNotificationService().sendBookingConfirmationEmail({
                    type: savedBooking.type,
                    toAddress: customer?.email ?? "",
                    cc: [user?.email ?? "", businessProfile?.email ?? ""],
                    businessName: businessProfile?.name ?? "",
                    businessType: businessType ?? BusinessTypeEnum.HOTEL.toString(),
                    businessPhone: businessProfile?.phoneNumber ?? "",
                    businessEmail: businessProfile?.email ?? "",
                    address: {
                        street: businessProfile?.address?.street ?? "",
                        city: businessProfile?.address?.city ?? "",
                        state: businessProfile?.address?.state ?? "",
                        zipCode: businessProfile?.address?.zipCode ?? "",
                        country: businessProfile?.address?.country ?? "",
                    },
                    customerName: customer?.name ?? "",
                    customerEmail: customer?.email ?? "",
                    customerPhone: customer?.phoneNumber ?? "",
                    checkIn: savedBooking.checkIn,
                    checkOut: savedBooking.checkOut,
                    nights: savedBooking.bookedRoom.nights,
                    roomType: roomDetails?.roomType ?? "",
                    bookingID: savedBooking.bookingID,
                    adults: savedBooking.adults,
                    children: savedBooking.children,
                    transactionAmount: savedBooking.paymentDetail.transactionAmount,
                    transactionID: savedBooking.paymentDetail.transactionID,
                    paymentMethod: savedBooking.paymentDetail.paymentMethod,
                    transactionDate: moment().format('ddd DD, MMM YYYY hh:mm:ss A'),
                    metadata: savedBooking.metadata,
                });
            }

            if (status === BookingStatus.CANCELED_BY_BUSINESS) {
                new EmailNotificationService().sendBookingCancellationEmail({
                    type: savedBooking.type,
                    toAddress: customer?.email ?? "",
                    cc: [user?.email ?? "", businessProfile?.email ?? ""],
                    businessName: businessProfile?.name ?? "",
                    businessPhone: businessProfile?.phoneNumber ?? "",
                    businessEmail: businessProfile?.email ?? "",
                    customerName: customer?.name ?? "",
                    customerEmail: customer?.email ?? "",
                    customerPhone: customer?.phoneNumber ?? "",
                    checkIn: savedBooking.checkIn,
                    checkOut: savedBooking.checkOut,
                    nights: savedBooking.bookedRoom.nights,
                    roomType: roomDetails?.roomType ?? "",
                    bookingID: savedBooking.bookingID,
                    adults: savedBooking.adults,
                    children: savedBooking.children,
                    metadata: savedBooking.metadata,
                });
            }
            const metadata = booking?.metadata ? booking?.metadata as any : "";
            AppNotificationController.store(id, booking.userID, NotificationType.BOOKING, {
                bookingID: savedBooking._id,
                businessType: businessType ?? BusinessTypeEnum.RESTAURANT.toString(),
                type: savedBooking.type,
                typeOfEvent: metadata?.typeOfEvent ?? "",
                status: status,
                bookingRef: booking.bookingID
            }).catch((error) => console.error(error));
        }
        if (businessType && [BusinessTypeEnum.RESTAURANT.toString(), BusinessTypeEnum.BARS_CLUBS.toString()].includes(businessType)) {
            if (status === BookingStatus.CONFIRMED) {
                new EmailNotificationService().sendBookingConfirmationEmail({
                    type: savedBooking.type,
                    toAddress: customer?.email ?? "",
                    cc: [user?.email ?? "", businessProfile?.email ?? ""],
                    businessName: businessProfile?.name ?? "",
                    businessType: businessType ?? BusinessTypeEnum.HOTEL.toString(),
                    businessPhone: businessProfile?.phoneNumber ?? "",
                    businessEmail: businessProfile?.email ?? "",
                    address: {
                        street: businessProfile?.address?.street ?? "",
                        city: businessProfile?.address?.city ?? "",
                        state: businessProfile?.address?.state ?? "",
                        zipCode: businessProfile?.address?.zipCode ?? "",
                        country: businessProfile?.address?.country ?? "",
                    },
                    customerName: customer?.name ?? "",
                    customerEmail: customer?.email ?? "",
                    customerPhone: customer?.phoneNumber ?? "",
                    checkIn: savedBooking.checkIn,
                    checkOut: savedBooking.checkOut,
                    nights: 0,
                    roomType: "",
                    bookingID: savedBooking.bookingID,
                    adults: savedBooking.adults,
                    children: savedBooking.children,
                    transactionAmount: 0,
                    transactionID: "",
                    paymentMethod: "",
                    transactionDate: moment().format('ddd DD, MMM YYYY hh:mm:ss A'),
                    metadata: savedBooking.metadata,
                });

            }
            if (status === BookingStatus.CANCELED_BY_BUSINESS) {
                new EmailNotificationService().sendBookingCancellationEmail({
                    type: savedBooking.type,
                    toAddress: customer?.email ?? "",
                    cc: [user?.email ?? "", businessProfile?.email ?? ""],
                    businessName: businessProfile?.name ?? "",
                    businessPhone: businessProfile?.phoneNumber ?? "",
                    businessEmail: businessProfile?.email ?? "",
                    customerName: customer?.name ?? "",
                    customerEmail: customer?.email ?? "",
                    customerPhone: customer?.phoneNumber ?? "",
                    checkIn: savedBooking.checkIn,
                    checkOut: savedBooking.checkOut,
                    nights: 0,
                    roomType: "",
                    bookingID: savedBooking.bookingID,
                    adults: savedBooking.adults,
                    children: savedBooking.children,
                    metadata: savedBooking.metadata,
                });
            }
            /***Send Notification */
            const metadata = booking?.metadata ? booking?.metadata as any : "";
            AppNotificationController.store(id, booking.userID, NotificationType.BOOKING, {
                bookingID: savedBooking._id,
                businessType: businessType ?? BusinessTypeEnum.RESTAURANT.toString(),
                type: savedBooking.type,
                typeOfEvent: metadata?.typeOfEvent ?? "",
                status: status,
                bookingRef: booking.bookingID
            }).catch((error) => console.error(error));
        }
        if (businessType && [BusinessTypeEnum.MARRIAGE_BANQUETS.toString()].includes(businessType)) {
            console.log(BusinessTypeEnum.MARRIAGE_BANQUETS, status === BookingStatus.CONFIRMED)
            if (status === BookingStatus.CONFIRMED) {
                new EmailNotificationService().sendBookingConfirmationEmail({

                    type: savedBooking.type,
                    toAddress: customer?.email ?? "",
                    cc: [user?.email ?? "", businessProfile?.email ?? ""],
                    businessName: businessProfile?.name ?? "",
                    businessType: businessType ?? BusinessTypeEnum.HOTEL.toString(),
                    businessPhone: businessProfile?.phoneNumber ?? "",
                    businessEmail: businessProfile?.email ?? "",
                    address: {
                        street: businessProfile?.address?.street ?? "",
                        city: businessProfile?.address?.city ?? "",
                        state: businessProfile?.address?.state ?? "",
                        zipCode: businessProfile?.address?.zipCode ?? "",
                        country: businessProfile?.address?.country ?? "",
                    },
                    customerName: customer?.name ?? "",
                    customerEmail: customer?.email ?? "",
                    customerPhone: customer?.phoneNumber ?? "",
                    checkIn: savedBooking.checkIn,
                    checkOut: savedBooking.checkOut,
                    nights: 0,
                    roomType: "",
                    bookingID: savedBooking.bookingID,
                    adults: savedBooking.adults,
                    children: savedBooking.children,
                    transactionAmount: 0,
                    transactionID: "",
                    paymentMethod: "",
                    transactionDate: moment().format('ddd DD, MMM YYYY hh:mm:ss A'),
                    metadata: savedBooking.metadata,
                });
            }
            if (status === BookingStatus.CANCELED_BY_BUSINESS) {
                new EmailNotificationService().sendBookingCancellationEmail({
                    type: savedBooking.type,
                    toAddress: customer?.email ?? "",
                    cc: [user?.email ?? "", businessProfile?.email ?? ""],
                    businessName: businessProfile?.name ?? "",
                    businessPhone: businessProfile?.phoneNumber ?? "",
                    businessEmail: businessProfile?.email ?? "",
                    customerName: customer?.name ?? "",
                    customerEmail: customer?.email ?? "",
                    customerPhone: customer?.phoneNumber ?? "",
                    checkIn: savedBooking.checkIn,
                    checkOut: savedBooking.checkOut,
                    nights: 0,
                    roomType: "",
                    bookingID: savedBooking.bookingID,
                    adults: savedBooking.adults,
                    children: savedBooking.children,
                    metadata: savedBooking.metadata,
                });
            }
            /***Send Notification */
            const metadata = booking?.metadata ? booking?.metadata as any : "";
            AppNotificationController.store(id, booking.userID, NotificationType.BOOKING, {
                bookingID: savedBooking._id,
                businessType: businessType ?? BusinessTypeEnum.RESTAURANT.toString(),
                type: savedBooking.type,
                typeOfEvent: metadata?.typeOfEvent ?? "",
                status: status,
                bookingRef: booking.bookingID
            }).catch((error) => console.error(error));
        }
        return response.send(httpNoContent(null, "Booking status updated successfully."));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }

}
const userCancelHotelBooking = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const ID = request?.params?.id;
        const { id } = request.user;
        const booking = await Booking.findOne({ _id: ID, userID: id });
        if (!booking) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(NOT_FOUND), NOT_FOUND));
        }

        const checkIn = booking.checkIn;
        const now = moment();
        const freeCancelThreshold = moment(checkIn).subtract(1, 'days');
        const gracePeriodThreshold = moment((booking as any).createdAt).add(1, 'days');

        const isFreeCancelValid = freeCancelThreshold.isAfter(now) || gracePeriodThreshold.isAfter(now);
        if (!isFreeCancelValid) {
            return response.send(httpBadRequest(ErrorMessage.invalidRequest("please contact the business regarding this issue"), "please contact the business regarding this issue"))
        }

        if ([BookingStatus.CREATED.toString(), BookingStatus.PENDING.toString(), BookingStatus.CONFIRMED.toString()].includes(booking.status)) {
            booking.status = BookingStatus.CANCELED_BY_USER;
            await booking.save();
            return response.send(httpOk(null, "Your booking has been canceled successfully."));
        }
        const message = `The order has already been ${booking.status} and cannot be canceled.`;
        return response.send(httpBadRequest(ErrorMessage.invalidRequest(message), message));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const downloadInvoice = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const ID = request?.params?.id;
        const { id, accountType } = request.user;
        const booking = await Booking.findOne({ _id: ID, userID: id });
        if (!booking) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(NOT_FOUND), NOT_FOUND));
        }
        const [user, room] = await Promise.all([
            User.findOne({ _id: booking.userID }),
            Room.findOne({ _id: booking.bookedRoom.roomID })
        ]);

        const pdf = new PDF();
        const filename = `invoice-${booking.bookingID}.pdf`;
        const filePath = path.join(`${PUBLIC_DIR}/invoices`, filename);
        pdf.pipe(fs.createWriteStream(filePath));

        pdf.image(`data:image/png;base64,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`, 50, 50, { width: 50, align: "center" })

        // Title
        pdf.fontSize(20).text('The Hotel Media', 100, 70, { align: 'left' });


        // Invoice Information
        pdf.fontSize(12).text(`Invoice Number:   ${booking.bookingID}`, { align: "right" });
        pdf.text('\n');
        pdf.text('\n');
        pdf.fontSize(11).text(`Booking Information`);
        pdf.fontSize(10).text(`Customer Name:   ${user?.name ?? ''}`);
        pdf.fontSize(10).text(`Booking Reference:   ${booking.bookingID}`);
        pdf.fontSize(10).text(`Date:   ${moment(booking.createdAt).format('ddd DD, MMM YYYY hh:mm:ss A')}`);
        pdf.text('\n');
        pdf.fontSize(10).text(`Check In:   ${moment(booking.checkIn).format('ddd DD, MMM YYYY hh:mm:ss A') ?? ''}`);
        pdf.fontSize(10).text(`Number of Nights:   ${booking?.bookedRoom?.nights ?? ''}`);
        pdf.fontSize(10).text(`Check Out:   ${moment(booking.checkOut).format('ddd DD, MMM YYYY hh:mm:ss A') ?? ''}`);
        pdf.fontSize(10).text(`Room Type:   ${room?.roomType?.toUpperCase() ?? ''}`);

        // Table of Items
        pdf.text('\n');
        pdf.text('\n');
        pdf.text('\n');
        pdf.fontSize(10).text('--------------------------------------------------------------------------------------------------------------------------');
        pdf.text('Description          Quantity          Price          Total');
        pdf.fontSize(10).text('--------------------------------------------------------------------------------------------------------------------------');
        pdf.fontSize(8).text(`${room?.roomType?.toUpperCase()} Room\n${room?.title}          ${booking.bookedRoom.quantity}          ${booking.bookedRoom.price} INR          ${booking.bookedRoom.quantity * booking.bookedRoom.price} INR`);
        pdf.fontSize(10).text('--------------------------------------------------------------------------------------------------------------------------');
        pdf.text('\n');
        pdf.text('\n');

        // Totals
        pdf.fontSize(12).text(`Totals`);
        pdf.fontSize(10).text(`Subtotal:   ${booking.subTotal} INR`, { align: 'left' });
        pdf.fontSize(10).text(`Convince Charge:   ${booking.convinceCharge} INR`, { align: 'left' });
        if (booking.discount > 0) {
            pdf.fontSize(10).text(`Discount (PromoCode ${booking.promoCode}): ${booking.tax} INR`, { align: 'left' });
        }
        pdf.fontSize(10).text(`Tax:   ${booking.tax} INR`, { align: 'left' });
        pdf.fontSize(10).text(`Total:   ${booking.grandTotal} INR`, { align: 'left' });
        pdf.end();

        const hostAddress = request.protocol + "://" + request.get("host");
        const fileObject: FileObject = {
            filename: filename,
            filepath: `${hostAddress}/${filePath}`,
            type: "application/pdf",
        }
        return response.send(httpOk(fileObject, "Invoice downloaded successfully."))
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}

const bookTable = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id, accountType } = request.user;
        const { numberOfGuests, date, time, businessProfileID } = request.body;
        const [user, businessProfile, customer] = await Promise.all([
            User.findOne({ businessProfileID: businessProfileID }),
            BusinessProfile.findOne({ _id: businessProfileID }),
            User.findOne({ _id: id })
        ]);
        if (!user || !businessProfile) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        if (user.accountType && user.accountType !== AccountType.BUSINESS) {
            return response.send(httpForbidden(ErrorMessage.invalidRequest("Access Denied! This is not a business account."), "Access Denied! This is not a business account."));
        }
        const businessType = await getBusinessType(user.businessProfileID);
        if (businessType && ![BusinessTypeEnum.RESTAURANT.toString(), BusinessTypeEnum.BARS_CLUBS.toString()].includes(businessType)) {
            return response.send(httpForbidden(ErrorMessage.invalidRequest("Access Denied! Only restaurants can accept table bookings."), "Access Denied! Only restaurants can accept table bookings."));
        }
        const checkIn = combineDateTime(date, time).toString();
        const [booking] = await Promise.all([
            Booking.findOne({
                checkIn: { $lte: checkIn },
                checkOut: { $gte: checkIn },
                businessProfileID: businessProfile.id,
                status: { $in: [BookingStatus.CREATED, BookingStatus.PENDING] },
                type: BookingType.BOOK_TABLE
            })
        ]);
        if (!booking) {
            const newBooking = new Booking();
            newBooking.bookingID = await generateNextBookingID();
            newBooking.checkIn = checkIn;
            newBooking.checkOut = checkIn;
            newBooking.userID = id;
            newBooking.children = 0;
            newBooking.adults = numberOfGuests;
            newBooking.isTravellingWithPet = false;
            newBooking.businessProfileID = businessProfileID;
            newBooking.status = BookingStatus.PENDING;
            newBooking.type = BookingType.BOOK_TABLE;
            const savedBooking = await newBooking.save();
            new EmailNotificationService().sendBookingEmail({
                type: savedBooking.type,
                toAddress: user?.email ?? "",
                cc: [customer?.email ?? "", businessProfile?.email ?? ""],
                businessName: businessProfile?.name ?? "",
                businessType: businessType ?? BusinessTypeEnum.RESTAURANT.toString(),
                customerName: customer?.name ?? "",
                customerEmail: customer?.email ?? "",
                customerPhone: customer?.phoneNumber ?? "",
                checkIn: savedBooking.checkIn,
                checkOut: savedBooking.checkOut,
                nights: 0,
                roomType: "",
                bookingID: savedBooking.bookingID,
                adults: savedBooking.adults,
                children: savedBooking.children,
                transactionAmount: 0,
                transactionID: "",
                paymentMethod: "",
                transactionDate: moment().format('ddd DD, MMM YYYY hh:mm:ss A'),
                metadata: savedBooking.metadata,
            });
            /***Send Notification */
            AppNotificationController.store(id, user.id, NotificationType.BOOKING, {
                bookingID: newBooking._id,
                businessType: businessType ?? BusinessTypeEnum.RESTAURANT.toString(),
                type: newBooking.type,
                checkIn: newBooking.checkIn,
            }).catch((error) => console.error(error));
            return response.send(httpOk(savedBooking, "Table booking successful! We look forward to serving you."));
        }
        booking.checkIn = checkIn;
        booking.checkOut = checkIn;
        booking.adults = numberOfGuests;
        booking.status = BookingStatus.PENDING;
        booking.type = BookingType.BOOK_TABLE;
        const savedBooking = await booking.save();
        new EmailNotificationService().sendBookingEmail({
            type: savedBooking.type,
            toAddress: user?.email ?? "",
            cc: [customer?.email ?? "", businessProfile?.email ?? ""],
            businessName: businessProfile?.name ?? "",
            customerName: customer?.name ?? "",
            customerEmail: customer?.email ?? "",
            customerPhone: customer?.phoneNumber ?? "",
            checkIn: savedBooking.checkIn,
            checkOut: savedBooking.checkOut,
            nights: 0,
            roomType: "",
            businessType: businessType ?? BusinessTypeEnum.RESTAURANT.toString(),
            bookingID: savedBooking.bookingID,
            adults: savedBooking.adults,
            children: savedBooking.children,
            transactionAmount: 0,
            transactionID: "",
            paymentMethod: "",
            transactionDate: moment().format('ddd DD, MMM YYYY hh:mm:ss A'),
            metadata: savedBooking.metadata,
        });
        return response.send(httpOk(savedBooking, "Table booking successful! We look forward to serving you."));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const bookBanquet = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { id, accountType } = request.user;
        const { numberOfGuests, checkIn, checkOut, businessProfileID, typeOfEvent } = request.body;
        const [user, businessProfile, customer] = await Promise.all([
            User.findOne({ businessProfileID: businessProfileID }),
            BusinessProfile.findOne({ _id: businessProfileID }),
            User.findOne({ _id: id })
        ]);
        if (!user || !businessProfile) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        if (user.accountType && user.accountType !== AccountType.BUSINESS) {
            return response.send(httpForbidden(ErrorMessage.invalidRequest("Access Denied! This is not a business account."), "Access Denied! This is not a business account."));
        }
        const businessType = await getBusinessType(user.businessProfileID);
        if (businessType && (businessType !== BusinessTypeEnum.MARRIAGE_BANQUETS)) {
            return response.send(httpForbidden(ErrorMessage.invalidRequest("Access Denied! Only Marriage Banquets can accept bookings."), "Access Denied! Only Marriage Banquets can accept bookings."));
        }
        const checkInTime = combineDateTime(checkIn, "00:00").toString();
        const checkOutTime = combineDateTime(checkOut, "00:00").toString();
        const [booking] = await Promise.all([
            Booking.findOne({
                checkIn: { $lte: checkInTime },
                checkOut: { $gte: checkOutTime },
                businessProfileID: businessProfile.id,
                status: { $in: [BookingStatus.CREATED, BookingStatus.PENDING] },
                type: BookingType.BOOK_BANQUET
            })
        ]);
        if (!booking) {
            const newBooking = new Booking();
            newBooking.bookingID = await generateNextBookingID();
            newBooking.checkIn = checkInTime;
            newBooking.checkOut = checkOutTime;
            newBooking.userID = id;
            newBooking.children = 0;
            newBooking.adults = numberOfGuests;
            newBooking.businessProfileID = businessProfileID;
            newBooking.isTravellingWithPet = false;
            newBooking.status = BookingStatus.PENDING;
            newBooking.type = BookingType.BOOK_BANQUET;
            newBooking.metadata = { typeOfEvent: typeOfEvent } as any;
            const savedBooking = await newBooking.save();
            new EmailNotificationService().sendBookingEmail({
                type: savedBooking.type,
                toAddress: user?.email ?? "",
                cc: [customer?.email ?? "", businessProfile?.email ?? ""],
                businessName: businessProfile?.name ?? "",
                businessType: businessType ?? BusinessTypeEnum.MARRIAGE_BANQUETS.toString(),
                customerName: customer?.name ?? "",
                customerEmail: customer?.email ?? "",
                customerPhone: customer?.phoneNumber ?? "",
                checkIn: savedBooking.checkIn,
                checkOut: savedBooking.checkOut,
                nights: 0,
                roomType: "",
                bookingID: savedBooking.bookingID,
                adults: savedBooking.adults,
                children: savedBooking.children,
                transactionAmount: 0,
                transactionID: "",
                paymentMethod: "",
                transactionDate: moment().format('ddd DD, MMM YYYY hh:mm:ss A'),
                metadata: savedBooking.metadata,
            });
            /***Send Notification */
            AppNotificationController.store(id, user.id, NotificationType.BOOKING, {
                bookingID: newBooking._id,
                businessType: businessType ?? BusinessTypeEnum.RESTAURANT.toString(),
                type: newBooking.type,
                typeOfEvent: typeOfEvent
            }).catch((error) => console.error(error));
            return response.send(httpOk(savedBooking, "Banquet booking successful! We look forward to serving you."));
        }
        booking.checkIn = checkInTime;
        booking.checkOut = checkOutTime;
        booking.adults = numberOfGuests;
        booking.status = BookingStatus.PENDING;
        booking.type = BookingType.BOOK_BANQUET;
        booking.metadata = { typeOfEvent: typeOfEvent } as any;
        const savedBooking = await booking.save();
        new EmailNotificationService().sendBookingEmail({
            type: savedBooking.type,
            toAddress: user?.email ?? "",
            cc: [customer?.email ?? "", businessProfile?.email ?? ""],
            businessType: businessType ?? BusinessTypeEnum.MARRIAGE_BANQUETS.toString(),
            businessName: businessProfile?.name ?? "",
            customerName: customer?.name ?? "",
            customerEmail: customer?.email ?? "",
            customerPhone: customer?.phoneNumber ?? "",
            checkIn: savedBooking.checkIn,
            checkOut: savedBooking.checkOut,
            nights: 0,
            roomType: "",
            bookingID: savedBooking.bookingID,
            adults: savedBooking.adults,
            children: savedBooking.children,
            transactionAmount: 0,
            transactionID: "",
            paymentMethod: "",
            transactionDate: moment().format('ddd DD, MMM YYYY hh:mm:ss A'),
            metadata: savedBooking.metadata,
        });
        return response.send(httpOk(savedBooking, "Banquet booking successful! We look forward to serving you."));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
export default { checkIn, checkout, confirmCheckout, index, show, cancelBooking, downloadInvoice, bookTable, bookBanquet, orderPayment, changeBookingStatus, userCancelHotelBooking };





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
