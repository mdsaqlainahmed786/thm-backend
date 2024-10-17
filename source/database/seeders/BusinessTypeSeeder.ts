
import BusinessType from "../models/businessType.model";


export const BusinessTypes = ['Hotel', 'Bars / Clubs', 'Home Stays', 'Marriage Banquets', 'Restaurant'];
const hostAddress = '';
export const BusinessIcons = [
    hostAddress + '/public/files/hotel.png',
    hostAddress + '/public/files/bars-clubs.png',
    hostAddress + '/public/files/home-stay.png',
    hostAddress + '/public/files/marriage-banquets.png',
    hostAddress + '/public/files/restaurant.png'
]
class BusinessTypeSeeder {
    async shouldRun() {
        const count = await BusinessType.countDocuments().exec();
        return count === 0;
    }
    async run() {
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