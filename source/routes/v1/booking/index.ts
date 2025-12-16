import express, { Router } from "express";
import AmenityEndpoints from "./amenity";
import RoomEndpoints from "./room";
import _BookingEndpoints from "./booking";
import authenticateUser, { isBusinessUser } from "../../../middleware/authenticate";
import HotelEndpoints from "../hotel";
import PricePresetEndpoints from "./price-preset";

const BookingEndpoints: Router = express.Router();
BookingEndpoints.use('/amenities', authenticateUser, isBusinessUser, AmenityEndpoints);
BookingEndpoints.use('/rooms', authenticateUser, RoomEndpoints);
BookingEndpoints.use('/bookings', authenticateUser, _BookingEndpoints);
BookingEndpoints.use('/hotels', authenticateUser, isBusinessUser, HotelEndpoints);
BookingEndpoints.use('/price-preset', authenticateUser, isBusinessUser, PricePresetEndpoints)
export default BookingEndpoints;