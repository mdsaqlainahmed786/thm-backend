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
        const marriageBanquets = ['Traditional Banquet Halls', 'Outdoor Gardens and Lawns', 'Luxury Hotel Ballrooms', 'Heritage Venues and Palaces', 'Beach side or Waterfront Venues'];
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
        //TODO add order in question for better sorting
        const questions = [
            {
                icon: hostAddress + '/public/files/pet-friendly.png',
                name: 'Pet-friendly',
                question: 'Pet friendly?',
                businessTypeID: ["Hotel"],
                businessSubtypeID: ['4 star', '5 star'],
            },
            {
                icon: hostAddress + '/public/files/baby-care.png',
                name: 'Baby Care',
                question: 'Baby care?',
                businessTypeID: ["Hotel"],
                businessSubtypeID: ['4 star', '5 star'],
            },
            {
                icon: hostAddress + '/public/files/parking-facility.png',
                name: 'Parking',
                question: 'Parking facility?',
                businessTypeID: ["Hotel"],
                businessSubtypeID: ['3 star', '4 star', '5 star'],
            },
            {
                icon: hostAddress + '/public/files/cab-facility.png',
                name: 'Cab Facility',
                question: 'Cab facility on call?',
                businessTypeID: ["Hotel"],
                businessSubtypeID: ['4 star', '5 star'],
            },
            {
                icon: hostAddress + '/public/files/room-service.png',
                name: 'Room Service',
                question: '24x7 room service?',
                businessTypeID: ["Hotel"],
                businessSubtypeID: ['4 star', '5 star'],
            },
            {
                icon: hostAddress + '/public/files/personal-driver.png',
                name: 'Personal Driver',
                question: 'Personal driver room?',
                businessTypeID: ["Hotel"],
                businessSubtypeID: ['4 star', '5 star'],
            },
            {
                icon: hostAddress + '/public/files/check-in.png',
                name: 'Check in 24*7',
                question: '24hrs check-in?',
                businessTypeID: ["Hotel"],
                businessSubtypeID: ['4 star', '5 star'],
            },
            {
                icon: hostAddress + '/public/files/gym.png',
                name: 'Gym',
                question: 'Gym?',
                businessTypeID: ["Hotel"],
                businessSubtypeID: ['4 star', '5 star'],
            },
            {
                icon: hostAddress + '/public/files/pet-friendly.png',
                name: 'Swimming Pool',
                question: 'Swimming pool?',
                businessTypeID: ["Hotel"],
                businessSubtypeID: ['4 star', '5 star'],
            },
            {
                icon: hostAddress + '/public/files/conference-room.png',
                name: 'Conference Room',
                question: 'Conference room?',
                businessTypeID: ["Hotel"],
                businessSubtypeID: ['4 star', '5 star'],
            },
            {
                icon: hostAddress + '/public/files/help-desk.png',
                name: 'Help Desk',
                question: 'Travel help desk?',
                businessTypeID: ["Hotel"],
                businessSubtypeID: ['4 star', '5 star'],
            },
            //Home Stays
            {
                icon: hostAddress + '/public/files/caretaker-on-the-property.png',
                name: 'Caretaker',
                question: 'Caretaker on the property?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: homeStays,
            },
            {
                icon: hostAddress + '/public/files/parking-facility.png',
                name: 'Parking',
                question: 'Dedicated car parking?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: homeStays,
            },
            {
                icon: hostAddress + '/public/files/open-kitchen-to-use.png',
                name: 'Open Kitchen',
                question: 'Open kitchen to use?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: homeStays,
            },
            {
                icon: hostAddress + '/public/files/open-kitchen-to-use.png',
                name: 'Garden',
                question: 'Garden area?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: homeStays,
            },
            {
                icon: hostAddress + '/public/files/pet-friendly.png',
                name: 'Pet-friendly',
                question: 'Pet friendly?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: homeStays,
            },
            {
                icon: hostAddress + '/public/files/sos-helpline.png',
                name: 'SOS helpline',
                question: 'SOS helpline?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: homeStays,
            },
            {
                icon: hostAddress + '/public/files/locker-facility.png',
                name: 'Locker Facility',
                question: 'Locker facility?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: homeStays,
            },
            {
                icon: hostAddress + '/public/files/check-in.png',
                name: 'Check in 24*7',
                question: '24hrs check-in?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: homeStays,
            },
            {
                icon: hostAddress + '/public/files/campfire-space.png',
                name: 'Campfire Space',
                question: 'Campfire space?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: homeStays,
            },
            {
                icon: hostAddress + '/public/files/pet-friendly.png',
                name: 'Swimming Pool',
                question: 'Swimming pool?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: homeStays,
            },
            //Bar/ Night Club
            {
                icon: hostAddress + '/public/files/multiple-floors.png',
                name: 'Multiple Floors',
                question: 'Do you have multiple floors?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: barsClubs,
            },
            {
                icon: hostAddress + '/public/files/event-friendly.png',
                name: 'Event Friendly',
                question: 'Event friendly?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: barsClubs,
            },
            {
                icon: hostAddress + '/public/files/valet-parking.png',
                name: 'Valet Parking',
                question: 'Valet parking?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: barsClubs,
            },

            {
                icon: hostAddress + '/public/files/open-air.png',
                name: 'Open Roof Sitting',
                question: 'Open roof sitting?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: barsClubs,
            },
            {
                icon: hostAddress + '/public/files/rooftop-bar.png',
                name: 'Rooftop Bar',
                question: 'Rooftop bar?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: barsClubs,
            },
            {
                icon: hostAddress + '/public/files/stag-entry.png',
                name: 'Stag Entry',
                question: 'Stag entry?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: barsClubs,
            },
            {
                icon: hostAddress + '/public/files/emergency-escape-door.png',
                name: 'Emergency Escape Door',
                question: 'Emergency escape door?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: barsClubs,
            },
            {
                icon: hostAddress + '/public/files/valid-liquor-selling-license.png',
                name: 'Valid liquor selling license',
                question: 'Valid liquor selling license?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: barsClubs,
            },
            {
                icon: hostAddress + '/public/files/theme-based.png',
                name: 'Theme based',
                question: 'Theme based?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: barsClubs,
            },
            {
                icon: hostAddress + '/public/files/live-dj.png',
                name: 'Live DJ',
                question: 'Live DJ?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: barsClubs,
            },
            {
                icon: hostAddress + '/public/files/band-performance.png',
                name: 'Band Performance',
                question: 'Band performance?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: barsClubs,
            },
            //Restaurant
            {
                icon: hostAddress + '/public/files/open-air.png',
                name: 'Open Air/Outside Dining',
                question: 'Open air/outside dining?',
                businessTypeID: ["Restaurant"],
                businessSubtypeID: restaurants,
            },
            {
                icon: hostAddress + '/public/files/update-your-menu.png',
                name: 'Update your menu',
                question: 'Do you update your menu?',
                businessTypeID: ["Restaurant"],
                businessSubtypeID: restaurants,
            },
            {
                icon: hostAddress + '/public/files/self-delivery-system.png',
                name: 'Self-Delivery System',
                question: 'Do you have a self-delivery system?',
                businessTypeID: ["Restaurant"],
                businessSubtypeID: restaurants,
            },
            {
                icon: hostAddress + '/public/files/buffet-system.png',
                name: 'Buffet system',
                question: 'Do you have a buffet system?',
                businessTypeID: ["Restaurant"],
                businessSubtypeID: restaurants,
            },
            {
                icon: hostAddress + '/public/files/reservation-facility.png',
                name: 'Reservation facility',
                question: 'Reservation facility?',
                businessTypeID: ["Restaurant"],
                businessSubtypeID: restaurants,
            },
            {
                icon: hostAddress + '/public/files/host-a-party.png',
                name: 'Host a Party',
                question: 'Can host a party?',
                businessTypeID: ["Restaurant"],
                businessSubtypeID: restaurants,
            },
            {
                icon: hostAddress + '/public/files/recognized-café.png',
                name: 'Recognized Café',
                question: 'Are you a well-known recognized café?',
                businessTypeID: ["Restaurant"],
                businessSubtypeID: restaurants,
            },
            {
                icon: hostAddress + '/public/files/well-known-restaurant.png',
                name: 'Well-known Restaurant',
                question: 'Are you a well-known restaurant?',
                businessTypeID: ["Restaurant"],
                businessSubtypeID: restaurants,
            },
            {
                icon: hostAddress + '/public/files/vegetarian.png',
                name: 'Pure Veg Restaurant',
                question: 'Are you a pure Veg?',
                businessTypeID: ["Restaurant"],
                businessSubtypeID: restaurants,
            },
            {
                icon: hostAddress + '/public/files/vegan.png',
                name: 'Vegan Restaurant',
                question: 'Are you a Vegan restaurant?',
                businessTypeID: ["Restaurant"],
                businessSubtypeID: restaurants,
            },
            //Marriage Banquets
            {
                icon: hostAddress + '/public/files/parking-facility.png',
                name: 'Parking',
                question: 'Parking space?',
                businessTypeID: ["Marriage Banquets"],
                businessSubtypeID: marriageBanquets,
            },
            {
                icon: hostAddress + '/public/files/elegant-décor.png',
                name: 'Elegant Décor',
                question: 'Elegant décor?',
                businessTypeID: ["Marriage Banquets"],
                businessSubtypeID: marriageBanquets,
            },
            {
                icon: hostAddress + '/public/files/different-themes.png',
                name: 'Different Themes',
                question: 'Different themes?',
                businessTypeID: ["Marriage Banquets"],
                businessSubtypeID: marriageBanquets,
            },
            {
                icon: hostAddress + '/public/files/event-planner.png',
                name: 'Event Planner',
                question: 'Event planner?',
                businessTypeID: ["Marriage Banquets"],
                businessSubtypeID: marriageBanquets,
            },
            {
                icon: hostAddress + '/public/files/outside-catering.png',
                name: 'Outside Catering Service',
                question: 'Outside catering service?',
                businessTypeID: ["Marriage Banquets"],
                businessSubtypeID: marriageBanquets,
            },
            {
                icon: hostAddress + '/public/files/transportation-service.png',
                name: 'Transportation Service',
                question: 'Transportation service?',
                businessTypeID: ["Marriage Banquets"],
                businessSubtypeID: marriageBanquets,
            },
            {
                icon: hostAddress + '/public/files/audio-visual.png',
                name: 'Audio-Visual equipment',
                question: 'Audio-visual equipment?',
                businessTypeID: ["Marriage Banquets"],
                businessSubtypeID: marriageBanquets,
            },
            {
                icon: hostAddress + '/public/files/premium-bar-service.png',
                name: 'Premium Bar Service',
                question: 'Premium bar service?',
                businessTypeID: ["Marriage Banquets"],
                businessSubtypeID: marriageBanquets,
            },
            {
                icon: hostAddress + '/public/files/emergency-escape-door.png',
                name: 'Fire Escape',
                question: 'Fire escape?',
                businessTypeID: ["Marriage Banquets"],
                businessSubtypeID: marriageBanquets,
            },
        ]
        const questionData = await Promise.all(
            questions.map(async (question) => {
                const businessTypeID = await BusinessType.distinct('_id', { name: { $in: question.businessTypeID } }) as string[];
                const businessSubtypeID = await BusinessSubType.distinct('_id', { businessTypeID: { $in: businessTypeID }, name: { $in: question.businessSubtypeID } }) as string[];

                const newBusiness = new BusinessQuestion();
                newBusiness.icon = question.icon;
                newBusiness.question = question.question;
                newBusiness.name = question.name;
                newBusiness.businessTypeID = businessTypeID;
                newBusiness.businessSubtypeID = businessSubtypeID;
                const savedBusinessQuestion = await newBusiness.save();
                console.log(businessTypeID);
                console.log(businessSubtypeID);
                return question;
            })
        )
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
        const { businessSubtypeID, businessTypeID } = request.body;
        const businessQuestions = await BusinessQuestion.find({ businessTypeID: { $in: [businessTypeID] }, businessSubtypeID: { $in: [businessSubtypeID] } }, '_id question');
        return response.send(httpOk(businessQuestions, "Business questions fetched"));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}
export default { home, businessTypes, businessSubTypes, businessQuestions };