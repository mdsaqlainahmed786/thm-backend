import BusinessTypeModel from "../models/businessType.model";

export enum BusinessType {
    HOTEL = 'Hotel',
    BARS_CLUBS = 'Bars / Clubs',
    HOME_STAYS = 'Home Stays',
    MARRIAGE_BANQUETS = 'Marriage Banquets',
    RESTAURANT = 'Restaurant'
}

export const BusinessTypes = Object.values(BusinessType);
class BusinessTypeSeeder {
    hostAddress: string;
    constructor(hostAddress: string) {
        this.hostAddress = hostAddress;
    }
    async shouldRun() {
        const count = await BusinessTypeModel.countDocuments().exec();
        return count === 0;
    }
    async run() {
        const BusinessIcons = [
            this.hostAddress + '/public/files/hotel.png',
            this.hostAddress + '/public/files/bars-clubs.png',
            this.hostAddress + '/public/files/home-stay.png',
            this.hostAddress + '/public/files/marriage-banquets.png',
            this.hostAddress + '/public/files/restaurant.png'
        ]
        return await Promise.all(BusinessTypes.map(async (businessType, index) => {
            const isExits = await BusinessTypeModel.findOne({ name: businessType });
            if (!isExits) {
                const newBusinessType = new BusinessTypeModel({
                    icon: BusinessIcons[index],
                    name: businessType,
                });
                return await newBusinessType.save();
            }
            return isExits;
        }));
    }
}

export default BusinessTypeSeeder;