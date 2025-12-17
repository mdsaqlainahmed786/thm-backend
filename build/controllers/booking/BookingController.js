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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.GST_PERCENTAGE = void 0;
const response_1 = require("../../utils/response");
const error_1 = require("../../utils/response-message/error");
const basic_1 = require("../../utils/helper/basic");
const booking_model_1 = __importStar(require("../../database/models/booking.model"));
const businessProfile_model_1 = __importStar(require("../../database/models/businessProfile.model"));
const businessType_model_1 = __importDefault(require("../../database/models/businessType.model"));
const BusinessTypeSeeder_1 = require("../../database/seeders/BusinessTypeSeeder");
const room_model_1 = __importStar(require("../../database/models/room.model"));
const mongodb_1 = require("mongodb");
const date_1 = require("../../utils/helper/date");
const RazorPayService_1 = __importDefault(require("../../services/RazorPayService"));
const user_model_1 = __importStar(require("../../database/models/user.model"));
const anonymousUser_model_1 = require("../../database/models/anonymousUser.model");
const common_1 = require("../../common");
const promoCode_model_1 = __importStar(require("../../database/models/promoCode.model"));
const moment_1 = __importDefault(require("moment"));
const pdfkit_1 = __importDefault(require("pdfkit"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const file_uploading_1 = require("../../middleware/file-uploading");
const inventory_model_1 = __importStar(require("../../database/models/inventory.model"));
const EmailNotificationService_1 = __importDefault(require("../../services/EmailNotificationService"));
const AppNotificationController_1 = __importDefault(require("../AppNotificationController"));
const notification_model_1 = __importStar(require("../../database/models/notification.model"));
const razorPayService = new RazorPayService_1.default();
const NOT_FOUND = "Booking not found.";
const FETCHED = "Bookings fetched.";
const CREATED = "Amenity created.";
const UPDATED = "Amenity updated.";
const DELETED = "Amenity deleted.";
const RETRIEVED = "Booking fetched.";
exports.GST_PERCENTAGE = 18;
//FIXME for  (businessType === BusinessTypeEnum.HOTEL || businessType === BusinessTypeEnum.HOME_STAYS)
const checkIn = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g;
    try {
        const { id, accountType } = request.user;
        const { checkIn, checkOut, adults, children, businessProfileID, childrenAge, isTravellingWithPet } = request.body;
        const [maxOccupancy, maxAdults, maxChildren, businessTypeID, user, availability] = yield Promise.all([
            room_model_1.default.find({ businessProfileID: businessProfileID, availability: true }).distinct("maxOccupancy"),
            room_model_1.default.find({ businessProfileID: businessProfileID, availability: true }).distinct("adults"),
            room_model_1.default.find({ businessProfileID: businessProfileID, availability: true }).distinct("children"),
            businessType_model_1.default.distinct("_id", { name: { $in: [BusinessTypeSeeder_1.BusinessType.HOTEL, BusinessTypeSeeder_1.BusinessType.HOME_STAYS] } }),
            user_model_1.default.findOne({ _id: id }),
            (0, inventory_model_1.checkRoomsAvailability)(businessProfileID, checkIn, checkOut)
        ]);
        if (!user) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        if (user && user.accountType === anonymousUser_model_1.AccountType.BUSINESS) {
            return response.send((0, response_1.httpForbidden)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.UNAUTHORIZED_ACCESS_ERROR), error_1.ErrorMessage.UNAUTHORIZED_ACCESS_ERROR));
        }
        const totalAdults = parseInt(adults);
        const totalChildren = parseInt(children);
        const totalPeople = parseInt(adults) + parseInt(children); // Calculate the total number of people
        if (maxOccupancy.length === 0) {
            return response.send((0, response_1.httpBadRequest)(error_1.ErrorMessage.invalidRequest("Hotel is not available for booking"), "Hotel is not available for booking"));
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
        const roomsRequired = Math.ceil(totalAdults / maxAdultsPerRoom); // Divide by max occupancy per room
        //Check room is available or not
        const availableRoomIDs = yield availability.filter((data) => (data === null || data === void 0 ? void 0 : data.availableRooms) >= roomsRequired).map((data) => data._id);
        console.log("totalPeople", totalPeople);
        console.log("maxOccupancy", maxOccupancy);
        console.log("maxOccupancyPerRoom", maxOccupancyPerRoom);
        console.log("maxAdultsPerRoom", maxAdultsPerRoom);
        console.log("maxChildrenPerRoom", maxChildrenPerRoom);
        console.log("roomsRequired", roomsRequired);
        console.log(availableRoomIDs);
        const [booking, businessProfileRef, availableRooms] = yield Promise.all([
            booking_model_1.default.findOne({ checkIn: { $lte: checkOut }, checkOut: { $gte: checkIn }, status: booking_model_1.BookingStatus.CREATED }),
            businessProfile_model_1.default.findOne({ _id: businessProfileID, businessTypeID: { $in: businessTypeID } }),
            room_model_1.default.aggregate([
                {
                    $match: {
                        _id: { $in: availableRoomIDs },
                        businessProfileID: new mongodb_1.ObjectId(businessProfileID),
                        // maxOccupancy: { $gte: maxOccupancyPerRoom },
                        adults: { $gte: maxAdultsPerRoom },
                        children: { $gte: maxChildrenPerRoom }
                    }
                },
                (0, room_model_1.addRoomImagesInRoom)().lookup,
                (0, room_model_1.addRoomImagesInRoom)().addRoomCoverAndThumbnailImage,
                (0, room_model_1.addAmenitiesInRoom)().lookup,
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
                                    'days': 1 // 1 for ascending, -1 for descending
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
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.BUSINESS_PROFILE_NOT_FOUND), error_1.ErrorMessage.BUSINESS_PROFILE_NOT_FOUND));
        }
        if (!booking) {
            const newBooking = new booking_model_1.default();
            newBooking.bookingID = yield (0, booking_model_1.generateNextBookingID)();
            const businessProfileAny = businessProfileRef;
            newBooking.checkIn = (0, date_1.combineDateTime)(checkIn, (_a = businessProfileAny === null || businessProfileAny === void 0 ? void 0 : businessProfileAny.checkIn) !== null && _a !== void 0 ? _a : '11:00').toString();
            newBooking.checkOut = (0, date_1.combineDateTime)(checkOut, (_b = businessProfileAny === null || businessProfileAny === void 0 ? void 0 : businessProfileAny.checkOut) !== null && _b !== void 0 ? _b : '02:00').toString();
            newBooking.userID = id;
            newBooking.children = children;
            newBooking.adults = adults;
            newBooking.businessProfileID = businessProfileID;
            newBooking.isTravellingWithPet = isTravellingWithPet;
            if (childrenAge && (0, basic_1.isArray)(childrenAge) && ((childrenAge === null || childrenAge === void 0 ? void 0 : childrenAge.length) === parseInt(children))) {
                newBooking.childrenAge = childrenAge;
            }
            const savedBooking = yield newBooking.save();
            const responseData = {
                booking: savedBooking,
                roomsRequired,
                availableRooms
            };
            return response.send((0, response_1.httpOk)(responseData, "CREATED"));
        }
        const businessProfileAny = businessProfileRef;
        booking.checkIn = (_d = (0, date_1.combineDateTime)(checkIn, (_c = businessProfileAny === null || businessProfileAny === void 0 ? void 0 : businessProfileAny.checkIn) !== null && _c !== void 0 ? _c : '11:00').toString()) !== null && _d !== void 0 ? _d : booking.checkIn;
        booking.checkOut = (_f = (0, date_1.combineDateTime)(checkOut, (_e = businessProfileAny === null || businessProfileAny === void 0 ? void 0 : businessProfileAny.checkOut) !== null && _e !== void 0 ? _e : '02:00').toString()) !== null && _f !== void 0 ? _f : booking.checkIn;
        booking.children = children !== null && children !== void 0 ? children : booking.children;
        booking.adults = adults !== null && adults !== void 0 ? adults : booking.adults;
        booking.isTravellingWithPet = isTravellingWithPet !== null && isTravellingWithPet !== void 0 ? isTravellingWithPet : booking.isTravellingWithPet;
        if (childrenAge && (0, basic_1.isArray)(childrenAge) && ((childrenAge === null || childrenAge === void 0 ? void 0 : childrenAge.length) === parseInt(children))) {
            booking.childrenAge = childrenAge;
        }
        const savedBooking = yield booking.save();
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
        };
        return response.send((0, response_1.httpOk)(responseData, "CREATED"));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_g = error.message) !== null && _g !== void 0 ? _g : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const orderPayment = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    return response.sendFile(path_1.default.join(__dirname, 'order-payment.html'));
});
//FIXME Add price check here 
const checkout = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = request.user;
        const { bookingID, roomID, quantity, bookedFor, guestDetails, promoCode, price } = request.body;
        const [booking, room, businessTypeID, user] = yield Promise.all([
            booking_model_1.default.findOne({ bookingID: bookingID, status: booking_model_1.BookingStatus.CREATED }),
            room_model_1.default.findOne({ _id: roomID }),
            businessType_model_1.default.distinct("_id", { $in: [BusinessTypeSeeder_1.BusinessType.HOTEL, BusinessTypeSeeder_1.BusinessType.HOME_STAYS] }),
            user_model_1.default.findOne({ _id: id })
        ]);
        if (!user) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        if (!booking) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest("Booking not found"), "Booking not found"));
        }
        if (!room) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest("Room not found"), "Room not found"));
        }
        const availability = yield (0, inventory_model_1.checkRoomsAvailability)(booking.businessProfileID, booking.checkIn.toString(), booking.checkOut.toString());
        const isRoomAvailable = yield availability.filter((data) => { var _a; return (data === null || data === void 0 ? void 0 : data.availableRooms) >= quantity && ((_a = data === null || data === void 0 ? void 0 : data._id) === null || _a === void 0 ? void 0 : _a.toString()) === roomID; });
        console.log(availability);
        console.log(isRoomAvailable, "isRoomAvailable");
        if (isRoomAvailable && isRoomAvailable.length === 0) {
            return response.send((0, response_1.httpBadRequest)(error_1.ErrorMessage.invalidRequest("Oops! That room isn't available for the dates you picked. Try different dates or choose another room."), "Oops! That room isn't available for the dates you picked. Try different dates or choose another room."));
        }
        const nights = (0, date_1.calculateNights)(booking.checkIn.toString(), booking.checkOut.toString());
        booking.bookedRoom = {
            roomID,
            quantity,
            nights,
            price: price !== null && price !== void 0 ? price : room.pricePerNight
        };
        booking.bookedFor = bookedFor !== null && bookedFor !== void 0 ? bookedFor : booking.bookedFor;
        /*** Calculate price for checkout */
        let subtotal = booking.bookedRoom.price * booking.bookedRoom.quantity * nights;
        let gstRate = exports.GST_PERCENTAGE;
        let gst = (subtotal * gstRate) / 100;
        let convinceCharges = 0;
        let total = (gst + subtotal + convinceCharges);
        let discount = 0;
        const payment = {
            subtotal,
            convinceCharges,
            gst,
            gstRate,
            total
        };
        /**** PromoCode and price calculation  */
        if (promoCode) {
            const promocode = yield promoCode_model_1.default.findOne({ code: promoCode, type: promoCode_model_1.PromoType.BOOKING });
            if (!promocode) {
                return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.INVALID_PROMOCODE), error_1.ErrorMessage.INVALID_PROMOCODE));
            }
            if (promocode.cartValue > parseFloat(`${subtotal} `)) {
                return response.send((0, response_1.httpBadRequest)(error_1.ErrorMessage.invalidRequest(`To use this coupon minimum order value should be more than ₹ ${subtotal}.`), `To use this coupon minimum order value should be more than ₹ ${subtotal}.`));
            }
            const todayDate = new Date();
            if (promocode.validTo <= todayDate) {
                return response.send((0, response_1.httpBadRequest)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.EXPIRED_PROMOCODE), error_1.ErrorMessage.EXPIRED_PROMOCODE));
            }
            if (promocode.quantity !== -1) {
                console.log("Unlimited redeemed count");
                if (promocode.quantity <= promocode.redeemedCount) {
                    return response.send((0, response_1.httpBadRequest)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.PROMOCODE_USAGE_LIMIT_REACHED), error_1.ErrorMessage.PROMOCODE_USAGE_LIMIT_REACHED));
                }
            }
            const promoCodeData = {
                name: promocode.name,
                description: promocode.description
            };
            if (promocode.priceType === promoCode_model_1.PriceType.FIXED) {
                discount = promocode.value;
                console.log("Calculated discount fixed", discount, `${promocode.value} `, promocode.maxDiscount);
                if (discount >= promocode.maxDiscount) {
                    discount = promocode.maxDiscount;
                    console.log("Maximum discount applied", discount);
                }
                subtotal = (subtotal - discount);
                gst = (subtotal * 18) / 100;
                total = (gst + subtotal + convinceCharges);
                Object.assign(payment, { discount, gst, total, promocode: promoCodeData });
                booking.promoCode = promocode.code;
                booking.promoCodeID = promocode.id;
            }
            else {
                discount = (subtotal * promocode.value) / 100;
                console.log("Calculated discount percentage", discount, `${promocode.value}% `, promocode.maxDiscount);
                if (discount >= promocode.maxDiscount) {
                    discount = promocode.maxDiscount;
                    console.log("Maximum discount applied", discount);
                }
                subtotal = (subtotal - discount);
                gst = (subtotal * 18) / 100;
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
        };
        let razorPayOrder = null;
        razorPayOrder = yield razorPayService.createOrder(Math.round(payment.total), razorpayData);
        booking.razorPayOrderID = razorPayOrder.id;
        if (guestDetails && (0, basic_1.isArray)(guestDetails)) {
            const data = `[${guestDetails.join(",")}]`;
            booking.guestDetails = JSON.parse(data);
        }
        if (guestDetails && (0, basic_1.isString)(guestDetails)) {
            booking.guestDetails = [JSON.parse(guestDetails)];
        }
        booking.subTotal = subtotal;
        booking.tax = gst;
        booking.convinceCharge = convinceCharges;
        booking.grandTotal = total;
        booking.discount = discount;
        const [savedBooking, businessProfileRef] = yield Promise.all([
            booking.save(),
            businessProfile_model_1.default.aggregate([
                {
                    $match: { _id: room.businessProfileID, businessTypeID: { $in: businessTypeID } }
                },
                (0, user_model_1.addBusinessTypeInBusinessProfile)().lookup,
                (0, user_model_1.addBusinessTypeInBusinessProfile)().unwindLookup,
                (0, user_model_1.addBusinessSubTypeInBusinessProfile)().lookup,
                (0, user_model_1.addBusinessSubTypeInBusinessProfile)().unwindLookup,
                (0, businessProfile_model_1.addUserInBusinessProfile)().lookup,
                (0, businessProfile_model_1.addUserInBusinessProfile)().unwindLookup,
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
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.BUSINESS_PROFILE_NOT_FOUND), error_1.ErrorMessage.BUSINESS_PROFILE_NOT_FOUND));
        }
        const responseData = Object.assign(Object.assign({}, savedBooking.toJSON()), { user: {
                email: user ? user.email : "",
                name: user ? user.name : "",
                dialCode: user ? user.dialCode : "",
                phoneNumber: user ? user.phoneNumber : "",
                mobileVerified: user ? user.mobileVerified : false
            }, razorPayOrder, businessProfileRef: businessProfileRef[0], payment, room: {
                title: room.title || "",
                bedType: room.bedType || "",
            } });
        return response.send((0, response_1.httpOk)(responseData, "Checkout summary"));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_a = error.message) !== null && _a !== void 0 ? _a : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const confirmCheckout = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    try {
        const { id } = request.user;
        const { bookingID, paymentID, signature, guestDetails, bookedFor } = request.body;
        const [booking] = yield Promise.all([
            booking_model_1.default.findOne({ bookingID: bookingID, status: booking_model_1.BookingStatus.CREATED }),
        ]);
        if (!booking) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest("Booking not found"), "Booking not found"));
        }
        const [isPaymentVerified, razorPayOrder, payment, promoCode, customer, hotelManager, businessProfile, roomDetails] = yield Promise.all([
            razorPayService.verifyPayment(booking.razorPayOrderID, paymentID, signature),
            razorPayService.fetchOrder(booking.razorPayOrderID),
            razorPayService.fetchPayment(paymentID),
            promoCode_model_1.default.findOne({ code: booking.promoCode, type: promoCode_model_1.PromoType.BOOKING }),
            user_model_1.default.findOne({ _id: booking.userID }),
            user_model_1.default.findOne({ businessProfileID: booking.businessProfileID }),
            businessProfile_model_1.default.findOne({ _id: booking.businessProfileID }),
            room_model_1.default.findOne({ _id: booking.bookedRoom.roomID }),
        ]);
        if (guestDetails && (0, basic_1.isArray)(guestDetails)) {
            const data = `[${guestDetails.join(",")}]`;
            booking.guestDetails = JSON.parse(data);
        }
        if (guestDetails && (0, basic_1.isString)(guestDetails)) {
            booking.guestDetails = [JSON.parse(guestDetails)];
        }
        if (!isPaymentVerified || razorPayOrder.status !== "paid") {
            yield booking.save();
            return response.send((0, response_1.httpBadRequest)(error_1.ErrorMessage.invalidRequest("Payment not verified. please try again"), "Payment not verified. please try again"));
        }
        booking.bookedFor = bookedFor !== null && bookedFor !== void 0 ? bookedFor : booking.bookedFor;
        booking.status = booking_model_1.BookingStatus.PENDING;
        const amount = parseInt(`${payment.amount} `) / 100;
        booking.paymentDetail = {
            transactionID: payment.id,
            paymentMethod: payment.method,
            transactionAmount: (0, basic_1.parseFloatToFixed)(amount, 2)
        };
        const [savedBooking, businessType] = yield Promise.all([
            booking.save(),
            (0, user_model_1.getBusinessType)(booking.businessProfileID)
        ]);
        if (promoCode) {
            promoCode.redeemedCount = promoCode.redeemedCount + 1;
            yield promoCode.save();
        }
        const nights = booking.bookedRoom.nights;
        const roomID = booking.bookedRoom.roomID;
        const businessProfileID = booking.businessProfileID;
        const quantity = booking.bookedRoom.quantity;
        for (let i = 0; i < nights; i++) {
            const date = (0, moment_1.default)(booking.checkIn).startOf('day').add(i, 'days').format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
            for (let q = 0; q < quantity; q++) {
                const bookingInventory = new inventory_model_1.default({
                    bookingID: booking._id,
                    roomID: new mongodb_1.ObjectId(roomID),
                    date,
                    businessProfileID: new mongodb_1.ObjectId(businessProfileID),
                    isBooked: true,
                });
                yield bookingInventory.save();
            }
        }
        const responseData = Object.assign({}, savedBooking.toJSON());
        new EmailNotificationService_1.default().sendBookingEmail({
            type: savedBooking.type,
            toAddress: (_a = hotelManager === null || hotelManager === void 0 ? void 0 : hotelManager.email) !== null && _a !== void 0 ? _a : "",
            cc: [(_b = customer === null || customer === void 0 ? void 0 : customer.email) !== null && _b !== void 0 ? _b : "", (_c = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.email) !== null && _c !== void 0 ? _c : ""],
            businessName: (_d = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.name) !== null && _d !== void 0 ? _d : "",
            businessType: businessType !== null && businessType !== void 0 ? businessType : BusinessTypeSeeder_1.BusinessType.HOTEL.toString(),
            customerName: (_e = customer === null || customer === void 0 ? void 0 : customer.name) !== null && _e !== void 0 ? _e : "",
            customerEmail: (_f = customer === null || customer === void 0 ? void 0 : customer.email) !== null && _f !== void 0 ? _f : "",
            customerPhone: (_g = customer === null || customer === void 0 ? void 0 : customer.phoneNumber) !== null && _g !== void 0 ? _g : "",
            checkIn: savedBooking.checkIn,
            checkOut: savedBooking.checkOut,
            nights: savedBooking.bookedRoom.nights,
            roomType: (_h = roomDetails === null || roomDetails === void 0 ? void 0 : roomDetails.roomType) !== null && _h !== void 0 ? _h : "",
            bookingID: savedBooking.bookingID,
            adults: savedBooking.adults,
            children: savedBooking.children,
            transactionAmount: savedBooking.paymentDetail.transactionAmount,
            transactionID: savedBooking.paymentDetail.transactionID,
            paymentMethod: savedBooking.paymentDetail.paymentMethod,
            transactionDate: (0, moment_1.default)().format('ddd DD, MMM YYYY hh:mm:ss A'),
            metadata: savedBooking.metadata,
        });
        return response.send((0, response_1.httpOk)(responseData, "Your booking has been placed successfully. Our team will confirm your reservation shortly."));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_j = error.message) !== null && _j !== void 0 ? _j : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const index = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        console.log(request.url);
        console.log(request.path);
        const { id, accountType, businessProfileID, role } = request.user;
        let { pageNumber, documentLimit, query, status } = request.query;
        let businessProfile = (_a = request === null || request === void 0 ? void 0 : request.query) === null || _a === void 0 ? void 0 : _a.businessProfileID;
        let requestRole = (_b = request === null || request === void 0 ? void 0 : request.query) === null || _b === void 0 ? void 0 : _b.role;
        pageNumber = (0, basic_1.parseQueryParam)(pageNumber, 1);
        documentLimit = (0, basic_1.parseQueryParam)(documentLimit, 20);
        const dbQuery = { status: { $in: [booking_model_1.BookingStatus.PENDING, booking_model_1.BookingStatus.CONFIRMED, booking_model_1.BookingStatus.CANCELED, booking_model_1.BookingStatus.COMPLETED, booking_model_1.BookingStatus.CANCELED_BY_BUSINESS] } };
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
        if (status && status === 'all') {
            Object.assign(dbQuery, {
                status: {
                    $in: [booking_model_1.BookingStatus.CREATED, booking_model_1.BookingStatus.PENDING,
                        booking_model_1.BookingStatus.CONFIRMED, booking_model_1.BookingStatus.CANCELED, booking_model_1.BookingStatus.COMPLETED, booking_model_1.BookingStatus.CANCELED_BY_BUSINESS]
                }
            });
        }
        if (businessProfile && role === common_1.Role.ADMINISTRATOR && requestRole === common_1.Role.ADMINISTRATOR) {
            Object.assign(dbQuery, { businessProfileID: new mongodb_1.ObjectId(businessProfile) });
        }
        //Business user can only see their hotel booking
        if (accountType === anonymousUser_model_1.AccountType.BUSINESS && businessProfileID) {
            Object.assign(dbQuery, { businessProfileID: new mongodb_1.ObjectId(businessProfileID) });
        }
        if (accountType === anonymousUser_model_1.AccountType.INDIVIDUAL && !requestRole) {
            Object.assign(dbQuery, { userID: new mongodb_1.ObjectId(id) });
        }
        console.log(dbQuery);
        const [documents, totalDocument] = yield Promise.all([
            booking_model_1.default.aggregate([
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
                (0, booking_model_1.addRoomInBooking)(true).lookup,
                (0, booking_model_1.addRoomInBooking)(true).unwindLookup,
                (0, booking_model_1.addUserInBooking)().lookup,
                (0, booking_model_1.addUserInBooking)().unwindLookup,
                (0, booking_model_1.addBusinessProfileInBooking)().lookup,
                (0, booking_model_1.addBusinessProfileInBooking)().unwindLookup,
                {
                    $project: {
                        __v: 0,
                    }
                }
            ]),
            booking_model_1.default.find(dbQuery).countDocuments()
        ]);
        const totalPagesCount = Math.ceil(totalDocument / documentLimit) || 1;
        return response.send((0, response_1.httpOkExtended)(documents, FETCHED, pageNumber, totalPagesCount, totalDocument));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_c = error.message) !== null && _c !== void 0 ? _c : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const show = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const ID = (_a = request === null || request === void 0 ? void 0 : request.params) === null || _a === void 0 ? void 0 : _a.id;
        const booking = yield booking_model_1.default.aggregate([
            {
                $match: { _id: new mongodb_1.ObjectId(ID) }
            },
            (0, booking_model_1.addRoomInBooking)(true).lookup,
            (0, booking_model_1.addRoomInBooking)(true).unwindLookup,
            (0, booking_model_1.addUserInBooking)().lookup,
            (0, booking_model_1.addUserInBooking)().unwindLookup,
            (0, booking_model_1.addBusinessProfileInBooking)().lookup,
            (0, booking_model_1.addBusinessProfileInBooking)().unwindLookup,
            (0, booking_model_1.addPromoCodeInBooking)().lookup,
            (0, booking_model_1.addPromoCodeInBooking)().unwindLookup,
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
                    gstRate: exports.GST_PERCENTAGE
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
        ]);
        if (booking.length === 0) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(NOT_FOUND), NOT_FOUND));
        }
        return response.send((0, response_1.httpOk)(booking[0], RETRIEVED));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_b = error.message) !== null && _b !== void 0 ? _b : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const cancelBooking = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const ID = (_a = request === null || request === void 0 ? void 0 : request.params) === null || _a === void 0 ? void 0 : _a.id;
        const { id, accountType } = request.user;
        const booking = yield booking_model_1.default.findOne({ _id: ID, userID: id });
        if (!booking) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(NOT_FOUND), NOT_FOUND));
        }
        const checkIn = booking.checkIn;
        const freeCancelBy = (0, moment_1.default)();
        const freeCancel = (0, moment_1.default)(checkIn).subtract(5, 'days');
        const isFreeCancelValid = freeCancel.isAfter(freeCancelBy) && freeCancel.isBefore(checkIn);
        if (!isFreeCancelValid) {
            return response.send((0, response_1.httpBadRequest)(error_1.ErrorMessage.invalidRequest("Cancellation deadline has passed. You cannot cancel the booking."), "Cancellation deadline has passed. You cannot cancel the booking."));
        }
        console.log(isFreeCancelValid);
        if ([booking_model_1.BookingStatus.CREATED.toString(), booking_model_1.BookingStatus.PENDING.toString(), booking_model_1.BookingStatus.CONFIRMED.toString()].includes(booking.status)) {
            booking.status = booking_model_1.BookingStatus.CANCELED;
            yield booking.save();
            return response.send((0, response_1.httpNoContent)(null, "Your booking has been canceled successfully."));
        }
        const message = `The order has already been ${booking.status} and cannot be canceled.`;
        return response.send((0, response_1.httpBadRequest)(error_1.ErrorMessage.invalidRequest(message), message));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_b = error.message) !== null && _b !== void 0 ? _b : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const changeBookingStatus = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13, _14, _15, _16, _17, _18, _19, _20, _21, _22, _23, _24, _25, _26, _27, _28, _29, _30, _31, _32, _33, _34, _35, _36, _37, _38, _39, _40, _41, _42, _43, _44, _45, _46, _47, _48, _49, _50, _51, _52, _53, _54, _55, _56, _57, _58, _59, _60, _61, _62, _63, _64, _65, _66, _67;
    try {
        const ID = (_a = request === null || request === void 0 ? void 0 : request.params) === null || _a === void 0 ? void 0 : _a.id;
        const { id, accountType, businessProfileID } = request.user;
        const { status } = request.body;
        const nextStatus = [booking_model_1.BookingStatus.CANCELED_BY_BUSINESS.toString(), booking_model_1.BookingStatus.CONFIRMED.toString()];
        const [booking] = yield Promise.all([
            booking_model_1.default.findOne({
                _id: ID,
                businessProfileID: businessProfileID,
                status: { $in: [booking_model_1.BookingStatus.PENDING, booking_model_1.BookingStatus.CREATED] }
            })
        ]);
        if (!booking) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(NOT_FOUND), NOT_FOUND));
        }
        if (!nextStatus.includes(status)) {
            return response.send((0, response_1.httpBadRequest)(error_1.ErrorMessage.invalidRequest(`Invalid status. Possible statuses are: ${nextStatus.join(" | ")}`), `Invalid status. Possible statuses are: ${nextStatus.join(" | ")}`));
        }
        booking.status = status !== null && status !== void 0 ? status : booking.status;
        const [savedBooking, businessType, deleteResult, user, businessProfile, customer, roomDetails] = yield Promise.all([
            booking.save(),
            (0, user_model_1.getBusinessType)(booking.businessProfileID),
            notification_model_1.default.deleteMany({ type: notification_model_1.NotificationType.BOOKING, "metadata.bookingID": booking._id }), //Remove request notification fot book a table or book a banquet hall
            user_model_1.default.findOne({ businessProfileID: booking.businessProfileID }),
            businessProfile_model_1.default.findOne({ _id: booking.businessProfileID }),
            user_model_1.default.findOne({ _id: booking.userID }),
            room_model_1.default.findOne({ _id: (_b = booking === null || booking === void 0 ? void 0 : booking.bookedRoom) === null || _b === void 0 ? void 0 : _b.roomID }),
        ]);
        if (businessType && [BusinessTypeSeeder_1.BusinessType.HOTEL.toString(), BusinessTypeSeeder_1.BusinessType.HOME_STAYS.toString()].includes(businessType)) {
            if (status === booking_model_1.BookingStatus.CONFIRMED) {
                new EmailNotificationService_1.default().sendBookingConfirmationEmail({
                    type: savedBooking.type,
                    toAddress: (_c = customer === null || customer === void 0 ? void 0 : customer.email) !== null && _c !== void 0 ? _c : "",
                    cc: [(_d = user === null || user === void 0 ? void 0 : user.email) !== null && _d !== void 0 ? _d : "", (_e = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.email) !== null && _e !== void 0 ? _e : ""],
                    businessName: (_f = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.name) !== null && _f !== void 0 ? _f : "",
                    businessType: businessType !== null && businessType !== void 0 ? businessType : BusinessTypeSeeder_1.BusinessType.HOTEL.toString(),
                    businessPhone: (_g = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.phoneNumber) !== null && _g !== void 0 ? _g : "",
                    businessEmail: (_h = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.email) !== null && _h !== void 0 ? _h : "",
                    address: {
                        street: (_k = (_j = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.address) === null || _j === void 0 ? void 0 : _j.street) !== null && _k !== void 0 ? _k : "",
                        city: (_m = (_l = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.address) === null || _l === void 0 ? void 0 : _l.city) !== null && _m !== void 0 ? _m : "",
                        state: (_p = (_o = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.address) === null || _o === void 0 ? void 0 : _o.state) !== null && _p !== void 0 ? _p : "",
                        zipCode: (_r = (_q = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.address) === null || _q === void 0 ? void 0 : _q.zipCode) !== null && _r !== void 0 ? _r : "",
                        country: (_t = (_s = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.address) === null || _s === void 0 ? void 0 : _s.country) !== null && _t !== void 0 ? _t : "",
                    },
                    customerName: (_u = customer === null || customer === void 0 ? void 0 : customer.name) !== null && _u !== void 0 ? _u : "",
                    customerEmail: (_v = customer === null || customer === void 0 ? void 0 : customer.email) !== null && _v !== void 0 ? _v : "",
                    customerPhone: (_w = customer === null || customer === void 0 ? void 0 : customer.phoneNumber) !== null && _w !== void 0 ? _w : "",
                    checkIn: savedBooking.checkIn,
                    checkOut: savedBooking.checkOut,
                    nights: savedBooking.bookedRoom.nights,
                    roomType: (_x = roomDetails === null || roomDetails === void 0 ? void 0 : roomDetails.roomType) !== null && _x !== void 0 ? _x : "",
                    bookingID: savedBooking.bookingID,
                    adults: savedBooking.adults,
                    children: savedBooking.children,
                    transactionAmount: savedBooking.paymentDetail.transactionAmount,
                    transactionID: savedBooking.paymentDetail.transactionID,
                    paymentMethod: savedBooking.paymentDetail.paymentMethod,
                    transactionDate: (0, moment_1.default)().format('ddd DD, MMM YYYY hh:mm:ss A'),
                    metadata: savedBooking.metadata,
                });
            }
            if (status === booking_model_1.BookingStatus.CANCELED_BY_BUSINESS) {
                new EmailNotificationService_1.default().sendBookingCancellationEmail({
                    type: savedBooking.type,
                    toAddress: (_y = customer === null || customer === void 0 ? void 0 : customer.email) !== null && _y !== void 0 ? _y : "",
                    cc: [(_z = user === null || user === void 0 ? void 0 : user.email) !== null && _z !== void 0 ? _z : "", (_0 = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.email) !== null && _0 !== void 0 ? _0 : ""],
                    businessName: (_1 = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.name) !== null && _1 !== void 0 ? _1 : "",
                    businessPhone: (_2 = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.phoneNumber) !== null && _2 !== void 0 ? _2 : "",
                    businessEmail: (_3 = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.email) !== null && _3 !== void 0 ? _3 : "",
                    customerName: (_4 = customer === null || customer === void 0 ? void 0 : customer.name) !== null && _4 !== void 0 ? _4 : "",
                    customerEmail: (_5 = customer === null || customer === void 0 ? void 0 : customer.email) !== null && _5 !== void 0 ? _5 : "",
                    customerPhone: (_6 = customer === null || customer === void 0 ? void 0 : customer.phoneNumber) !== null && _6 !== void 0 ? _6 : "",
                    checkIn: savedBooking.checkIn,
                    checkOut: savedBooking.checkOut,
                    nights: savedBooking.bookedRoom.nights,
                    roomType: (_7 = roomDetails === null || roomDetails === void 0 ? void 0 : roomDetails.roomType) !== null && _7 !== void 0 ? _7 : "",
                    bookingID: savedBooking.bookingID,
                    adults: savedBooking.adults,
                    children: savedBooking.children,
                    metadata: savedBooking.metadata,
                });
            }
            const metadata = (booking === null || booking === void 0 ? void 0 : booking.metadata) ? booking === null || booking === void 0 ? void 0 : booking.metadata : "";
            AppNotificationController_1.default.store(id, booking.userID, notification_model_1.NotificationType.BOOKING, {
                bookingID: savedBooking._id,
                businessType: businessType !== null && businessType !== void 0 ? businessType : BusinessTypeSeeder_1.BusinessType.RESTAURANT.toString(),
                type: savedBooking.type,
                typeOfEvent: (_8 = metadata === null || metadata === void 0 ? void 0 : metadata.typeOfEvent) !== null && _8 !== void 0 ? _8 : "",
                status: status,
                bookingRef: booking.bookingID
            }).catch((error) => console.error(error));
        }
        if (businessType && [BusinessTypeSeeder_1.BusinessType.RESTAURANT.toString(), BusinessTypeSeeder_1.BusinessType.BARS_CLUBS.toString()].includes(businessType)) {
            if (status === booking_model_1.BookingStatus.CONFIRMED) {
                new EmailNotificationService_1.default().sendBookingConfirmationEmail({
                    type: savedBooking.type,
                    toAddress: (_9 = customer === null || customer === void 0 ? void 0 : customer.email) !== null && _9 !== void 0 ? _9 : "",
                    cc: [(_10 = user === null || user === void 0 ? void 0 : user.email) !== null && _10 !== void 0 ? _10 : "", (_11 = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.email) !== null && _11 !== void 0 ? _11 : ""],
                    businessName: (_12 = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.name) !== null && _12 !== void 0 ? _12 : "",
                    businessType: businessType !== null && businessType !== void 0 ? businessType : BusinessTypeSeeder_1.BusinessType.HOTEL.toString(),
                    businessPhone: (_13 = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.phoneNumber) !== null && _13 !== void 0 ? _13 : "",
                    businessEmail: (_14 = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.email) !== null && _14 !== void 0 ? _14 : "",
                    address: {
                        street: (_16 = (_15 = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.address) === null || _15 === void 0 ? void 0 : _15.street) !== null && _16 !== void 0 ? _16 : "",
                        city: (_18 = (_17 = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.address) === null || _17 === void 0 ? void 0 : _17.city) !== null && _18 !== void 0 ? _18 : "",
                        state: (_20 = (_19 = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.address) === null || _19 === void 0 ? void 0 : _19.state) !== null && _20 !== void 0 ? _20 : "",
                        zipCode: (_22 = (_21 = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.address) === null || _21 === void 0 ? void 0 : _21.zipCode) !== null && _22 !== void 0 ? _22 : "",
                        country: (_24 = (_23 = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.address) === null || _23 === void 0 ? void 0 : _23.country) !== null && _24 !== void 0 ? _24 : "",
                    },
                    customerName: (_25 = customer === null || customer === void 0 ? void 0 : customer.name) !== null && _25 !== void 0 ? _25 : "",
                    customerEmail: (_26 = customer === null || customer === void 0 ? void 0 : customer.email) !== null && _26 !== void 0 ? _26 : "",
                    customerPhone: (_27 = customer === null || customer === void 0 ? void 0 : customer.phoneNumber) !== null && _27 !== void 0 ? _27 : "",
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
                    transactionDate: (0, moment_1.default)().format('ddd DD, MMM YYYY hh:mm:ss A'),
                    metadata: savedBooking.metadata,
                });
            }
            if (status === booking_model_1.BookingStatus.CANCELED_BY_BUSINESS) {
                new EmailNotificationService_1.default().sendBookingCancellationEmail({
                    type: savedBooking.type,
                    toAddress: (_28 = customer === null || customer === void 0 ? void 0 : customer.email) !== null && _28 !== void 0 ? _28 : "",
                    cc: [(_29 = user === null || user === void 0 ? void 0 : user.email) !== null && _29 !== void 0 ? _29 : "", (_30 = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.email) !== null && _30 !== void 0 ? _30 : ""],
                    businessName: (_31 = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.name) !== null && _31 !== void 0 ? _31 : "",
                    businessPhone: (_32 = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.phoneNumber) !== null && _32 !== void 0 ? _32 : "",
                    businessEmail: (_33 = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.email) !== null && _33 !== void 0 ? _33 : "",
                    customerName: (_34 = customer === null || customer === void 0 ? void 0 : customer.name) !== null && _34 !== void 0 ? _34 : "",
                    customerEmail: (_35 = customer === null || customer === void 0 ? void 0 : customer.email) !== null && _35 !== void 0 ? _35 : "",
                    customerPhone: (_36 = customer === null || customer === void 0 ? void 0 : customer.phoneNumber) !== null && _36 !== void 0 ? _36 : "",
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
            const metadata = (booking === null || booking === void 0 ? void 0 : booking.metadata) ? booking === null || booking === void 0 ? void 0 : booking.metadata : "";
            AppNotificationController_1.default.store(id, booking.userID, notification_model_1.NotificationType.BOOKING, {
                bookingID: savedBooking._id,
                businessType: businessType !== null && businessType !== void 0 ? businessType : BusinessTypeSeeder_1.BusinessType.RESTAURANT.toString(),
                type: savedBooking.type,
                typeOfEvent: (_37 = metadata === null || metadata === void 0 ? void 0 : metadata.typeOfEvent) !== null && _37 !== void 0 ? _37 : "",
                status: status,
                bookingRef: booking.bookingID
            }).catch((error) => console.error(error));
        }
        if (businessType && [BusinessTypeSeeder_1.BusinessType.MARRIAGE_BANQUETS.toString()].includes(businessType)) {
            console.log(BusinessTypeSeeder_1.BusinessType.MARRIAGE_BANQUETS, status === booking_model_1.BookingStatus.CONFIRMED);
            if (status === booking_model_1.BookingStatus.CONFIRMED) {
                new EmailNotificationService_1.default().sendBookingConfirmationEmail({
                    type: savedBooking.type,
                    toAddress: (_38 = customer === null || customer === void 0 ? void 0 : customer.email) !== null && _38 !== void 0 ? _38 : "",
                    cc: [(_39 = user === null || user === void 0 ? void 0 : user.email) !== null && _39 !== void 0 ? _39 : "", (_40 = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.email) !== null && _40 !== void 0 ? _40 : ""],
                    businessName: (_41 = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.name) !== null && _41 !== void 0 ? _41 : "",
                    businessType: businessType !== null && businessType !== void 0 ? businessType : BusinessTypeSeeder_1.BusinessType.HOTEL.toString(),
                    businessPhone: (_42 = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.phoneNumber) !== null && _42 !== void 0 ? _42 : "",
                    businessEmail: (_43 = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.email) !== null && _43 !== void 0 ? _43 : "",
                    address: {
                        street: (_45 = (_44 = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.address) === null || _44 === void 0 ? void 0 : _44.street) !== null && _45 !== void 0 ? _45 : "",
                        city: (_47 = (_46 = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.address) === null || _46 === void 0 ? void 0 : _46.city) !== null && _47 !== void 0 ? _47 : "",
                        state: (_49 = (_48 = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.address) === null || _48 === void 0 ? void 0 : _48.state) !== null && _49 !== void 0 ? _49 : "",
                        zipCode: (_51 = (_50 = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.address) === null || _50 === void 0 ? void 0 : _50.zipCode) !== null && _51 !== void 0 ? _51 : "",
                        country: (_53 = (_52 = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.address) === null || _52 === void 0 ? void 0 : _52.country) !== null && _53 !== void 0 ? _53 : "",
                    },
                    customerName: (_54 = customer === null || customer === void 0 ? void 0 : customer.name) !== null && _54 !== void 0 ? _54 : "",
                    customerEmail: (_55 = customer === null || customer === void 0 ? void 0 : customer.email) !== null && _55 !== void 0 ? _55 : "",
                    customerPhone: (_56 = customer === null || customer === void 0 ? void 0 : customer.phoneNumber) !== null && _56 !== void 0 ? _56 : "",
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
                    transactionDate: (0, moment_1.default)().format('ddd DD, MMM YYYY hh:mm:ss A'),
                    metadata: savedBooking.metadata,
                });
            }
            if (status === booking_model_1.BookingStatus.CANCELED_BY_BUSINESS) {
                new EmailNotificationService_1.default().sendBookingCancellationEmail({
                    type: savedBooking.type,
                    toAddress: (_57 = customer === null || customer === void 0 ? void 0 : customer.email) !== null && _57 !== void 0 ? _57 : "",
                    cc: [(_58 = user === null || user === void 0 ? void 0 : user.email) !== null && _58 !== void 0 ? _58 : "", (_59 = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.email) !== null && _59 !== void 0 ? _59 : ""],
                    businessName: (_60 = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.name) !== null && _60 !== void 0 ? _60 : "",
                    businessPhone: (_61 = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.phoneNumber) !== null && _61 !== void 0 ? _61 : "",
                    businessEmail: (_62 = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.email) !== null && _62 !== void 0 ? _62 : "",
                    customerName: (_63 = customer === null || customer === void 0 ? void 0 : customer.name) !== null && _63 !== void 0 ? _63 : "",
                    customerEmail: (_64 = customer === null || customer === void 0 ? void 0 : customer.email) !== null && _64 !== void 0 ? _64 : "",
                    customerPhone: (_65 = customer === null || customer === void 0 ? void 0 : customer.phoneNumber) !== null && _65 !== void 0 ? _65 : "",
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
            const metadata = (booking === null || booking === void 0 ? void 0 : booking.metadata) ? booking === null || booking === void 0 ? void 0 : booking.metadata : "";
            AppNotificationController_1.default.store(id, booking.userID, notification_model_1.NotificationType.BOOKING, {
                bookingID: savedBooking._id,
                businessType: businessType !== null && businessType !== void 0 ? businessType : BusinessTypeSeeder_1.BusinessType.RESTAURANT.toString(),
                type: savedBooking.type,
                typeOfEvent: (_66 = metadata === null || metadata === void 0 ? void 0 : metadata.typeOfEvent) !== null && _66 !== void 0 ? _66 : "",
                status: status,
                bookingRef: booking.bookingID
            }).catch((error) => console.error(error));
        }
        return response.send((0, response_1.httpNoContent)(null, "Booking status updated successfully."));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_67 = error.message) !== null && _67 !== void 0 ? _67 : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const downloadInvoice = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    try {
        const ID = (_a = request === null || request === void 0 ? void 0 : request.params) === null || _a === void 0 ? void 0 : _a.id;
        const { id, accountType } = request.user;
        const booking = yield booking_model_1.default.findOne({ _id: ID, userID: id });
        if (!booking) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(NOT_FOUND), NOT_FOUND));
        }
        const [user, room] = yield Promise.all([
            user_model_1.default.findOne({ _id: booking.userID }),
            room_model_1.default.findOne({ _id: booking.bookedRoom.roomID })
        ]);
        const pdf = new pdfkit_1.default();
        const filename = `invoice-${booking.bookingID}.pdf`;
        const filePath = path_1.default.join(`${file_uploading_1.PUBLIC_DIR}/invoices`, filename);
        pdf.pipe(fs_1.default.createWriteStream(filePath));
        pdf.image(`data:image/png;base64,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`, 50, 50, { width: 50, align: "center" });
        // Title
        pdf.fontSize(20).text('The Hotel Media', 100, 70, { align: 'left' });
        // Invoice Information
        pdf.fontSize(12).text(`Invoice Number:   ${booking.bookingID}`, { align: "right" });
        pdf.text('\n');
        pdf.text('\n');
        pdf.fontSize(11).text(`Booking Information`);
        pdf.fontSize(10).text(`Customer Name:   ${(_b = user === null || user === void 0 ? void 0 : user.name) !== null && _b !== void 0 ? _b : ''}`);
        pdf.fontSize(10).text(`Booking Reference:   ${booking.bookingID}`);
        pdf.fontSize(10).text(`Date:   ${(0, moment_1.default)(booking.createdAt).format('ddd DD, MMM YYYY hh:mm:ss A')}`);
        pdf.text('\n');
        pdf.fontSize(10).text(`Check In:   ${(_c = (0, moment_1.default)(booking.checkIn).format('ddd DD, MMM YYYY hh:mm:ss A')) !== null && _c !== void 0 ? _c : ''}`);
        pdf.fontSize(10).text(`Number of Nights:   ${(_e = (_d = booking === null || booking === void 0 ? void 0 : booking.bookedRoom) === null || _d === void 0 ? void 0 : _d.nights) !== null && _e !== void 0 ? _e : ''}`);
        pdf.fontSize(10).text(`Check Out:   ${(_f = (0, moment_1.default)(booking.checkOut).format('ddd DD, MMM YYYY hh:mm:ss A')) !== null && _f !== void 0 ? _f : ''}`);
        pdf.fontSize(10).text(`Room Type:   ${(_h = (_g = room === null || room === void 0 ? void 0 : room.roomType) === null || _g === void 0 ? void 0 : _g.toUpperCase()) !== null && _h !== void 0 ? _h : ''}`);
        // Table of Items
        pdf.text('\n');
        pdf.text('\n');
        pdf.text('\n');
        pdf.fontSize(10).text('--------------------------------------------------------------------------------------------------------------------------');
        pdf.text('Description          Quantity          Price          Total');
        pdf.fontSize(10).text('--------------------------------------------------------------------------------------------------------------------------');
        pdf.fontSize(8).text(`${(_j = room === null || room === void 0 ? void 0 : room.roomType) === null || _j === void 0 ? void 0 : _j.toUpperCase()} Room\n${room === null || room === void 0 ? void 0 : room.title}          ${booking.bookedRoom.quantity}          ${booking.bookedRoom.price} INR          ${booking.bookedRoom.quantity * booking.bookedRoom.price} INR`);
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
        const fileObject = {
            filename: filename,
            filepath: `${hostAddress}/${filePath}`,
            type: "application/pdf",
        };
        return response.send((0, response_1.httpOk)(fileObject, "Invoice downloaded successfully."));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_k = error.message) !== null && _k !== void 0 ? _k : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const bookTable = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
    try {
        const { id, accountType } = request.user;
        const { numberOfGuests, date, time, businessProfileID } = request.body;
        const [user, businessProfile, customer] = yield Promise.all([
            user_model_1.default.findOne({ businessProfileID: businessProfileID }),
            businessProfile_model_1.default.findOne({ _id: businessProfileID }),
            user_model_1.default.findOne({ _id: id })
        ]);
        if (!user || !businessProfile) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        if (user.accountType && user.accountType !== anonymousUser_model_1.AccountType.BUSINESS) {
            return response.send((0, response_1.httpForbidden)(error_1.ErrorMessage.invalidRequest("Access Denied! This is not a business account."), "Access Denied! This is not a business account."));
        }
        const businessType = yield (0, user_model_1.getBusinessType)(user.businessProfileID);
        if (businessType && ![BusinessTypeSeeder_1.BusinessType.RESTAURANT.toString(), BusinessTypeSeeder_1.BusinessType.BARS_CLUBS.toString()].includes(businessType)) {
            return response.send((0, response_1.httpForbidden)(error_1.ErrorMessage.invalidRequest("Access Denied! Only restaurants can accept table bookings."), "Access Denied! Only restaurants can accept table bookings."));
        }
        const checkIn = (0, date_1.combineDateTime)(date, time).toString();
        const [booking] = yield Promise.all([
            booking_model_1.default.findOne({
                checkIn: { $lte: checkIn },
                checkOut: { $gte: checkIn },
                businessProfileID: businessProfile.id,
                status: { $in: [booking_model_1.BookingStatus.CREATED, booking_model_1.BookingStatus.PENDING] },
                type: booking_model_1.BookingType.BOOK_TABLE
            })
        ]);
        if (!booking) {
            const newBooking = new booking_model_1.default();
            newBooking.bookingID = yield (0, booking_model_1.generateNextBookingID)();
            newBooking.checkIn = checkIn;
            newBooking.checkOut = checkIn;
            newBooking.userID = id;
            newBooking.children = 0;
            newBooking.adults = numberOfGuests;
            newBooking.isTravellingWithPet = false;
            newBooking.businessProfileID = businessProfileID;
            newBooking.status = booking_model_1.BookingStatus.PENDING;
            newBooking.type = booking_model_1.BookingType.BOOK_TABLE;
            const savedBooking = yield newBooking.save();
            new EmailNotificationService_1.default().sendBookingEmail({
                type: savedBooking.type,
                toAddress: (_a = user === null || user === void 0 ? void 0 : user.email) !== null && _a !== void 0 ? _a : "",
                cc: [(_b = customer === null || customer === void 0 ? void 0 : customer.email) !== null && _b !== void 0 ? _b : "", (_c = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.email) !== null && _c !== void 0 ? _c : ""],
                businessName: (_d = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.name) !== null && _d !== void 0 ? _d : "",
                businessType: businessType !== null && businessType !== void 0 ? businessType : BusinessTypeSeeder_1.BusinessType.RESTAURANT.toString(),
                customerName: (_e = customer === null || customer === void 0 ? void 0 : customer.name) !== null && _e !== void 0 ? _e : "",
                customerEmail: (_f = customer === null || customer === void 0 ? void 0 : customer.email) !== null && _f !== void 0 ? _f : "",
                customerPhone: (_g = customer === null || customer === void 0 ? void 0 : customer.phoneNumber) !== null && _g !== void 0 ? _g : "",
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
                transactionDate: (0, moment_1.default)().format('ddd DD, MMM YYYY hh:mm:ss A'),
                metadata: savedBooking.metadata,
            });
            /***Send Notification */
            AppNotificationController_1.default.store(id, user.id, notification_model_1.NotificationType.BOOKING, {
                bookingID: newBooking._id,
                businessType: businessType !== null && businessType !== void 0 ? businessType : BusinessTypeSeeder_1.BusinessType.RESTAURANT.toString(),
                type: newBooking.type,
                checkIn: newBooking.checkIn,
            }).catch((error) => console.error(error));
            return response.send((0, response_1.httpOk)(savedBooking, "Table booking successful! We look forward to serving you."));
        }
        booking.checkIn = checkIn;
        booking.checkOut = checkIn;
        booking.adults = numberOfGuests;
        booking.status = booking_model_1.BookingStatus.PENDING;
        booking.type = booking_model_1.BookingType.BOOK_TABLE;
        const savedBooking = yield booking.save();
        new EmailNotificationService_1.default().sendBookingEmail({
            type: savedBooking.type,
            toAddress: (_h = user === null || user === void 0 ? void 0 : user.email) !== null && _h !== void 0 ? _h : "",
            cc: [(_j = customer === null || customer === void 0 ? void 0 : customer.email) !== null && _j !== void 0 ? _j : "", (_k = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.email) !== null && _k !== void 0 ? _k : ""],
            businessName: (_l = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.name) !== null && _l !== void 0 ? _l : "",
            customerName: (_m = customer === null || customer === void 0 ? void 0 : customer.name) !== null && _m !== void 0 ? _m : "",
            customerEmail: (_o = customer === null || customer === void 0 ? void 0 : customer.email) !== null && _o !== void 0 ? _o : "",
            customerPhone: (_p = customer === null || customer === void 0 ? void 0 : customer.phoneNumber) !== null && _p !== void 0 ? _p : "",
            checkIn: savedBooking.checkIn,
            checkOut: savedBooking.checkOut,
            nights: 0,
            roomType: "",
            businessType: businessType !== null && businessType !== void 0 ? businessType : BusinessTypeSeeder_1.BusinessType.RESTAURANT.toString(),
            bookingID: savedBooking.bookingID,
            adults: savedBooking.adults,
            children: savedBooking.children,
            transactionAmount: 0,
            transactionID: "",
            paymentMethod: "",
            transactionDate: (0, moment_1.default)().format('ddd DD, MMM YYYY hh:mm:ss A'),
            metadata: savedBooking.metadata,
        });
        return response.send((0, response_1.httpOk)(savedBooking, "Table booking successful! We look forward to serving you."));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_q = error.message) !== null && _q !== void 0 ? _q : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const bookBanquet = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
    try {
        const { id, accountType } = request.user;
        const { numberOfGuests, checkIn, checkOut, businessProfileID, typeOfEvent } = request.body;
        const [user, businessProfile, customer] = yield Promise.all([
            user_model_1.default.findOne({ businessProfileID: businessProfileID }),
            businessProfile_model_1.default.findOne({ _id: businessProfileID }),
            user_model_1.default.findOne({ _id: id })
        ]);
        if (!user || !businessProfile) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(error_1.ErrorMessage.USER_NOT_FOUND), error_1.ErrorMessage.USER_NOT_FOUND));
        }
        if (user.accountType && user.accountType !== anonymousUser_model_1.AccountType.BUSINESS) {
            return response.send((0, response_1.httpForbidden)(error_1.ErrorMessage.invalidRequest("Access Denied! This is not a business account."), "Access Denied! This is not a business account."));
        }
        const businessType = yield (0, user_model_1.getBusinessType)(user.businessProfileID);
        if (businessType && (businessType !== BusinessTypeSeeder_1.BusinessType.MARRIAGE_BANQUETS)) {
            return response.send((0, response_1.httpForbidden)(error_1.ErrorMessage.invalidRequest("Access Denied! Only Marriage Banquets can accept bookings."), "Access Denied! Only Marriage Banquets can accept bookings."));
        }
        const checkInTime = (0, date_1.combineDateTime)(checkIn, "00:00").toString();
        const checkOutTime = (0, date_1.combineDateTime)(checkOut, "00:00").toString();
        const [booking] = yield Promise.all([
            booking_model_1.default.findOne({
                checkIn: { $lte: checkInTime },
                checkOut: { $gte: checkOutTime },
                businessProfileID: businessProfile.id,
                status: { $in: [booking_model_1.BookingStatus.CREATED, booking_model_1.BookingStatus.PENDING] },
                type: booking_model_1.BookingType.BOOK_BANQUET
            })
        ]);
        if (!booking) {
            const newBooking = new booking_model_1.default();
            newBooking.bookingID = yield (0, booking_model_1.generateNextBookingID)();
            newBooking.checkIn = checkInTime;
            newBooking.checkOut = checkOutTime;
            newBooking.userID = id;
            newBooking.children = 0;
            newBooking.adults = numberOfGuests;
            newBooking.businessProfileID = businessProfileID;
            newBooking.isTravellingWithPet = false;
            newBooking.status = booking_model_1.BookingStatus.PENDING;
            newBooking.type = booking_model_1.BookingType.BOOK_BANQUET;
            newBooking.metadata = { typeOfEvent: typeOfEvent };
            const savedBooking = yield newBooking.save();
            new EmailNotificationService_1.default().sendBookingEmail({
                type: savedBooking.type,
                toAddress: (_a = user === null || user === void 0 ? void 0 : user.email) !== null && _a !== void 0 ? _a : "",
                cc: [(_b = customer === null || customer === void 0 ? void 0 : customer.email) !== null && _b !== void 0 ? _b : "", (_c = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.email) !== null && _c !== void 0 ? _c : ""],
                businessName: (_d = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.name) !== null && _d !== void 0 ? _d : "",
                businessType: businessType !== null && businessType !== void 0 ? businessType : BusinessTypeSeeder_1.BusinessType.MARRIAGE_BANQUETS.toString(),
                customerName: (_e = customer === null || customer === void 0 ? void 0 : customer.name) !== null && _e !== void 0 ? _e : "",
                customerEmail: (_f = customer === null || customer === void 0 ? void 0 : customer.email) !== null && _f !== void 0 ? _f : "",
                customerPhone: (_g = customer === null || customer === void 0 ? void 0 : customer.phoneNumber) !== null && _g !== void 0 ? _g : "",
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
                transactionDate: (0, moment_1.default)().format('ddd DD, MMM YYYY hh:mm:ss A'),
                metadata: savedBooking.metadata,
            });
            /***Send Notification */
            AppNotificationController_1.default.store(id, user.id, notification_model_1.NotificationType.BOOKING, {
                bookingID: newBooking._id,
                businessType: businessType !== null && businessType !== void 0 ? businessType : BusinessTypeSeeder_1.BusinessType.RESTAURANT.toString(),
                type: newBooking.type,
                typeOfEvent: typeOfEvent
            }).catch((error) => console.error(error));
            return response.send((0, response_1.httpOk)(savedBooking, "Banquet booking successful! We look forward to serving you."));
        }
        booking.checkIn = checkInTime;
        booking.checkOut = checkOutTime;
        booking.adults = numberOfGuests;
        booking.status = booking_model_1.BookingStatus.PENDING;
        booking.type = booking_model_1.BookingType.BOOK_BANQUET;
        booking.metadata = { typeOfEvent: typeOfEvent };
        const savedBooking = yield booking.save();
        new EmailNotificationService_1.default().sendBookingEmail({
            type: savedBooking.type,
            toAddress: (_h = user === null || user === void 0 ? void 0 : user.email) !== null && _h !== void 0 ? _h : "",
            cc: [(_j = customer === null || customer === void 0 ? void 0 : customer.email) !== null && _j !== void 0 ? _j : "", (_k = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.email) !== null && _k !== void 0 ? _k : ""],
            businessType: businessType !== null && businessType !== void 0 ? businessType : BusinessTypeSeeder_1.BusinessType.MARRIAGE_BANQUETS.toString(),
            businessName: (_l = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.name) !== null && _l !== void 0 ? _l : "",
            customerName: (_m = customer === null || customer === void 0 ? void 0 : customer.name) !== null && _m !== void 0 ? _m : "",
            customerEmail: (_o = customer === null || customer === void 0 ? void 0 : customer.email) !== null && _o !== void 0 ? _o : "",
            customerPhone: (_p = customer === null || customer === void 0 ? void 0 : customer.phoneNumber) !== null && _p !== void 0 ? _p : "",
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
            transactionDate: (0, moment_1.default)().format('ddd DD, MMM YYYY hh:mm:ss A'),
            metadata: savedBooking.metadata,
        });
        return response.send((0, response_1.httpOk)(savedBooking, "Banquet booking successful! We look forward to serving you."));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_q = error.message) !== null && _q !== void 0 ? _q : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
exports.default = { checkIn, checkout, confirmCheckout, index, show, cancelBooking, downloadInvoice, bookTable, bookBanquet, orderPayment, changeBookingStatus };
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
