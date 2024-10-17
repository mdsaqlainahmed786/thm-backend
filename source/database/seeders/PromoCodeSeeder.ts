import PromoCode from "../models/promoCode.model";

const promoCodes = [
    {
        name: "Welcome 20",
        description: "Get 20% off your first purchase.",
        code: "WELCOME20",
        priceType: "percent",
        value: "20",
        cartValue: 20,
        quantity: -1,//unlimited
        validFrom: '2024-10-17',
        validTo: '2025-10-17',
        redeemedCount: 1,
        maxDiscount: 500
    },
    {
        name: "Save 150",
        description: "Save 150 on orders of 800 or more.",
        code: "SAVE150",
        priceType: "fixed",
        value: "150",
        cartValue: 800,
        quantity: -1,//unlimited
        validFrom: '2024-10-17',
        validTo: '2025-10-17',
        redeemedCount: 1,
        maxDiscount: 500
    }
];
class PromoCodeSeeder {
    async shouldRun() {
        const count = await PromoCode.countDocuments().exec();
        return count === 0;
    }
    async run() {
        return PromoCode.create(promoCodes);
    }
}

export default PromoCodeSeeder;