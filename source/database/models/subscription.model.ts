import { Schema, Document, model, Types } from "mongoose";
import { MongoID } from "../../common";
export interface ISubscription extends Document {
    userID: MongoID;
    businessProfileID: MongoID;
    subscriptionPlanID: MongoID;
    expirationDate: Date;
}
const SubscriptionSchema: Schema = new Schema<ISubscription>(
    {
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