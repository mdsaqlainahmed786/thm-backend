import BusinessType from "../models/businessType.model";
import BusinessSubType from "../models/businessSubType.model";
import { HomeStays, Restaurants, MarriageBanquets, BarsClubs, Hotes, } from "./BusinessSubtypeSeeder";
import { BusinessTypes, } from "./BusinessTypeSeeder";
import BusinessReviewQuestion from "../models/businessReviewQuestion.model";

class ReviewQuestionSeeder {
    hostAddress: string;
    constructor(hostAddress: string) {
        this.hostAddress = hostAddress;
    }
    async shouldRun() {
        const count = await BusinessReviewQuestion.countDocuments().exec();
        return count === 0;
    }
    async run() {
        const reviewQuestions = [
            {
                icon: this.hostAddress + '/public/files/airport.png',
                question: 'How would you rate the cleanliness of your room?',
                businessTypeID: [BusinessTypes[0]],
                businessSubtypeID: [Hotes[0]],
                order: 1,
            },
            {
                icon: this.hostAddress + '/public/files/airport.png',
                question: 'How comfortable was your bed?',
                businessTypeID: [BusinessTypes[0]],
                businessSubtypeID: [Hotes[0]],
                order: 2,
            },
            {
                icon: this.hostAddress + '/public/files/airport.png',
                question: 'Were the basic amenities (Wi-Fi, toiletries, etc.) satisfactory?',
                businessTypeID: [BusinessTypes[0]],
                businessSubtypeID: [Hotes[0]],
                order: 3,
            },
            {
                icon: this.hostAddress + '/public/files/airport.png',
                question: 'How would you assess the friendliness of the staff?',
                businessTypeID: [BusinessTypes[0]],
                businessSubtypeID: [Hotes[0]],
                order: 4,
            },
            {
                icon: this.hostAddress + '/public/files/airport.png',
                question: 'How was the quality of the food in the hotel restaurant?',
                businessTypeID: [BusinessTypes[0]],
                businessSubtypeID: [Hotes[0]],
                order: 5,
            },
            {
                icon: this.hostAddress + '/public/files/airport.png',
                question: 'How well did the hotel meet your expectations for value?',
                businessTypeID: [BusinessTypes[0]],
                businessSubtypeID: [Hotes[0]],
                order: 6,
            },
            {
                icon: this.hostAddress + '/public/files/airport.png',
                question: 'How accessible were nearby attractions and services?',
                businessTypeID: [BusinessTypes[0]],
                businessSubtypeID: [Hotes[0]],
                order: 7,
            },
            //4 star
            {
                icon: this.hostAddress + '/public/files/non-ac-room.png',
                question: 'How would you rate the overall cleanliness and maintenance of the hotel?',
                businessTypeID: [BusinessTypes[0]],
                businessSubtypeID: [Hotes[1]],
                order: 1,
            },
            {
                icon: this.hostAddress + '/public/files/non-ac-room.png',
                question: 'How comfortable and well-furnished was your room?',
                businessTypeID: [BusinessTypes[0]],
                businessSubtypeID: [Hotes[1]],
                order: 2,
            },
            {
                icon: this.hostAddress + '/public/files/non-ac-room.png',
                question: 'How would you assess the quality and variety of amenities provided?',
                businessTypeID: [BusinessTypes[0]],
                businessSubtypeID: [Hotes[1]],
                order: 3,
            },
            {
                icon: this.hostAddress + '/public/files/non-ac-room.png',
                question: 'How friendly and professional was the hotel staff?',
                businessTypeID: [BusinessTypes[0]],
                businessSubtypeID: [Hotes[1]],
                order: 4,
            },
            {
                icon: this.hostAddress + '/public/files/non-ac-room.png',
                question: 'How satisfied were you with the dining options available?',
                businessTypeID: [BusinessTypes[0]],
                businessSubtypeID: [Hotes[1]],
                order: 5,
            },
            {
                icon: this.hostAddress + '/public/files/non-ac-room.png',
                question: 'How would you rate the hotel’s facilities (pool, gym, spa, etc.)?',
                businessTypeID: [BusinessTypes[0]],
                businessSubtypeID: [Hotes[1]],
                order: 6,
            },
            {
                icon: this.hostAddress + '/public/files/non-ac-room.png',
                question: 'How convenient was the hotel’s location for your plans?',
                businessTypeID: [BusinessTypes[0]],
                businessSubtypeID: [Hotes[1]],
                order: 7,
            },
            //5 star
            {
                icon: this.hostAddress + '/public/files/non-ac-room.png',
                question: 'How would you rate the cleanliness and attention to detail in your room?',
                businessTypeID: [BusinessTypes[0]],
                businessSubtypeID: [Hotes[2]],
                order: 1,
            },
            {
                icon: this.hostAddress + '/public/files/non-ac-room.png',
                question: 'How luxurious was the bedding and furnishings in your room?',
                businessTypeID: [BusinessTypes[0]],
                businessSubtypeID: [Hotes[2]],
                order: 2,
            },
            {
                icon: this.hostAddress + '/public/files/non-ac-room.png',
                question: 'How exceptional were the amenities and services provided?',
                businessTypeID: [BusinessTypes[0]],
                businessSubtypeID: [Hotes[2]],
                order: 3,
            },
            {
                icon: this.hostAddress + '/public/files/non-ac-room.png',
                question: 'How attentive and personalized was the service from the staff?',
                businessTypeID: [BusinessTypes[0]],
                businessSubtypeID: [Hotes[2]],
                order: 4,
            },
            {
                icon: this.hostAddress + '/public/files/non-ac-room.png',
                question: 'How would you assess the quality of the hotel’s dining experiences?',
                businessTypeID: [BusinessTypes[0]],
                businessSubtypeID: [Hotes[2]],
                order: 5,
            },
            {
                icon: this.hostAddress + '/public/files/non-ac-room.png',
                question: 'How well did the hotel exceed your expectations overall?',
                businessTypeID: [BusinessTypes[0]],
                businessSubtypeID: [Hotes[2]],
                order: 6,
            },
            {
                icon: this.hostAddress + '/public/files/non-ac-room.png',
                question: 'How memorable was your experience in terms of ambiance and hospitality?',
                businessTypeID: [BusinessTypes[0]],
                businessSubtypeID: [Hotes[2]],
                order: 7,
            },
            //Home Stays
            {
                icon: this.hostAddress + '/public/files/caretaker-on-the-property.png',
                question: 'How would you rate the cleanliness and upkeep of the home??',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: ['Traditional'],
                order: 1,
            },
            {
                icon: this.hostAddress + '/public/files/caretaker-on-the-property.png',
                question: 'How comfortable were the furnishings and bedding?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: ['Traditional'],
                order: 2,
            },
            {
                icon: this.hostAddress + '/public/files/caretaker-on-the-property.png',
                question: 'How well did the amenities reflect the traditional experience?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: ['Traditional'],
                order: 3,
            },
            {
                icon: this.hostAddress + '/public/files/caretaker-on-the-property.png',
                question: 'How friendly and welcoming was the host?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: ['Traditional'],
                order: 4,
            },
            {
                icon: this.hostAddress + '/public/files/caretaker-on-the-property.png',
                question: 'How satisfied were you with the local food offerings?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: ['Traditional'],
                order: 5,
            },
            {
                icon: this.hostAddress + '/public/files/caretaker-on-the-property.png',
                question: 'How immersive was the cultural experience during your stay?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: ['Traditional'],
                order: 6,
            },
            {
                icon: this.hostAddress + '/public/files/caretaker-on-the-property.png',
                question: 'How convenient was the location for exploring local attractions?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: ['Traditional'],
                order: 7,
            },
            {
                icon: this.hostAddress + '/public/files/caretaker-on-the-property.png',
                question: 'How would you rate the overall cleanliness and luxury of the home?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: ['Luxury'],
                order: 1,
            },
            {
                icon: this.hostAddress + '/public/files/caretaker-on-the-property.png',
                question: 'How comfortable were the high-end furnishings and bedding?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: ['Luxury'],
                order: 2,
            },
            {
                icon: this.hostAddress + '/public/files/caretaker-on-the-property.png',
                question: 'How exceptional were the amenities provided (pool, spa, etc.)?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: ['Luxury'],
                order: 3,
            },
            {
                icon: this.hostAddress + '/public/files/caretaker-on-the-property.png',
                question: 'How attentive and professional was the host?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: ['Luxury'],
                order: 4,
            },
            {
                icon: this.hostAddress + '/public/files/caretaker-on-the-property.png',
                question: 'How would you assess the dining options and in-home chef services?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: ['Luxury'],
                order: 5,
            },
            {
                icon: this.hostAddress + '/public/files/caretaker-on-the-property.png',
                question: 'How well did the home exceed your expectations for a luxury stay?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: ['Luxury'],
                order: 6,
            },
            {
                icon: this.hostAddress + '/public/files/caretaker-on-the-property.png',
                question: 'How memorable was the overall ambiance and atmosphere?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: ['Luxury'],
                order: 7,
            },
            //Eco-Friendly
            {
                icon: this.hostAddress + '/public/files/caretaker-on-the-property.png',
                question: 'How would you rate the cleanliness and sustainability practices of the home?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: ['Eco-Friendly'],
                order: 1,
            },
            {
                icon: this.hostAddress + '/public/files/caretaker-on-the-property.png',
                question: 'How comfortable were the eco-friendly furnishings and bedding?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: ['Eco-Friendly'],
                order: 2,
            },
            {
                icon: this.hostAddress + '/public/files/caretaker-on-the-property.png',
                question: 'How well did the home incorporate sustainable amenities?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: ['Eco-Friendly'],
                order: 3,
            },
            {
                icon: this.hostAddress + '/public/files/caretaker-on-the-property.png',
                question: 'How knowledgeable and helpful was the host regarding eco-friendly practices?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: ['Eco-Friendly'],
                order: 4,
            },
            {
                icon: this.hostAddress + '/public/files/caretaker-on-the-property.png',
                question: 'How satisfied were you with the locally sourced food options?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: ['Eco-Friendly'],
                order: 5,
            },
            {
                icon: this.hostAddress + '/public/files/caretaker-on-the-property.png',
                question: 'How would you assess the home’s efforts to minimize environmental impact?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: ['Eco-Friendly'],
                order: 6,
            },
            {
                icon: this.hostAddress + '/public/files/caretaker-on-the-property.png',
                question: 'How convenient was the location for exploring nature or eco-friendly activities?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: ['Eco-Friendly'],
                order: 7,
            },
            //Adventure
            {
                icon: this.hostAddress + '/public/files/caretaker-on-the-property.png',
                question: 'How would you rate the cleanliness and suitability of the home for adventure seekers?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: ['Adventure'],
                order: 1,
            },
            {
                icon: this.hostAddress + '/public/files/caretaker-on-the-property.png',
                question: 'How comfortable were the accommodations after a day of activities?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: ['Adventure'],
                order: 2,
            },
            {
                icon: this.hostAddress + '/public/files/caretaker-on-the-property.png',
                question: 'How well did the home provide amenities for adventure (gear storage, etc.)?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: ['Adventure'],
                order: 3,
            },
            {
                icon: this.hostAddress + '/public/files/caretaker-on-the-property.png',
                question: 'How supportive was the host in planning activities and excursions?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: ['Adventure'],
                order: 4,
            },
            {
                icon: this.hostAddress + '/public/files/caretaker-on-the-property.png',
                question: 'How satisfied were you with the local dining options for post-adventure meals?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: ['Adventure'],
                order: 5,
            },
            {
                icon: this.hostAddress + '/public/files/caretaker-on-the-property.png',
                question: 'How would you assess the location for access to adventure activities?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: ['Adventure'],
                order: 6,
            },
            {
                icon: this.hostAddress + '/public/files/caretaker-on-the-property.png',
                question: 'How memorable was your experience in terms of adventure opportunities?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: ['Adventure'],
                order: 7,
            },

            //Artistic
            {
                icon: this.hostAddress + '/public/files/caretaker-on-the-property.png',
                question: 'How would you rate the cleanliness and artistic ambiance of the home?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: ['Artistic'],
                order: 1,
            },
            {
                icon: this.hostAddress + '/public/files/caretaker-on-the-property.png',
                question: 'How comfortable were the furnishings and artistic elements?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: ['Artistic'],
                order: 2,
            },
            {
                icon: this.hostAddress + '/public/files/caretaker-on-the-property.png',
                question: 'How well did the home reflect a creative and artistic atmosphere?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: ['Artistic'],
                order: 3,
            },
            {
                icon: this.hostAddress + '/public/files/caretaker-on-the-property.png',
                question: 'How engaging was the host in sharing local art and culture?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: ['Artistic'],
                order: 4,
            },
            {
                icon: this.hostAddress + '/public/files/caretaker-on-the-property.png',
                question: 'How satisfied were you with the local food options and presentation?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: ['Artistic'],
                order: 5,
            },
            {
                icon: this.hostAddress + '/public/files/caretaker-on-the-property.png',
                question: 'How would you assess the opportunities for artistic experiences during your stay?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: ['Artistic'],
                order: 6,
            },
            {
                icon: this.hostAddress + '/public/files/caretaker-on-the-property.png',
                question: 'How convenient was the location for exploring local art galleries and studios?',
                businessTypeID: ["Home Stays"],
                businessSubtypeID: ['Artistic'],
                order: 7,
            },
            //Bar/ Night Club
            {
                icon: this.hostAddress + '/public/files/multiple-floors.png',
                question: 'How would you rate the cleanliness and ambiance of the bar?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: ["Restro Bars"],
                order: 1,
            },
            {
                icon: this.hostAddress + '/public/files/multiple-floors.png',
                question: 'How satisfied were you with the variety of food and drink options?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: ["Restro Bars"],
                order: 2,
            },
            {
                icon: this.hostAddress + '/public/files/multiple-floors.png',
                question: 'How would you assess the quality and presentation of the food?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: ["Restro Bars"],
                order: 3,
            },
            {
                icon: this.hostAddress + '/public/files/multiple-floors.png',
                question: 'How friendly and attentive was the staff?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: ["Restro Bars"],
                order: 4,
            },
            {
                icon: this.hostAddress + '/public/files/multiple-floors.png',
                question: 'How enjoyable was the overall atmosphere for dining and socializing?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: ["Restro Bars"],
                order: 5,
            },
            {
                icon: this.hostAddress + '/public/files/multiple-floors.png',
                question: 'How convenient was the location for parking and accessibility?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: ["Restro Bars"],
                order: 6,
            },
            {
                icon: this.hostAddress + '/public/files/multiple-floors.png',
                question: 'How likely are you to recommend this resto bar to others?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: ["Restro Bars"],
                order: 7,
            },
            // Microbreweries
            {
                icon: this.hostAddress + '/public/files/multiple-floors.png',
                question: 'How would you rate the cleanliness and layout of the microbrewery?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: ["Microbreweries"],
                order: 1,
            },
            {
                icon: this.hostAddress + '/public/files/multiple-floors.png',
                question: 'How satisfied were you with the variety and quality of the beer offerings?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: ["Microbreweries"],
                order: 2,
            },
            {
                icon: this.hostAddress + '/public/files/multiple-floors.png',
                question: 'How knowledgeable and passionate was the staff about the brews?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: ["Microbreweries"],
                order: 3,
            },
            {
                icon: this.hostAddress + '/public/files/multiple-floors.png',
                question: 'How enjoyable was the overall atmosphere for tasting and socializing?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: ["Microbreweries"],
                order: 4,
            },
            {
                icon: this.hostAddress + '/public/files/multiple-floors.png',
                question: 'How would you assess the food menu in relation to the beer selection?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: ["Microbreweries"],
                order: 5,
            },
            {
                icon: this.hostAddress + '/public/files/multiple-floors.png',
                question: 'How likely are you to return for a tasting experience?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: ["Microbreweries"],
                order: 6,
            },
            {
                icon: this.hostAddress + '/public/files/multiple-floors.png',
                question: 'How convenient was the location for visiting?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: ["Microbreweries"],
                order: 7,
            },
            //Nightclubs
            {
                icon: this.hostAddress + '/public/files/multiple-floors.png',
                question: 'How would you rate the cleanliness and safety of the nightclub?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: ["Nightclubs"],
                order: 1,
            },
            {
                icon: this.hostAddress + '/public/files/multiple-floors.png',
                question: 'How satisfied were you with the music selection and DJ performance?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: ["Nightclubs"],
                order: 2,
            },
            {
                icon: this.hostAddress + '/public/files/multiple-floors.png',
                question: 'How would you assess the dance floor space and overall vibe?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: ["Nightclubs"],
                order: 3,
            },
            {
                icon: this.hostAddress + '/public/files/multiple-floors.png',
                question: 'How friendly and efficient was the staff in serving drinks?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: ["Nightclubs"],
                order: 4,
            },
            {
                icon: this.hostAddress + '/public/files/multiple-floors.png',
                question: 'How enjoyable was the overall atmosphere for dancing and socializing?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: ["Nightclubs"],
                order: 5,
            },
            {
                icon: this.hostAddress + '/public/files/multiple-floors.png',
                question: 'How convenient was the location and entry process?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: ["Nightclubs"],
                order: 6,
            },
            {
                icon: this.hostAddress + '/public/files/multiple-floors.png',
                question: 'How likely are you to recommend this nightclub to friends?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: ["Nightclubs"],
                order: 7,
            },
            //Lounge Bars
            {
                icon: this.hostAddress + '/public/files/multiple-floors.png',
                question: 'How would you rate the cleanliness and comfort of the lounge bar?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: ["Lounge Bars"],
                order: 1,
            },
            {
                icon: this.hostAddress + '/public/files/multiple-floors.png',
                question: 'How satisfied were you with the drink selection and quality?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: ["Lounge Bars"],
                order: 2,
            },
            {
                icon: this.hostAddress + '/public/files/multiple-floors.png',
                question: 'How would you assess the ambiance and decor for relaxation?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: ["Lounge Bars"],
                order: 3,
            },
            {
                icon: this.hostAddress + '/public/files/multiple-floors.png',
                question: 'How attentive and friendly was the staff?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: ["Lounge Bars"],
                order: 4,
            },
            {
                icon: this.hostAddress + '/public/files/multiple-floors.png',
                question: 'How enjoyable was the overall atmosphere for conversation and unwinding?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: ["Lounge Bars"],
                order: 5,
            },
            {
                icon: this.hostAddress + '/public/files/multiple-floors.png',
                question: 'How convenient was the location for parking and access?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: ["Lounge Bars"],
                order: 6,
            },
            {
                icon: this.hostAddress + '/public/files/multiple-floors.png',
                question: 'How likely are you to return for a relaxed evening out?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: ["Lounge Bars"],
                order: 7,
            },
            //Rooftop Bars
            {
                icon: this.hostAddress + '/public/files/multiple-floors.png',
                question: 'How would you rate the cleanliness and view from the rooftop bar?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: ["Rooftop Bars"],
                order: 1,
            },
            {
                icon: this.hostAddress + '/public/files/multiple-floors.png',
                question: 'How satisfied were you with the drink menu and quality?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: ["Rooftop Bars"],
                order: 2,
            },
            {
                icon: this.hostAddress + '/public/files/multiple-floors.png',
                question: 'How would you assess the seating and comfort levels?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: ["Rooftop Bars"],
                order: 3,
            },
            {
                icon: this.hostAddress + '/public/files/multiple-floors.png',
                question: 'How friendly and efficient was the staff in service?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: ["Rooftop Bars"],
                order: 4,
            },
            {
                icon: this.hostAddress + '/public/files/multiple-floors.png',
                question: 'How enjoyable was the overall atmosphere, especially at sunset or nighttime?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: ["Rooftop Bars"],
                order: 5,
            },
            {
                icon: this.hostAddress + '/public/files/multiple-floors.png',
                question: 'How convenient was the access to the rooftop area?',
                businessTypeID: ["Bars / Clubs"],
                businessSubtypeID: ["Rooftop Bars"],
                order: 6,
            },
            {
                icon: this.hostAddress + '/public/files/multiple-floors.png',
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
        const reviewQuestion = await Promise.all(
            reviewQuestions.map(async (question) => {
                const businessTypeID = await BusinessType.distinct('_id', { name: { $in: question.businessTypeID } }) as string[];
                const businessSubtypeID = await BusinessSubType.distinct('_id', { businessTypeID: { $in: businessTypeID }, name: { $in: question.businessSubtypeID } }) as string[];
                const businessReviewQuestion = await BusinessReviewQuestion.findOne({ businessTypeID: { $in: businessTypeID }, businessSubtypeID: { $in: businessSubtypeID }, question: question.question });
                if (!businessReviewQuestion) {
                    const businessReviewQuestion = new BusinessReviewQuestion();
                    businessReviewQuestion.question = question.question;
                    businessReviewQuestion.businessTypeID = businessTypeID;
                    businessReviewQuestion.businessSubtypeID = businessSubtypeID;
                    businessReviewQuestion.order = question.order;
                    await businessReviewQuestion.save();
                }
                return question;
            })
        )
        return reviewQuestion;
    }
}

export default ReviewQuestionSeeder;