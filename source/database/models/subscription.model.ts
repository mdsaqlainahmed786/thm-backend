import { Schema, Document, model, Types } from "mongoose";

export interface ISubscription extends Document {
    businessProfileID: Types.ObjectId | string;
}
const SubscriptionSchema: Schema = new Schema<ISubscription>(
    {
        businessProfileID: {
            type: Schema.Types.ObjectId,
            ref: "BusinessProfile"
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