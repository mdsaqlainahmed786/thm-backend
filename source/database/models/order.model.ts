import mongoose, { Schema, Types, Document, Model } from 'mongoose';
import { ObjectId } from 'mongoose';
import { Address, AddressSchema } from './common.model';
import moment from 'moment';
import { MongoID } from '../../common';
export interface DeliveryInstruction {
    instruction: string;
    remarks: string;
}
export enum OrderStatus {
    CREATED = "order-created",
    COMPLETED = "order-completed",
    FAILED = "order-failed"
}

// Active – The subscription is live, and the customer is receiving the service or product.
// Pending Activation – The subscription has been purchased but hasn't started yet.
// Renewal Pending – The subscription is close to its renewal date, and the system is preparing to renew it.
// Canceled – The subscription has been canceled either by the customer or the provider, and no future payments will occur.
// Suspended – The subscription is temporarily paused, usually due to payment or account issues.
// Expired – The subscription has ended, and no further services or products are being delivered unless renewed.
// Paused – The subscription is temporarily halted but will resume in the future.
// Failed – The subscription renewal or payment attempt was unsuccessful, often due to payment issues (insufficient funds, expired card, etc.).
// Payment Pending – The payment is in process, but it hasn't been confirmed or completed yet.
// Payment Declined – The payment was declined by the bank or payment processor, often due to issues like insufficient funds, expired card, or incorrect details.
// Retrying Payment – The system is attempting to process the payment again after a failure, often automatically.
// Blocked – The subscription has been blocked or restricted, usually due to fraud detection or violation of terms.
// Refunded – The subscription has been refunded, often due to cancellation or an issue with the service/product.
// Unpaid – The subscription has been marked as unpaid due to an issue with payment processing.

// Order Placed: The subscription order has been successfully submitted.

// Processing: The order is being processed, and the payment is being verified.

// Completed: The order has been successfully completed, and the subscription is active.

// Failed: The order was not successful due to payment issues or other errors.

// Canceled: The order was canceled by the user or the service provider before it was completed.

// Refunded: The order has been refunded after payment was processed.

// Awaiting Payment: The order is pending until payment is received.

// Renewal Order: This status indicates that a subscription is set to renew, and the payment is being processed for the renewal.

export interface PaymentDetail {
    transactionID: string;
    paymentMethod: string;
    transactionAmount: number;
}
export interface IBillingAddress {
    name: string;
    address: Address;
    dialCode: string;
    phoneNumber: string;
    gstn: string;
}


export interface IOrder extends Document {
    orderID: string;
    userID: MongoID;
    subscriptionPlanID: MongoID;
    razorPayOrderID: string;
    billingAddress: IBillingAddress,
    promoCode: string;
    promoCodeID: MongoID;
    subTotal: number;
    grandTotal: number;
    tax: number;
    status: OrderStatus;
    paymentDetail?: PaymentDetail;
    discount: number;
}

const PaymentDetailSchema: Schema = new Schema<PaymentDetail>(
    {
        transactionID: {
            type: String,
        },
        paymentMethod: {
            type: String,
        },
        transactionAmount: {
            type: Number,
        }
    },
    {
        _id: false,
    }
);
const DeliveryAddressSchema: Schema = new Schema<IBillingAddress>(
    {
        address: AddressSchema,
        name: {
            type: String
        },
        phoneNumber: {
            type: String,
        },
        dialCode: {
            type: String,
        },
        gstn: {
            type: String,
        }
    },
    {
        _id: false
    }
);


const OrderSchema: Schema = new Schema<IOrder>(
    {
        userID: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: "User"
        },
        orderID: {
            type: String,
            required: true,
            unique: true,
        },
        razorPayOrderID: {
            type: String,
            required: true,
            unique: true,
        },
        billingAddress: DeliveryAddressSchema,
        promoCode: {
            type: String,
            ref: "Coupon"
        },
        promoCodeID: {
            type: Schema.Types.ObjectId,
            ref: "Coupon"
        },
        subscriptionPlanID: {
            type: Schema.Types.ObjectId,
            ref: "Subscription"
        },
        subTotal: {
            type: Number,
            default: 0,
        },
        discount: {
            type: Number,
            default: 0,
        },
        tax: {
            type: Number,
            default: 0,
        },
        grandTotal: {
            type: Number,
            default: 0,
        },
        status: {
            type: String,
            enum: OrderStatus,
        },
        paymentDetail: PaymentDetailSchema,
    },
    {
        timestamps: true
    }
);
OrderSchema.set('toObject', { virtuals: true });
OrderSchema.set('toJSON', { virtuals: true });



export interface IOrderModel extends IOrder {
    createdAt: Date;
    updatedAt: Date;
}
const Order = mongoose.model<IOrderModel>('Order', OrderSchema);
export default Order;

export async function generateNextOrderID(): Promise<string> {
    let year = moment().get('year');
    let month = moment().get('month');
    let date = moment().get('date');
    let hour = moment().get('hour');
    let minute = moment().get('minute');
    let second = moment().get('second');
    let millisecond = moment().get('millisecond');
    let orderID = `${millisecond}${year}${date}${month}${minute}${second}${hour}`;
    const isAvailable = await Order.findOne({ orderID: orderID });
    if (!isAvailable) {
        return orderID;
    } else {
        return await generateNextOrderID();
    }
}

export function fetchCreatedOrder(orderID: MongoID) {
    return Order.findOne({ orderID: orderID, status: OrderStatus.CREATED });
}




