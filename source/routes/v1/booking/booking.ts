import express, { Router } from "express";
import BookingController from "../../../controllers/booking/BookingController";
import { param } from "express-validator";
import { checkInApiValidator, checkoutApiValidator, createAmenityApiValidator, bookingStatusValidationRule, paramIDValidationRule, confirmCheckoutApiValidator, bookTableApiValidator, bookBanquetApiValidator } from "../../../validation/rules/api-validation";
import { validateRequest } from "../../../middleware/api-request-validator";
import { isBusinessUser } from "../../../middleware/authenticate";
import { BookingStatus } from "../../../database/models/booking.model";
const BookingEndpoints: Router = express.Router();
BookingEndpoints.get('/', BookingController.index);
BookingEndpoints.get('/:id', BookingController.show);
BookingEndpoints.delete("/:id", BookingController.cancelBooking);
BookingEndpoints.delete("/user/cancel/:id", BookingController.userCancelHotelBooking);
BookingEndpoints.post('/check-in', checkInApiValidator, validateRequest, BookingController.checkIn);
BookingEndpoints.post('/checkout', checkoutApiValidator, validateRequest, BookingController.checkout);
BookingEndpoints.post('/checkout/confirm', confirmCheckoutApiValidator, validateRequest, BookingController.confirmCheckout);
BookingEndpoints.get("/:id/invoice", BookingController.downloadInvoice);
BookingEndpoints.patch("/:id/change-status", isBusinessUser, [paramIDValidationRule, bookingStatusValidationRule], validateRequest, BookingController.changeBookingStatus);

//Book table and banquet
BookingEndpoints.post("/table", bookTableApiValidator, validateRequest, BookingController.bookTable);
BookingEndpoints.post("/banquet", bookBanquetApiValidator, validateRequest, BookingController.bookBanquet);

export default BookingEndpoints;