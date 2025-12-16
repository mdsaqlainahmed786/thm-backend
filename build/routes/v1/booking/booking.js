"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const BookingController_1 = __importDefault(require("../../../controllers/booking/BookingController"));
const api_validation_1 = require("../../../validation/rules/api-validation");
const api_request_validator_1 = require("../../../middleware/api-request-validator");
const authenticate_1 = require("../../../middleware/authenticate");
const BookingEndpoints = express_1.default.Router();
BookingEndpoints.get('/', BookingController_1.default.index);
BookingEndpoints.get('/:id', BookingController_1.default.show);
BookingEndpoints.delete("/:id", BookingController_1.default.cancelBooking);
BookingEndpoints.post('/check-in', api_validation_1.checkInApiValidator, api_request_validator_1.validateRequest, BookingController_1.default.checkIn);
BookingEndpoints.post('/checkout', api_validation_1.checkoutApiValidator, api_request_validator_1.validateRequest, BookingController_1.default.checkout);
BookingEndpoints.post('/checkout/confirm', api_validation_1.confirmCheckoutApiValidator, api_request_validator_1.validateRequest, BookingController_1.default.confirmCheckout);
BookingEndpoints.get("/:id/invoice", BookingController_1.default.downloadInvoice);
BookingEndpoints.patch("/:id/change-status", authenticate_1.isBusinessUser, [api_validation_1.paramIDValidationRule, api_validation_1.bookingStatusValidationRule], api_request_validator_1.validateRequest, BookingController_1.default.changeBookingStatus);
//Book table and banquet
BookingEndpoints.post("/table", api_validation_1.bookTableApiValidator, api_request_validator_1.validateRequest, BookingController_1.default.bookTable);
BookingEndpoints.post("/banquet", api_validation_1.bookBanquetApiValidator, api_request_validator_1.validateRequest, BookingController_1.default.bookBanquet);
exports.default = BookingEndpoints;
