
import BusinessType from "../models/businessType.model";


export const BusinessTypes = ['Hotel', 'Bars / Clubs', 'Home Stays', 'Marriage Banquets', 'Restaurant'];
class BusinessTypeSeeder {
    hostAddress: string;
    constructor(hostAddress: string) {
        this.hostAddress = hostAddress;
    }
    async shouldRun() {
        const count = await BusinessType.countDocuments().exec();
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
            const isExits = await BusinessType.findOne({ name: businessType });
            if (!isExits) {
                const newBusinessType = new BusinessType({
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