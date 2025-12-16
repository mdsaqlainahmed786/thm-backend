
import express, { Router } from "express";
import BookingController from "../../controllers/admin/BookingController";
const HotelEndpoints: Router = express.Router();
HotelEndpoints.get('/dashboard', BookingController.hotelDashboard);
export default HotelEndpoints;