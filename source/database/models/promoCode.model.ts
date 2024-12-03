
import mongoose, { Schema, Document, Model } from 'mongoose';
export enum PriceType {
    FIXED = "fixed",
    PERCENTAGE = "percent",
}
export enum PromoType {
    SUBSCRIPTION = 'subscription',
    BOOKING = 'booking'
}

export interface IPromoCode extends Document {
    name: string;
    description: string;
    code: string;
    priceType: string;
    value: number;
    cartValue: number;
    quantity: number;//An integer field to store the number of available coupons (defaults to 0).
    validFrom: Date;
    validTo: Date;
    redeemedCount: number;//How many time the coupon was used.
    maxDiscount: number; //Maximum Discount if price type in % 
    type: string;
}

export interface IPromoCodeModel extends Model<IPromoCode> {
}

const PromoCodeSchema: Schema<IPromoCode, IPromoCodeModel> = new Schema<IPromoCode, IPromoCodeModel>(
    {
        name: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            default: ""
        },
        code: {
            type: String,
            required: true,
            unique: true,
        },
        priceType: {
            type: String,
            required: true,
            enum: PriceType
        },
        value: {
            type: Number,
            default: 0
        },
        cartValue: {
            type: Number,
            default: 0
        },
        redeemedCount: {
            type: Number,
            default: 0
        },
        quantity: {
            type: Number,
            default: 0,
        },
        validFrom: {
            type: Date,
            default: Date.now,
        },
        validTo: {
            type: Date,
            default: Date.now,
        },
        maxDiscount: {
            type: Number,
            required: true,
        },
        type: {
            type: String,
            required: true,
            enum: PromoType
        }
    },
    {
        timestamps: true
    }
);

PromoCodeSchema.set('toObject', { virtuals: true });
PromoCodeSchema.set('toJSON', { virtuals: true });
const PromoCode = mongoose.model<IPromoCode, IPromoCodeModel>('PromoCode', PromoCodeSchema);
export default PromoCode;