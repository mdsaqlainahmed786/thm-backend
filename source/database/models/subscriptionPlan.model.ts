import { Schema, Document, model, Types } from "mongoose";
import { AccountType } from "./user.model";
import { MongoID } from "../../common";
export enum SubscriptionLevel {
    BASIC = "basic",
    STANDARD = "standard",
    PREMIUM = "premium"
}
export enum SubscriptionDuration {
    MONTHLY = "monthly",
    QUARTERLY = "quarterly",
    YEARLY = "yearly",
    HALF_YEARLY = "half-yearly",
}
export interface IBusinessSubscription {
    businessTypeID: MongoID[];
    businessSubtypeID: MongoID[];
}

export enum CurrencyCode {
    INR = "INR"
}


export interface ISubscriptionPlan extends Document, IBusinessSubscription {
    name: string;
    description: string;
    price: number;
    currency: string;
    duration: SubscriptionDuration;// Duration in months, for example in days
    features: string[];
    level: SubscriptionLevel;
    image: string;
    type: AccountType;
    googleSubscriptionID: string;
    appleSubscriptionID: string;
}

//FIXME add google purchase id or apple purchase id;
const SubscriptionPlanSchema: Schema = new Schema<ISubscriptionPlan>(
    {
        name: { type: String, required: true },
        description: { type: String, required: true },
        price: { type: Number, required: true },
        currency: { type: String, required: true, enum: CurrencyCode },
        duration: { type: String, required: true },// Duration in months, for example
        features: [{ type: String, required: true }],
        // isPopular: { type: Boolean, default: false },
        level: {
            type: String,
            enum: SubscriptionLevel,//is premium or not
            required: true,
        },
        image: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            enum: AccountType,
            required: true,
        },
        businessSubtypeID: [
            {
                type: Schema.Types.ObjectId,
                ref: "BusinessSubType"
            }
        ],
        businessTypeID: [
            {
                type: Schema.Types.ObjectId,
                ref: "BusinessType"
            },
        ],
        googleSubscriptionID: { type: String, default: "" },
        appleSubscriptionID: { type: String, default: "" },
    },
    {
        timestamps: true
    }
);
SubscriptionPlanSchema.set('toObject', { virtuals: true });
SubscriptionPlanSchema.set('toJSON', { virtuals: true });

export interface ISubscriptionPlanModel extends ISubscriptionPlan {
}

const SubscriptionPlan = model<ISubscriptionPlan>('SubscriptionPlan', SubscriptionPlanSchema);
export default SubscriptionPlan;