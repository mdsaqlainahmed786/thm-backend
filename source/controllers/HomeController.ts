import { Request, Response, NextFunction } from "express";
import { httpOk, httpBadRequest, httpInternalServerError, httpOkExtended, httpNotFoundOr404 } from "../utils/response";
import { ErrorMessage } from "../utils/response-message/error";
import BusinessType from "../database/models/businessType.model";
import BusinessSubType from "../database/models/businessSubType.model";
import BusinessQuestion from "../database/models/businessQuestion.model";
import { parseQueryParam } from "../utils/helper/basic";
import Post, { fetchPosts, } from "../database/models/post.model";
import Like from "../database/models/like.model";
import SavedPost from "../database/models/savedPost.model";
import BusinessProfile from "../database/models/businessProfile.model";
import BusinessReviewQuestion from "../database/models/businessReviewQuestion.model";
const feed = async (request: Request, response: Response, next: NextFunction) => {
    try {
        //Only shows public profile post here and follower posts
        const { id } = request.user;
        let { pageNumber, documentLimit, query }: any = request.query;
        const dbQuery = { isPublished: true };
        pageNumber = parseQueryParam(pageNumber, 1);
        documentLimit = parseQueryParam(documentLimit, 20);
        if (query !== undefined && query !== "") {
        }
        if (!id) {
            return response.send(httpNotFoundOr404(ErrorMessage.invalidRequest(ErrorMessage.USER_NOT_FOUND), ErrorMessage.USER_NOT_FOUND));
        }
        const [likedByMe, savedByMe] = await Promise.all([
            Like.distinct('postID', { userID: id, postID: { $ne: null } }),
            SavedPost.distinct('postID', { userID: id, postID: { $ne: null } })
        ]);
        const [documents, totalDocument] = await Promise.all([
            fetchPosts(dbQuery, likedByMe, savedByMe, pageNumber, documentLimit),
            Post.find(dbQuery).countDocuments()
        ]);
        const totalPagesCount = Math.ceil(totalDocument / documentLimit) || 1;
        return response.send(httpOkExtended(documents, 'Home feed fetched.', pageNumber, totalPagesCount, totalDocument));
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
        const businessQuestions = await BusinessQuestion.find({ businessTypeID: { $in: [businessTypeID] }, businessSubtypeID: { $in: [businessSubtypeID] } }, '_id question answer').sort({ order: 1 }).limit(6);
        return response.send(httpOk(businessQuestions, "Business questions fetched"));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}


const dbSeeder = async (request: Request, response: Response, next: NextFunction) => {
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

        const questions = [
            {
                icon: hostAddress + '/public/files/airport.png',
                name: 'Airport',
                question: 'Airport?',
                businessTypeID: ["Hotel"],
                businessSubtypeID: ['3 star', '4 star', '5 star'],
                order: 1,
            },
            {
                icon: hostAddress + '/public/files/railway-station.png',
                name: 'Railway Station',
                question: 'Railway Station?',
                businessTypeID: ["Hotel"],
                businessSubtypeID: ['3 star', '4 star', '5 star'],
                order: 2,
            },
            {
                icon: hostAddress + '/public/files/bus.png',
                name: 'Bus Stand',
                question: 'Bus Stand?',
                businessTypeID: ["Hotel"],
                businessSubtypeID: ['3 star', '4 star', '5 star'],
                order: 3,
            },
            {
                icon: hostAddress + '/public/files/gov-hospital.png',
                name: 'Gov Hospital',
                question: 'Gov Hospital?',
                businessTypeID: ["Hotel"],
                businessSubtypeID: ['3 star', '4 star', '5 star'],
                order: 4,
            },
            {
                icon: hostAddress + '/public/files/pet-friendly.png',
                name: 'Pet-friendly',
                question: 'Pet friendly?',
                businessTypeID: ["Hotel"],
                businessSubtypeID: ['4 star', '5 star'],
                order: 5,
            },
            {
                icon: hostAddress + '/public/files/baby-care.png',
                name: 'Baby Care',
                question: 'Baby care?',
                businessTypeID: ["Hotel"],
                businessSubtypeID: ['4 star', '5 star'],
                order: 6,
            },
            {
                icon: hostAddress + '/public/files/parking-facility.png',
                name: 'Parking',
                question: 'Parking facility?',
                businessTypeID: ["Hotel"],
                businessSubtypeID: ['3 star', '4 star', '5 star'],
                order: 7,
            },
            {
                icon: hostAddress + '/public/files/cab-facility.png',
                name: 'Cab Facility',
                question: 'Cab facility on call?',
                businessTypeID: ["Hotel"],
                businessSubtypeID: ['4 star', '5 star'],
                order: 8,
            },
            {
                icon: hostAddress + '/public/files/room-service.png',
                name: 'Room Service',
                question: '24x7 room service?',
                businessTypeID: ["Hotel"],
                businessSubtypeID: ['4 star', '5 star'],
                order: 9,
            },
            {
                icon: hostAddress + '/public/files/personal-driver.png',
                name: 'Personal Driver',
                question: 'Personal driver room?',
                businessTypeID: ["Hotel"],
                businessSubtypeID: ['4 star', '5 star'],
                order: 10,
            },
            {
                icon: hostAddress + '/public/files/check-in.png',
                name: 'Check in 24*7',
                question: '24hrs check-in?',
                businessTypeID: ["Hotel"],
                businessSubtypeID: ['4 star', '5 star'],
                order: 11,
            },
            {
                icon: hostAddress + '/public/files/gym.png',
                name: 'Gym',
                question: 'Gym?',
                businessTypeID: ["Hotel"],
                businessSubtypeID: ['4 star', '5 star'],
                order: 12,
            },
            {
                icon: hostAddress + '/public/files/pet-friendly.png',
                name: 'Swimming Pool',
                question: 'Swimming pool?',
                businessTypeID: ["Hotel"],
                businessSubtypeID: ['4 star', '5 star'],
                order: 13,
            },
            {
                icon: hostAddress + '/public/files/conference-room.png',
                name: 'Conference Room',
                question: 'Conference room?',
                businessTypeID: ["Hotel"],
                businessSubtypeID: ['4 star', '5 star'],
                order: 14,
            },
            {
                icon: hostAddress + '/public/files/help-desk.png',
                name: 'Help Desk',
                question: 'Travel help desk?',
                businessTypeID: ["Hotel"],
                businessSubtypeID: ['4 star', '5 star'],
                order: 15,
            },

            //3 star
            {
                icon: hostAddress + '/public/files/non-ac-room.png',
                name: 'Non-AC Rooms',
                question: 'Non-AC rooms?',
                businessTypeID: ["Hotel"],
                businessSubtypeID: ['3 star'],
                order: 1,
            },
            {
                icon: hostAddress + '/public/files/local-id.png',
                name: 'Local ID',
                question: 'Do you accept local ID?',
                businessTypeID: ["Hotel"],
                businessSubtypeID: ['3 star'],
                order: 2,
            },
            {
                icon: hostAddress + '/public/files/wifi.png',
                name: 'Wi-Fi',
                question: 'Wi-Fi?',
                businessTypeID: ["Hotel"],
                businessSubtypeID: ['3 star'],
                order: 3,
            },
            {
                icon: hostAddress + '/public/files/laundry-service.png',
                name: 'Laundry Service',
                question: 'Laundry service?',
                businessTypeID: ["Hotel"],
                businessSubtypeID: ['3 star'],
                order: 4,
            },
            {
                icon: hostAddress + '/public/files/safety-locker.png',
                name: 'Locker in the room',
                question: 'Safety locker in the room?',
                businessTypeID: ["Hotel"],
                businessSubtypeID: ['3 star'],
                order: 5,
            },
            {
                icon: hostAddress + '/public/files/geyser.png',
                name: 'Geyser',
                question: 'Geyser in the washroom?',
                businessTypeID: ["Hotel"],
                businessSubtypeID: ['3 star'],
                order: 6,
            },
            {
                icon: hostAddress + '/public/files/kitchen.png',
                name: 'Kitchen',
                question: 'Hotel have a kitchen?',
                businessTypeID: ["Hotel"],
                businessSubtypeID: ['3 star'],
                order: 7,
            },
            {
                icon: hostAddress + '/public/files/extra-bed.png',
                name: 'Extra Bed Facility',
                question: 'Extra bed facility?',
                businessTypeID: ["Hotel"],
                businessSubtypeID: ['3 star'],
                order: 8,
            },
            {
                icon: hostAddress + '/public/files/couple-friendly.png',
                name: 'Couple Friendly',
                question: 'Couple friendly?',
                businessTypeID: ["Hotel"],
                businessSubtypeID: ['3 star'],
                order: 9,
            },
            //Home Stays
            {
                icon: hostAddress + '/public/files/caretaker-on-the-property.png',
                name: 'Caretaker',
                question: 'Caretaker on the property?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: homeStays,
                order: 1,
            },
            {
                icon: hostAddress + '/public/files/parking-facility.png',
                name: 'Parking',
                question: 'Dedicated car parking?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: homeStays,
                order: 2,
            },
            {
                icon: hostAddress + '/public/files/open-kitchen-to-use.png',
                name: 'Open Kitchen',
                question: 'Open kitchen to use?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: homeStays,
                order: 3,
            },
            {
                icon: hostAddress + '/public/files/open-kitchen-to-use.png',
                name: 'Garden',
                question: 'Garden area?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: homeStays,
                order: 4,
            },
            {
                icon: hostAddress + '/public/files/pet-friendly.png',
                name: 'Pet-friendly',
                question: 'Pet friendly?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: homeStays,
                order: 5,
            },
            {
                icon: hostAddress + '/public/files/sos-helpline.png',
                name: 'SOS helpline',
                question: 'SOS helpline?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: homeStays,
                order: 6,
            },
            {
                icon: hostAddress + '/public/files/locker-facility.png',
                name: 'Locker Facility',
                question: 'Locker facility?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: homeStays,
                order: 7,
            },
            {
                icon: hostAddress + '/public/files/check-in.png',
                name: 'Check in 24*7',
                question: '24hrs check-in?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: homeStays,
                order: 8,
            },
            {
                icon: hostAddress + '/public/files/campfire-space.png',
                name: 'Campfire Space',
                question: 'Campfire space?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: homeStays,
                order: 9,
            },
            {
                icon: hostAddress + '/public/files/pet-friendly.png',
                name: 'Swimming Pool',
                question: 'Swimming pool?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: homeStays,
                order: 10,
            },
            //Bar/ Night Club
            {
                icon: hostAddress + '/public/files/multiple-floors.png',
                name: 'Multiple Floors',
                question: 'Do you have multiple floors?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: barsClubs,
                order: 1,
            },
            {
                icon: hostAddress + '/public/files/event-friendly.png',
                name: 'Event Friendly',
                question: 'Event friendly?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: barsClubs,
                order: 2,
            },
            {
                icon: hostAddress + '/public/files/valet-parking.png',
                name: 'Valet Parking',
                question: 'Valet parking?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: barsClubs,
                order: 3,
            },

            {
                icon: hostAddress + '/public/files/open-air.png',
                name: 'Open Roof Sitting',
                question: 'Open roof sitting?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: barsClubs,
                order: 4,
            },
            {
                icon: hostAddress + '/public/files/rooftop-bar.png',
                name: 'Rooftop Bar',
                question: 'Rooftop bar?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: barsClubs,
                order: 5,
            },
            {
                icon: hostAddress + '/public/files/stag-entry.png',
                name: 'Stag Entry',
                question: 'Stag entry?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: barsClubs,
                order: 6,
            },
            {
                icon: hostAddress + '/public/files/emergency-escape-door.png',
                name: 'Emergency Escape Door',
                question: 'Emergency escape door?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: barsClubs,
                order: 7,
            },
            {
                icon: hostAddress + '/public/files/valid-liquor-selling-license.png',
                name: 'Valid liquor selling license',
                question: 'Valid liquor selling license?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: barsClubs,
                order: 8,
            },
            {
                icon: hostAddress + '/public/files/theme-based.png',
                name: 'Theme based',
                question: 'Theme based?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: barsClubs,
                order: 9,
            },
            {
                icon: hostAddress + '/public/files/live-dj.png',
                name: 'Live DJ',
                question: 'Live DJ?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: barsClubs,
                order: 10,
            },
            {
                icon: hostAddress + '/public/files/band-performance.png',
                name: 'Band Performance',
                question: 'Band performance?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: barsClubs,
                order: 11,
            },
            //Restaurant
            {
                icon: hostAddress + '/public/files/open-air.png',
                name: 'Open Air Dining',
                question: 'Open air dining?',
                businessTypeID: ["Restaurant"],
                businessSubtypeID: restaurants,
                order: 1,
            },
            {
                icon: hostAddress + '/public/files/update-your-menu.png',
                name: 'Update your menu',
                question: 'Do you update your menu?',
                businessTypeID: ["Restaurant"],
                businessSubtypeID: restaurants,
                order: 2,
            },
            {
                icon: hostAddress + '/public/files/self-delivery-system.png',
                name: 'Self-Delivery System',
                question: 'Do you have a self-delivery system?',
                businessTypeID: ["Restaurant"],
                businessSubtypeID: restaurants,
                order: 3,
            },
            {
                icon: hostAddress + '/public/files/buffet-system.png',
                name: 'Buffet system',
                question: 'Do you have a buffet system?',
                businessTypeID: ["Restaurant"],
                businessSubtypeID: restaurants,
                order: 4,
            },
            {
                icon: hostAddress + '/public/files/reservation-facility.png',
                name: 'Reservation facility',
                question: 'Reservation facility?',
                businessTypeID: ["Restaurant"],
                businessSubtypeID: restaurants,
                order: 5,
            },
            {
                icon: hostAddress + '/public/files/host-a-party.png',
                name: 'Host a Party',
                question: 'Can host a party?',
                businessTypeID: ["Restaurant"],
                businessSubtypeID: restaurants,
                order: 6,
            },
            {
                icon: hostAddress + '/public/files/recognized-café.png',
                name: 'Recognized Café',
                question: 'Are you a well-known recognized café?',
                businessTypeID: ["Restaurant"],
                businessSubtypeID: restaurants,
                order: 7,
            },
            {
                icon: hostAddress + '/public/files/well-known-restaurant.png',
                name: 'Well-known Restaurant',
                question: 'Are you a well-known restaurant?',
                businessTypeID: ["Restaurant"],
                businessSubtypeID: restaurants,
                order: 8,
            },
            {
                icon: hostAddress + '/public/files/vegetarian.png',
                name: 'Pure Veg Restaurant',
                question: 'Are you a pure Veg?',
                businessTypeID: ["Restaurant"],
                businessSubtypeID: restaurants,
                order: 9,
            },
            {
                icon: hostAddress + '/public/files/vegan.png',
                name: 'Vegan Restaurant',
                question: 'Are you a Vegan restaurant?',
                businessTypeID: ["Restaurant"],
                businessSubtypeID: restaurants,
                order: 10,
            },
            {
                icon: hostAddress + '/public/files/open-air.png',
                name: 'Outside Dining',
                question: 'Outside dining?',
                businessTypeID: ["Restaurant"],
                businessSubtypeID: restaurants,
                order: 11,
            },
            //Marriage Banquets
            {
                icon: hostAddress + '/public/files/parking-facility.png',
                name: 'Parking',
                question: 'Parking space?',
                businessTypeID: ["Marriage Banquets"],
                businessSubtypeID: marriageBanquets,
                order: 1,
            },
            {
                icon: hostAddress + '/public/files/elegant-décor.png',
                name: 'Elegant Décor',
                question: 'Elegant décor?',
                businessTypeID: ["Marriage Banquets"],
                businessSubtypeID: marriageBanquets,
                order: 2,
            },
            {
                icon: hostAddress + '/public/files/different-themes.png',
                name: 'Different Themes',
                question: 'Different themes?',
                businessTypeID: ["Marriage Banquets"],
                businessSubtypeID: marriageBanquets,
                order: 3,
            },
            {
                icon: hostAddress + '/public/files/event-planner.png',
                name: 'Event Planner',
                question: 'Event planner?',
                businessTypeID: ["Marriage Banquets"],
                businessSubtypeID: marriageBanquets,
                order: 4,
            },
            {
                icon: hostAddress + '/public/files/outside-catering.png',
                name: 'Outside Catering Service',
                question: 'Outside catering service?',
                businessTypeID: ["Marriage Banquets"],
                businessSubtypeID: marriageBanquets,
                order: 5,
            },
            {
                icon: hostAddress + '/public/files/transportation-service.png',
                name: 'Transportation Service',
                question: 'Transportation service?',
                businessTypeID: ["Marriage Banquets"],
                businessSubtypeID: marriageBanquets,
                order: 6,
            },
            {
                icon: hostAddress + '/public/files/audio-visual.png',
                name: 'Audio-Visual equipment',
                question: 'Audio-visual equipment?',
                businessTypeID: ["Marriage Banquets"],
                businessSubtypeID: marriageBanquets,
                order: 7,
            },
            {
                icon: hostAddress + '/public/files/premium-bar-service.png',
                name: 'Premium Bar Service',
                question: 'Premium bar service?',
                businessTypeID: ["Marriage Banquets"],
                businessSubtypeID: marriageBanquets,
                order: 8,
            },
            {
                icon: hostAddress + '/public/files/emergency-escape-door.png',
                name: 'Fire Escape',
                question: 'Fire escape?',
                businessTypeID: ["Marriage Banquets"],
                businessSubtypeID: marriageBanquets,
                order: 9,
            },
        ]

        const reviewQuestions = [
            {
                icon: hostAddress + '/public/files/airport.png',
                question: 'How would you rate the cleanliness of your room?',
                businessTypeID: [businessTypes[0]],
                businessSubtypeID: [hotes[0]],
                order: 1,
            },
            {
                icon: hostAddress + '/public/files/airport.png',
                question: 'How comfortable was your bed?',
                businessTypeID: [businessTypes[0]],
                businessSubtypeID: [hotes[0]],
                order: 2,
            },
            {
                icon: hostAddress + '/public/files/airport.png',
                question: 'Were the basic amenities (Wi-Fi, toiletries, etc.) satisfactory?',
                businessTypeID: [businessTypes[0]],
                businessSubtypeID: [hotes[0]],
                order: 3,
            },
            {
                icon: hostAddress + '/public/files/airport.png',
                question: 'How would you assess the friendliness of the staff?',
                businessTypeID: [businessTypes[0]],
                businessSubtypeID: [hotes[0]],
                order: 4,
            },
            {
                icon: hostAddress + '/public/files/airport.png',
                question: 'How was the quality of the food in the hotel restaurant?',
                businessTypeID: [businessTypes[0]],
                businessSubtypeID: [hotes[0]],
                order: 5,
            },
            {
                icon: hostAddress + '/public/files/airport.png',
                question: 'How well did the hotel meet your expectations for value?',
                businessTypeID: [businessTypes[0]],
                businessSubtypeID: [hotes[0]],
                order: 6,
            },
            {
                icon: hostAddress + '/public/files/airport.png',
                question: 'How accessible were nearby attractions and services?',
                businessTypeID: [businessTypes[0]],
                businessSubtypeID: [hotes[0]],
                order: 7,
            },
            //4 star
            {
                icon: hostAddress + '/public/files/non-ac-room.png',
                question: 'How would you rate the overall cleanliness and maintenance of the hotel?',
                businessTypeID: [businessTypes[0]],
                businessSubtypeID: [hotes[1]],
                order: 1,
            },
            {
                icon: hostAddress + '/public/files/non-ac-room.png',
                question: 'How comfortable and well-furnished was your room?',
                businessTypeID: [businessTypes[0]],
                businessSubtypeID: [hotes[1]],
                order: 2,
            },
            {
                icon: hostAddress + '/public/files/non-ac-room.png',
                question: 'How would you assess the quality and variety of amenities provided?',
                businessTypeID: [businessTypes[0]],
                businessSubtypeID: [hotes[1]],
                order: 3,
            },
            {
                icon: hostAddress + '/public/files/non-ac-room.png',
                question: 'How friendly and professional was the hotel staff?',
                businessTypeID: [businessTypes[0]],
                businessSubtypeID: [hotes[1]],
                order: 4,
            },
            {
                icon: hostAddress + '/public/files/non-ac-room.png',
                question: 'How satisfied were you with the dining options available?',
                businessTypeID: [businessTypes[0]],
                businessSubtypeID: [hotes[1]],
                order: 5,
            },
            {
                icon: hostAddress + '/public/files/non-ac-room.png',
                question: 'How would you rate the hotel’s facilities (pool, gym, spa, etc.)?',
                businessTypeID: [businessTypes[0]],
                businessSubtypeID: [hotes[1]],
                order: 6,
            },
            {
                icon: hostAddress + '/public/files/non-ac-room.png',
                question: 'How convenient was the hotel’s location for your plans?',
                businessTypeID: [businessTypes[0]],
                businessSubtypeID: [hotes[1]],
                order: 7,
            },
            //5 star
            {
                icon: hostAddress + '/public/files/non-ac-room.png',
                question: 'How would you rate the cleanliness and attention to detail in your room?',
                businessTypeID: [businessTypes[0]],
                businessSubtypeID: [hotes[2]],
                order: 1,
            },
            {
                icon: hostAddress + '/public/files/non-ac-room.png',
                question: 'How luxurious was the bedding and furnishings in your room?',
                businessTypeID: [businessTypes[0]],
                businessSubtypeID: [hotes[2]],
                order: 2,
            },
            {
                icon: hostAddress + '/public/files/non-ac-room.png',
                question: 'How exceptional were the amenities and services provided?',
                businessTypeID: [businessTypes[0]],
                businessSubtypeID: [hotes[2]],
                order: 3,
            },
            {
                icon: hostAddress + '/public/files/non-ac-room.png',
                question: 'How attentive and personalized was the service from the staff?',
                businessTypeID: [businessTypes[0]],
                businessSubtypeID: [hotes[2]],
                order: 4,
            },
            {
                icon: hostAddress + '/public/files/non-ac-room.png',
                question: 'How would you assess the quality of the hotel’s dining experiences?',
                businessTypeID: [businessTypes[0]],
                businessSubtypeID: [hotes[2]],
                order: 5,
            },
            {
                icon: hostAddress + '/public/files/non-ac-room.png',
                question: 'How well did the hotel exceed your expectations overall?',
                businessTypeID: [businessTypes[0]],
                businessSubtypeID: [hotes[2]],
                order: 6,
            },
            {
                icon: hostAddress + '/public/files/non-ac-room.png',
                question: 'How memorable was your experience in terms of ambiance and hospitality?',
                businessTypeID: [businessTypes[0]],
                businessSubtypeID: [hotes[2]],
                order: 7,
            },
            //Home Stays
            {
                icon: hostAddress + '/public/files/caretaker-on-the-property.png',
                question: 'How would you rate the cleanliness and upkeep of the home??',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: ['Traditional'],
                order: 1,
            },
            {
                icon: hostAddress + '/public/files/caretaker-on-the-property.png',
                question: 'How comfortable were the furnishings and bedding?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: ['Traditional'],
                order: 2,
            },
            {
                icon: hostAddress + '/public/files/caretaker-on-the-property.png',
                question: 'How well did the amenities reflect the traditional experience?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: ['Traditional'],
                order: 3,
            },
            {
                icon: hostAddress + '/public/files/caretaker-on-the-property.png',
                question: 'How friendly and welcoming was the host?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: ['Traditional'],
                order: 4,
            },
            {
                icon: hostAddress + '/public/files/caretaker-on-the-property.png',
                question: 'How satisfied were you with the local food offerings?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: ['Traditional'],
                order: 5,
            },
            {
                icon: hostAddress + '/public/files/caretaker-on-the-property.png',
                question: 'How immersive was the cultural experience during your stay?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: ['Traditional'],
                order: 6,
            },
            {
                icon: hostAddress + '/public/files/caretaker-on-the-property.png',
                question: 'How convenient was the location for exploring local attractions?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: ['Traditional'],
                order: 7,
            },
            {
                icon: hostAddress + '/public/files/caretaker-on-the-property.png',
                question: 'How would you rate the overall cleanliness and luxury of the home?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: ['Luxury'],
                order: 1,
            },
            {
                icon: hostAddress + '/public/files/caretaker-on-the-property.png',
                question: 'How comfortable were the high-end furnishings and bedding?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: ['Luxury'],
                order: 2,
            },
            {
                icon: hostAddress + '/public/files/caretaker-on-the-property.png',
                question: 'How exceptional were the amenities provided (pool, spa, etc.)?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: ['Luxury'],
                order: 3,
            },
            {
                icon: hostAddress + '/public/files/caretaker-on-the-property.png',
                question: 'How attentive and professional was the host?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: ['Luxury'],
                order: 4,
            },
            {
                icon: hostAddress + '/public/files/caretaker-on-the-property.png',
                question: 'How would you assess the dining options and in-home chef services?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: ['Luxury'],
                order: 5,
            },
            {
                icon: hostAddress + '/public/files/caretaker-on-the-property.png',
                question: 'How well did the home exceed your expectations for a luxury stay?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: ['Luxury'],
                order: 6,
            },
            {
                icon: hostAddress + '/public/files/caretaker-on-the-property.png',
                question: 'How memorable was the overall ambiance and atmosphere?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: ['Luxury'],
                order: 7,
            },
            //Eco-Friendly
            {
                icon: hostAddress + '/public/files/caretaker-on-the-property.png',
                question: 'How would you rate the cleanliness and sustainability practices of the home?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: ['Eco-Friendly'],
                order: 1,
            },
            {
                icon: hostAddress + '/public/files/caretaker-on-the-property.png',
                question: 'How comfortable were the eco-friendly furnishings and bedding?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: ['Eco-Friendly'],
                order: 2,
            },
            {
                icon: hostAddress + '/public/files/caretaker-on-the-property.png',
                question: 'How well did the home incorporate sustainable amenities?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: ['Eco-Friendly'],
                order: 3,
            },
            {
                icon: hostAddress + '/public/files/caretaker-on-the-property.png',
                question: 'How knowledgeable and helpful was the host regarding eco-friendly practices?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: ['Eco-Friendly'],
                order: 4,
            },
            {
                icon: hostAddress + '/public/files/caretaker-on-the-property.png',
                question: 'How satisfied were you with the locally sourced food options?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: ['Eco-Friendly'],
                order: 5,
            },
            {
                icon: hostAddress + '/public/files/caretaker-on-the-property.png',
                question: 'How would you assess the home’s efforts to minimize environmental impact?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: ['Eco-Friendly'],
                order: 6,
            },
            {
                icon: hostAddress + '/public/files/caretaker-on-the-property.png',
                question: 'How convenient was the location for exploring nature or eco-friendly activities?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: ['Eco-Friendly'],
                order: 7,
            },
            //Adventure
            {
                icon: hostAddress + '/public/files/caretaker-on-the-property.png',
                question: 'How would you rate the cleanliness and suitability of the home for adventure seekers?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: ['Adventure'],
                order: 1,
            },
            {
                icon: hostAddress + '/public/files/caretaker-on-the-property.png',
                question: 'How comfortable were the accommodations after a day of activities?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: ['Adventure'],
                order: 2,
            },
            {
                icon: hostAddress + '/public/files/caretaker-on-the-property.png',
                question: 'How well did the home provide amenities for adventure (gear storage, etc.)?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: ['Adventure'],
                order: 3,
            },
            {
                icon: hostAddress + '/public/files/caretaker-on-the-property.png',
                question: 'How supportive was the host in planning activities and excursions?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: ['Adventure'],
                order: 4,
            },
            {
                icon: hostAddress + '/public/files/caretaker-on-the-property.png',
                question: 'How satisfied were you with the local dining options for post-adventure meals?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: ['Adventure'],
                order: 5,
            },
            {
                icon: hostAddress + '/public/files/caretaker-on-the-property.png',
                question: 'How would you assess the location for access to adventure activities?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: ['Adventure'],
                order: 6,
            },
            {
                icon: hostAddress + '/public/files/caretaker-on-the-property.png',
                question: 'How memorable was your experience in terms of adventure opportunities?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: ['Adventure'],
                order: 7,
            },

            //Artistic
            {
                icon: hostAddress + '/public/files/caretaker-on-the-property.png',
                question: 'How would you rate the cleanliness and artistic ambiance of the home?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: ['Artistic'],
                order: 1,
            },
            {
                icon: hostAddress + '/public/files/caretaker-on-the-property.png',
                question: 'How comfortable were the furnishings and artistic elements?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: ['Artistic'],
                order: 2,
            },
            {
                icon: hostAddress + '/public/files/caretaker-on-the-property.png',
                question: 'How well did the home reflect a creative and artistic atmosphere?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: ['Artistic'],
                order: 3,
            },
            {
                icon: hostAddress + '/public/files/caretaker-on-the-property.png',
                question: 'How engaging was the host in sharing local art and culture?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: ['Artistic'],
                order: 4,
            },
            {
                icon: hostAddress + '/public/files/caretaker-on-the-property.png',
                question: 'How satisfied were you with the local food options and presentation?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: ['Artistic'],
                order: 5,
            },
            {
                icon: hostAddress + '/public/files/caretaker-on-the-property.png',
                question: 'How would you assess the opportunities for artistic experiences during your stay?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: ['Artistic'],
                order: 6,
            },
            {
                icon: hostAddress + '/public/files/caretaker-on-the-property.png',
                question: 'How convenient was the location for exploring local art galleries and studios?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: ['Artistic'],
                order: 7,
            },
            //Bar/ Night Club
            {
                icon: hostAddress + '/public/files/multiple-floors.png',
                question: 'How would you rate the cleanliness and ambiance of the bar?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: ["Restro Bars"],
                order: 1,
            },
            {
                icon: hostAddress + '/public/files/multiple-floors.png',
                question: 'How satisfied were you with the variety of food and drink options?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: ["Restro Bars"],
                order: 2,
            },
            {
                icon: hostAddress + '/public/files/multiple-floors.png',
                question: 'How would you assess the quality and presentation of the food?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: ["Restro Bars"],
                order: 3,
            },
            {
                icon: hostAddress + '/public/files/multiple-floors.png',
                question: 'How friendly and attentive was the staff?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: ["Restro Bars"],
                order: 4,
            },
            {
                icon: hostAddress + '/public/files/multiple-floors.png',
                question: 'How enjoyable was the overall atmosphere for dining and socializing?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: ["Restro Bars"],
                order: 5,
            },
            {
                icon: hostAddress + '/public/files/multiple-floors.png',
                question: 'How convenient was the location for parking and accessibility?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: ["Restro Bars"],
                order: 6,
            },
            {
                icon: hostAddress + '/public/files/multiple-floors.png',
                question: 'How likely are you to recommend this resto bar to others?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: ["Restro Bars"],
                order: 7,
            },
            // Microbreweries
            {
                icon: hostAddress + '/public/files/multiple-floors.png',
                question: 'How would you rate the cleanliness and layout of the microbrewery?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: ["Microbreweries"],
                order: 1,
            },
            {
                icon: hostAddress + '/public/files/multiple-floors.png',
                question: 'How satisfied were you with the variety and quality of the beer offerings?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: ["Microbreweries"],
                order: 2,
            },
            {
                icon: hostAddress + '/public/files/multiple-floors.png',
                question: 'How knowledgeable and passionate was the staff about the brews?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: ["Microbreweries"],
                order: 3,
            },
            {
                icon: hostAddress + '/public/files/multiple-floors.png',
                question: 'How enjoyable was the overall atmosphere for tasting and socializing?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: ["Microbreweries"],
                order: 4,
            },
            {
                icon: hostAddress + '/public/files/multiple-floors.png',
                question: 'How would you assess the food menu in relation to the beer selection?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: ["Microbreweries"],
                order: 5,
            },
            {
                icon: hostAddress + '/public/files/multiple-floors.png',
                question: 'How likely are you to return for a tasting experience?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: ["Microbreweries"],
                order: 6,
            },
            {
                icon: hostAddress + '/public/files/multiple-floors.png',
                question: 'How convenient was the location for visiting?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: ["Microbreweries"],
                order: 7,
            },
            //Nightclubs
            {
                icon: hostAddress + '/public/files/multiple-floors.png',
                question: 'How would you rate the cleanliness and safety of the nightclub?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: ["Nightclubs"],
                order: 1,
            },
            {
                icon: hostAddress + '/public/files/multiple-floors.png',
                question: 'How satisfied were you with the music selection and DJ performance?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: ["Nightclubs"],
                order: 2,
            },
            {
                icon: hostAddress + '/public/files/multiple-floors.png',
                question: 'How would you assess the dance floor space and overall vibe?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: ["Nightclubs"],
                order: 3,
            },
            {
                icon: hostAddress + '/public/files/multiple-floors.png',
                question: 'How friendly and efficient was the staff in serving drinks?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: ["Nightclubs"],
                order: 4,
            },
            {
                icon: hostAddress + '/public/files/multiple-floors.png',
                question: 'How enjoyable was the overall atmosphere for dancing and socializing?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: ["Nightclubs"],
                order: 5,
            },
            {
                icon: hostAddress + '/public/files/multiple-floors.png',
                question: 'How convenient was the location and entry process?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: ["Nightclubs"],
                order: 6,
            },
            {
                icon: hostAddress + '/public/files/multiple-floors.png',
                question: 'How likely are you to recommend this nightclub to friends?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: ["Nightclubs"],
                order: 7,
            },
            //Lounge Bars
            {
                icon: hostAddress + '/public/files/multiple-floors.png',
                question: 'How would you rate the cleanliness and comfort of the lounge bar?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: ["Lounge Bars"],
                order: 1,
            },
            {
                icon: hostAddress + '/public/files/multiple-floors.png',
                question: 'How satisfied were you with the drink selection and quality?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: ["Lounge Bars"],
                order: 2,
            },
            {
                icon: hostAddress + '/public/files/multiple-floors.png',
                question: 'How would you assess the ambiance and decor for relaxation?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: ["Lounge Bars"],
                order: 3,
            },
            {
                icon: hostAddress + '/public/files/multiple-floors.png',
                question: 'How attentive and friendly was the staff?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: ["Lounge Bars"],
                order: 4,
            },
            {
                icon: hostAddress + '/public/files/multiple-floors.png',
                question: 'How enjoyable was the overall atmosphere for conversation and unwinding?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: ["Lounge Bars"],
                order: 5,
            },
            {
                icon: hostAddress + '/public/files/multiple-floors.png',
                question: 'How convenient was the location for parking and access?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: ["Lounge Bars"],
                order: 6,
            },
            {
                icon: hostAddress + '/public/files/multiple-floors.png',
                question: 'How likely are you to return for a relaxed evening out?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: ["Lounge Bars"],
                order: 7,
            },
            //Rooftop Bars
            {
                icon: hostAddress + '/public/files/multiple-floors.png',
                question: 'How would you rate the cleanliness and view from the rooftop bar?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: ["Rooftop Bars"],
                order: 1,
            },
            {
                icon: hostAddress + '/public/files/multiple-floors.png',
                question: 'How satisfied were you with the drink menu and quality?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: ["Rooftop Bars"],
                order: 2,
            },
            {
                icon: hostAddress + '/public/files/multiple-floors.png',
                question: 'How would you assess the seating and comfort levels?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: ["Rooftop Bars"],
                order: 3,
            },
            {
                icon: hostAddress + '/public/files/multiple-floors.png',
                question: 'How friendly and efficient was the staff in service?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: ["Rooftop Bars"],
                order: 4,
            },
            {
                icon: hostAddress + '/public/files/multiple-floors.png',
                question: 'How enjoyable was the overall atmosphere, especially at sunset or nighttime?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: ["Rooftop Bars"],
                order: 5,
            },
            {
                icon: hostAddress + '/public/files/multiple-floors.png',
                question: 'How convenient was the access to the rooftop area?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: ["Rooftop Bars"],
                order: 6,
            },
            {
                icon: hostAddress + '/public/files/multiple-floors.png',
                question: 'How likely are you to recommend this rooftop bar for special occasions?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: ["Rooftop Bars"],
                order: 7,
            },
            //Marriage Banquets
            {
                question: 'How would you rate the cleanliness and maintenance of the banquet hall?',
                businessTypeID: ["Marriage Banquets"],
                businessSubtypeID: ['Traditional Banquet Halls'],
                order: 1,
            },
            {
                question: 'How satisfied were you with the layout and space for your event?',
                businessTypeID: ["Marriage Banquets"],
                businessSubtypeID: ['Traditional Banquet Halls'],
                order: 2,
            },
            {
                question: 'How would you assess the quality and presentation of the food served?',
                businessTypeID: ["Marriage Banquets"],
                businessSubtypeID: ['Traditional Banquet Halls'],
                order: 3,
            },
            {
                question: 'How friendly and accommodating was the staff during the event?',
                businessTypeID: ["Marriage Banquets"],
                businessSubtypeID: ['Traditional Banquet Halls'],
                order: 4,
            },
            {
                question: 'How well did the hall’s decor match your vision for the wedding?',
                businessTypeID: ["Marriage Banquets"],
                businessSubtypeID: ['Traditional Banquet Halls'],
                order: 5,
            },
            {
                question: 'How convenient was the location for guests to access?',
                businessTypeID: ["Marriage Banquets"],
                businessSubtypeID: ['Traditional Banquet Halls'],
                order: 6,
            },
            {
                question: 'How likely are you to recommend this banquet hall for future events?',
                businessTypeID: ["Marriage Banquets"],
                businessSubtypeID: ['Traditional Banquet Halls'],
                order: 7,
            },
            //Outdoor Gardens and Lawns
            {
                question: 'How would you rate the overall cleanliness and upkeep of the outdoor space?',
                businessTypeID: ["Marriage Banquets"],
                businessSubtypeID: ['Outdoor Gardens and Lawns'],
                order: 1,
            },
            {
                question: 'How satisfied were you with the ambiance and natural setting?',
                businessTypeID: ["Marriage Banquets"],
                businessSubtypeID: ['Outdoor Gardens and Lawns'],
                order: 2,
            },
            {
                question: 'How would you assess the availability of amenities (restrooms, seating, etc.)?',
                businessTypeID: ["Marriage Banquets"],
                businessSubtypeID: ['Outdoor Gardens and Lawns'],
                order: 3,
            },
            {
                question: 'How accommodating was the staff in managing the outdoor setting?',
                businessTypeID: ["Marriage Banquets"],
                businessSubtypeID: ['Outdoor Gardens and Lawns'],
                order: 4,
            },
            {
                question: 'How well did the weather arrangements (tents, etc.) meet your needs?',
                businessTypeID: ["Marriage Banquets"],
                businessSubtypeID: ['Outdoor Gardens and Lawns'],
                order: 5,
            },
            {
                question: 'How convenient was the location for guests, considering parking and accessibility?',
                businessTypeID: ["Marriage Banquets"],
                businessSubtypeID: ['Outdoor Gardens and Lawns'],
                order: 6,
            },
            {
                question: 'How likely are you to recommend this venue for outdoor events?',
                businessTypeID: ["Marriage Banquets"],
                businessSubtypeID: ['Outdoor Gardens and Lawns'],
                order: 7,
            },

            //Luxury Hotel Ballrooms
            {
                question: 'How would you rate the cleanliness and opulence of the ballroom?',
                businessTypeID: ["Marriage Banquets"],
                businessSubtypeID: ['Luxury Hotel Ballrooms'],
                order: 1,
            },
            {
                question: 'How satisfied were you with the layout and design of the space?',
                businessTypeID: ["Marriage Banquets"],
                businessSubtypeID: ['Luxury Hotel Ballrooms'],
                order: 2,
            },
            {
                question: 'How would you assess the quality of the catering and service?',
                businessTypeID: ["Marriage Banquets"],
                businessSubtypeID: ['Luxury Hotel Ballrooms'],
                order: 3,
            },
            {
                question: 'How attentive and professional was the staff throughout the event?',
                businessTypeID: ["Marriage Banquets"],
                businessSubtypeID: ['Luxury Hotel Ballrooms'],
                order: 4,
            },
            {
                question: 'How well did the venue’s amenities (lighting, sound system) meet your expectations?',
                businessTypeID: ["Marriage Banquets"],
                businessSubtypeID: ['Luxury Hotel Ballrooms'],
                order: 5,
            },
            {
                question: 'How convenient was the location for you and your guests?',
                businessTypeID: ["Marriage Banquets"],
                businessSubtypeID: ['Luxury Hotel Ballrooms'],
                order: 6,
            },
            {
                question: 'How likely are you to recommend this hotel ballroom for future weddings?',
                businessTypeID: ["Marriage Banquets"],
                businessSubtypeID: ['Luxury Hotel Ballrooms'],
                order: 7,
            },
            //Heritage Venues and Palaces
            {
                question: 'How would you rate the historical ambiance and decor of the venue?',
                businessTypeID: ["Marriage Banquets"],
                businessSubtypeID: ['Heritage Venues and Palaces'],
                order: 1,
            },
            {
                question: 'How satisfied were you with the upkeep and cleanliness of the property?',
                businessTypeID: ["Marriage Banquets"],
                businessSubtypeID: ['Heritage Venues and Palaces'],
                order: 2,
            },
            {
                question: 'How would you assess the catering options in relation to the venue’s style?',
                businessTypeID: ["Marriage Banquets"],
                businessSubtypeID: ['Heritage Venues and Palaces'],
                order: 3,
            },
            {
                question: 'How knowledgeable and helpful was the staff regarding venue specifics?',
                businessTypeID: ["Marriage Banquets"],
                businessSubtypeID: ['Heritage Venues and Palaces'],
                order: 4,
            },
            {
                question: 'How well did the venue accommodate your event’s needs (space, setup)?',
                businessTypeID: ["Marriage Banquets"],
                businessSubtypeID: ['Heritage Venues and Palaces'],
                order: 5,
            },
            {
                question: 'How convenient was the location for your guests?',
                businessTypeID: ["Marriage Banquets"],
                businessSubtypeID: ['Heritage Venues and Palaces'],
                order: 6,
            },
            {
                question: 'How likely are you to recommend this heritage venue for special occasions?',
                businessTypeID: ["Marriage Banquets"],
                businessSubtypeID: ['Heritage Venues and Palaces'],
                order: 7,
            },
            //Beach side or Waterfront Venues
            {
                question: 'How would you rate the cleanliness and charm of the beachside venue?',
                businessTypeID: ["Marriage Banquets"],
                businessSubtypeID: ['Beach side or Waterfront Venues'],
                order: 1,
            },
            {
                question: 'How satisfied were you with the view and overall setting for your event?',
                businessTypeID: ["Marriage Banquets"],
                businessSubtypeID: ['Beach side or Waterfront Venues'],
                order: 2,
            },
            {
                question: 'How would you assess the quality of the catering and drink service?',
                businessTypeID: ["Marriage Banquets"],
                businessSubtypeID: ['Beach side or Waterfront Venues'],
                order: 3,
            },
            {
                question: 'How friendly and accommodating was the staff in managing the event?',
                businessTypeID: ["Marriage Banquets"],
                businessSubtypeID: ['Beach side or Waterfront Venues'],
                order: 4,
            },
            {
                question: 'How well did the venue handle logistics related to the beach or water setting?',
                businessTypeID: ["Marriage Banquets"],
                businessSubtypeID: ['Beach side or Waterfront Venues'],
                order: 5,
            },
            {
                question: 'How convenient was the location for guests to access, including parking?',
                businessTypeID: ["Marriage Banquets"],
                businessSubtypeID: ['Beach side or Waterfront Venues'],
                order: 6,
            },
            {
                question: 'How likely are you to recommend this waterfront venue for future events?',
                businessTypeID: ["Marriage Banquets"],
                businessSubtypeID: ['Beach side or Waterfront Venues'],
                order: 7,
            },
            //Vegetarian Restaurants
            {
                question: 'How diverse and creative is the vegetarian menu?',
                businessTypeID: ["Restaurant"],
                businessSubtypeID: ['Vegetarian Restaurants'],
                order: 1,
            },
            {
                question: 'Are there sufficient options for those with specific dietary restrictions (vegan, gluten-free)?',
                businessTypeID: ["Restaurant"],
                businessSubtypeID: ['Vegetarian Restaurants'],
                order: 2,
            },
            {
                question: 'How fresh are the ingredients used in the dishes?',
                businessTypeID: ["Restaurant"],
                businessSubtypeID: ['Vegetarian Restaurants'],
                order: 3,
            },
            {
                question: 'How satisfying are the portion sizes?',
                businessTypeID: ["Restaurant"],
                businessSubtypeID: ['Vegetarian Restaurants'],
                order: 4,
            },
            {
                question: 'How well do the flavors come together in the dishes?',
                businessTypeID: ["Restaurant"],
                businessSubtypeID: ['Vegetarian Restaurants'],
                order: 5,
            },
            {
                question: 'What is the overall ambiance, and does it feel welcoming for vegetarian diners?',
                businessTypeID: ["Restaurant"],
                businessSubtypeID: ['Vegetarian Restaurants'],
                order: 6,
            },
            {
                question: 'Would you recommend any standout dishes or must-try items?',
                businessTypeID: ["Restaurant"],
                businessSubtypeID: ['Vegetarian Restaurants'],
                order: 7,
            },
            //Non-Vegetarian Restaurants
            {
                question: 'How well are different meats prepared and cooked?',
                businessTypeID: ["Restaurant"],
                businessSubtypeID: ['Non-Vegetarian Restaurants'],
                order: 1,
            },
            {
                question: 'Are there unique or signature dishes that highlight the meat offerings?',
                businessTypeID: ["Restaurant"],
                businessSubtypeID: ['Non-Vegetarian Restaurants'],
                order: 2,
            },
            {
                question: 'How knowledgeable is the staff about the various meat selections?',
                businessTypeID: ["Restaurant"],
                businessSubtypeID: ['Non-Vegetarian Restaurants'],
                order: 3,
            },
            {
                question: 'How do the sides complement the main dishes?',
                businessTypeID: ["Restaurant"],
                businessSubtypeID: ['Non-Vegetarian Restaurants'],
                order: 4,
            },
            {
                question: 'How satisfying are the portion sizes in relation to the price?',
                businessTypeID: ["Restaurant"],
                businessSubtypeID: ['Non-Vegetarian Restaurants'],
                order: 5,
            },
            {
                question: 'What is the overall atmosphere, and does it enhance the dining experience?',
                businessTypeID: ["Restaurant"],
                businessSubtypeID: ['Non-Vegetarian Restaurants'],
                order: 6,
            },
            {
                question: 'Would you recommend any standout dishes or specials?',
                businessTypeID: ["Restaurant"],
                businessSubtypeID: ['Non-Vegetarian Restaurants'],
                order: 7,
            },
            //Mixed Cuisine Restaurants
            {
                question: 'How well do the various cuisines blend together on the menu?',
                businessTypeID: ["Restaurant"],
                businessSubtypeID: ['Mixed Cuisine Restaurants'],
                order: 1,
            },
            {
                question: 'Are there standout dishes that represent each cuisine effectively?',
                businessTypeID: ["Restaurant"],
                businessSubtypeID: ['Mixed Cuisine Restaurants'],
                order: 2,
            },
            {
                question: 'How consistent is the quality of the dishes across different cuisines?',
                businessTypeID: ["Restaurant"],
                businessSubtypeID: ['Mixed Cuisine Restaurants'],
                order: 3,
            },
            {
                question: 'How accommodating is the menu for different dietary preferences?',
                businessTypeID: ["Restaurant"],
                businessSubtypeID: ['Mixed Cuisine Restaurants'],
                order: 4,
            },
            {
                question: 'What is the overall atmosphere, and does it reflect the mixed culinary theme?',
                businessTypeID: ["Restaurant"],
                businessSubtypeID: ['Mixed Cuisine Restaurants'],
                order: 5,
            },
            {
                question: 'How knowledgeable is the staff about the different cuisines offered?',
                businessTypeID: ["Restaurant"],
                businessSubtypeID: ['Mixed Cuisine Restaurants'],
                order: 6,
            },
            {
                question: 'Would you recommend any specific dishes or combinations to try?',
                businessTypeID: ["Restaurant"],
                businessSubtypeID: ['Mixed Cuisine Restaurants'],
                order: 7,
            },
            //Seafood Restaurants
            {
                question: 'How fresh does the seafood taste, and how is it sourced?',
                businessTypeID: ["Restaurant"],
                businessSubtypeID: ['Seafood Restaurants'],
                order: 1,
            },
            {
                question: 'Are there unique or signature seafood dishes that stand out?',
                businessTypeID: ["Restaurant"],
                businessSubtypeID: ['Seafood Restaurants'],
                order: 2,
            },
            {
                question: 'How well does the restaurant cater to both casual and fine dining experiences?',
                businessTypeID: ["Restaurant"],
                businessSubtypeID: ['Seafood Restaurants'],
                order: 3,
            },
            {
                question: 'How well are the side dishes paired with the seafood offerings?',
                businessTypeID: ["Restaurant"],
                businessSubtypeID: ['Seafood Restaurants'],
                order: 4,
            },
            {
                question: 'What is the overall ambiance, and does it enhance the seafood dining experience?',
                businessTypeID: ["Restaurant"],
                businessSubtypeID: ['Seafood Restaurants'],
                order: 5,
            },
            {
                question: 'How knowledgeable is the staff about the seafood menu?',
                businessTypeID: ["Restaurant"],
                businessSubtypeID: ['Seafood Restaurants'],
                order: 6,
            },
            {
                question: 'Would you recommend any must-try dishes or specials?',
                businessTypeID: ["Restaurant"],
                businessSubtypeID: ['Seafood Restaurants'],
                order: 7,
            },
            //Barbecue (BBQ) Restaurants
            {
                question: 'How would you rate the smokiness and tenderness of the meats?',
                businessTypeID: ["Restaurant"],
                businessSubtypeID: ['Barbecue (BBQ) Restaurants'],
                order: 1,
            },
            {
                question: 'Are there different barbecue styles represented, and how well are they executed?',
                businessTypeID: ["Restaurant"],
                businessSubtypeID: ['Barbecue (BBQ) Restaurants'],
                order: 1,
            },
            {
                question: 'How do the sauces and sides complement the main barbecue dishes?',
                businessTypeID: ["Restaurant"],
                businessSubtypeID: ['Barbecue (BBQ) Restaurants'],
                order: 1,
            },
            {
                question: 'How satisfying are the portion sizes for the price?',
                businessTypeID: ["Restaurant"],
                businessSubtypeID: ['Barbecue (BBQ) Restaurants'],
                order: 1,
            },
            {
                question: 'What is the overall atmosphere, and does it fit the BBQ theme?',
                businessTypeID: ["Restaurant"],
                businessSubtypeID: ['Barbecue (BBQ) Restaurants'],
                order: 1,
            },
            {
                question: 'How knowledgeable is the staff about the barbecue menu?',
                businessTypeID: ["Restaurant"],
                businessSubtypeID: ['Barbecue (BBQ) Restaurants'],
                order: 1,
            },
            {
                question: 'Would you recommend any standout dishes or cooking styles?',
                businessTypeID: ["Restaurant"],
                businessSubtypeID: ['Barbecue (BBQ) Restaurants'],
                order: 1,
            },
        ]
        const questionData = await Promise.all(
            questions.map(async (question) => {
                const businessTypeID = await BusinessType.distinct('_id', { name: { $in: question.businessTypeID } }) as string[];
                const businessSubtypeID = await BusinessSubType.distinct('_id', { businessTypeID: { $in: businessTypeID }, name: { $in: question.businessSubtypeID } }) as string[];
                const businessQuestion = await BusinessQuestion.find({ businessTypeID: { $in: businessTypeID }, businessSubtypeID: { $in: businessSubtypeID }, question: question.question });
                if (!businessQuestion) {
                    const newBusiness = new BusinessQuestion();
                    newBusiness.icon = question.icon;
                    newBusiness.question = question.question;
                    newBusiness.name = question.name;
                    newBusiness.businessTypeID = businessTypeID;
                    newBusiness.businessSubtypeID = businessSubtypeID;
                    newBusiness.order = question.order;
                    newBusiness.answer = ['Yes', 'No']
                    await newBusiness.save();
                }
                return question;
            })
        )
        const reviewQuestion = await Promise.all(
            reviewQuestions.map(async (questionT) => {
                const businessTypeID = await BusinessType.distinct('_id', { name: { $in: questionT.businessTypeID } }) as string[];
                const businessSubtypeID = await BusinessSubType.distinct('_id', { businessTypeID: { $in: businessTypeID }, name: { $in: questionT.businessSubtypeID } }) as string[];
                const businessReviewQuestion = await BusinessReviewQuestion.findOne({ businessTypeID: { $in: businessTypeID }, businessSubtypeID: { $in: businessSubtypeID }, question: questionT.question });
                if (!businessReviewQuestion) {
                    const businessReviewQuestion = new BusinessReviewQuestion();
                    businessReviewQuestion.question = questionT.question;
                    businessReviewQuestion.businessTypeID = businessTypeID;
                    businessReviewQuestion.businessSubtypeID = businessSubtypeID;
                    businessReviewQuestion.order = questionT.order;
                    await businessReviewQuestion.save();
                }
                return questionT;
            })
        )
        return response.send(httpOk({
            data,
            reviewQuestion,
            questionData
        }, "Done"));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }

}

