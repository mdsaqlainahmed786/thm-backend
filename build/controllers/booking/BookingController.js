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
    var _h;
    try {
        const { id } = request.user;
        const { bookingID, roomID, quantity, bookedFor, guestDetails, promoCode, price } = request.body;
        const [booking, room, businessTypeHotel, businessTypeIDs, user] = yield Promise.all([
            booking_model_1.default.findOne({ bookingID: bookingID, status: booking_model_1.BookingStatus.CREATED }),
            room_model_1.default.findOne({ _id: roomID }),
            businessType_model_1.default.findOne({ name: BusinessTypeSeeder_1.BusinessType.HOTEL }),
            businessType_model_1.default.distinct("_id", { name: { $in: [BusinessTypeSeeder_1.BusinessType.HOTEL, BusinessTypeSeeder_1.BusinessType.HOME_STAYS] } }),
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
        const businessProfile = yield businessProfile_model_1.default.findOne({ _id: room.businessProfileID });
        const isHotel = businessProfile && businessTypeHotel && businessProfile.businessTypeID.toString() === businessTypeHotel._id.toString();
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
        let convinceCharges = isHotel ? (subtotal * 0.02) : 0;
        let gstRate = exports.GST_PERCENTAGE;
        let gst = ((subtotal + convinceCharges) * gstRate) / 100;
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
                gst = ((subtotal + convinceCharges) * exports.GST_PERCENTAGE) / 100;
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
                gst = ((subtotal + convinceCharges) * exports.GST_PERCENTAGE) / 100;
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
        booking.subTotal = subtotal + convinceCharges;
        booking.tax = gst;
        booking.convinceCharge = convinceCharges;
        booking.grandTotal = total;
        booking.discount = discount;
        const [savedBooking, businessProfileRef] = yield Promise.all([
            booking.save(),
            businessProfile_model_1.default.aggregate([
                {
                    $match: { _id: room.businessProfileID, businessTypeID: { $in: businessTypeIDs } }
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
        next((0, response_1.httpInternalServerError)(error, (_h = error.message) !== null && _h !== void 0 ? _h : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const confirmCheckout = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _j, _k, _l, _m, _o, _p, _q, _r, _s;
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
            toAddress: (_j = hotelManager === null || hotelManager === void 0 ? void 0 : hotelManager.email) !== null && _j !== void 0 ? _j : "",
            cc: [(_k = customer === null || customer === void 0 ? void 0 : customer.email) !== null && _k !== void 0 ? _k : "", (_l = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.email) !== null && _l !== void 0 ? _l : ""],
            businessName: (_m = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.name) !== null && _m !== void 0 ? _m : "",
            businessType: businessType !== null && businessType !== void 0 ? businessType : BusinessTypeSeeder_1.BusinessType.HOTEL.toString(),
            customerName: (_o = customer === null || customer === void 0 ? void 0 : customer.name) !== null && _o !== void 0 ? _o : "",
            customerEmail: (_p = customer === null || customer === void 0 ? void 0 : customer.email) !== null && _p !== void 0 ? _p : "",
            customerPhone: (_q = customer === null || customer === void 0 ? void 0 : customer.phoneNumber) !== null && _q !== void 0 ? _q : "",
            checkIn: savedBooking.checkIn,
            checkOut: savedBooking.checkOut,
            nights: savedBooking.bookedRoom.nights,
            roomType: (_r = roomDetails === null || roomDetails === void 0 ? void 0 : roomDetails.roomType) !== null && _r !== void 0 ? _r : "",
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
        next((0, response_1.httpInternalServerError)(error, (_s = error.message) !== null && _s !== void 0 ? _s : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const index = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _t, _u, _v;
    try {
        console.log(request.url);
        console.log(request.path);
        const { id, accountType, businessProfileID, role } = request.user;
        let { pageNumber, documentLimit, query, status } = request.query;
        let businessProfile = (_t = request === null || request === void 0 ? void 0 : request.query) === null || _t === void 0 ? void 0 : _t.businessProfileID;
        let requestRole = (_u = request === null || request === void 0 ? void 0 : request.query) === null || _u === void 0 ? void 0 : _u.role;
        pageNumber = (0, basic_1.parseQueryParam)(pageNumber, 1);
        documentLimit = (0, basic_1.parseQueryParam)(documentLimit, 20);
        const dbQuery = { status: { $in: [booking_model_1.BookingStatus.PENDING, booking_model_1.BookingStatus.CONFIRMED, booking_model_1.BookingStatus.CANCELED, booking_model_1.BookingStatus.COMPLETED, booking_model_1.BookingStatus.CANCELED_BY_BUSINESS, booking_model_1.BookingStatus.CANCELED_BY_USER] } };
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
                        booking_model_1.BookingStatus.CONFIRMED, booking_model_1.BookingStatus.CANCELED, booking_model_1.BookingStatus.COMPLETED, booking_model_1.BookingStatus.CANCELED_BY_BUSINESS, booking_model_1.BookingStatus.CANCELED_BY_USER]
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
        next((0, response_1.httpInternalServerError)(error, (_v = error.message) !== null && _v !== void 0 ? _v : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const show = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _w, _x;
    try {
        const ID = (_w = request === null || request === void 0 ? void 0 : request.params) === null || _w === void 0 ? void 0 : _w.id;
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
        next((0, response_1.httpInternalServerError)(error, (_x = error.message) !== null && _x !== void 0 ? _x : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const cancelBooking = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _y, _z;
    try {
        const ID = (_y = request === null || request === void 0 ? void 0 : request.params) === null || _y === void 0 ? void 0 : _y.id;
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
        next((0, response_1.httpInternalServerError)(error, (_z = error.message) !== null && _z !== void 0 ? _z : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const changeBookingStatus = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13, _14, _15, _16, _17, _18, _19, _20, _21, _22, _23, _24, _25, _26, _27, _28, _29, _30, _31, _32, _33, _34, _35, _36, _37, _38, _39, _40, _41, _42, _43, _44, _45, _46, _47, _48, _49, _50, _51, _52, _53, _54, _55, _56, _57, _58, _59, _60, _61, _62, _63, _64, _65, _66, _67, _68, _69, _70, _71, _72, _73, _74, _75, _76, _77, _78, _79, _80, _81, _82, _83, _84, _85, _86, _87, _88, _89, _90, _91;
    try {
        const ID = (_0 = request === null || request === void 0 ? void 0 : request.params) === null || _0 === void 0 ? void 0 : _0.id;
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
            room_model_1.default.findOne({ _id: (_1 = booking === null || booking === void 0 ? void 0 : booking.bookedRoom) === null || _1 === void 0 ? void 0 : _1.roomID }),
        ]);
        if (businessType && [BusinessTypeSeeder_1.BusinessType.HOTEL.toString(), BusinessTypeSeeder_1.BusinessType.HOME_STAYS.toString()].includes(businessType)) {
            if (status === booking_model_1.BookingStatus.CONFIRMED) {
                new EmailNotificationService_1.default().sendBookingConfirmationEmail({
                    type: savedBooking.type,
                    toAddress: (_2 = customer === null || customer === void 0 ? void 0 : customer.email) !== null && _2 !== void 0 ? _2 : "",
                    cc: [(_3 = user === null || user === void 0 ? void 0 : user.email) !== null && _3 !== void 0 ? _3 : "", (_4 = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.email) !== null && _4 !== void 0 ? _4 : ""],
                    businessName: (_5 = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.name) !== null && _5 !== void 0 ? _5 : "",
                    businessType: businessType !== null && businessType !== void 0 ? businessType : BusinessTypeSeeder_1.BusinessType.HOTEL.toString(),
                    businessPhone: (_6 = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.phoneNumber) !== null && _6 !== void 0 ? _6 : "",
                    businessEmail: (_7 = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.email) !== null && _7 !== void 0 ? _7 : "",
                    address: {
                        street: (_9 = (_8 = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.address) === null || _8 === void 0 ? void 0 : _8.street) !== null && _9 !== void 0 ? _9 : "",
                        city: (_11 = (_10 = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.address) === null || _10 === void 0 ? void 0 : _10.city) !== null && _11 !== void 0 ? _11 : "",
                        state: (_13 = (_12 = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.address) === null || _12 === void 0 ? void 0 : _12.state) !== null && _13 !== void 0 ? _13 : "",
                        zipCode: (_15 = (_14 = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.address) === null || _14 === void 0 ? void 0 : _14.zipCode) !== null && _15 !== void 0 ? _15 : "",
                        country: (_17 = (_16 = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.address) === null || _16 === void 0 ? void 0 : _16.country) !== null && _17 !== void 0 ? _17 : "",
                    },
                    customerName: (_18 = customer === null || customer === void 0 ? void 0 : customer.name) !== null && _18 !== void 0 ? _18 : "",
                    customerEmail: (_19 = customer === null || customer === void 0 ? void 0 : customer.email) !== null && _19 !== void 0 ? _19 : "",
                    customerPhone: (_20 = customer === null || customer === void 0 ? void 0 : customer.phoneNumber) !== null && _20 !== void 0 ? _20 : "",
                    checkIn: savedBooking.checkIn,
                    checkOut: savedBooking.checkOut,
                    nights: savedBooking.bookedRoom.nights,
                    roomType: (_21 = roomDetails === null || roomDetails === void 0 ? void 0 : roomDetails.roomType) !== null && _21 !== void 0 ? _21 : "",
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
                    toAddress: (_22 = customer === null || customer === void 0 ? void 0 : customer.email) !== null && _22 !== void 0 ? _22 : "",
                    cc: [(_23 = user === null || user === void 0 ? void 0 : user.email) !== null && _23 !== void 0 ? _23 : "", (_24 = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.email) !== null && _24 !== void 0 ? _24 : ""],
                    businessName: (_25 = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.name) !== null && _25 !== void 0 ? _25 : "",
                    businessPhone: (_26 = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.phoneNumber) !== null && _26 !== void 0 ? _26 : "",
                    businessEmail: (_27 = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.email) !== null && _27 !== void 0 ? _27 : "",
                    customerName: (_28 = customer === null || customer === void 0 ? void 0 : customer.name) !== null && _28 !== void 0 ? _28 : "",
                    customerEmail: (_29 = customer === null || customer === void 0 ? void 0 : customer.email) !== null && _29 !== void 0 ? _29 : "",
                    customerPhone: (_30 = customer === null || customer === void 0 ? void 0 : customer.phoneNumber) !== null && _30 !== void 0 ? _30 : "",
                    checkIn: savedBooking.checkIn,
                    checkOut: savedBooking.checkOut,
                    nights: savedBooking.bookedRoom.nights,
                    roomType: (_31 = roomDetails === null || roomDetails === void 0 ? void 0 : roomDetails.roomType) !== null && _31 !== void 0 ? _31 : "",
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
                typeOfEvent: (_32 = metadata === null || metadata === void 0 ? void 0 : metadata.typeOfEvent) !== null && _32 !== void 0 ? _32 : "",
                status: status,
                bookingRef: booking.bookingID
            }).catch((error) => console.error(error));
        }
        if (businessType && [BusinessTypeSeeder_1.BusinessType.RESTAURANT.toString(), BusinessTypeSeeder_1.BusinessType.BARS_CLUBS.toString()].includes(businessType)) {
            if (status === booking_model_1.BookingStatus.CONFIRMED) {
                new EmailNotificationService_1.default().sendBookingConfirmationEmail({
                    type: savedBooking.type,
                    toAddress: (_33 = customer === null || customer === void 0 ? void 0 : customer.email) !== null && _33 !== void 0 ? _33 : "",
                    cc: [(_34 = user === null || user === void 0 ? void 0 : user.email) !== null && _34 !== void 0 ? _34 : "", (_35 = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.email) !== null && _35 !== void 0 ? _35 : ""],
                    businessName: (_36 = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.name) !== null && _36 !== void 0 ? _36 : "",
                    businessType: businessType !== null && businessType !== void 0 ? businessType : BusinessTypeSeeder_1.BusinessType.HOTEL.toString(),
                    businessPhone: (_37 = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.phoneNumber) !== null && _37 !== void 0 ? _37 : "",
                    businessEmail: (_38 = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.email) !== null && _38 !== void 0 ? _38 : "",
                    address: {
                        street: (_40 = (_39 = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.address) === null || _39 === void 0 ? void 0 : _39.street) !== null && _40 !== void 0 ? _40 : "",
                        city: (_42 = (_41 = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.address) === null || _41 === void 0 ? void 0 : _41.city) !== null && _42 !== void 0 ? _42 : "",
                        state: (_44 = (_43 = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.address) === null || _43 === void 0 ? void 0 : _43.state) !== null && _44 !== void 0 ? _44 : "",
                        zipCode: (_46 = (_45 = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.address) === null || _45 === void 0 ? void 0 : _45.zipCode) !== null && _46 !== void 0 ? _46 : "",
                        country: (_48 = (_47 = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.address) === null || _47 === void 0 ? void 0 : _47.country) !== null && _48 !== void 0 ? _48 : "",
                    },
                    customerName: (_49 = customer === null || customer === void 0 ? void 0 : customer.name) !== null && _49 !== void 0 ? _49 : "",
                    customerEmail: (_50 = customer === null || customer === void 0 ? void 0 : customer.email) !== null && _50 !== void 0 ? _50 : "",
                    customerPhone: (_51 = customer === null || customer === void 0 ? void 0 : customer.phoneNumber) !== null && _51 !== void 0 ? _51 : "",
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
                    toAddress: (_52 = customer === null || customer === void 0 ? void 0 : customer.email) !== null && _52 !== void 0 ? _52 : "",
                    cc: [(_53 = user === null || user === void 0 ? void 0 : user.email) !== null && _53 !== void 0 ? _53 : "", (_54 = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.email) !== null && _54 !== void 0 ? _54 : ""],
                    businessName: (_55 = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.name) !== null && _55 !== void 0 ? _55 : "",
                    businessPhone: (_56 = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.phoneNumber) !== null && _56 !== void 0 ? _56 : "",
                    businessEmail: (_57 = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.email) !== null && _57 !== void 0 ? _57 : "",
                    customerName: (_58 = customer === null || customer === void 0 ? void 0 : customer.name) !== null && _58 !== void 0 ? _58 : "",
                    customerEmail: (_59 = customer === null || customer === void 0 ? void 0 : customer.email) !== null && _59 !== void 0 ? _59 : "",
                    customerPhone: (_60 = customer === null || customer === void 0 ? void 0 : customer.phoneNumber) !== null && _60 !== void 0 ? _60 : "",
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
                typeOfEvent: (_61 = metadata === null || metadata === void 0 ? void 0 : metadata.typeOfEvent) !== null && _61 !== void 0 ? _61 : "",
                status: status,
                bookingRef: booking.bookingID
            }).catch((error) => console.error(error));
        }
        if (businessType && [BusinessTypeSeeder_1.BusinessType.MARRIAGE_BANQUETS.toString()].includes(businessType)) {
            console.log(BusinessTypeSeeder_1.BusinessType.MARRIAGE_BANQUETS, status === booking_model_1.BookingStatus.CONFIRMED);
            if (status === booking_model_1.BookingStatus.CONFIRMED) {
                new EmailNotificationService_1.default().sendBookingConfirmationEmail({
                    type: savedBooking.type,
                    toAddress: (_62 = customer === null || customer === void 0 ? void 0 : customer.email) !== null && _62 !== void 0 ? _62 : "",
                    cc: [(_63 = user === null || user === void 0 ? void 0 : user.email) !== null && _63 !== void 0 ? _63 : "", (_64 = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.email) !== null && _64 !== void 0 ? _64 : ""],
                    businessName: (_65 = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.name) !== null && _65 !== void 0 ? _65 : "",
                    businessType: businessType !== null && businessType !== void 0 ? businessType : BusinessTypeSeeder_1.BusinessType.HOTEL.toString(),
                    businessPhone: (_66 = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.phoneNumber) !== null && _66 !== void 0 ? _66 : "",
                    businessEmail: (_67 = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.email) !== null && _67 !== void 0 ? _67 : "",
                    address: {
                        street: (_69 = (_68 = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.address) === null || _68 === void 0 ? void 0 : _68.street) !== null && _69 !== void 0 ? _69 : "",
                        city: (_71 = (_70 = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.address) === null || _70 === void 0 ? void 0 : _70.city) !== null && _71 !== void 0 ? _71 : "",
                        state: (_73 = (_72 = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.address) === null || _72 === void 0 ? void 0 : _72.state) !== null && _73 !== void 0 ? _73 : "",
                        zipCode: (_75 = (_74 = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.address) === null || _74 === void 0 ? void 0 : _74.zipCode) !== null && _75 !== void 0 ? _75 : "",
                        country: (_77 = (_76 = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.address) === null || _76 === void 0 ? void 0 : _76.country) !== null && _77 !== void 0 ? _77 : "",
                    },
                    customerName: (_78 = customer === null || customer === void 0 ? void 0 : customer.name) !== null && _78 !== void 0 ? _78 : "",
                    customerEmail: (_79 = customer === null || customer === void 0 ? void 0 : customer.email) !== null && _79 !== void 0 ? _79 : "",
                    customerPhone: (_80 = customer === null || customer === void 0 ? void 0 : customer.phoneNumber) !== null && _80 !== void 0 ? _80 : "",
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
                    toAddress: (_81 = customer === null || customer === void 0 ? void 0 : customer.email) !== null && _81 !== void 0 ? _81 : "",
                    cc: [(_82 = user === null || user === void 0 ? void 0 : user.email) !== null && _82 !== void 0 ? _82 : "", (_83 = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.email) !== null && _83 !== void 0 ? _83 : ""],
                    businessName: (_84 = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.name) !== null && _84 !== void 0 ? _84 : "",
                    businessPhone: (_85 = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.phoneNumber) !== null && _85 !== void 0 ? _85 : "",
                    businessEmail: (_86 = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.email) !== null && _86 !== void 0 ? _86 : "",
                    customerName: (_87 = customer === null || customer === void 0 ? void 0 : customer.name) !== null && _87 !== void 0 ? _87 : "",
                    customerEmail: (_88 = customer === null || customer === void 0 ? void 0 : customer.email) !== null && _88 !== void 0 ? _88 : "",
                    customerPhone: (_89 = customer === null || customer === void 0 ? void 0 : customer.phoneNumber) !== null && _89 !== void 0 ? _89 : "",
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
                typeOfEvent: (_90 = metadata === null || metadata === void 0 ? void 0 : metadata.typeOfEvent) !== null && _90 !== void 0 ? _90 : "",
                status: status,
                bookingRef: booking.bookingID
            }).catch((error) => console.error(error));
        }
        return response.send((0, response_1.httpNoContent)(null, "Booking status updated successfully."));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_91 = error.message) !== null && _91 !== void 0 ? _91 : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const userCancelHotelBooking = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _92, _93;
    try {
        const ID = (_92 = request === null || request === void 0 ? void 0 : request.params) === null || _92 === void 0 ? void 0 : _92.id;
        const { id } = request.user;
        const booking = yield booking_model_1.default.findOne({ _id: ID, userID: id });
        if (!booking) {
            return response.send((0, response_1.httpNotFoundOr404)(error_1.ErrorMessage.invalidRequest(NOT_FOUND), NOT_FOUND));
        }
        const checkIn = booking.checkIn;
        const now = (0, moment_1.default)();
        const freeCancelThreshold = (0, moment_1.default)(checkIn).subtract(1, 'days');
        const gracePeriodThreshold = (0, moment_1.default)(booking.createdAt).add(1, 'days');
        const isFreeCancelValid = freeCancelThreshold.isAfter(now) || gracePeriodThreshold.isAfter(now);
        if (!isFreeCancelValid) {
            return response.send((0, response_1.httpBadRequest)(error_1.ErrorMessage.invalidRequest("please contact the business regarding this issue"), "please contact the business regarding this issue"));
        }
        if ([booking_model_1.BookingStatus.CREATED.toString(), booking_model_1.BookingStatus.PENDING.toString(), booking_model_1.BookingStatus.CONFIRMED.toString()].includes(booking.status)) {
            booking.status = booking_model_1.BookingStatus.CANCELED_BY_USER;
            yield booking.save();
            return response.send((0, response_1.httpOk)(null, "Your booking has been canceled successfully."));
        }
        const message = `The order has already been ${booking.status} and cannot be canceled.`;
        return response.send((0, response_1.httpBadRequest)(error_1.ErrorMessage.invalidRequest(message), message));
    }
    catch (error) {
        next((0, response_1.httpInternalServerError)(error, (_93 = error.message) !== null && _93 !== void 0 ? _93 : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const downloadInvoice = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _94, _95, _96, _97, _98, _99, _100, _101, _102, _103;
    try {
        const ID = (_94 = request === null || request === void 0 ? void 0 : request.params) === null || _94 === void 0 ? void 0 : _94.id;
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
        pdf.fontSize(10).text(`Customer Name:   ${(_95 = user === null || user === void 0 ? void 0 : user.name) !== null && _95 !== void 0 ? _95 : ''}`);
        pdf.fontSize(10).text(`Booking Reference:   ${booking.bookingID}`);
        pdf.fontSize(10).text(`Date:   ${(0, moment_1.default)(booking.createdAt).format('ddd DD, MMM YYYY hh:mm:ss A')}`);
        pdf.text('\n');
        pdf.fontSize(10).text(`Check In:   ${(_96 = (0, moment_1.default)(booking.checkIn).format('ddd DD, MMM YYYY hh:mm:ss A')) !== null && _96 !== void 0 ? _96 : ''}`);
        pdf.fontSize(10).text(`Number of Nights:   ${(_98 = (_97 = booking === null || booking === void 0 ? void 0 : booking.bookedRoom) === null || _97 === void 0 ? void 0 : _97.nights) !== null && _98 !== void 0 ? _98 : ''}`);
        pdf.fontSize(10).text(`Check Out:   ${(_99 = (0, moment_1.default)(booking.checkOut).format('ddd DD, MMM YYYY hh:mm:ss A')) !== null && _99 !== void 0 ? _99 : ''}`);
        pdf.fontSize(10).text(`Room Type:   ${(_101 = (_100 = room === null || room === void 0 ? void 0 : room.roomType) === null || _100 === void 0 ? void 0 : _100.toUpperCase()) !== null && _101 !== void 0 ? _101 : ''}`);
        // Table of Items
        pdf.text('\n');
        pdf.text('\n');
        pdf.text('\n');
        pdf.fontSize(10).text('--------------------------------------------------------------------------------------------------------------------------');
        pdf.text('Description          Quantity          Price          Total');
        pdf.fontSize(10).text('--------------------------------------------------------------------------------------------------------------------------');
        pdf.fontSize(8).text(`${(_102 = room === null || room === void 0 ? void 0 : room.roomType) === null || _102 === void 0 ? void 0 : _102.toUpperCase()} Room\n${room === null || room === void 0 ? void 0 : room.title}          ${booking.bookedRoom.quantity}          ${booking.bookedRoom.price} INR          ${booking.bookedRoom.quantity * booking.bookedRoom.price} INR`);
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
        next((0, response_1.httpInternalServerError)(error, (_103 = error.message) !== null && _103 !== void 0 ? _103 : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const bookTable = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _104, _105, _106, _107, _108, _109, _110, _111, _112, _113, _114, _115, _116, _117, _118;
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
                toAddress: (_104 = user === null || user === void 0 ? void 0 : user.email) !== null && _104 !== void 0 ? _104 : "",
                cc: [(_105 = customer === null || customer === void 0 ? void 0 : customer.email) !== null && _105 !== void 0 ? _105 : "", (_106 = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.email) !== null && _106 !== void 0 ? _106 : ""],
                businessName: (_107 = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.name) !== null && _107 !== void 0 ? _107 : "",
                businessType: businessType !== null && businessType !== void 0 ? businessType : BusinessTypeSeeder_1.BusinessType.RESTAURANT.toString(),
                customerName: (_108 = customer === null || customer === void 0 ? void 0 : customer.name) !== null && _108 !== void 0 ? _108 : "",
                customerEmail: (_109 = customer === null || customer === void 0 ? void 0 : customer.email) !== null && _109 !== void 0 ? _109 : "",
                customerPhone: (_110 = customer === null || customer === void 0 ? void 0 : customer.phoneNumber) !== null && _110 !== void 0 ? _110 : "",
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
            toAddress: (_111 = user === null || user === void 0 ? void 0 : user.email) !== null && _111 !== void 0 ? _111 : "",
            cc: [(_112 = customer === null || customer === void 0 ? void 0 : customer.email) !== null && _112 !== void 0 ? _112 : "", (_113 = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.email) !== null && _113 !== void 0 ? _113 : ""],
            businessName: (_114 = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.name) !== null && _114 !== void 0 ? _114 : "",
            customerName: (_115 = customer === null || customer === void 0 ? void 0 : customer.name) !== null && _115 !== void 0 ? _115 : "",
            customerEmail: (_116 = customer === null || customer === void 0 ? void 0 : customer.email) !== null && _116 !== void 0 ? _116 : "",
            customerPhone: (_117 = customer === null || customer === void 0 ? void 0 : customer.phoneNumber) !== null && _117 !== void 0 ? _117 : "",
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
        next((0, response_1.httpInternalServerError)(error, (_118 = error.message) !== null && _118 !== void 0 ? _118 : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
const bookBanquet = (request, response, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _119, _120, _121, _122, _123, _124, _125, _126, _127, _128, _129, _130, _131, _132, _133;
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
                toAddress: (_119 = user === null || user === void 0 ? void 0 : user.email) !== null && _119 !== void 0 ? _119 : "",
                cc: [(_120 = customer === null || customer === void 0 ? void 0 : customer.email) !== null && _120 !== void 0 ? _120 : "", (_121 = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.email) !== null && _121 !== void 0 ? _121 : ""],
                businessName: (_122 = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.name) !== null && _122 !== void 0 ? _122 : "",
                businessType: businessType !== null && businessType !== void 0 ? businessType : BusinessTypeSeeder_1.BusinessType.MARRIAGE_BANQUETS.toString(),
                customerName: (_123 = customer === null || customer === void 0 ? void 0 : customer.name) !== null && _123 !== void 0 ? _123 : "",
                customerEmail: (_124 = customer === null || customer === void 0 ? void 0 : customer.email) !== null && _124 !== void 0 ? _124 : "",
                customerPhone: (_125 = customer === null || customer === void 0 ? void 0 : customer.phoneNumber) !== null && _125 !== void 0 ? _125 : "",
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
            toAddress: (_126 = user === null || user === void 0 ? void 0 : user.email) !== null && _126 !== void 0 ? _126 : "",
            cc: [(_127 = customer === null || customer === void 0 ? void 0 : customer.email) !== null && _127 !== void 0 ? _127 : "", (_128 = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.email) !== null && _128 !== void 0 ? _128 : ""],
            businessType: businessType !== null && businessType !== void 0 ? businessType : BusinessTypeSeeder_1.BusinessType.MARRIAGE_BANQUETS.toString(),
            businessName: (_129 = businessProfile === null || businessProfile === void 0 ? void 0 : businessProfile.name) !== null && _129 !== void 0 ? _129 : "",
            customerName: (_130 = customer === null || customer === void 0 ? void 0 : customer.name) !== null && _130 !== void 0 ? _130 : "",
            customerEmail: (_131 = customer === null || customer === void 0 ? void 0 : customer.email) !== null && _131 !== void 0 ? _131 : "",
            customerPhone: (_132 = customer === null || customer === void 0 ? void 0 : customer.phoneNumber) !== null && _132 !== void 0 ? _132 : "",
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
        next((0, response_1.httpInternalServerError)(error, (_133 = error.message) !== null && _133 !== void 0 ? _133 : error_1.ErrorMessage.INTERNAL_SERVER_ERROR));
    }
});
exports.default = { checkIn, checkout, confirmCheckout, index, show, cancelBooking, downloadInvoice, bookTable, bookBanquet, orderPayment, changeBookingStatus, userCancelHotelBooking };
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
