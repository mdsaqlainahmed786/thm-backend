import { Schema, Document, model, Types } from "mongoose";
import { MongoID } from "../../common";
export interface ISubscription extends Document {
    orderID: MongoID;
    userID: MongoID;
    businessProfileID: MongoID;
    subscriptionPlanID: MongoID;
    expirationDate: Date;
    isCancelled: boolean;
}
const SubscriptionSchema: Schema = new Schema<ISubscription>(
    {
        isCancelled: {
            type: Boolean,
            default: false,
        },
        orderID: {
            type: Schema.Types.ObjectId,
            ref: "Order",
            required: true,
        },
        userID: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        businessProfileID: {
            type: Schema.Types.ObjectId,
            ref: "BusinessProfile",
        },
        subscriptionPlanID: {
            type: Schema.Types.ObjectId,
            ref: "SubscriptionPlan",
            required: true,
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