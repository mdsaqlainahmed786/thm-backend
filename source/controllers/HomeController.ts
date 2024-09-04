import path from "path";
import { Request, Response, NextFunction } from "express";
import { httpOk, httpBadRequest, httpInternalServerError } from "../utils/response";
import sharp from "sharp";
import fs from "fs/promises"
import { PUBLIC_DIR } from "../middleware/file-uploading";
import { v4 } from "uuid";

import { ErrorMessage } from "../utils/response-message/error";
import BusinessType from "../database/models/businessType.model";
import BusinessSubType from "../database/models/businessSubType.model";
import BusinessQuestion from "../database/models/businessQuestion.model";
const home = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const businessTypes = ['Hotel', 'Bars / Clubs', 'Home Stays', 'Marriage Banquets', 'Restaurant'];
        const hostAddress = request.protocol + "://" + request.get("host");
        const businessIcons = [
            hostAddress + '/public/files/hotel.png',
            hostAddress + '/public/files/bars-clubs.png',
            hostAddress + '/public/files/home-stay.png',
            hostAddress + '/public/files/marriage-banquets.png',
            hostAddress + '/public/files/restaurant.png'
        ]
        const hotes = ['3 star', '4 star', '5 star'];
        const barsClubs = ['Restro Bars', 'Microbreweries', 'Nightclubs', 'Lounge Bars', 'Rooftop Bars'];
        const homeStays = ['Traditional', 'Luxury', 'Eco-Friendly', 'Adventure', 'Artistic'];
        const marriageBanquets = ['Traditional Banquet Halls', 'Outdoor Gardens and Lawns', 'Luxury Hotel Ballrooms', 'Heritage Venues and Palaces', 'Beachside or Waterfront Venues'];
        const restaurants = ['Vegetarian Restaurants', 'Non-Vegetarian Restaurants', 'Mixed Cuisine Restaurants', 'Seafood Restaurants', 'Barbecue (BBQ) Restaurants'];
        const data = await Promise.all(businessTypes.map(async (businessType, index) => {
            const isExits = await BusinessType.findOne({ name: businessType });
            if (!isExits) {
                const newBusinessType = new BusinessType({
                    icon: businessIcons[index],
                    name: businessType,
                });
                const savedBusinessType = await newBusinessType.save();
                if (savedBusinessType.name === "Hotel") {
                    hotes.map(async (value) => {
                        const newBusinessSubType = new BusinessSubType();
                        newBusinessSubType.name = value;
                        newBusinessSubType.businessTypeID = savedBusinessType.id;
                        await newBusinessSubType.save();
                    })
                }
                if (savedBusinessType.name === "Bars / Clubs") {
                    barsClubs.map(async (value) => {
                        const newBusinessSubType = new BusinessSubType();
                        newBusinessSubType.name = value;
                        newBusinessSubType.businessTypeID = savedBusinessType.id;
                        await newBusinessSubType.save();
                    })
                }
                if (savedBusinessType.name === "Home Stays") {
                    homeStays.map(async (value) => {
                        const newBusinessSubType = new BusinessSubType();
                        newBusinessSubType.name = value;
                        newBusinessSubType.businessTypeID = savedBusinessType.id;
                        await newBusinessSubType.save();
                    })
                }
                if (savedBusinessType.name === "Marriage Banquets") {
                    marriageBanquets.map(async (value) => {
                        const newBusinessSubType = new BusinessSubType();
                        newBusinessSubType.name = value;
                        newBusinessSubType.businessTypeID = savedBusinessType.id;
                        await newBusinessSubType.save();
                    })
                }
                if (savedBusinessType.name === "Restaurant") {
                    restaurants.map(async (value) => {
                        const newBusinessSubType = new BusinessSubType();
                        newBusinessSubType.name = value;
                        newBusinessSubType.businessTypeID = savedBusinessType.id;
                        await newBusinessSubType.save();
                    })
                }
                return await savedBusinessType;
            }
            return isExits;
        }));
        return response.send(httpOk(data, "Done"));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}

const businessTypes = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const businessTypes = await BusinessType.find();
        return response.send(httpOk(businessTypes, "Business type fetched"));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const businessSubTypes = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const ID = request.params.id;
        const businessTypes = await BusinessSubType.find({ businessTypeID: ID });
        return response.send(httpOk(businessTypes, "Business subtype fetched"));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
const businessQuestions = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { businessSubtypeID, businessTypeID, name } = request.body;
        // const { businessSubtypeID, businessTypeID } = request.body;
        const businessQuestions = await BusinessQuestion.find({ businessTypeID: businessTypeID, businessSubtypeID: businessSubtypeID });
        return response.send(httpOk(businessQuestions, "Business questions fetched"));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
export default { home, businessTypes, businessSubTypes, businessQuestions };