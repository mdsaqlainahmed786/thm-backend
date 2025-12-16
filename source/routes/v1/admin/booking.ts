import express, { Router } from "express";
import BookingController from "../../../controllers/admin/BookingController";
const BookingEndpoints: Router = express.Router();
BookingEndpoints.get('/hotels', BookingController.index);
BookingEndpoints.get('/statistical', BookingController.bookingStatistical);
export default BookingEndpoints;