
import BusinessType from "../models/businessType.model";
import BusinessSubType from "../models/businessSubType.model";
import { BusinessTypes } from "./BusinessTypeSeeder";
export const Hotes = ['3 star', '4 star', '5 star'];
export const BarsClubs = ['Restro Bars', 'Microbreweries', 'Nightclubs', 'Lounge Bars', 'Rooftop Bars'];
export const HomeStays = ['Traditional', 'Luxury', 'Eco-Friendly', 'Adventure', 'Artistic'];
export const MarriageBanquets = ['Traditional Banquet Halls', 'Outdoor Gardens and Lawns', 'Luxury Hotel Ballrooms', 'Heritage Venues and Palaces', 'Beach side or Waterfront Venues'];
export const Restaurants = ['Vegetarian Restaurants', 'Non-Vegetarian Restaurants', 'Mixed Cuisine Restaurants', 'Seafood Restaurants', 'Barbecue (BBQ) Restaurants'];

class BusinessSubtypeSeeder {
    async shouldRun() {
        const count = await BusinessSubType.countDocuments().exec();
        return count === 0;
    }
    async run() {
        const businessTypes = await BusinessType.find({});
        const data = await Promise.all(businessTypes.map(async (businessType) => {
            //Hotel
            if (businessType.name === BusinessTypes[0]) {
                await Promise.all(Hotes.map(async (value) => {
                    const isExits = await BusinessSubType.findOne({ businessTypeID: businessType.id, name: value });
                    if (!isExits) {
                        const newBusinessSubType = new BusinessSubType();
                        newBusinessSubType.name = value;
                        newBusinessSubType.businessTypeID = businessType.id;
                        await newBusinessSubType.save();
                    }
                }));
            }
            //Bars / Clubs
            if (businessType.name === BusinessTypes[1]) {
                await Promise.all(BarsClubs.map(async (value) => {
                    const isExits = await BusinessSubType.findOne({ businessTypeID: businessType.id, name: value });
                    if (!isExits) {
                        const newBusinessSubType = new BusinessSubType();
                        newBusinessSubType.name = value;
                        newBusinessSubType.businessTypeID = businessType.id;
                        await newBusinessSubType.save();
                    }
                }));
            }
            //Home Stays
            if (businessType.name === BusinessTypes[2]) {
                await Promise.all(HomeStays.map(async (value) => {
                    const isExits = await BusinessSubType.findOne({ businessTypeID: businessType.id, name: value });
                    if (!isExits) {
                        const newBusinessSubType = new BusinessSubType();
                        newBusinessSubType.name = value;
                        newBusinessSubType.businessTypeID = businessType.id;
                        await newBusinessSubType.save();
                    }
                }));
            }
            //Marriage Banquets
            if (businessType.name === BusinessTypes[3]) {
                await Promise.all(MarriageBanquets.map(async (value) => {
                    const isExits = await BusinessSubType.findOne({ businessTypeID: businessType.id, name: value });
                    if (!isExits) {
                        const newBusinessSubType = new BusinessSubType();
                        newBusinessSubType.name = value;
                        newBusinessSubType.businessTypeID = businessType.id;
                        await newBusinessSubType.save();
                    }
                }));
            }
            //Restaurant
            if (businessType.name === BusinessTypes[4]) {
                await Promise.all(Restaurants.map(async (value) => {
                    const isExits = await BusinessSubType.findOne({ businessTypeID: businessType.id, name: value });
                    if (!isExits) {
                        const newBusinessSubType = new BusinessSubType();
                        newBusinessSubType.name = value;
                        newBusinessSubType.businessTypeID = businessType.id;
                        await newBusinessSubType.save();
                    }
                }))
            }
        }));
        console.log(businessTypes)
        return data;
    }
}

export default BusinessSubtypeSeeder;