const getBusinessByPlaceID = async (request: Request, response: Response, next: NextFunction) => {
    try {
        const { placeID } = request.params;
        const businessProfileRef = await BusinessProfile.findOne({ placeID: placeID }, '_id id name coverImage profilePic address businessTypeID businessSubTypeID');
        if (!businessProfileRef) {
            const googleKey = "AIzaSyCp-X-z5geFn-8CBipvx310nH_VEaIbxlo";
            const apiResponse = await (await fetch(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeID}&key=${googleKey}`)).json();
            if (apiResponse.status === "OK") {
                const data = apiResponse.result;
                const name = data?.name ?? "";
                const lat = data?.geometry?.location?.lat ?? 0;
                const lng = data?.geometry?.location?.lng ?? 0;

                const photoReference = data?.photos && data?.photos?.length !== 0 ? data?.photos?.[0]?.photo_reference : null;
                let street = "";
                let city = "";
                let state = "";
                let zipCode = "";
                let country = "";
                const address_components = data?.address_components as { long_name: string, short_name: string, types: string[] }[];
                address_components.map((component) => {
                    const types = component.types;
                    if (types.includes('street_number') || types.includes('route') || types.includes("neighborhood") || types.includes("sublocality")) {
                        street = component.long_name;
                    } else if (types.includes('locality')) {
                        city = component.long_name;
                    } else if (types.includes('administrative_area_level_1')) {
                        state = component.short_name;
                    } else if (types.includes('postal_code')) {
                        zipCode = component.long_name;
                    }
                    else if (types.includes('country')) {
                        country = component.short_name;
                    }
                });
                let coverImage = "";
                if (photoReference) {
                    coverImage = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoReference}`;
                }
                const businessProfileRef = {
                    "profilePic": {
                        "small": coverImage,
                        "medium": coverImage,
                        "large": coverImage
                    },
                    // "businessTypeID": "66f6859833d7970343e8ae21",
                    // "businessSubTypeID": "66f6859933d7970343e8ae47",
                    "name": name,
                    "address": {
                        "geoCoordinate": {
                            "type": "Point",
                            "coordinates": [
                                lng,
                                lat
                            ]
                        },
                        "street": street,
                        "city": city,
                        "state": state,
                        "zipCode": zipCode,
                        "country": country,
                        "lat": lat,
                        "lng": lng
                    },
                    "coverImage": coverImage,
                }
                const reviewQuestions: any[] = [];
                return response.send(httpOk({
                    businessProfileRef,
                    reviewQuestions
                }, "Business profile fetched"));
            }
            return response.send(httpInternalServerError(null, ErrorMessage.INTERNAL_SERVER_ERROR));
        }
        const reviewQuestions = await BusinessReviewQuestion.find({ businessTypeID: { $in: businessProfileRef.businessTypeID }, businessSubtypeID: { $in: businessProfileRef.businessSubTypeID } }, '_id question id')
        return response.send(httpOk({
            businessProfileRef,
            reviewQuestions
        }, "Business profile fetched"));
    } catch (error: any) {
        next(httpInternalServerError(error, error.message ?? ErrorMessage.INTERNAL_SERVER_ERROR));
    }
}

export default { feed, businessTypes, businessSubTypes, businessQuestions, dbSeeder, getBusinessByPlaceID };