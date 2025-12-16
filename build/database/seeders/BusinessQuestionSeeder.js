"use strict";
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
const businessType_model_1 = __importDefault(require("../models/businessType.model"));
const businessSubType_model_1 = __importDefault(require("../models/businessSubType.model"));
const BusinessSubtypeSeeder_1 = require("./BusinessSubtypeSeeder");
const businessQuestion_model_1 = __importDefault(require("../models/businessQuestion.model"));
class BusinessQuestionSeeder {
    constructor(hostAddress) {
        this.hostAddress = hostAddress;
    }
    shouldRun() {
        return __awaiter(this, void 0, void 0, function* () {
            const count = yield businessQuestion_model_1.default.countDocuments().exec();
            return count === 0;
        });
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            const questions = [
                {
                    icon: this.hostAddress + '/public/files/airport.png',
                    name: 'Airport',
                    question: 'Airport?',
                    businessTypeID: ["Hotel"],
                    businessSubtypeID: ['3 star', '4 star', '5 star'],
                    order: 1,
                },
                {
                    icon: this.hostAddress + '/public/files/railway-station.png',
                    name: 'Railway Station',
                    question: 'Railway Station?',
                    businessTypeID: ["Hotel"],
                    businessSubtypeID: ['3 star', '4 star', '5 star'],
                    order: 2,
                },
                {
                    icon: this.hostAddress + '/public/files/bus.png',
                    name: 'Bus Stand',
                    question: 'Bus Stand?',
                    businessTypeID: ["Hotel"],
                    businessSubtypeID: ['3 star', '4 star', '5 star'],
                    order: 3,
                },
                {
                    icon: this.hostAddress + '/public/files/gov-hospital.png',
                    name: 'Gov Hospital',
                    question: 'Gov Hospital?',
                    businessTypeID: ["Hotel"],
                    businessSubtypeID: ['3 star', '4 star', '5 star'],
                    order: 4,
                },
                {
                    icon: this.hostAddress + '/public/files/pet-friendly.png',
                    name: 'Pet-friendly',
                    question: 'Pet friendly?',
                    businessTypeID: ["Hotel"],
                    businessSubtypeID: ['4 star', '5 star'],
                    order: 5,
                },
                {
                    icon: this.hostAddress + '/public/files/baby-care.png',
                    name: 'Baby Care',
                    question: 'Baby care?',
                    businessTypeID: ["Hotel"],
                    businessSubtypeID: ['4 star', '5 star'],
                    order: 6,
                },
                {
                    icon: this.hostAddress + '/public/files/parking-facility.png',
                    name: 'Parking',
                    question: 'Parking facility?',
                    businessTypeID: ["Hotel"],
                    businessSubtypeID: ['3 star', '4 star', '5 star'],
                    order: 7,
                },
                {
                    icon: this.hostAddress + '/public/files/cab-facility.png',
                    name: 'Cab Facility',
                    question: 'Cab facility on call?',
                    businessTypeID: ["Hotel"],
                    businessSubtypeID: ['4 star', '5 star'],
                    order: 8,
                },
                {
                    icon: this.hostAddress + '/public/files/room-service.png',
                    name: 'Room Service',
                    question: '24x7 room service?',
                    businessTypeID: ["Hotel"],
                    businessSubtypeID: ['4 star', '5 star'],
                    order: 9,
                },
                {
                    icon: this.hostAddress + '/public/files/personal-driver.png',
                    name: 'Personal Driver',
                    question: 'Personal driver room?',
                    businessTypeID: ["Hotel"],
                    businessSubtypeID: ['4 star', '5 star'],
                    order: 10,
                },
                {
                    icon: this.hostAddress + '/public/files/check-in.png',
                    name: 'Check in 24*7',
                    question: '24hrs check-in?',
                    businessTypeID: ["Hotel"],
                    businessSubtypeID: ['4 star', '5 star'],
                    order: 11,
                },
                {
                    icon: this.hostAddress + '/public/files/gym.png',
                    name: 'Gym',
                    question: 'Gym?',
                    businessTypeID: ["Hotel"],
                    businessSubtypeID: ['4 star', '5 star'],
                    order: 12,
                },
                {
                    icon: this.hostAddress + '/public/files/pet-friendly.png',
                    name: 'Swimming Pool',
                    question: 'Swimming pool?',
                    businessTypeID: ["Hotel"],
                    businessSubtypeID: ['4 star', '5 star'],
                    order: 13,
                },
                {
                    icon: this.hostAddress + '/public/files/conference-room.png',
                    name: 'Conference Room',
                    question: 'Conference room?',
                    businessTypeID: ["Hotel"],
                    businessSubtypeID: ['4 star', '5 star'],
                    order: 14,
                },
                {
                    icon: this.hostAddress + '/public/files/help-desk.png',
                    name: 'Help Desk',
                    question: 'Travel help desk?',
                    businessTypeID: ["Hotel"],
                    businessSubtypeID: ['4 star', '5 star'],
                    order: 15,
                },
                //3 star
                {
                    icon: this.hostAddress + '/public/files/non-ac-room.png',
                    name: 'Non-AC Rooms',
                    question: 'Non-AC rooms?',
                    businessTypeID: ["Hotel"],
                    businessSubtypeID: ['3 star'],
                    order: 1,
                },
                {
                    icon: this.hostAddress + '/public/files/local-id.png',
                    name: 'Local ID',
                    question: 'Do you accept local ID?',
                    businessTypeID: ["Hotel"],
                    businessSubtypeID: ['3 star'],
                    order: 2,
                },
                {
                    icon: this.hostAddress + '/public/files/wifi.png',
                    name: 'Wi-Fi',
                    question: 'Wi-Fi?',
                    businessTypeID: ["Hotel"],
                    businessSubtypeID: ['3 star'],
                    order: 3,
                },
                {
                    icon: this.hostAddress + '/public/files/laundry-service.png',
                    name: 'Laundry Service',
                    question: 'Laundry service?',
                    businessTypeID: ["Hotel"],
                    businessSubtypeID: ['3 star'],
                    order: 4,
                },
                {
                    icon: this.hostAddress + '/public/files/safety-locker.png',
                    name: 'Locker in the room',
                    question: 'Safety locker in the room?',
                    businessTypeID: ["Hotel"],
                    businessSubtypeID: ['3 star'],
                    order: 5,
                },
                {
                    icon: this.hostAddress + '/public/files/geyser.png',
                    name: 'Geyser',
                    question: 'Geyser in the washroom?',
                    businessTypeID: ["Hotel"],
                    businessSubtypeID: ['3 star'],
                    order: 6,
                },
                {
                    icon: this.hostAddress + '/public/files/kitchen.png',
                    name: 'Kitchen',
                    question: 'Hotel have a kitchen?',
                    businessTypeID: ["Hotel"],
                    businessSubtypeID: ['3 star'],
                    order: 7,
                },
                {
                    icon: this.hostAddress + '/public/files/extra-bed.png',
                    name: 'Extra Bed Facility',
                    question: 'Extra bed facility?',
                    businessTypeID: ["Hotel"],
                    businessSubtypeID: ['3 star'],
                    order: 8,
                },
                {
                    icon: this.hostAddress + '/public/files/couple-friendly.png',
                    name: 'Couple Friendly',
                    question: 'Couple friendly?',
                    businessTypeID: ["Hotel"],
                    businessSubtypeID: ['3 star'],
                    order: 9,
                },
                //Home Stays
                {
                    icon: this.hostAddress + '/public/files/caretaker-on-the-property.png',
                    name: 'Caretaker',
                    question: 'Caretaker on the property?',
                    businessTypeID: ["Home Stays"],
                    businessSubtypeID: BusinessSubtypeSeeder_1.HomeStays,
                    order: 1,
                },
                {
                    icon: this.hostAddress + '/public/files/parking-facility.png',
                    name: 'Parking',
                    question: 'Dedicated car parking?',
                    businessTypeID: ["Home Stays"],
                    businessSubtypeID: BusinessSubtypeSeeder_1.HomeStays,
                    order: 2,
                },
                {
                    icon: this.hostAddress + '/public/files/open-kitchen-to-use.png',
                    name: 'Open Kitchen',
                    question: 'Open kitchen to use?',
                    businessTypeID: ["Home Stays"],
                    businessSubtypeID: BusinessSubtypeSeeder_1.HomeStays,
                    order: 3,
                },
                {
                    icon: this.hostAddress + '/public/files/open-kitchen-to-use.png',
                    name: 'Garden',
                    question: 'Garden area?',
                    businessTypeID: ["Home Stays"],
                    businessSubtypeID: BusinessSubtypeSeeder_1.HomeStays,
                    order: 4,
                },
                {
                    icon: this.hostAddress + '/public/files/pet-friendly.png',
                    name: 'Pet-friendly',
                    question: 'Pet friendly?',
                    businessTypeID: ["Home Stays"],
                    businessSubtypeID: BusinessSubtypeSeeder_1.HomeStays,
                    order: 5,
                },
                {
                    icon: this.hostAddress + '/public/files/sos-helpline.png',
                    name: 'SOS helpline',
                    question: 'SOS helpline?',
                    businessTypeID: ["Home Stays"],
                    businessSubtypeID: BusinessSubtypeSeeder_1.HomeStays,
                    order: 6,
                },
                {
                    icon: this.hostAddress + '/public/files/locker-facility.png',
                    name: 'Locker Facility',
                    question: 'Locker facility?',
                    businessTypeID: ["Home Stays"],
                    businessSubtypeID: BusinessSubtypeSeeder_1.HomeStays,
                    order: 7,
                },
                {
                    icon: this.hostAddress + '/public/files/check-in.png',
                    name: 'Check in 24*7',
                    question: '24hrs check-in?',
                    businessTypeID: ["Home Stays"],
                    businessSubtypeID: BusinessSubtypeSeeder_1.HomeStays,
                    order: 8,
                },
                {
                    icon: this.hostAddress + '/public/files/campfire-space.png',
                    name: 'Campfire Space',
                    question: 'Campfire space?',
                    businessTypeID: ["Home Stays"],
                    businessSubtypeID: BusinessSubtypeSeeder_1.HomeStays,
                    order: 9,
                },
                {
                    icon: this.hostAddress + '/public/files/pet-friendly.png',
                    name: 'Swimming Pool',
                    question: 'Swimming pool?',
                    businessTypeID: ["Home Stays"],
                    businessSubtypeID: BusinessSubtypeSeeder_1.HomeStays,
                    order: 10,
                },
                //Bar/ Night Club
                {
                    icon: this.hostAddress + '/public/files/multiple-floors.png',
                    name: 'Multiple Floors',
                    question: 'Do you have multiple floors?',
                    businessTypeID: ["Bars / Clubs"],
                    businessSubtypeID: BusinessSubtypeSeeder_1.BarsClubs,
                    order: 1,
                },
                {
                    icon: this.hostAddress + '/public/files/event-friendly.png',
                    name: 'Event Friendly',
                    question: 'Event friendly?',
                    businessTypeID: ["Bars / Clubs"],
                    businessSubtypeID: BusinessSubtypeSeeder_1.BarsClubs,
                    order: 2,
                },
                {
                    icon: this.hostAddress + '/public/files/valet-parking.png',
                    name: 'Valet Parking',
                    question: 'Valet parking?',
                    businessTypeID: ["Bars / Clubs"],
                    businessSubtypeID: BusinessSubtypeSeeder_1.BarsClubs,
                    order: 3,
                },
                {
                    icon: this.hostAddress + '/public/files/open-air.png',
                    name: 'Open Roof Sitting',
                    question: 'Open roof sitting?',
                    businessTypeID: ["Bars / Clubs"],
                    businessSubtypeID: BusinessSubtypeSeeder_1.BarsClubs,
                    order: 4,
                },
                {
                    icon: this.hostAddress + '/public/files/rooftop-bar.png',
                    name: 'Rooftop Bar',
                    question: 'Rooftop bar?',
                    businessTypeID: ["Bars / Clubs"],
                    businessSubtypeID: BusinessSubtypeSeeder_1.BarsClubs,
                    order: 5,
                },
                {
                    icon: this.hostAddress + '/public/files/stag-entry.png',
                    name: 'Stag Entry',
                    question: 'Stag entry?',
                    businessTypeID: ["Bars / Clubs"],
                    businessSubtypeID: BusinessSubtypeSeeder_1.BarsClubs,
                    order: 6,
                },
                {
                    icon: this.hostAddress + '/public/files/emergency-escape-door.png',
                    name: 'Emergency Escape Door',
                    question: 'Emergency escape door?',
                    businessTypeID: ["Bars / Clubs"],
                    businessSubtypeID: BusinessSubtypeSeeder_1.BarsClubs,
                    order: 7,
                },
                {
                    icon: this.hostAddress + '/public/files/valid-liquor-selling-license.png',
                    name: 'Valid liquor selling license',
                    question: 'Valid liquor selling license?',
                    businessTypeID: ["Bars / Clubs"],
                    businessSubtypeID: BusinessSubtypeSeeder_1.BarsClubs,
                    order: 8,
                },
                {
                    icon: this.hostAddress + '/public/files/theme-based.png',
                    name: 'Theme based',
                    question: 'Theme based?',
                    businessTypeID: ["Bars / Clubs"],
                    businessSubtypeID: BusinessSubtypeSeeder_1.BarsClubs,
                    order: 9,
                },
                {
                    icon: this.hostAddress + '/public/files/live-dj.png',
                    name: 'Live DJ',
                    question: 'Live DJ?',
                    businessTypeID: ["Bars / Clubs"],
                    businessSubtypeID: BusinessSubtypeSeeder_1.BarsClubs,
                    order: 10,
                },
                {
                    icon: this.hostAddress + '/public/files/band-performance.png',
                    name: 'Band Performance',
                    question: 'Band performance?',
                    businessTypeID: ["Bars / Clubs"],
                    businessSubtypeID: BusinessSubtypeSeeder_1.BarsClubs,
                    order: 11,
                },
                //Restaurant
                {
                    icon: this.hostAddress + '/public/files/open-air.png',
                    name: 'Open Air Dining',
                    question: 'Open air dining?',
                    businessTypeID: ["Restaurant"],
                    businessSubtypeID: BusinessSubtypeSeeder_1.Restaurants,
                    order: 1,
                },
                {
                    icon: this.hostAddress + '/public/files/update-your-menu.png',
                    name: 'Update your menu',
                    question: 'Do you update your menu?',
                    businessTypeID: ["Restaurant"],
                    businessSubtypeID: BusinessSubtypeSeeder_1.Restaurants,
                    order: 2,
                },
                {
                    icon: this.hostAddress + '/public/files/self-delivery-system.png',
                    name: 'Self-Delivery System',
                    question: 'Do you have a self-delivery system?',
                    businessTypeID: ["Restaurant"],
                    businessSubtypeID: BusinessSubtypeSeeder_1.Restaurants,
                    order: 3,
                },
                {
                    icon: this.hostAddress + '/public/files/buffet-system.png',
                    name: 'Buffet system',
                    question: 'Do you have a buffet system?',
                    businessTypeID: ["Restaurant"],
                    businessSubtypeID: BusinessSubtypeSeeder_1.Restaurants,
                    order: 4,
                },
                {
                    icon: this.hostAddress + '/public/files/reservation-facility.png',
                    name: 'Reservation facility',
                    question: 'Reservation facility?',
                    businessTypeID: ["Restaurant"],
                    businessSubtypeID: BusinessSubtypeSeeder_1.Restaurants,
                    order: 5,
                },
                {
                    icon: this.hostAddress + '/public/files/host-a-party.png',
                    name: 'Host a Party',
                    question: 'Can host a party?',
                    businessTypeID: ["Restaurant"],
                    businessSubtypeID: BusinessSubtypeSeeder_1.Restaurants,
                    order: 6,
                },
                {
                    icon: this.hostAddress + '/public/files/recognized-café.png',
                    name: 'Recognized Café',
                    question: 'Are you a well-known recognized café?',
                    businessTypeID: ["Restaurant"],
                    businessSubtypeID: BusinessSubtypeSeeder_1.Restaurants,
                    order: 7,
                },
                {
                    icon: this.hostAddress + '/public/files/well-known-restaurant.png',
                    name: 'Well-known Restaurant',
                    question: 'Are you a well-known restaurant?',
                    businessTypeID: ["Restaurant"],
                    businessSubtypeID: BusinessSubtypeSeeder_1.Restaurants,
                    order: 8,
                },
                {
                    icon: this.hostAddress + '/public/files/vegetarian.png',
                    name: 'Pure Veg Restaurant',
                    question: 'Are you a pure Veg?',
                    businessTypeID: ["Restaurant"],
                    businessSubtypeID: BusinessSubtypeSeeder_1.Restaurants,
                    order: 9,
                },
                {
                    icon: this.hostAddress + '/public/files/vegan.png',
                    name: 'Vegan Restaurant',
                    question: 'Are you a Vegan restaurant?',
                    businessTypeID: ["Restaurant"],
                    businessSubtypeID: BusinessSubtypeSeeder_1.Restaurants,
                    order: 10,
                },
                {
                    icon: this.hostAddress + '/public/files/open-air.png',
                    name: 'Outside Dining',
                    question: 'Outside dining?',
                    businessTypeID: ["Restaurant"],
                    businessSubtypeID: BusinessSubtypeSeeder_1.Restaurants,
                    order: 11,
                },
                //Marriage Banquets
                {
                    icon: this.hostAddress + '/public/files/parking-facility.png',
                    name: 'Parking',
                    question: 'Parking space?',
                    businessTypeID: ["Marriage Banquets"],
                    businessSubtypeID: BusinessSubtypeSeeder_1.MarriageBanquets,
                    order: 1,
                },
                {
                    icon: this.hostAddress + '/public/files/elegant-décor.png',
                    name: 'Elegant Décor',
                    question: 'Elegant décor?',
                    businessTypeID: ["Marriage Banquets"],
                    businessSubtypeID: BusinessSubtypeSeeder_1.MarriageBanquets,
                    order: 2,
                },
                {
                    icon: this.hostAddress + '/public/files/different-themes.png',
                    name: 'Different Themes',
                    question: 'Different themes?',
                    businessTypeID: ["Marriage Banquets"],
                    businessSubtypeID: BusinessSubtypeSeeder_1.MarriageBanquets,
                    order: 3,
                },
                {
                    icon: this.hostAddress + '/public/files/event-planner.png',
                    name: 'Event Planner',
                    question: 'Event planner?',
                    businessTypeID: ["Marriage Banquets"],
                    businessSubtypeID: BusinessSubtypeSeeder_1.MarriageBanquets,
                    order: 4,
                },
                {
                    icon: this.hostAddress + '/public/files/outside-catering.png',
                    name: 'Outside Catering Service',
                    question: 'Outside catering service?',
                    businessTypeID: ["Marriage Banquets"],
                    businessSubtypeID: BusinessSubtypeSeeder_1.MarriageBanquets,
                    order: 5,
                },
                {
                    icon: this.hostAddress + '/public/files/transportation-service.png',
                    name: 'Transportation Service',
                    question: 'Transportation service?',
                    businessTypeID: ["Marriage Banquets"],
                    businessSubtypeID: BusinessSubtypeSeeder_1.MarriageBanquets,
                    order: 6,
                },
                {
                    icon: this.hostAddress + '/public/files/audio-visual.png',
                    name: 'Audio-Visual equipment',
                    question: 'Audio-visual equipment?',
                    businessTypeID: ["Marriage Banquets"],
                    businessSubtypeID: BusinessSubtypeSeeder_1.MarriageBanquets,
                    order: 7,
                },
                {
                    icon: this.hostAddress + '/public/files/premium-bar-service.png',
                    name: 'Premium Bar Service',
                    question: 'Premium bar service?',
                    businessTypeID: ["Marriage Banquets"],
                    businessSubtypeID: BusinessSubtypeSeeder_1.MarriageBanquets,
                    order: 8,
                },
                {
                    icon: this.hostAddress + '/public/files/emergency-escape-door.png',
                    name: 'Fire Escape',
                    question: 'Fire escape?',
                    businessTypeID: ["Marriage Banquets"],
                    businessSubtypeID: BusinessSubtypeSeeder_1.MarriageBanquets,
                    order: 9,
                },
            ];
            const questionData = yield Promise.all(questions.map((question) => __awaiter(this, void 0, void 0, function* () {
                const businessTypeID = yield businessType_model_1.default.distinct('_id', { name: { $in: question.businessTypeID } });
                const businessSubtypeID = yield businessSubType_model_1.default.distinct('_id', { businessTypeID: { $in: businessTypeID }, name: { $in: question.businessSubtypeID } });
                const businessQuestion = yield businessQuestion_model_1.default.findOne({ businessTypeID: { $in: businessTypeID }, businessSubtypeID: { $in: businessSubtypeID }, question: question.question });
                if (!businessQuestion) {
                    const newBusiness = new businessQuestion_model_1.default();
                    newBusiness.icon = question.icon;
                    newBusiness.question = question.question;
                    newBusiness.name = question.name;
                    newBusiness.businessTypeID = businessTypeID;
                    newBusiness.businessSubtypeID = businessSubtypeID;
                    newBusiness.order = question.order;
                    newBusiness.answer = ['Yes', 'No'];
                    yield newBusiness.save();
                }
                return question;
            })));
            return questionData;
        });
    }
}
exports.default = BusinessQuestionSeeder;
