import { Schema, Document, model, Types } from "mongoose";

export interface ISubscription extends Document {
    userID: Types.ObjectId | string;
    businessProfileID: Types.ObjectId | string;
    subscriptionPlanID: Types.ObjectId | string;
    expirationDate: Date;
}
const SubscriptionSchema: Schema = new Schema<ISubscription>(
    {
        userID: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        businessProfileID: {
            type: Schema.Types.ObjectId,
            ref: "BusinessProfile"
        },
        subscriptionPlanID: {
            type: Schema.Types.ObjectId,
            ref: "SubscriptionPlan"
        },
        expirationDate: {
            type: Date,
            required: true
        },
    },
    {
        timestamps: true
    }
);
SubscriptionSchema.set('toObject', { virtuals: true });
SubscriptionSchema.set('toJSON', { virtuals: true });

export interface ISubscriptionModel extends ISubscription {
}

const Subscription = model<ISubscription>('Subscription', SubscriptionSchema);
export default Subscription;