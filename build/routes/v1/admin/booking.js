"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const BookingController_1 = __importDefault(require("../../../controllers/admin/BookingController"));
const BookingEndpoints = express_1.default.Router();
BookingEndpoints.get('/hotels', BookingController_1.default.index);
BookingEndpoints.get('/statistical', BookingController_1.default.bookingStatistical);
exports.default = BookingEndpoints;
